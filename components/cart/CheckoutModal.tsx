'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  X,
  CheckCircle2,
  CreditCard,
  Truck,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Calendar,
  Lock,
} from 'lucide-react';
import { z } from 'zod';
import { useCartStore } from '@/lib/store/useCartStore';
import { useLanguage } from '@/lib/i18n/useLanguage';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useScrollLock } from '@/lib/ui/scroll-lock';
import { useEscapeKey } from '@/lib/ui/useEscapeKey';
import { axiosClient } from '@/lib/api/axiosClient';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CheckoutModal({ isOpen, onClose }: CheckoutModalProps) {
  const { language, t } = useLanguage();
  const { user, isLoggedIn } = useAuth();
  const router = useRouter();
  const { items, clearCart, getSubtotal, getTotalSavings, getItemCount } = useCartStore();

  const [step, setStep] = useState<'auth_gate' | 'shipping' | 'payment' | 'confirmation'>('shipping');
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderId, setOrderId] = useState<string>('');

  // Shipping Form State
  const [shippingData, setShippingData] = useState({
    fullName: user?.fullName || 'Alex Vance',
    email: user?.email || 'alex.vance@trueformula.io',
    address: '450 Sherbrooke St W',
    city: 'Montreal',
    postalCode: 'H3A 1B9',
    country: 'Canada',
  });

  React.useEffect(() => {
    if (user) {
      setShippingData((prev) => ({
        ...prev,
        fullName: user.fullName || prev.fullName,
        email: user.email || prev.email,
      }));
    }
  }, [user]);

  React.useEffect(() => {
    if (isOpen && !isLoggedIn) {
      setStep('auth_gate');
    } else if (isOpen && isLoggedIn && step === 'auth_gate') {
      setStep('shipping');
    }
  }, [isOpen, isLoggedIn]);

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [idempotencyKey, setIdempotencyKey] = useState<string>('');

  React.useEffect(() => {
    if (isOpen && !idempotencyKey) {
      setIdempotencyKey(typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `IDEM-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`);
    } else if (!isOpen) {
      setIdempotencyKey('');
    }
  }, [isOpen]);

  // Defined above the hooks below that reference it — a `const` arrow function
  // used earlier in the body would hit the temporal dead zone.
  const handleClose = React.useCallback(() => {
    setStep('shipping');
    onClose();
  }, [onClose]);

  // Pause page scrolling while the overlay owns the viewport.
  useScrollLock(isOpen);
  useEscapeKey(isOpen, handleClose);

  if (!isOpen) return null;

  const subtotal = getSubtotal();
  const totalSavings = getTotalSavings();
  const itemCount = getItemCount();
  const freeShippingThreshold = 50;
  const netSubtotal = subtotal - totalSavings;
  const isFreeShipping = netSubtotal >= freeShippingThreshold || itemCount === 0;
  const shippingCost = isFreeShipping ? 0 : 9.99;
  const finalTotal = netSubtotal + shippingCost;

  // Next monthly billing date calculation (30 days from today)
  const nextBillingDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(
    language === 'fr' ? 'fr-FR' : 'en-US',
    { month: 'short', day: 'numeric', year: 'numeric' }
  );

  const hasSubscriptionItems = items.some((item) => item.purchaseType === 'subscription');

  // Zod Shipping Schema
  const shippingSchema = z.object({
    fullName: z
      .string()
      .min(2, language === 'fr' ? 'Le nom doit contenir au moins 2 caractères' : 'Name must be at least 2 characters'),
    email: z
      .string()
      .email(language === 'fr' ? 'Adresse email invalide' : 'Invalid email address'),
    address: z
      .string()
      .min(5, language === 'fr' ? 'Adresse civique requise (min 5 car.)' : 'Street address is required'),
    city: z
      .string()
      .min(2, language === 'fr' ? 'La ville est requise' : 'City is required'),
    postalCode: z
      .string()
      .min(3, language === 'fr' ? 'Code postal invalide' : 'Invalid postal code'),
    country: z
      .string()
      .min(2, language === 'fr' ? 'Le pays est requis' : 'Country is required'),
  });

  const handleInputChange = (field: string, value: string) => {
    setShippingData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleProceedToPayment = () => {
    const result = shippingSchema.safeParse(shippingData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          fieldErrors[issue.path[0] as string] = issue.message;
        }
      });
      setFormErrors(fieldErrors);

      const firstErrorMsg = result.error.issues[0]?.message || 'Please check all required shipping fields.';
      toast.error(language === 'fr' ? 'Erreur de validation' : 'Validation Error', {
        description: firstErrorMsg,
      });
      return;
    }

    setFormErrors({});
    setStep('payment');
  };

  const handlePlaceOrder = async () => {
    setIsProcessing(true);

    try {
      const checkoutPayload = {
        email: shippingData.email,
        shippingAddress: {
          fullName: shippingData.fullName,
          email: shippingData.email,
          address: shippingData.address,
          city: shippingData.city,
          postalCode: shippingData.postalCode,
          country: shippingData.country,
        },
        items: items.map((item) => ({
          productId: item.productId || item.id,
          nameEn: item.nameEn,
          nameFr: item.nameFr,
          quantity: item.quantity,
          unitPrice: item.discountedPrice,
          purchaseType: item.purchaseType,
          selectedFlavor: item.selectedFlavor,
          selectedSize: item.selectedSize,
        })),
        paymentMethod: 'mock_card',
        language: language,
        idempotencyKey: idempotencyKey,
      };

      const res = await axiosClient.post('/api/checkout', checkoutPayload);
      const data = res.data;

      if (!data.success) {
        toast.error(language === 'fr' ? 'Échec du paiement' : 'Payment Failed', {
          description: data.error || (language === 'fr' ? 'Impossible de traiter la commande.' : 'Payment authorization declined.'),
        });
        return;
      }

      const generatedOrderId = data.orderId || `ORD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      setOrderId(generatedOrderId);
      setStep('confirmation');
      clearCart();

      toast.success(t.checkout.successTitle, {
        description: `${t.checkout.successMessage} #${generatedOrderId}`,
      });
    } catch (err: any) {
      toast.error(language === 'fr' ? 'Erreur Réseau' : 'Network Error', {
        description: err.message || 'An error occurred while connecting to checkout server.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  /** Ordered steps, used by the responsive progress indicator. */
  const STEPS: Array<{ key: typeof step; label: string }> = [
    { key: 'shipping', label: t.checkout.shippingInfo },
    { key: 'payment', label: t.checkout.paymentInfo },
    { key: 'confirmation', label: 'Confirmation' },
  ];
  const currentStepIndex = Math.max(0, STEPS.findIndex((s) => s.key === step));

  return (
    // The overlay itself no longer scrolls. It used to, which meant a tall modal
    // pushed its own header — and the close button with it — above the top of a
    // small screen, leaving no way out of the checkout. The modal is now capped
    // to the viewport and scrolls internally instead.
    <div
      onClick={handleClose}
      className="fixed inset-0 z-50 overflow-hidden bg-black/65 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-6 animate-fade-in"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t.checkout.title}
        className="relative bg-[#FDFBF7] w-full max-w-3xl rounded-t-2xl sm:rounded-2xl shadow-2xl border border-[#EAF2ED] overflow-hidden flex flex-col max-h-[92dvh] sm:max-h-[calc(100dvh-3rem)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header — pinned, never scrolls out of reach */}
        <div className="bg-white px-4 sm:px-6 py-4 sm:py-5 border-b border-[#EAF2ED] flex items-center justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#2E5A44]">
              {t.header.logoTitle} • Editorial Apothecary
            </span>
            <h2 className="font-serif text-lg sm:text-xl font-bold text-[#111827] truncate">
              {t.checkout.title}
            </h2>
          </div>
          {/* 44px minimum touch target */}
          <button
            onClick={handleClose}
            className="shrink-0 w-11 h-11 flex items-center justify-center text-gray-500 hover:text-[#111827] hover:bg-[#EAF2ED] rounded-full transition-colors focus-luxe"
            aria-label="Close checkout"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress — the three labels plus two connectors could not fit a
            phone, so the row overflowed off the right edge. Narrow screens get a
            compact "Step n of 3" counter instead. */}
        <div className="bg-[#EAF2ED]/60 px-4 sm:px-6 py-3 border-b border-[#EAF2ED] text-xs font-semibold shrink-0">
          {/* Mobile */}
          <div className="flex items-center gap-3 sm:hidden">
            <span className="w-6 h-6 shrink-0 rounded-full bg-[#2E5A44] text-white flex items-center justify-center text-[10px] font-bold">
              {currentStepIndex + 1}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] uppercase tracking-wider text-gray-500">
                {language === 'fr'
                  ? `Étape ${currentStepIndex + 1} sur ${STEPS.length}`
                  : `Step ${currentStepIndex + 1} of ${STEPS.length}`}
              </div>
              <div className="text-[#2E5A44] truncate">{STEPS[currentStepIndex].label}</div>
            </div>
            <div className="flex gap-1 shrink-0" aria-hidden="true">
              {STEPS.map((s, i) => (
                <span
                  key={s.key}
                  className={`w-1.5 h-1.5 rounded-full ${
                    i <= currentStepIndex ? 'bg-[#2E5A44]' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Desktop */}
          <div className="hidden sm:flex items-center justify-between">
            {STEPS.map((s, i) => (
              <React.Fragment key={s.key}>
                {i > 0 && <div className="h-0.5 flex-1 mx-4 bg-gray-300" />}
                <div
                  className={`flex items-center space-x-2 ${
                    step === s.key ? 'text-[#2E5A44]' : 'text-gray-500'
                  }`}
                >
                  <span
                    className={`w-5 h-5 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      step === s.key ? 'bg-[#2E5A44] text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span>{s.label}</span>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Modal Body — the only scrolling region */}
        <div data-lenis-prevent className="flex-1 overflow-y-auto overscroll-contain p-5 sm:p-8">
          {/* STEP 0: MANDATORY AUTHENTICATION GATE */}
          {step === 'auth_gate' && (
            <div className="text-center py-8 space-y-6">
              <div className="w-16 h-16 bg-[#EAF2ED] text-[#2E5A44] rounded-full flex items-center justify-center mx-auto border border-[#C6DFD1]">
                <Lock className="w-8 h-8" />
              </div>
              <div className="space-y-2 max-w-md mx-auto">
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#2E5A44]">
                  {language === 'fr' ? 'Connexion requise' : 'Member Account Required'}
                </span>
                <h3 className="font-serif text-2xl font-bold text-[#111827]">
                  {language === 'fr' ? 'Connectez-vous pour finaliser la commande' : 'Please Sign In to Complete Checkout'}
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed font-light">
                  {language === 'fr'
                    ? 'Conformément aux exigences du club, un compte membre actif est obligatoire avant d’accéder au paiement et de bénéficier des abonnements.'
                    : 'According to store policy, an active member account is required before proceeding to checkout and subscription management.'}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    router.push('/login');
                  }}
                  className="w-full sm:w-auto px-8 py-3.5 bg-[#2E5A44] hover:bg-[#244736] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center space-x-2"
                >
                  <span>{language === 'fr' ? 'Se Connecter / S’inscrire' : 'Sign In / Register'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 1: SHIPPING */}
          {step === 'shipping' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-serif text-lg font-bold text-[#111827]">
                  {t.checkout.shippingInfo}
                </h3>
                <button
                  type="button"
                  onClick={() =>
                    setShippingData({
                      fullName: 'Alex Vance',
                      email: 'alex.vance@trueformula.io',
                      address: '450 Sherbrooke St W',
                      city: 'Montreal',
                      postalCode: 'H3A 1B9',
                      country: 'Canada',
                    })
                  }
                  className="text-[11px] text-[#2E5A44] font-semibold underline hover:text-[#244736]"
                >
                  {language === 'fr' ? 'Pré-remplir démo' : 'Pre-fill Demo Data'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    {t.checkout.fullName} *
                  </label>
                  <input
                    type="text"
                    value={shippingData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    className={`w-full px-4 py-2.5 bg-white border rounded-xl text-xs font-sans focus:outline-none focus:ring-2 focus:ring-[#2E5A44]/30 ${
                      formErrors.fullName ? 'border-red-500' : 'border-[#C6DFD1]'
                    }`}
                  />
                  {formErrors.fullName && (
                    <span className="text-[11px] text-red-600 flex items-center space-x-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>{formErrors.fullName}</span>
                    </span>
                  )}
                </div>

                {/* Email */}
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    {t.checkout.email} *
                  </label>
                  <input
                    type="email"
                    value={shippingData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`w-full px-4 py-2.5 bg-white border rounded-xl text-xs font-sans focus:outline-none focus:ring-2 focus:ring-[#2E5A44]/30 ${
                      formErrors.email ? 'border-red-500' : 'border-[#C6DFD1]'
                    }`}
                  />
                  {formErrors.email && (
                    <span className="text-[11px] text-red-600 flex items-center space-x-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>{formErrors.email}</span>
                    </span>
                  )}
                </div>

                {/* Address */}
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    {t.checkout.address} *
                  </label>
                  <input
                    type="text"
                    value={shippingData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className={`w-full px-4 py-2.5 bg-white border rounded-xl text-xs font-sans focus:outline-none focus:ring-2 focus:ring-[#2E5A44]/30 ${
                      formErrors.address ? 'border-red-500' : 'border-[#C6DFD1]'
                    }`}
                  />
                  {formErrors.address && (
                    <span className="text-[11px] text-red-600 flex items-center space-x-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>{formErrors.address}</span>
                    </span>
                  )}
                </div>

                {/* City */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    {t.checkout.city} *
                  </label>
                  <input
                    type="text"
                    value={shippingData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className={`w-full px-4 py-2.5 bg-white border rounded-xl text-xs font-sans focus:outline-none focus:ring-2 focus:ring-[#2E5A44]/30 ${
                      formErrors.city ? 'border-red-500' : 'border-[#C6DFD1]'
                    }`}
                  />
                  {formErrors.city && (
                    <span className="text-[11px] text-red-600 flex items-center space-x-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>{formErrors.city}</span>
                    </span>
                  )}
                </div>

                {/* Postal Code */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    {t.checkout.postalCode} *
                  </label>
                  <input
                    type="text"
                    value={shippingData.postalCode}
                    onChange={(e) => handleInputChange('postalCode', e.target.value)}
                    className={`w-full px-4 py-2.5 bg-white border rounded-xl text-xs font-sans focus:outline-none focus:ring-2 focus:ring-[#2E5A44]/30 ${
                      formErrors.postalCode ? 'border-red-500' : 'border-[#C6DFD1]'
                    }`}
                  />
                  {formErrors.postalCode && (
                    <span className="text-[11px] text-red-600 flex items-center space-x-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>{formErrors.postalCode}</span>
                    </span>
                  )}
                </div>

                {/* Country */}
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    {t.checkout.country} *
                  </label>
                  <input
                    type="text"
                    value={shippingData.country}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    className={`w-full px-4 py-2.5 bg-white border rounded-xl text-xs font-sans focus:outline-none focus:ring-2 focus:ring-[#2E5A44]/30 ${
                      formErrors.country ? 'border-red-500' : 'border-[#C6DFD1]'
                    }`}
                  />
                  {formErrors.country && (
                    <span className="text-[11px] text-red-600 flex items-center space-x-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>{formErrors.country}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Action */}
              <div className="pt-4 border-t border-[#EAF2ED] flex justify-end">
                <button
                  onClick={handleProceedToPayment}
                  className="px-6 py-3 bg-[#2E5A44] hover:bg-[#244736] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center space-x-2"
                >
                  <span>{language === 'fr' ? 'Continuer vers le Paiement' : 'Proceed to Review & Payment'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: REVIEW & PAYMENT */}
          {step === 'payment' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Left: Order Items Summary & Billing info */}
                <div className="md:col-span-7 space-y-4">
                  <h3 className="font-serif text-base font-bold text-[#111827] flex items-center space-x-2">
                    <Truck className="w-4 h-4 text-[#2E5A44]" />
                    <span>{t.checkout.orderSummary}</span>
                  </h3>

                  <div data-lenis-prevent className="bg-white rounded-xl border border-[#EAF2ED] p-4 max-h-60 overflow-y-auto space-y-3">
                    {items.map((item) => {
                      const itemName = language === 'fr' ? item.nameFr : item.nameEn;
                      const isSub = item.purchaseType === 'subscription';
                      const itemTotal = item.discountedPrice * item.quantity;

                      return (
                        <div
                          key={item.id}
                          className="flex items-center justify-between border-b border-gray-100 last:border-0 pb-2.5 last:pb-0"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="relative w-10 h-10 bg-[#FDFBF7] rounded border p-0.5 flex-shrink-0">
                              <Image src={item.imageUrl} alt={itemName} fill className="object-contain" sizes="40px" />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-[#111827] line-clamp-1">{itemName}</div>
                              <div className="text-[10px] text-gray-500">
                                {item.selectedFlavor} • {item.selectedSize} • Qty: {item.quantity}
                              </div>
                              {isSub && (
                                <div className="mt-0.5 inline-flex items-center space-x-1 bg-[#EAF2ED] text-[#2E5A44] text-[9px] font-bold px-1.5 py-0.2 rounded border border-[#C6DFD1]">
                                  <RefreshCw className="w-2.5 h-2.5" />
                                  <span>
                                    {language === 'fr' ? 'Abonnement Mensuel' : 'Recurring Monthly'} (Prochaine: {nextBillingDate})
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-xs font-extrabold text-[#111827] ml-2">
                            ${itemTotal.toFixed(2)}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Recurring subscription info banner if applicable */}
                  {hasSubscriptionItems && (
                    <div className="bg-[#2E5A44]/10 border border-[#2E5A44]/30 rounded-xl p-3.5 flex items-start space-x-3 text-xs text-[#2E5A44]">
                      <Calendar className="w-4 h-4 text-[#2E5A44] flex-shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <span className="font-bold">
                          {language === 'fr' ? 'Information d’Abonnement Récurrent' : 'Recurring Subscription Details'}
                        </span>
                        <p className="text-[11px] leading-relaxed text-[#2E5A44]/90">
                          {language === 'fr'
                            ? `Vos articles d’abonnement seront automatiquement renouvelés le ${nextBillingDate} avec 20% de remise garantie. Vous pouvez suspendre ou annuler à tout moment dans votre espace membre.`
                            : `Subscription items automatically renew on ${nextBillingDate} with your 20% discount lock. Pause or cancel anytime from your Member Account Portal.`}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Financial Breakdown */}
                  <div className="bg-white p-4 rounded-xl border border-[#EAF2ED] space-y-1.5 text-xs">
                    <div className="flex justify-between text-gray-600">
                      <span>{t.cart.subtotal}</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>

                    {totalSavings > 0 && (
                      <div className="flex justify-between text-[#2E5A44] font-semibold">
                        <span>{t.cart.subscriptionSavings}</span>
                        <span>-${totalSavings.toFixed(2)}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-gray-600">
                      <span>{t.cart.shipping}</span>
                      <span>{isFreeShipping ? <span className="text-[#2E5A44] font-bold">{t.cart.freeShipping}</span> : `$${shippingCost.toFixed(2)}`}</span>
                    </div>

                    <div className="pt-2 border-t border-[#EAF2ED] flex justify-between font-extrabold text-sm text-[#111827]">
                      <span>{t.checkout.totalPaid}</span>
                      <span className="text-base text-[#2E5A44]">${finalTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Simulated Payment Mode Component */}
                <div className="md:col-span-5 space-y-4 bg-white p-5 rounded-xl border border-[#C6DFD1] shadow-xs flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h3 className="font-serif text-sm font-bold text-[#111827] flex items-center space-x-1.5">
                        <CreditCard className="w-4 h-4 text-[#2E5A44]" />
                        <span>{t.checkout.paymentInfo}</span>
                      </h3>
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                        Simulated Payment (Test Mode)
                      </span>
                    </div>

                    <div className="bg-[#F8FAF9] p-4 rounded-xl border border-[#C6DFD1] space-y-2">
                      <div className="text-xs text-gray-800 font-semibold flex items-center space-x-1.5">
                        <Lock className="w-3.5 h-3.5 text-[#2E5A44]" />
                        <span>{language === 'fr' ? 'Paiement sécurisé simulé' : 'Simulated Secure Checkout'}</span>
                      </div>
                      <p className="text-[11px] text-gray-500 leading-relaxed">
                        {language === 'fr'
                          ? 'En mode de démonstration, aucune information bancaire n\'est requise. Cliquez directement sur le bouton ci-dessous pour confirmer.'
                          : 'In test mode, no real credit card input is needed. Click the button below to confirm your order.'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 text-[10px] text-gray-400 flex items-center justify-center space-x-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#2E5A44]" />
                    <span>Instant 1-Click Test Order Execution</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-[#EAF2ED] flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setStep('shipping')}
                  className="px-4 py-2.5 border border-[#C6DFD1] text-gray-700 text-xs font-semibold rounded-xl hover:bg-[#EAF2ED] transition-colors flex items-center space-x-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{language === 'fr' ? 'Retour' : 'Back'}</span>
                </button>

                <button
                  onClick={handlePlaceOrder}
                  disabled={isProcessing}
                  className="px-6 py-3.5 bg-[#2E5A44] hover:bg-[#244736] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center space-x-2 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <span>{t.checkout.processing}</span>
                  ) : (
                    <>
                      <span>{t.checkout.placeOrder} (${finalTotal.toFixed(2)})</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: CONFIRMATION */}
          {step === 'confirmation' && (
            <div className="text-center py-6 space-y-6">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-2">
                <span className="bg-[#EAF2ED] text-[#2E5A44] text-[11px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full border border-[#C6DFD1]">
                  Order #{orderId}
                </span>
                <h3 className="font-serif text-2xl font-bold text-[#111827] pt-2">
                  {t.checkout.successTitle}
                </h3>
                <p className="text-xs text-gray-600 max-w-md mx-auto leading-relaxed">
                  {t.checkout.successMessage}
                </p>
              </div>

              {/* Delivery Address & Summary */}
              <div className="bg-white p-5 rounded-xl border border-[#EAF2ED] max-w-lg mx-auto text-left text-xs space-y-3">
                <div className="font-serif font-bold text-[#111827] border-b border-gray-100 pb-2">
                  {language === 'fr' ? 'Récapitulatif de livraison' : 'Delivery Summary'}
                </div>
                <div className="text-gray-600 space-y-1">
                  <div><strong className="text-gray-800">{shippingData.fullName}</strong> ({shippingData.email})</div>
                  <div>{shippingData.address}, {shippingData.city}, {shippingData.postalCode}, {shippingData.country}</div>
                </div>
                {hasSubscriptionItems && (
                  <div className="pt-2 border-t border-gray-100 text-[#2E5A44] text-[11px] flex items-center space-x-1.5">
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>
                      {language === 'fr'
                        ? `Abonnement actif. Prochain renouvellement le ${nextBillingDate}.`
                        : `Subscription active. Next billing cycle set for ${nextBillingDate}.`}
                    </span>
                  </div>
                )}
              </div>

              <button
                onClick={handleClose}
                className="px-8 py-3.5 bg-[#2E5A44] hover:bg-[#244736] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-all inline-flex items-center space-x-2"
              >
                <span>{t.cart.continueShopping}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
