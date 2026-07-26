'use client';

import React from 'react';
import { Beaker, ShieldCheck, Leaf, RefreshCw, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/useLanguage';

interface ValuePropsProps {
  onExploreClick?: () => void;
}

const PROPS_DATA = [
  {
    icon: Beaker,
    titleKey: 'performanceTitle' as const,
    descKey: 'performanceDesc' as const,
    accent: '#2E5A44',
    bgAccent: '#EAF2ED',
  },
  {
    icon: ShieldCheck,
    titleKey: 'purityTitle' as const,
    descKey: 'purityDesc' as const,
    accent: '#1E3A5F',
    bgAccent: '#E8EFF7',
  },
  {
    icon: Leaf,
    titleKey: 'sustainableTitle' as const,
    descKey: 'sustainableDesc' as const,
    accent: '#5C6B2F',
    bgAccent: '#F0F2E8',
  },
  {
    icon: RefreshCw,
    titleKey: 'savingsTitle' as const,
    descKey: 'savingsDesc' as const,
    accent: '#7C4D1E',
    bgAccent: '#FBF2E8',
  },
];

export function ValueProps({ onExploreClick }: ValuePropsProps) {
  const { t } = useLanguage();

  return (
    <section className="py-20 sm:py-28 bg-[#FDFBF7] relative overflow-hidden">
      {/* Soft background ornament */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#F5F0E4]/40 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-[#C6DFD1] shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2E5A44]" />
            <span className="text-[11px] uppercase tracking-[0.2em] font-bold text-[#2E5A44] font-sans">
              {t.valueProps.badge}
            </span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[#111827] font-bold tracking-tight">
            {t.valueProps.title}
          </h2>
          <p className="text-[#4B5563] font-sans font-light text-base leading-relaxed">
            {t.valueProps.subtitle}
          </p>
        </div>

        {/* Value Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-5">
          {PROPS_DATA.map((prop, idx) => {
            const Icon = prop.icon;
            return (
              <div
                key={idx}
                className="group bg-[#FDFBF7] rounded-2xl border border-[#E5E2D9] p-7 sm:p-8 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-[#C6DFD1] relative overflow-hidden"
              >
                {/* Decorative corner accent */}
                <div
                  className="absolute top-0 right-0 w-24 h-24 rounded-bl-[4rem] opacity-[0.06] group-hover:opacity-[0.12] transition-opacity duration-500"
                  style={{ backgroundColor: prop.accent }}
                />

                {/* Icon */}
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110"
                  style={{ backgroundColor: prop.bgAccent }}
                >
                  <Icon className="w-5.5 h-5.5" style={{ color: prop.accent }} />
                </div>

                {/* Content */}
                <h3 className="font-serif text-lg font-bold text-[#111827] mb-2 leading-snug">
                  {t.valueProps.props[prop.titleKey]}
                </h3>
                <p className="text-[13px] text-gray-500 leading-relaxed font-sans">
                  {t.valueProps.props[prop.descKey]}
                </p>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-12">
          <button
            onClick={onExploreClick}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-[#111827] text-white text-sm font-medium rounded-lg hover:bg-[#1f2937] transition-all shadow-md hover:shadow-lg group cursor-pointer"
          >
            <span>{t.valueProps.exploreCta}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </section>
  );
}
