'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, RefreshCw, Award, Heart, Check, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/useLanguage';
import { toast } from 'sonner';

/**
 * Front-end only: confirms inline rather than blocking on a modal. Wire the
 * submit handler to a real list provider when one exists.
 */
function NewsletterForm() {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [isDone, setIsDone] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error(t.footer.invalidEmail);
      return;
    }
    setIsDone(true);
    toast.success(t.footer.subscribed);
  };

  if (isDone) {
    return (
      <p className="flex items-center gap-2 text-xs font-semibold text-[#C6DFD1] bg-[#2E5A44]/25 border border-[#2E5A44]/50 rounded-full px-4 py-2.5">
        <Check className="w-4 h-4 shrink-0" />
        <span>{t.footer.subscribed}</span>
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="relative max-w-xs">
      <label htmlFor="newsletter-email" className="sr-only">
        {t.footer.gazette}
      </label>
      <input
        id="newsletter-email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={t.footer.emailPlaceholder}
        className="w-full bg-white/5 border border-white/15 rounded-full pl-4 pr-12 py-2.5 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-[#C6DFD1] focus:bg-white/10 transition-colors"
      />
      <button
        type="submit"
        aria-label={t.footer.join}
        className="absolute right-1 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center bg-[#2E5A44] hover:bg-[#3a7256] text-white rounded-full transition-colors cursor-pointer"
      >
        <ArrowRight className="w-4 h-4" />
      </button>
    </form>
  );
}

interface SiteFooterProps {
  /**
   * Supplied by pages that render the catalog inline (the homepage), so the
   * collection links filter in place. Pages without a catalog omit it and the
   * links navigate to /products instead.
   */
  onCategorySelect?: (category: string) => void;
}

const FOOTER_CATEGORIES = ['whey', 'creatine', 'wellness', 'plant'] as const;

export function SiteFooter({ onCategorySelect }: SiteFooterProps) {
  const { t } = useLanguage();

  return (
    <footer className="bg-[#111827] text-white pt-16 pb-10 border-t border-[#2E5A44]/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-10">
          {/* Brand Info */}
          <div className="col-span-2 md:col-span-1 space-y-4">
            <div>
              <p className="font-serif text-2xl font-bold tracking-tight text-[#FDFBF7]">
                {t.header.logoTitle}
              </p>
              <p className="text-[9px] uppercase tracking-[0.25em] text-[#2E5A44] font-semibold mt-1">
                {t.header.logoTagline}
              </p>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed font-sans max-w-xs">
              {t.hero.subtext}
            </p>
            <div className="flex items-center gap-2 text-xs text-[#C6DFD1]">
              <ShieldCheck className="w-4 h-4 text-[#2E5A44] shrink-0" />
              <span>{t.product.trueformulaPurity}</span>
            </div>
          </div>

          {/* Collections */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C6DFD1] font-sans">
              {t.footer.collections}
            </h4>
            <ul className="space-y-2 text-xs text-gray-400">
              {FOOTER_CATEGORIES.map((key) => (
                <li key={key}>
                  {onCategorySelect ? (
                    <button
                      onClick={() => onCategorySelect(key)}
                      className="hover:text-white transition-colors text-left focus-luxe rounded"
                    >
                      {t.header.categories[key]}
                    </button>
                  ) : (
                    <Link
                      href={`/products?category=${key}`}
                      className="hover:text-white transition-colors focus-luxe rounded"
                    >
                      {t.header.categories[key]}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Member Privileges */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C6DFD1] font-sans">
              {t.footer.club}
            </h4>
            <ul className="space-y-2 text-xs text-gray-400">
              <li className="flex items-start gap-2">
                <RefreshCw className="w-3.5 h-3.5 text-[#2E5A44] shrink-0 mt-0.5" />
                <span>{t.footer.perks.discount}</span>
              </li>
              <li className="flex items-start gap-2">
                <Award className="w-3.5 h-3.5 text-[#2E5A44] shrink-0 mt-0.5" />
                <span>{t.footer.perks.cycles}</span>
              </li>
              <li className="flex items-start gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-[#2E5A44] shrink-0 mt-0.5" />
                <span>{t.footer.perks.cancel}</span>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="col-span-2 md:col-span-1 space-y-3">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C6DFD1] font-sans">
              {t.footer.gazette}
            </h4>
            <p className="text-xs text-gray-400 leading-relaxed">{t.footer.gazetteText}</p>
            <NewsletterForm />
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px] text-gray-500">
          <p className="text-center sm:text-left">
            © {new Date().getFullYear()} TRUE FORMULA Inc. — {t.footer.tagline}. {t.footer.rights}
          </p>
          <div className="flex items-center gap-1.5">
            <span>By Ayano</span>
            <Heart className="w-3 h-3 text-[#2E5A44] fill-[#2E5A44]" />
          </div>
        </div>
      </div>
    </footer>
  );
}
