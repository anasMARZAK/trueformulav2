'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/storefront/Header';
import { SubscriptionsManager } from '@/components/portal/SubscriptionsManager';
import { OrderHistory } from '@/components/portal/OrderHistory';
import { useLanguage } from '@/lib/i18n/useLanguage';
import { useAuth } from '@/lib/auth/AuthContext';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { CheckoutModal } from '@/components/cart/CheckoutModal';
import { useCartStore } from '@/lib/store/useCartStore';
import { User, RefreshCw, ShoppingBag, ShieldCheck, Sparkles } from 'lucide-react';

export default function AccountPage() {
  const { t } = useLanguage();
  const { user, role, isHydrated } = useAuth();
  const router = useRouter();
  const openCart = useCartStore((state) => state.openCart);
  const [activeTab, setActiveTab] = useState<'subscriptions' | 'orders'>('subscriptions');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Admin accounts have no customer subscriptions or order history of their own;
  // the dashboard already covers everything. Send them there rather than
  // rendering an empty member portal.
  useEffect(() => {
    if (!isHydrated) return;
    if (role === 'admin') {
      router.replace('/admin');
    }
  }, [isHydrated, role, router]);

  if (isHydrated && role === 'admin') {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="flex items-center gap-3 text-xs font-semibold text-[#4B5563]">
          <RefreshCw className="w-4 h-4 animate-spin text-[#2E5A44]" />
          <span>Redirecting to the admin dashboard…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#111827] flex flex-col justify-between">
      <div>
        <Header onOpenCart={openCart} />

        {/* Account Header Section */}
        <div className="bg-[#2E5A44] text-white py-12 px-4 sm:px-6 lg:px-8 border-b border-[#234735]">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-xs text-[#C6DFD1] font-semibold uppercase tracking-widest">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t.portal.accountOverview}</span>
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#FDFBF7]">
                {t.portal.title}
              </h1>
              <p className="text-xs sm:text-sm text-[#EAF2ED]/80 max-w-xl">
                {t.portal.subtitle}
              </p>
            </div>

            {/* User Profile Card */}
            <div className="bg-[#234735] border border-[#C6DFD1]/30 rounded-2xl p-4 flex items-center space-x-4 shrink-0 shadow-lg">
              <div className="w-12 h-12 rounded-full bg-[#FDFBF7] text-[#2E5A44] flex items-center justify-center font-serif text-xl font-bold">
                {(user?.fullName || user?.email || 'U')[0].toUpperCase()}
              </div>
              <div className="space-y-0.5 text-xs">
                <div className="font-bold text-white text-sm flex items-center space-x-2">
                  <span>{user?.fullName || t.portal.apothecaryMember}</span>
                  <span className="text-[10px] bg-[#2E5A44] text-[#C6DFD1] font-mono px-2 py-0.5 rounded-full border border-[#C6DFD1]/40 uppercase">
                    {role}
                  </span>
                </div>
                <div className="text-[#C6DFD1] text-[11px]">{user?.email || 'customer@example.com'}</div>
                <div className="text-emerald-300 text-[10px] flex items-center space-x-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>{t.portal.memberPrivilegeActive}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
          {/* Tab Controls */}
          <div className="flex border-b border-[#C6DFD1] space-x-8">
            <button
              onClick={() => setActiveTab('subscriptions')}
              className={`pb-4 text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center space-x-2 border-b-2 transition-all ${
                activeTab === 'subscriptions'
                  ? 'border-[#2E5A44] text-[#2E5A44]'
                  : 'border-transparent text-gray-400 hover:text-gray-700'
              }`}
            >
              <RefreshCw className="w-4 h-4" />
              <span>{t.portal.mySubscriptions}</span>
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`pb-4 text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center space-x-2 border-b-2 transition-all ${
                activeTab === 'orders'
                  ? 'border-[#2E5A44] text-[#2E5A44]'
                  : 'border-transparent text-gray-400 hover:text-gray-700'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{t.portal.orderHistory}</span>
            </button>
          </div>

          {/* Tab Views */}
          {activeTab === 'subscriptions' ? (
            <SubscriptionsManager />
          ) : (
            <OrderHistory />
          )}
        </main>

        <CartDrawer onCheckout={() => setIsCheckoutOpen(true)} />
        <CheckoutModal isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} />
      </div>
    </div>
  );
}
