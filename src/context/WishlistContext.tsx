import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Product } from '../types';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

interface WishlistContextType {
  wishlistIds: string[];
  wishlistProducts: Product[];
  isLoading: boolean;
  toggleWishlist: (product: Product) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  wishlistCount: number;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);
const WISHLIST_STORAGE_KEY = 'international_shop_wishlist';

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user, token } = useAuth();
  const { showToast } = useToast();
  const [wishlistIds, setWishlistIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(WISHLIST_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchWishlist = useCallback(async () => {
    if (!token) {
      // Guest mode: fetch product objects for stored IDs
      if (wishlistIds.length > 0) {
        try {
          const res = await fetch('/api/products');
          if (res.ok) {
            const data = await res.json();
            const filtered = (data.products || []).filter((p: Product) => wishlistIds.includes(p.id));
            setWishlistProducts(filtered);
          }
        } catch {
          // Ignore transient fetch failure in guest mode
        }
      } else {
        setWishlistProducts([]);
      }
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/wishlist', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const ct = res.headers.get('content-type');
        if (ct && ct.includes('application/json')) {
          const data = await res.json();
          setWishlistIds(data.productIds || []);
          setWishlistProducts(data.products || []);
          localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(data.productIds || []));
        }
      }
    } catch {
      // Gracefully handle network transitions
    } finally {
      setIsLoading(false);
    }
  }, [token, wishlistIds.length]);

  useEffect(() => {
    fetchWishlist();
  }, [user, fetchWishlist]);

  const toggleWishlist = async (product: Product) => {
    const isCurrentlyIn = wishlistIds.includes(product.id);

    if (token) {
      try {
        const res = await fetch('/api/wishlist/toggle', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ productId: product.id }),
        });

        if (res.ok) {
          const data = await res.json();
          setWishlistIds(data.productIds);
          if (data.isInWishlist) {
            setWishlistProducts((prev) => [...prev.filter((p) => p.id !== product.id), product]);
            showToast(`Added "${product.name.slice(0, 25)}..." to Wishlist`, 'success');
          } else {
            setWishlistProducts((prev) => prev.filter((p) => p.id !== product.id));
            showToast('Removed from Wishlist', 'info');
          }
          localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(data.productIds));
          return;
        }
      } catch (err) {
        console.error('Failed to toggle wishlist on server:', err);
      }
    }

    // Local / Guest fallback
    let updated: string[];
    if (isCurrentlyIn) {
      updated = wishlistIds.filter((id) => id !== product.id);
      setWishlistProducts((prev) => prev.filter((p) => p.id !== product.id));
      showToast('Removed from Wishlist', 'info');
    } else {
      updated = [...wishlistIds, product.id];
      setWishlistProducts((prev) => [...prev, product]);
      showToast(`Added "${product.name.slice(0, 25)}..." to Wishlist`, 'success');
    }
    setWishlistIds(updated);
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(updated));
  };

  const isInWishlist = (productId: string) => wishlistIds.includes(productId);

  return (
    <WishlistContext.Provider
      value={{
        wishlistIds,
        wishlistProducts,
        isLoading,
        toggleWishlist,
        isInWishlist,
        wishlistCount: wishlistIds.length,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
