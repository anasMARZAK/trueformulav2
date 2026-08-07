'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/storefront/Header';
import { SiteFooter } from '@/components/storefront/SiteFooter';
import { ProductGrid } from '@/components/storefront/ProductGrid';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { CheckoutModal } from '@/components/cart/CheckoutModal';
import { MOCK_PRODUCTS } from '@/lib/db/mock-data';
import { useLanguage } from '@/lib/i18n/useLanguage';
import { useAuth } from '@/lib/auth/AuthContext';
import { useCartStore } from '@/lib/store/useCartStore';
import { useProductsQuery } from '@/lib/hooks/useProductsQuery';
import { Sparkles, FlaskConical, ShieldCheck, Truck } from 'lucide-react';

const VALID_CATEGORIES = [
  'all',
  'whey',
  'creatine',
  'wellness',
  'snacks',
  'plant',
  'preworkout',
  'accessories',
];

function ProductsCatalog() {
  const { t, language } = useLanguage();
  const { user, isLoggedIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const openCart = useCartStore((state) => state.openCart);

  const { data: fetchedProducts, isLoading } = useProductsQuery();
  // The seeded catalog stands in only while the database round-trip is empty,
  // so the page never renders a bare grid.
  const products = fetchedProducts && fetchedProducts.length > 0 ? fetchedProducts : MOCK_PRODUCTS;

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Deep links such as /products?category=whey&q=isolate seed the filters, so
  // the footer links and post-login redirect can land on a pre-filtered view.
  useEffect(() => {
    const category = searchParams.get('category');
    const query = searchParams.get('q');
    if (category && VALID_CATEGORIES.includes(category)) {
      setSelectedCategory(category);
    }
    if (query) {
      setSearchQuery(query);
    }
  }, [searchParams]);

  // Keep the URL in step with the filters so the view is shareable and the
  // browser back button steps through it.
  const syncUrl = (category: string, query: string) => {
    const params = new URLSearchParams();
    if (category && category !== 'all') params.set('category', category);
    if (query.trim()) params.set('q', query.trim());
    const qs = params.toString();
    router.replace(qs ? `/products?${qs}` : '/products', { scroll: false });
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    syncUrl(category, searchQuery);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    syncUrl(selectedCategory, query);
  };

  const isEn = language === 'en';
  const firstName = user?.fullName?.split(' ')[0] || user?.email?.split('@')[0];

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#111827] flex flex-col">
      <Header
        selectedCategory={selectedCategory}
        onCategorySelect={handleCategoryChange}
        currentSearchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onOpenCart={openCart}
      />

      {/* ── Catalog banner ─────────────────────────────────────────────────── */}
      <section className="bg-[#2E5A44] text-white border-b border-[#234735] relative overflow-hidden">
        <div className="absolute -top-24 -right-16 w-80 h-80 rounded-full bg-[#C6DFD1]/10 blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-14 relative">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] font-bold text-[#C6DFD1]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t.catalog.badge}</span>
          </div>

          <h1 className="mt-3 font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#FDFBF7] text-balance">
            {isLoggedIn && firstName
              ? isEn
                ? `Welcome back, ${firstName}.`
                : `Bon retour, ${firstName}.`
              : t.catalog.title}
          </h1>

          <p className="mt-3 max-w-xl text-xs sm:text-sm text-[#EAF2ED]/85 leading-relaxed font-light text-pretty">
            {t.catalog.subtitle}
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3 text-[11px] text-[#C6DFD1]">
            <span className="flex items-center gap-2">
              <FlaskConical className="w-3.5 h-3.5 shrink-0" />
              {t.hero.highlights.nativeIsolates}
            </span>
            <span className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              {t.hero.highlights.tested}
            </span>
            <span className="flex items-center gap-2">
              <Truck className="w-3.5 h-3.5 shrink-0" />
              {t.hero.highlights.shipping}
            </span>
          </div>
        </div>
      </section>

      {/* ProductGrid owns search, category tabs, price ceiling, and sorting. */}
      <main className="flex-1">
        <ProductGrid
          products={products}
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          isLoading={isLoading}
        />
      </main>

      <CartDrawer onCheckout={() => setIsCheckoutOpen(true)} />
      <CheckoutModal isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} />

      <SiteFooter onCategorySelect={handleCategoryChange} />
    </div>
  );
}

export default function ProductsPage() {
  // useSearchParams needs a Suspense boundary for static generation.
  return (
    <Suspense
      fallback={<div className="min-h-screen bg-[#FDFBF7]" aria-busy="true" />}
    >
      <ProductsCatalog />
    </Suspense>
  );
}
