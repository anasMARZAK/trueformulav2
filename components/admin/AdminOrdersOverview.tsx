'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n/useLanguage';
import { Search, RefreshCw, Inbox } from 'lucide-react';
import { toast } from 'sonner';

interface OrderItemAdmin {
  id: string;
  productId: string;
  nameEn?: string;
  nameFr?: string;
  quantity: number;
  unitPrice: string;
  purchaseType: string;
  selectedFlavor?: string | null;
  selectedSize?: string | null;
}

interface OrderAdmin {
  id: string;
  userId: string;
  customerEmail?: string;
  customerName?: string;
  status: string;
  totalAmount: string;
  shippingAddress: any;
  createdAt: string | Date;
  items: OrderItemAdmin[];
}

/** The order_status enum — these are the only values the database accepts. */
const ORDER_STATUSES = ['pending', 'completed', 'failed', 'refunded'] as const;

const STATUS_STYLES: Record<string, string> = {
  completed: 'bg-[#EAF2ED] text-[#2E5A44] border-[#C6DFD1]',
  pending: 'bg-[#FEF6E7] text-[#8A5C29] border-[#F0D9A8]',
  failed: 'bg-[#FDECEC] text-[#9A3A3A] border-[#F2C9C9]',
  refunded: 'bg-[#F5F0E4] text-[#6B7280] border-[#E5E2D9]',
};

export function AdminOrdersOverview() {
  const { language, t } = useLanguage();
  const [orders, setOrders] = useState<OrderAdmin[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/orders');
      const data = await res.json();
      if (data.success && Array.isArray(data.orders)) {
        setOrders(data.orders);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      toast.error(t.toasts.errorOccurred);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId: string, status: string) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status }),
      });
      const data = await res.json();
      if (data.success) {
        // Reflect the change locally so the row settles without a full refetch flash.
        setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
        toast.success(`Order marked ${status}`);
      } else {
        // Previously this failure path was swallowed and the select silently reverted.
        toast.error(data.error || t.toasts.errorOccurred);
        fetchOrders();
      }
    } catch (err) {
      toast.error(t.toasts.errorOccurred);
      fetchOrders();
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    const email = (o.customerEmail || o.shippingAddress?.email || o.userId || '').toLowerCase();
    const name = (o.customerName || o.shippingAddress?.fullName || '').toLowerCase();
    return o.id.toLowerCase().includes(q) || email.includes(q) || name.includes(q);
  });

  const isEn = language === 'en';

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 border border-[#E5E2D9] rounded-2xl shadow-luxe-card">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.admin.orders.searchPlaceholder}
            className="w-full pl-10 pr-4 py-2.5 bg-[#FDFBF7] border border-[#E5E2D9] rounded-full text-xs font-sans placeholder:text-[#9CA3AF] focus:ring-2 focus:ring-[#2E5A44]/30 focus:border-[#2E5A44] outline-none transition-all"
          />
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-[#6B7280] font-medium">
            {t.admin.orders.totalRecordedOrders}{' '}
            <strong className="text-[#111827] font-mono font-bold">{filteredOrders.length}</strong>
          </span>
          <button
            onClick={fetchOrders}
            aria-label="Refresh orders"
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
            <span>{t.admin.orders.loadingOrders}</span>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-16 text-center">
            <Inbox className="w-7 h-7 text-[#C6DFD1] mx-auto mb-3" />
            <p className="font-serif text-lg font-bold text-[#111827]">
              {t.admin.orders.noOrdersFound}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-3 text-xs font-semibold text-[#2E5A44] hover:underline focus-luxe rounded"
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
                  <th className="py-3.5 px-5">{t.admin.orders.orderId}</th>
                  <th className="py-3.5 px-5">{t.admin.orders.customer}</th>
                  <th className="py-3.5 px-5">{t.admin.orders.date}</th>
                  <th className="py-3.5 px-5">{t.admin.orders.items}</th>
                  <th className="py-3.5 px-5 text-right">{t.admin.orders.total}</th>
                  <th className="py-3.5 px-5">{t.admin.orders.status}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAF2ED] text-xs font-sans">
                {filteredOrders.map((order) => {
                  const customerName =
                    order.customerName || order.shippingAddress?.fullName || 'Customer';
                  const customerEmail =
                    order.customerEmail || order.shippingAddress?.email || order.userId;
                  const formattedDate = new Date(order.createdAt).toLocaleDateString(
                    isEn ? 'en-US' : 'fr-FR',
                    { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
                  );

                  return (
                    <tr key={order.id} className="hover:bg-[#FDFBF7] transition-colors">
                      <td className="py-4 px-5 font-mono font-bold text-[#2E5A44] whitespace-nowrap">
                        {order.id.slice(0, 8)}
                      </td>

                      <td className="py-4 px-5">
                        <div className="font-semibold text-[#111827]">{customerName}</div>
                        <div className="text-[10px] text-[#9CA3AF] font-mono truncate max-w-[180px]">
                          {customerEmail}
                        </div>
                      </td>

                      <td className="py-4 px-5 text-[#6B7280] whitespace-nowrap">{formattedDate}</td>

                      <td className="py-4 px-5">
                        <div className="space-y-1 max-w-xs">
                          {order.items && order.items.length > 0 ? (
                            order.items.map((item, idx) => (
                              <div key={idx} className="text-[#4B5563] text-[11px]">
                                <span className="font-bold font-mono">{item.quantity}×</span>{' '}
                                {/* The API supplies a display name; the raw UUID was being shown */}
                                {(isEn ? item.nameEn : item.nameFr) || item.nameEn || item.productId}
                                <span className="text-[#9CA3AF] font-mono"> (${item.unitPrice})</span>
                              </div>
                            ))
                          ) : (
                            <span className="text-[#9CA3AF] italic">{t.portal.fallbackOrderItem}</span>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-5 font-mono font-bold text-[#111827] text-right whitespace-nowrap tabular-nums">
                        ${parseFloat(order.totalAmount || '0').toFixed(2)}
                      </td>

                      <td className="py-4 px-5">
                        <select
                          value={order.status}
                          disabled={updatingId === order.id}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          aria-label={`Status for order ${order.id.slice(0, 8)}`}
                          className={`rounded-full text-[11px] font-bold px-3 py-1.5 border cursor-pointer outline-none focus:ring-2 focus:ring-[#2E5A44]/30 transition-all disabled:opacity-50 capitalize ${
                            STATUS_STYLES[order.status] || STATUS_STYLES.refunded
                          }`}
                        >
                          {/* Restricted to the enum — 'cancelled' was offered here but
                              would be rejected by the database. */}
                          {ORDER_STATUSES.map((s) => (
                            <option key={s} value={s} className="bg-white text-[#111827]">
                              {s.charAt(0).toUpperCase() + s.slice(1)}
                            </option>
                          ))}
                        </select>
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
