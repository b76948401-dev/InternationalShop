import React, { useState, useEffect } from 'react';
import { Flame, Clock, Tag, ArrowRight } from 'lucide-react';
import { Product } from '../types';
import { dataService } from '../services/dataService';
import { ProductCard } from '../components/common/ProductCard';
import { ProductSkeletonGrid } from '../components/common/LoadingSkeleton';
import { useAuth } from '../context/AuthContext';
import { convertPrice, formatPrice } from '../config/countries';

interface OffersScreenProps {
  onNavigate: (route: string, param?: string) => void;
}

export function OffersScreen({ onNavigate }: OffersScreenProps) {
  const { activeCountry } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    const fetchOffers = async (retryCount = 0) => {
      try {
        const res = await fetch('/api/products');
        if (res.ok) {
          const data = await res.json();
          const discounted = (data.products || []).filter(
            (p: Product) => (p.discountPercentage && p.discountPercentage > 0) || p.offer
          );
          if (isMounted) {
            setProducts(discounted);
            setIsLoading(false);
          }
          return;
        }
      } catch (err) {
        if (retryCount < 2) {
          await new Promise((resolve) => setTimeout(resolve, 500 * (retryCount + 1)));
          if (isMounted) {
            return fetchOffers(retryCount + 1);
          }
        }
      }

      // Fallback
      try {
        const all = await dataService.getProducts();
        const discounted = (all || []).filter(
          (p: Product) => (p.discountPercentage && p.discountPercentage > 0) || p.offer
        );
        if (isMounted) {
          setProducts(discounted);
          setIsLoading(false);
          return;
        }
      } catch {
        // Silent fallback
      }

      if (isMounted) {
        setIsLoading(false);
      }
    };

    fetchOffers();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-rose-900 via-neutral-900 to-indigo-950 rounded-3xl p-8 sm:p-12 text-white shadow-xl mb-12 relative overflow-hidden">
        <div className="max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/20 border border-rose-400/30 text-rose-300 text-xs font-bold mb-4">
            <Flame className="w-4 h-4 text-rose-400" />
            <span>Special Promotional Campaigns</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold font-['Outfit',sans-serif] tracking-tight mb-4">
            Exclusive Deals & Discounts
          </h1>

          <p className="text-neutral-300 text-sm sm:text-base leading-relaxed mb-6">
            Explore authentic international consumer electronics, smartphones, and audio gear at discounted promotional prices for {activeCountry}.
          </p>

          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-neutral-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>Direct factory warranty</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>COD supported</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Limited time pricing</span>
            </div>
          </div>
        </div>
      </div>

      {/* Offers Product Grid */}
      <div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-neutral-900 font-['Outfit',sans-serif]">
              Current Promotional Deals
            </h2>
            <p className="text-xs text-neutral-500 mt-1">
              Found {products.length} discounted items ready for international shipping
            </p>
          </div>
        </div>

        {isLoading ? (
          <ProductSkeletonGrid count={6} />
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} onNavigate={onNavigate} />
            ))}
          </div>
        ) : (
          <div className="p-12 text-center bg-white rounded-3xl border border-neutral-200/80 shadow-xs max-w-lg mx-auto my-6">
            <div className="w-14 h-14 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-4 text-neutral-400">
              <Tag className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-neutral-900 font-['Outfit',sans-serif] mb-2">
              No promotional deals right now
            </h3>
            <p className="text-neutral-500 text-xs sm:text-sm mb-6 leading-relaxed">
              There are currently no active promotional or discounted items running. Check back soon for upcoming holiday flash sales and limited-time bundles.
            </p>
            <button
              onClick={() => onNavigate('all-products')}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors shadow-xs"
            >
              <span>Browse Catalog</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
