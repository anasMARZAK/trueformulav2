'use client';

import React from 'react';
import { Beaker, ShieldCheck, Leaf, RefreshCw } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/useLanguage';
import { Reveal } from '@/components/ui/Reveal';

const PROPS_DATA = [
  { icon: Beaker, titleKey: 'performanceTitle', descKey: 'performanceDesc' },
  { icon: ShieldCheck, titleKey: 'purityTitle', descKey: 'purityDesc' },
  { icon: Leaf, titleKey: 'sustainableTitle', descKey: 'sustainableDesc' },
  { icon: RefreshCw, titleKey: 'savingsTitle', descKey: 'savingsDesc' },
] as const;

export function ValueProps() {
  const { t } = useLanguage();

  return (
    <section className="py-20 sm:py-28 bg-[#F5F0E4]/50 border-y border-[#E5E2D9]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header, left-aligned to match the catalog above it */}
        <Reveal>
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-5">
              <span className="w-10 h-px bg-[#2E5A44]/40" />
              <span className="text-[11px] uppercase tracking-[0.28em] font-semibold text-[#2E5A44] font-sans">
                {t.valueProps.badge}
              </span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[#111827] font-bold tracking-tight text-balance">
              {t.valueProps.title}
            </h2>
            <p className="mt-4 text-[#4B5563] font-sans font-light text-base leading-relaxed text-pretty">
              {t.valueProps.subtitle}
            </p>
          </div>
        </Reveal>

        {/* Standards, set as a rule-separated editorial grid rather than floating cards */}
        <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10">
          {PROPS_DATA.map((prop, idx) => {
            const Icon = prop.icon;
            return (
              <Reveal key={prop.titleKey} delay={idx * 90}>
                <div className="group h-full pt-6 border-t border-[#2E5A44]/20">
                  <div className="flex items-center justify-between mb-5">
                    <Icon
                      className="w-6 h-6 text-[#2E5A44] transition-transform duration-500 ease-luxe group-hover:-translate-y-0.5"
                      strokeWidth={1.5}
                    />
                    <span className="font-mono text-[10px] text-[#9CA3AF] tracking-[0.15em]">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <h3 className="font-serif text-xl font-bold text-[#111827] mb-2.5 leading-snug text-balance">
                    {t.valueProps.props[prop.titleKey]}
                  </h3>
                  <p className="text-[13px] text-[#6B7280] leading-relaxed font-sans text-pretty">
                    {t.valueProps.props[prop.descKey]}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
