import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  CheckCircle2,
  Copy,
  Check,
  Package,
  Clock,
  FileText,
  ShieldCheck,
  AlertCircle,
  Truck,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Order } from '../types';
import { COUNTRY_CURRENCIES, formatPrice } from '../config/countries';

interface OrderConfirmationScreenProps {
  orderId: string;
  onNavigate: (route: string, param?: string) => void;
}

export function OrderConfirmationScreen({ orderId, onNavigate }: OrderConfirmationScreenProps) {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          setOrder(data.order);
        }
      } catch (err) {
        console.error('Failed to fetch order confirmation details:', err);
      } finally {
        setLoading(false);
      }
    };
    if (orderId) {
      fetchOrder();
    }
  }, [orderId, token]);

  const copyOrderId = () => {
    navigator.clipboard.writeText(orderId);
    setCopied(true);
    showToast('Order ID copied to clipboard', 'info');
    setTimeout(() => setCopied(false), 2000);
  };

  const currencySymbol = order
    ? COUNTRY_CURRENCIES[order.country]?.symbol || '৳'
    : '৳';

  // Mask sensitive phone number for privacy protection on confirmation screen
  const maskPhone = (phone?: string) => {
    if (!phone) return '';
    const clean = phone.trim();
    if (clean.length < 8) return clean;
    return clean.slice(0, 4) + ' •••• ' + clean.slice(-3);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.25 }}
        className="bg-white rounded-3xl p-6 sm:p-12 border border-neutral-200/80 shadow-lg"
      >
        {/* Verification in Progress Header Badge */}
        <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-5 border border-amber-200">
          <Clock className="w-8 h-8" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 font-['Outfit',sans-serif] mb-2">
          Order Submitted Successfully
        </h1>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold mb-6">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span>Payment Status: Pending Verification</span>
        </div>

        <p className="text-xs sm:text-sm text-neutral-600 max-w-lg mx-auto mb-6 leading-relaxed">
          Thank you for placing your order. We have recorded your booking and transaction details. Our verification team is currently validating your payment proof.
        </p>

        {/* Order Reference Box */}
        <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-neutral-50 border border-neutral-200/80 mb-8">
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Order ID:</span>
          <span className="text-sm font-mono font-bold text-neutral-900">{orderId}</span>
          <button
            type="button"
            onClick={copyOrderId}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/60 transition-colors cursor-pointer"
            title="Copy Order ID"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        {/* Status & Financial Details Card */}
        {order && (
          <div className="bg-neutral-50 rounded-2xl p-6 text-left border border-neutral-200/60 mb-8 space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-4 border-b border-neutral-200/60">
              <div>
                <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider block">
                  Payment Verification
                </span>
                <span className="text-sm font-bold text-amber-700">
                  {order.paymentStatus === 'verified'
                    ? 'Verified'
                    : order.paymentStatus === 'paid'
                    ? 'Payment Confirmed'
                    : 'Pending Verification'}
                </span>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider block">
                  Delivery Mode
                </span>
                <span className="text-xs font-bold text-indigo-700">
                  {order.isCod ? 'Cash on Delivery (Advance Delivery Charge)' : '100% Prepaid Online'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
              {/* Destination Summary */}
              <div>
                <span className="font-bold text-neutral-500 uppercase tracking-wider block mb-1.5">
                  Delivery Destination
                </span>
                <p className="font-bold text-neutral-900 text-sm">{order.customerName}</p>
                <p className="text-neutral-700 mt-1">
                  {[
                    order.deliveryAddress?.district || order.deliveryAddress?.districtOrCity || order.deliveryAddress?.city,
                    order.deliveryAddress?.division || order.deliveryAddress?.state || order.deliveryAddress?.province,
                    order.country,
                  ]
                    .filter(Boolean)
                    .join(', ')}
                </p>
                <p className="text-neutral-500 font-mono mt-1">
                  Recipient Contact: {maskPhone(order.customerMobile || order.deliveryAddress?.phone)}
                </p>
              </div>

              {/* Financial Breakdown */}
              <div>
                <span className="font-bold text-neutral-500 uppercase tracking-wider block mb-1.5">
                  Payment Breakdown
                </span>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-neutral-600">
                    <span>Order Subtotal:</span>
                    <span className="font-semibold text-neutral-900">
                      {currencySymbol}{order.productSubtotal.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-neutral-600">
                    <span>Delivery Fee:</span>
                    <span className="font-semibold text-neutral-900">
                      {currencySymbol}{order.deliveryCharge.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-neutral-900 pt-1 border-t border-neutral-200">
                    <span>Total Amount:</span>
                    <span>{currencySymbol}{order.totalAmount.toLocaleString()}</span>
                  </div>

                  <div className="mt-2 pt-2 border-t border-dashed border-neutral-300">
                    <div className="flex justify-between font-bold text-indigo-950">
                      <span>Online Paid (Pending Verification):</span>
                      <span>{currencySymbol}{order.amountPaidOnline.toLocaleString()}</span>
                    </div>
                    {order.isCod && (
                      <div className="flex justify-between font-bold text-emerald-700 text-xs mt-1">
                        <span>Due in Cash upon Delivery:</span>
                        <span>{currencySymbol}{order.remainingCodAmount.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Note banner */}
            <div className="pt-2 text-[11px] text-neutral-500 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Our manual verification team confirms payment IDs against merchant statements before package handover to the regional carrier.
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate('order-details', orderId)}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <Package className="w-4 h-4" />
            <span>Track Order & Delivery Status</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('my-orders')}
            className="w-full sm:w-auto px-6 py-3 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-neutral-800 font-bold text-xs transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>View All Orders</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('all-products')}
            className="w-full sm:w-auto px-6 py-3 rounded-xl text-neutral-600 hover:text-neutral-900 font-semibold text-xs cursor-pointer"
          >
            Continue Shopping
          </button>
        </div>
      </motion.div>
    </div>
  );
}
