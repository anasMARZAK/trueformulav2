'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n/useLanguage';
import { type Subscription } from '@/lib/db/schema';
import { Search, RefreshCw, Filter, Pause, Play, XCircle, CreditCard, Calendar, UserCheck } from 'lucide-react';
import { toast } from 'sonner';

interface EnrichedSub extends Subscription {
  productNameEn?: string;
  productNameFr?: string;
  userEmail?: string;
}

export function AdminSubsOverview() {
  const { language, t } = useLanguage();
  const [subscriptions, setSubscriptions] = useState<EnrichedSub[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused' | 'cancelled'>('all');
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
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: 'active' | 'paused' | 'cancelled') => {
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
    const q = searchQuery.toLowerCase();
    const email = (sub.userEmail || (sub.shippingAddress as any)?.email || sub.userId || '').toLowerCase();
    const prodName = (sub.productNameEn || sub.productId || '').toLowerCase();

    const matchesSearch = email.includes(q) || prodName.includes(q) || sub.id.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const isEn = language === 'en';

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 border border-[#C6DFD1] rounded-3xl shadow-sm">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.admin.subscriptions.searchPlaceholder}
            className="w-full pl-9 pr-4 py-2 bg-[#FDFBF7] border border-[#C6DFD1] rounded-full text-xs font-sans focus:ring-2 focus:ring-[#2E5A44]/30 outline-none"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center space-x-1 bg-[#EAF2ED] p-1 rounded-full border border-[#C6DFD1] text-xs font-semibold">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 rounded-full transition-all ${
              statusFilter === 'all' ? 'bg-[#2E5A44] text-white shadow-xs' : 'text-gray-600 hover:text-[#111827]'
            }`}
          >
            {t.admin.subscriptions.filterAll}
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1 rounded-full transition-all ${
              statusFilter === 'active' ? 'bg-emerald-600 text-white shadow-xs' : 'text-gray-600 hover:text-[#111827]'
            }`}
          >
            {t.admin.subscriptions.filterActive}
          </button>
          <button
            onClick={() => setStatusFilter('paused')}
            className={`px-3 py-1 rounded-full transition-all ${
              statusFilter === 'paused' ? 'bg-amber-600 text-white shadow-xs' : 'text-gray-600 hover:text-[#111827]'
            }`}
          >
            {t.admin.subscriptions.filterPaused}
          </button>
          <button
            onClick={() => setStatusFilter('cancelled')}
            className={`px-3 py-1 rounded-full transition-all ${
              statusFilter === 'cancelled' ? 'bg-red-600 text-white shadow-xs' : 'text-gray-600 hover:text-[#111827]'
            }`}
          >
            {t.admin.subscriptions.filterCancelled}
          </button>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-white border border-[#C6DFD1] rounded-3xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="py-12 text-center text-gray-500 font-sans text-xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#2E5A44]" />
            <span>{t.admin.subscriptions.loadingSubs}</span>
          </div>
        ) : filteredSubs.length === 0 ? (
          <div className="py-12 text-center text-gray-500 font-sans text-xs">
            <p className="font-bold text-gray-700">{t.admin.subscriptions.noSubsFound}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#EAF2ED]/60 border-b border-[#C6DFD1] text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                  <th className="py-4 px-6">{t.admin.subscriptions.subIdHeader}</th>
                  <th className="py-4 px-6">{t.admin.subscriptions.user}</th>
                  <th className="py-4 px-6">{t.admin.subscriptions.product}</th>
                  <th className="py-4 px-6">{t.admin.subscriptions.billingDate}</th>
                  <th className="py-4 px-6">{t.admin.subscriptions.amount}</th>
                  <th className="py-4 px-6">{t.admin.subscriptions.status}</th>
                  <th className="py-4 px-6 text-right">{t.admin.subscriptions.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs font-sans">
                {filteredSubs.map((sub) => {
                  const customerEmail =
                    (sub.shippingAddress as any)?.email || sub.userEmail || sub.userId || 'customer@example.com';
                  const prodName = isEn
                    ? sub.productNameEn || sub.productId
                    : sub.productNameFr || sub.productId;

                  const formattedBillingDate = new Date(sub.nextBillingDate).toLocaleDateString(
                    isEn ? 'en-US' : 'fr-FR',
                    { year: 'numeric', month: 'short', day: 'numeric' }
                  );

                  return (
                    <tr key={sub.id} className="hover:bg-[#FDFBF7]/80 transition-colors">
                      <td className="py-4 px-6 font-mono font-bold text-[#2E5A44]">
                        {sub.id}
                      </td>

                      <td className="py-4 px-6 text-gray-900 font-medium">
                        {customerEmail}
                      </td>

                      <td className="py-4 px-6 font-semibold text-gray-800">
                        {prodName}
                        {(sub.selectedFlavor || sub.selectedSize) && (
                          <div className="text-[10px] text-gray-400 font-normal">
                            {[sub.selectedFlavor, sub.selectedSize].filter(Boolean).join(' · ')}
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-6 font-mono text-gray-600 whitespace-nowrap">
                        {formattedBillingDate}
                      </td>

                      <td className="py-4 px-6 font-mono font-bold text-gray-900">
                        ${sub.pricePerBilling}
                      </td>

                      <td className="py-4 px-6">
                        <span
                          className={`text-[10px] uppercase font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                            sub.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : sub.status === 'paused'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-red-50 text-red-700 border-red-200'
                          }`}
                        >
                          {t.portal.status[sub.status] || sub.status}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-right space-x-1">
                        {sub.status === 'active' && (
                          <button
                            onClick={() => handleUpdateStatus(sub.id, 'paused')}
                            className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-[10px] font-bold border border-amber-200 transition-colors"
                          >
                            {t.portal.pauseSub}
                          </button>
                        )}
                        {sub.status === 'paused' && (
                          <button
                            onClick={() => handleUpdateStatus(sub.id, 'active')}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-[10px] font-bold border border-emerald-200 transition-colors"
                          >
                            {t.portal.resumeSub}
                          </button>
                        )}
                        {sub.status !== 'cancelled' && (
                          <button
                            onClick={() => handleUpdateStatus(sub.id, 'cancelled')}
                            className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-[10px] font-bold border border-red-200 transition-colors"
                          >
                            {t.portal.cancelSub}
                          </button>
                        )}
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
