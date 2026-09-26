import React from 'react';
import { motion } from 'motion/react';
import { Star, Heart, ShoppingBag, Check, Ban } from 'lucide-react';
import { Product } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { convertPrice, formatPrice } from '../../config/countries';

interface ProductCardProps {
  key?: React.Key;
  product: Product;
  onNavigate: (route: string, param?: string) => void;
}

export function ProductCard({ product, onNavigate }: ProductCardProps) {
  const { activeCountry } = useAuth();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const currentPrice = convertPrice(product.basePriceBDT, activeCountry);
  const originalPrice = product.originalPriceBDT
    ? convertPrice(product.originalPriceBDT, activeCountry)
    : null;

  const inWishlist = isInWishlist(product.id);

  const handleCardClick = (e: React.MouseEvent) => {
    // Navigate to full product details page
    onNavigate('product-details', product.slug || product.id);
  };

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWishlist(product);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.stock > 0) {
      addToCart(product, 1);
    }
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      onClick={handleCardClick}
      className="group relative bg-white rounded-2xl border border-neutral-200/80 hover:border-indigo-200 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col overflow-hidden"
    >
      {/* Top Badges */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 pointer-events-none">
        {product.discountPercentage && product.discountPercentage > 0 && (
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-600 text-white shadow-xs tracking-wide">
            -{product.discountPercentage}%
          </span>
        )}
        {product.isBestSeller && (
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500 text-neutral-900 shadow-xs">
            Best Seller
          </span>
        )}
      </div>

      {/* Wishlist Button */}
      <button
        onClick={handleWishlistClick}
        aria-label={inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
        className={`absolute top-3 right-3 z-10 w-9 h-9 rounded-full flex items-center justify-center transition-all ${
          inWishlist
            ? 'bg-rose-50 text-rose-600 shadow-xs'
            : 'bg-white/90 text-neutral-400 hover:text-rose-600 hover:bg-white shadow-xs'
        }`}
      >
        <motion.div whileTap={{ scale: 0.8 }} animate={{ scale: inWishlist ? [1, 1.25, 1] : 1 }}>
          <Heart className={`w-4 h-4 ${inWishlist ? 'fill-rose-600 text-rose-600' : ''}`} />
        </motion.div>
      </button>

      {/* Product Image */}
      <div className="relative w-full aspect-square bg-neutral-50 overflow-hidden">
        <img
          src={product.images[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80'}
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        {product.stock <= 0 && (
          <div className="absolute inset-0 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center text-white text-xs font-bold uppercase tracking-wider">
            Out of Stock
          </div>
        )}
      </div>

      {/* Details Container */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col">
        {/* Category & Brand */}
        <div className="flex items-center justify-between text-xs text-neutral-500 mb-1.5">
          <span className="font-medium text-neutral-400 uppercase tracking-wider">{product.brand}</span>
          <div className="flex items-center gap-1 text-amber-500 font-semibold">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>{product.rating.toFixed(1)}</span>
            <span className="text-neutral-400 font-normal">({product.reviewCount})</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-neutral-900 text-sm sm:text-base line-clamp-2 mb-2 group-hover:text-indigo-600 transition-colors font-['Outfit',sans-serif] leading-snug">
          {product.name}
        </h3>

        {/* COD Eligibility & Stock info */}
        <div className="flex items-center gap-2 mb-3 text-xs">
          {product.isCodEligible ? (
            <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-medium">
              <Check className="w-3 h-3 text-emerald-600" />
              COD Available
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded-md font-medium">
              <Ban className="w-3 h-3 text-neutral-500" />
              Prepaid Only
            </span>
          )}

          {product.stock > 0 && product.stock <= 10 && (
            <span className="text-amber-600 font-medium ml-auto">
              Only {product.stock} left
            </span>
          )}
        </div>

        {/* Pricing & Add to Cart button */}
        <div className="mt-auto pt-3 border-t border-neutral-100 flex items-center justify-between gap-2">
          <div>
            <div className="text-lg font-bold text-neutral-900 font-['Outfit',sans-serif]">
              {formatPrice(currentPrice, activeCountry)}
            </div>
            {originalPrice && originalPrice > currentPrice && (
              <div className="text-xs text-neutral-400 line-through">
                {formatPrice(originalPrice, activeCountry)}
              </div>
            )}
          </div>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleAddToCart}
            disabled={product.stock <= 0}
            className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shadow-xs ${
              product.stock > 0
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add to Cart</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
