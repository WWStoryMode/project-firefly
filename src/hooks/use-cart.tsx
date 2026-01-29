'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { MenuItem } from '@/lib/supabase/types';

interface CartItem {
  menu_item_id: string;
  name: string;
  unit_price: number;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  vendorId: string | null;
  vendorName: string | null;
  addItem: (item: MenuItem) => void;
  removeItem: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  clearCart: () => void;
  getItemQuantity: (menuItemId: string) => number;
  totalItems: number;
  totalAmount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [vendorName, setVendorName] = useState<string | null>(null);

  const addItem = useCallback((item: MenuItem) => {
    setItems((prev) => {
      // If cart has items from different vendor, clear it
      if (vendorId && vendorId !== item.vendor_id) {
        setVendorId(item.vendor_id);
        return [
          {
            menu_item_id: item.id,
            name: item.name,
            unit_price: item.price,
            quantity: 1,
          },
        ];
      }

      // Set vendor if not set
      if (!vendorId) {
        setVendorId(item.vendor_id);
      }

      const existing = prev.find((i) => i.menu_item_id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.menu_item_id === item.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }

      return [
        ...prev,
        {
          menu_item_id: item.id,
          name: item.name,
          unit_price: item.price,
          quantity: 1,
        },
      ];
    });
  }, [vendorId]);

  const removeItem = useCallback((menuItemId: string) => {
    setItems((prev) => {
      const newItems = prev.filter((i) => i.menu_item_id !== menuItemId);
      if (newItems.length === 0) {
        setVendorId(null);
        setVendorName(null);
      }
      return newItems;
    });
  }, []);

  const updateQuantity = useCallback((menuItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(menuItemId);
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        i.menu_item_id === menuItemId ? { ...i, quantity } : i
      )
    );
  }, [removeItem]);

  const clearCart = useCallback(() => {
    setItems([]);
    setVendorId(null);
    setVendorName(null);
  }, []);

  const getItemQuantity = useCallback((menuItemId: string) => {
    const item = items.find((i) => i.menu_item_id === menuItemId);
    return item?.quantity ?? 0;
  }, [items]);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = items.reduce(
    (sum, item) => sum + item.unit_price * item.quantity,
    0
  );

  const value: CartContextType = {
    items,
    vendorId,
    vendorName,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getItemQuantity,
    totalItems,
    totalAmount,
  };

  return (
    <CartContext.Provider value={value}>{children}</CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
