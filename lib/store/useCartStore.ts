import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface CartItem {
  id: string; // Composite key: `${productId}-${selectedFlavor}-${selectedSize}-${purchaseType}`
  productId: string;
  nameEn: string;
  nameFr: string;
  imageUrl: string;
  category: string;
  selectedFlavor: string;
  selectedSize: string;
  quantity: number;
  purchaseType: 'one_time' | 'subscription'; // Subscription receives 20% discount
  unitPrice: number;
  discountedPrice: number;
}

export type AddItemInput = Omit<CartItem, 'id' | 'discountedPrice' | 'unitPrice'> & {
  unitPrice?: number;
  price?: number; // Backward compatibility with components passing price
};

interface CartStore {
  items: CartItem[];
  isCartOpen: boolean;
  
  // Store Actions
  addItem: (item: AddItemInput) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  togglePurchaseType: (id: string) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;

  // Helper Functions
  getSubtotal: () => number;
  getTotalSavings: () => number;
  getItemCount: () => number;

  // Backward compatibility aliases
  getTotalItems: () => number;
  getDiscountTotal: () => number;
  getFinalTotal: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isCartOpen: false,

      openCart: () => set({ isCartOpen: true }),
      closeCart: () => set({ isCartOpen: false }),

      addItem: (newItem) => {
        const unitPrice = newItem.unitPrice ?? newItem.price ?? 0;
        const purchaseType = newItem.purchaseType || 'one_time';
        const discountedPrice =
          purchaseType === 'subscription' ? Number((unitPrice * 0.8).toFixed(2)) : unitPrice;
        const generatedId = `${newItem.productId}-${newItem.selectedFlavor}-${newItem.selectedSize}-${purchaseType}`;

        const existingItems = get().items;
        const existingIndex = existingItems.findIndex((item) => item.id === generatedId);

        if (existingIndex > -1) {
          const updatedItems = [...existingItems];
          updatedItems[existingIndex] = {
            ...updatedItems[existingIndex],
            quantity: updatedItems[existingIndex].quantity + newItem.quantity,
          };
          set({ items: updatedItems });
        } else {
          set({
            items: [
              ...existingItems,
              {
                id: generatedId,
                productId: newItem.productId,
                nameEn: newItem.nameEn,
                nameFr: newItem.nameFr,
                imageUrl: newItem.imageUrl,
                category: newItem.category,
                selectedFlavor: newItem.selectedFlavor,
                selectedSize: newItem.selectedSize,
                quantity: newItem.quantity,
                purchaseType,
                unitPrice,
                discountedPrice,
              },
            ],
          });
        }
      },

      removeItem: (id) => {
        set({ items: get().items.filter((item) => item.id !== id) });
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }
        set({
          items: get().items.map((item) =>
            item.id === id ? { ...item, quantity } : item
          ),
        });
      },

      togglePurchaseType: (id) => {
        const items = get().items;
        const itemToToggle = items.find((i) => i.id === id);
        if (!itemToToggle) return;

        const newPurchaseType: 'one_time' | 'subscription' =
          itemToToggle.purchaseType === 'one_time' ? 'subscription' : 'one_time';
        const newDiscountedPrice =
          newPurchaseType === 'subscription'
            ? Number((itemToToggle.unitPrice * 0.8).toFixed(2))
            : itemToToggle.unitPrice;
        const newId = `${itemToToggle.productId}-${itemToToggle.selectedFlavor}-${itemToToggle.selectedSize}-${newPurchaseType}`;

        const existingWithNewType = items.find((i) => i.id === newId);

        if (existingWithNewType) {
          set({
            items: items
              .filter((i) => i.id !== id)
              .map((i) =>
                i.id === newId ? { ...i, quantity: i.quantity + itemToToggle.quantity } : i
              ),
          });
        } else {
          set({
            items: items.map((i) =>
              i.id === id
                ? {
                    ...i,
                    id: newId,
                    purchaseType: newPurchaseType,
                    discountedPrice: newDiscountedPrice,
                  }
                : i
            ),
          });
        }
      },

      clearCart: () => set({ items: [] }),

      getSubtotal: () => {
        const totalCents = get().items.reduce(
          (sum, item) => sum + Math.round(item.unitPrice * 100) * item.quantity,
          0
        );
        return totalCents / 100;
      },

      getTotalSavings: () => {
        const savingsCents = get().items.reduce(
          (sum, item) =>
            sum +
            (Math.round(item.unitPrice * 100) - Math.round(item.discountedPrice * 100)) * item.quantity,
          0
        );
        return savingsCents / 100;
      },

      getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },

      getTotalItems: () => {
        return get().getItemCount();
      },

      getDiscountTotal: () => {
        return get().getTotalSavings();
      },

      getFinalTotal: () => {
        return get().getSubtotal() - get().getTotalSavings();
      },
    }),
    {
      name: 'proteinshop_cart_storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

