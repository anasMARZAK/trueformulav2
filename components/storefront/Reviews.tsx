'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Star, ChevronLeft, ChevronRight, Quote, BadgeCheck } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/useLanguage';

interface Review {
  id: string;
  nameEn: string;
  nameFr: string;
  role: string;
  roleFr: string;
  rating: number;
  textEn: string;
  textFr: string;
  productBought: string;
  productBoughtFr: string;
  avatar: string; // initials
  accentColor: string;
}

const REVIEWS: Review[] = [
  {
    id: 'r1',
    nameEn: 'Alex M.',
    nameFr: 'Alex M.',
    role: 'Competitive CrossFit Athlete',
    roleFr: 'Athlète CrossFit Compétitif',
    rating: 5,
    textEn: 'I\'ve tried dozens of whey isolates over the years. ProteinShop\'s Native Isolate is on a completely different level — clean taste, zero bloating, and my recovery has never been faster. The subscription discount makes it a no-brainer.',
    textFr: 'J\'ai essayé des dizaines d\'isolats de whey au fil des années. L\'Isolat Natif de ProteinShop est d\'un tout autre niveau — goût pur, zéro ballonnements, et ma récupération n\'a jamais été aussi rapide. La remise abonnement est un vrai plus.',
    productBought: 'Pure Isolate Whey Protein',
    productBoughtFr: 'Protéine de Lactosérum Isolat Pure',
    avatar: 'AM',
    accentColor: '#2E5A44',
  },
  {
    id: 'r2',
    nameEn: 'Sophie L.',
    nameFr: 'Sophie L.',
    role: 'Yoga Instructor & Wellness Coach',
    roleFr: 'Instructrice de Yoga & Coach Bien-être',
    rating: 5,
    textEn: 'The Marine Collagen with hyaluronic acid has transformed my skin and joint health. I notice a visible difference in elasticity after just 3 weeks. Finally a brand that delivers what it promises without unnecessary additives.',
    textFr: 'Le Collagène Marin avec acide hyaluronique a transformé ma peau et mes articulations. J\'ai remarqué une différence visible en élasticité après seulement 3 semaines. Enfin une marque qui tient ses promesses sans additifs inutiles.',
    productBought: 'Bio-Active Marine Collagen',
    productBoughtFr: 'Collagène Marin Bio-Actif',
    avatar: 'SL',
    accentColor: '#1E3A5F',
  },
  {
    id: 'r3',
    nameEn: 'Marcus T.',
    nameFr: 'Marcus T.',
    role: 'Powerlifting Coach',
    roleFr: 'Entraîneur de Force Athlétique',
    rating: 5,
    textEn: 'Pharmaceutical-grade creatine that actually dissolves properly. No gritty residue, no stomach issues. My clients and I have all switched to ProteinShop and the strength gains are measurable.',
    textFr: 'Une créatine de qualité pharmaceutique qui se dissout réellement. Pas de résidu granuleux, pas de problèmes d\'estomac. Mes clients et moi avons tous migré vers ProteinShop et les gains de force sont mesurables.',
    productBought: 'Micronized Creatine Monohydrate',
    productBoughtFr: 'Créatine Monohydrate Micronisée',
    avatar: 'MT',
    accentColor: '#5C6B2F',
  },
  {
    id: 'r4',
    nameEn: 'Rina K.',
    nameFr: 'Rina K.',
    role: 'Marathon Runner',
    roleFr: 'Coureuse de Marathon',
    rating: 5,
    textEn: 'As a plant-based athlete, finding a protein that doesn\'t taste chalky is nearly impossible. The Organic Plant Blend in Vanilla Matcha is absolutely delicious and digests perfectly even during intense training blocks.',
    textFr: 'En tant qu\'athlète végétale, trouver une protéine sans goût crayeux est quasi impossible. Le Mélange Végétal Bio Vanille Matcha est absolument délicieux et se digère parfaitement même pendant les blocs d\'entraînement intensifs.',
    productBought: 'Organic Plant Protein Blend',
    productBoughtFr: 'Mélange de Protéines Végétales Bio',
    avatar: 'RK',
    accentColor: '#7C4D1E',
  },
  {
    id: 'r5',
    nameEn: 'James D.',
    nameFr: 'James D.',
    role: 'Personal Trainer',
    roleFr: 'Coach Personnel',
    rating: 5,
    textEn: 'The Pre-Workout Elixir gives clean, sustained energy without the crash. No jitters, no tingling — just pure focus and pump. I recommend it to every single one of my clients now.',
    textFr: 'L\'Élixir Pré-Entraînement donne une énergie propre et soutenue sans le crash. Pas de tremblements, pas de picotements — juste du focus pur et du pump. Je le recommande maintenant à chacun de mes clients.',
    productBought: 'Pre-Workout Bio-Energy Elixir',
    productBoughtFr: 'Élixir Bio-Énergétique Pré-Entraînement',
    avatar: 'JD',
    accentColor: '#2E5A44',
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center space-x-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 ${
            star <= rating
              ? 'fill-amber-400 text-amber-400'
              : 'fill-gray-200 text-gray-200'
          }`}
        />
      ))}
    </div>
  );
}

import { supabase } from '@/lib/supabase/client';

export function Reviews() {
  const { language, t } = useLanguage();
  const [reviewsList, setReviewsList] = useState<Review[]>(REVIEWS);
  const [activeIndex, setActiveIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(3);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    supabase
      .from('reviews')
      .select('*')
      .then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          const mapped: Review[] = data.map((item) => ({
            id: item.id,
            nameEn: item.name_en || item.nameEn,
            nameFr: item.name_fr || item.nameFr,
            role: item.role_en || item.role,
            roleFr: item.role_fr || item.roleFr,
            rating: item.rating,
            textEn: item.text_en || item.textEn,
            textFr: item.text_fr || item.textFr,
            productBought: item.product_bought_en || item.productBought,
            productBoughtFr: item.product_bought_fr || item.productBoughtFr,
            avatar: item.avatar_initials || item.avatar || 'TF',
            accentColor: item.accent_color || '#2E5A44',
          }));
          setReviewsList(mapped);
        }
      });
  }, []);

  useEffect(() => {
    const updateCount = () => {
      const w = window.innerWidth;
      setVisibleCount(w >= 1024 ? 3 : w >= 640 ? 2 : 1);
    };
    updateCount();
    window.addEventListener('resize', updateCount);
    return () => window.removeEventListener('resize', updateCount);
  }, []);

  const maxIndex = Math.max(0, reviewsList.length - visibleCount);

  // Resizing to a wider breakpoint shows more cards at once, which shrinks maxIndex;
  // without this the carousel can be parked past the end and render blank space.
  useEffect(() => {
    setActiveIndex((prev) => Math.min(prev, maxIndex));
  }, [maxIndex]);

  const goNext = useCallback(() => {
    setActiveIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  }, [maxIndex]);

  const goPrev = useCallback(() => {
    setActiveIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  }, [maxIndex]);

  // Auto-advance every 5 seconds
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(goNext, 5000);
    return () => clearInterval(timer);
  }, [goNext, isPaused]);

  return (
    <section className="py-20 sm:py-28 bg-[#F5F0E4] relative overflow-hidden">
      {/* Background texture */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <div className="absolute top-10 left-10 w-64 h-64 bg-[#C6DFD1]/30 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-[#EAF2ED]/40 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-4">
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-[#C6DFD1] shadow-2xs">
            <Quote className="w-3.5 h-3.5 text-[#2E5A44]" />
            <span className="text-[11px] uppercase tracking-[0.2em] font-bold text-[#2E5A44] font-sans">
              {t.reviews.badge}
            </span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[#111827] font-bold tracking-tight">
            {t.reviews.title}
          </h2>
          <p className="text-[#4B5563] font-sans font-light text-base leading-relaxed">
            {t.reviews.subtitle}
          </p>
        </div>

        {/* Carousel */}
        <div
          className="relative"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Cards Container */}
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{
                transform: `translateX(-${activeIndex * (100 / visibleCount)}%)`,
              }}
            >
              {reviewsList.map((review) => {
                const name = language === 'fr' ? review.nameFr : review.nameEn;
                const role = language === 'fr' ? review.roleFr : review.role;
                const text = language === 'fr' ? review.textFr : review.textEn;
                const product = language === 'fr' ? review.productBoughtFr : review.productBought;

                return (
                  <div
                    key={review.id}
                    className="flex-shrink-0 px-3"
                    style={{ width: `${100 / visibleCount}%` }}
                  >
                    <div className="bg-white rounded-2xl border border-[#E5E2D9] p-7 sm:p-8 h-full flex flex-col justify-between shadow-sm hover:shadow-lg transition-shadow duration-300 relative overflow-hidden group">
                      {/* Decorative quote mark */}
                      <div className="absolute top-5 right-6 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity duration-500">
                        <Quote className="w-16 h-16 text-[#111827]" />
                      </div>

                      <div className="space-y-5">
                        {/* Rating & Verified badge */}
                        <div className="flex items-center justify-between">
                          <StarRating rating={review.rating} />
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-[#EAF2ED] text-[#2E5A44] text-[10px] font-bold rounded-full uppercase tracking-wider">
                            <BadgeCheck className="w-3 h-3" />
                            <span>{t.reviews.verifiedBadge}</span>
                          </span>
                        </div>

                        {/* Review Text */}
                        <p className="text-[13px] sm:text-sm text-gray-600 leading-relaxed font-sans relative z-10">
                          &ldquo;{text}&rdquo;
                        </p>

                        {/* Product purchased */}
                        <div className="text-[11px] text-[#2E5A44] bg-[#EAF2ED]/60 inline-block px-2.5 py-1 rounded-md font-semibold">
                          {t.reviews.purchasedLabel}: {product}
                        </div>
                      </div>

                      {/* Author */}
                      <div className="flex items-center space-x-3 pt-6 mt-4 border-t border-[#E5E2D9]">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                          style={{ backgroundColor: review.accentColor }}
                        >
                          {review.avatar}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#111827]">{name}</p>
                          <p className="text-[11px] text-gray-500">{role}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={goPrev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 lg:-translate-x-5 w-10 h-10 bg-white border border-[#E5E2D9] rounded-full shadow-md hidden sm:flex items-center justify-center text-[#111827] hover:bg-[#EAF2ED] hover:border-[#2E5A44] transition-all z-20 cursor-pointer focus-luxe"
            aria-label="Previous review"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={goNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 lg:translate-x-5 w-10 h-10 bg-white border border-[#E5E2D9] rounded-full shadow-md hidden sm:flex items-center justify-center text-[#111827] hover:bg-[#EAF2ED] hover:border-[#2E5A44] transition-all z-20 cursor-pointer focus-luxe"
            aria-label="Next review"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Dot Indicators — one per reachable slide position, derived from the
            loaded list rather than the hardcoded fallback array. */}
        <div className="flex justify-center items-center space-x-2 mt-10">
          {Array.from({ length: maxIndex + 1 }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={`rounded-full transition-all duration-300 cursor-pointer ${
                idx === activeIndex
                  ? 'w-8 h-2.5 bg-[#2E5A44]'
                  : 'w-2.5 h-2.5 bg-[#C6DFD1] hover:bg-[#2E5A44]/50'
              }`}
              aria-label={`Go to review ${idx + 1}`}
            />
          ))}
        </div>

        {/* Aggregate Stats Bar */}
        <div className="mt-14 bg-white rounded-3xl border border-[#E5E2D9] p-6 sm:p-8 shadow-luxe-card">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-8 gap-x-6 text-center sm:divide-x sm:divide-[#E5E2D9]">
            <div className="space-y-1.5">
              <p className="font-mono text-3xl sm:text-4xl font-bold text-[#111827] tracking-tight">4.9</p>
              <div className="flex justify-center">
                <StarRating rating={5} />
              </div>
              <p className="text-[10px] text-gray-500 uppercase tracking-[0.14em] font-semibold pt-0.5">
                {t.reviews.stats.rating}
              </p>
            </div>
            <div className="space-y-1.5">
              <p className="font-mono text-3xl sm:text-4xl font-bold text-[#111827] tracking-tight">2,400+</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-[0.14em] font-semibold pt-0.5">
                {t.reviews.stats.reviews}
              </p>
            </div>
            <div className="space-y-1.5">
              <p className="font-mono text-3xl sm:text-4xl font-bold text-[#111827] tracking-tight">98%</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-[0.14em] font-semibold pt-0.5">
                {t.reviews.stats.recommend}
              </p>
            </div>
            <div className="space-y-1.5">
              <p className="font-mono text-3xl sm:text-4xl font-bold text-[#111827] tracking-tight">3,100+</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-[0.14em] font-semibold pt-0.5">
                {t.reviews.stats.subscribers}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
