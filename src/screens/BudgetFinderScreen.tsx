import React, { useState, useEffect, useMemo } from 'react';
import { SlidersHorizontal, ArrowRight, DollarSign, PackageX } from 'lucide-react';
import { Product } from '../types';
import { ProductCard } from '../components/common/ProductCard';
import { ProductSkeletonGrid } from '../components/common/LoadingSkeleton';
import { EmptyState } from '../components/common/EmptyState';
import { useAuth } from '../context/AuthContext';
import { COUNTRY_CURRENCIES, convertPrice } from '../config/countries';
import { dataService } from '../services/dataService';

interface BudgetFinderScreenProps {
  onNavigate: (route: string, param?: string) => void;
}

export function BudgetFinderScreen({ onNavigate }: BudgetFinderScreenProps) {
  const { activeCountry } = useAuth();
  const currencyCfg = COUNTRY_CURRENCIES[activeCountry];

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filter state
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(50000);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [onlyCod, setOnlyCod] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const fetchCatalog = async (retryCount = 0) => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/products');
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setProducts(data.products || []);
            setCategories(data.categories || []);
            setIsLoading(false);
          }
          return;
        }
      } catch (err) {
        if (retryCount < 2) {
          await new Promise((r) => setTimeout(r, 500 * (retryCount + 1)));
          if (isMounted) return fetchCatalog(retryCount + 1);
        }
      }

      // Fallback
      try {
        const fallback = await dataService.getProducts();
        if (isMounted && Array.isArray(fallback) && fallback.length > 0) {
          setProducts(fallback);
          setCategories(Array.from(new Set(fallback.map((p) => p.category))));
          setIsLoading(false);
          return;
        }
      } catch {}

      if (isMounted) {
        setIsLoading(false);
      }
    };
    fetchCatalog();
    return () => {
      isMounted = false;
    };
  }, []);

  const matchingProducts = useMemo(() => {
    return products.filter((p) => {
      const localPrice = convertPrice(p.basePriceBDT, activeCountry);
      if (localPrice < minPrice || localPrice > maxPrice) return false;
      if (selectedCategory !== 'All' && p.category !== selectedCategory) return false;
      if (onlyCod && !p.isCodEligible) return false;
      return true;
    });
  }, [products, minPrice, maxPrice, selectedCategory, onlyCod, activeCountry]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header & Budget Controls */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-neutral-200/80 shadow-xs mb-10">
        <div className="max-w-2xl mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold mb-3">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Interactive Tool</span>
          </div>
          <h1 className="text-3xl font-extrabold text-neutral-900 font-['Outfit',sans-serif]">
            Find Products Within Your Budget
          </h1>
          <p className="text-sm text-neutral-500 mt-2 leading-relaxed">
            Specify your spending limit in {currencyCfg.currencyName} ({currencyCfg.symbol}) to discover premium electronics and accessories matched perfectly to your budget.
          </p>
        </div>

        {/* Sliders and Range Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-neutral-100">
          {/* Min Price */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
              Minimum Budget ({currencyCfg.symbol})
            </label>
            <div className="relative">
              <input
                type="number"
                min={0}
                max={maxPrice}
                step={500}
                value={minPrice}
                onChange={(e) => setMinPrice(Math.max(0, Number(e.target.value)))}
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50 text-sm font-semibold text-neutral-900 focus:bg-white focus:border-indigo-600 outline-hidden"
              />
            </div>
          </div>

          {/* Max Price */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
              Maximum Budget ({currencyCfg.symbol})
            </label>
            <div className="relative">
              <input
                type="number"
                min={minPrice}
                max={1000000}
                step={1000}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Math.max(minPrice, Number(e.target.value)))}
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50 text-sm font-semibold text-neutral-900 focus:bg-white focus:border-indigo-600 outline-hidden"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50 text-sm font-semibold text-neutral-900 focus:bg-white focus:border-indigo-600 outline-hidden cursor-pointer"
            >
              <option value="All">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Budget Presets */}
        <div className="flex flex-wrap items-center gap-2 mt-6 pt-6 border-t border-neutral-100">
          <span className="text-xs font-semibold text-neutral-400 mr-2">Quick Presets:</span>
          {[
            { label: `Under ${currencyCfg.symbol}10,000`, min: 0, max: 10000 },
            { label: `${currencyCfg.symbol}10,000 - ${currencyCfg.symbol}30,000`, min: 10000, max: 30000 },
            { label: `${currencyCfg.symbol}30,000 - ${currencyCfg.symbol}80,000`, min: 30000, max: 80000 },
            { label: `${currencyCfg.symbol}80,000+`, min: 80000, max: 500000 },
          ].map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => {
                setMinPrice(preset.min);
                setMaxPrice(preset.max);
              }}
              className="px-3 py-1.5 rounded-lg border border-neutral-200 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 hover:border-indigo-300 transition-colors"
            >
              {preset.label}
            </button>
          ))}

          <label className="ml-auto flex items-center gap-2 text-xs font-semibold text-neutral-700 cursor-pointer">
            <input
              type="checkbox"
              checked={onlyCod}
              onChange={(e) => setOnlyCod(e.target.checked)}
              className="rounded text-indigo-600"
            />
            <span>Cash on Delivery Only</span>
          </label>
        </div>
      </div>

      {/* Matching Results */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-neutral-900 font-['Outfit',sans-serif]">
              Matching Products
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Found {matchingProducts.length} items between {currencyCfg.symbol}
              {minPrice.toLocaleString()} and {currencyCfg.symbol}
              {maxPrice.toLocaleString()}
            </p>
          </div>
        </div>

        {isLoading ? (
          <ProductSkeletonGrid count={4} />
        ) : matchingProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {matchingProducts.map((p) => (
              <ProductCard key={p.id} product={p} onNavigate={onNavigate} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <EmptyState
            icon={PackageX}
            title="No products currently available"
            description="Our store catalog is currently being updated with authentic inventory. Please check back soon or browse categories."
          />
        ) : (
          <EmptyState
            icon={DollarSign}
            title="No products in this price bracket"
            description="Try widening your minimum or maximum budget boundaries to see more available options."
            actionText="Reset Budget to Under 100k"
            onAction={() => {
              setMinPrice(0);
              setMaxPrice(100000);
              setSelectedCategory('All');
            }}
          />
        )}
      </div>
    </div>
  );
}
