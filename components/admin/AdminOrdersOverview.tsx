'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n/useLanguage';
import { Search, RefreshCw, CheckCircle2, Clock, XCircle } from 'lucide-react';

interface OrderItemAdmin {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: string;
  purchaseType: string;
  selectedFlavor?: string | null;
  selectedSize?: string | null;
}

interface OrderAdmin {
  id: string;
  userId: string;
  status: string;
  totalAmount: string;
  currency: string;
  shippingAddress: any;
  paymentMethod: string;
  createdAt: string | Date;
  items: OrderItemAdmin[];
}

export function AdminOrdersOverview() {
  const { language, t } = useLanguage();
  const [orders, setOrders] = useState<OrderAdmin[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

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
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filteredOrders = orders.filter((o) => {
    const q = searchQuery.toLowerCase();
    const email = (o.shippingAddress?.email || o.userId || '').toLowerCase();
    const name = (o.shippingAddress?.fullName || '').toLowerCase();
    return o.id.toLowerCase().includes(q) || email.includes(q) || name.includes(q);
  });

  const isEn = language === 'en';

  return (
    <div className="space-y-4">
      {/* Search Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 border border-[#C6DFD1] rounded-3xl shadow-sm">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.admin.orders.searchPlaceholder}
            className="w-full pl-9 pr-4 py-2 bg-[#FDFBF7] border border-[#C6DFD1] rounded-full text-xs font-sans focus:ring-2 focus:ring-[#2E5A44]/30 outline-none"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        <div className="text-xs text-gray-500 font-semibold font-mono">
          {t.admin.orders.totalRecordedOrders} <strong className="text-[#2E5A44]">{filteredOrders.length}</strong>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-[#C6DFD1] rounded-3xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="py-12 text-center text-gray-500 font-sans text-xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#2E5A44]" />
            <span>{t.admin.orders.loadingOrders}</span>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-12 text-center text-gray-500 font-sans text-xs">
            <p className="font-bold text-gray-700">{t.admin.orders.noOrdersFound}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#EAF2ED]/60 border-b border-[#C6DFD1] text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                  <th className="py-4 px-6">{t.admin.orders.orderId}</th>
                  <th className="py-4 px-6">{t.admin.orders.customer}</th>
                  <th className="py-4 px-6">{t.admin.orders.date}</th>
                  <th className="py-4 px-6">{t.admin.orders.items}</th>
                  <th className="py-4 px-6">{t.admin.orders.total}</th>
                  <th className="py-4 px-6">{t.admin.orders.status}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs font-sans">
                {filteredOrders.map((order) => {
                  const customerName = order.shippingAddress?.fullName || 'Customer';
                  const customerEmail = order.shippingAddress?.email || order.userId;
                  const formattedDate = new Date(order.createdAt).toLocaleDateString(
                    isEn ? 'en-US' : 'fr-FR',
                    { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
                  );

                  return (
                    <tr key={order.id} className="hover:bg-[#FDFBF7]/80 transition-colors">
                      <td className="py-4 px-6 font-mono font-bold text-[#2E5A44]">
                        {order.id}
                      </td>

                      <td className="py-4 px-6">
                        <div className="font-bold text-gray-900">{customerName}</div>
                        <div className="text-[10px] text-gray-400 font-mono">{customerEmail}</div>
                      </td>

                      <td className="py-4 px-6 text-gray-600 whitespace-nowrap">
                        {formattedDate}
                      </td>

                      <td className="py-4 px-6">
                        <div className="space-y-1 max-w-xs">
                          {order.items && order.items.length > 0 ? (
                            order.items.map((item, idx) => (
                              <div key={idx} className="text-gray-800 text-[11px]">
                                <span className="font-semibold">{item.quantity}x</span> {item.productId}{' '}
                                <span className="text-gray-400 font-mono">(${item.unitPrice})</span>
                              </div>
                            ))
                          ) : (
                            <span className="text-gray-400 italic">{t.portal.fallbackOrderItem}</span>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-6 font-mono font-bold text-gray-900">
                        ${order.totalAmount}
                      </td>

                      <td className="py-4 px-6">
                        <select
                          value={order.status}
                          onChange={async (e) => {
                            const newStatus = e.target.value;
                            try {
                              const res = await fetch('/api/admin/orders', {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ orderId: order.id, status: newStatus }),
                              });
                              const data = await res.json();
                              if (data.success) {
                                fetchOrders();
                              }
                            } catch (_) {}
                          }}
                          className="bg-[#FDFBF7] border border-[#C6DFD1] rounded-lg text-[11px] font-bold text-[#2E5A44] px-2 py-1 focus:outline-none cursor-pointer"
                        >
                          <option value="completed">Completed</option>
                          <option value="pending">Pending</option>
                          <option value="cancelled">Cancelled</option>
                          <option value="refunded">Refunded</option>
                          <option value="failed">Failed</option>
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
