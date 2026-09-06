"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface CartAnswerDisplay {
  fieldKey: string;
  label: string;
  valueLabel: string;
}

export interface CartItem {
  id: string; // unique cart line id
  productId: string;
  productSlug: string;
  productName: string;
  categorySlug: string;
  image?: string;
  answers: Record<string, string | string[] | undefined>;
  answersDisplay: CartAnswerDisplay[];
  childName?: string;
  quantity: number;
  unitPriceCents: number | null;
  lineTotalCents: number;
  uploadId?: string;
  hasPhoto: boolean;
  createdAt: number;
  updatedAt: number;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "id" | "createdAt" | "updatedAt">) => string;
  updateItem: (
    id: string,
    item: Omit<CartItem, "id" | "createdAt" | "updatedAt">
  ) => void;
  removeItem: (id: string) => void;
  clear: () => void;
}

function generateId() {
  return `cart_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) => {
        const id = generateId();
        const now = Date.now();
        set((state) => ({
          items: [...state.items, { ...item, id, createdAt: now, updatedAt: now }],
        }));
        return id;
      },
      updateItem: (id, item) => {
        set((state) => ({
          items: state.items.map((existing) =>
            existing.id === id
              ? { ...existing, ...item, id, updatedAt: Date.now() }
              : existing
          ),
        }));
      },
      removeItem: (id) => {
        set((state) => ({ items: state.items.filter((i) => i.id !== id) }));
      },
      clear: () => set({ items: [] }),
    }),
    {
      name: "ya7kayti-cart",
      storage: createJSONStorage(() => localStorage),
      version: 1,
    }
  )
);

export function cartSubtotalCents(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.lineTotalCents, 0);
}

export function cartCount(items: CartItem[]): number {
  return items.length;
}
