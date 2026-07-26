'use client';

import React, { useState } from 'react';
import { Header } from '@/components/storefront/Header';
import { Hero } from '@/components/storefront/Hero';
import { ValueProps } from '@/components/storefront/ValueProps';
import { Reviews } from '@/components/storefront/Reviews';
import { ProductGrid } from '@/components/storefront/ProductGrid';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { CheckoutModal } from '@/components/cart/CheckoutModal';
import { MOCK_PRODUCTS } from '@/lib/db/mock-data';
import { type Product } from '@/lib/db/schema';
import { useLanguage } from '@/lib/i18n/useLanguage';
import { useCartStore } from '@/lib/store/useCartStore';
import { fetchProductsFromSupabase } from '@/lib/db/supabase-products';
import { ShieldCheck, RefreshCw, Award, Heart } from 'lucide-react';

export default function HomePage() {
  const { t } = useLanguage();
  const openCart = useCartStore((state) => state.openCart);
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  React.useEffect(() => {
    fetchProductsFromSupabase().then((liveProducts) => {
      if (liveProducts && liveProducts.length > 0) {
        setProducts(liveProducts);
      }
    });
  }, []);

  const handleScrollToCatalog = () => {
    const catalogEl = document.getElementById('catalog');
    if (catalogEl) {
      catalogEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSubscribeFilter = () => {
    setSelectedCategory('all');
    handleScrollToCatalog();
  };

  const handleOpenCart = () => {
    openCart();
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#111827] flex flex-col justify-between">
      <div>
        {/* Navigation Header */}
        <Header
          selectedCategory={selectedCategory}
          onCategorySelect={(cat) => {
            setSelectedCategory(cat);
            handleScrollToCatalog();
          }}
          currentSearchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenCart={handleOpenCart}
        />

        {/* Hero Section */}
        <Hero
          onExploreClick={handleScrollToCatalog}
          onSubscribeClick={handleSubscribeFilter}
        />

        {/* Product Catalog Grid — immediately after Hero */}
        <ProductGrid
          products={products}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* Why ProteinShop — Value Propositions */}
        <ValueProps onExploreClick={handleScrollToCatalog} />

        {/* Customer Reviews & Testimonials */}
        <Reviews />

        {/* Cart Drawer & Checkout Modal */}
        <CartDrawer onCheckout={() => setIsCheckoutOpen(true)} />
        <CheckoutModal isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} />
      </div>

      {/* Apothecary Footer */}
      <footer className="bg-[#111827] text-white pt-16 pb-12 border-t border-[#2E5A44]/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand Info */}
            <div className="space-y-4 md:col-span-1">
              <span className="font-serif text-2xl font-bold tracking-tight text-[#FDFBF7]">
                {t.header.logoTitle}
              </span>
              <p className="text-xs text-gray-400 leading-relaxed font-sans">
                {t.hero.subtext}
              </p>
              <div className="flex items-center space-x-2 text-xs text-[#C6DFD1]">
                <ShieldCheck className="w-4 h-4 text-[#2E5A44]" />
                <span>{t.product.bioLuxePurity}</span>
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-3">
              <h4 className="font-serif text-sm font-bold uppercase tracking-wider text-[#C6DFD1]">
                Collections
              </h4>
              <ul className="space-y-2 text-xs text-gray-400">
                <li>
                  <button
                    onClick={() => {
                      setSelectedCategory('whey');
                      handleScrollToCatalog();
                    }}
                    className="hover:text-white transition-colors"
                  >
                    {t.header.categories.whey}
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      setSelectedCategory('creatine');
                      handleScrollToCatalog();
                    }}
                    className="hover:text-white transition-colors"
                  >
                    {t.header.categories.creatine}
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      setSelectedCategory('wellness');
                      handleScrollToCatalog();
                    }}
                    className="hover:text-white transition-colors"
                  >
                    {t.header.categories.wellness}
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      setSelectedCategory('plant');
                      handleScrollToCatalog();
                    }}
                    className="hover:text-white transition-colors"
                  >
                    {t.header.categories.plant}
                  </button>
                </li>
              </ul>
            </div>

            {/* Member Privileges */}
            <div className="space-y-3">
              <h4 className="font-serif text-sm font-bold uppercase tracking-wider text-[#C6DFD1]">
                Apothecary Club
              </h4>
              <ul className="space-y-2 text-xs text-gray-400">
                <li className="flex items-center space-x-1.5">
                  <RefreshCw className="w-3.5 h-3.5 text-[#2E5A44]" />
                  <span>20% Subscriber Discount</span>
                </li>
                <li className="flex items-center space-x-1.5">
                  <Award className="w-3.5 h-3.5 text-[#2E5A44]" />
                  <span>Flexible Delivery Cycles</span>
                </li>
                <li className="flex items-center space-x-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#2E5A44]" />
                  <span>Pause or Cancel Anytime</span>
                </li>
              </ul>
            </div>

            {/* Newsletter / Quality Assurance */}
            <div className="space-y-3">
              <h4 className="font-serif text-sm font-bold uppercase tracking-wider text-[#C6DFD1]">
                Apothecary Gazette
              </h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Subscribe for private formulation releases and bio-luxe research briefs.
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  alert('Thank you for subscribing to the Apothecary Gazette!');
                }}
                className="flex items-center space-x-2 pt-1"
              >
                <input
                  type="email"
                  required
                  placeholder="enter your email..."
                  className="bg-[#1E293B] border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-[#C6DFD1] w-full"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-[#2E5A44] hover:bg-[#244736] text-white text-xs font-bold rounded-lg transition-colors shrink-0"
                >
                  Join
                </button>
              </form>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-800 flex flex-col sm:flex-row justify-between items-center text-[11px] text-gray-500 space-y-4 sm:space-y-0">
            <div>
              © 2026 TRUE FORMULA Inc. — Editorial Apothecary & Bio-Luxe Sport Nutrition. All rights reserved.
            </div>
            <div className="flex items-center space-x-1">
              <span>Crafted with precision</span>
              <Heart className="w-3 h-3 text-red-500 fill-red-500 inline" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
