'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '@/lib/i18n/useLanguage';
import {
  Search,
  RefreshCw,
  Users,
  Mail,
  ShieldAlert,
  Copy,
  Check,
  Inbox,
  ChevronDown,
  MapPin,
  Package,
  RotateCcw,
  AlertTriangle,
  Download,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { AdminCustomer } from '@/app/api/admin/customers/route';

type RoleFilter = 'all' | 'customer' | 'admin';
type SegmentFilter = 'all' | AdminCustomer['segment'];
type SortKey = 'recent' | 'spend' | 'orders' | 'name';

const SEGMENT_STYLES: Record<
  AdminCustomer['segment'],
  { label: { en: string; fr: string }; className: string }
> = {
  subscriber: {
    label: { en: 'Subscriber', fr: 'Abonné' },
    className: 'bg-[#EAF2ED] text-[#2E5A44] border-[#C6DFD1]',
  },
  repeat: {
    label: { en: 'Repeat', fr: 'Fidèle' },
    className: 'bg-[#EEF2FA] text-[#3B5A85] border-[#CBD9EC]',
  },
  one_time: {
    label: { en: 'One-time', fr: 'Ponctuel' },
    className: 'bg-[#FEF6E7] text-[#8A5C29] border-[#F0D9A8]',
  },
  registered_no_orders: {
    label: { en: 'No orders', fr: 'Sans commande' },
    className: 'bg-[#F5F0E4] text-[#6B7280] border-[#E5E2D9]',
  },
};

/** Small label/value stack used inside the expanded customer row. */
function DetailBlock({ label, rows }: { label: string; rows: Array<[string, string]> }) {
  return (
    <div className="space-y-2">
      <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#9CA3AF]">{label}</div>
      <dl className="space-y-1">
        {rows.map(([key, value]) => (
          <div key={key} className="flex items-baseline justify-between gap-3">
            <dt className="text-[11px] text-[#6B7280]">{key}</dt>
            <dd className="text-[11px] font-semibold text-[#111827] font-mono truncate max-w-[55%] text-right">
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function AdminCustomersOverview() {
  const { language, t } = useLanguage();
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [segmentFilter, setSegmentFilter] = useState<SegmentFilter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('spend');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  const isEn = language === 'en';

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/customers');
      const data = await res.json();
      if (data.success && Array.isArray(data.customers)) {
        setCustomers(data.customers);
      } else {
        toast.error(data.error || t.toasts.errorOccurred);
      }
    } catch (err) {
      console.error('Failed to fetch customers:', err);
      toast.error(t.toasts.errorOccurred);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleCopyEmail = async (email: string) => {
    try {
      await navigator.clipboard.writeText(email);
      setCopiedEmail(email);
      toast.success(isEn ? 'Email copied' : 'Email copié', { description: email });
      setTimeout(() => setCopiedEmail((current) => (current === email ? null : current)), 1800);
    } catch {
      toast.error(isEn ? 'Could not copy email' : 'Copie impossible');
    }
  };

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const rows = customers.filter((customer) => {
      if (roleFilter !== 'all' && customer.role !== roleFilter) return false;
      if (segmentFilter !== 'all' && customer.segment !== segmentFilter) return false;
      if (!q) return true;
      return (
        customer.email?.toLowerCase().includes(q) ||
        customer.fullName?.toLowerCase().includes(q) ||
        customer.city?.toLowerCase().includes(q) ||
        customer.purchasedProducts.some((p) => p.toLowerCase().includes(q)) ||
        customer.id.toLowerCase().includes(q)
      );
    });

    return [...rows].sort((a, b) => {
      if (sortKey === 'spend') return b.lifetimeSpend - a.lifetimeSpend;
      if (sortKey === 'orders') return b.orderCount - a.orderCount;
      if (sortKey === 'name') {
        return (a.fullName || a.email || '').localeCompare(b.fullName || b.email || '');
      }
      // 'recent' — newest signup first, undated accounts last.
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    });
  }, [customers, searchQuery, roleFilter, segmentFilter, sortKey]);

  /** Exports the current filtered view so the list can be worked outside the app. */
  const handleExportCsv = () => {
    if (filtered.length === 0) {
      toast.error(isEn ? 'Nothing to export' : 'Rien à exporter');
      return;
    }

    const headers = [
      'Name', 'Email', 'Role', 'Segment', 'Joined', 'Orders', 'Lifetime Spend',
      'Avg Order Value', 'Active Subs', 'MRR', 'Last Order', 'City', 'Country',
    ];
    // Quote every cell and escape embedded quotes so commas in names stay intact.
    const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const rows = filtered.map((c) =>
      [
        c.fullName, c.email, c.role, c.segment, c.createdAt, c.orderCount,
        c.lifetimeSpend.toFixed(2), c.averageOrderValue.toFixed(2), c.activeSubscriptions,
        c.monthlyRecurring.toFixed(2), c.lastOrderAt, c.city, c.country,
      ].map(escape).join(',')
    );

    const blob = new Blob([[headers.map(escape).join(','), ...rows].join('\n')], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `true-formula-customers-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(isEn ? `Exported ${filtered.length} accounts` : `${filtered.length} comptes exportés`);
  };

  const totals = useMemo(
    () => ({
      accounts: customers.length,
      subscribers: customers.filter((c) => c.activeSubscriptions > 0).length,
      purchasers: customers.filter((c) => c.orderCount > 0).length,
      revenue: customers.reduce((sum, c) => sum + c.lifetimeSpend, 0),
    }),
    [customers]
  );

  const money = (value: number) =>
    value.toLocaleString(isEn ? 'en-US' : 'fr-FR', { style: 'currency', currency: 'USD' });

  const formatDate = (value: string | null) =>
    value
      ? new Date(value).toLocaleDateString(isEn ? 'en-US' : 'fr-FR', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
      : '—';

  const summaryTiles = [
    { label: isEn ? 'Registered Accounts' : 'Comptes Inscrits', value: String(totals.accounts) },
    { label: isEn ? 'Have Ordered' : 'Ont Commandé', value: String(totals.purchasers) },
    { label: isEn ? 'Active Subscribers' : 'Abonnés Actifs', value: String(totals.subscribers) },
    { label: isEn ? 'Settled Lifetime Value' : 'Valeur Vie Réglée', value: money(totals.revenue) },
  ];

  return (
    <div className="space-y-4">
      {/* Summary tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryTiles.map((tile) => (
          <div
            key={tile.label}
            className="bg-white border border-[#E5E2D9] rounded-2xl p-4 shadow-luxe-card"
          >
            <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#9CA3AF]">
              {tile.label}
            </div>
            {isLoading ? (
              <div className="h-6 w-16 bg-[#F5F0E4] rounded mt-2.5 animate-pulse" />
            ) : (
              <div className="font-mono text-lg font-bold text-[#111827] mt-2 tabular-nums">
                {tile.value}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 border border-[#E5E2D9] rounded-2xl shadow-luxe-card">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isEn ? 'Search by name, email, or ID…' : 'Rechercher par nom, email ou ID…'}
            className="w-full pl-10 pr-4 py-2.5 bg-[#FDFBF7] border border-[#E5E2D9] rounded-full text-xs font-sans placeholder:text-[#9CA3AF] focus:ring-2 focus:ring-[#2E5A44]/30 focus:border-[#2E5A44] outline-none transition-all"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-center">
          <select
            value={segmentFilter}
            onChange={(e) => setSegmentFilter(e.target.value as SegmentFilter)}
            className="bg-[#FDFBF7] border border-[#E5E2D9] text-xs font-semibold text-[#111827] rounded-full px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#2E5A44]/30 cursor-pointer"
          >
            <option value="all">{isEn ? 'All Segments' : 'Tous les Segments'}</option>
            <option value="subscriber">{isEn ? 'Subscribers' : 'Abonnés'}</option>
            <option value="repeat">{isEn ? 'Repeat Buyers' : 'Clients Fidèles'}</option>
            <option value="one_time">{isEn ? 'One-time Buyers' : 'Achat Unique'}</option>
            <option value="registered_no_orders">{isEn ? 'Never Ordered' : 'Sans Commande'}</option>
          </select>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
            className="bg-[#FDFBF7] border border-[#E5E2D9] text-xs font-semibold text-[#111827] rounded-full px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#2E5A44]/30 cursor-pointer"
          >
            <option value="all">{isEn ? 'All Roles' : 'Tous les Rôles'}</option>
            <option value="customer">{isEn ? 'Customers' : 'Clients'}</option>
            <option value="admin">{isEn ? 'Admins' : 'Administrateurs'}</option>
          </select>

          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="bg-[#FDFBF7] border border-[#E5E2D9] text-xs font-semibold text-[#111827] rounded-full px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#2E5A44]/30 cursor-pointer"
          >
            <option value="spend">{isEn ? 'Top Spend' : 'Dépenses'}</option>
            <option value="orders">{isEn ? 'Most Orders' : 'Commandes'}</option>
            <option value="recent">{isEn ? 'Newest' : 'Récents'}</option>
            <option value="name">{isEn ? 'Name A–Z' : 'Nom A–Z'}</option>
          </select>

          <span className="text-xs text-[#6B7280] font-medium whitespace-nowrap">
            <strong className="text-[#111827] font-mono font-bold">{filtered.length}</strong>{' '}
            {isEn ? 'accounts' : 'comptes'}
          </span>

          <button
            onClick={handleExportCsv}
            title={isEn ? 'Export as CSV' : 'Exporter en CSV'}
            className="p-2 rounded-full border border-[#E5E2D9] text-[#2E5A44] hover:bg-[#EAF2ED] hover:border-[#2E5A44] transition-all cursor-pointer focus-luxe"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={fetchCustomers}
            aria-label="Refresh customers"
            className="p-2 rounded-full border border-[#E5E2D9] text-[#2E5A44] hover:bg-[#EAF2ED] hover:border-[#2E5A44] transition-all cursor-pointer focus-luxe"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#E5E2D9] rounded-2xl overflow-hidden shadow-luxe-card">
        {isLoading ? (
          <div className="py-16 text-center text-[#6B7280] font-sans text-xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-3 text-[#2E5A44]" />
            <span>{isEn ? 'Loading customer accounts…' : 'Chargement des comptes…'}</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <Inbox className="w-7 h-7 text-[#C6DFD1] mx-auto" />
            <p className="font-serif text-lg font-bold text-[#111827]">
              {isEn ? 'No accounts match this filter.' : 'Aucun compte ne correspond.'}
            </p>
            {(searchQuery || roleFilter !== 'all' || segmentFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setRoleFilter('all');
                  setSegmentFilter('all');
                }}
                className="text-xs font-semibold text-[#2E5A44] hover:underline focus-luxe rounded"
              >
                {t.catalog.resetFilters}
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F5F0E4]/60 border-b border-[#E5E2D9] text-[10px] font-bold text-[#6B7280] uppercase tracking-[0.14em]">
                  <th className="py-3.5 px-5">{isEn ? 'Customer' : 'Client'}</th>
                  <th className="py-3.5 px-5">{isEn ? 'Joined' : 'Inscrit le'}</th>
                  <th className="py-3.5 px-5 text-right">{isEn ? 'Orders' : 'Commandes'}</th>
                  <th className="py-3.5 px-5 text-right">{isEn ? 'Lifetime Spend' : 'Dépenses'}</th>
                  <th className="py-3.5 px-5 text-right">{isEn ? 'Subs / MRR' : 'Abos / MRR'}</th>
                  <th className="py-3.5 px-5">{isEn ? 'Last Order' : 'Dernière Commande'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAF2ED] text-xs font-sans">
                {filtered.map((customer) => {
                  const isExpanded = expandedId === customer.id;
                  const segment = SEGMENT_STYLES[customer.segment];

                  return (
                    <React.Fragment key={customer.id}>
                      <tr
                        onClick={() => setExpandedId(isExpanded ? null : customer.id)}
                        className={cn(
                          'cursor-pointer transition-colors',
                          isExpanded ? 'bg-[#FDFBF7]' : 'hover:bg-[#FDFBF7]'
                        )}
                      >
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <ChevronDown
                              className={cn(
                                'w-3.5 h-3.5 shrink-0 text-[#9CA3AF] transition-transform',
                                isExpanded && 'rotate-180 text-[#2E5A44]'
                              )}
                            />

                            <div className="w-9 h-9 rounded-full bg-[#EAF2ED] text-[#2E5A44] font-bold text-[11px] flex items-center justify-center border border-[#C6DFD1] shrink-0 uppercase">
                              {(customer.fullName || customer.email || '?')[0]}
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-[#111827] truncate">
                                  {customer.fullName || (isEn ? 'Unnamed member' : 'Membre sans nom')}
                                </span>
                                <span
                                  className={cn(
                                    'text-[9px] font-bold uppercase border px-1.5 py-0.5 rounded',
                                    segment.className
                                  )}
                                >
                                  {isEn ? segment.label.en : segment.label.fr}
                                </span>
                                {customer.role === 'admin' && (
                                  <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase bg-[#FEF6E7] text-[#8A5C29] border border-[#F0D9A8] px-1.5 py-0.5 rounded">
                                    <ShieldAlert className="w-2.5 h-2.5" />
                                    Admin
                                  </span>
                                )}
                              </div>

                              {/* The real account email, straight from `profiles` — the
                                  table used to render the raw user UUID here. */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopyEmail(customer.email);
                                }}
                                title={isEn ? 'Copy email' : 'Copier l’email'}
                                className="group mt-0.5 flex items-center gap-1.5 text-[10px] text-[#6B7280] font-mono hover:text-[#2E5A44] transition-colors cursor-pointer focus-luxe rounded"
                              >
                                <Mail className="w-3 h-3 shrink-0" />
                                <span className="truncate max-w-[200px]">{customer.email}</span>
                                {copiedEmail === customer.email ? (
                                  <Check className="w-3 h-3 text-[#2E5A44]" />
                                ) : (
                                  <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                )}
                              </button>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-5 text-[#6B7280] whitespace-nowrap">
                          {formatDate(customer.createdAt)}
                        </td>

                        <td className="py-4 px-5 text-right font-mono tabular-nums">
                          <span className="font-bold text-[#111827]">{customer.orderCount}</span>
                          {customer.pendingOrders > 0 && (
                            <span className="ml-1.5 text-[10px] text-[#8A5C29]">
                              ({customer.pendingOrders} {isEn ? 'pending' : 'en attente'})
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-5 text-right font-mono tabular-nums whitespace-nowrap">
                          <div className="font-bold text-[#111827]">{money(customer.lifetimeSpend)}</div>
                          {customer.averageOrderValue > 0 && (
                            <div className="text-[10px] text-[#9CA3AF]">
                              {isEn ? 'avg' : 'moy'} {money(customer.averageOrderValue)}
                            </div>
                          )}
                        </td>

                        <td className="py-4 px-5 text-right font-mono tabular-nums whitespace-nowrap">
                          {customer.activeSubscriptions > 0 ? (
                            <span className="text-[#2E5A44] font-bold">
                              {customer.activeSubscriptions} · {money(customer.monthlyRecurring)}
                            </span>
                          ) : (
                            <span className="text-[#9CA3AF]">—</span>
                          )}
                        </td>

                        <td className="py-4 px-5 text-[#6B7280] whitespace-nowrap">
                          {formatDate(customer.lastOrderAt)}
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="bg-[#FDFBF7]">
                          <td colSpan={6} className="px-5 pb-5 pt-0">
                            <div className="rounded-2xl border border-[#E5E2D9] bg-white p-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                              <DetailBlock
                                label={isEn ? 'Account' : 'Compte'}
                                rows={[
                                  [isEn ? 'Account ID' : 'ID du compte', customer.id],
                                  [isEn ? 'Role' : 'Rôle', customer.role],
                                  [isEn ? 'First order' : 'Première commande', formatDate(customer.firstOrderAt)],
                                ]}
                              />

                              <DetailBlock
                                label={isEn ? 'Order health' : 'État des commandes'}
                                rows={[
                                  [isEn ? 'Total orders' : 'Commandes', String(customer.orderCount)],
                                  [isEn ? 'Pending' : 'En attente', String(customer.pendingOrders)],
                                  [isEn ? 'Failed' : 'Échouées', String(customer.failedOrders)],
                                ]}
                              />

                              <DetailBlock
                                label={isEn ? 'Subscriptions' : 'Abonnements'}
                                rows={[
                                  [isEn ? 'Active' : 'Actifs', String(customer.activeSubscriptions)],
                                  [isEn ? 'Paused' : 'En pause', String(customer.pausedSubscriptions)],
                                  [isEn ? 'Cancelled' : 'Annulés', String(customer.cancelledSubscriptions)],
                                ]}
                              />

                              <div className="space-y-2">
                                <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#9CA3AF]">
                                  {isEn ? 'Shipping & products' : 'Livraison & produits'}
                                </div>

                                <div className="flex items-center gap-1.5 text-[11px] text-[#4B5563]">
                                  <MapPin className="w-3 h-3 shrink-0 text-[#2E5A44]" />
                                  {customer.city || customer.country
                                    ? [customer.city, customer.country].filter(Boolean).join(', ')
                                    : isEn
                                    ? 'No address on file'
                                    : 'Aucune adresse'}
                                </div>

                                {customer.purchasedProducts.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {customer.purchasedProducts.map((product) => (
                                      <span
                                        key={product}
                                        className="inline-flex items-center gap-1 text-[10px] bg-[#EAF2ED] text-[#2E5A44] px-2 py-0.5 rounded-full"
                                      >
                                        <Package className="w-2.5 h-2.5" />
                                        {product}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-[11px] text-[#9CA3AF] italic">
                                    {isEn ? 'Has not purchased yet.' : 'Aucun achat pour le moment.'}
                                  </p>
                                )}

                                <div className="flex flex-wrap gap-2 pt-1">
                                  <a
                                    href={`mailto:${customer.email}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#C6DFD1] bg-white px-2.5 py-1 text-[10px] font-bold text-[#2E5A44] hover:bg-[#EAF2ED]"
                                  >
                                    <Mail className="w-3 h-3" />
                                    {isEn ? 'Email customer' : 'Contacter'}
                                  </a>
                                  {customer.failedOrders > 0 && (
                                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#F2C9C9] bg-[#FDECEC] px-2.5 py-1 text-[10px] font-bold text-[#9A3A3A]">
                                      <AlertTriangle className="w-3 h-3" />
                                      {customer.failedOrders} {isEn ? 'failed' : 'échouées'}
                                    </span>
                                  )}
                                  {customer.pausedSubscriptions > 0 && (
                                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#F0D9A8] bg-[#FEF6E7] px-2.5 py-1 text-[10px] font-bold text-[#8A5C29]">
                                      <RotateCcw className="w-3 h-3" />
                                      {customer.pausedSubscriptions} {isEn ? 'paused' : 'en pause'}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="flex items-center gap-2 text-[11px] text-[#9CA3AF] px-1">
        <Users className="w-3.5 h-3.5 shrink-0" />
        {isEn
          ? 'Every figure is computed from live profile, order, and subscription rows.'
          : 'Chaque chiffre est calculé à partir des profils, commandes et abonnements réels.'}
      </p>
    </div>
  );
}
