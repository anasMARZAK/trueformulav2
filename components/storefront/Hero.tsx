'use client';

import React from 'react';
import {
  ArrowRight,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Star,
  FlaskConical,
  Truck,
} from 'lucide-react';
import { useLanguage } from '@/lib/i18n/useLanguage';

interface HeroProps {
  onExploreClick?: () => void;
  onSubscribeClick?: () => void;
}

export function Hero({ onExploreClick, onSubscribeClick }: HeroProps) {
  const { t } = useLanguage();

  return (
    <section
      className="relative overflow-hidden py-24 sm:py-32 lg:py-40"
      style={{
        background: 'linear-gradient(180deg, #F5F0E4 0%, #FDFBF7 100%)',
      }}
    >
      {/* Noise overlay */}
      <div className="noise-overlay" />

      {/* Ambient decorative gradients */}
      <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(46,90,68,0.06)_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute bottom-[-15%] left-[-8%] w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.04)_0%,transparent_70%)] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        {/* Eyebrow Badge */}
        <div className="hero-animate hero-delay-1 inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur-sm border border-[#C6DFD1]/60 mb-8">
          <Sparkles className="w-3.5 h-3.5 text-[#2E5A44]" />
          <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#2E5A44] font-sans">
            {t.hero.badge}
          </span>
        </div>

        {/* Hero Headline */}
        <h1 className="hero-animate hero-delay-2 font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-[#111827] leading-[1.05] font-bold tracking-tight">
          {t.hero.title}
        </h1>

        {/* Subheadline */}
        <p className="hero-animate hero-delay-3 mt-6 text-lg sm:text-xl font-sans font-light leading-relaxed text-[#4B5563] max-w-2xl mx-auto">
          {t.hero.subtext}
        </p>

        {/* CTA Pair */}
        <div className="hero-animate hero-delay-4 mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          {/* Primary CTA — Pill with trailing icon */}
          <button
            onClick={onExploreClick}
            className="group relative inline-flex items-center justify-center bg-[#111827] hover:bg-[#1f2937] text-white font-semibold text-[15px] rounded-full pl-8 pr-2 py-2 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] cursor-pointer shadow-luxe hover:shadow-luxe-lg w-full sm:w-auto focus-luxe"
          >
            <span className="mr-4">{t.hero.exploreCta}</span>
            <span className="flex items-center justify-center w-10 h-10 rounded-full bg-white/15 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1 group-hover:bg-white/20">
              <ArrowRight className="w-4 h-4 text-white" />
            </span>
          </button>

          {/* Secondary CTA — Sage outline pill */}
          <button
            onClick={onSubscribeClick}
            className="group inline-flex items-center justify-center border-[1.5px] border-[#2E5A44] text-[#2E5A44] hover:bg-[#EAF2ED] font-semibold text-[15px] rounded-full px-8 py-4 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] cursor-pointer w-full sm:w-auto focus-luxe"
          >
            <RefreshCw className="w-4 h-4 mr-2.5 text-[#2E5A44] group-hover:rotate-180 transition-transform duration-700" />
            <span>{t.hero.subscribeCta}</span>
          </button>
        </div>

        {/* Social Proof Bar */}
        <div className="hero-animate hero-delay-5 mt-12 flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10">
          {/* Star Rating */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className="w-4 h-4 text-[#D4AF37] fill-[#D4AF37]"
                />
              ))}
            </div>
            <span className="text-sm font-semibold text-[#111827] font-sans">
              {t.hero.rating}
            </span>
            <span className="text-sm text-[#6B7280] font-sans">
              ({t.hero.reviewCount} reviews)
            </span>
          </div>

          {/* Divider — desktop only */}
          <div className="hidden sm:block w-px h-5 bg-[#E5E2D9]" />

          {/* Trusted by */}
          <span className="text-sm font-medium text-[#4B5563] font-sans">
            {t.hero.socialProof}
          </span>
        </div>

        {/* Trust Badges */}
        <div className="hero-animate hero-delay-6 mt-10 grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-4 justify-items-center">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-[18px] h-[18px] text-[#2E5A44] shrink-0" />
            <span className="text-[13px] font-medium text-[#4B5563] font-sans whitespace-nowrap">
              {t.hero.highlights.tested}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-[18px] h-[18px] text-[#2E5A44] shrink-0" />
            <span className="text-[13px] font-medium text-[#4B5563] font-sans whitespace-nowrap">
              {t.hero.highlights.nativeIsolates}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-[18px] h-[18px] text-[#2E5A44] shrink-0" />
            <span className="text-[13px] font-medium text-[#4B5563] font-sans whitespace-nowrap">
              {t.hero.highlights.noFillers}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Truck className="w-[18px] h-[18px] text-[#2E5A44] shrink-0" />
            <span className="text-[13px] font-medium text-[#4B5563] font-sans whitespace-nowrap">
              {t.hero.highlights.shipping}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
