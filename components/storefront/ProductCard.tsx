'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Star, ShoppingBag, Eye, Check, RefreshCw } from 'lucide-react';
import { type Product } from '@/lib/db/schema';
import { useLanguage } from '@/lib/i18n/useLanguage';
import { useCartStore } from '@/lib/store/useCartStore';
import { toast } from 'sonner';

interface ProductCardProps {
  product: Product;
  onQuickView: (product: Product) => void;
}

export function ProductCard({ product, onQuickView }: ProductCardProps) {
  const { language, t } = useLanguage();
  const addItem = useCartStore((state) => state.addItem);
  const openCart = useCartStore((state) => state.openCart);

  const productName = language === 'fr' ? product.nameFr : product.nameEn;
  const productDesc = language === 'fr' ? product.descriptionFr : product.descriptionEn;

  const flavors = (product.flavors as string[]) || ['Default'];
  const sizes = (product.sizes as string[]) || ['Standard'];

  const [selectedFlavor, setSelectedFlavor] = useState<string>(flavors[0] || 'Default');
  const [selectedSize, setSelectedSize] = useState<string>(sizes[0] || 'Standard');
  const [purchaseType, setPurchaseType] = useState<'one_time' | 'subscription'>('one_time');
  const [isAdded, setIsAdded] = useState(false);

  const basePrice = parseFloat(product.price);
  const subscriptionPrice = basePrice * 0.8;
  const effectivePrice = purchaseType === 'subscription' ? subscriptionPrice : basePrice;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();

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
      quantity: 1,
    });

    setIsAdded(true);
    toast.success(t.toasts.itemAdded, {
      description: `${productName} (${selectedFlavor}, ${selectedSize})`,
    });

    openCart();
    setTimeout(() => setIsAdded(false), 1500);
  };

  return (
    <div
      onClick={() => onQuickView(product)}
      className="group bg-[#FDFBF7] rounded-[2rem] border border-[#EAF2ED] hover:border-[#2E5A44]/60 card-luxe-lift shadow-luxe-card hover:shadow-luxe-card-hover flex flex-col justify-between overflow-hidden cursor-pointer focus-luxe transition-all duration-500"
    >
      <div>
        {/* Top Image Box with Hero Gradient (#F5F0E4 to #FDFBF7) */}
        <div
          className="relative w-full h-64 sm:h-72 p-6 flex items-center justify-center border-b border-[#EAF2ED] overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, #F5F0E4 0%, #FDFBF7 100%)',
          }}
        >
          {/* Floating Luxury Badges in Hero Style */}
          <div className="absolute top-4 left-4 z-10 flex flex-col space-y-1.5">
            <span className="bg-[#2E5A44] text-white text-[10px] font-bold uppercase tracking-[0.15em] px-3 py-1 rounded-full shadow-2xs font-sans">
              {t.catalog.categories[product.category as keyof typeof t.catalog.categories] || product.category}
            </span>
            {product.isFeatured && (
              <span className="bg-[#111827] text-white text-[9px] font-bold uppercase tracking-[0.15em] px-2.5 py-0.5 rounded-full shadow-2xs font-sans">
                ★ True Formula
              </span>
            )}
          </div>

          <div className="absolute top-4 right-4 z-10">
            <span className="bg-white/90 backdrop-blur-xs text-[#2E5A44] text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center space-x-1 border border-[#C6DFD1] shadow-2xs font-sans">
              <RefreshCw className="w-3 h-3" />
              <span>-20% Sub</span>
            </span>
          </div>

          {/* Product Image Filling Container & Blended Seamlessly */}
          <div className="relative w-full h-full p-2 flex items-center justify-center">
            <Image
              src={product.imageUrl}
              alt={productName}
              fill
              className="object-contain mix-blend-multiply drop-shadow-xs transition-transform duration-700 ease-out group-hover:scale-108"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          </div>

          {/* Quick View Floating Glass Overlay Button */}
          <div className="absolute inset-0 bg-black/5 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-20">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onQuickView(product);
              }}
              className="px-5 py-2.5 bg-white text-[#111827] text-xs font-bold rounded-full shadow-lg hover:bg-[#2E5A44] hover:text-white transition-all flex items-center space-x-2 cursor-pointer focus-luxe scale-95 group-hover:scale-100 duration-300 font-sans"
            >
              <Eye className="w-4 h-4" />
              <span>{t.product.quickView}</span>
            </button>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6 space-y-3">
          {/* Ratings & Flavor Swatch Preview */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1 text-amber-500 text-xs">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-[#D4AF37] text-[#D4AF37]" />
              ))}
              <span className="text-[#4B5563] font-bold ml-1 text-[11px] font-sans">(4.9)</span>
            </div>

            {/* Flavor Swatch Preview Dots */}
            <div className="flex items-center space-x-1">
              {flavors.slice(0, 3).map((fl, idx) => (
                <span
                  key={idx}
                  title={fl}
                  className="w-2.5 h-2.5 rounded-full border border-[#C6DFD1] bg-[#EAF2ED] shadow-2xs"
                />
              ))}
              {flavors.length > 3 && (
                <span className="text-[9px] text-[#6B7280] font-bold font-sans">+{flavors.length - 3}</span>
              )}
            </div>
          </div>

          {/* Title in Hero Serif Typography */}
          <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#111827] group-hover:text-[#2E5A44] transition-colors line-clamp-1">
            {productName}
          </h3>

          <p className="text-xs text-[#4B5563] font-light leading-relaxed line-clamp-2 font-sans">
            {productDesc}
          </p>

          {/* Price & Subscription Pill */}
          <div className="flex items-baseline justify-between pt-2">
            <span className="text-xl font-bold text-[#111827] font-mono">${basePrice.toFixed(2)}</span>
            <span className="text-[11px] text-[#2E5A44] bg-[#EAF2ED] px-3 py-1 rounded-full font-bold border border-[#C6DFD1] font-sans">
              ${subscriptionPrice.toFixed(2)}/mo
            </span>
          </div>
        </div>
      </div>

      {/* Card Footer Action Button matching Hero Primary CTA */}
      <div className="p-6 pt-0 mt-1">
        <button
          onClick={handleAddToCart}
          className={`w-full py-3.5 px-5 rounded-full font-bold text-xs uppercase tracking-wider transition-all duration-300 flex items-center justify-center space-x-2 cursor-pointer focus-luxe font-sans ${
            isAdded
              ? 'bg-emerald-800 text-white shadow-md'
              : 'bg-[#111827] hover:bg-[#1f2937] text-white shadow-luxe hover:shadow-luxe-lg'
          }`}
        >
          {isAdded ? (
            <>
              <Check className="w-4 h-4 text-emerald-300" />
              <span>{t.product.addedToCart}</span>
            </>
          ) : (
            <>
              <ShoppingBag className="w-4 h-4 text-white" />
              <span>
                {t.product.addToCart} — ${basePrice.toFixed(2)}
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
