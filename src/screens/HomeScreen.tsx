import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight,
  ShieldCheck,
  Truck,
  RotateCcw,
  Sparkles,
  Flame,
  Clock,
  ChevronRight,
  Zap,
  PackageX,
} from 'lucide-react';
import { Product } from '../types';
import { ProductCard } from '../components/common/ProductCard';
import { ProductSkeletonGrid } from '../components/common/LoadingSkeleton';
import { useAuth } from '../context/AuthContext';
import { convertPrice, formatPrice } from '../config/countries';
import { dataService } from '../services/dataService';
import heroSpotlightImage from '../assets/images/regenerated_image_1790012928772.jpg';

interface HomeScreenProps {
  onNavigate: (route: string, param?: string) => void;
}

export function HomeScreen({ onNavigate }: HomeScreenProps) {
  const { activeCountry } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [heroSlide, setHeroSlide] = useState(0);

  // Countdown timer state for promotional offer section
  const [countdown, setCountdown] = useState({ days: 3, hours: 14, minutes: 22, seconds: 45 });
  const [isOfferExpired, setIsOfferExpired] = useState(false);

  const fetchProducts = async (retryCount = 0) => {
    setIsLoading(true);
    setLoadError(null);

    try {
      // 1. Primary: Server API
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.products) && data.products.length > 0) {
          setProducts(data.products);
          setIsLoading(false);
          return;
        }
      }
      throw new Error(`Server returned status ${res.status}`);
    } catch (apiErr) {
      // 2. Retry up to 2 times with exponential delay
      if (retryCount < 2) {
        setTimeout(() => {
          fetchProducts(retryCount + 1);
        }, 600 * (retryCount + 1));
        return;
      }

      // 3. Resilient fallback to client-side dataService
      try {
        const fallbackProducts = await dataService.getProducts();
        if (Array.isArray(fallbackProducts) && fallbackProducts.length > 0) {
          setProducts(fallbackProducts);
          setIsLoading(false);
          return;
        }
      } catch (fallbackErr) {
        console.warn('Fallback dataService error:', fallbackErr);
      }

      console.warn('Could not load products after retries:', apiErr);
      setLoadError('Unable to load products. Please check your network connection.');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Promotional offer countdown calculation based on first active offer
  useEffect(() => {
    const offerProduct = products.find((p) => p.offer && new Date(p.offer.expiresAt) > new Date());
    const targetDate = offerProduct?.offer?.expiresAt
      ? new Date(offerProduct.offer.expiresAt).getTime()
      : Date.now() + 3 * 24 * 60 * 60 * 1000;

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = targetDate - now;

      if (diff <= 0) {
        setIsOfferExpired(true);
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        clearInterval(interval);
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setCountdown({ days, hours, minutes, seconds });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [products]);

  // Hero slides data
  const heroSlides = [
    {
      title: 'Global Flagship Electronics Delivered Fast',
      subtitle: `Authentic international brands delivered across ${activeCountry}. Enjoy localized pricing, dedicated Cash on Delivery, and manufacturer warranty.`,
      badge: 'Summer 2026 Collection',
      cta: 'Explore All Products',
      targetRoute: 'all-products',
      image: heroSpotlightImage,
      featuredProductSlug: 'sony-wh1000xm5-wireless-noise-cancelling-headphones',
    },
    {
      title: 'Next-Gen Computing & Workstations',
      subtitle: 'Supercharged Apple Silicon M3 laptops and studio creator machines with insured door-to-door courier service.',
      badge: 'Power & Portability',
      cta: 'View Computers',
      targetRoute: 'all-products',
      param: 'Computers & Laptops',
      image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1200&q=85',
      featuredProductSlug: 'apple-macbook-air-m3-15-inch',
    },
  ];

  const currentHero = heroSlides[heroSlide];

  // Category shortcuts
  const categories = [
    { name: 'Audio & Gadgets', icon: '🎧', image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=400&q=80' },
    { name: 'Computers & Laptops', icon: '💻', image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&q=80' },
    { name: 'Smartphones & Tablets', icon: '📱', image: 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=400&q=80' },
    { name: 'Home & Kitchen', icon: '☕', image: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=400&q=80' },
    { name: 'Wearables & Smartwatches', icon: '⌚', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80' },
    { name: 'Gaming & Consoles', icon: '🎮', image: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=400&q=80' },
  ];

  const featuredProducts = products.filter((p) => p.isFeatured);
  const displayFeatured = (featuredProducts.length > 0 ? featuredProducts : products).slice(0, 8);
  const bestSellers = products.filter((p) => p.isBestSeller);
  const displayBestSellers = (bestSellers.length > 0 ? bestSellers : products).slice(0, 8);
  const newArrivals = products.filter((p) => p.isNewArrival);
  const displayNewArrivals = (newArrivals.length > 0 ? newArrivals : products).slice(0, 8);
  const promotionalOfferProduct = products.find((p) => p.offer && !p.offer.title.includes('Expired')) || products[0];

  return (
    <div className="flex flex-col gap-16 pb-20">
      {/* SECTION 1 — HERO AREA */}
      <section className="relative bg-neutral-900 text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-28 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Copy */}
            <motion.div
              key={heroSlide}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
              className="lg:col-span-7 flex flex-col items-start"
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold mb-6">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{currentHero.badge}</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight font-['Outfit',sans-serif] leading-[1.1] mb-6">
                {currentHero.title}
              </h1>

              <p className="text-neutral-300 text-base sm:text-lg leading-relaxed max-w-xl mb-8">
                {currentHero.subtitle}
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onNavigate(currentHero.targetRoute, currentHero.param)}
                  className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition-colors shadow-lg shadow-indigo-900/40 cursor-pointer"
                >
                  <span>{currentHero.cta}</span>
                  <ArrowRight className="w-4 h-4" />
                </motion.button>

                <button
                  onClick={() => onNavigate('budget-finder')}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl border border-neutral-700 hover:border-neutral-500 hover:bg-neutral-800 text-neutral-200 text-sm font-semibold transition-colors cursor-pointer"
                >
                  <span>Budget Finder</span>
                </button>
              </div>

              {/* Slider Dots */}
              <div className="flex items-center gap-2.5 mt-10">
                {heroSlides.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setHeroSlide(idx)}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      idx === heroSlide ? 'w-8 bg-indigo-500' : 'w-2 bg-neutral-700 hover:bg-neutral-500'
                    }`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            </motion.div>

            {/* Right Product Spotlight Image */}
            <motion.div
              key={`img-${heroSlide}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="lg:col-span-5 relative"
            >
              <div className="relative rounded-3xl overflow-hidden border border-neutral-800 shadow-2xl aspect-4/3 sm:aspect-square bg-neutral-800">
                <img
                  src={currentHero.image}
                  alt={currentHero.title}
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-indigo-400 font-semibold uppercase tracking-wider block">
                      Spotlight Product
                    </span>
                    <span className="text-sm font-bold text-white">Genuine Seal & Warranty</span>
                  </div>
                  <button
                    onClick={() => onNavigate('product-details', currentHero.featuredProductSlug)}
                    className="px-4 py-2 rounded-xl bg-white/90 hover:bg-white text-neutral-900 text-xs font-bold transition-colors shadow-sm"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* SECTION 2 — CATEGORY / SHOPPING SHORTCUTS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-neutral-900 font-['Outfit',sans-serif]">
              Shop by Category
            </h2>
            <p className="text-sm text-neutral-500 mt-1">Browse our authenticated international collections</p>
          </div>
          <button
            onClick={() => onNavigate('all-products')}
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
          >
            <span>View All</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat) => (
            <motion.div
              key={cat.name}
              whileHover={{ y: -4 }}
              onClick={() => onNavigate('all-products', cat.name)}
              className="bg-white rounded-2xl p-4 border border-neutral-200/80 hover:border-indigo-300 shadow-xs hover:shadow-md cursor-pointer transition-all flex flex-col items-center text-center group"
            >
              <div className="w-16 h-16 rounded-2xl bg-neutral-50 overflow-hidden mb-3 group-hover:scale-105 transition-transform flex items-center justify-center text-2xl">
                <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
              </div>
              <span className="text-xs sm:text-sm font-semibold text-neutral-800 group-hover:text-indigo-600 transition-colors line-clamp-2">
                {cat.name}
              </span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* SECTION 3 — FEATURED PRODUCTS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <h2 className="text-2xl font-bold text-neutral-900 font-['Outfit',sans-serif]">
                Featured Products
              </h2>
            </div>
            <p className="text-sm text-neutral-500 mt-1">Hand-picked top tier products for international shipping</p>
          </div>
          <button
            onClick={() => onNavigate('all-products')}
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
          >
            <span>See More</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {isLoading ? (
          <ProductSkeletonGrid count={4} />
        ) : displayFeatured.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {displayFeatured.map((product) => (
              <ProductCard key={product.id} product={product} onNavigate={onNavigate} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 px-6 rounded-3xl bg-white border border-neutral-200/80 shadow-xs">
            <PackageX className="w-10 h-10 text-neutral-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-neutral-900 font-['Outfit',sans-serif]">
              {loadError ? 'Unable to load products' : 'No products currently available'}
            </h3>
            <p className="text-xs text-neutral-500 mt-1 max-w-md mx-auto">
              {loadError
                ? 'There was a temporary problem connecting to the product catalog. Click below to try again.'
                : 'Our store catalog is currently being updated with authentic inventory. Please check back soon or browse categories above.'}
            </p>
            {loadError && (
              <button
                onClick={() => fetchProducts(0)}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Retry
              </button>
            )}
          </div>
        )}
      </section>

      {/* SECTION 4 — DISCOUNT / OFFER SECTION WITH REAL COUNTDOWN */}
      {promotionalOfferProduct && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="bg-gradient-to-br from-indigo-900 via-neutral-900 to-indigo-950 rounded-3xl p-6 sm:p-10 lg:p-12 text-white shadow-xl border border-indigo-800/40 relative overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
              <div className="lg:col-span-7 flex flex-col items-start">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-400/30 text-rose-300 text-xs font-bold mb-4">
                  <Flame className="w-4 h-4 text-rose-400" />
                  <span>Limited Time Super Deal</span>
                </div>

                <h3 className="text-2xl sm:text-4xl font-extrabold font-['Outfit',sans-serif] tracking-tight mb-3">
                  {promotionalOfferProduct.offer?.title || 'Exclusive Flash Promotion'}
                </h3>
                <p className="text-neutral-300 text-sm sm:text-base leading-relaxed max-w-lg mb-6">
                  Save big on {promotionalOfferProduct.name}. Direct import with verified manufacturer warranty. Order before the timer reaches zero!
                </p>

                {/* Countdown Timer Display */}
                <div className="mb-8">
                  <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-semibold uppercase tracking-wider mb-2">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{isOfferExpired ? 'Offer Status: Expired' : 'Offer Ends In:'}</span>
                  </div>

                  {isOfferExpired ? (
                    <div className="px-4 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-neutral-400 text-sm font-semibold">
                      This limited offer has concluded. Check our other deals!
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-center bg-neutral-800/90 border border-neutral-700/80 rounded-xl px-3.5 py-2 min-w-[64px]">
                        <span className="text-xl sm:text-2xl font-black text-white font-mono">{countdown.days}</span>
                        <span className="text-[10px] text-neutral-400 uppercase font-semibold">Days</span>
                      </div>
                      <span className="text-xl font-bold text-neutral-600">:</span>
                      <div className="flex flex-col items-center bg-neutral-800/90 border border-neutral-700/80 rounded-xl px-3.5 py-2 min-w-[64px]">
                        <span className="text-xl sm:text-2xl font-black text-white font-mono">{countdown.hours}</span>
                        <span className="text-[10px] text-neutral-400 uppercase font-semibold">Hours</span>
                      </div>
                      <span className="text-xl font-bold text-neutral-600">:</span>
                      <div className="flex flex-col items-center bg-neutral-800/90 border border-neutral-700/80 rounded-xl px-3.5 py-2 min-w-[64px]">
                        <span className="text-xl sm:text-2xl font-black text-white font-mono">{countdown.minutes}</span>
                        <span className="text-[10px] text-neutral-400 uppercase font-semibold">Mins</span>
                      </div>
                      <span className="text-xl font-bold text-neutral-600">:</span>
                      <div className="flex flex-col items-center bg-neutral-800/90 border border-neutral-700/80 rounded-xl px-3.5 py-2 min-w-[64px]">
                        <span className="text-xl sm:text-2xl font-black text-rose-400 font-mono">{countdown.seconds}</span>
                        <span className="text-[10px] text-neutral-400 uppercase font-semibold">Secs</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-baseline gap-3 mb-6">
                  <span className="text-2xl sm:text-3xl font-black text-white font-['Outfit',sans-serif]">
                    {formatPrice(convertPrice(promotionalOfferProduct.basePriceBDT, activeCountry), activeCountry)}
                  </span>
                  {promotionalOfferProduct.originalPriceBDT && (
                    <span className="text-base text-neutral-400 line-through">
                      {formatPrice(convertPrice(promotionalOfferProduct.originalPriceBDT, activeCountry), activeCountry)}
                    </span>
                  )}
                  {promotionalOfferProduct.discountPercentage && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-rose-500 text-white">
                      Save {promotionalOfferProduct.discountPercentage}%
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => onNavigate('product-details', promotionalOfferProduct.slug || promotionalOfferProduct.id)}
                    disabled={isOfferExpired}
                    className={`px-7 py-3 rounded-xl text-sm font-bold transition-all shadow-md ${
                      !isOfferExpired
                        ? 'bg-rose-600 hover:bg-rose-500 text-white cursor-pointer'
                        : 'bg-neutral-700 text-neutral-400 cursor-not-allowed'
                    }`}
                  >
                    {!isOfferExpired ? 'Shop This Deal Now' : 'Offer Concluded'}
                  </button>

                  <button
                    onClick={() => onNavigate('offers')}
                    className="px-5 py-3 rounded-xl border border-neutral-700 hover:bg-neutral-800 text-neutral-200 text-sm font-semibold transition-colors"
                  >
                    View All Offers
                  </button>
                </div>
              </div>

              {/* Offer Image */}
              <div className="lg:col-span-5 flex justify-center">
                <div
                  onClick={() => onNavigate('product-details', promotionalOfferProduct.slug || promotionalOfferProduct.id)}
                  className="relative rounded-2xl overflow-hidden shadow-2xl border border-neutral-700 max-w-sm w-full aspect-square cursor-pointer group"
                >
                  <img
                    src={promotionalOfferProduct.images[0]}
                    alt={promotionalOfferProduct.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-4 right-4 bg-rose-600 text-white font-black text-xs px-3 py-1 rounded-full shadow-md">
                    -{promotionalOfferProduct.discountPercentage || 12}% OFF
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SECTION 5 — BEST SELLERS */}
      {(isLoading || bestSellers.length > 0) && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                <h2 className="text-2xl font-bold text-neutral-900 font-['Outfit',sans-serif]">
                  Best Sellers
                </h2>
              </div>
              <p className="text-sm text-neutral-500 mt-1">Most ordered products with highest customer satisfaction</p>
            </div>
            <button
              onClick={() => onNavigate('all-products')}
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
            >
              <span>View All</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {isLoading ? (
            <ProductSkeletonGrid count={4} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {bestSellers.map((product) => (
                <ProductCard key={product.id} product={product} onNavigate={onNavigate} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* SECTION 6 — NEW ARRIVALS */}
      {(isLoading || newArrivals.length > 0) && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-neutral-900 font-['Outfit',sans-serif]">
                New Arrivals
              </h2>
              <p className="text-sm text-neutral-500 mt-1">Freshly stocked international inventory ready to ship</p>
            </div>
            <button
              onClick={() => onNavigate('all-products')}
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
            >
              <span>Browse Catalog</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {isLoading ? (
            <ProductSkeletonGrid count={4} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {newArrivals.map((product) => (
                <ProductCard key={product.id} product={product} onNavigate={onNavigate} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* SECTION 7 — RECOMMENDED PRODUCTS */}
      {(isLoading || products.slice(4, 8).length > 0) && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-neutral-900 font-['Outfit',sans-serif]">
                Recommended for You
              </h2>
              <p className="text-sm text-neutral-500 mt-1">Curated products suited for your region</p>
            </div>
          </div>

          {isLoading ? (
            <ProductSkeletonGrid count={4} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.slice(4, 8).map((product) => (
                <ProductCard key={product.id} product={product} onNavigate={onNavigate} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* SECTION 8 — TRUST / SERVICE INFORMATION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-neutral-200/80 shadow-xs">
          <div className="max-w-2xl mb-8">
            <h3 className="text-2xl font-bold text-neutral-900 font-['Outfit',sans-serif]">
              Why Shop With International Shop?
            </h3>
            <p className="text-sm text-neutral-500 mt-2 leading-relaxed">
              We eliminate cross-border friction between Bangladesh, India, and Pakistan with localized payment options, clear delivery charge policies, and authentic merchandise.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <Truck className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-base text-neutral-900 font-['Outfit',sans-serif]">
                Full Coverage Across 3 Countries
              </h4>
              <p className="text-xs text-neutral-500 leading-relaxed">
                All 64 districts of Bangladesh, 28 states and union territories in India, and major provinces of Pakistan with trackable courier delivery.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-base text-neutral-900 font-['Outfit',sans-serif]">
                Transparent Cash on Delivery
              </h4>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Pay only the nominal Delivery Charge online to confirm booking. Pay the remaining product value safely in cash to the courier upon inspection.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <RotateCcw className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-base text-neutral-900 font-['Outfit',sans-serif]">
                Authenticity & 7-Day Guarantee
              </h4>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Every product is checked with serial number tracking before dispatch. 7-day hassle-free replacement for any verified defect.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
