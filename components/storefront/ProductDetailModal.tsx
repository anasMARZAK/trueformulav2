'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { X, Star, ShoppingBag, Check, ShieldCheck, RefreshCw, Truck, Info, Minus, Plus } from 'lucide-react';
import { type Product } from '@/lib/db/schema';
import { useLanguage } from '@/lib/i18n/useLanguage';
import { useCartStore } from '@/lib/store/useCartStore';
import { toast } from 'sonner';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
}

export function ProductDetailModal({ product, onClose }: ProductDetailModalProps) {
  const { language, t } = useLanguage();
  const addItem = useCartStore((state) => state.addItem);

  const flavors = (product?.flavors as string[]) || ['Default'];
  const sizes = (product?.sizes as string[]) || ['Standard'];

  const [selectedFlavor, setSelectedFlavor] = useState<string>(flavors[0] || 'Default');
  const [selectedSize, setSelectedSize] = useState<string>(sizes[0] || 'Standard');
  const [purchaseType, setPurchaseType] = useState<'one_time' | 'subscription'>('subscription');
  const [quantity, setQuantity] = useState<number>(1);
  const [isAdded, setIsAdded] = useState<boolean>(false);

  if (!product) return null;

  const productName = language === 'fr' ? product.nameFr : product.nameEn;
  const productDesc = language === 'fr' ? product.descriptionFr : product.descriptionEn;

  const basePrice = parseFloat(product.price);
  const subscriptionPrice = basePrice * 0.8;
  const unitPrice = purchaseType === 'subscription' ? subscriptionPrice : basePrice;
  const totalPrice = unitPrice * quantity;

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      nameEn: product.nameEn,
      nameFr: product.nameFr,
      unitPrice: basePrice,
      imageUrl: product.imageUrl,
      category: product.category,
      selectedFlavor,
      selectedSize,
      purchaseType,
      quantity,
    });

    setIsAdded(true);
    toast.success(t.toasts.itemAdded, {
      description: `${productName} (${selectedFlavor}, ${selectedSize}, Qty: ${quantity})`,
    });

    setTimeout(() => {
      setIsAdded(false);
      onClose();
    }, 1200);
  };

  // Generic Nutrition Facts generator based on category
  const getNutritionFacts = (category: string) => {
    switch (category) {
      case 'whey':
      case 'plant':
        return [
          { label: t.product.caloriesPerServing, value: '110 kcal' },
          { label: t.product.proteinPerServing, value: '26g' },
          { label: t.product.carbsPerServing, value: '0.8g' },
          { label: t.product.fatPerServing, value: '0.3g' },
          { label: 'BCAA', value: '6.2g' },
        ];
      case 'creatine':
        return [
          { label: t.product.caloriesPerServing, value: '0 kcal' },
          { label: 'Creatine Monohydrate', value: '5000 mg' },
          { label: t.product.carbsPerServing, value: '0g' },
          { label: t.product.fatPerServing, value: '0g' },
        ];
      case 'wellness':
        return [
          { label: t.product.caloriesPerServing, value: '35 kcal' },
          { label: 'Hydrolyzed Peptides', value: '10,000 mg' },
          { label: 'Hyaluronic Acid', value: '120 mg' },
          { label: 'Vitamin C', value: '80 mg' },
        ];
      case 'snacks':
        return [
          { label: t.product.caloriesPerServing, value: '210 kcal' },
          { label: t.product.proteinPerServing, value: '20g' },
          { label: t.product.carbsPerServing, value: '14g (Sugar <2g)' },
          { label: t.product.fatPerServing, value: '6g' },
        ];
      default:
        return [
          { label: t.product.caloriesPerServing, value: '15 kcal' },
          { label: 'Active Blend', value: '8,500 mg' },
          { label: 'Caffeine', value: '200 mg' },
        ];
    }
  };

  const getUsageDirections = (category: string) => {
    if (language === 'fr') {
      switch (category) {
        case 'whey':
        case 'plant':
          return 'Mélanger 1 cuillère (30g) dans 250-300ml d’eau fraîche ou de lait végétal dans votre shaker. Consommer dans les 30 minutes après l’entraînement ou le matin.';
        case 'creatine':
          return 'Prendre 1 cuillère rase (5g) quotidiennement avec 250ml d’eau ou jus de fruits. À consommer idéalement immédiatement après votre séance.';
        case 'wellness':
          return 'Mélanger 1 cuillère (10g) chaque matin dans votre café, smoothie ou eau fraîche.';
        default:
          return 'Consommer selon vos besoins nutritionnels quotidiens. Ne pas dépasser la dose recommandée.';
      }
    } else {
      switch (category) {
        case 'whey':
        case 'plant':
          return 'Mix 1 scoop (30g) with 250-300ml of cold water or plant milk. Consume within 30 minutes post-workout or in the morning.';
        case 'creatine':
          return 'Mix 1 level scoop (5g) daily in 250ml water or fruit juice. Take immediately following exercise for peak cell uptake.';
        case 'wellness':
          return 'Stir 1 scoop (10g) into your morning coffee, tea, smoothie, or cold water daily.';
        default:
          return 'Consume according to your daily dietary needs. Do not exceed recommended dosage.';
      }
    }
  };

  const getIngredients = (category: string) => {
    if (language === 'fr') {
      switch (category) {
        case 'whey':
          return 'Isolat de protéine de lactosérum natif ultra-filtré (lait), arômes naturels, lécithine de tournesol, extrait de feuille de stévia.';
        case 'plant':
          return 'Mélange de protéines végétales bio (protéine de pois fermentée, graines de courge bio, sacha inchi), arômes naturels, stévia.';
        case 'creatine':
          return '100% créatine monohydrate micronisée pure (qualité pharmaceutique 200 mesh).';
        case 'wellness':
          return 'Peptides de collagène marin hydrolysé (poisson), acide hyaluronique, vitamine C (acide L-ascorbique), arôme naturel.';
        default:
          return 'Formulation True Formula exclusive avec ingrédients 100% naturels vérifiés en laboratoire.';
      }
    } else {
      switch (category) {
        case 'whey':
          return 'Ultra-filtered native whey protein isolate (milk), natural flavors, sunflower lecithin, stevia leaf extract.';
        case 'plant':
          return 'Organic plant protein blend (fermented pea, organic pumpkin seed, sacha inchi), natural flavors, stevia leaf extract.';
        case 'creatine':
          return '100% pure micronized creatine monohydrate (pharmaceutical-grade 200 mesh).';
        case 'wellness':
          return 'Hydrolyzed marine collagen peptides (fish), hyaluronic acid, vitamin C (L-ascorbic acid), natural flavoring.';
        default:
          return 'Exclusive True Formula formulation with 100% lab-verified clean ingredients.';
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      <div
        className="relative bg-[#FDFBF7] w-full max-w-4xl rounded-2xl shadow-2xl border border-[#EAF2ED] overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 bg-white/80 hover:bg-[#2E5A44] hover:text-white text-gray-700 rounded-full transition-colors shadow-xs"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-12 max-h-[85vh] overflow-y-auto">
          {/* Left Column: Image Render & Badges with Hero Gradient */}
          <div
            className="md:col-span-5 p-8 border-b md:border-b-0 md:border-r border-[#EAF2ED] flex flex-col justify-between items-center relative"
            style={{
              background: 'linear-gradient(180deg, #F5F0E4 0%, #FDFBF7 100%)',
            }}
          >
            <div className="w-full flex justify-between items-center mb-4">
              <span className="bg-[#2E5A44] text-white text-xs font-bold uppercase tracking-[0.15em] px-3 py-1 rounded-full shadow-2xs font-sans">
                {t.catalog.categories[product.category as keyof typeof t.catalog.categories] || product.category}
              </span>
              <div className="flex items-center space-x-1 text-amber-500 text-xs font-semibold">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>4.9 / 5.0</span>
              </div>
            </div>

            {/* Product Image */}
            <div className="relative w-64 h-64 my-6">
              <Image
                src={product.imageUrl}
                alt={productName}
                fill
                className="object-contain drop-shadow-md"
                sizes="(max-width: 768px) 100vw, 40vw"
              />
            </div>

            {/* Badges Footer */}
            <div className="w-full space-y-2 pt-4 border-t border-[#EAF2ED] text-xs text-gray-600">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-[#2E5A44]" />
                <span className="font-semibold text-[#111827]">{t.product.trueformulaPurity}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Truck className="w-4 h-4 text-[#2E5A44]" />
                <span>{t.product.freeShipping}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Details & Customizer */}
          <div className="md:col-span-7 p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#111827]">
                {productName}
              </h2>
              <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                {productDesc}
              </p>
            </div>

            {/* Option Selector: Flavor */}
            {flavors.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs uppercase font-bold tracking-wider text-gray-500">
                  {t.product.flavorLabel}: <span className="text-[#2E5A44]">{selectedFlavor}</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {flavors.map((flavor) => (
                    <button
                      key={flavor}
                      onClick={() => setSelectedFlavor(flavor)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        selectedFlavor === flavor
                          ? 'bg-[#2E5A44] text-white shadow-xs'
                          : 'bg-white border border-[#C6DFD1] text-gray-700 hover:border-[#2E5A44]'
                      }`}
                    >
                      {flavor}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Option Selector: Size */}
            {sizes.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs uppercase font-bold tracking-wider text-gray-500">
                  {t.product.sizeLabel}: <span className="text-[#2E5A44]">{selectedSize}</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        selectedSize === size
                          ? 'bg-[#2E5A44] text-white shadow-xs'
                          : 'bg-white border border-[#C6DFD1] text-gray-700 hover:border-[#2E5A44]'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Purchase Model Toggle */}
            <div className="space-y-2">
              <label className="text-xs uppercase font-bold tracking-wider text-gray-500">
                Purchase Plan
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div
                  onClick={() => setPurchaseType('one_time')}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    purchaseType === 'one_time'
                      ? 'border-[#2E5A44] bg-[#EAF2ED]/60 ring-2 ring-[#2E5A44]'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-[#111827]">{t.product.oneTimePurchase}</span>
                  </div>
                  <div className="text-base font-extrabold text-[#111827] mt-1">
                    ${basePrice.toFixed(2)}
                  </div>
                </div>

                <div
                  onClick={() => setPurchaseType('subscription')}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all relative ${
                    purchaseType === 'subscription'
                      ? 'border-[#2E5A44] bg-[#EAF2ED]/60 ring-2 ring-[#2E5A44]'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <span className="absolute -top-2.5 right-3 bg-[#2E5A44] text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                    {t.product.saveBadge}
                  </span>
                  <div className="flex items-center space-x-1">
                    <RefreshCw className="w-3.5 h-3.5 text-[#2E5A44]" />
                    <span className="text-xs font-bold text-[#2E5A44]">{t.product.subscribeAndSave}</span>
                  </div>
                  <div className="text-base font-extrabold text-[#2E5A44] mt-1">
                    ${subscriptionPrice.toFixed(2)}{' '}
                    <span className="text-[10px] font-normal text-gray-500">/ mo</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quantity Selector & Instant Add to Cart */}
            <div className="flex items-center space-x-4 pt-2">
              <div className="flex items-center border border-[#C6DFD1] rounded-lg bg-white p-1">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-1.5 text-gray-600 hover:text-[#2E5A44] rounded"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-3 text-sm font-bold text-[#111827]">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-1.5 text-gray-600 hover:text-[#2E5A44] rounded"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                className={`flex-1 py-3.5 px-6 rounded-xl font-bold text-sm transition-all flex items-center justify-center space-x-2 shadow-md ${
                  isAdded
                    ? 'bg-emerald-700 text-white'
                    : 'bg-[#2E5A44] hover:bg-[#244736] text-white'
                }`}
              >
                {isAdded ? (
                  <>
                    <Check className="w-5 h-5" />
                    <span>{t.product.addedToCart}</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-5 h-5" />
                    <span>
                      {t.product.addToCart} • ${totalPrice.toFixed(2)}
                    </span>
                  </>
                )}
              </button>
            </div>

            {/* Nutrition Facts Panel */}
            <div className="border-t border-[#EAF2ED] pt-4 space-y-3">
              <h4 className="text-xs uppercase font-bold tracking-wider text-gray-700 flex items-center space-x-1.5">
                <Info className="w-4 h-4 text-[#2E5A44]" />
                <span>{t.product.nutritionLabel}</span>
              </h4>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 bg-[#FDFBF7] p-3 rounded-lg border border-[#EAF2ED]">
                {getNutritionFacts(product.category).map((fact, idx) => (
                  <div key={idx} className="text-center p-1">
                    <div className="text-[10px] text-gray-500 font-medium">{fact.label}</div>
                    <div className="text-xs font-bold text-[#2E5A44] mt-0.5">{fact.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Usage Directions & Ingredients */}
            <div className="border-t border-[#EAF2ED] pt-4 space-y-3">
              <div>
                <h4 className="text-xs uppercase font-bold tracking-wider text-gray-700">
                  {t.product.directionsLabel}
                </h4>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                  {getUsageDirections(product.category)}
                </p>
              </div>

              <div>
                <h4 className="text-xs uppercase font-bold tracking-wider text-gray-700">
                  {t.product.ingredientsLabel}
                </h4>
                <p className="text-xs text-gray-500 italic mt-1 leading-relaxed">
                  {getIngredients(product.category)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
