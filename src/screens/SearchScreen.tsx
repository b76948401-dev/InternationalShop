import React, { useState, useEffect, useMemo } from 'react';
import { Search, RotateCcw, ArrowRight } from 'lucide-react';
import { Product } from '../types';
import { ProductCard } from '../components/common/ProductCard';
import { ProductSkeletonGrid } from '../components/common/LoadingSkeleton';
import { useAuth } from '../context/AuthContext';
import { convertPrice } from '../config/countries';
import { dataService } from '../services/dataService';

interface SearchScreenProps {
  initialQuery?: string;
  query?: string;
  onNavigate: (route: string, param?: string) => void;
}

export function SearchScreen({ initialQuery, query, onNavigate }: SearchScreenProps) {
  const { activeCountry } = useAuth();
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>(initialQuery || query || '');
  const [sort, setSort] = useState<string>('relevance');

  useEffect(() => {
    if (initialQuery !== undefined) {
      setSearchTerm(initialQuery);
    } else if (query !== undefined) {
      setSearchTerm(query);
    }
  }, [initialQuery, query]);

  useEffect(() => {
    let isMounted = true;
    const fetchCatalog = async (retryCount = 0) => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/products');
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setAllProducts(data.products || []);
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

      // Fallback to client dataService
      try {
        const fallback = await dataService.getProducts();
        if (isMounted && Array.isArray(fallback) && fallback.length > 0) {
          setAllProducts(fallback);
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

  const results = useMemo(() => {
    if (!searchTerm.trim()) return allProducts;
    const q = searchTerm.toLowerCase();

    return allProducts
      .filter((p) => {
        return (
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          (p.tags && p.tags.some((t) => t.toLowerCase().includes(q)))
        );
      })
      .sort((a, b) => {
        const priceA = convertPrice(a.basePriceBDT, activeCountry);
        const priceB = convertPrice(b.basePriceBDT, activeCountry);
        if (sort === 'price-asc') return priceA - priceB;
        if (sort === 'price-desc') return priceB - priceA;
        if (sort === 'rating') return b.rating - a.rating;
        return 0; // relevance / default
      });
  }, [allProducts, searchTerm, sort, activeCountry]);

  // Recommended products if no results found
  const recommendations = allProducts.slice(0, 4);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Top Search Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/80 shadow-xs mb-8">
        <form onSubmit={handleSearchSubmit} className="max-w-2xl">
          <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
            Search Inventory
          </label>
          <div className="relative flex items-center">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by product name, brand, category..."
              className="w-full pl-11 pr-24 py-3 rounded-2xl bg-neutral-50 border border-neutral-200 text-sm focus:bg-white focus:border-indigo-600 outline-hidden transition-all shadow-inner"
            />
            <Search className="w-5 h-5 text-neutral-400 absolute left-3.5" />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 text-xs font-semibold text-neutral-500 hover:text-neutral-800"
              >
                Clear
              </button>
            )}
          </div>
        </form>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6 pt-4 border-t border-neutral-100">
          <div>
            <span className="text-sm font-semibold text-neutral-900">
              {searchTerm ? `Search Results for "${searchTerm}"` : 'All Products'}
            </span>
            <span className="text-xs text-neutral-400 ml-2">({results.length} found)</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-500 font-medium">Sort by:</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-neutral-200 text-xs font-semibold bg-white cursor-pointer"
            >
              <option value="relevance">Relevance</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <ProductSkeletonGrid count={6} />
      ) : results.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {results.map((product) => (
            <ProductCard key={product.id} product={product} onNavigate={onNavigate} />
          ))}
        </div>
      ) : (
        /* Empty State with Recommended products */
        <div className="flex flex-col gap-12 my-6">
          <div className="flex flex-col items-center justify-center text-center p-12 bg-white rounded-3xl border border-neutral-200/80 shadow-xs max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center mb-4 text-neutral-400">
              <Search className="w-8 h-8 stroke-[1.5]" />
            </div>
            <h3 className="text-xl font-bold text-neutral-900 mb-2 font-['Outfit',sans-serif]">
              {allProducts.length === 0
                ? 'No products currently available'
                : searchTerm
                ? `No products found matching "${searchTerm}"`
                : 'No matching products found'}
            </h3>
            <p className="text-neutral-500 text-xs sm:text-sm mb-6 max-w-sm leading-relaxed">
              {allProducts.length === 0
                ? 'Our catalog is currently being updated with authentic inventory. Please check back soon or browse categories.'
                : "We couldn't find any items matching your keywords. Check for typos or try searching with more generic brand or category terms."}
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors shadow-xs"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Clear Search Query</span>
              </button>
            )}
          </div>

          {/* Recommended products below empty state */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-neutral-900 font-['Outfit',sans-serif]">
                  Popular Recommendations
                </h3>
                <p className="text-xs text-neutral-500">Check out our most trending items instead</p>
              </div>
              <button
                onClick={() => onNavigate('all-products')}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <span>Browse All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {recommendations.map((prod) => (
                <ProductCard key={prod.id} product={prod} onNavigate={onNavigate} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
