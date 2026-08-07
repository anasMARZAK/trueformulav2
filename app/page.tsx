'use client';

import React, { useState } from 'react';
import { Header } from '@/components/storefront/Header';
import { Hero } from '@/components/storefront/Hero';
import { ValueProps } from '@/components/storefront/ValueProps';
import { Protocol } from '@/components/storefront/Protocol';
import { Reviews } from '@/components/storefront/Reviews';
import { ProductGrid } from '@/components/storefront/ProductGrid';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { CheckoutModal } from '@/components/cart/CheckoutModal';
import { MOCK_PRODUCTS } from '@/lib/db/mock-data';
import { useCartStore } from '@/lib/store/useCartStore';
import { useProductsQuery } from '@/lib/hooks/useProductsQuery';
import { SiteFooter } from '@/components/storefront/SiteFooter';

export default function HomePage() {
  const openCart = useCartStore((state) => state.openCart);
  const { data: fetchedProducts, isLoading } = useProductsQuery();
  const products = (fetchedProducts && fetchedProducts.length > 0) ? fetchedProducts : MOCK_PRODUCTS;

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

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
          isLoading={isLoading}
        />

        {/* Why True Formula — Value Propositions */}
        <ValueProps />

        {/* How the subscription actually works */}
        <Protocol onExploreClick={handleScrollToCatalog} />

        {/* Customer Reviews & Testimonials */}
        <Reviews />

        {/* Cart Drawer & Checkout Modal */}
        <CartDrawer onCheckout={() => setIsCheckoutOpen(true)} />
        <CheckoutModal isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} />
      </div>

      {/* Apothecary Footer */}
      <SiteFooter
        onCategorySelect={(cat) => {
          setSelectedCategory(cat);
          handleScrollToCatalog();
        }}
      />
    </div>
  );
}
