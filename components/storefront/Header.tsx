'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  ShoppingBag,
  User,
  Sparkles,
  X,
  ShieldAlert,
  LogOut,
  ChevronDown,
  Menu,
  FlaskConical,
  ShieldCheck,
  Leaf,
  Truck,
  Beaker,
  Award,
  Zap,
  Globe,
  LayoutDashboard,
} from 'lucide-react';
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

/** Ticker announcement items rotated automatically. */
const TICKER_ITEMS = [
  { Icon: Sparkles, en: '20% OFF MONTHLY SUBSCRIPTIONS — CANCEL ANYTIME', fr: '-20% SUR LES ABONNEMENTS MENSUELS' },
  { Icon: FlaskConical, en: '100% COLD-FILTERED NATIVE WHEY ISOLATE', fr: 'ISOLAT DE WHEY NATIF 100% FILTRÉ À FROID' },
  { Icon: ShieldCheck, en: '3RD-PARTY INDEPENDENT LABORATORY TESTED', fr: 'TESTÉ EN LABORATOIRE INDÉPENDANT' },
  { Icon: Leaf, en: 'ZERO ARTIFICIAL FILLERS OR SWEETENERS', fr: 'ZÉRO ADDITIFS OU ÉDULCORANTS ARTIFICIELS' },
  { Icon: Truck, en: 'FREE EXPRESS SHIPPING OVER $75', fr: 'LIVRAISON EXPRESS GRATUITE DÈS 75$' },
  { Icon: Beaker, en: 'PHARMACEUTICAL-GRADE 200 MESH CREATINE', fr: 'CRÉATINE QUALITÉ PHARMACEUTIQUE 200 MESH' },
  { Icon: Award, en: '10,000MG HYDROLYZED MARINE COLLAGEN', fr: '10 000MG COLLAGÈNE MARIN HYDROLYSÉ' },
  { Icon: Zap, en: '100% FERMENTED ORGANIC PLANT PROTEIN', fr: 'PROTÉINE VÉGÉTALE BIO 100% FERMENTÉE' },
];

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

  // Elevate the sticky bar once the page has moved. This only swaps a shadow —
  // it deliberately changes no box dimensions, so it cannot shift layout.
  useEffect(() => {
    let frame = 0;
    const handleScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        setIsScrolled(window.scrollY > 8);
        frame = 0;
      });
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (frame) cancelAnimationFrame(frame);
    };
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
      {/* Inline CSS animation fallback to guarantee marquee rotation */}
      <style jsx global>{`
        @keyframes tfMarqueeScroll {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
        .animate-tf-marquee {
          display: flex !important;
          width: max-content !important;
          animation: tfMarqueeScroll 50s linear infinite !important;
          will-change: transform;
        }
        .animate-tf-marquee:hover {
          animation-play-state: paused !important;
        }
      `}</style>

      {/* ── Announcement ticker ───────────────────────────────────────────────
          Sits in normal document flow ABOVE the sticky bar rather than inside
          it. It previously collapsed its own height on scroll while nested in
          the sticky header, which resized the sticky element mid-scroll — the
          nav appeared to jump on its own and fought the smooth-scroll easing.
          Scrolling now simply carries it off-screen: zero layout shift. */}
      <div className="bg-[#2E5A44] text-white text-[11px] font-bold tracking-wider uppercase overflow-hidden border-b border-[#1E3A2B] py-2">
        <div className="w-full overflow-hidden select-none">
          <div className="animate-tf-marquee flex items-center space-x-8">
            {/* Rendered 4 times so it wraps seamlessly on all screen sizes */}
            {[0, 1, 2, 3].map((copy) =>
              TICKER_ITEMS.map((item, idx) => (
                <div key={`${copy}-${idx}`} className="flex items-center space-x-2 shrink-0" aria-hidden={copy > 0}>
                  <item.Icon className="w-3.5 h-3.5 text-[#C6DFD1] shrink-0" />
                  <span className="text-[#C6DFD1] font-semibold text-xs whitespace-nowrap">
                    {language === 'fr' ? item.fr : item.en}
                  </span>
                  <span className="text-[#C6DFD1]/30 text-xs px-2">•</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <header
        className={`sticky top-0 z-40 bg-[#FDFBF7]/95 backdrop-blur-md border-b transition-shadow duration-300 ${
          isScrolled ? 'border-[#E5E2D9] shadow-luxe-card' : 'border-[#EAF2ED] shadow-none'
        }`}
      >
        {/* Main Header Container */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Left: Mobile Menu Trigger + Brand Logo */}
            <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 text-gray-700 hover:text-[#2E5A44] hover:bg-[#EAF2ED] rounded-full transition-colors focus:outline-none"
                aria-label="Toggle mobile menu"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              <Link href="/" className="group flex flex-col focus:outline-none py-1">
                <span className="font-serif text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-[#111827] group-hover:text-[#2E5A44] transition-colors leading-none">
                  {t.header.logoTitle}
                </span>
                <span className="text-[8px] sm:text-[9px] uppercase tracking-[0.2em] text-[#2E5A44] font-semibold hidden xs:block mt-1 leading-none">
                  {t.header.logoTagline}
                </span>
              </Link>
            </div>

            {/* Center: Search Bar (Desktop Only) */}
            <div className="hidden md:flex flex-1 max-w-md mx-6 lg:mx-8 relative">
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

            {/* Right: Actions & Utilities */}
            <div className="flex items-center space-x-1.5 sm:space-x-3">
              {/* Search Toggle (Mobile Only) */}
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="md:hidden p-2 text-gray-600 hover:text-[#2E5A44] rounded-full hover:bg-[#EAF2ED] transition-colors"
                aria-label="Toggle search"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Language Switcher (Desktop Only - Mobile version inside drawer) */}
              <div className="hidden sm:flex items-center bg-[#EAF2ED] p-1 rounded-full border border-[#C6DFD1]">
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

              {/* Admin Link (Desktop Only) */}
              {(role === 'admin' || process.env.NODE_ENV !== 'production') && (
                <Link
                  href="/admin"
                  className={`hidden sm:flex p-2 rounded-full transition-colors items-center space-x-1 ${
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

              {/* User Account Button (Desktop Only) */}
              <div className="hidden sm:block">
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
                          {/* Admins have no customer subscriptions of their own —
                              everything they need lives in the dashboard, so the
                              member portal entry is replaced rather than shown
                              alongside it. */}
                          {role === 'admin' ? (
                            <Link
                              href="/admin"
                              onClick={() => setIsUserMenuOpen(false)}
                              className="w-full px-4 py-2 text-left text-xs text-gray-700 hover:bg-[#EAF2ED] flex items-center space-x-2 font-medium"
                            >
                              <LayoutDashboard className="w-3.5 h-3.5 text-[#2E5A44]" />
                              <span>Admin Dashboard</span>
                            </Link>
                          ) : (
                            <Link
                              href="/account"
                              onClick={() => setIsUserMenuOpen(false)}
                              className="w-full px-4 py-2 text-left text-xs text-gray-700 hover:bg-[#EAF2ED] flex items-center space-x-2 font-medium"
                            >
                              <User className="w-3.5 h-3.5 text-[#2E5A44]" />
                              <span>Account & Subscriptions</span>
                            </Link>
                          )}
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
                    className="px-3 py-1.5 text-gray-700 hover:text-[#2E5A44] hover:bg-[#EAF2ED] rounded-full transition-colors flex items-center space-x-1.5 text-xs font-semibold"
                  >
                    <User className="w-4 h-4 text-[#2E5A44]" />
                    <span>{language === 'fr' ? 'Se connecter' : 'Sign In'}</span>
                  </Link>
                )}
              </div>

              {/* Cart Drawer Trigger (Always visible) */}
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

          {/* Desktop Collection Rail */}
          <nav
            aria-label={t.header.categories.all}
            className="hidden md:flex items-center gap-1 h-11 border-t border-[#EAF2ED] overflow-x-auto no-scrollbar"
          >
            {categories.map((cat) => {
              const isActive = selectedCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  onClick={() => onCategorySelect?.(cat.key)}
                  aria-current={isActive ? 'true' : undefined}
                  className={`relative shrink-0 px-3 py-2 text-[11px] font-semibold tracking-wide transition-colors cursor-pointer focus-luxe rounded ${
                    isActive ? 'text-[#2E5A44]' : 'text-[#4B5563] hover:text-[#111827]'
                  }`}
                >
                  {cat.label}
                  <span
                    className={`absolute left-3 right-3 -bottom-px h-0.5 rounded-full bg-[#2E5A44] transition-transform duration-300 ease-luxe origin-left ${
                      isActive ? 'scale-x-100' : 'scale-x-0'
                    }`}
                  />
                </button>
              );
            })}
          </nav>

          {/* Mobile Quick Search Bar Dropdown */}
          {isSearchOpen && (
            <div className="md:hidden py-3 border-t border-[#EAF2ED] animate-fade-in">
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
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Mobile Full Slide-Out Navigation Drawer */}
          {isMobileMenuOpen && (
            <div className="md:hidden absolute left-0 right-0 top-full z-50 animate-fade-in">
              <div
                className="fixed inset-0 bg-black/50 backdrop-blur-xs -z-10"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-hidden="true"
              />
              <div
                data-lenis-prevent
                className="bg-[#FDFBF7] p-5 space-y-5 border-b border-[#C6DFD1] shadow-2xl max-h-[85vh] overflow-y-auto"
              >
                {/* Search Bar inside Drawer */}
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

                {/* Language Switcher Card */}
                <div className="flex items-center justify-between p-3 bg-white border border-[#EAF2ED] rounded-2xl">
                  <div className="flex items-center space-x-2 text-xs text-gray-600 font-semibold">
                    <Globe className="w-4 h-4 text-[#2E5A44]" />
                    <span>Language / Langue</span>
                  </div>
                  <div className="flex items-center bg-[#EAF2ED] p-1 rounded-full border border-[#C6DFD1]">
                    <button
                      onClick={() => handleLanguageToggle('en')}
                      className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
                        language === 'en'
                          ? 'bg-[#2E5A44] text-white shadow-sm'
                          : 'text-gray-600'
                      }`}
                    >
                      EN
                    </button>
                    <button
                      onClick={() => handleLanguageToggle('fr')}
                      className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
                        language === 'fr'
                          ? 'bg-[#2E5A44] text-white shadow-sm'
                          : 'text-gray-600'
                      }`}
                    >
                      FR
                    </button>
                  </div>
                </div>

                {/* Collections Navigation Grid */}
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
                        className={`px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-all ${
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

                {/* User Account & Admin Links */}
                <div className="space-y-2 pt-3 border-t border-[#EAF2ED]">
                  {isLoggedIn && user ? (
                    <div className="bg-white border border-[#C6DFD1] rounded-2xl p-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-gray-900">{user.fullName || user.email}</p>
                          <p className="text-[10px] text-gray-400 font-mono truncate">{user.email}</p>
                        </div>
                        <span className="text-[9px] bg-[#EAF2ED] text-[#2E5A44] px-2 py-0.5 rounded-full font-bold uppercase">
                          {role}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 pt-2 border-t border-gray-100">
                        <Link
                          href={role === 'admin' ? '/admin' : '/account'}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex-1 py-2 px-3 bg-[#EAF2ED] hover:bg-[#DDF0E5] text-[#2E5A44] rounded-xl text-xs font-bold text-center"
                        >
                          {role === 'admin' ? 'Admin Dashboard' : 'Account Portal'}
                        </Link>
                        <button
                          onClick={() => {
                            logout();
                            setIsMobileMenuOpen(false);
                          }}
                          className="py-2 px-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100"
                        >
                          Logout
                        </button>
                      </div>
                    </div>
                  ) : (
                    <Link
                      href="/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="w-full py-3 px-4 bg-[#111827] text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-2 shadow-sm"
                    >
                      <User className="w-4 h-4 text-[#C6DFD1]" />
                      <span>{language === 'fr' ? 'Se Connecter à mon Compte' : 'Sign In to Account'}</span>
                    </Link>
                  )}

                  {(role === 'admin' || process.env.NODE_ENV !== 'production') && (
                    <Link
                      href="/admin"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="w-full py-2.5 px-4 bg-amber-500/10 border border-amber-300 text-amber-900 rounded-xl text-xs font-bold flex items-center justify-between"
                    >
                      <span className="flex items-center space-x-2">
                        <ShieldAlert className="w-4 h-4 text-amber-600" />
                        <span>{t.header.admin}</span>
                      </span>
                      <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded font-mono uppercase font-bold">
                        {role}
                      </span>
                    </Link>
                  )}
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
