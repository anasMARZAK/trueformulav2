'use client';

import React, { useState, useEffect } from 'react';
import { ProductCrudTable } from '@/components/admin/ProductCrudTable';
import { AdminSubsOverview } from '@/components/admin/AdminSubsOverview';
import { AdminOrdersOverview } from '@/components/admin/AdminOrdersOverview';
import { useAuth } from '@/lib/auth/AuthContext';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { CheckoutModal } from '@/components/cart/CheckoutModal';
import { toast } from 'sonner';
import Link from 'next/link';
import {
  DollarSign,
  RefreshCw,
  ShoppingBag,
  Package,
  ShieldAlert,
  BarChart3,
  LayoutDashboard,
  Store,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react';

import { useRouter } from 'next/navigation';
import { DynamicAnalyticsChart } from '@/components/admin/DynamicAnalyticsChart';

type AdminTab = 'overview' | 'products' | 'subscriptions' | 'orders';

const NAV_ITEMS: Array<{ key: AdminTab; label: string; icon: typeof LayoutDashboard }> = [
  { key: 'overview', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'products', label: 'Products', icon: Package },
  { key: 'orders', label: 'Orders', icon: ShoppingBag },
  { key: 'subscriptions', label: 'Subscriptions', icon: RefreshCw },
];

const PAGE_TITLES: Record<AdminTab, { title: string; subtitle: string }> = {
  overview: { title: 'Dashboard', subtitle: 'Revenue, orders, and recurring performance at a glance.' },
  products: { title: 'Product Catalog', subtitle: 'Manage formulations, pricing, and stock levels.' },
  orders: { title: 'Orders', subtitle: 'Customer orders and fulfilment status.' },
  subscriptions: { title: 'Subscriptions', subtitle: 'Recurring members and monthly recurring revenue.' },
};

/** Matches the order_status enum — revenue recognises settled orders only. */
const SETTLED_STATUS = 'completed';

export default function AdminPage() {
  const { role, user, isHydrated } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    // Only check role after auth state has been hydrated from localStorage/Supabase
    // to prevent false redirects on page refresh when role temporarily defaults to 'customer'
    if (!isHydrated) return;
    if (role !== 'admin') {
      toast.error('Access Denied: Admin privileges required.');
      router.push('/');
    }
  }, [role, router, isHydrated]);

  const [rawOrders, setRawOrders] = useState<any[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    activeSubsCount: 0,
    mrr: 0,
    totalOrdersCount: 0,
    pendingOrdersCount: 0,
  });

  const fetchAnalytics = async () => {
    setIsLoadingStats(true);
    try {
      const [ordersRes, subsRes] = await Promise.all([
        fetch('/api/admin/orders').then((r) => r.json()).catch(() => null),
        fetch('/api/admin/subscriptions').then((r) => r.json()).catch(() => null),
      ]);

      const ordersList = ordersRes?.success && Array.isArray(ordersRes.orders) ? ordersRes.orders : [];
      const subsList = subsRes?.success && Array.isArray(subsRes.subscriptions) ? subsRes.subscriptions : [];

      setRawOrders(ordersList);

      let revenue = 0;
      let pending = 0;
      ordersList.forEach((o: any) => {
        const amount = parseFloat(String(o.totalAmount ?? o.total_amount ?? '0'));
        if (Number.isNaN(amount)) return;
        if (o.status === SETTLED_STATUS) revenue += amount;
        else if (o.status === 'pending') pending += 1;
      });

      let activeCount = 0;
      let mrrSum = 0;
      subsList.forEach((s: any) => {
        if (s.status === 'active') {
          activeCount++;
          mrrSum += parseFloat(String(s.pricePerBilling || s.pricePerCycle || s.price_per_cycle || '0')) || 0;
        }
      });

      setStats({
        totalRevenue: revenue,
        activeSubsCount: activeCount,
        mrr: mrrSum,
        totalOrdersCount: ordersList.length,
        pendingOrdersCount: pending,
      });
    } catch (err: any) {
      console.error('Failed to fetch admin analytics:', err);
    } finally {
      setIsLoadingStats(false);
    }
  };

  useEffect(() => {
    if (isHydrated && role === 'admin') {
      fetchAnalytics();
    }
  }, [isHydrated, role]);

  const money = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

  const kpis = [
    {
      label: 'Settled Revenue',
      value: money(stats.totalRevenue),
      note:
        stats.pendingOrdersCount > 0
          ? `${stats.pendingOrdersCount} pending not counted`
          : 'All orders settled',
      icon: DollarSign,
    },
    {
      label: 'Total Orders',
      value: stats.totalOrdersCount.toLocaleString(),
      note: 'Lifetime processed',
      icon: ShoppingBag,
    },
    {
      label: 'Active Subscribers',
      value: stats.activeSubsCount.toLocaleString(),
      note: 'Recurring members',
      icon: RefreshCw,
    },
    {
      label: 'Monthly Recurring',
      value: `${money(stats.mrr)}/mo`,
      note: 'Projected from active subs',
      icon: BarChart3,
    },
  ];

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#111827] flex">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-xs"
        />
      )}

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-white border-r border-[#E5E2D9] flex flex-col justify-between z-50 transition-transform duration-300 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-5 space-y-7">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 focus-luxe rounded">
              <div className="w-9 h-9 rounded-xl bg-[#2E5A44] flex items-center justify-center text-white font-serif font-bold text-lg">
                T
              </div>
              <div>
                <div className="font-serif text-base font-bold text-[#111827] leading-none">
                  True Formula
                </div>
                <div className="text-[9px] text-[#9CA3AF] font-mono tracking-[0.15em] uppercase mt-1">
                  Admin
                </div>
              </div>
            </Link>
            <button
              onClick={() => setIsSidebarOpen(false)}
              aria-label="Close menu"
              className="lg:hidden text-[#9CA3AF] hover:text-[#111827]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9CA3AF] px-3 mb-2">
              Manage
            </div>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => {
                    setActiveTab(item.key);
                    setIsSidebarOpen(false);
                  }}
                  aria-current={isActive ? 'page' : undefined}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer focus-luxe ${
                    isActive
                      ? 'bg-[#EAF2ED] text-[#2E5A44] font-bold'
                      : 'text-[#4B5563] hover:bg-[#F5F0E4]/60 hover:text-[#111827]'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9CA3AF] px-3 mb-2">
              Shortcuts
            </div>
            <Link
              href="/"
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-[#4B5563] hover:bg-[#F5F0E4]/60 hover:text-[#111827] transition-all focus-luxe"
            >
              <Store className="w-4 h-4" />
              <span>View Storefront</span>
            </Link>
          </div>
        </div>

        <div className="p-4 m-3 rounded-2xl border border-[#E5E2D9] bg-[#FDFBF7]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#EAF2ED] text-[#2E5A44] font-bold text-xs flex items-center justify-center border border-[#C6DFD1] shrink-0">
              {user?.fullName ? user.fullName[0].toUpperCase() : 'A'}
            </div>
            <div className="overflow-hidden flex-1">
              <div className="text-xs font-bold text-[#111827] truncate">
                {user?.fullName || 'Store Director'}
              </div>
              <div className="text-[10px] text-[#9CA3AF] truncate font-mono">
                {user?.email || 'admin@trueformula.co'}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="bg-[#FDFBF7]/90 backdrop-blur-md border-b border-[#E5E2D9] px-5 sm:px-8 py-4 flex items-center justify-between gap-4 sticky top-0 z-30">
          <div className="flex items-center gap-4 min-w-0">
            <button
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open menu"
              className="lg:hidden p-1.5 text-[#4B5563] hover:text-[#111827] rounded-lg focus-luxe"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-[11px] text-[#9CA3AF] font-medium">
                <span>Admin</span>
                <ChevronRight className="w-3 h-3" />
                <span className="text-[#2E5A44] font-semibold">{PAGE_TITLES[activeTab].title}</span>
              </div>
              <h1 className="font-serif text-xl sm:text-2xl font-bold text-[#111827] leading-tight truncate">
                {PAGE_TITLES[activeTab].title}
              </h1>
            </div>
          </div>

          <div
            className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1.5 border ${
              role === 'admin'
                ? 'bg-[#EAF2ED] text-[#2E5A44] border-[#C6DFD1]'
                : 'bg-[#F5F0E4] text-[#6B7280] border-[#E5E2D9]'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{role.toUpperCase()}</span>
          </div>
        </header>

        <main className="p-5 sm:p-8 space-y-8 max-w-7xl mx-auto w-full">
          <p className="text-sm text-[#6B7280] -mt-1">{PAGE_TITLES[activeTab].subtitle}</p>

          {activeTab === 'overview' && (
            <>
              {/* KPI row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {kpis.map((kpi) => {
                  const Icon = kpi.icon;
                  return (
                    <div
                      key={kpi.label}
                      className="bg-white border border-[#E5E2D9] rounded-2xl p-5 shadow-luxe-card"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#9CA3AF]">
                          {kpi.label}
                        </span>
                        <Icon className="w-4 h-4 text-[#2E5A44] shrink-0" strokeWidth={1.75} />
                      </div>
                      {isLoadingStats ? (
                        <div className="h-8 w-24 bg-[#F5F0E4] rounded mt-3 animate-pulse" />
                      ) : (
                        <div className="font-mono text-xl sm:text-2xl font-bold text-[#111827] mt-2.5 tabular-nums truncate">
                          {kpi.value}
                        </div>
                      )}
                      <p className="text-[11px] text-[#9CA3AF] mt-1.5">{kpi.note}</p>
                    </div>
                  );
                })}
              </div>

              <DynamicAnalyticsChart orders={rawOrders} isLoading={isLoadingStats} />
            </>
          )}

          {activeTab === 'products' && <ProductCrudTable />}
          {activeTab === 'orders' && <AdminOrdersOverview />}
          {activeTab === 'subscriptions' && <AdminSubsOverview />}
        </main>

        <CartDrawer onCheckout={() => setIsCheckoutOpen(true)} />
        <CheckoutModal isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} />
      </div>
    </div>
  );
}
