'use client';

import React, { useState, useEffect } from 'react';
import { ProductCrudTable } from '@/components/admin/ProductCrudTable';
import { AdminSubsOverview } from '@/components/admin/AdminSubsOverview';
import { AdminOrdersOverview } from '@/components/admin/AdminOrdersOverview';
import { useLanguage } from '@/lib/i18n/useLanguage';
import { useAuth } from '@/lib/auth/AuthContext';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { CheckoutModal } from '@/components/cart/CheckoutModal';
import { useCartStore } from '@/lib/store/useCartStore';
import { axiosClient } from '@/lib/api/axiosClient';
import { toast } from 'sonner';
import Link from 'next/link';
import {
  DollarSign,
  RefreshCw,
  TrendingUp,
  ShoppingBag,
  Package,
  ShieldAlert,
  ArrowRight,
  BarChart3,
  LayoutDashboard,
  Users,
  Search,
  Store,
  Sparkles,
  Sliders,
  ChevronRight,
  ArrowUpRight,
  TrendingDown,
  Menu,
  X,
} from 'lucide-react';

import { useRouter } from 'next/navigation';
import { DynamicAnalyticsChart } from '@/components/admin/DynamicAnalyticsChart';

export default function AdminPage() {
  const { t, language } = useLanguage();
  const { role, user, isHydrated } = useAuth();
  const router = useRouter();
  const openCart = useCartStore((state) => state.openCart);
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'subscriptions' | 'orders'>('overview');
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
  const [stats, setStats] = useState({
    totalRevenue: 0.0,
    activeSubsCount: 0,
    mrr: 0.0,
    totalOrdersCount: 0,
  });

  const fetchAnalytics = async () => {
    try {
      const [ordersRes, subsRes] = await Promise.all([
        fetch('/api/admin/orders').then((r) => r.json()).catch(() => null),
        fetch('/api/admin/subscriptions').then((r) => r.json()).catch(() => null),
      ]);

      const ordersList = ordersRes?.success && Array.isArray(ordersRes.orders) ? ordersRes.orders : [];
      const subsList = subsRes?.success && Array.isArray(subsRes.subscriptions) ? subsRes.subscriptions : [];

      setRawOrders(ordersList);

      const rev = ordersList.reduce((acc: number, o: any) => {
        const isCompleted = o.status === 'completed' || o.status === 'delivered' || o.status === 'processing';
        // Handle both camelCase (totalAmount) and snake_case (total_amount) field names
        const amount = parseFloat(String(o.totalAmount || o.total_amount || '0'));
        return isCompleted ? acc + amount : acc;
      }, 0);

      let activeCount = 0;
      let mrrSum = 0;
      subsList.forEach((s: any) => {
        if (s.status === 'active') {
          activeCount++;
          mrrSum += parseFloat(String(s.pricePerBilling || s.pricePerCycle || s.price_per_cycle || '0'));
        }
      });

      setStats({
        totalRevenue: rev,
        activeSubsCount: activeCount,
        mrr: mrrSum,
        totalOrdersCount: ordersList.length,
      });
    } catch (err: any) {
      console.error('Failed to fetch admin analytics:', err);
    }
  };

  useEffect(() => {
    if (isHydrated && role === 'admin') {
      fetchAnalytics();
    }
  }, [isHydrated, role]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#111827] flex">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-xs"
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-white border-r border-slate-200 flex flex-col justify-between z-50 transition-transform duration-300 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-6 space-y-6">
          {/* Logo & Brand Header */}
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#2E5A44] flex items-center justify-center text-white font-serif font-bold text-lg shadow-sm">
                T
              </div>
              <div>
                <div className="font-serif text-lg font-bold text-[#111827] leading-none">
                  True Formula
                </div>
                <div className="text-[10px] text-slate-400 font-mono tracking-wider uppercase mt-0.5">
                  Admin OS v2.4
                </div>
              </div>
            </Link>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search admin..."
              className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2E5A44]/30"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>

          {/* Navigation Links */}
          <div className="space-y-6">
            {/* MAIN MENU */}
            <div className="space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">
                Main Menu
              </div>
              <button
                onClick={() => {
                  setActiveTab('overview');
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'overview'
                    ? 'bg-[#EAF2ED] text-[#2E5A44] font-bold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('products');
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'products'
                    ? 'bg-[#EAF2ED] text-[#2E5A44] font-bold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>Products Catalog</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('orders');
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'orders'
                    ? 'bg-[#EAF2ED] text-[#2E5A44] font-bold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Orders Overview</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('subscriptions');
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'subscriptions'
                    ? 'bg-[#EAF2ED] text-[#2E5A44] font-bold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <RefreshCw className="w-4 h-4" />
                <span>Subscriptions & MRR</span>
              </button>
            </div>

            {/* QUICK ACTIONS & SYSTEM */}
            <div className="space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">
                Shortcuts
              </div>
              <Link
                href="/"
                className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all"
              >
                <Store className="w-4 h-4" />
                <span>Storefront Preview</span>
              </Link>

              <div className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 bg-slate-50">
                <div className="flex items-center space-x-3">
                  <Sliders className="w-4 h-4" />
                  <span>Session Role</span>
                </div>
                <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded font-mono uppercase">
                  {role}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Footer User Card */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 m-3 rounded-2xl">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-[#2E5A44]/10 text-[#2E5A44] font-bold text-xs flex items-center justify-center border border-[#2E5A44]/20">
              {user?.fullName ? user.fullName[0].toUpperCase() : 'A'}
            </div>
            <div className="overflow-hidden flex-1">
              <div className="text-xs font-bold text-slate-900 truncate">
                {user?.fullName || 'Store Director'}
              </div>
              <div className="text-[10px] text-slate-500 truncate font-mono">
                {user?.email || 'admin@proteinshop.co'}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Right Content Panel */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Header Bar */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-1.5 text-slate-600 hover:text-slate-900 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center space-x-2 text-xs text-slate-500 font-medium">
                <span>Admin Panel</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[#2E5A44] font-bold capitalize">
                  {activeTab}
                </span>
              </div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
                {activeTab === 'overview' && 'Executive Analytics & Tracking'}
                {activeTab === 'products' && 'Product Inventory Catalog'}
                {activeTab === 'orders' && 'Customer Orders & Shipments'}
                {activeTab === 'subscriptions' && 'Subscription Recurring Engine'}
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center space-x-1.5 border ${
                role === 'admin'
                  ? 'bg-amber-50 text-amber-900 border-amber-200'
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
              <span>Role: {role.toUpperCase()}</span>
            </div>
          </div>
        </header>

        {/* Dashboard Main Workspace Content */}
        <main className="p-6 sm:p-8 space-y-8 max-w-7xl mx-auto w-full">
          {/* Top Dynamic Analytics Chart & Stat Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Dynamic Real-Time Bezier Chart (2 Cols) */}
            <div className="lg:col-span-2">
              <DynamicAnalyticsChart orders={rawOrders} />
            </div>

            {/* Side KPI Stat Cards (Matching Screenshot Right Side) */}
            <div className="space-y-4 flex flex-col justify-between">
              {/* Total Orders Card */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs relative overflow-hidden flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Total Orders
                  </span>
                  <div className="text-2xl font-serif font-bold text-slate-900 mt-1">
                    {stats.totalOrdersCount.toLocaleString()} orders
                  </div>
                  <div className="inline-flex items-center space-x-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full mt-2 border border-emerald-200">
                    <TrendingUp className="w-3 h-3" />
                    <span>+147% VS PREV. WEEK</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-6 h-6" />
                </div>
              </div>

              {/* Recurring Revenue (MRR) Card */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs relative overflow-hidden flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Projected MRR
                  </span>
                  <div className="text-2xl font-serif font-bold text-[#2E5A44] mt-1">
                    ${stats.mrr.toFixed(2)}/mo
                  </div>
                  <div className="inline-flex items-center space-x-1 text-[10px] font-bold text-[#2E5A44] bg-[#EAF2ED] px-2 py-0.5 rounded-full mt-2 border border-[#C6DFD1]">
                    <RefreshCw className="w-3 h-3" />
                    <span>{stats.activeSubsCount} Active Subscribers</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-[#EAF2ED] text-[#2E5A44] flex items-center justify-center shrink-0">
                  <BarChart3 className="w-6 h-6" />
                </div>
              </div>

              {/* Low Stock / Quality Alert Card */}
              <div className="bg-gradient-to-r from-[#111827] to-[#1E293B] text-white rounded-3xl p-5 shadow-xs flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center space-x-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Inventory Status</span>
                  </div>
                  <div className="text-sm font-bold text-slate-100">
                    All 6 Bio-Luxe Formulations Active
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Independent 3rd party lab verified
                  </p>
                </div>
                <Link
                  href="#catalog"
                  onClick={() => setActiveTab('products')}
                  className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all shrink-0"
                >
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* Section Navigation Tabs & Data Views */}
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex space-x-2 sm:space-x-4">
                <button
                  onClick={() => setActiveTab('products')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
                    activeTab === 'products' || activeTab === 'overview'
                      ? 'bg-[#2E5A44] text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Package className="w-4 h-4" />
                  <span>Products Catalog</span>
                </button>

                <button
                  onClick={() => setActiveTab('orders')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
                    activeTab === 'orders'
                      ? 'bg-[#2E5A44] text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Orders Log</span>
                </button>

                <button
                  onClick={() => setActiveTab('subscriptions')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
                    activeTab === 'subscriptions'
                      ? 'bg-[#2E5A44] text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Subscriptions</span>
                </button>
              </div>
            </div>

            {/* Embedded Management Table */}
            {(activeTab === 'products' || activeTab === 'overview') && <ProductCrudTable />}
            {activeTab === 'orders' && <AdminOrdersOverview />}
            {activeTab === 'subscriptions' && <AdminSubsOverview />}
          </div>
        </main>

        <CartDrawer onCheckout={() => setIsCheckoutOpen(true)} />
        <CheckoutModal isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} />
      </div>
    </div>
  );
}

