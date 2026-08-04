'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/useLanguage';
import { Reveal } from '@/components/ui/Reveal';

interface ProtocolProps {
  onExploreClick?: () => void;
}

/**
 * Explains the subscription model before checkout does. Styled as a folded
 * apothecary instruction leaflet — warm paper, hairline rules, mono field labels —
 * so it sits inside the store's material language instead of interrupting it.
 */
export function Protocol({ onExploreClick }: ProtocolProps) {
  const { t, language } = useLanguage();

  const steps = [
    { key: 'choose', ...t.protocol.steps.choose },
    { key: 'cadence', ...t.protocol.steps.cadence },
    { key: 'adjust', ...t.protocol.steps.adjust },
  ];

  return (
    <section className="relative py-20 sm:py-28 bg-[#FDFBF7] overflow-hidden">
      {/* Faint sage bloom, the same device used in the hero */}
      <div className="absolute top-1/4 -left-32 w-[520px] h-[520px] rounded-full bg-[radial-gradient(circle,rgba(46,90,68,0.05)_0%,transparent_70%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <Reveal>
          {/* The leaflet */}
          <div className="rounded-[2rem] border border-[#E5E2D9] bg-gradient-to-b from-white to-[#FDFBF7] shadow-luxe-card overflow-hidden">
            {/* Leaflet header strip — reads like a dosage card masthead */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-7 sm:px-10 py-4 border-b border-[#E5E2D9] bg-[#F5F0E4]/60">
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#2E5A44]">
                {t.protocol.badge}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#9CA3AF]">
                {language === 'fr' ? 'Réf. TF—SUB—20' : 'Ref. TF—SUB—20'}
              </span>
            </div>

            <div className="grid lg:grid-cols-12">
              {/* ── Left: the pitch ─────────────────────────────────────── */}
              <div className="lg:col-span-5 p-7 sm:p-10 lg:border-r border-[#E5E2D9]">
                <h2 className="font-serif text-3xl sm:text-4xl text-[#111827] font-bold tracking-tight leading-[1.1] text-balance">
                  {t.protocol.title}
                </h2>
                <div className="rule-gold my-6 max-w-[10rem] mx-0" />
                <p className="text-[#4B5563] font-sans font-light text-[15px] leading-relaxed text-pretty">
                  {t.protocol.subtitle}
                </p>

                <button
                  onClick={onExploreClick}
                  className="group mt-8 inline-flex items-center bg-[#111827] hover:bg-[#2E5A44] text-white font-semibold text-sm rounded-full pl-6 pr-2 py-2 transition-all duration-500 ease-luxe active:scale-[0.98] cursor-pointer shadow-luxe hover:shadow-luxe-lg focus-luxe"
                >
                  <span className="mr-3">{t.protocol.cta}</span>
                  <span className="flex items-center justify-center w-9 h-9 rounded-full bg-white/15 transition-transform duration-500 ease-luxe group-hover:translate-x-1">
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </button>
              </div>

              {/* ── Right: the numbered directions ──────────────────────── */}
              <ol className="lg:col-span-7 divide-y divide-[#E5E2D9] border-t lg:border-t-0 border-[#E5E2D9]">
                {steps.map((step, idx) => (
                  <li
                    key={step.key}
                    className="group flex gap-5 sm:gap-7 p-7 sm:p-9 transition-colors duration-500 hover:bg-[#F5F0E4]/40"
                  >
                    {/* Numeral, set as an apothecary counter */}
                    <div className="shrink-0 flex flex-col items-center">
                      <span className="font-serif text-2xl text-[#2E5A44] leading-none w-11 h-11 rounded-full border border-[#C6DFD1] bg-white flex items-center justify-center transition-colors duration-500 group-hover:border-[#2E5A44] group-hover:bg-[#EAF2ED]">
                        {idx + 1}
                      </span>
                      {idx < steps.length - 1 && (
                        <span className="flex-1 w-px mt-2 bg-gradient-to-b from-[#C6DFD1] to-transparent" />
                      )}
                    </div>

                    <div className="pt-1.5">
                      <h3 className="font-serif text-xl sm:text-[1.4rem] font-bold text-[#111827] leading-snug">
                        {step.title}
                      </h3>
                      <p className="mt-2 text-[13.5px] text-[#6B7280] leading-relaxed font-sans text-pretty">
                        {step.desc}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {/* Leaflet footer — small print, where small print belongs */}
            <div className="px-7 sm:px-10 py-5 border-t border-[#E5E2D9] bg-[#F5F0E4]/60">
              <p className="font-mono text-[11px] text-[#4B5563] tracking-wide text-center sm:text-left">
                {t.protocol.footnote}
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
