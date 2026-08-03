'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, ShoppingBag, User, Globe, Shield, Sparkles, X, ShieldAlert, LogOut, ChevronDown, Menu, FlaskConical, ShieldCheck, Leaf, Truck, Beaker, Award, Zap, RefreshCw } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/useLanguage';
import { useCartStore } from '@/lib/store/useCartStore';
import { useAuth } from '@/lib/auth/AuthContext';
import { AuthModal } from '@/components/auth/AuthModal';

interface HeaderProps {
  onSearchChange?: (query: string) => void;
  onCategorySelect?: (category: string) => void;
  onOpenCart?: () => void;
  currentSearchQuery?: string;
  selectedCategory?: string;
}

export function Header({
  onSearchChange,
  onCategorySelect,
  onOpenCart,
  currentSearchQuery = '',
  selectedCategory = 'all',
}: HeaderProps) {
  const { language, setLanguage, t } = useLanguage();
  const { user, role, isLoggedIn, logout } = useAuth();
  const cartItemsCount = useCartStore((state) => state.getItemCount());
  const storeOpenCart = useCartStore((state) => state.openCart);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Track scroll to hide top announcement bar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 60);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleOpenCartClick = () => {
    if (onOpenCart) {
      onOpenCart();
    } else {
      storeOpenCart();
    }
  };

  const categories = [
    { key: 'all', label: t.header.categories.all },
    { key: 'whey', label: t.header.categories.whey },
    { key: 'creatine', label: t.header.categories.creatine },
    { key: 'wellness', label: t.header.categories.wellness },
    { key: 'snacks', label: t.header.categories.snacks },
    { key: 'plant', label: t.header.categories.plant },
    { key: 'preworkout', label: t.header.categories.preworkout },
    { key: 'accessories', label: t.header.categories.accessories },
  ];

  const handleLanguageToggle = (lang: 'en' | 'fr') => {
    setLanguage(lang);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#FDFBF7]/95 backdrop-blur-md border-b border-[#EAF2ED]">
        {/* Top Banner — Infinite Animated Scrolling Marquee Ticker */}
        <div
          className={`bg-[#2E5A44] text-white text-[11px] font-bold tracking-wider uppercase overflow-hidden transition-all duration-300 ease-in-out border-b border-[#1E3A2B] ${
            isScrolled ? 'max-h-0 py-0 opacity-0' : 'max-h-12 py-2 opacity-100'
          }`}
        >
          <div className="w-full overflow-hidden select-none">
            <div className="animate-marquee-slow flex items-center space-x-8">
              {/* First Track Copy */}
              {[
                { Icon: Sparkles, text: language === 'fr' ? '-20% SUR LES ABONNEMENTS MENSUELS' : '20% OFF MONTHLY SUBSCRIPTIONS — CANCEL ANYTIME' },
                { Icon: FlaskConical, text: language === 'fr' ? 'ISOLAT DE WHEY NATIF 100% FILTRÉ À FROID' : '100% COLD-FILTERED NATIVE WHEY ISOLATE' },
                { Icon: ShieldCheck, text: language === 'fr' ? 'TESTÉ EN LABORATOIRE INDÉPENDANT TIERCE PARTIE' : '3RD-PARTY INDEPENDENT LABORATORY TESTED FOR PURITY' },
                { Icon: Leaf, text: language === 'fr' ? 'ZÉRO ADDITIFS, ÉDULCORANTS OU GOMMES ARTIFICIELLES' : 'ZERO ARTIFICIAL FILLERS, SWEETENERS, OR GUM BINDERS' },
                { Icon: Truck, text: language === 'fr' ? 'LIVRAISON EXPRESS GRATUITE DÈS 75$' : 'FREE EXPRESS APOTHECARY SHIPPING ON ORDERS OVER $75' },
                { Icon: Beaker, text: language === 'fr' ? 'CRÉATINE MICRONISÉE PURE QUALITÉ PHARMACEUTIQUE 200 MESH' : 'PHARMACEUTICAL-GRADE 200 MESH MICRONIZED CREATINE' },
                { Icon: Award, text: language === 'fr' ? '10 000MG COLLAGÈNE MARIN BIO-ACTIF HYDROLYSÉ' : '10,000MG BIO-ACTIVE HYDROLYZED MARINE COLLAGEN PEPTIDES' },
                { Icon: Zap, text: language === 'fr' ? 'PROTÉINE VÉGÉTALE BIO 100% FERMENTÉE' : '100% FERMENTED ORGANIC PLANT-BASED AMINO ACIDS' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center space-x-2 shrink-0">
                  <item.Icon className="w-3.5 h-3.5 text-[#C6DFD1] shrink-0" />
                  <span className="text-[#C6DFD1] font-semibold">{item.text}</span>
                  <span className="text-emerald-300/40 text-xs px-2">•</span>
                </div>
              ))}

              {/* Duplicated Track Copy for Infinite Seamless Loop */}
              {[
                { Icon: Sparkles, text: language === 'fr' ? '-20% SUR LES ABONNEMENTS MENSUELS' : '20% OFF MONTHLY SUBSCRIPTIONS — CANCEL ANYTIME' },
                { Icon: FlaskConical, text: language === 'fr' ? 'ISOLAT DE WHEY NATIF 100% FILTRÉ À FROID' : '100% COLD-FILTERED NATIVE WHEY ISOLATE' },
                { Icon: ShieldCheck, text: language === 'fr' ? 'TESTÉ EN LABORATOIRE INDÉPENDANT TIERCE PARTIE' : '3RD-PARTY INDEPENDENT LABORATORY TESTED FOR PURITY' },
                { Icon: Leaf, text: language === 'fr' ? 'ZÉRO ADDITIFS, ÉDULCORANTS OU GOMMES ARTIFICIELLES' : 'ZERO ARTIFICIAL FILLERS, SWEETENERS, OR GUM BINDERS' },
                { Icon: Truck, text: language === 'fr' ? 'LIVRAISON EXPRESS GRATUITE DÈS 75$' : 'FREE EXPRESS APOTHECARY SHIPPING ON ORDERS OVER $75' },
                { Icon: Beaker, text: language === 'fr' ? 'CRÉATINE MICRONISÉE PURE QUALITÉ PHARMACEUTIQUE 200 MESH' : 'PHARMACEUTICAL-GRADE 200 MESH MICRONIZED CREATINE' },
                { Icon: Award, text: language === 'fr' ? '10 000MG COLLAGÈNE MARIN BIO-ACTIF HYDROLYSÉ' : '10,000MG BIO-ACTIVE HYDROLYZED MARINE COLLAGEN PEPTIDES' },
                { Icon: Zap, text: language === 'fr' ? 'PROTÉINE VÉGÉTALE BIO 100% FERMENTÉE' : '100% FERMENTED ORGANIC PLANT-BASED AMINO ACIDS' },
              ].map((item, idx) => (
                <div key={`dup-${idx}`} className="flex items-center space-x-2 shrink-0">
                  <item.Icon className="w-3.5 h-3.5 text-[#C6DFD1] shrink-0" />
                  <span className="text-[#C6DFD1] font-semibold">{item.text}</span>
                  <span className="text-emerald-300/40 text-xs px-2">•</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Header Container */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo Section */}
            <Link href="/" className="group flex flex-col focus:outline-none">
              <span className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#111827] group-hover:text-[#2E5A44] transition-colors">
                {t.header.logoTitle}
              </span>
              <span className="text-[9px] uppercase tracking-[0.25em] text-[#2E5A44] font-semibold">
                {t.header.logoTagline}
              </span>
            </Link>

            {/* Search Bar - Desktop */}
            <div className="hidden md:flex flex-1 max-w-md mx-8 relative">
              <div className="relative w-full">
                <input
                  type="text"
                  value={currentSearchQuery}
                  onChange={(e) => {
                    onSearchChange?.(e.target.value);
                    if (e.target.value.trim()) {
                      const catalogEl = document.getElementById('catalog');
                      if (catalogEl && window.scrollY < 300) {
                        catalogEl.scrollIntoView({ behavior: 'smooth' });
                      }
                    }
                  }}
                  placeholder={t.header.searchPlaceholder}
                  className="w-full pl-10 pr-10 py-2.5 bg-[#F5F0E4]/80 hover:bg-[#F5F0E4] border border-[#C6DFD1] rounded-full text-xs font-sans placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2E5A44]/30 focus:border-[#2E5A44] transition-all shadow-2xs"
                />
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                {currentSearchQuery && (
                  <button
                    onClick={() => onSearchChange?.('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#111827] p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Actions & Utilities */}
            <div className="flex items-center space-x-3 sm:space-x-4">
              {/* Search Icon Toggle for Mobile */}
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="md:hidden p-2 text-gray-600 hover:text-[#2E5A44] rounded-full hover:bg-[#EAF2ED]"
                aria-label="Toggle search"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Language Switcher Pill */}
              <div className="flex items-center bg-[#EAF2ED] p-1 rounded-full border border-[#C6DFD1]">
                <button
                  onClick={() => handleLanguageToggle('en')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-full transition-all ${
                    language === 'en'
                      ? 'bg-[#2E5A44] text-white shadow-sm'
                      : 'text-gray-600 hover:text-[#111827]'
                  }`}
                >
                  EN
                </button>
                <button
                  onClick={() => handleLanguageToggle('fr')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-full transition-all ${
                    language === 'fr'
                      ? 'bg-[#2E5A44] text-white shadow-sm'
                      : 'text-gray-600 hover:text-[#111827]'
                  }`}
                >
                  FR
                </button>
              </div>

              {/* Admin Link (Only visible if user is an Admin or in Dev mode) */}
              {(role === 'admin' || process.env.NODE_ENV !== 'production') && (
                <Link
                  href="/admin"
                  className={`p-2 rounded-full transition-colors flex items-center space-x-1 ${
                    role === 'admin'
                      ? 'text-amber-700 bg-amber-50 hover:bg-amber-100 font-bold border border-amber-200'
                      : 'text-gray-700 hover:text-[#2E5A44] hover:bg-[#EAF2ED]'
                  }`}
                  title={t.header.admin}
                >
                  <ShieldAlert className="w-5 h-5" />
                  <span className="hidden xl:inline text-xs font-semibold">{t.header.admin}</span>
                </Link>
              )}

              {/* Single Clean Account Action (Logged Out: Sign In Link -> /login | Logged In: User Profile Menu) */}
              {isLoggedIn && user ? (
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#EAF2ED] hover:bg-[#DDF0E5] border border-[#C6DFD1] rounded-full text-xs font-medium text-gray-800 transition-colors cursor-pointer"
                  >
                    <User className="w-4 h-4 text-[#2E5A44]" />
                    <span className="font-semibold text-xs text-[#111827]">
                      {user.fullName?.split(' ')[0] || user.email.split('@')[0]}
                    </span>
                    <ChevronDown className="w-3 h-3 text-gray-500" />
                  </button>

                  {/* Logged-In User Dropdown Menu */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-[#C6DFD1] rounded-2xl shadow-xl py-2 z-50 animate-in fade-in duration-150">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                          {t.auth.loggedInAs}
                        </p>
                        <p className="text-xs font-bold text-gray-900 truncate">{user?.email}</p>
                      </div>

                      <div className="py-1 border-b border-gray-100 px-4 py-1.5 text-xs text-gray-500 font-mono">
                        Role: <span className="font-bold text-[#2E5A44] uppercase">{role}</span>
                      </div>

                      <div className="pt-1">
                        <Link
                          href="/account"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="w-full px-4 py-2 text-left text-xs text-gray-700 hover:bg-[#EAF2ED] flex items-center space-x-2 font-medium"
                        >
                          <User className="w-3.5 h-3.5 text-[#2E5A44]" />
                          <span>Account & Subscriptions</span>
                        </Link>
                        <button
                          onClick={() => {
                            logout();
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full px-4 py-2 text-left text-xs text-red-600 hover:bg-red-50 flex items-center space-x-2 font-medium cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>{t.auth.logout}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/login"
                  className="px-3.5 py-1.5 text-gray-700 hover:text-[#2E5A44] hover:bg-[#EAF2ED] rounded-full transition-colors flex items-center space-x-1.5 text-xs font-semibold"
                >
                  <User className="w-4 h-4 text-[#2E5A44]" />
                  <span>{language === 'fr' ? 'Se connecter' : 'Sign In'}</span>
                </Link>
              )}

              {/* Mobile Hamburger Trigger */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 text-gray-700 hover:text-[#2E5A44] hover:bg-[#EAF2ED] rounded-full transition-colors"
                aria-label="Toggle mobile menu"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              {/* Cart Drawer Trigger */}
              <button
                onClick={handleOpenCartClick}
                className="relative p-2 text-gray-700 hover:text-[#2E5A44] hover:bg-[#EAF2ED] rounded-full transition-colors flex items-center space-x-1.5 focus:outline-none"
                aria-label={t.header.cart}
              >
                <ShoppingBag className="w-5 h-5" />
                <span className="hidden lg:inline text-xs font-semibold">{t.header.cart}</span>
                {cartItemsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#2E5A44] text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center border-2 border-[#FDFBF7] shadow-sm animate-pulse">
                    {cartItemsCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Mobile Search Bar Dropdown */}
          {isSearchOpen && (
            <div className="md:hidden pb-4">
              <div className="relative">
                <input
                  type="text"
                  value={currentSearchQuery}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                  placeholder={t.header.searchPlaceholder}
                  className="w-full pl-10 pr-10 py-2.5 bg-white border border-[#C6DFD1] rounded-full text-xs font-sans focus:outline-none focus:ring-2 focus:ring-[#2E5A44]"
                />
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                {currentSearchQuery && (
                  <button
                    onClick={() => onSearchChange?.('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Mobile Slide-Out Drawer */}
          {isMobileMenuOpen && (
            <div className="md:hidden fixed inset-0 top-20 z-50 bg-black/50 backdrop-blur-xs flex flex-col justify-between animate-in fade-in duration-200">
              <div className="bg-[#FDFBF7] p-6 space-y-6 border-b border-[#C6DFD1] shadow-2xl max-h-[80vh] overflow-y-auto">
                {/* Search in mobile drawer */}
                <div className="relative">
                  <input
                    type="text"
                    value={currentSearchQuery}
                    onChange={(e) => onSearchChange?.(e.target.value)}
                    placeholder={t.header.searchPlaceholder}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#C6DFD1] rounded-full text-xs font-sans focus:outline-none focus:ring-2 focus:ring-[#2E5A44]"
                  />
                  <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>

                {/* Collections Navigation */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 font-sans">
                    {t.header.categories.all} Collections
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {categories.map((cat) => (
                      <button
                        key={cat.key}
                        onClick={() => {
                          onCategorySelect?.(cat.key);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold text-left transition-all ${
                          selectedCategory === cat.key
                            ? 'bg-[#2E5A44] text-white shadow-sm'
                            : 'bg-white border border-[#EAF2ED] text-gray-800 hover:border-[#2E5A44]'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Account & Admin Direct Links */}
                <div className="space-y-2 pt-2 border-t border-[#EAF2ED]">
                  <Link
                    href="/account"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full py-2.5 px-4 bg-white border border-[#C6DFD1] rounded-xl text-xs font-bold text-gray-800 flex items-center justify-between"
                  >
                    <span className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-[#2E5A44]" />
                      <span>{t.header.account}</span>
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono uppercase">Portal</span>
                  </Link>

                  <Link
                    href="/admin"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full py-2.5 px-4 bg-[#111827] text-white rounded-xl text-xs font-bold flex items-center justify-between shadow-xs"
                  >
                    <span className="flex items-center space-x-2">
                      <ShieldAlert className="w-4 h-4 text-amber-400" />
                      <span>{t.header.admin}</span>
                    </span>
                    <span className="text-[10px] text-amber-400 font-mono uppercase">{role}</span>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Auth Modal */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
}
