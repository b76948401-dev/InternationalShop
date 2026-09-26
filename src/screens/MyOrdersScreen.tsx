import React, { useState, useEffect } from 'react';
import { Package, Search, Clock, CheckCircle2, XCircle, ChevronRight, FileText, ArrowLeft, Truck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Order, OrderStatus } from '../types';
import { EmptyState } from '../components/common/EmptyState';
import { COUNTRY_CURRENCIES } from '../config/countries';

interface MyOrdersScreenProps {
  onNavigate: (route: string, param?: string) => void;
}

export function MyOrdersScreen({ onNavigate }: MyOrdersScreenProps) {
  const { user, token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchOrders = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/orders', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const ct = res.headers.get('content-type');
        if (ct && ct.includes('application/json')) {
          const data = await res.json();
          setOrders(data.orders || []);
        }
      }
    } catch {
      // Graceful network error handling
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [token]);

  const filteredOrders = orders.filter((o) => {
    if (statusFilter !== 'all' && o.orderStatus.toLowerCase() !== statusFilter.toLowerCase()) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchesId = o.id.toLowerCase().includes(q);
      const matchesItem = o.items.some((i) => i.name.toLowerCase().includes(q));
      return matchesId || matchesItem;
    }
    return true;
  });

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'Delivered':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Cancelled':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Shipped':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Processing':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'Confirmed':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  if (!user) {
    return (
      <div className="max-w-lg mx-auto py-20 text-center">
        <p className="text-neutral-500 mb-4">Please log in to view your orders.</p>
        <button
          type="button"
          onClick={() => onNavigate('login')}
          className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm cursor-pointer"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <button
        type="button"
        onClick={() => onNavigate('my-account')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 mb-6 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to My Account</span>
      </button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-neutral-200/80 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-neutral-900 font-['Outfit',sans-serif]">
            My Orders
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Track shipments, inspect transaction verification, and view invoices
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
        {/* Status Pills */}
        <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-1">
          {['all', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                statusFilter.toLowerCase() === st.toLowerCase()
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Search Box */}
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Order ID or item..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-neutral-200 text-xs focus:border-indigo-600 outline-hidden"
          />
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Orders List */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-40 bg-white rounded-2xl border border-neutral-200 animate-pulse" />
          ))}
        </div>
      ) : filteredOrders.length > 0 ? (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const currencySymbol = COUNTRY_CURRENCIES[order.country]?.symbol || order.currencySymbol || '৳';
            const isVerified = order.paymentStatus === 'verified' || order.deliveryPaymentStatus === 'Verified';
            const isRejected = order.paymentStatus === 'failed' || order.deliveryPaymentStatus === 'Rejected';

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl p-5 sm:p-6 border border-neutral-200/80 shadow-xs hover:border-neutral-300 transition-all"
              >
                {/* Order Card Top Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-neutral-100">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-sm text-neutral-900">{order.id}</span>
                    <span className="text-neutral-300">•</span>
                    <span className="text-xs text-neutral-500">
                      {new Date(order.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full border ${getStatusBadge(
                        order.orderStatus
                      )}`}
                    >
                      {order.orderStatus}
                    </span>

                    <span
                      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-md ${
                        isVerified
                          ? 'bg-emerald-100 text-emerald-800'
                          : isRejected
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      Payment: {isVerified ? 'Verified' : isRejected ? 'Rejected' : 'Pending Verification'}
                    </span>
                  </div>
                </div>

                {/* Items Preview */}
                <div className="py-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  <div className="md:col-span-8 flex flex-wrap items-center gap-3">
                    {order.items.map((it, idx) => {
                      const price = it.unitPrice || it.price || 0;
                      return (
                        <div
                          key={idx}
                          className="flex items-center gap-2.5 bg-neutral-50 p-2 rounded-xl border border-neutral-100 max-w-xs"
                        >
                          <img
                            src={it.image}
                            alt={it.name}
                            className="w-10 h-10 object-cover rounded-lg shrink-0 border border-neutral-200"
                          />
                          <div className="min-w-0 pr-1">
                            <p className="text-xs font-semibold text-neutral-900 truncate">{it.name}</p>
                            <p className="text-[11px] text-neutral-400">
                              Qty: {it.quantity} • {currencySymbol}
                              {price.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Total & Payment Method */}
                  <div className="md:col-span-4 text-left md:text-right">
                    <span className="text-xs text-neutral-500 block">
                      {order.isCod ? 'Cash on Delivery (Advance Fee)' : 'Prepaid (Full Online)'}
                    </span>
                    <span className="text-xl font-black text-neutral-900 font-['Outfit',sans-serif]">
                      {currencySymbol}
                      {order.totalAmount.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
                  <span className="text-xs text-neutral-500">
                    Destination: <strong>{order.deliveryAddress?.district || order.deliveryAddress?.districtOrCity || order.deliveryAddress?.city}</strong>, {order.country}
                  </span>

                  <button
                    type="button"
                    onClick={() => onNavigate('order-details', order.id)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                  >
                    <span>Track & View Details</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Package}
          title="No Orders Found"
          description={
            searchQuery || statusFilter !== 'all'
              ? 'No orders match your filter criteria.'
              : 'You have not placed any orders yet. Explore our international catalog.'
          }
          actionText={!searchQuery && statusFilter === 'all' ? 'Discover Products' : undefined}
          onAction={() => onNavigate('all-products')}
        />
      )}
    </div>
  );
}
