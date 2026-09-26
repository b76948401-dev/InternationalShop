import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Star,
  Heart,
  ShoppingBag,
  Zap,
  Truck,
  ShieldCheck,
  RotateCcw,
  Check,
  Ban,
  Maximize2,
  X,
  ThumbsUp,
  MessageSquare,
  Upload,
  ChevronRight,
} from 'lucide-react';
import { Product, ProductReview } from '../types';
import { ProductDetailSkeleton } from '../components/common/LoadingSkeleton';
import { ErrorState } from '../components/common/ErrorState';
import { ProductCard } from '../components/common/ProductCard';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import { COUNTRY_CURRENCIES, convertPrice, formatPrice, COUNTRY_DELIVERY_CONFIGS } from '../config/countries';

interface ProductDetailsScreenProps {
  productIdOrSlug: string;
  onNavigate: (route: string, param?: string) => void;
}

export function ProductDetailsScreen({ productIdOrSlug, onNavigate }: ProductDetailsScreenProps) {
  const { user, token, activeCountry } = useAuth();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { showToast } = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Gallery state
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState<boolean>(false);
  const [lightboxImage, setLightboxImage] = useState<string>('');

  // Variant & Quantity selection
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState<number>(1);

  // Tabs state
  const [activeTab, setActiveTab] = useState<'description' | 'specifications' | 'features' | 'shipping' | 'warranty'>('description');

  // Review Modal state
  const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>('');
  const [reviewPhotos, setReviewPhotos] = useState<string[]>([]);
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);

  // Fetch product data when productIdOrSlug changes
  useEffect(() => {
    const fetchProductData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/products/${encodeURIComponent(productIdOrSlug)}`);
        if (!res.ok) {
          throw new Error('Product not found or unavailable');
        }
        const data = await res.json();
        setProduct(data.product);
        setRelatedProducts(data.relatedProducts || []);
        setSelectedImageIndex(0);
        setQuantity(1);

        // Initialize default variants if product has them
        if (data.product.variants && data.product.variants.length > 0) {
          const initial: Record<string, string> = {};
          data.product.variants.forEach((v: { name: string; options: string[] }) => {
            if (v.options && v.options.length > 0) {
              initial[v.name] = v.options[0];
            }
          });
          setSelectedVariants(initial);
        } else {
          setSelectedVariants({});
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load product details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProductData();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [productIdOrSlug]);

  if (isLoading) {
    return <ProductDetailSkeleton />;
  }

  if (error || !product) {
    return (
      <ErrorState
        title="Product Not Found"
        message={error || 'The requested product could not be located in our catalog.'}
        onGoBack={() => onNavigate('all-products')}
        onRetry={() => onNavigate('product-details', productIdOrSlug)}
      />
    );
  }

  const currentPrice = convertPrice(product.basePriceBDT, activeCountry);
  const originalPrice = product.originalPriceBDT
    ? convertPrice(product.originalPriceBDT, activeCountry)
    : null;
  const inWishlist = isInWishlist(product.id);
  const deliveryConfig = COUNTRY_DELIVERY_CONFIGS[activeCountry];

  const handleAddToCart = () => {
    if (product.stock <= 0) return;
    addToCart(product, quantity, selectedVariants);
  };

  const handleBuyNow = () => {
    if (product.stock <= 0) return;
    addToCart(product, quantity, selectedVariants);
    onNavigate('checkout');
  };

  // Review submission
  const handleReviewPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Convert file to base64 URL for demo storage
    const file = files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setReviewPhotos((prev) => [...prev, reader.result as string]);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      showToast('Please log in to submit a verified review', 'warning');
      onNavigate('login');
      return;
    }

    if (!reviewComment.trim()) {
      showToast('Please enter your review comments', 'warning');
      return;
    }

    setIsSubmittingReview(true);
    try {
      const res = await fetch(`/api/products/${product.id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          rating: reviewRating,
          comment: reviewComment.trim(),
          photos: reviewPhotos,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit review');
      }

      setProduct(data.product);
      setIsReviewModalOpen(false);
      setReviewComment('');
      setReviewPhotos([]);
      showToast('Your review has been submitted successfully!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Submission error', 'error');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Star distribution math
  const reviews = product.reviews || [];
  const ratingDistribution = [5, 4, 3, 2, 1].map((stars) => {
    const count = reviews.filter((r) => Math.round(r.rating) === stars).length;
    const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
    return { stars, count, percentage };
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-neutral-500 mb-6">
        <button onClick={() => onNavigate('home')} className="hover:text-neutral-900 transition-colors">
          Home
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
        <button
          onClick={() => onNavigate('all-products', product.category)}
          className="hover:text-neutral-900 transition-colors"
        >
          {product.category}
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
        <span className="text-neutral-900 font-medium truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main Product Grid: Gallery + Purchasing Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start mb-16">
        {/* LEFT: Image Gallery */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Main Display Image */}
          <div className="relative w-full aspect-4/3 sm:aspect-square bg-neutral-50 rounded-3xl overflow-hidden border border-neutral-200/80 shadow-xs group">
            <img
              src={product.images[selectedImageIndex] || product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
            />

            {/* Lightbox Expand Button */}
            <button
              onClick={() => {
                setLightboxImage(product.images[selectedImageIndex] || product.images[0]);
                setIsLightboxOpen(true);
              }}
              className="absolute top-4 right-4 p-2.5 rounded-full bg-white/90 hover:bg-white text-neutral-700 hover:text-indigo-600 shadow-md backdrop-blur-xs transition-colors cursor-pointer"
              aria-label="View fullscreen image"
            >
              <Maximize2 className="w-4 h-4" />
            </button>

            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none">
              {product.discountPercentage && product.discountPercentage > 0 && (
                <span className="px-3 py-1 rounded-xl bg-rose-600 text-white font-black text-xs shadow-md">
                  -{product.discountPercentage}% OFF
                </span>
              )}
              {product.isBestSeller && (
                <span className="px-3 py-1 rounded-xl bg-amber-500 text-neutral-900 font-bold text-xs shadow-md">
                  Best Seller
                </span>
              )}
            </div>
          </div>

          {/* Thumbnail Gallery */}
          {product.images.length > 1 && (
            <div className="grid grid-cols-5 sm:grid-cols-6 gap-3">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`aspect-square rounded-xl overflow-hidden border-2 transition-all cursor-pointer bg-neutral-50 ${
                    selectedImageIndex === idx
                      ? 'border-indigo-600 shadow-xs scale-95'
                      : 'border-transparent hover:border-neutral-300 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: Product Information & Purchase Actions */}
        <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200/80 shadow-xs flex flex-col">
          {/* Brand & Stock status */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
              {product.brand}
            </span>
            {product.stock > 0 ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                <Check className="w-3.5 h-3.5" />
                {product.stock > 10 ? 'In Stock' : `Only ${product.stock} Left`}
              </span>
            ) : (
              <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg">
                Out of Stock
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 font-['Outfit',sans-serif] leading-tight mb-3">
            {product.name}
          </h1>

          {/* Rating & Review summary */}
          <div className="flex items-center gap-2 mb-5 pb-4 border-b border-neutral-100">
            <div className="flex items-center text-amber-500">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < Math.floor(product.rating)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-neutral-200 fill-neutral-200'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm font-bold text-neutral-900">{product.rating.toFixed(1)}</span>
            <span className="text-xs text-neutral-400">({product.reviewCount} verified reviews)</span>
          </div>

          {/* Localized Price Section */}
          <div className="mb-6">
            <div className="text-xs text-neutral-400 uppercase font-bold tracking-wider mb-1">
              Regional Price ({activeCountry})
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl sm:text-4xl font-black text-neutral-900 font-['Outfit',sans-serif]">
                {formatPrice(currentPrice, activeCountry)}
              </span>
              {originalPrice && originalPrice > currentPrice && (
                <span className="text-base text-neutral-400 line-through">
                  {formatPrice(originalPrice, activeCountry)}
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              Base: BDT {product.basePriceBDT.toLocaleString()} (Tax excluded)
            </p>
          </div>

          {/* Cash on Delivery Eligibility Highlight */}
          <div className="mb-6 p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200/70 flex items-start gap-3">
            {product.isCodEligible ? (
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Check className="w-4 h-4" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-xl bg-neutral-200 text-neutral-700 flex items-center justify-center shrink-0">
                <Ban className="w-4 h-4" />
              </div>
            )}
            <div>
              <div className="text-xs font-bold text-neutral-900">
                {product.isCodEligible ? 'Cash on Delivery Eligible' : 'Prepaid Only Product'}
              </div>
              <p className="text-[11px] text-neutral-500 mt-0.5 leading-relaxed">
                {product.isCodEligible
                  ? `For ${activeCountry}: Pay ${deliveryConfig.currencySymbol}${deliveryConfig.baseDeliveryCharge} Delivery Charge online to verify order, balance collected at delivery.`
                  : 'Due to international customs or high-value transit, this item requires full upfront prepaid payment.'}
              </p>
            </div>
          </div>

          {/* Variants Selectors (Color, Size, etc.) */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-4 mb-6">
              {product.variants.map((variant) => (
                <div key={variant.name}>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
                    {variant.name}:{' '}
                    <span className="text-neutral-900 normal-case">{selectedVariants[variant.name]}</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {variant.options.map((opt) => {
                      const isSelected = selectedVariants[variant.name] === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() =>
                            setSelectedVariants((prev) => ({ ...prev, [variant.name]: opt }))
                          }
                          className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-xs'
                              : 'border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quantity Selector */}
          <div className="mb-8">
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
              Quantity
            </label>
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center border border-neutral-200 rounded-xl bg-neutral-50 p-1">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-700 hover:bg-white disabled:opacity-30 cursor-pointer"
                >
                  -
                </button>
                <span className="w-10 text-center text-sm font-bold text-neutral-900">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                  disabled={quantity >= product.stock}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-700 hover:bg-white disabled:opacity-30 cursor-pointer"
                >
                  +
                </button>
              </div>
              <span className="text-xs text-neutral-400">({product.stock} available in warehouse)</span>
            </div>
          </div>

          {/* Action Buttons: Add to Cart, Buy Now, Wishlist */}
          <div className="space-y-3 mt-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleAddToCart}
                disabled={product.stock <= 0}
                className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-colors shadow-md disabled:bg-neutral-200 disabled:text-neutral-400 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Add to Cart</span>
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleBuyNow}
                disabled={product.stock <= 0}
                className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-sm transition-colors shadow-md disabled:bg-neutral-200 disabled:text-neutral-400 cursor-pointer"
              >
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Buy Now</span>
              </motion.button>
            </div>

            <button
              onClick={() => toggleWishlist(product)}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                inWishlist
                  ? 'border-rose-200 bg-rose-50 text-rose-600'
                  : 'border-neutral-200 text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              <Heart className={`w-4 h-4 ${inWishlist ? 'fill-rose-600 text-rose-600' : ''}`} />
              <span>{inWishlist ? 'Saved in Wishlist' : 'Add to Wishlist'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION: Product Information Tabs */}
      <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-xs overflow-hidden mb-16">
        {/* Tab Headers */}
        <div className="flex overflow-x-auto border-b border-neutral-200 bg-neutral-50/50 p-2 gap-2">
          {[
            { id: 'description', label: 'Description' },
            { id: 'specifications', label: 'Specifications' },
            { id: 'features', label: 'Key Features' },
            { id: 'shipping', label: 'Shipping & Delivery' },
            { id: 'warranty', label: 'Warranty & Returns' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-5 py-3 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content Panels */}
        <div className="p-6 sm:p-10">
          {activeTab === 'description' && (
            <div className="prose prose-neutral max-w-none text-neutral-700 text-sm sm:text-base leading-relaxed">
              <p className="mb-6">{product.description}</p>
              {product.features && product.features.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-bold text-neutral-900 text-base mb-3 font-['Outfit',sans-serif]">
                    Highlights:
                  </h4>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-2.5 list-none p-0">
                    {product.features.map((feat, idx) => (
                      <li key={idx} className="flex items-center gap-2.5 text-xs sm:text-sm text-neutral-600">
                        <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {activeTab === 'specifications' && (
            <div className="overflow-x-auto">
              {product.specifications && Object.keys(product.specifications).length > 0 ? (
                <table className="w-full text-left text-xs sm:text-sm">
                  <tbody>
                    {Object.entries(product.specifications).map(([key, val], idx) => (
                      <tr
                        key={key}
                        className={idx % 2 === 0 ? 'bg-neutral-50/70' : 'bg-white'}
                      >
                        <td className="py-3 px-4 font-bold text-neutral-600 w-1/3 border-b border-neutral-100">
                          {key}
                        </td>
                        <td className="py-3 px-4 text-neutral-900 border-b border-neutral-100">
                          {val}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-xs text-neutral-500">Standard specifications apply.</p>
              )}
            </div>
          )}

          {activeTab === 'features' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {product.features?.map((feat, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-neutral-50 border border-neutral-100 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 font-bold text-xs">
                    {idx + 1}
                  </div>
                  <div>
                    <span className="font-bold text-neutral-900 text-sm block mb-0.5">Feature Highlight</span>
                    <span className="text-neutral-600 text-xs">{feat}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'shipping' && (
            <div className="space-y-4 text-xs sm:text-sm text-neutral-600 leading-relaxed">
              <div className="flex items-center gap-3 text-neutral-900 font-bold text-base">
                <Truck className="w-5 h-5 text-indigo-600" />
                <span>Regional Cross-Border Logistics ({activeCountry})</span>
              </div>
              <p>
                Estimated delivery duration: <strong className="text-neutral-900">3 to 7 business days</strong>. All shipments originate from verified bonded facilities in Dhaka, Mumbai, or Lahore and are tracked with real-time courier checkpoints.
              </p>
              <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 text-xs text-indigo-900">
                <strong>Cash on Delivery Protocol:</strong> To guard against bogus orders, customers in {activeCountry} pay the {deliveryConfig.currencySymbol}{deliveryConfig.baseDeliveryCharge} delivery charge online via approved gateways. The remaining order balance is collected by the delivery agent at your door.
              </div>
            </div>
          )}

          {activeTab === 'warranty' && (
            <div className="space-y-4 text-xs sm:text-sm text-neutral-600 leading-relaxed">
              <div className="flex items-center gap-3 text-neutral-900 font-bold text-base">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>Warranty & 7-Day Inspection Policy</span>
              </div>
              <p>
                Warranty Period: <strong className="text-neutral-900">{product.warrantyInfo || '1 Year Official Warranty'}</strong> covering manufacturing and technical defects.
              </p>
              <p>
                Return Policy: <strong className="text-neutral-900">{product.returnPolicy || '7 Days Replacement Policy'}</strong>. Please inspect your parcel in the presence of the courier. If damaged or mismatched, report it within 48 hours for immediate replacement.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* SECTION: Customer Reviews & Ratings */}
      <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-xs p-6 sm:p-10 mb-16">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-neutral-100">
          <div>
            <h3 className="text-2xl font-bold text-neutral-900 font-['Outfit',sans-serif]">
              Customer Ratings & Feedback
            </h3>
            <p className="text-xs text-neutral-500 mt-1">
              Verified feedback from customers across Bangladesh, India, and Pakistan
            </p>
          </div>

          <button
            onClick={() => setIsReviewModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer self-start md:self-auto"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Write a Review</span>
          </button>
        </div>

        {/* Rating Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 py-8 border-b border-neutral-100 items-center">
          {/* Left score */}
          <div className="md:col-span-4 flex flex-col items-center justify-center text-center p-6 bg-neutral-50 rounded-2xl">
            <span className="text-5xl font-black text-neutral-900 font-['Outfit',sans-serif]">
              {product.rating.toFixed(1)}
            </span>
            <div className="flex items-center text-amber-500 my-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-5 h-5 ${
                    i < Math.floor(product.rating)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-neutral-200 fill-neutral-200'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-neutral-500 font-medium">Based on {reviews.length} reviews</span>
          </div>

          {/* Right progress bars */}
          <div className="md:col-span-8 space-y-2">
            {ratingDistribution.map(({ stars, count, percentage }) => (
              <div key={stars} className="flex items-center gap-3 text-xs">
                <span className="w-8 font-bold text-neutral-700 flex items-center gap-0.5">
                  {stars} <Star className="w-3 h-3 fill-amber-400 text-amber-400 inline" />
                </span>
                <div className="flex-1 h-2 rounded-full bg-neutral-100 overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="w-10 text-right text-neutral-400 font-mono">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Reviews List */}
        <div className="pt-8 space-y-6">
          {reviews.length > 0 ? (
            reviews.map((rev) => (
              <div key={rev.id} className="pb-6 border-b border-neutral-100 last:border-0">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-neutral-900">{rev.userName}</span>
                    {rev.isVerifiedPurchase && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                        <Check className="w-3 h-3" />
                        Verified Purchase
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-neutral-400">
                    {new Date(rev.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center text-amber-400 mb-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        i < rev.rating ? 'fill-amber-400' : 'text-neutral-200 fill-neutral-200'
                      }`}
                    />
                  ))}
                </div>

                <p className="text-xs sm:text-sm text-neutral-700 leading-relaxed mb-3">{rev.comment}</p>

                {/* Customer Uploaded Review Photos with Lightbox */}
                {rev.photos && rev.photos.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {rev.photos.map((photo, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setLightboxImage(photo);
                          setIsLightboxOpen(true);
                        }}
                        className="w-16 h-16 rounded-xl overflow-hidden border border-neutral-200 hover:opacity-90 transition-opacity cursor-pointer"
                      >
                        <img src={photo} alt="Customer upload" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-1 text-xs text-neutral-400">
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>Helpful ({rev.likesCount || 0})</span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-neutral-500 text-center py-6">
              No reviews yet. Be the first to share your experience with this product!
            </p>
          )}
        </div>
      </div>

      {/* SECTION: Related Products & You May Also Like */}
      {relatedProducts.length > 0 && (
        <div className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-2xl font-bold text-neutral-900 font-['Outfit',sans-serif]">
                You May Also Like
              </h3>
              <p className="text-xs text-neutral-500 mt-1">Related selections from {product.category}</p>
            </div>
            <button
              onClick={() => onNavigate('all-products', product.category)}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
            >
              See all in {product.category} →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.slice(0, 4).map((rel) => (
              <ProductCard key={rel.id} product={rel} onNavigate={onNavigate} />
            ))}
          </div>
        </div>
      )}

      {/* LIGHTBOX MODAL */}
      <AnimatePresence>
        {isLightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsLightboxOpen(false)}
            className="fixed inset-0 bg-neutral-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4 cursor-zoom-out"
          >
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full bg-white/20 text-white hover:bg-white/40 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              src={lightboxImage}
              alt="Expanded view"
              className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* WRITE REVIEW MODAL */}
      <AnimatePresence>
        {isReviewModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-neutral-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative"
            >
              <button
                onClick={() => setIsReviewModalOpen(false)}
                className="absolute top-5 right-5 p-1 rounded-lg text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-xl font-bold text-neutral-900 mb-1 font-['Outfit',sans-serif]">
                Write a Customer Review
              </h3>
              <p className="text-xs text-neutral-500 mb-6">
                Share your candid feedback on {product.name}
              </p>

              <form onSubmit={handleSubmitReview} className="space-y-4">
                {/* Rating selection */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
                    Overall Rating
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className="p-1 text-neutral-300 hover:text-amber-400 focus:outline-hidden transition-colors"
                      >
                        <Star
                          className={`w-7 h-7 ${
                            star <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-neutral-300'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-bold text-neutral-700 ml-2">{reviewRating} out of 5</span>
                  </div>
                </div>

                {/* Comment Textarea */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
                    Your Review
                  </label>
                  <textarea
                    rows={4}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Describe packaging, build quality, sound/performance, delivery speed..."
                    className="w-full p-3.5 rounded-2xl border border-neutral-200 text-xs sm:text-sm text-neutral-900 focus:border-indigo-600 outline-hidden"
                    required
                  />
                </div>

                {/* Photo Upload */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
                    Attach Photos (Optional)
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-neutral-300 hover:bg-neutral-50 text-xs font-semibold text-neutral-700 cursor-pointer">
                      <Upload className="w-4 h-4" />
                      <span>Upload Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleReviewPhotoUpload}
                        className="hidden"
                      />
                    </label>
                    {reviewPhotos.length > 0 && (
                      <span className="text-xs text-emerald-600 font-semibold">
                        {reviewPhotos.length} photo attached
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-neutral-100">
                  <button
                    type="button"
                    onClick={() => setIsReviewModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingReview}
                    className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors shadow-xs disabled:opacity-50"
                  >
                    {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
