'use client';

import React from 'react';
import Image from 'next/image';
import { ArrowRight, RefreshCw, Star } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/useLanguage';

interface HeroProps {
  onExploreClick?: () => void;
  onSubscribeClick?: () => void;
}

export function Hero({ onExploreClick, onSubscribeClick }: HeroProps) {
  const { t, language } = useLanguage();

  const specs = [
    { value: '26g', label: language === 'fr' ? 'Protéine' : 'Protein' },
    { value: '0.8g', label: language === 'fr' ? 'Glucides' : 'Carbs' },
    { value: '6.2g', label: 'BCAA' },
  ];

  return (
    <section
      className="relative overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #F5F0E4 0%, #FDFBF7 100%)' }}
    >
      <div className="noise-overlay" />

      {/* Ambient depth — kept subtle and off-axis so it reads as paper, not as a glow effect */}
      <div className="absolute top-[-20%] right-[-10%] w-[620px] h-[620px] rounded-full bg-[radial-gradient(circle,rgba(46,90,68,0.07)_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute bottom-[-25%] left-[-12%] w-[520px] h-[520px] rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.05)_0%,transparent_70%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center py-16 sm:py-24 lg:py-28">
          {/* ── Editorial column ─────────────────────────────────────────── */}
          <div className="lg:col-span-6 xl:col-span-5 text-center lg:text-left">
            {/* Eyebrow: a hairline rule instead of yet another pill badge */}
            <div className="hero-animate hero-delay-1 flex items-center justify-center lg:justify-start gap-3 mb-7">
              <span className="hidden lg:block w-10 h-px bg-[#2E5A44]/40" />
              <span className="text-[11px] uppercase tracking-[0.28em] font-semibold text-[#2E5A44] font-sans">
                {t.hero.badge}
              </span>
            </div>

            <h1 className="hero-animate hero-delay-2 font-serif text-[2.75rem] leading-[1.02] sm:text-6xl lg:text-[4.25rem] xl:text-[4.75rem] text-[#111827] font-bold tracking-tight text-balance">
              {language === 'fr' ? (
                <>
                  Votre Performance.
                  <br />
                  <span className="italic font-normal text-[#2E5A44]">Sur Mesure.</span>
                </>
              ) : (
                <>
                  Your Edge.
                  <br />
                  <span className="italic font-normal text-[#2E5A44]">Engineered.</span>
                </>
              )}
            </h1>

            <p className="hero-animate hero-delay-3 mt-6 text-base sm:text-lg font-sans font-light leading-relaxed text-[#4B5563] max-w-lg mx-auto lg:mx-0 text-pretty">
              {t.hero.subtext}
            </p>

            {/* CTA pair */}
            <div className="hero-animate hero-delay-4 mt-9 flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-3.5">
              <button
                onClick={onExploreClick}
                className="group relative inline-flex items-center justify-center bg-[#111827] hover:bg-[#1f2937] text-white font-semibold text-[15px] rounded-full pl-7 pr-2 py-2 transition-all duration-500 ease-luxe active:scale-[0.98] cursor-pointer shadow-luxe hover:shadow-luxe-lg w-full sm:w-auto focus-luxe"
              >
                <span className="mr-4">{t.hero.exploreCta}</span>
                <span className="flex items-center justify-center w-10 h-10 rounded-full bg-white/15 transition-all duration-500 ease-luxe group-hover:translate-x-1 group-hover:bg-white/25">
                  <ArrowRight className="w-4 h-4 text-white" />
                </span>
              </button>

              <button
                onClick={onSubscribeClick}
                className="group inline-flex items-center justify-center border-[1.5px] border-[#2E5A44]/70 text-[#2E5A44] hover:bg-[#EAF2ED] hover:border-[#2E5A44] font-semibold text-[15px] rounded-full px-7 py-[0.9rem] transition-all duration-500 ease-luxe active:scale-[0.98] cursor-pointer w-full sm:w-auto focus-luxe"
              >
                <RefreshCw className="w-4 h-4 mr-2.5 group-hover:rotate-180 transition-transform duration-700" />
                <span>{t.hero.subscribeCta}</span>
              </button>
            </div>

            {/* Inline social proof — one line, not a stacked badge farm */}
            <div className="hero-animate hero-delay-5 mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-x-3 gap-y-2">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-[15px] h-[15px] text-[#D4AF37] fill-[#D4AF37]" />
                ))}
              </div>
              <span className="text-sm font-sans text-[#4B5563]">
                <strong className="font-semibold text-[#111827]">{t.hero.rating}</strong>{' '}
                {language === 'fr'
                  ? `sur ${t.hero.reviewCount} avis`
                  : `from ${t.hero.reviewCount} reviews`}
              </span>
              <span className="hidden sm:block w-1 h-1 rounded-full bg-[#C6DFD1]" />
              <span className="text-sm font-sans text-[#4B5563]">{t.hero.socialProof}</span>
            </div>
          </div>

          {/* ── Specimen column ──────────────────────────────────────────── */}
          <div className="lg:col-span-6 xl:col-span-7 hero-animate hero-delay-4">
            <div className="relative mx-auto max-w-lg lg:max-w-none">
              {/* Plinth */}
              <div className="relative rounded-[2.5rem] border border-[#E5E2D9] bg-gradient-to-b from-white/70 to-[#FDFBF7]/40 backdrop-blur-[2px] p-8 sm:p-10 shadow-luxe-card">
                {/* Museum-label header */}
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#6B7280]">
                      {language === 'fr' ? 'Spécimen 01' : 'Specimen 01'}
                    </p>
                    <p className="font-serif text-xl text-[#111827] mt-1 leading-tight">
                      {language === 'fr' ? 'Isolat de Whey Natif' : 'Native Whey Isolate'}
                    </p>
                  </div>
                  <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.15em] text-[#2E5A44] bg-[#EAF2ED] border border-[#C6DFD1] rounded-full px-2.5 py-1">
                    {language === 'fr' ? 'Lot TF-0417' : 'Batch TF-0417'}
                  </span>
                </div>

                {/* Product */}
                <div className="relative h-[300px] sm:h-[380px] lg:h-[420px] my-4">
                  <Image
                    src="/images/true-formula-whey.jpg"
                    alt={language === 'fr' ? 'Isolat de whey natif True Formula' : 'True Formula native whey isolate'}
                    fill
                    priority
                    className="object-contain mix-blend-multiply drop-shadow-[0_24px_40px_rgba(46,90,68,0.18)]"
                    sizes="(max-width: 1024px) 90vw, 45vw"
                  />
                </div>

                {/* Spec strip — the numbers people actually shop on */}
                <div className="rule-gold mb-5" />
                <div className="grid grid-cols-3 gap-2">
                  {specs.map((spec) => (
                    <div key={spec.label} className="text-center">
                      <p className="font-mono text-lg sm:text-xl font-bold text-[#111827]">{spec.value}</p>
                      <p className="text-[10px] uppercase tracking-[0.14em] text-[#6B7280] font-semibold mt-0.5">
                        {spec.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating purity seal */}
              <div className="absolute -bottom-4 -left-2 sm:-left-6 bg-[#111827] text-white rounded-2xl px-4 py-3 shadow-luxe-lg rotate-[-3deg]">
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#C6DFD1]">
                  {language === 'fr' ? 'Testé en laboratoire' : 'Lab Verified'}
                </p>
                <p className="font-serif text-lg leading-tight">100%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Assurance strip: the four trust facts as one quiet band ──────── */}
      <div className="relative z-10 border-t border-[#E5E2D9]/70 bg-[#FDFBF7]/60 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ul className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-[#E5E2D9]/70">
            {[
              t.hero.highlights.tested,
              t.hero.highlights.nativeIsolates,
              t.hero.highlights.noFillers,
              t.hero.highlights.shipping,
            ].map((label, i) => (
              <li
                key={label}
                className={`px-4 py-4 sm:py-5 text-center ${i < 2 ? 'border-b lg:border-b-0 border-[#E5E2D9]/70' : ''} ${i % 2 === 0 ? 'border-l-0 lg:border-l' : ''}`}
              >
                <span className="text-[11px] sm:text-[12px] font-semibold uppercase tracking-[0.12em] text-[#4B5563] font-sans">
                  {label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
