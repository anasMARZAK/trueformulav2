'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n/useLanguage';
import { type Subscription } from '@/lib/db/schema';
import { Search, RefreshCw, Inbox, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { useConfirm } from '@/components/ui/confirm-dialog';

interface EnrichedSub extends Subscription {
  productNameEn?: string;
  productNameFr?: string;
  /** Resolved from `profiles` by the API, not the raw user_id. */
  userEmail?: string | null;
  userName?: string | null;
  isRegistered?: boolean;
}

type StatusFilter = 'all' | 'active' | 'paused' | 'cancelled';

const STATUS_BADGE: Record<string, string> = {
  active: 'bg-[#EAF2ED] text-[#2E5A44] border-[#C6DFD1]',
  paused: 'bg-[#FEF6E7] text-[#8A5C29] border-[#F0D9A8]',
  cancelled: 'bg-[#F5F0E4] text-[#6B7280] border-[#E5E2D9]',
};

export function AdminSubsOverview() {
  const { language, t } = useLanguage();
  const confirm = useConfirm();
  const [subscriptions, setSubscriptions] = useState<EnrichedSub[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [isLoading, setIsLoading] = useState(true);

  const fetchSubscriptions = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/subscriptions');
      const data = await res.json();
      if (data.success && Array.isArray(data.subscriptions)) {
        setSubscriptions(data.subscriptions);
      }
    } catch (err) {
      console.error('Failed to fetch subscriptions:', err);
      toast.error(t.toasts.errorOccurred);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: 'active' | 'paused' | 'cancelled') => {
    // Cancelling is not reversible from this table, so confirm it first.
    if (newStatus === 'cancelled') {
      const confirmed = await confirm({
        title: t.portal.confirmCancelTitle,
        description:
          language === 'fr'
            ? 'Cet abonnement client sera définitivement annulé et cessera de se renouveler. Le membre perdra sa remise de 20%.'
            : 'This customer subscription will be cancelled and will stop renewing. The member loses their 20% recurring discount.',
        confirmLabel: language === 'fr' ? 'Annuler l’abonnement' : 'Cancel Subscription',
        cancelLabel: language === 'fr' ? 'Conserver' : 'Keep Active',
        intent: 'danger',
      });
      if (!confirmed) return;
    }

    try {
      const res = await fetch(`/api/subscriptions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setSubscriptions((prev) =>
          prev.map((sub) => (sub.id === id ? { ...sub, status: newStatus, updatedAt: new Date() } : sub))
        );
        toast.success(`Subscription updated to ${newStatus}`);
      } else {
        toast.error('Failed to update subscription', { description: data.error });
      }
    } catch (err: any) {
      toast.error('Update Error', { description: err.message });
    }
  };

  const filteredSubs = subscriptions.filter((sub) => {
    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return matchesStatus;
    const email = (sub.userEmail || (sub.shippingAddress as any)?.email || '').toLowerCase();
    const name = (sub.userName || '').toLowerCase();
    const prodName = (sub.productNameEn || sub.productId || '').toLowerCase();
    return (
      matchesStatus &&
      (email.includes(q) || name.includes(q) || prodName.includes(q) || sub.id.toLowerCase().includes(q))
    );
  });

  const isEn = language === 'en';

  const filters: Array<{ key: StatusFilter; label: string }> = [
    { key: 'all', label: t.admin.subscriptions.filterAll },
    { key: 'active', label: t.admin.subscriptions.filterActive },
    { key: 'paused', label: t.admin.subscriptions.filterPaused },
    { key: 'cancelled', label: t.admin.subscriptions.filterCancelled },
  ];

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-center gap-4 bg-white p-4 border border-[#E5E2D9] rounded-2xl shadow-luxe-card">
        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.admin.subscriptions.searchPlaceholder}
            className="w-full pl-10 pr-4 py-2.5 bg-[#FDFBF7] border border-[#E5E2D9] rounded-full text-xs font-sans placeholder:text-[#9CA3AF] focus:ring-2 focus:ring-[#2E5A44]/30 focus:border-[#2E5A44] outline-none transition-all"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-center">
          <div className="flex items-center gap-1 bg-[#F5F0E4]/70 p-1 rounded-full border border-[#E5E2D9] text-[11px] font-bold">
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                aria-pressed={statusFilter === f.key}
                className={`px-3 py-1.5 rounded-full transition-all cursor-pointer focus-luxe whitespace-nowrap ${
                  statusFilter === f.key
                    ? 'bg-[#2E5A44] text-white shadow-sm'
                    : 'text-[#6B7280] hover:text-[#111827]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <button
            onClick={fetchSubscriptions}
            aria-label="Refresh subscriptions"
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
            <span>{t.admin.subscriptions.loadingSubs}</span>
          </div>
        ) : filteredSubs.length === 0 ? (
          <div className="py-16 text-center">
            <Inbox className="w-7 h-7 text-[#C6DFD1] mx-auto mb-3" />
            <p className="font-serif text-lg font-bold text-[#111827]">
              {t.admin.subscriptions.noSubsFound}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F5F0E4]/60 border-b border-[#E5E2D9] text-[10px] font-bold text-[#6B7280] uppercase tracking-[0.14em]">
                  <th className="py-3.5 px-5">{t.admin.subscriptions.subIdHeader}</th>
                  <th className="py-3.5 px-5">{t.admin.subscriptions.user}</th>
                  <th className="py-3.5 px-5">{t.admin.subscriptions.product}</th>
                  <th className="py-3.5 px-5">{t.admin.subscriptions.billingDate}</th>
                  <th className="py-3.5 px-5 text-right">{t.admin.subscriptions.amount}</th>
                  <th className="py-3.5 px-5">{t.admin.subscriptions.status}</th>
                  <th className="py-3.5 px-5 text-right">{t.admin.subscriptions.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAF2ED] text-xs font-sans">
                {filteredSubs.map((sub) => {
                  // The API resolves this against `profiles`. The raw user_id is
                  // never shown — it was the visible value here before.
                  const customerEmail = sub.userEmail || (sub.shippingAddress as any)?.email || null;
                  const customerName = sub.userName ?? null;
                  const prodName = isEn
                    ? sub.productNameEn || sub.productId
                    : sub.productNameFr || sub.productId;

                  const formattedBillingDate = new Date(sub.nextBillingDate).toLocaleDateString(
                    isEn ? 'en-US' : 'fr-FR',
                    { year: 'numeric', month: 'short', day: 'numeric' }
                  );

                  return (
                    <tr key={sub.id} className="hover:bg-[#FDFBF7] transition-colors">
                      <td className="py-4 px-5 font-mono font-bold text-[#2E5A44] whitespace-nowrap">
                        {sub.id.slice(0, 8)}
                      </td>

                      <td className="py-4 px-5">
                        {customerName && (
                          <div className="font-semibold text-[#111827] truncate max-w-[200px]">
                            {customerName}
                          </div>
                        )}
                        {customerEmail ? (
                          <a
                            href={`mailto:${customerEmail}`}
                            className="text-[10px] text-[#6B7280] font-mono truncate max-w-[200px] inline-flex items-center gap-1 hover:text-[#2E5A44] hover:underline"
                          >
                            <Mail className="w-2.5 h-2.5 shrink-0" />
                            {customerEmail}
                          </a>
                        ) : (
                          <span className="text-[10px] text-[#C4C0B6] italic">
                            {isEn ? 'no account linked' : 'aucun compte lié'}
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-5 font-semibold text-[#111827]">
                        {prodName}
                        {(sub.selectedFlavor || sub.selectedSize) && (
                          <div className="text-[10px] text-[#9CA3AF] font-normal mt-0.5">
                            {[sub.selectedFlavor, sub.selectedSize].filter(Boolean).join(' · ')}
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-5 font-mono text-[#6B7280] whitespace-nowrap">
                        {formattedBillingDate}
                      </td>

                      <td className="py-4 px-5 font-mono font-bold text-[#111827] text-right tabular-nums whitespace-nowrap">
                        ${parseFloat(String(sub.pricePerBilling || '0')).toFixed(2)}
                      </td>

                      <td className="py-4 px-5">
                        <span
                          className={`inline-block text-[10px] uppercase font-bold tracking-wide px-2.5 py-1 rounded-full border ${
                            STATUS_BADGE[sub.status] || STATUS_BADGE.cancelled
                          }`}
                        >
                          {t.portal.status[sub.status] || sub.status}
                        </span>
                      </td>

                      <td className="py-4 px-5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          {sub.status === 'active' && (
                            <button
                              onClick={() => handleUpdateStatus(sub.id, 'paused')}
                              className="px-2.5 py-1.5 bg-[#FEF6E7] hover:bg-[#FBEBCF] text-[#8A5C29] rounded-full text-[10px] font-bold border border-[#F0D9A8] transition-colors cursor-pointer focus-luxe"
                            >
                              {t.portal.pauseSub}
                            </button>
                          )}
                          {sub.status === 'paused' && (
                            <button
                              onClick={() => handleUpdateStatus(sub.id, 'active')}
                              className="px-2.5 py-1.5 bg-[#EAF2ED] hover:bg-[#DDF0E5] text-[#2E5A44] rounded-full text-[10px] font-bold border border-[#C6DFD1] transition-colors cursor-pointer focus-luxe"
                            >
                              {t.portal.resumeSub}
                            </button>
                          )}
                          {sub.status !== 'cancelled' && (
                            <button
                              onClick={() => handleUpdateStatus(sub.id, 'cancelled')}
                              className="px-2.5 py-1.5 bg-white hover:bg-[#FDECEC] text-[#9A3A3A] rounded-full text-[10px] font-bold border border-[#F2C9C9] transition-colors cursor-pointer focus-luxe"
                            >
                              {t.portal.cancelSub}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
