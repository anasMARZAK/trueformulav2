'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/lib/i18n/useLanguage';
import { useAuth } from '@/lib/auth/AuthContext';
import { ShoppingBag, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { useOrdersQuery } from '@/lib/hooks/useOrdersQuery';
import { TableSkeleton } from '@/components/ui/skeletons/TableSkeleton';

interface OrderItemDisplay {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: string;
  purchaseType: 'one_time' | 'subscription';
  selectedFlavor?: string | null;
  selectedSize?: string | null;
}

interface OrderDisplay {
  id: string;
  userId: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  totalAmount: string;
  createdAt: string | Date;
  items: OrderItemDisplay[];
}

export function OrderHistory() {
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const userId = user?.id || 'user_customer_01';

  const { data: fetchedOrders, isLoading } = useOrdersQuery(userId);
  const orders: OrderDisplay[] = fetchedOrders || [];
  const [trackingOrder, setTrackingOrder] = useState<OrderDisplay | null>(null);

  if (isLoading) {
    return <TableSkeleton rows={4} />;
  }

  if (orders.length === 0) {
    return (
      <div className="bg-white border border-[#C6DFD1] rounded-3xl p-8 text-center space-y-4 shadow-sm">
        <ShoppingBag className="w-12 h-12 text-[#2E5A44] mx-auto opacity-40" />
        <h4 className="font-serif text-xl font-bold text-[#111827]">{t.portal.noOrders}</h4>
        <p className="text-xs text-gray-500 max-w-md mx-auto">
          {t.portal.noOrdersSubtext}
        </p>
      </div>
    );
  }

  const isEn = language === 'en';

  return (
    <div className="bg-white border border-[#C6DFD1] rounded-3xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#EAF2ED]/60 border-b border-[#C6DFD1] text-[11px] font-bold text-gray-700 uppercase tracking-wider">
              <th className="py-4 px-6">{t.portal.table.orderId}</th>
              <th className="py-4 px-6">{t.portal.table.date}</th>
              <th className="py-4 px-6">{t.portal.table.items}</th>
              <th className="py-4 px-6">{t.portal.table.type}</th>
              <th className="py-4 px-6">{t.portal.table.total}</th>
              <th className="py-4 px-6">{t.portal.table.status}</th>
              <th className="py-4 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-xs font-sans">
            {orders.map((order) => {
              const formattedDate = new Date(order.createdAt).toLocaleDateString(
                isEn ? 'en-US' : 'fr-FR',
                { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
              );

              const hasSubscriptionItem = order.items.some((i) => i.purchaseType === 'subscription');

              return (
                <tr key={order.id} className="hover:bg-[#FDFBF7]/80 transition-colors">
                  <td className="py-4 px-6 font-mono font-bold text-[#2E5A44]">
                    {order.id}
                  </td>

                  <td className="py-4 px-6 text-gray-600 whitespace-nowrap">
                    {formattedDate}
                  </td>

                  <td className="py-4 px-6">
                    <div className="space-y-1 max-w-xs">
                      {order.items && order.items.length > 0 ? (
                        order.items.map((item, idx) => (
                          <div key={idx} className="text-gray-800 font-medium flex items-center justify-between gap-2">
                            <span>
                              {item.quantity}x {item.productId}
                              {(item.selectedFlavor || item.selectedSize) && (
                                <span className="text-[10px] text-gray-500 ml-1">
                                  ({[item.selectedFlavor, item.selectedSize].filter(Boolean).join(', ')})
                                </span>
                              )}
                            </span>
                            <span className="font-mono text-gray-500 text-[11px]">
                              ${item.unitPrice}
                            </span>
                          </div>
                        ))
                      ) : (
                        <span className="text-gray-400 italic">{t.portal.fallbackOrderItem}</span>
                      )}
                    </div>
                  </td>

                  <td className="py-4 px-6">
                    {hasSubscriptionItem ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        {t.portal.types.subscription}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-700">
                        {t.portal.types.one_time}
                      </span>
                    )}
                  </td>

                  <td className="py-4 px-6 font-mono font-bold text-gray-900">
                    ${order.totalAmount}
                  </td>

                  <td className="py-4 px-6">
                    <span
                      className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        order.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : order.status === 'pending'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}
                    >
                      {order.status === 'completed' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                      {order.status === 'pending' && <Clock className="w-3 h-3 text-amber-600" />}
                      {order.status === 'failed' && <XCircle className="w-3 h-3 text-red-600" />}
                      <span>{order.status}</span>
                    </span>
                  </td>

                  <td className="py-4 px-6 text-right space-x-2">
                    <button
                      onClick={() => setTrackingOrder(order)}
                      className="px-2.5 py-1 bg-white border border-[#C6DFD1] text-[#2E5A44] hover:bg-[#EAF2ED] text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      {isEn ? 'Track' : 'Suivre'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Shipment Tracking Interactive Modal */}
      {trackingOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in" onClick={() => setTrackingOrder(null)}>
          <div className="bg-[#FDFBF7] border border-[#C6DFD1] rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[#EAF2ED] pb-4">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#2E5A44]">
                  Bio-Luxe Logistics Express
                </span>
                <h3 className="font-serif text-lg font-bold text-[#111827]">
                  {isEn ? 'Shipment Tracking' : 'Suivi de Colis'} #{trackingOrder.id}
                </h3>
              </div>
              <button onClick={() => setTrackingOrder(null)} className="p-1.5 text-gray-400 hover:text-gray-900 rounded-full hover:bg-gray-100">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#EAF2ED] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">{isEn ? 'Carrier' : 'Transporteur'}:</span>
                <span className="font-bold text-[#2E5A44]">Bio-Luxe Apothecary Express</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{isEn ? 'Tracking Number' : 'Numéro de suivi'}:</span>
                <span className="font-mono font-bold text-gray-900">BL-EXP-{trackingOrder.id.slice(-8)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{isEn ? 'Estimated Delivery' : 'Livraison Estimée'}:</span>
                <span className="font-bold text-emerald-700">{isEn ? 'Tomorrow by 7:00 PM' : 'Demain avant 19h00'}</span>
              </div>
            </div>

            {/* Tracking Progress Timeline */}
            <div className="space-y-4 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 font-sans">
                {isEn ? 'Delivery Status Timeline' : 'Étape d’Acheminement'}
              </h4>
              <div className="space-y-3 relative pl-6 border-l-2 border-[#2E5A44]">
                <div className="relative">
                  <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-[#2E5A44] ring-4 ring-[#EAF2ED]" />
                  <div className="text-xs font-bold text-[#2E5A44]">{isEn ? 'Out for Delivery / In Transit' : 'En Cours de Livraison'}</div>
                  <div className="text-[11px] text-gray-500">{isEn ? 'Package scanned at regional courier hub.' : 'Colis scanné au centre de tri régional.'}</div>
                </div>

                <div className="relative pt-2">
                  <div className="absolute -left-[31px] top-2 w-4 h-4 rounded-full bg-[#2E5A44]/60" />
                  <div className="text-xs font-bold text-gray-800">{isEn ? 'Lab Batch Inspected' : 'Inspection du Lot en Laboratoire'}</div>
                  <div className="text-[11px] text-gray-500">{isEn ? 'Purity verification certificate attached.' : 'Certificat de pureté validé.'}</div>
                </div>

                <div className="relative pt-2">
                  <div className="absolute -left-[31px] top-2 w-4 h-4 rounded-full bg-[#2E5A44]/30" />
                  <div className="text-xs font-bold text-gray-600">{isEn ? 'Order Received & Processed' : 'Commande Confirmée'}</div>
                  <div className="text-[11px] text-gray-400">{isEn ? 'Payment authorized and order queued.' : 'Paiement autorisé et commande préparée.'}</div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#EAF2ED] flex justify-end">
              <button onClick={() => setTrackingOrder(null)} className="px-5 py-2 bg-[#2E5A44] text-white text-xs font-bold rounded-xl hover:bg-[#234735]">
                {isEn ? 'Close' : 'Fermer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
