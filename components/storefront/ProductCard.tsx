'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Star, ShoppingBag, Eye, Check } from 'lucide-react';
import { type Product } from '@/lib/db/schema';
import { useLanguage } from '@/lib/i18n/useLanguage';
import { useCartStore } from '@/lib/store/useCartStore';
import { getFlavorSwatch } from '@/lib/ui/flavor-colors';
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

  const [isAdded, setIsAdded] = useState(false);

  const basePrice = parseFloat(product.price);
  const subscriptionPrice = basePrice * 0.8;

  const stock = typeof product.stock === 'number' ? product.stock : null;
  const isLowStock = stock !== null && stock > 0 && stock <= 100;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();

    addItem({
      productId: product.id,
      nameEn: product.nameEn,
      nameFr: product.nameFr,
      unitPrice: basePrice,
      imageUrl: product.imageUrl,
      category: product.category,
      selectedFlavor: flavors[0] || 'Default',
      selectedSize: sizes[0] || 'Standard',
      purchaseType: 'one_time',
      quantity: 1,
    });

    setIsAdded(true);
    toast.success(t.toasts.itemAdded, {
      description: `${productName} (${flavors[0]}, ${sizes[0]})`,
    });

    openCart();
    setTimeout(() => setIsAdded(false), 1500);
  };

  return (
    <article
      onClick={() => onQuickView(product)}
      className="group bg-white rounded-[1.75rem] border border-[#EAF2ED] hover:border-[#C6DFD1] card-luxe-lift shadow-luxe-card hover:shadow-luxe-card-hover flex flex-col overflow-hidden cursor-pointer focus-luxe"
    >
      {/* ── Image plate ──────────────────────────────────────────────────── */}
      <div
        className="relative w-full h-60 sm:h-64 flex items-center justify-center border-b border-[#EAF2ED] overflow-hidden"
        style={{ background: 'linear-gradient(180deg, #F5F0E4 0%, #FDFBF7 100%)' }}
      >
        {/* Only genuinely differentiating badges live on the plate — the "-20% sub"
            note moved into the price row, where the number it modifies actually is. */}
        <div className="absolute top-4 left-4 z-10 flex flex-col items-start gap-1.5">
          <span className="bg-white/85 backdrop-blur-[2px] text-[#2E5A44] border border-[#C6DFD1] text-[10px] font-bold uppercase tracking-[0.14em] px-2.5 py-1 rounded-full font-sans">
            {t.catalog.categories[product.category as keyof typeof t.catalog.categories] || product.category}
          </span>
          {product.isFeatured && (
            <span className="bg-[#111827] text-white text-[9px] font-bold uppercase tracking-[0.14em] px-2.5 py-1 rounded-full font-sans">
              ★ {language === 'fr' ? 'Sélection' : 'House Pick'}
            </span>
          )}
        </div>

        <div className="relative w-full h-full p-6">
          <Image
            src={product.imageUrl}
            alt={productName}
            fill
            className="object-contain mix-blend-multiply transition-transform duration-700 ease-luxe group-hover:scale-[1.06]"
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
          />
        </div>

        {/* Quick view — hover on pointer devices, always tappable via the card itself */}
        <div className="absolute inset-x-0 bottom-0 p-4 flex justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 ease-luxe z-20">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickView(product);
            }}
            className="px-5 py-2.5 bg-[#111827]/90 backdrop-blur-sm text-white text-xs font-bold rounded-full shadow-luxe hover:bg-[#2E5A44] transition-colors flex items-center gap-2 cursor-pointer focus-luxe font-sans"
          >
            <Eye className="w-4 h-4" />
            <span>{t.product.quickView}</span>
          </button>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <div className="p-5 sm:p-6 flex flex-col flex-1">
        {/* Rating + flavor swatches */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 fill-[#D4AF37] text-[#D4AF37]" />
            <span className="text-[11px] font-bold text-[#111827] font-sans">4.9</span>
          </div>

          {/* Swatches now carry the flavor, not just decoration */}
          <div className="flex items-center gap-1.5">
            {flavors.slice(0, 4).map((flavor) => {
              const swatch = getFlavorSwatch(flavor);
              return (
                <span
                  key={flavor}
                  title={flavor}
                  aria-label={flavor}
                  className="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: swatch.color,
                    boxShadow: `inset 0 0 0 1px ${swatch.ring}`,
                  }}
                />
              );
            })}
            {flavors.length > 4 && (
              <span className="text-[10px] text-[#6B7280] font-semibold font-sans">
                +{flavors.length - 4}
              </span>
            )}
          </div>
        </div>

        <h3 className="font-serif text-xl sm:text-[1.4rem] font-bold text-[#111827] group-hover:text-[#2E5A44] transition-colors leading-snug line-clamp-2">
          {productName}
        </h3>

        <p className="mt-2 text-[13px] text-[#6B7280] font-light leading-relaxed line-clamp-2 font-sans">
          {productDesc}
        </p>

        {/* Price block — one clear number, with the member price as a subordinate line */}
        <div className="mt-auto pt-5">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#111827] font-mono tracking-tight">
              ${basePrice.toFixed(2)}
            </span>
            {isLowStock && (
              <span className="ml-auto text-[10px] font-bold uppercase tracking-[0.12em] text-[#B45309] font-sans">
                {t.catalog.lowStock}
              </span>
            )}
          </div>
          <p className="mt-1 text-[11px] text-[#2E5A44] font-semibold font-sans">
            <span className="font-mono">${subscriptionPrice.toFixed(2)}</span>
            {language === 'fr' ? ' /mois avec abonnement' : ' /mo with subscription'}
          </p>

          <button
            onClick={handleAddToCart}
            className={`mt-4 w-full py-3.5 px-5 rounded-full font-bold text-xs uppercase tracking-[0.12em] transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer focus-luxe font-sans ${
              isAdded
                ? 'bg-[#2E5A44] text-white'
                : 'bg-[#111827] hover:bg-[#2E5A44] text-white shadow-luxe hover:shadow-luxe-lg'
            }`}
          >
            {isAdded ? (
              <>
                <Check className="w-4 h-4" />
                <span>{t.product.addedToCart}</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4" />
                <span>{t.product.addToCart}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
