'use client';

import React, { useState, useMemo } from 'react';
import { Search, RotateCcw, X } from 'lucide-react';
import { type Product } from '@/lib/db/schema';
import { useLanguage } from '@/lib/i18n/useLanguage';
import { ProductCard } from './ProductCard';
import { ProductDetailModal } from './ProductDetailModal';
import { ProductCardSkeleton } from '@/components/ui/skeletons/ProductCardSkeleton';

interface ProductGridProps {
  products: Product[];
  selectedCategory?: string;
  onCategoryChange?: (cat: string) => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  isLoading?: boolean;
}

export function ProductGrid({
  products,
  selectedCategory = 'all',
  onCategoryChange,
  searchQuery = '',
  onSearchChange,
  isLoading = false,
}: ProductGridProps) {
  const { language, t } = useLanguage();

  const [internalCategory, setInternalCategory] = useState<string>(selectedCategory);
  const [internalQuery, setInternalQuery] = useState<string>(searchQuery);
  const [sortBy, setSortBy] = useState<'featured' | 'popularity' | 'priceAsc' | 'priceDesc' | 'nameAsc'>('featured');
  const [selectedProductForModal, setSelectedProductForModal] = useState<Product | null>(null);

  const activeCategory = onCategoryChange ? selectedCategory : internalCategory;
  const activeQuery = onSearchChange ? searchQuery : internalQuery;

  const handleCategoryClick = (cat: string) => {
    if (onCategoryChange) {
      onCategoryChange(cat);
    } else {
      setInternalCategory(cat);
    }
  };

  const handleSearchInput = (query: string) => {
    if (onSearchChange) {
      onSearchChange(query);
    } else {
      setInternalQuery(query);
    }
  };

  const categoryTabs = [
    { key: 'all', label: t.catalog.categories.all },
    { key: 'whey', label: t.catalog.categories.whey },
    { key: 'creatine', label: t.catalog.categories.creatine },
    { key: 'wellness', label: t.catalog.categories.wellness },
    { key: 'snacks', label: t.catalog.categories.snacks },
    { key: 'plant', label: t.catalog.categories.plant },
    { key: 'preworkout', label: t.catalog.categories.preworkout },
    { key: 'accessories', label: t.catalog.categories.accessories },
  ];

  // Ceiling for the price filter, derived from the catalog rather than hardcoded,
  // so the slider always spans the real range of what is on sale.
  const priceCeiling = useMemo(() => {
    const highest = products.reduce((max, p) => Math.max(max, parseFloat(p.price) || 0), 0);
    return Math.max(10, Math.ceil(highest / 10) * 10);
  }, [products]);

  const [maxPriceFilter, setMaxPriceFilter] = useState<number | null>(null);
  const effectiveMaxPrice = maxPriceFilter ?? priceCeiling;

  // How many products sit in each category, ignoring the category filter itself so
  // the counts stay stable as you click between tabs.
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: 0 };
    products.forEach((prod) => {
      if (parseFloat(prod.price) > effectiveMaxPrice) return;
      if (activeQuery.trim()) {
        const q = activeQuery.toLowerCase();
        const haystack = [
          prod.nameEn,
          prod.nameFr,
          prod.descriptionEn,
          prod.descriptionFr,
          JSON.stringify(prod.flavors),
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return;
      }
      counts.all += 1;
      counts[prod.category] = (counts[prod.category] || 0) + 1;
    });
    return counts;
  }, [products, activeQuery, effectiveMaxPrice]);

  // Filtering & Sorting Logic
  const filteredProducts = useMemo(() => {
    return products
      .filter((prod) => {
        // Category filter
        if (activeCategory !== 'all' && prod.category !== activeCategory) {
          return false;
        }

        // Price range filter
        const priceNum = parseFloat(prod.price);
        if (priceNum > effectiveMaxPrice) {
          return false;
        }

        // Search query filter
        if (activeQuery.trim()) {
          const q = activeQuery.toLowerCase();
          const nameEn = prod.nameEn.toLowerCase();
          const nameFr = prod.nameFr.toLowerCase();
          const descEn = prod.descriptionEn.toLowerCase();
          const descFr = prod.descriptionFr.toLowerCase();
          const flavorsStr = JSON.stringify(prod.flavors).toLowerCase();

          return (
            nameEn.includes(q) ||
            nameFr.includes(q) ||
            descEn.includes(q) ||
            descFr.includes(q) ||
            flavorsStr.includes(q)
          );
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'popularity') {
          const popA = (a as any).popularityScore ?? 50;
          const popB = (b as any).popularityScore ?? 50;
          return popB - popA;
        }
        if (sortBy === 'priceAsc') {
          return parseFloat(a.price) - parseFloat(b.price);
        }
        if (sortBy === 'priceDesc') {
          return parseFloat(b.price) - parseFloat(a.price);
        }
        if (sortBy === 'nameAsc') {
          const nameA = language === 'fr' ? a.nameFr : a.nameEn;
          const nameB = language === 'fr' ? b.nameFr : b.nameEn;
          return nameA.localeCompare(nameB);
        }
        // Default: featured first, then standard order
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        return 0;
      });
  }, [products, activeCategory, activeQuery, sortBy, language, effectiveMaxPrice]);

  const handleResetFilters = () => {
    handleCategoryClick('all');
    handleSearchInput('');
    setSortBy('featured');
    setMaxPriceFilter(null);
  };

  const hasActiveFilters =
    activeCategory !== 'all' || Boolean(activeQuery) || maxPriceFilter !== null;

  return (
    <section id="catalog" className="py-20 sm:py-24 bg-[#FDFBF7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ── Section header ─────────────────────────────────────────────── */}
        <div className="max-w-2xl mb-10">
          <div className="flex items-center gap-3 mb-5">
            <span className="w-10 h-px bg-[#2E5A44]/40" />
            <span className="text-[11px] uppercase tracking-[0.28em] font-semibold text-[#2E5A44] font-sans">
              {t.catalog.badge}
            </span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[#111827] font-bold tracking-tight text-balance">
            {t.catalog.title}
          </h2>
          <p className="mt-4 text-[#4B5563] font-sans font-light text-base leading-relaxed text-pretty">
            {t.catalog.subtitle}
          </p>
        </div>

        {/* ── Filter rail ────────────────────────────────────────────────── */}
        <div className="space-y-5">
          {/* Category tabs with live counts */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar rail-fade pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
            {categoryTabs.map((tab) => {
              const isActive = activeCategory === tab.key;
              const count = categoryCounts[tab.key] || 0;
              return (
                <button
                  key={tab.key}
                  onClick={() => handleCategoryClick(tab.key)}
                  disabled={count === 0 && !isActive}
                  className={`shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold transition-all duration-300 whitespace-nowrap font-sans focus-luxe ${
                    isActive
                      ? 'bg-[#111827] text-white shadow-luxe'
                      : count === 0
                        ? 'bg-transparent border border-[#E5E2D9] text-[#C4C0B6] cursor-not-allowed'
                        : 'bg-white border border-[#E5E2D9] text-[#111827] hover:border-[#2E5A44] hover:text-[#2E5A44] cursor-pointer'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`font-mono text-[10px] ${isActive ? 'text-[#C6DFD1]' : 'text-[#9CA3AF]'}`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search · price · sort */}
          <div className="flex flex-col lg:flex-row lg:items-center gap-4 p-4 sm:p-5 rounded-2xl bg-white border border-[#EAF2ED] shadow-luxe-card">
            {/* Search */}
            <div className="relative flex-1 min-w-0">
              <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={activeQuery}
                onChange={(e) => handleSearchInput(e.target.value)}
                placeholder={t.catalog.searchPlaceholder}
                className="w-full pl-10 pr-9 py-2.5 bg-[#FDFBF7] border border-[#E5E2D9] rounded-full text-xs font-sans placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#2E5A44]/30 focus:border-[#2E5A44] transition-all"
              />
              {activeQuery && (
                <button
                  onClick={() => handleSearchInput('')}
                  aria-label={t.catalog.resetFilters}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#9CA3AF] hover:text-[#111827] rounded-full"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Price ceiling — previously a hidden state capped at $200 with no control */}
            <div className="flex items-center gap-3 shrink-0 lg:border-l lg:border-[#EAF2ED] lg:pl-4">
              <label
                htmlFor="max-price"
                className="text-[11px] font-semibold text-[#6B7280] whitespace-nowrap font-sans"
              >
                {t.catalog.maxPriceLabel}
              </label>
              <input
                id="max-price"
                type="range"
                min={10}
                max={priceCeiling}
                step={5}
                value={effectiveMaxPrice}
                onChange={(e) => setMaxPriceFilter(Number(e.target.value))}
                className="w-28 sm:w-32 accent-[#2E5A44] cursor-pointer"
              />
              <span className="font-mono text-xs font-bold text-[#111827] w-12 tabular-nums">
                ${effectiveMaxPrice}
              </span>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2 shrink-0 lg:border-l lg:border-[#EAF2ED] lg:pl-4">
              <label htmlFor="sort-by" className="sr-only">
                {t.catalog.sortLabel}
              </label>
              <select
                id="sort-by"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="bg-[#FDFBF7] border border-[#E5E2D9] text-xs font-semibold text-[#111827] rounded-full px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2E5A44]/30 focus:border-[#2E5A44] cursor-pointer font-sans"
              >
                <option value="featured">{t.catalog.sortOptions.featured}</option>
                <option value="popularity">{t.catalog.sortOptions.popularity}</option>
                <option value="priceAsc">{t.catalog.sortOptions.priceAsc}</option>
                <option value="priceDesc">{t.catalog.sortOptions.priceDesc}</option>
                <option value="nameAsc">{t.catalog.sortOptions.nameAsc}</option>
              </select>
            </div>
          </div>

          {/* Results counter */}
          <div
            className="flex justify-between items-center px-1 text-xs text-[#6B7280] font-sans"
            aria-live="polite"
          >
            <span>
              <strong className="text-[#111827] font-bold font-mono">{filteredProducts.length}</strong>{' '}
              {t.catalog.resultsCount}
            </span>
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="text-[#2E5A44] hover:underline flex items-center gap-1.5 font-semibold focus-luxe rounded"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{t.catalog.resetFilters}</span>
              </button>
            )}
          </div>
        </div>

        {/* ── Grid ───────────────────────────────────────────────────────── */}
        <div className="mt-8">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onQuickView={(p) => setSelectedProductForModal(p)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 border border-[#EAF2ED] text-center max-w-md mx-auto space-y-4 shadow-luxe-card">
              <div className="w-12 h-12 rounded-full bg-[#EAF2ED] text-[#2E5A44] flex items-center justify-center mx-auto">
                <Search className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-[#111827]">{t.catalog.emptyTitle}</h3>
              <p className="text-[13px] text-[#6B7280] leading-relaxed font-sans">
                {t.catalog.emptyText}
              </p>
              <button
                onClick={handleResetFilters}
                className="px-6 py-3 bg-[#111827] hover:bg-[#2E5A44] text-white text-xs font-bold uppercase tracking-[0.12em] rounded-full transition-colors inline-flex items-center gap-2 focus-luxe font-sans"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t.catalog.resetFilters}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {selectedProductForModal && (
        <ProductDetailModal
          product={selectedProductForModal}
          onClose={() => setSelectedProductForModal(null)}
        />
      )}
    </section>
  );
}
