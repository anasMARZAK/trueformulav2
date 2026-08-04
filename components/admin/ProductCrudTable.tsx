'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { type Product } from '@/lib/db/schema';
import { useLanguage } from '@/lib/i18n/useLanguage';
import { ProductModal } from './ProductModal';
import { Plus, Edit, Trash2, Search, RefreshCw, PackageCheck, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export function ProductCrudTable() {
  const { language, t } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/products');
      const data = await res.json();
      if (data.success && Array.isArray(data.products)) {
        setProducts(data.products);
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleAddProduct = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setIsModalOpen(true);
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`${t.admin.products.confirmDelete} (${name})`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/products?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (data.success) {
        toast.success(t.toasts.productDeleted);
        fetchProducts();
      } else {
        toast.error('Failed to delete product', { description: data.error });
      }
    } catch (err: any) {
      toast.error(t.toasts.errorOccurred, { description: err.message });
    }
  };

  const filteredProducts = products.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.nameEn.toLowerCase().includes(q) ||
      p.nameFr.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  });

  const isEn = language === 'en';

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 border border-[#E5E2D9] rounded-2xl shadow-luxe-card">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={t.admin.products.searchPlaceholder}
            className="w-full pl-9 pr-4 py-2 bg-[#FDFBF7] border border-[#E5E2D9] rounded-full text-xs font-sans placeholder:text-[#9CA3AF] focus:ring-2 focus:ring-[#2E5A44]/30 focus:border-[#2E5A44] outline-none transition-all"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        {/* Add Product Button */}
        <button
          onClick={handleAddProduct}
          className="w-full sm:w-auto px-5 py-2.5 bg-[#2E5A44] hover:bg-[#234735] text-white text-xs font-bold uppercase tracking-wider rounded-full flex items-center justify-center space-x-2 transition-all shadow-md focus-luxe"
        >
          <Plus className="w-4 h-4" />
          <span>{t.admin.products.addProduct}</span>
        </button>
      </div>

      {/* Table Container */}
      <div className="bg-white border border-[#E5E2D9] rounded-2xl overflow-hidden shadow-luxe-card">
        {isLoading ? (
          <div className="py-12 text-center text-gray-500 font-sans text-xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#2E5A44]" />
            <span>{t.admin.products.loadingProducts}</span>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-12 text-center text-gray-500 font-sans text-xs space-y-2">
            <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto opacity-60" />
            <p className="font-bold text-gray-700">{t.admin.products.noProductsFound}</p>
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F5F0E4]/60 border-b border-[#E5E2D9] text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                    <th className="py-4 px-6">{t.admin.products.productHeader}</th>
                    <th className="py-4 px-6">{t.admin.products.category}</th>
                    <th className="py-4 px-6">{t.admin.products.price}</th>
                    <th className="py-4 px-6">{t.admin.products.stock}</th>
                    <th className="py-4 px-6">{t.admin.products.statusHeader}</th>
                    <th className="py-4 px-6 text-right">{t.admin.products.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs font-sans">
                  {paginatedProducts.map((prod) => {
                    const title = isEn ? prod.nameEn : prod.nameFr;

                    return (
                      <tr key={prod.id} className="hover:bg-[#FDFBF7]/80 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-[#FDFBF7] border border-[#EAF2ED] rounded-xl p-1.5 shrink-0 flex items-center justify-center">
                              <Image
                                src={prod.imageUrl || '/images/whey-isolate.svg'}
                                alt={title}
                                width={40}
                                height={40}
                                className="object-contain max-h-10"
                              />
                            </div>
                            <div>
                              <div className="font-bold text-gray-900 flex items-center space-x-1.5">
                                <span>{title}</span>
                                {prod.isFeatured && (
                                  <span className="text-[9px] bg-amber-100 text-amber-800 font-mono px-1.5 py-0.2 rounded uppercase font-bold">
                                    {t.admin.products.featuredBadge}
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-gray-400 font-mono">ID: {prod.id}</div>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-6">
                          <span className="bg-[#EAF2ED] text-[#2E5A44] px-2.5 py-1 rounded-full text-[10px] font-bold uppercase font-mono">
                            {prod.category}
                          </span>
                        </td>

                        <td className="py-4 px-6 font-mono font-bold text-gray-900">
                          ${prod.price}
                        </td>

                        <td className="py-4 px-6 font-mono">
                          <span
                            className={`font-bold ${
                              prod.stock < 20 ? 'text-red-600' : 'text-emerald-700'
                            }`}
                          >
                            {prod.stock} {t.admin.products.units}
                          </span>
                        </td>

                        <td className="py-4 px-6">
                          <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 uppercase">
                            <PackageCheck className="w-3 h-3" />
                            <span>{t.admin.products.active}</span>
                          </span>
                        </td>

                        <td className="py-4 px-6 text-right space-x-2">
                          <button
                            onClick={() => handleEditProduct(prod)}
                            className="p-1.5 text-gray-600 hover:text-[#2E5A44] hover:bg-[#EAF2ED] rounded-lg transition-colors focus-luxe"
                            title={t.admin.products.editProduct}
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDeleteProduct(prod.id, title)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors focus-luxe"
                            title={t.admin.products.deleteProduct}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Table Pagination Footer */}
            {totalPages > 1 && (
              <div className="px-6 py-3 bg-[#EAF2ED]/40 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600">
                <span>
                  Showing Page <strong className="text-gray-900 font-bold">{currentPage}</strong> of <strong className="text-gray-900 font-bold">{totalPages}</strong> ({filteredProducts.length} items total)
                </span>

                <div className="flex items-center space-x-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="px-3.5 py-1.5 bg-white border border-[#E5E2D9] rounded-full text-xs font-semibold text-[#111827] hover:bg-[#EAF2ED] hover:border-[#2E5A44] disabled:opacity-40 disabled:hover:bg-white disabled:hover:border-[#E5E2D9] cursor-pointer focus-luxe transition-all"
                  >
                    Previous
                  </button>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="px-3.5 py-1.5 bg-white border border-[#E5E2D9] rounded-full text-xs font-semibold text-[#111827] hover:bg-[#EAF2ED] hover:border-[#2E5A44] disabled:opacity-40 disabled:hover:bg-white disabled:hover:border-[#E5E2D9] cursor-pointer focus-luxe transition-all"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={editingProduct}
        onSaveSuccess={fetchProducts}
      />
    </div>
  );
}
