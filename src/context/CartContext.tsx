import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Product } from '../types';
import { useAuth } from './AuthContext';
import { convertPrice } from '../config/countries';
import { useToast } from './ToastContext';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number, selectedVariants?: Record<string, string>) => void;
  updateQuantity: (productId: string, quantity: number, selectedVariants?: Record<string, string>) => void;
  removeFromCart: (productId: string, selectedVariants?: Record<string, string>) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  isCodAvailable: boolean;
  ineligibleCodItemNames: string[];
}

const CartContext = createContext<CartContextType | undefined>(undefined);
const CART_STORAGE_KEY = 'international_shop_cart';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const { activeCountry } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to persist cart items:', e);
    }
  }, [items]);

  const areVariantsEqual = (v1?: Record<string, string>, v2?: Record<string, string>) => {
    if (!v1 && !v2) return true;
    if (!v1 || !v2) return false;
    const k1 = Object.keys(v1);
    const k2 = Object.keys(v2);
    if (k1.length !== k2.length) return false;
    return k1.every((k) => v1[k] === v2[k]);
  };

  const addToCart = (
    product: Product,
    quantity = 1,
    selectedVariants: Record<string, string> = {}
  ) => {
    setItems((prev) => {
      const existingIndex = prev.findIndex(
        (i) => i.productId === product.id && areVariantsEqual(i.selectedVariants, selectedVariants)
      );

      if (existingIndex > -1) {
        const next = [...prev];
        const newQty = next[existingIndex].quantity + quantity;
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: newQty,
          product, // ensure freshest product data
          direct_payment_required: Boolean(
            product.direct_payment_required ?? (product.isCodEligible === false)
          ),
        };
        return next;
      }

      return [
        ...prev,
        {
          productId: product.id,
          product,
          quantity,
          selectedVariants,
          direct_payment_required: Boolean(
            product.direct_payment_required ?? (product.isCodEligible === false)
          ),
        },
      ];
    });

    showToast(`Added "${product.name.slice(0, 30)}..." to cart`, 'success');
  };

  const updateQuantity = (
    productId: string,
    quantity: number,
    selectedVariants?: Record<string, string>
  ) => {
    if (quantity <= 0) {
      removeFromCart(productId, selectedVariants);
      return;
    }

    setItems((prev) =>
      prev.map((i) => {
        if (i.productId === productId && areVariantsEqual(i.selectedVariants, selectedVariants)) {
          return { ...i, quantity };
        }
        return i;
      })
    );
  };

  const removeFromCart = (productId: string, selectedVariants?: Record<string, string>) => {
    setItems((prev) =>
      prev.filter((i) => !(i.productId === productId && areVariantsEqual(i.selectedVariants, selectedVariants)))
    );
    showToast('Item removed from cart', 'info');
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.reduce((acc, i) => acc + i.quantity, 0);

  const subtotal = items.reduce((acc, i) => {
    const itemPrice = convertPrice(i.product.basePriceBDT, activeCountry);
    return acc + itemPrice * i.quantity;
  }, 0);

  // Check COD availability for all items in the cart
  const ineligibleItems = items.filter(
    (i) => i.product.isCodEligible === false || i.direct_payment_required === true || i.product.direct_payment_required === true
  );
  const isCodAvailable = items.length > 0 && ineligibleItems.length === 0;
  const ineligibleCodItemNames = ineligibleItems.map((i) => i.product.name);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        totalItems,
        subtotal,
        isCodAvailable,
        ineligibleCodItemNames,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
