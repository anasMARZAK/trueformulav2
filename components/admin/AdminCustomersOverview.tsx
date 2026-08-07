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
} from 'lucide-react';
import { toast } from 'sonner';
import type { AdminCustomer } from '@/app/api/admin/customers/route';

type RoleFilter = 'all' | 'customer' | 'admin';

export function AdminCustomersOverview() {
  const { language, t } = useLanguage();
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
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
    return customers.filter((customer) => {
      if (roleFilter !== 'all' && customer.role !== roleFilter) return false;
      if (!q) return true;
      return (
        customer.email?.toLowerCase().includes(q) ||
        customer.fullName?.toLowerCase().includes(q) ||
        customer.id.toLowerCase().includes(q)
      );
    });
  }, [customers, searchQuery, roleFilter]);

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

        <div className="flex items-center gap-3">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
            className="bg-[#FDFBF7] border border-[#E5E2D9] text-xs font-semibold text-[#111827] rounded-full px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#2E5A44]/30 cursor-pointer"
          >
            <option value="all">{isEn ? 'All Roles' : 'Tous les Rôles'}</option>
            <option value="customer">{isEn ? 'Customers' : 'Clients'}</option>
            <option value="admin">{isEn ? 'Admins' : 'Administrateurs'}</option>
          </select>

          <span className="text-xs text-[#6B7280] font-medium whitespace-nowrap">
            <strong className="text-[#111827] font-mono font-bold">{filtered.length}</strong>{' '}
            {isEn ? 'accounts' : 'comptes'}
          </span>

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
            {(searchQuery || roleFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setRoleFilter('all');
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
                {filtered.map((customer) => (
                  <tr key={customer.id} className="hover:bg-[#FDFBF7] transition-colors">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#EAF2ED] text-[#2E5A44] font-bold text-[11px] flex items-center justify-center border border-[#C6DFD1] shrink-0 uppercase">
                          {(customer.fullName || customer.email || '?')[0]}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-[#111827] truncate">
                              {customer.fullName || (isEn ? 'Unnamed member' : 'Membre sans nom')}
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
                            onClick={() => handleCopyEmail(customer.email)}
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

                    <td className="py-4 px-5 text-right font-mono font-bold text-[#111827] tabular-nums whitespace-nowrap">
                      {money(customer.lifetimeSpend)}
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
                ))}
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
