import React from 'react';
import { Heart, ShoppingBag, ArrowRight, Trash2 } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { EmptyState } from '../components/common/EmptyState';
import { convertPrice, formatPrice } from '../config/countries';

interface WishlistScreenProps {
  onNavigate: (route: string, param?: string) => void;
}

export function WishlistScreen({ onNavigate }: WishlistScreenProps) {
  const { wishlistProducts, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { activeCountry } = useAuth();

  const handleMoveToCart = (product: any) => {
    addToCart(product, 1);
    toggleWishlist(product);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="pb-6 border-b border-neutral-200/80 mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-neutral-900 font-['Outfit',sans-serif]">
            My Wishlist
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            {wishlistProducts.length} {wishlistProducts.length === 1 ? 'item' : 'items'} saved for later
          </p>
        </div>
      </div>

      {wishlistProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {wishlistProducts.map((product) => {
            const currentPrice = convertPrice(product.basePriceBDT, activeCountry);
            const originalPrice = product.originalPriceBDT
              ? convertPrice(product.originalPriceBDT, activeCountry)
              : null;

            return (
              <div
                key={product.id}
                className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs flex flex-col overflow-hidden group hover:shadow-md transition-all"
              >
                {/* Image */}
                <div
                  onClick={() => onNavigate('product-details', product.slug || product.id)}
                  className="relative w-full aspect-square bg-neutral-50 cursor-pointer overflow-hidden"
                >
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleWishlist(product);
                    }}
                    className="absolute top-3 right-3 p-2 rounded-full bg-white/90 text-rose-600 shadow-xs hover:bg-white transition-colors"
                    aria-label="Remove from wishlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Details */}
                <div className="p-4 flex-1 flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-neutral-400 mb-1">
                    {product.brand}
                  </span>
                  <h3
                    onClick={() => onNavigate('product-details', product.slug || product.id)}
                    className="text-sm font-semibold text-neutral-900 font-['Outfit',sans-serif] line-clamp-2 cursor-pointer hover:text-indigo-600 transition-colors mb-2"
                  >
                    {product.name}
                  </h3>

                  <div className="mt-auto pt-3 border-t border-neutral-100 flex items-center justify-between gap-2">
                    <div>
                      <div className="text-base font-bold text-neutral-900 font-['Outfit',sans-serif]">
                        {formatPrice(currentPrice, activeCountry)}
                      </div>
                      {originalPrice && (
                        <div className="text-xs text-neutral-400 line-through">
                          {formatPrice(originalPrice, activeCountry)}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleMoveToCart(product)}
                      disabled={product.stock <= 0}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs disabled:opacity-40"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Move to Cart</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Heart}
          title="Your Wishlist is Empty"
          description="You haven't saved any international items to your wishlist yet. Browse our catalog and click the heart icon on any product."
          actionText="Discover Products"
          onAction={() => onNavigate('all-products')}
        />
      )}
    </div>
  );
}
