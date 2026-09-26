import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Package,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  MapPin,
  CreditCard,
  Printer,
  XCircle,
  ArrowLeft,
  ExternalLink,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Order, OrderStatus } from '../types';
import { COUNTRY_CURRENCIES } from '../config/countries';

interface OrderDetailsScreenProps {
  orderId: string;
  onNavigate: (route: string, param?: string) => void;
}

export function OrderDetailsScreen({ orderId, onNavigate }: OrderDetailsScreenProps) {
  const { token } = useAuth();
  const { showToast } = useToast();

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showScreenshotModal, setShowScreenshotModal] = useState(false);

  const fetchOrder = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setOrder(data.order);
      }
    } catch (err) {
      console.error('Failed to load order details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId, token]);

  const handleCancelOrder = async () => {
    if (!token || !order) return;
    if (!window.confirm('Are you sure you want to cancel this order?')) return;

    setIsCancelling(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        showToast('Order cancelled successfully', 'info');
        fetchOrder();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to cancel order', 'error');
      }
    } catch (err) {
      showToast('Network error while cancelling order', 'error');
    } finally {
      setIsCancelling(false);
    }
  };

  const handlePrintInvoice = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16">
        <div className="h-64 bg-white rounded-3xl border border-neutral-200 animate-pulse" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-lg mx-auto py-20 text-center">
        <h2 className="text-xl font-bold text-neutral-900 mb-2">Order Not Found</h2>
        <p className="text-xs text-neutral-500 mb-6">We could not find the order ID {orderId}.</p>
        <button
          type="button"
          onClick={() => onNavigate('my-orders')}
          className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-xs cursor-pointer"
        >
          Return to Orders
        </button>
      </div>
    );
  }

  const currencySymbol = COUNTRY_CURRENCIES[order.country]?.symbol || order.currencySymbol || '৳';
  const screenshot = order.paymentProof?.screenshotUrl || order.proofScreenshotUrl;
  const isVerified = order.paymentStatus === 'verified' || order.deliveryPaymentStatus === 'Verified';
  const isRejected = order.paymentStatus === 'failed' || order.deliveryPaymentStatus === 'Rejected';

  // Tracking Timeline steps
  const steps = [
    { label: 'Order Placed', status: 'completed' },
    {
      label: 'Payment Verified',
      status: isVerified ? 'completed' : 'current',
    },
    {
      label: 'In Warehouse / Processing',
      status:
        order.orderStatus === 'Processing' ||
        order.orderStatus === 'Shipped' ||
        order.orderStatus === 'Delivered'
          ? 'completed'
          : 'upcoming',
    },
    {
      label: 'Courier Dispatched',
      status:
        order.orderStatus === 'Shipped' || order.orderStatus === 'Delivered'
          ? 'completed'
          : 'upcoming',
    },
    {
      label: 'Delivered',
      status: order.orderStatus === 'Delivered' ? 'completed' : 'upcoming',
    },
  ];

  const canCancel = order.orderStatus === 'Pending';
  const productSubtotal = order.productSubtotal ?? order.subtotal ?? 0;
  const amountPaidOnline = order.amountPaidOnline ?? (order.isCod ? order.deliveryCharge : order.totalAmount);
  const remainingCod = order.remainingCodAmount ?? (order.isCod ? productSubtotal : 0);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 print:p-0">
      <button
        type="button"
        onClick={() => onNavigate('my-orders')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 mb-6 transition-colors print:hidden cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to My Orders</span>
      </button>

      {/* Main Order Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/80 shadow-xs mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-neutral-100">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-neutral-900 font-['Outfit',sans-serif]">
                Order #{order.id}
              </h1>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                {order.orderStatus}
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              Placed on {new Date(order.createdAt).toLocaleDateString()} at{' '}
              {new Date(order.createdAt).toLocaleTimeString()}
            </p>
          </div>

          <div className="flex items-center gap-2 print:hidden">
            <button
              type="button"
              onClick={handlePrintInvoice}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-xs font-semibold text-neutral-700 transition-colors shadow-xs cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Invoice</span>
            </button>

            {canCancel && (
              <button
                type="button"
                onClick={handleCancelOrder}
                disabled={isCancelling}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50 text-xs font-bold text-rose-600 hover:bg-rose-100 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <XCircle className="w-4 h-4" />
                <span>{isCancelling ? 'Cancelling...' : 'Cancel Order'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Tracking Timeline */}
        {order.orderStatus !== 'Cancelled' ? (
          <div className="py-8 border-b border-neutral-100 print:hidden">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-6">
              Fulfillment Journey & Tracking
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 relative">
              {steps.map((st, idx) => (
                <div key={idx} className="flex flex-col items-center text-center">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs mb-2 transition-all ${
                      st.status === 'completed'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : st.status === 'current'
                        ? 'bg-indigo-600 text-white ring-4 ring-indigo-50 animate-pulse'
                        : 'bg-neutral-100 text-neutral-400'
                    }`}
                  >
                    {st.status === 'completed' ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      idx + 1
                    )}
                  </div>
                  <span
                    className={`text-xs font-semibold leading-tight ${
                      st.status === 'completed'
                        ? 'text-neutral-900'
                        : st.status === 'current'
                        ? 'text-indigo-600 font-bold'
                        : 'text-neutral-400'
                    }`}
                  >
                    {st.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="my-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700 flex items-center gap-2">
            <XCircle className="w-5 h-5 shrink-0" />
            <span>This order was cancelled. Advance refund or replacement inquiry can be submitted to customer support.</span>
          </div>
        )}

        {/* 2-Column Info: Delivery Address & Payment Proof */}
        <div className="py-6 grid grid-cols-1 md:grid-cols-2 gap-8 border-b border-neutral-100">
          {/* Destination */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-neutral-900 font-['Outfit',sans-serif]">
                Delivery Destination
              </h3>
            </div>
            <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200/60 text-xs space-y-1 text-neutral-600">
              <p className="font-bold text-neutral-900">{order.deliveryAddress?.fullName || order.customerName}</p>
              <p className="font-mono text-neutral-700">{order.deliveryAddress?.phone || order.deliveryAddress?.mobileNumber || order.customerMobile}</p>
              <p>{order.deliveryAddress?.fullAddress || order.deliveryAddress?.streetAddress}</p>
              {order.deliveryAddress?.upazilaThana && (
                <p>Upazila/Thana: {order.deliveryAddress.upazilaThana}</p>
              )}
              <p>
                {[
                  order.deliveryAddress?.district || order.deliveryAddress?.districtOrCity || order.deliveryAddress?.city,
                  order.deliveryAddress?.division || order.deliveryAddress?.state || order.deliveryAddress?.province,
                  order.country,
                ]
                  .filter(Boolean)
                  .join(', ')}
              </p>
            </div>
          </div>

          {/* Payment Proof Card */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-neutral-900 font-['Outfit',sans-serif]">
                Advance Verification Details
              </h3>
            </div>

            <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200/60 text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-neutral-500">Mode:</span>
                <span className="font-bold text-neutral-900 capitalize">
                  {order.isCod ? 'Cash on Delivery (Advance Delivery Fee)' : 'Prepaid (Full Online)'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-neutral-500">Channel / Method:</span>
                <span className="font-semibold text-neutral-800 uppercase">
                  {order.paymentProof?.method || order.selectedPaymentMethodId || order.paymentMethod}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-neutral-500">Sender Account:</span>
                <span className="font-mono font-bold text-neutral-900">
                  {order.paymentProof?.senderInfo || order.senderPhoneOrId || 'N/A'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-neutral-500">Transaction ID:</span>
                <span className="font-mono font-bold text-indigo-600">
                  {order.paymentProof?.transactionId || order.transactionId || 'N/A'}
                </span>
              </div>

              <div className="flex justify-between items-center pt-1 border-t border-neutral-200">
                <span className="text-neutral-500">Verification Status:</span>
                <span
                  className={`font-bold px-2 py-0.5 rounded-md ${
                    isVerified
                      ? 'bg-emerald-100 text-emerald-800'
                      : isRejected
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {isVerified ? 'Verified' : isRejected ? 'Rejected' : 'Pending Verification'}
                </span>
              </div>

              {screenshot && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowScreenshotModal(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>View Submitted Receipt</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Order Items Table */}
        <div className="py-6 border-b border-neutral-100">
          <h3 className="text-sm font-bold text-neutral-900 font-['Outfit',sans-serif] mb-4">
            Purchased Products ({order.items.length})
          </h3>

          <div className="divide-y divide-neutral-100">
            {order.items.map((item, idx) => {
              const price = item.unitPrice || item.price || 0;
              return (
                <div key={idx} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-12 h-12 object-cover rounded-xl border border-neutral-200 shrink-0"
                    />
                    <div>
                      <h4 className="text-xs sm:text-sm font-semibold text-neutral-900 line-clamp-1">
                        {item.name}
                      </h4>
                      {item.selectedVariants && Object.keys(item.selectedVariants).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {Object.entries(item.selectedVariants).map(([k, v]) => (
                            <span key={k} className="text-[10px] bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded-sm">
                              {k}: {v}
                            </span>
                          ))}
                        </div>
                      )}
                      <span className="text-[11px] text-neutral-400">
                        Qty: {item.quantity} × {currencySymbol}
                        {price.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-bold text-neutral-900 font-mono">
                      {currencySymbol}
                      {(price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Financial Summary */}
        <div className="pt-6 max-w-sm ml-auto space-y-2 text-xs">
          <div className="flex justify-between text-neutral-600">
            <span>Subtotal</span>
            <span className="font-semibold text-neutral-900">
              {currencySymbol}
              {productSubtotal.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between text-neutral-600">
            <span>Delivery Fee</span>
            <span className="font-semibold text-neutral-900">
              {currencySymbol}
              {order.deliveryCharge.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between text-neutral-600">
            <span>Taxes & Import Duty</span>
            <span className="font-semibold text-emerald-600">0.00 / Covered</span>
          </div>

          <div className="flex justify-between text-base font-bold text-neutral-900 pt-2 border-t border-neutral-100">
            <span>Total Order Value</span>
            <span>
              {currencySymbol}
              {order.totalAmount.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between text-xs font-bold text-indigo-700 bg-indigo-50/70 p-2.5 rounded-xl mt-2">
            <span>Advance Paid (Verification In Progress)</span>
            <span>
              {currencySymbol}
              {amountPaidOnline.toLocaleString()}
            </span>
          </div>

          {order.isCod && (
            <div className="flex justify-between text-xs font-bold text-emerald-700 px-2.5 py-1">
              <span>Remaining Due on Delivery (Cash)</span>
              <span>
                {currencySymbol}
                {remainingCod.toLocaleString()}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Screenshot Modal */}
      <AnimatePresence>
        {showScreenshotModal && screenshot && (
          <div className="fixed inset-0 bg-neutral-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative max-w-2xl w-full bg-white rounded-3xl p-4 shadow-2xl"
            >
              <button
                type="button"
                onClick={() => setShowScreenshotModal(false)}
                className="absolute top-4 right-4 p-2 rounded-full bg-neutral-100 text-neutral-600 hover:bg-neutral-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <h4 className="text-sm font-bold text-neutral-900 mb-3 px-2">
                Attached Payment Verification Receipt
              </h4>
              <div className="max-h-[75vh] overflow-auto rounded-2xl">
                <img
                  src={screenshot}
                  alt="Proof Screenshot"
                  className="w-full h-auto object-contain rounded-xl"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
