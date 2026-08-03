'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useLanguage } from '@/lib/i18n/useLanguage';
import { useAuth } from '@/lib/auth/AuthContext';
import { type Subscription } from '@/lib/db/schema';
import { useSubscriptionsQuery, useSubscriptionActionMutation } from '@/lib/hooks/useSubscriptionsQuery';
import { TableSkeleton } from '@/components/ui/skeletons/TableSkeleton';
import { toast } from 'sonner';
import { RefreshCw, Pause, Play, XCircle, Calendar, CreditCard, Sparkles, Package } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { axiosClient } from '@/lib/api/axiosClient';

interface EnrichedSubscription extends Omit<Subscription, 'intervalDays'> {
  productNameEn?: string;
  productNameFr?: string;
  imageUrl?: string;
  intervalDays?: number;
}

export function SubscriptionsManager() {
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id || '00000000-0000-4000-a000-000000000001';

  const { data: fetchedSubscriptions, isLoading } = useSubscriptionsQuery(userId);
  const subscriptions: EnrichedSubscription[] = fetchedSubscriptions || [];
  const actionMutation = useSubscriptionActionMutation();
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const handleUpdateStatus = async (id: string, newStatus: 'active' | 'paused' | 'cancelled') => {
    setActionLoadingId(id);
    const mappedAction = newStatus === 'active' ? 'resume' : newStatus;

    actionMutation.mutate(
      { subscriptionId: id, action: mappedAction as any },
      {
        onSuccess: (data) => {
          if (data.success) {
            toast.success(
              newStatus === 'paused'
                ? (language === 'fr' ? 'Abonnement mis en pause' : 'Subscription Paused')
                : newStatus === 'cancelled'
                ? (language === 'fr' ? 'Abonnement annulé' : 'Subscription Cancelled')
                : (language === 'fr' ? 'Abonnement réactivé' : 'Subscription Resumed')
            );
          } else {
            toast.error(data.error || 'Failed to update subscription');
          }
          setActionLoadingId(null);
        },
        onError: (err: any) => {
          toast.error(err.message || 'Failed to update subscription');
          setActionLoadingId(null);
        },
      }
    );
  };

  const handleUpdateInterval = async (id: string, intervalDays: number) => {
    setActionLoadingId(id);
    try {
      const res = await axiosClient.patch(`/api/subscriptions/${id}`, { intervalDays });
      if (res.data.success) {
        queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
        toast.success(
          language === 'fr'
            ? `Fréquence enregistrée : Tous les ${intervalDays} jours`
            : `Delivery cycle saved: Every ${intervalDays} Days`
        );
      } else {
        toast.error(res.data.error || 'Failed to update delivery cycle');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update delivery cycle');
    } finally {
      setActionLoadingId(null);
    }
  };

  if (isLoading) {
    return <TableSkeleton rows={3} />;
  }

  if (subscriptions.length === 0) {
    return (
      <div className="bg-white border border-[#C6DFD1] rounded-3xl p-8 text-center space-y-4 shadow-sm">
        <Package className="w-12 h-12 text-[#2E5A44] mx-auto opacity-40" />
        <h4 className="font-serif text-xl font-bold text-[#111827]">{t.portal.noSubscriptions}</h4>
        <p className="text-xs text-gray-500 max-w-md mx-auto">
          {t.portal.noSubscriptionsSubtext}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6">
        {subscriptions.map((sub) => {
          const isEn = language === 'en';
          const title = isEn
            ? sub.productNameEn || 'Pure Isolate Whey Protein'
            : sub.productNameFr || 'Protéine de Lactosérum Isolat Pure';
          const imgSrc = sub.imageUrl || '/images/whey-isolate.svg';
          const formattedBillingDate = new Date(sub.nextBillingDate).toLocaleDateString(
            isEn ? 'en-US' : 'fr-FR',
            { year: 'numeric', month: 'long', day: 'numeric' }
          );

          const isActioning = actionLoadingId === sub.id;

          return (
            <div
              key={sub.id}
              className="bg-white border border-[#C6DFD1] rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-[#FDFBF7] border border-[#EAF2ED] rounded-2xl flex items-center justify-center p-2 shrink-0 relative">
                  <Image
                    src={imgSrc}
                    alt={title}
                    width={64}
                    height={64}
                    className="object-contain max-h-16"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-serif text-lg font-bold text-[#111827]">{title}</span>
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
                  </div>

                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    {sub.selectedFlavor && (
                      <span className="bg-[#EAF2ED] text-[#2E5A44] px-2 py-0.5 rounded-md font-medium">
                        {sub.selectedFlavor}
                      </span>
                    )}
                    {sub.selectedSize && (
                      <span className="bg-[#EAF2ED] text-[#2E5A44] px-2 py-0.5 rounded-md font-medium">
                        {sub.selectedSize}
                      </span>
                    )}
                    <span className="text-emerald-700 font-bold font-mono">
                      {t.portal.subscriberPrivilegeBadge}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-1">
                    <div className="flex items-center space-x-1">
                      <CreditCard className="w-3.5 h-3.5 text-[#2E5A44]" />
                      <span>
                        {t.portal.billingAmount}: <strong className="text-gray-900 font-mono">${sub.pricePerBilling}</strong> / {t.product.perBilling}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5 text-[#2E5A44]" />
                      <span>
                        {t.portal.nextBilling}: <strong className="text-gray-900 font-mono">{formattedBillingDate}</strong>
                      </span>
                    </div>

                    {/* Delivery Cycle Interval Customizer */}
                    <div className="flex items-center space-x-1 bg-gray-50 border border-gray-200 rounded-lg px-2 py-0.5">
                      <RefreshCw className="w-3 h-3 text-[#2E5A44]" />
                      <span className="text-[11px] font-medium text-gray-700">Cycle:</span>
                      <select
                        defaultValue={sub.intervalDays ? String(sub.intervalDays) : '30'}
                        onChange={(e) => handleUpdateInterval(sub.id, parseInt(e.target.value, 10))}
                        disabled={isActioning}
                        className="bg-transparent text-[11px] font-bold text-[#2E5A44] focus:outline-none cursor-pointer"
                      >
                        <option value="30">{language === 'fr' ? 'Tous les 30 jours' : 'Every 30 Days'}</option>
                        <option value="45">{language === 'fr' ? 'Tous les 45 jours' : 'Every 45 Days'}</option>
                        <option value="60">{language === 'fr' ? 'Tous les 60 jours' : 'Every 60 Days'}</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 border-t md:border-t-0 pt-4 md:pt-0 border-gray-100 shrink-0">
                {sub.status === 'active' && (
                  <button
                    disabled={isActioning}
                    onClick={() => handleUpdateStatus(sub.id, 'paused')}
                    className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors disabled:opacity-50 focus-luxe"
                  >
                    <Pause className="w-3.5 h-3.5" />
                    <span>{t.portal.pauseSub}</span>
                  </button>
                )}

                {sub.status === 'paused' && (
                  <button
                    disabled={isActioning}
                    onClick={() => handleUpdateStatus(sub.id, 'active')}
                    className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors disabled:opacity-50 focus-luxe"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>{t.portal.resumeSub}</span>
                  </button>
                )}

                {sub.status !== 'cancelled' && (
                  <button
                    disabled={isActioning}
                    onClick={() => {
                      if (confirm(t.portal.confirmCancelText)) {
                        handleUpdateStatus(sub.id, 'cancelled');
                      }
                    }}
                    className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors disabled:opacity-50 focus-luxe"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>{t.portal.cancelSub}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
