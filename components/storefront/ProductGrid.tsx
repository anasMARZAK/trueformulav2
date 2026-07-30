'use client';

import React, { useState, useMemo } from 'react';
import { Search, SlidersHorizontal, RotateCcw, Sparkles } from 'lucide-react';
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

  const [maxPriceFilter, setMaxPriceFilter] = useState<number>(200);

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
        if (maxPriceFilter > 0 && priceNum > maxPriceFilter) {
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
  }, [products, activeCategory, activeQuery, sortBy, language]);

  const handleResetFilters = () => {
    handleCategoryClick('all');
    handleSearchInput('');
    setSortBy('featured');
  };

  return (
    <section id="catalog" className="py-16 bg-[#FDFBF7] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-[#C6DFD1] shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-[#2E5A44]" />
            <span className="text-[11px] uppercase tracking-[0.2em] font-bold text-[#2E5A44] font-sans">
              {t.catalog.title}
            </span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[#111827] font-bold tracking-tight">
            {t.catalog.title}
          </h2>
          <p className="text-[#4B5563] font-sans font-light text-base leading-relaxed">
            {t.catalog.subtitle}
          </p>
        </div>

        {/* Filter Bar: Categories, Search, Sort */}
        <div className="space-y-4 bg-[#FDFBF7] p-5 sm:p-6 rounded-[2rem] border border-[#EAF2ED] shadow-luxe-card">
          {/* Category Tabs — Hero Pill Button Style */}
          <div className="flex items-center space-x-2.5 overflow-x-auto pb-3 no-scrollbar border-b border-[#EAF2ED]">
            {categoryTabs.map((tab) => {
              const isActive = activeCategory === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => handleCategoryClick(tab.key)}
                  className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all duration-300 whitespace-nowrap cursor-pointer font-sans ${
                    isActive
                      ? 'bg-[#111827] text-white shadow-md scale-105'
                      : 'bg-white border border-[#C6DFD1] text-[#111827] hover:border-[#2E5A44] hover:text-[#2E5A44] hover:bg-[#EAF2ED]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Search & Sort Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            {/* Search Input */}
            <div className="relative w-full sm:max-w-md">
              <input
                type="text"
                value={activeQuery}
                onChange={(e) => handleSearchInput(e.target.value)}
                placeholder={t.catalog.searchPlaceholder}
                className="w-full pl-10 pr-4 py-2.5 bg-[#FDFBF7] border border-[#C6DFD1] rounded-lg text-xs font-sans placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2E5A44]"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
              <SlidersHorizontal className="w-4 h-4 text-gray-500 shrink-0" />
              <label className="text-xs text-gray-500 font-medium shrink-0">
                {t.catalog.sortLabel}:
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-[#FDFBF7] border border-[#C6DFD1] text-xs font-semibold text-[#111827] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2E5A44] cursor-pointer"
              >
                <option value="featured">{t.catalog.sortOptions.featured}</option>
                <option value="popularity">{language === 'fr' ? 'Popularité' : 'Popularity'}</option>
                <option value="priceAsc">{t.catalog.sortOptions.priceAsc}</option>
                <option value="priceDesc">{t.catalog.sortOptions.priceDesc}</option>
                <option value="nameAsc">{t.catalog.sortOptions.nameAsc}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Counter */}
        <div className="flex justify-between items-center px-1 text-xs text-gray-500 font-medium">
          <span>
            Showing <strong className="text-[#111827] font-bold">{filteredProducts.length}</strong> formulations
          </span>
          {(activeCategory !== 'all' || activeQuery) && (
            <button
              onClick={handleResetFilters}
              className="text-[#2E5A44] hover:underline flex items-center space-x-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{t.catalog.resetFilters}</span>
            </button>
          )}
        </div>

        {/* Product Cards Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onQuickView={(p) => setSelectedProductForModal(p)}
              />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="bg-white rounded-2xl p-12 border border-[#EAF2ED] text-center max-w-md mx-auto space-y-4 shadow-xs">
            <div className="w-12 h-12 rounded-full bg-[#EAF2ED] text-[#2E5A44] flex items-center justify-center mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-xl font-bold text-[#111827]">
              {t.catalog.emptyTitle}
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              {t.catalog.emptyText}
            </p>
            <button
              onClick={handleResetFilters}
              className="px-5 py-2.5 bg-[#2E5A44] text-white text-xs font-semibold rounded-lg hover:bg-[#244736] transition-colors inline-flex items-center space-x-2"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t.catalog.resetFilters}</span>
            </button>
          </div>
        )}
      </div>

      {/* Product Detail Modal */}
      {selectedProductForModal && (
        <ProductDetailModal
          product={selectedProductForModal}
          onClose={() => setSelectedProductForModal(null)}
        />
      )}
    </section>
  );
}
