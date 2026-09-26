import React from 'react';
import { ShoppingBag, Trash2, Heart, ArrowRight, ShieldCheck, AlertCircle, Check } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { EmptyState } from '../components/common/EmptyState';
import { convertPrice, formatPrice, COUNTRY_DELIVERY_CONFIGS } from '../config/countries';

interface CartScreenProps {
  onNavigate: (route: string, param?: string) => void;
}

export function CartScreen({ onNavigate }: CartScreenProps) {
  const { items, updateQuantity, removeFromCart, totalItems, subtotal, isCodAvailable, ineligibleCodItemNames } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { activeCountry } = useAuth();

  const deliveryConfig = COUNTRY_DELIVERY_CONFIGS[activeCountry];
  const deliveryCharge = items.length > 0 ? deliveryConfig.baseDeliveryCharge : 0;
  const grandTotal = subtotal + deliveryCharge;

  const handleMoveToWishlist = (item: any) => {
    if (!isInWishlist(item.productId)) {
      toggleWishlist(item.product);
    }
    removeFromCart(item.productId, item.selectedVariants);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="pb-6 border-b border-neutral-200/80 mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-neutral-900 font-['Outfit',sans-serif]">
            Shopping Cart
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            {totalItems} {totalItems === 1 ? 'item' : 'items'} in your cart
          </p>
        </div>
      </div>

      {items.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Column: Cart Items List */}
          <div className="lg:col-span-8 space-y-4">
            {items.map((item) => {
              const itemUnitPrice = convertPrice(item.product.basePriceBDT, activeCountry);
              const itemTotal = itemUnitPrice * item.quantity;

              return (
                <div
                  key={`${item.productId}-${JSON.stringify(item.selectedVariants)}`}
                  className="bg-white rounded-2xl p-4 sm:p-6 border border-neutral-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6"
                >
                  {/* Thumbnail */}
                  <div
                    onClick={() => onNavigate('product-details', item.product.slug || item.product.id)}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-neutral-50 overflow-hidden shrink-0 border border-neutral-100 cursor-pointer"
                  >
                    <img
                      src={item.product.images[0]}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Title & Variants */}
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] uppercase font-bold text-neutral-400">
                      {item.product.brand}
                    </span>
                    <h3
                      onClick={() => onNavigate('product-details', item.product.slug || item.product.id)}
                      className="text-sm sm:text-base font-semibold text-neutral-900 line-clamp-2 cursor-pointer hover:text-indigo-600 transition-colors font-['Outfit',sans-serif]"
                    >
                      {item.product.name}
                    </h3>

                    {/* Selected Variants */}
                    {item.selectedVariants && Object.keys(item.selectedVariants).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {Object.entries(item.selectedVariants).map(([k, v]) => (
                          <span
                            key={k}
                            className="inline-block text-[11px] font-medium bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-md"
                          >
                            {k}: <strong>{v}</strong>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Unit Price */}
                    <div className="text-xs text-neutral-500 mt-1">
                      Unit: {formatPrice(itemUnitPrice, activeCountry)}
                    </div>
                  </div>

                  {/* Quantity & Item Subtotal */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-4">
                    {/* Quantity controls */}
                    <div className="inline-flex items-center border border-neutral-200 rounded-xl bg-neutral-50 p-0.5">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1, item.selectedVariants)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-neutral-700 hover:bg-white text-xs font-bold"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-xs font-bold text-neutral-900">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1, item.selectedVariants)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-neutral-700 hover:bg-white text-xs font-bold"
                      >
                        +
                      </button>
                    </div>

                    {/* Subtotal */}
                    <div className="text-right">
                      <div className="text-base font-bold text-neutral-900 font-['Outfit',sans-serif]">
                        {formatPrice(itemTotal, activeCountry)}
                      </div>
                    </div>
                  </div>

                  {/* Actions: Save to Wishlist, Remove */}
                  <div className="flex sm:flex-col items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-100 w-full sm:w-auto justify-end">
                    <button
                      onClick={() => handleMoveToWishlist(item)}
                      className="p-2 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-neutral-50 transition-colors"
                      title="Move to Wishlist"
                    >
                      <Heart className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removeFromCart(item.productId, item.selectedVariants)}
                      className="p-2 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-50 transition-colors"
                      title="Remove from cart"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Order Summary Card */}
          <div className="lg:col-span-4 bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200/80 shadow-xs sticky top-28">
            <h2 className="text-xl font-bold text-neutral-900 font-['Outfit',sans-serif] mb-4">
              Order Summary
            </h2>

            <div className="space-y-3 text-sm pb-4 border-b border-neutral-100">
              <div className="flex justify-between text-neutral-600">
                <span>Items Subtotal</span>
                <span className="font-semibold text-neutral-900">{formatPrice(subtotal, activeCountry)}</span>
              </div>

              <div className="flex justify-between text-neutral-600">
                <span>Estimated Delivery ({activeCountry})</span>
                <span className="font-semibold text-neutral-900">
                  {formatPrice(deliveryCharge, activeCountry)}
                </span>
              </div>

              <div className="flex justify-between text-neutral-600">
                <span>Taxes</span>
                <span className="font-semibold text-emerald-600">Included / 0.00</span>
              </div>
            </div>

            {/* Total */}
            <div className="py-4 border-b border-neutral-100 flex justify-between items-baseline">
              <span className="text-base font-bold text-neutral-900 font-['Outfit',sans-serif]">
                Estimated Total
              </span>
              <span className="text-2xl font-black text-neutral-900 font-['Outfit',sans-serif]">
                {formatPrice(grandTotal, activeCountry)}
              </span>
            </div>

            {/* Cash on Delivery Eligibility notice */}
            <div className="my-5 p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200/70 text-xs">
              {isCodAvailable ? (
                <div className="flex items-start gap-2.5 text-emerald-800">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Cash on Delivery Available</span>
                    <span className="text-[11px] text-neutral-500 leading-tight block mt-0.5">
                      You can pay {deliveryConfig.currencySymbol}{deliveryConfig.baseDeliveryCharge} delivery charge online to confirm booking and the remaining order balance upon delivery.
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2.5 text-amber-800">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Prepaid Required for Selection</span>
                    <span className="text-[11px] text-neutral-500 leading-tight block mt-0.5">
                      Some items ({ineligibleCodItemNames.join(', ')}) do not qualify for Cash on Delivery. Full online payment required at checkout.
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Checkout Button */}
            <button
              onClick={() => onNavigate('checkout')}
              className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onNavigate('all-products')}
              className="w-full mt-3 py-2.5 text-xs font-semibold text-neutral-600 hover:text-neutral-900 text-center"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={ShoppingBag}
          title="Your Shopping Cart is Empty"
          description="Looks like you haven't added any products to your bag yet. Explore our curated catalog of authentic international electronics."
          actionText="Start Shopping"
          onAction={() => onNavigate('all-products')}
        />
      )}
    </div>
  );
}
