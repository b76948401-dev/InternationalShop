import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  SlidersHorizontal,
  Search,
  X,
  RotateCcw,
  Check,
  Star,
  ChevronDown,
  PackageX,
} from 'lucide-react';
import { Product } from '../types';
import { dataService } from '../services/dataService';
import { ProductCard } from '../components/common/ProductCard';
import { ProductSkeletonGrid } from '../components/common/LoadingSkeleton';
import { EmptyState } from '../components/common/EmptyState';
import { useAuth } from '../context/AuthContext';
import { COUNTRY_CURRENCIES, convertPrice } from '../config/countries';

interface AllProductsScreenProps {
  initialCategory?: string;
  onNavigate: (route: string, param?: string) => void;
}

export function AllProductsScreen({ initialCategory, onNavigate }: AllProductsScreenProps) {
  const { activeCountry } = useAuth();
  const currencyCfg = COUNTRY_CURRENCIES[activeCountry];

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'All');
  const [selectedBrand, setSelectedBrand] = useState<string>('All');
  const [minRating, setMinRating] = useState<number>(0);
  const [discountOnly, setDiscountOnly] = useState<boolean>(false);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [maxPrice, setMaxPrice] = useState<number>(500000);
  const [sort, setSort] = useState<string>('featured');

  // Mobile drawer
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  useEffect(() => {
    if (initialCategory) {
      setSelectedCategory(initialCategory);
    }
  }, [initialCategory]);

  useEffect(() => {
    let isMounted = true;

    const fetchAll = async (retryCount = 0) => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/products');
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setProducts(data.products || []);
            setCategories(data.categories || []);
            setBrands(data.brands || []);
            setIsLoading(false);
          }
          return;
        }
      } catch (err) {
        if (retryCount < 2) {
          await new Promise((resolve) => setTimeout(resolve, 500 * (retryCount + 1)));
          if (isMounted) {
            return fetchAll(retryCount + 1);
          }
        }
      }

      // Fallback
      try {
        const fallback = await dataService.getProducts();
        if (isMounted && Array.isArray(fallback) && fallback.length > 0) {
          setProducts(fallback);
          setCategories(Array.from(new Set(fallback.map((p) => p.category))));
          setBrands(Array.from(new Set(fallback.map((p) => p.brand))));
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

    fetchAll();

    return () => {
      isMounted = false;
    };
  }, []);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // Search
        if (search.trim()) {
          const q = search.toLowerCase();
          const match =
            p.name.toLowerCase().includes(q) ||
            p.brand.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q);
          if (!match) return false;
        }

        // Category
        if (selectedCategory !== 'All' && p.category.toLowerCase() !== selectedCategory.toLowerCase()) {
          return false;
        }

        // Brand
        if (selectedBrand !== 'All' && p.brand.toLowerCase() !== selectedBrand.toLowerCase()) {
          return false;
        }

        // Minimum rating
        if (minRating > 0 && p.rating < minRating) {
          return false;
        }

        // Discount only
        if (discountOnly && (!p.discountPercentage || p.discountPercentage <= 0)) {
          return false;
        }

        // In Stock only
        if (inStockOnly && p.stock <= 0) {
          return false;
        }

        // Price range
        const localPrice = convertPrice(p.basePriceBDT, activeCountry);
        if (localPrice > maxPrice) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        const priceA = convertPrice(a.basePriceBDT, activeCountry);
        const priceB = convertPrice(b.basePriceBDT, activeCountry);

        switch (sort) {
          case 'price-asc':
            return priceA - priceB;
          case 'price-desc':
            return priceB - priceA;
          case 'rating-desc':
            return b.rating - a.rating;
          case 'best-selling':
            return (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0) || b.reviewCount - a.reviewCount;
          case 'biggest-discount':
            return (b.discountPercentage || 0) - (a.discountPercentage || 0);
          case 'newest':
            return (b.isNewArrival ? 1 : 0) - (a.isNewArrival ? 1 : 0);
          case 'featured':
          default:
            return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
        }
      });
  }, [
    products,
    search,
    selectedCategory,
    selectedBrand,
    minRating,
    discountOnly,
    inStockOnly,
    maxPrice,
    sort,
    activeCountry,
  ]);

  const handleResetFilters = () => {
    setSearch('');
    setSelectedCategory('All');
    setSelectedBrand('All');
    setMinRating(0);
    setDiscountOnly(false);
    setInStockOnly(false);
    setMaxPrice(500000);
    setSort('featured');
  };

  const activeFilterCount = [
    search ? 1 : 0,
    selectedCategory !== 'All' ? 1 : 0,
    selectedBrand !== 'All' ? 1 : 0,
    minRating > 0 ? 1 : 0,
    discountOnly ? 1 : 0,
    inStockOnly ? 1 : 0,
    maxPrice < 500000 ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  // Filter Sidebar content component
  const FilterControls = () => (
    <div className="flex flex-col gap-6 text-sm">
      {/* Search within page */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
          Search Products
        </label>
        <div className="relative">
          <input
            type="text"
            placeholder="Keyword, model, specs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs focus:bg-white focus:border-indigo-600 outline-hidden"
          />
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Categories */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
          Category
        </label>
        <div className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-1">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-left transition-colors ${
              selectedCategory === 'All'
                ? 'bg-indigo-50 text-indigo-700 font-semibold'
                : 'text-neutral-700 hover:bg-neutral-50'
            }`}
          >
            <span>All Categories</span>
            {selectedCategory === 'All' && <Check className="w-3.5 h-3.5 text-indigo-600" />}
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-left transition-colors ${
                selectedCategory === cat
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              <span>{cat}</span>
              {selectedCategory === cat && <Check className="w-3.5 h-3.5 text-indigo-600" />}
            </button>
          ))}
        </div>
      </div>

      {/* Brands */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
          Brand
        </label>
        <div className="flex flex-col gap-1 max-h-40 overflow-y-auto pr-1">
          <button
            onClick={() => setSelectedBrand('All')}
            className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium text-left transition-colors ${
              selectedBrand === 'All'
                ? 'bg-indigo-50 text-indigo-700 font-semibold'
                : 'text-neutral-700 hover:bg-neutral-50'
            }`}
          >
            <span>All Brands</span>
            {selectedBrand === 'All' && <Check className="w-3.5 h-3.5 text-indigo-600" />}
          </button>
          {brands.map((b) => (
            <button
              key={b}
              onClick={() => setSelectedBrand(b)}
              className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium text-left transition-colors ${
                selectedBrand === b
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              <span>{b}</span>
              {selectedBrand === b && <Check className="w-3.5 h-3.5 text-indigo-600" />}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">
            Max Budget
          </label>
          <span className="text-xs font-bold text-indigo-600">
            {currencyCfg.symbol}
            {maxPrice.toLocaleString()}
          </span>
        </div>
        <input
          type="range"
          min={5000}
          max={500000}
          step={5000}
          value={maxPrice}
          onChange={(e) => setMaxPrice(Number(e.target.value))}
          className="w-full accent-indigo-600 cursor-pointer"
        />
        <div className="flex justify-between text-[11px] text-neutral-400 mt-1">
          <span>{currencyCfg.symbol}5k</span>
          <span>{currencyCfg.symbol}500k</span>
        </div>
      </div>

      {/* Customer Rating */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
          Minimum Rating
        </label>
        <div className="grid grid-cols-2 gap-2">
          {[4, 4.5, 4.8].map((rating) => (
            <button
              key={rating}
              onClick={() => setMinRating(minRating === rating ? 0 : rating)}
              className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                minRating === rating
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                  : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{rating}★ & above</span>
            </button>
          ))}
        </div>
      </div>

      {/* Toggles */}
      <div className="space-y-3 pt-2 border-t border-neutral-100">
        <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-neutral-700">
          <input
            type="checkbox"
            checked={discountOnly}
            onChange={(e) => setDiscountOnly(e.target.checked)}
            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 rounded-sm"
          />
          <span>Discounted Products Only</span>
        </label>

        <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-neutral-700">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => setInStockOnly(e.target.checked)}
            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 rounded-sm"
          />
          <span>In-Stock Only</span>
        </label>
      </div>

      {/* Clear Filters */}
      {activeFilterCount > 0 && (
        <button
          onClick={handleResetFilters}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-xs font-semibold text-neutral-600 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset All Filters ({activeFilterCount})</span>
        </button>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-neutral-200/80 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-neutral-900 font-['Outfit',sans-serif]">
            All Products
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Showing <span className="font-semibold text-neutral-800">{filteredProducts.length}</span> international items available for {activeCountry}
          </p>
        </div>

        {/* Sort & Mobile filter trigger */}
        <div className="flex items-center gap-3">
          {/* Mobile Filter Button */}
          <button
            onClick={() => setIsMobileFilterOpen(true)}
            className="lg:hidden inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-neutral-300 bg-white text-xs font-bold text-neutral-800 hover:bg-neutral-50 transition-colors shadow-xs"
          >
            <SlidersHorizontal className="w-4 h-4 text-neutral-600" />
            <span>Filters {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}</span>
          </button>

          {/* Sort Dropdown */}
          <div className="relative flex items-center">
            <span className="text-xs font-semibold text-neutral-500 mr-2 hidden sm:inline">Sort:</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="px-3 py-2 rounded-xl bg-white border border-neutral-300 text-xs font-semibold text-neutral-800 focus:outline-hidden focus:border-indigo-600 shadow-xs cursor-pointer"
            >
              <option value="featured">Featured</option>
              <option value="newest">Newest Arrivals</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating-desc">Highest Rated</option>
              <option value="best-selling">Best Selling</option>
              <option value="biggest-discount">Biggest Discount</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Layout: Sidebar Filters + Products Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block lg:col-span-3 bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-xs sticky top-28">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-neutral-100">
            <span className="font-bold text-sm text-neutral-900 font-['Outfit',sans-serif]">Filter Products</span>
            {activeFilterCount > 0 && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                {activeFilterCount} active
              </span>
            )}
          </div>
          <FilterControls />
        </div>

        {/* Product Grid Area */}
        <div className="lg:col-span-9">
          {isLoading ? (
            <ProductSkeletonGrid count={6} />
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} onNavigate={onNavigate} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <EmptyState
              icon={PackageX}
              title="No products currently available"
              description="Our catalog is currently being updated with authentic inventory. Please check back soon or browse categories."
            />
          ) : (
            <EmptyState
              icon={Search}
              title="No products match your filters"
              description="Try loosening your search terms, increasing your budget range, or clearing category restrictions."
              actionText="Reset All Filters"
              onAction={handleResetFilters}
            />
          )}
        </div>
      </div>

      {/* Mobile Filters Bottom Sheet / Drawer */}
      <AnimatePresence>
        {isMobileFilterOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileFilterOpen(false)}
              className="fixed inset-0 bg-neutral-950/60 backdrop-blur-xs z-50 lg:hidden"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="fixed bottom-0 left-0 right-0 max-h-[85vh] bg-white rounded-t-3xl shadow-2xl p-6 z-50 overflow-y-auto lg:hidden"
            >
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-neutral-100">
                <h3 className="font-bold text-base text-neutral-900 font-['Outfit',sans-serif]">Filter Catalog</h3>
                <button
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <FilterControls />

              <div className="pt-6 mt-6 border-t border-neutral-100">
                <button
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="w-full py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm shadow-md"
                >
                  Apply Filters ({filteredProducts.length} Results)
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
