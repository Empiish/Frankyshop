"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type CartItem = {
  productId: string;
  sku: string;
  slug: string;
  name: string;
  unitPriceTsh: number;
  quantity: number;
};

type CartState = {
  items: CartItem[];
  add: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  remove: (productId: string) => void;
  setQuantity: (productId: string, qty: number) => void;
  clear: () => void;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (item, qty = 1) => {
        const existing = get().items.find((i) => i.productId === item.productId);
        if (existing) {
          set({
            items: get().items.map((i) =>
              i.productId === item.productId
                ? { ...i, quantity: i.quantity + qty }
                : i,
            ),
          });
        } else {
          set({ items: [...get().items, { ...item, quantity: qty }] });
        }
      },
      remove: (productId) =>
        set({ items: get().items.filter((i) => i.productId !== productId) }),
      setQuantity: (productId, qty) => {
        if (qty <= 0) return get().remove(productId);
        set({
          items: get().items.map((i) =>
            i.productId === productId ? { ...i, quantity: qty } : i,
          ),
        });
      },
      clear: () => set({ items: [] }),
    }),
    {
      name: "franky_cart",
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
);

export function cartSubtotal(items: CartItem[]) {
  return items.reduce((s, i) => s + i.unitPriceTsh * i.quantity, 0);
}

export function cartCount(items: CartItem[]) {
  return items.reduce((n, i) => n + i.quantity, 0);
}
