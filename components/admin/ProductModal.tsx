'use client';

import React, { useState, useEffect } from 'react';
import { type Product } from '@/lib/db/schema';
import { useLanguage } from '@/lib/i18n/useLanguage';
import { X, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import { z } from 'zod';
import { toast } from 'sonner';

const productSchema = z.object({
  nameEn: z.string().min(2, 'English name must be at least 2 characters'),
  nameFr: z.string().min(2, 'French name must be at least 2 characters'),
  descriptionEn: z.string().min(5, 'English description is required'),
  descriptionFr: z.string().min(5, 'French description is required'),
  price: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: 'Price must be a valid positive number',
  }),
  category: z.string().min(1, 'Category is required'),
  imageUrl: z.string().min(1, 'Image URL is required'),
  flavors: z.string(),
  sizes: z.string(),
  stock: z.number().int().nonnegative(),
  isFeatured: z.boolean(),
});

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
  onSaveSuccess: () => void;
}

const PRESET_IMAGES = [
  '/images/whey-isolate.svg',
  '/images/creatine.svg',
  '/images/collagen.svg',
  '/images/protein-bar.svg',
  '/images/plant-protein.svg',
  '/images/pre-workout.svg',
  '/images/steel-shaker.svg',
];

export function ProductModal({ isOpen, onClose, product, onSaveSuccess }: ProductModalProps) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    nameEn: '',
    nameFr: '',
    descriptionEn: '',
    descriptionFr: '',
    price: '39.99',
    category: 'whey',
    imageUrl: '/images/whey-isolate.svg',
    flavors: 'Vanilla Bean, Dark Chocolate',
    sizes: '1kg, 2.5kg',
    stock: 100,
    isFeatured: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        nameEn: product.nameEn,
        nameFr: product.nameFr,
        descriptionEn: product.descriptionEn,
        descriptionFr: product.descriptionFr,
        price: String(product.price),
        category: product.category,
        imageUrl: product.imageUrl,
        flavors: Array.isArray(product.flavors) ? product.flavors.join(', ') : '',
        sizes: Array.isArray(product.sizes) ? product.sizes.join(', ') : '',
        stock: product.stock ?? 100,
        isFeatured: product.isFeatured ?? false,
      });
    } else {
      setFormData({
        nameEn: '',
        nameFr: '',
        descriptionEn: '',
        descriptionFr: '',
        price: '39.99',
        category: 'whey',
        imageUrl: '/images/whey-isolate.svg',
        flavors: 'Vanilla Bean, Dark Chocolate',
        sizes: '1kg, 2.5kg',
        stock: 100,
        isFeatured: false,
      });
    }
    setErrors({});
  }, [product, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = productSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          fieldErrors[issue.path[0] as string] = issue.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    try {
      const flavorsArray = formData.flavors
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const sizesArray = formData.sizes
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        id: product?.id,
        nameEn: formData.nameEn,
        nameFr: formData.nameFr,
        descriptionEn: formData.descriptionEn,
        descriptionFr: formData.descriptionFr,
        price: formData.price,
        category: formData.category,
        imageUrl: formData.imageUrl,
        flavors: flavorsArray,
        sizes: sizesArray,
        stock: Number(formData.stock),
        isFeatured: formData.isFeatured,
      };

      const method = product ? 'PUT' : 'POST';
      const res = await fetch('/api/admin/products', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(product ? t.toasts.productUpdated : t.toasts.productCreated);
        onSaveSuccess();
        onClose();
      } else {
        toast.error('Failed to save product', { description: data.error });
      }
    } catch (err: any) {
      toast.error(t.toasts.errorOccurred, { description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#FDFBF7] border border-[#C6DFD1] rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-[#2E5A44] text-white p-6 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-2 text-xs font-semibold tracking-wider text-[#C6DFD1] uppercase mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Product Formulation Engine</span>
          </div>
          <h3 className="font-serif text-2xl font-bold">
            {product ? t.admin.products.editProduct : t.admin.products.addProduct}
          </h3>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Names */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-gray-700 uppercase mb-1">
                {t.admin.products.nameEn} *
              </label>
              <input
                type="text"
                value={formData.nameEn}
                onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                placeholder="Pure Isolate Whey Protein"
                className="w-full px-3 py-2 bg-white border border-[#C6DFD1] rounded-xl focus:ring-2 focus:ring-[#2E5A44]/30 outline-none"
              />
              {errors.nameEn && <p className="text-red-500 text-[10px] mt-1">{errors.nameEn}</p>}
            </div>

            <div>
              <label className="block font-bold text-gray-700 uppercase mb-1">
                {t.admin.products.nameFr} *
              </label>
              <input
                type="text"
                value={formData.nameFr}
                onChange={(e) => setFormData({ ...formData, nameFr: e.target.value })}
                placeholder="Protéine de Lactosérum Isolat Pure"
                className="w-full px-3 py-2 bg-white border border-[#C6DFD1] rounded-xl focus:ring-2 focus:ring-[#2E5A44]/30 outline-none"
              />
              {errors.nameFr && <p className="text-red-500 text-[10px] mt-1">{errors.nameFr}</p>}
            </div>
          </div>

          {/* Descriptions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-gray-700 uppercase mb-1">
                {t.admin.products.descEn} *
              </label>
              <textarea
                rows={2}
                value={formData.descriptionEn}
                onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-[#C6DFD1] rounded-xl focus:ring-2 focus:ring-[#2E5A44]/30 outline-none"
              />
              {errors.descriptionEn && (
                <p className="text-red-500 text-[10px] mt-1">{errors.descriptionEn}</p>
              )}
            </div>

            <div>
              <label className="block font-bold text-gray-700 uppercase mb-1">
                {t.admin.products.descFr} *
              </label>
              <textarea
                rows={2}
                value={formData.descriptionFr}
                onChange={(e) => setFormData({ ...formData, descriptionFr: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-[#C6DFD1] rounded-xl focus:ring-2 focus:ring-[#2E5A44]/30 outline-none"
              />
              {errors.descriptionFr && (
                <p className="text-red-500 text-[10px] mt-1">{errors.descriptionFr}</p>
              )}
            </div>
          </div>

          {/* Price, Category, Stock */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-gray-700 uppercase mb-1">
                {t.admin.products.price} *
              </label>
              <input
                type="text"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="49.99"
                className="w-full px-3 py-2 bg-white border border-[#C6DFD1] rounded-xl focus:ring-2 focus:ring-[#2E5A44]/30 outline-none font-mono"
              />
              {errors.price && <p className="text-red-500 text-[10px] mt-1">{errors.price}</p>}
            </div>

            <div>
              <label className="block font-bold text-gray-700 uppercase mb-1">
                {t.admin.products.category} *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-[#C6DFD1] rounded-xl focus:ring-2 focus:ring-[#2E5A44]/30 outline-none"
              >
                <option value="whey">Whey Protein</option>
                <option value="creatine">Creatine</option>
                <option value="wellness">Wellness & Collagen</option>
                <option value="snacks">Artisanal Snacks</option>
                <option value="plant">Plant Protein</option>
                <option value="preworkout">Pre-Workout</option>
                <option value="accessories">Accessories</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-gray-700 uppercase mb-1">
                {t.admin.products.stock}
              </label>
              <input
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-white border border-[#C6DFD1] rounded-xl focus:ring-2 focus:ring-[#2E5A44]/30 outline-none font-mono"
              />
            </div>
          </div>

          {/* Image Selection */}
          <div>
            <label className="block font-bold text-gray-700 uppercase mb-1">
              {t.admin.products.imageUrl} *
            </label>
            <div className="flex gap-2">
              <select
                value={PRESET_IMAGES.includes(formData.imageUrl) ? formData.imageUrl : 'custom'}
                onChange={(e) => {
                  if (e.target.value !== 'custom') {
                    setFormData({ ...formData, imageUrl: e.target.value });
                  }
                }}
                className="px-3 py-2 bg-white border border-[#C6DFD1] rounded-xl outline-none"
              >
                {PRESET_IMAGES.map((img) => (
                  <option key={img} value={img}>
                    {img}
                  </option>
                ))}
                <option value="custom">Custom Path...</option>
              </select>
              <input
                type="text"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="/images/whey-isolate.svg"
                className="flex-1 px-3 py-2 bg-white border border-[#C6DFD1] rounded-xl outline-none font-mono"
              />
            </div>
          </div>

          {/* Flavors & Sizes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-gray-700 uppercase mb-1">
                {t.admin.products.flavors}
              </label>
              <input
                type="text"
                value={formData.flavors}
                onChange={(e) => setFormData({ ...formData, flavors: e.target.value })}
                placeholder="Vanilla, Chocolate, Berry"
                className="w-full px-3 py-2 bg-white border border-[#C6DFD1] rounded-xl outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 uppercase mb-1">
                {t.admin.products.sizes}
              </label>
              <input
                type="text"
                value={formData.sizes}
                onChange={(e) => setFormData({ ...formData, sizes: e.target.value })}
                placeholder="1kg, 2.5kg"
                className="w-full px-3 py-2 bg-white border border-[#C6DFD1] rounded-xl outline-none"
              />
            </div>
          </div>

          {/* Featured Checkbox */}
          <div className="flex items-center space-x-2 pt-2">
            <input
              type="checkbox"
              id="isFeatured"
              checked={formData.isFeatured}
              onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
              className="w-4 h-4 text-[#2E5A44] rounded accent-[#2E5A44]"
            />
            <label htmlFor="isFeatured" className="font-bold text-gray-800">
              {t.admin.products.isFeatured}
            </label>
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-[#EAF2ED]">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
            >
              {t.admin.cancel}
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2.5 bg-[#2E5A44] hover:bg-[#234735] text-white font-bold rounded-xl transition-all shadow-md disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : t.admin.saveProduct}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
