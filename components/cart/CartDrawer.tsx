'use client';

import React from 'react';
import Image from 'next/image';
import { X, ShoppingBag, Trash2, Plus, Minus, RefreshCw, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { useCartStore } from '@/lib/store/useCartStore';
import { useLanguage } from '@/lib/i18n/useLanguage';

interface CartDrawerProps {
  onCheckout: () => void;
}

export function CartDrawer({ onCheckout }: CartDrawerProps) {
  const { language, t } = useLanguage();
  const {
    items,
    isCartOpen,
    closeCart,
    removeItem,
    updateQuantity,
    togglePurchaseType,
    clearCart,
    getSubtotal,
    getTotalSavings,
    getItemCount,
  } = useCartStore();

  if (!isCartOpen) return null;

  const subtotal = getSubtotal();
  const totalSavings = getTotalSavings();
  const itemCount = getItemCount();

  // Free shipping threshold at $50
  const freeShippingThreshold = 50;
  const netSubtotal = subtotal - totalSavings;
  const isFreeShipping = netSubtotal >= freeShippingThreshold || itemCount === 0;
  const shippingCost = isFreeShipping ? 0 : 9.99;
  const finalTotal = netSubtotal + shippingCost;
  const amountNeededForFreeShipping = Math.max(0, freeShippingThreshold - netSubtotal);
  const shippingProgress = Math.min(100, (netSubtotal / freeShippingThreshold) * 100);

  const handleShopSupplements = () => {
    closeCart();
    const catalogEl = document.getElementById('catalog');
    if (catalogEl) {
      catalogEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleProceedToCheckout = () => {
    closeCart();
    onCheckout();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fade-in">
      {/* Backdrop with Blur */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={closeCart}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#FDFBF7] shadow-2xl flex flex-col justify-between border-l border-[#EAF2ED]">
          {/* Drawer Header */}
          <div className="p-6 bg-white border-b border-[#EAF2ED] flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShoppingBag className="w-5 h-5 text-[#2E5A44]" />
              <h2 className="font-serif text-lg font-bold text-[#111827]">
                {t.cart.title}
              </h2>
              {itemCount > 0 && (
                <span className="bg-[#2E5A44] text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
                  {itemCount}
                </span>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {items.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs text-gray-400 hover:text-red-600 transition-colors mr-2"
                  title={t.toasts.cartCleared}
                >
                  {language === 'fr' ? 'Vider' : 'Clear'}
                </button>
              )}
              <button
                onClick={closeCart}
                className="p-2 text-gray-400 hover:text-[#111827] hover:bg-[#EAF2ED] rounded-full transition-colors"
                aria-label="Close cart"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Drawer Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Free Shipping Progress Indicator */}
            {items.length > 0 && (
              <div className="bg-white p-3.5 rounded-xl border border-[#C6DFD1] space-y-2 shadow-2xs">
                <div className="flex items-center justify-between text-xs font-medium text-gray-700">
                  <span className="flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#2E5A44]" />
                    {isFreeShipping ? (
                      <span className="text-[#2E5A44] font-bold">
                        {language === 'fr'
                          ? '🎉 Livraison express offerte débloquée !'
                          : '🎉 Free Express Shipping Unlocked!'}
                      </span>
                    ) : (
                      <span>
                        {language === 'fr'
                          ? `Ajoutez ${amountNeededForFreeShipping.toFixed(2)}$ de plus pour la livraison offerte`
                          : `Add $${amountNeededForFreeShipping.toFixed(2)} more for Free Shipping`}
                      </span>
                    )}
                  </span>
                  <span className="font-bold text-[#2E5A44]">
                    {isFreeShipping ? t.cart.freeShipping : `$${shippingCost.toFixed(2)}`}
                  </span>
                </div>
                <div className="w-full bg-[#EAF2ED] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#2E5A44] h-full transition-all duration-500 rounded-full"
                    style={{ width: `${shippingProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Empty Cart State */}
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
                <div className="w-20 h-20 bg-[#EAF2ED] rounded-full flex items-center justify-center text-[#2E5A44] shadow-inner">
                  <ShoppingBag className="w-10 h-10" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-serif text-lg font-bold text-[#111827]">
                    {t.cart.emptyTitle}
                  </h3>
                  <p className="text-xs text-gray-500 max-w-xs leading-relaxed">
                    {t.cart.emptyText}
                  </p>
                </div>
                <button
                  onClick={handleShopSupplements}
                  className="px-6 py-3 bg-[#2E5A44] hover:bg-[#244736] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center space-x-2"
                >
                  <span>{language === 'fr' ? 'Découvrir nos suppléments' : 'Shop Supplements'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              /* Item List */
              <div className="space-y-3">
                {items.map((item) => {
                  const itemName = language === 'fr' ? item.nameFr : item.nameEn;
                  const itemTotalPrice = item.discountedPrice * item.quantity;
                  const originalTotalPrice = item.unitPrice * item.quantity;
                  const isSubscription = item.purchaseType === 'subscription';

                  return (
                    <div
                      key={item.id}
                      className="bg-white p-4 rounded-xl border border-[#EAF2ED] shadow-2xs space-y-3 transition-all hover:border-[#C6DFD1]"
                    >
                      <div className="flex space-x-3">
                        {/* Image Thumbnail */}
                        <div className="relative w-16 h-16 bg-[#FDFBF7] rounded-lg p-1 border border-[#EAF2ED] flex-shrink-0 flex items-center justify-center">
                          <Image
                            src={item.imageUrl}
                            alt={itemName}
                            fill
                            className="object-contain p-1"
                            sizes="64px"
                          />
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <h4 className="font-serif text-xs font-bold text-[#111827] truncate pr-2">
                              {itemName}
                            </h4>
                            <button
                              onClick={() => removeItem(item.id)}
                              className="text-gray-400 hover:text-red-500 transition-colors p-0.5"
                              title={t.cart.remove}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Flavor & Size Badges */}
                          <div className="flex flex-wrap gap-1 mt-1">
                            <span className="bg-[#EAF2ED] text-[#2E5A44] text-[10px] font-semibold px-2 py-0.5 rounded">
                              {item.selectedFlavor}
                            </span>
                            <span className="bg-gray-100 text-gray-600 text-[10px] font-semibold px-2 py-0.5 rounded">
                              {item.selectedSize}
                            </span>
                          </div>

                          {/* Price & Quantity Controls */}
                          <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#FDFBF7]">
                            {/* Qty +/- */}
                            <div className="flex items-center border border-[#C6DFD1] rounded-md bg-white">
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="p-1 text-gray-500 hover:text-[#2E5A44]"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="px-2 text-xs font-bold text-[#111827]">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="p-1 text-gray-500 hover:text-[#2E5A44]"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            {/* Price */}
                            <div className="text-right">
                              {isSubscription && (
                                <span className="text-[10px] text-gray-400 line-through mr-1.5">
                                  ${originalTotalPrice.toFixed(2)}
                                </span>
                              )}
                              <span
                                className={`text-xs font-extrabold ${
                                  isSubscription ? 'text-[#2E5A44]' : 'text-[#111827]'
                                }`}
                              >
                                ${itemTotalPrice.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 1-Click Purchase Model Toggle Button */}
                      <div className="pt-1">
                        <button
                          onClick={() => togglePurchaseType(item.id)}
                          className={`w-full py-1.5 px-2.5 rounded-lg text-[11px] font-semibold transition-all flex items-center justify-between border ${
                            isSubscription
                              ? 'bg-[#EAF2ED]/70 border-[#2E5A44]/40 text-[#2E5A44]'
                              : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center space-x-1.5">
                            <RefreshCw
                              className={`w-3 h-3 ${isSubscription ? 'animate-spin-slow' : ''}`}
                            />
                            <span>
                              {isSubscription ? t.cart.subscriptionBadge : t.cart.oneTimeBadge}
                            </span>
                          </div>
                          <span className="text-[10px] underline font-bold">
                            {isSubscription
                              ? language === 'fr'
                                ? 'Passer à Achat Unique'
                                : 'Switch to One-Time'
                              : language === 'fr'
                              ? 'S’abonner (-20%)'
                              : 'Subscribe & Save 20%'}
                          </span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Drawer Footer & Summary */}
          {items.length > 0 && (
            <div className="p-6 bg-white border-t border-[#EAF2ED] space-y-4">
              {/* Subscribe & Save 20% Savings Alert Banner */}
              {totalSavings > 0 && (
                <div className="bg-[#2E5A44]/10 border border-[#2E5A44]/30 p-3 rounded-xl flex items-center space-x-3 text-xs text-[#2E5A44]">
                  <Sparkles className="w-5 h-5 text-[#2E5A44] flex-shrink-0" />
                  <div>
                    <div className="font-bold">
                      {language === 'fr' ? 'Privilège Abonné Actif !' : 'Subscriber Privileges Active!'}
                    </div>
                    <div className="text-[11px] text-[#2E5A44]/90">
                      {language === 'fr'
                        ? `Vous économisez ${totalSavings.toFixed(2)}$ chaque mois sur cette commande !`
                        : `You save $${totalSavings.toFixed(2)} per month with 20% Subscribe & Save!`}
                    </div>
                  </div>
                </div>
              )}

              {/* Price Calculation Summary */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-gray-500">
                  <span>{t.cart.subtotal}</span>
                  <span className="font-semibold text-gray-700">${subtotal.toFixed(2)}</span>
                </div>

                {totalSavings > 0 && (
                  <div className="flex justify-between text-[#2E5A44] font-medium">
                    <span>{t.cart.subscriptionSavings}</span>
                    <span>-${totalSavings.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-gray-500">
                  <span>{t.cart.shipping}</span>
                  <span className="font-semibold text-gray-700">
                    {isFreeShipping ? (
                      <span className="text-[#2E5A44] font-bold">{t.cart.freeShipping}</span>
                    ) : (
                      `$${shippingCost.toFixed(2)}`
                    )}
                  </span>
                </div>

                <div className="pt-2 border-t border-[#EAF2ED] flex justify-between items-center text-sm font-extrabold text-[#111827]">
                  <span>{t.cart.total}</span>
                  <span className="text-base text-[#2E5A44]">${finalTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Security guarantee */}
              <div className="flex items-center justify-center space-x-1.5 text-[10px] text-gray-400 uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-[#2E5A44]" />
                <span>Encrypted 256-Bit SSL Checkout</span>
              </div>

              {/* Checkout CTA */}
              <button
                onClick={handleProceedToCheckout}
                className="w-full py-3.5 bg-[#2E5A44] hover:bg-[#244736] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2"
              >
                <span>{t.cart.checkoutCta}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
