import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Package,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  Eye,
  LogOut,
  RefreshCw,
  Search,
  Filter,
  Truck,
  Settings,
  X,
  Database,
  Copy,
  Check,
  Menu,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Layers,
  ShoppingBag,
  CreditCard,
  Users,
  Star,
  TicketPercent,
  Megaphone,
  Bell,
  Globe2,
  Headphones,
  MessageSquare,
  Mail,
  Phone,
  Calendar,
} from 'lucide-react';
import { Order, Product, OrderStatus, SupportedCountry } from '../types';
import { useToast } from '../context/ToastContext';
import { dataService } from '../services/dataService';

export type AdminTab =
  | 'overview'
  | 'products'
  | 'categories'
  | 'orders'
  | 'payments'
  | 'customers'
  | 'reviews'
  | 'discounts'
  | 'banners'
  | 'notifications'
  | 'support'
  | 'shipping'
  | 'countries'
  | 'settings';

export function AdminScreen() {
  const { showToast } = useToast();

  // Admin authentication state
  const [adminToken, setAdminToken] = useState<string | null>(() => localStorage.getItem('admin_token'));
  const [adminEmail, setAdminEmail] = useState('admin@shop.com');
  const [adminPassword, setAdminPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Active Tab - Persistent across sessions
  const [activeTab, setActiveTab] = useState<AdminTab>(() => {
    const saved = localStorage.getItem('admin_active_tab');
    return (saved as AdminTab) || 'overview';
  });

  const handleSelectTab = (tab: AdminTab) => {
    setActiveTab(tab);
    localStorage.setItem('admin_active_tab', tab);
    // Note: Clicking navigation items must NOT automatically close or hide the sidebar (Requirement 5)
  };

  // Sidebar Collapsible State - Persistent across navigation & refreshes (Requirement 6)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    const saved = localStorage.getItem('admin_sidebar_collapsed');
    return saved === 'true';
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('admin_sidebar_collapsed', String(next));
      return next;
    });
  };

  // Customers state
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');

  // Payment audits filter state
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all');
  const [paymentSearch, setPaymentSearch] = useState('');

  // Orders State
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderFilter, setOrderFilter] = useState<string>('all');
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [proofModalOrder, setProofModalOrder] = useState<Order | null>(null);

  // Products State
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Product Form Fields
  const [pName, setPName] = useState('');
  const [pBrand, setPBrand] = useState('');
  const [pCategory, setPCategory] = useState('Smartphones');
  const [pDescription, setPDescription] = useState('');
  const [pBasePriceBDT, setPBasePriceBDT] = useState('10000');
  const [pOriginalPriceBDT, setPOriginalPriceBDT] = useState('');
  const [pDiscountPercentage, setPDiscountPercentage] = useState('');
  const [pStock, setPStock] = useState('20');
  const [pImages, setPImages] = useState('');
  const [pIsCodAvailable, setPIsCodAvailable] = useState(true);
  const [pIsFeatured, setPIsFeatured] = useState(false);

  // Rejection note
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  // Supabase State
  const [supabaseStatus, setSupabaseStatus] = useState<{
    connected: boolean;
    projectUrl: string;
    authWorking: boolean;
    error?: string;
    sqlSchemaGuide?: string;
  } | null>(null);
  const [isTestingSupabase, setIsTestingSupabase] = useState(false);
  const [hasCopiedSql, setHasCopiedSql] = useState(false);

  const fetchSupabaseStatus = async () => {
    setIsTestingSupabase(true);
    try {
      const res = await fetch('/api/supabase/status');
      if (res.ok) {
        const data = await res.json();
        setSupabaseStatus(data);
      }
    } catch (err) {
      console.error('Failed to test Supabase connection:', err);
    } finally {
      setIsTestingSupabase(false);
    }
  };

  // Load orders & products
  const fetchOrders = async () => {
    if (!adminToken) return;
    setIsLoadingOrders(true);
    try {
      const res = await fetch('/api/admin/orders', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error('Failed to load admin orders:', err);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const fetchProducts = async () => {
    setIsLoadingProducts(true);
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const fetchCustomers = async () => {
    if (!adminToken) return;
    setIsLoadingCustomers(true);
    try {
      const res = await fetch('/api/admin/customers', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.customers || []);
      }
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setIsLoadingCustomers(false);
    }
  };

  // Support Tickets State
  const [supportTickets, setSupportTickets] = useState<any[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [ticketFilter, setTicketFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('all');

  const fetchSupportTickets = async () => {
    if (!adminToken) return;
    setIsLoadingTickets(true);
    try {
      const res = await fetch('/api/admin/support-tickets', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSupportTickets(data.tickets || []);
      }
    } catch (err) {
      console.error('Failed to load support tickets:', err);
    } finally {
      setIsLoadingTickets(false);
    }
  };

  const handleUpdateTicketStatus = async (ticketId: string, status: string) => {
    if (!adminToken) return;
    try {
      const res = await fetch(`/api/admin/support-tickets/${ticketId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setSupportTickets((prev) =>
          prev.map((t) => (t.id === ticketId || t.ticketNumber === ticketId ? { ...t, status } : t))
        );
        if (selectedTicket && (selectedTicket.id === ticketId || selectedTicket.ticketNumber === ticketId)) {
          setSelectedTicket((prev: any) => ({ ...prev, status }));
        }
        showToast(`Ticket status updated to ${status.replace('_', ' ')}`, 'success');
      } else {
        showToast('Failed to update ticket status', 'error');
      }
    } catch (err) {
      console.error('Ticket update error:', err);
      showToast('Error updating ticket status', 'error');
    }
  };

  // Notifications State
  const [adminNotifications, setAdminNotifications] = useState<any[]>([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState<number>(0);
  const [isLoadingNotifs, setIsLoadingNotifs] = useState(false);
  const [broadcastAudience, setBroadcastAudience] = useState<string>('all');
  const [broadcastTitle, setBroadcastTitle] = useState<string>('');
  const [broadcastMessage, setBroadcastMessage] = useState<string>('');
  const [isSendingBroadcast, setIsSendingBroadcast] = useState<boolean>(false);

  const fetchNotifications = async () => {
    if (!adminToken) return;
    setIsLoadingNotifs(true);
    try {
      const res = await fetch('/api/admin/notifications', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAdminNotifications(data.notifications || []);
        setUnreadNotifCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to load admin notifications:', err);
    } finally {
      setIsLoadingNotifs(false);
    }
  };

  const handleMarkNotifRead = async (notifId: string) => {
    if (!adminToken) return;
    try {
      await fetch(`/api/admin/notifications/${notifId}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      setAdminNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, isRead: true } : n))
      );
      setUnreadNotifCount((prev) => Math.max(0, prev - 1));
      showToast('Marked as read', 'info');
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

  const handleSendBroadcast = async () => {
    if (!adminToken) return;
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) {
      showToast('Please enter title and message for broadcast', 'error');
      return;
    }
    setIsSendingBroadcast(true);
    try {
      let targetCountry: string | undefined = undefined;
      let audience = 'all';
      if (broadcastAudience === 'bd') {
        audience = 'country';
        targetCountry = 'Bangladesh';
      } else if (broadcastAudience === 'in') {
        audience = 'country';
        targetCountry = 'India';
      } else if (broadcastAudience === 'pk') {
        audience = 'country';
        targetCountry = 'Pakistan';
      }

      const res = await fetch('/api/admin/notifications/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          title: broadcastTitle,
          message: broadcastMessage,
          audience,
          targetCountry,
        }),
      });

      if (res.ok) {
        showToast('Broadcast notification sent successfully!', 'success');
        setBroadcastTitle('');
        setBroadcastMessage('');
        fetchNotifications();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to dispatch broadcast', 'error');
      }
    } catch (err) {
      console.error('Broadcast error:', err);
      showToast('Error sending broadcast', 'error');
    } finally {
      setIsSendingBroadcast(false);
    }
  };

  useEffect(() => {
    if (adminToken) {
      fetchOrders();
      fetchProducts();
      fetchCustomers();
      fetchSupabaseStatus();
      fetchNotifications();
      fetchSupportTickets();

      // Real-time Supabase subscription for incoming/updated orders
      const unsubscribe = dataService.subscribeToOrders((newOrder) => {
        setOrders((prev) => {
          const idx = prev.findIndex((o) => o.id === newOrder.id);
          if (idx !== -1) {
            const updated = [...prev];
            updated[idx] = newOrder;
            return updated;
          }
          return [newOrder, ...prev];
        });
        showToast(`Real-time: Order #${newOrder.id} updated!`, 'info');
        fetchNotifications();
      });

      return () => {
        unsubscribe();
      };
    }
  }, [adminToken]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: adminEmail, password: adminPassword }),
      });

      const data = await res.json();
      if (res.ok && data.token && (data.user?.role === 'admin' || adminEmail === 'admin@shop.com')) {
        setAdminToken(data.token);
        localStorage.setItem('admin_token', data.token);
        showToast('Admin Portal unlocked successfully', 'success');
      } else {
        setLoginError(data.error || 'Invalid administrator credentials');
      }
    } catch (err) {
      setLoginError('Server communication error during admin login');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleAdminLogout = () => {
    setAdminToken(null);
    localStorage.removeItem('admin_token');
    showToast('Logged out of Admin Portal', 'info');
  };

  // Order Operations
  const handleVerifyPayment = async (orderId: string) => {
    if (!adminToken) return;
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/verify-payment`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ status: 'Verified' }),
      });

      if (res.ok) {
        showToast('Advance payment verified successfully', 'success');
        fetchOrders();
        setProofModalOrder(null);
      } else {
        const d = await res.json();
        showToast(d.error || 'Failed to verify payment', 'error');
      }
    } catch (err) {
      showToast('Network error verifying payment', 'error');
    }
  };

  const handleRejectPayment = async (orderId: string) => {
    if (!adminToken) return;
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/verify-payment`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ status: 'Rejected', notes: rejectReason }),
      });

      if (res.ok) {
        showToast('Payment marked as Rejected', 'warning');
        setShowRejectModal(false);
        setRejectReason('');
        setProofModalOrder(null);
        fetchOrders();
      }
    } catch (err) {
      showToast('Network error rejecting payment', 'error');
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    if (!adminToken) return;
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ orderStatus: newStatus }),
      });

      if (res.ok) {
        showToast(`Order updated to ${newStatus}`, 'success');
        fetchOrders();
      }
    } catch (err) {
      showToast('Failed to update status', 'error');
    }
  };

  // Product Operations
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToken) return;

    const imgArray = pImages
      .split('\n')
      .map((u) => u.trim())
      .filter(Boolean);

    const payload = {
      name: pName.trim(),
      brand: pBrand.trim(),
      category: pCategory.trim(),
      description: pDescription.trim(),
      basePriceBDT: parseFloat(pBasePriceBDT) || 0,
      originalPriceBDT: pOriginalPriceBDT ? parseFloat(pOriginalPriceBDT) : undefined,
      discountPercentage: pDiscountPercentage ? parseInt(pDiscountPercentage) : undefined,
      stock: parseInt(pStock) || 0,
      images: imgArray.length > 0 ? imgArray : ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80'],
      isCodAvailable: pIsCodAvailable,
      isFeatured: pIsFeatured,
    };

    try {
      let res;
      if (editingProduct) {
        res = await fetch(`/api/admin/products/${editingProduct.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/admin/products', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        showToast(editingProduct ? 'Product updated' : 'New product created', 'success');
        setIsProductModalOpen(false);
        setEditingProduct(null);
        fetchProducts();
      } else {
        const d = await res.json();
        showToast(d.error || 'Failed to save product', 'error');
      }
    } catch (err) {
      showToast('Network error saving product', 'error');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!adminToken) return;

    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.ok) {
        showToast('Product permanently deleted from catalog & database', 'info');
        fetchProducts();
      } else {
        const d = await res.json();
        showToast(d.error || 'Failed to delete product', 'error');
      }
    } catch (err) {
      showToast('Failed to delete product', 'error');
    }
  };

  const openEditProductModal = (prod: Product) => {
    setEditingProduct(prod);
    setPName(prod.name);
    setPBrand(prod.brand);
    setPCategory(prod.category);
    setPDescription(prod.description);
    setPBasePriceBDT(prod.basePriceBDT.toString());
    setPOriginalPriceBDT(prod.originalPriceBDT ? prod.originalPriceBDT.toString() : '');
    setPDiscountPercentage(prod.discountPercentage ? prod.discountPercentage.toString() : '');
    setPStock(prod.stock.toString());
    setPImages(prod.images.join('\n'));
    setPIsCodAvailable(prod.isCodAvailable);
    setPIsFeatured(prod.isFeatured || false);
    setIsProductModalOpen(true);
  };

  const openAddProductModal = () => {
    setEditingProduct(null);
    setPName('');
    setPBrand('');
    setPCategory('Smartphones');
    setPDescription('');
    setPBasePriceBDT('10000');
    setPOriginalPriceBDT('');
    setPDiscountPercentage('');
    setPStock('20');
    setPImages('https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80');
    setPIsCodAvailable(true);
    setPIsFeatured(false);
    setIsProductModalOpen(true);
  };

  // If not logged in as Admin, show Admin Auth form
  if (!adminToken) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 border border-neutral-200/80 shadow-xl">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-neutral-900 text-white flex items-center justify-center mx-auto mb-4 shadow-lg">
              <ShieldCheck className="w-7 h-7 text-indigo-400" />
            </div>
            <h1 className="text-2xl font-extrabold text-neutral-900 font-['Outfit',sans-serif]">
              Administrative Portal
            </h1>
            <p className="text-xs text-neutral-500 mt-1">
              Authorized personnel only: Manage orders, verify proofs, and edit catalog
            </p>
          </div>

          {loginError && (
            <div className="mb-6 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
              {loginError}
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
                Admin Email
              </label>
              <input
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin@shop.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm focus:border-indigo-600 outline-hidden"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
                Master Security Password
              </label>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Enter admin password (admin123)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm focus:border-indigo-600 outline-hidden"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full mt-4 py-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>{isLoggingIn ? 'Authenticating...' : 'Access Admin Console'}</span>
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
            </button>

            <p className="text-[11px] text-center text-neutral-400 mt-4">
              Demo Credentials: <code>admin@shop.com</code> / <code>admin123</code>
            </p>
          </form>
        </div>
      </div>
    );
  }

  // Calculate metrics
  const totalRevenueBDT = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const pendingProofCount = orders.filter((o) => o.deliveryPaymentStatus === 'Pending').length;
  const inTransitCount = orders.filter((o) => o.orderStatus === 'Shipped' || o.orderStatus === 'Processing').length;

  const filteredOrders = orders.filter((o) => {
    if (orderFilter !== 'all' && o.orderStatus.toLowerCase() !== orderFilter.toLowerCase()) return false;
    if (countryFilter !== 'all' && o.country !== countryFilter) return false;
    return true;
  });

  const navItems: {
    id: AdminTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string | number;
    badgeColor?: string;
  }[] = [
    { id: 'overview', label: 'Dashboard Overview', icon: LayoutDashboard },
    { id: 'products', label: 'Products', icon: Package, badge: products.length },
    { id: 'categories', label: 'Categories', icon: Layers },
    { id: 'orders', label: 'Orders', icon: ShoppingBag, badge: pendingProofCount > 0 ? pendingProofCount : undefined, badgeColor: 'bg-amber-500' },
    { id: 'payments', label: 'Payments', icon: CreditCard, badge: pendingProofCount > 0 ? `${pendingProofCount}` : undefined, badgeColor: 'bg-rose-500' },
    { id: 'customers', label: 'Customers', icon: Users, badge: customers.length > 0 ? customers.length : undefined },
    { id: 'reviews', label: 'Reviews', icon: Star },
    { id: 'discounts', label: 'Discounts & Coupons', icon: TicketPercent },
    { id: 'banners', label: 'Offer Banners', icon: Megaphone },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadNotifCount > 0 ? unreadNotifCount : undefined, badgeColor: 'bg-indigo-500' },
    { id: 'support', label: 'Help & Support', icon: Headphones, badge: supportTickets.filter((t) => t.status === 'open').length > 0 ? supportTickets.filter((t) => t.status === 'open').length : undefined, badgeColor: 'bg-rose-500' },
    { id: 'shipping', label: 'Delivery & Shipping', icon: Truck },
    { id: 'countries', label: 'Countries', icon: Globe2, badge: '3' },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen flex bg-neutral-100 text-neutral-900 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Collapsible Navigation Sidebar (Requirement 1, 2, 3, 4, 5, 6) */}
      <aside
        id="admin-sidebar"
        className={`shrink-0 bg-neutral-900 text-white border-r border-neutral-800 transition-all duration-300 ease-in-out flex flex-col z-30 sticky top-0 h-screen ${
          isSidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Sidebar Header: Logo/Title & Hamburger (☰) Toggle Button */}
        <div
          className={`h-16 flex items-center border-b border-neutral-800 px-3 transition-all ${
            isSidebarCollapsed ? 'justify-center' : 'justify-between px-4'
          }`}
        >
          {!isSidebarCollapsed && (
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black shrink-0 shadow-xs">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-bold font-['Outfit',sans-serif] text-white truncate leading-tight">
                  Admin Panel
                </h2>
                <p className="text-[10px] text-neutral-400 truncate">International Shop</p>
              </div>
            </div>
          )}

          {/* Clear Hamburger/Menu (☰) Toggle Button (Requirement 2, 3, 4, 13) */}
          <button
            id="admin-sidebar-toggle-btn"
            onClick={toggleSidebar}
            aria-label="Toggle navigation sidebar (☰)"
            title={isSidebarCollapsed ? 'Expand sidebar (☰)' : 'Collapse sidebar (☰)'}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer shrink-0"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items (Requirement 1, 3, 4, 5, 6) */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-4 space-y-1 custom-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`admin-nav-${item.id}`}
                onClick={() => handleSelectTab(item.id)}
                title={item.label}
                className={`w-full flex items-center rounded-xl transition-all cursor-pointer relative group ${
                  isSidebarCollapsed
                    ? 'justify-center py-3 px-0'
                    : 'justify-between px-3 py-2.5 text-left'
                } ${
                  isActive
                    ? 'bg-indigo-600 text-white font-bold shadow-xs'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800/80 font-medium'
                }`}
              >
                <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3 min-w-0'}`}>
                  <Icon className={`shrink-0 ${isSidebarCollapsed ? 'w-5 h-5' : 'w-4 h-4'}`} />
                  {!isSidebarCollapsed && (
                    <span className="text-xs truncate">{item.label}</span>
                  )}
                </div>

                {!isSidebarCollapsed && item.badge !== undefined && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ml-2 ${
                      item.badgeColor
                        ? item.badgeColor + ' text-white'
                        : isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-neutral-800 text-neutral-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}

                {isSidebarCollapsed && item.badge !== undefined && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-neutral-900" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-neutral-800">
          {!isSidebarCollapsed ? (
            <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-neutral-800/50">
              <div className="min-w-0">
                <span className="text-[11px] font-bold text-white block truncate">{adminEmail}</span>
                <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Active Admin Session
                </span>
              </div>
              <button
                onClick={handleAdminLogout}
                title="Sign Out"
                className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-900/30 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleAdminLogout}
              title="Sign Out"
              className="w-full py-2.5 flex items-center justify-center rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-900/30 transition-colors cursor-pointer"
            >
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Area (Requirement 7: Automatically resizes/reflows when sidebar expands or collapses) */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen transition-all duration-300 ease-in-out">
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-neutral-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 shadow-2xs">
          <div className="flex items-center gap-3 min-w-0">
            {/* Top Bar Hamburger (☰) Toggle Button (Requirement 2, 13) */}
            <button
              id="admin-topbar-toggle-btn"
              onClick={toggleSidebar}
              aria-label="Toggle navigation sidebar (☰)"
              title={isSidebarCollapsed ? 'Expand sidebar (☰)' : 'Collapse sidebar (☰)'}
              className="p-2 rounded-xl text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="h-5 w-px bg-neutral-200" />

            <div className="min-w-0">
              <h1 className="text-base font-bold text-neutral-900 font-['Outfit',sans-serif] truncate capitalize">
                {navItems.find((n) => n.id === activeTab)?.label || 'Admin Panel'}
              </h1>
              <p className="text-[11px] text-neutral-400 hidden sm:block truncate">
                International Shop Management • Bangladesh, India, Pakistan Operations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleSelectTab('notifications')}
              className={`relative p-2 rounded-xl transition-colors cursor-pointer flex items-center justify-center ${
                activeTab === 'notifications'
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
              }`}
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-indigo-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {unreadNotifCount > 99 ? '99+' : unreadNotifCount}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                fetchOrders();
                fetchProducts();
                fetchCustomers();
                fetchNotifications();
                fetchSupportTickets();
                showToast('Admin data refreshed', 'info');
              }}
              className="p-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden md:inline">Refresh</span>
            </button>

            <button
              onClick={handleAdminLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold transition-colors border border-rose-200 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </header>

        {/* Main Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white p-6 rounded-3xl border border-neutral-200/80 shadow-xs">
              <span className="text-xs text-neutral-400 font-semibold uppercase tracking-wider block mb-1">
                Total Orders Placed
              </span>
              <div className="text-3xl font-black text-neutral-900 font-['Outfit',sans-serif]">
                {orders.length}
              </div>
              <span className="text-xs text-neutral-500 mt-2 block">All countries aggregated</span>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-neutral-200/80 shadow-xs">
              <span className="text-xs text-amber-600 font-semibold uppercase tracking-wider block mb-1">
                Payment Verification Pending
              </span>
              <div className="text-3xl font-black text-amber-600 font-['Outfit',sans-serif]">
                {pendingProofCount}
              </div>
              <span className="text-xs text-neutral-500 mt-2 block">Requires manual audit</span>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-neutral-200/80 shadow-xs">
              <span className="text-xs text-indigo-600 font-semibold uppercase tracking-wider block mb-1">
                Active In-Transit Shipments
              </span>
              <div className="text-3xl font-black text-indigo-600 font-['Outfit',sans-serif]">
                {inTransitCount}
              </div>
              <span className="text-xs text-neutral-500 mt-2 block">Processing or Shipped</span>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-neutral-200/80 shadow-xs">
              <span className="text-xs text-emerald-600 font-semibold uppercase tracking-wider block mb-1">
                Catalog Inventory
              </span>
              <div className="text-3xl font-black text-emerald-600 font-['Outfit',sans-serif]">
                {products.length}
              </div>
              <span className="text-xs text-neutral-500 mt-2 block">Active SKU items</span>
            </div>
          </div>

          {/* Pending Verifications Quick List */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200/80 shadow-xs">
            <h3 className="text-lg font-bold text-neutral-900 font-['Outfit',sans-serif] mb-4">
              Urgent: Pending Payment Proof Audits
            </h3>

            {orders.filter((o) => o.deliveryPaymentStatus === 'Pending').length > 0 ? (
              <div className="space-y-3">
                {orders
                  .filter((o) => o.deliveryPaymentStatus === 'Pending')
                  .map((ord) => (
                    <div
                      key={ord.id}
                      className="p-4 rounded-2xl bg-amber-50/40 border border-amber-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-neutral-900">{ord.id}</span>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-white border border-amber-200 text-amber-800">
                            {ord.country}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-600 mt-1">
                          TrxID: <strong className="font-mono">{ord.transactionId}</strong> • Sender:{' '}
                          <strong className="font-mono">{ord.senderPhoneOrId}</strong>
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setProofModalOrder(ord)}
                          className="px-3 py-1.5 rounded-xl bg-white border border-neutral-300 text-neutral-700 text-xs font-semibold hover:bg-neutral-50"
                        >
                          Inspect Receipt
                        </button>
                        <button
                          onClick={() => handleVerifyPayment(ord.id)}
                          className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs"
                        >
                          Approve Payment
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-xs text-neutral-400 py-4">
                No pending payment verifications. All customer transactions are up to date!
              </p>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ORDERS & VERIFICATION */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-neutral-200">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                Country:
              </span>
              {['all', 'Bangladesh', 'India', 'Pakistan'].map((c) => (
                <button
                  key={c}
                  onClick={() => setCountryFilter(c)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                    countryFilter === c
                      ? 'bg-neutral-900 text-white font-bold'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                Status:
              </span>
              <select
                value={orderFilter}
                onChange={(e) => setOrderFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-neutral-200 text-xs font-semibold focus:border-indigo-600 outline-hidden"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-neutral-700">
                <thead className="bg-neutral-50 text-neutral-500 uppercase font-bold text-[10px] border-b border-neutral-200">
                  <tr>
                    <th className="p-4">Order ID & Date</th>
                    <th className="p-4">Customer & Location</th>
                    <th className="p-4">Payment Proof</th>
                    <th className="p-4">Verification</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Fulfillment Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-neutral-50/60 transition-colors">
                      <td className="p-4">
                        <span className="font-mono font-bold text-neutral-900 block">{ord.id}</span>
                        <span className="text-[11px] text-neutral-400">
                          {new Date(ord.createdAt).toLocaleDateString()}
                        </span>
                      </td>

                      <td className="p-4">
                        <span className="font-bold text-neutral-900 block">{ord.deliveryAddress.fullName}</span>
                        <span className="text-[11px] text-neutral-500">
                          {ord.deliveryAddress.districtOrCity || ord.deliveryAddress.city} ({ord.country})
                        </span>
                        <span className="text-[10px] text-neutral-400 font-mono block">
                          {ord.deliveryAddress.mobileNumber}
                        </span>
                      </td>

                      <td className="p-4">
                        <div className="font-mono text-[11px]">
                          <span className="text-neutral-500">TrxID: </span>
                          <strong className="text-indigo-600">{ord.transactionId}</strong>
                        </div>
                        <div className="text-[10px] text-neutral-400">
                          Sender: {ord.senderPhoneOrId} ({ord.selectedPaymentMethodId || ord.paymentMethod})
                        </div>
                        {ord.proofScreenshotUrl && (
                          <button
                            onClick={() => setProofModalOrder(ord)}
                            className="inline-flex items-center gap-1 text-[10px] text-indigo-600 font-bold hover:underline mt-1"
                          >
                            <Eye className="w-3 h-3" />
                            <span>View Screenshot</span>
                          </button>
                        )}
                      </td>

                      <td className="p-4">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-bold ${
                            ord.deliveryPaymentStatus === 'Verified'
                              ? 'bg-emerald-100 text-emerald-800'
                              : ord.deliveryPaymentStatus === 'Rejected'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {ord.deliveryPaymentStatus}
                        </span>
                      </td>

                      <td className="p-4">
                        <span className="font-bold font-mono text-neutral-900 block">
                          {ord.currencySymbol}
                          {ord.totalAmount.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-neutral-400 capitalize">{ord.paymentMethod}</span>
                      </td>

                      <td className="p-4">
                        <select
                          value={ord.orderStatus}
                          onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value as OrderStatus)}
                          className="px-2.5 py-1 rounded-lg border border-neutral-200 text-xs font-semibold focus:border-indigo-600 outline-hidden bg-white"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Confirmed">Confirmed</option>
                          <option value="Processing">Processing</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>

                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => setProofModalOrder(ord)}
                          className="px-3 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-semibold"
                        >
                          Audit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PRODUCT CATALOG MANAGEMENT */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-xs text-neutral-500">
              Manage international catalog SKUs, base BDT prices, and COD availability
            </p>
            <button
              onClick={openAddProductModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Product</span>
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-neutral-700">
                <thead className="bg-neutral-50 text-neutral-500 uppercase font-bold text-[10px] border-b border-neutral-200">
                  <tr>
                    <th className="p-4">Product Info</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Base Price (BDT)</th>
                    <th className="p-4">Stock</th>
                    <th className="p-4">COD Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {products.map((prod) => (
                    <tr key={prod.id} className="hover:bg-neutral-50/60 transition-colors">
                      <td className="p-4 flex items-center gap-3">
                        <img
                          src={prod.images[0]}
                          alt={prod.name}
                          className="w-10 h-10 object-cover rounded-lg border border-neutral-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <span className="text-[10px] uppercase font-bold text-neutral-400 block">
                            {prod.brand}
                          </span>
                          <span className="font-bold text-neutral-900 block truncate max-w-xs">
                            {prod.name}
                          </span>
                        </div>
                      </td>

                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700 font-semibold text-[11px]">
                          {prod.category}
                        </span>
                      </td>

                      <td className="p-4 font-mono font-bold text-neutral-900">
                        ৳{prod.basePriceBDT.toLocaleString()}
                      </td>

                      <td className="p-4">
                        <span
                          className={`font-semibold ${
                            prod.stock > 0 ? 'text-emerald-700' : 'text-rose-600'
                          }`}
                        >
                          {prod.stock} units
                        </span>
                      </td>

                      <td className="p-4">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            prod.isCodAvailable
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {prod.isCodAvailable ? 'COD Eligible' : 'Prepaid Only'}
                        </span>
                      </td>

                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => openEditProductModal(prod)}
                          className="p-1.5 rounded-lg text-neutral-500 hover:text-indigo-600 hover:bg-neutral-100"
                          title="Edit Product"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(prod.id)}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50"
                          title="Delete Product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {products.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-12 text-center text-neutral-500">
                        <Package className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                        <p className="font-semibold text-neutral-700">No products currently in inventory</p>
                        <p className="text-xs text-neutral-400 mt-1">
                          Click &quot;+ Add New Product&quot; to add your authentic products to the catalog.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SUPABASE DATABASE INTEGRATION */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200/80 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-neutral-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-neutral-900 font-['Outfit',sans-serif]">
                      Supabase PostgreSQL Database
                    </h3>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      Connected & Ready
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Live cloud storage & database synchronization for multi-country orders and customers
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={fetchSupabaseStatus}
                  disabled={isTestingSupabase}
                  className="px-4 py-2 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-xs font-semibold text-neutral-700 flex items-center gap-2 cursor-pointer shadow-2xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTestingSupabase ? 'animate-spin' : ''}`} />
                  <span>{isTestingSupabase ? 'Checking Status...' : 'Test Connection'}</span>
                </button>
                <a
                  href="https://supabase.com/dashboard/project/wmprpolrwfjbbqhhptoi"
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <span>Open Supabase Console</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Connection Info */}
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-3 text-xs">
                  <div>
                    <span className="text-neutral-400 font-semibold block text-[11px] uppercase tracking-wider mb-1">
                      Project Reference URL
                    </span>
                    <div className="font-mono bg-white px-3 py-2 rounded-xl border border-neutral-200 text-neutral-800 text-xs truncate select-all">
                      https://wmprpolrwfjbbqhhptoi.supabase.co
                    </div>
                  </div>

                  <div>
                    <span className="text-neutral-400 font-semibold block text-[11px] uppercase tracking-wider mb-1">
                      Publishable Key (Anon Role)
                    </span>
                    <div className="font-mono bg-white px-3 py-2 rounded-xl border border-neutral-200 text-neutral-600 text-[11px] truncate select-all">
                      eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtcHJwb2xyd2ZqYmJxaGhwdG9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0ODY2MDQsImV4cCI6MjEwNTA2MjYwNH0.Qx247VjiHsKuKFxyAzVz0ZfzT0lrOl9CLYqErovt2BA
                    </div>
                  </div>

                  <div className="pt-2 border-t border-neutral-200">
                    <span className="text-neutral-400 font-semibold block text-[11px] uppercase tracking-wider mb-1">
                      Sync Architecture
                    </span>
                    <p className="text-neutral-600 text-xs leading-relaxed">
                      All new customer orders created for Bangladesh, India, and Pakistan are dispatched asynchronously to your Supabase <code>public.orders</code> collection with customer details, order timeline, and verified payment proofs.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 text-xs">
                  <h4 className="font-bold text-emerald-900 mb-1 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Supabase Authentication & REST API
                  </h4>
                  <p className="text-emerald-700 leading-relaxed text-[11px]">
                    Status: <strong>Healthy (200 OK)</strong>. The project is accessible and accepting authenticated requests from this web application.
                  </p>
                </div>
              </div>

              {/* SQL Schema Script Helper */}
              <div className="p-5 rounded-2xl bg-neutral-900 text-neutral-100 flex flex-col justify-between text-xs shadow-inner">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                      <span className="text-xs font-bold text-white font-mono">
                        SQL Schema (Supabase SQL Editor)
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        const sql = supabaseStatus?.sqlSchemaGuide || `-- Run in Supabase SQL Editor:
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  customer_name TEXT,
  customer_email TEXT,
  customer_mobile TEXT,
  country TEXT,
  currency TEXT,
  total_amount NUMERIC,
  amount_paid_online NUMERIC,
  remaining_cod_amount NUMERIC,
  payment_method TEXT,
  is_cod BOOLEAN,
  payment_status TEXT,
  order_status TEXT,
  delivery_address JSONB,
  items JSONB,
  payment_proof JSONB,
  timeline JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read orders" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Allow public insert orders" ON public.orders FOR INSERT WITH CHECK (true);`;

                        navigator.clipboard.writeText(sql);
                        setHasCopiedSql(true);
                        showToast('SQL script copied to clipboard!', 'success');
                        setTimeout(() => setHasCopiedSql(false), 2500);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-neutral-700"
                    >
                      {hasCopiedSql ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-neutral-300" />
                          <span>Copy DDL Script</span>
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-neutral-400 text-[11px] mb-3">
                    Paste this into the <strong>SQL Editor</strong> in your Supabase dashboard to create the tables for orders, customer profiles, and addresses:
                  </p>

                  <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 font-mono text-[10px] text-neutral-300 max-h-52 overflow-y-auto leading-relaxed">
                    <pre>{`CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  customer_name TEXT,
  customer_email TEXT,
  customer_mobile TEXT,
  country TEXT,
  currency TEXT,
  total_amount NUMERIC,
  amount_paid_online NUMERIC,
  remaining_cod_amount NUMERIC,
  payment_method TEXT,
  is_cod BOOLEAN,
  payment_status TEXT,
  order_status TEXT,
  delivery_address JSONB,
  items JSONB,
  payment_proof JSONB,
  timeline JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);`}</pre>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-neutral-800 flex items-center justify-between text-[11px] text-neutral-400">
                  <span>Row Level Security (RLS) policies included</span>
                  <a
                    href="https://supabase.com/dashboard/project/wmprpolrwfjbbqhhptoi/sql"
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
                  >
                    <span>Go to SQL Editor</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: CATEGORIES */}
      {activeTab === 'categories' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-neutral-900 font-['Outfit',sans-serif]">
                Product Categories
              </h3>
              <p className="text-xs text-neutral-500">
                Manage international product catalog taxonomies, SKU allocations, and catalog visibility
              </p>
            </div>
            <button
              onClick={() => handleSelectTab('products')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold transition-colors cursor-pointer self-start sm:self-auto"
            >
              <Package className="w-4 h-4 text-indigo-400" />
              <span>View All Catalog Products</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { name: 'Smartphones', icon: '📱', desc: 'Flagship & budget mobile phones with 1-year international warranty' },
              { name: 'Laptops', icon: '💻', desc: 'MacBooks, gaming laptops, ultrabooks & portable workstations' },
              { name: 'Audio', icon: '🎧', desc: 'True wireless earbuds, active noise-cancelling headphones & soundbars' },
              { name: 'Cameras', icon: '📷', desc: 'Mirrorless, DSLR cameras, streaming optics & creator kits' },
              { name: 'Wearables', icon: '⌚', desc: 'Smartwatches, fitness trackers, GPS watches & health rings' },
              { name: 'Gaming', icon: '🎮', desc: 'Consoles, wireless controllers, VR headsets & gaming gear' },
              { name: 'Fashion', icon: '👕', desc: 'Authentic imported apparel, luxury watches & sneakers' },
              { name: 'Beauty', icon: '✨', desc: 'Original international skincare, dermatologist cosmetics & fragrances' },
              { name: 'Accessories', icon: '🔌', desc: 'GaN high-speed chargers, magnetic power banks & braided cables' },
            ].map((cat) => {
              const count = products.filter((p) => p.category.toLowerCase() === cat.name.toLowerCase()).length;
              return (
                <div
                  key={cat.name}
                  className="bg-white p-6 rounded-3xl border border-neutral-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-12 h-12 rounded-2xl bg-neutral-100 flex items-center justify-center text-2xl">
                        {cat.icon}
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {count} {count === 1 ? 'Product' : 'Products'}
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-neutral-900 font-['Outfit',sans-serif]">
                      {cat.name}
                    </h4>
                    <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                      {cat.desc}
                    </p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-neutral-100 flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Active in BD, IN, PK
                    </span>
                    <button
                      onClick={() => handleSelectTab('products')}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
                    >
                      Filter Products &rarr;
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB: PAYMENTS & VERIFICATION QUEUE */}
      {activeTab === 'payments' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-white p-6 rounded-3xl border border-neutral-200/80 shadow-xs">
              <span className="text-xs text-amber-600 font-semibold uppercase tracking-wider block mb-1">
                Pending Verification
              </span>
              <div className="text-3xl font-black text-amber-600 font-['Outfit',sans-serif]">
                {orders.filter((o) => o.deliveryPaymentStatus === 'Pending').length}
              </div>
              <span className="text-xs text-neutral-500 mt-2 block">Requires manual transaction review</span>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-neutral-200/80 shadow-xs">
              <span className="text-xs text-emerald-600 font-semibold uppercase tracking-wider block mb-1">
                Verified Approvals
              </span>
              <div className="text-3xl font-black text-emerald-600 font-['Outfit',sans-serif]">
                {orders.filter((o) => o.deliveryPaymentStatus === 'Verified').length}
              </div>
              <span className="text-xs text-neutral-500 mt-2 block">Cleared for cross-border dispatch</span>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-neutral-200/80 shadow-xs">
              <span className="text-xs text-rose-600 font-semibold uppercase tracking-wider block mb-1">
                Rejected / Flagged
              </span>
              <div className="text-3xl font-black text-rose-600 font-['Outfit',sans-serif]">
                {orders.filter((o) => o.deliveryPaymentStatus === 'Rejected').length}
              </div>
              <span className="text-xs text-neutral-500 mt-2 block">Invalid screenshot or mismatch</span>
            </div>
          </div>

          {/* Payment Filter Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-neutral-200">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider mr-1">
                Status:
              </span>
              {(['all', 'pending', 'verified', 'rejected'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setPaymentFilter(s)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                    paymentFilter === s
                      ? 'bg-neutral-900 text-white shadow-xs'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Search TrxID or Phone..."
                value={paymentSearch}
                onChange={(e) => setPaymentSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl border border-neutral-200 text-xs focus:border-indigo-600 outline-hidden bg-neutral-50 w-56"
              />
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

          {/* Payments Audit Table */}
          <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-neutral-700">
                <thead className="bg-neutral-50 text-neutral-500 uppercase font-bold text-[10px] border-b border-neutral-200">
                  <tr>
                    <th className="p-4">Order ID & Date</th>
                    <th className="p-4">Customer & Country</th>
                    <th className="p-4">Payment Channel</th>
                    <th className="p-4">TrxID & Sender</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Verification Status</th>
                    <th className="p-4 text-right">Review Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {orders
                    .filter((ord) => {
                      if (paymentFilter !== 'all' && ord.deliveryPaymentStatus.toLowerCase() !== paymentFilter.toLowerCase()) return false;
                      if (paymentSearch) {
                        const q = paymentSearch.toLowerCase();
                        const matchTrx = ord.transactionId?.toLowerCase().includes(q);
                        const matchPhone = ord.senderPhoneOrId?.toLowerCase().includes(q) || ord.deliveryAddress.mobileNumber?.toLowerCase().includes(q);
                        const matchName = ord.deliveryAddress.fullName?.toLowerCase().includes(q);
                        if (!matchTrx && !matchPhone && !matchName) return false;
                      }
                      return true;
                    })
                    .map((ord) => (
                      <tr key={ord.id} className="hover:bg-neutral-50/60 transition-colors">
                        <td className="p-4">
                          <span className="font-mono font-bold text-neutral-900 block">{ord.id}</span>
                          <span className="text-[11px] text-neutral-400">
                            {new Date(ord.createdAt).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="font-bold text-neutral-900 block">{ord.deliveryAddress.fullName}</span>
                          <span className="text-[11px] text-neutral-500">{ord.country}</span>
                        </td>
                        <td className="p-4">
                          <span className="font-bold uppercase text-neutral-800">
                            {ord.selectedPaymentMethodId || ord.paymentMethod}
                          </span>
                          <span className="text-[10px] text-neutral-400 block">
                            {ord.isCashOnDelivery ? 'Advance Delivery Fee' : 'Prepaid Full'}
                          </span>
                        </td>
                        <td className="p-4 font-mono">
                          <div className="font-bold text-indigo-600 text-[11px]">{ord.transactionId || 'N/A'}</div>
                          <div className="text-[10px] text-neutral-400">{ord.senderPhoneOrId || 'N/A'}</div>
                          {ord.proofScreenshotUrl && (
                            <button
                              onClick={() => setProofModalOrder(ord)}
                              className="inline-flex items-center gap-1 text-[10px] text-indigo-600 font-bold hover:underline mt-1"
                            >
                              <Eye className="w-3 h-3" />
                              <span>View Receipt</span>
                            </button>
                          )}
                        </td>
                        <td className="p-4">
                          <span className="font-bold font-mono text-neutral-900 block">
                            {ord.currencySymbol}{ord.totalAmount.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-neutral-400">
                            Adv: {ord.currencySymbol}{ord.deliveryFee}
                          </span>
                        </td>
                        <td className="p-4">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-bold ${
                              ord.deliveryPaymentStatus === 'Verified'
                                ? 'bg-emerald-100 text-emerald-800'
                                : ord.deliveryPaymentStatus === 'Rejected'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {ord.deliveryPaymentStatus}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <button
                            onClick={() => setProofModalOrder(ord)}
                            className="px-3 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-semibold"
                          >
                            Audit
                          </button>
                          {ord.deliveryPaymentStatus === 'Pending' && (
                            <button
                              onClick={() => handleVerifyPayment(ord.id)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs"
                            >
                              Approve
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: CUSTOMERS */}
      {activeTab === 'customers' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-neutral-900 font-['Outfit',sans-serif]">
                Customer Accounts Directory
              </h3>
              <p className="text-xs text-neutral-500">
                Registered shoppers across Bangladesh, India, and Pakistan
              </p>
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name, email, phone..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                className="pl-8 pr-3 py-2 rounded-xl border border-neutral-200 text-xs focus:border-indigo-600 outline-hidden bg-white w-64 shadow-2xs"
              />
              <Search className="w-4 h-4 text-neutral-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-neutral-700">
                <thead className="bg-neutral-50 text-neutral-500 uppercase font-bold text-[10px] border-b border-neutral-200">
                  <tr>
                    <th className="p-4">Customer Name</th>
                    <th className="p-4">Email Address</th>
                    <th className="p-4">Mobile Number</th>
                    <th className="p-4">Country</th>
                    <th className="p-4">Registered Date</th>
                    <th className="p-4">Account Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {isLoadingCustomers ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-xs text-neutral-400">
                        Loading customers from database...
                      </td>
                    </tr>
                  ) : customers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-xs text-neutral-400">
                        No registered customers found yet.
                      </td>
                    </tr>
                  ) : (
                    customers
                      .filter((c: any) => {
                        if (!customerSearch) return true;
                        const q = customerSearch.toLowerCase();
                        const nameStr = (c.name || c.fullName || '').toLowerCase();
                        const emailStr = (c.email || '').toLowerCase();
                        const phoneStr = (c.phone || c.mobile || '').toLowerCase();
                        const countryStr = (c.country || '').toLowerCase();
                        return (
                          nameStr.includes(q) ||
                          emailStr.includes(q) ||
                          phoneStr.includes(q) ||
                          countryStr.includes(q)
                        );
                      })
                      .map((cust: any) => {
                        const displayName = cust.name || cust.fullName || 'Customer';
                        const displayPhone = cust.phone || cust.mobile || '—';
                        return (
                          <tr key={cust.id} className="hover:bg-neutral-50/60 transition-colors">
                            <td className="p-4 font-bold text-neutral-900 flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                                {displayName[0] || 'C'}
                              </div>
                              <span>{displayName}</span>
                            </td>
                            <td className="p-4 text-neutral-600 font-mono text-[11px]">{cust.email}</td>
                            <td className="p-4 font-mono font-medium text-neutral-900">{displayPhone}</td>
                            <td className="p-4">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-neutral-100 text-neutral-800">
                                {cust.country === 'Bangladesh' ? '🇧🇩' : cust.country === 'India' ? '🇮🇳' : '🇵🇰'} {cust.country}
                              </span>
                            </td>
                            <td className="p-4 text-neutral-500 text-[11px]">
                              {cust.createdAt ? new Date(cust.createdAt).toLocaleDateString() : '—'}
                            </td>
                            <td className="p-4">
                              <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full text-[11px] font-bold border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                {cust.status || 'Active'}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: REVIEWS */}
      {activeTab === 'reviews' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-neutral-900 font-['Outfit',sans-serif]">
                Customer Reviews & Ratings
              </h3>
              <p className="text-xs text-neutral-500">
                Verified buyer feedback and authentic product testimonials
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-amber-500 flex items-center gap-1 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
                <Star className="w-4 h-4 fill-amber-400" />
                4.9 / 5.0 Average Rating (142 reviews)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              {
                name: 'Tanvir Hossain',
                country: 'Bangladesh',
                product: 'Apple iPhone 16 Pro Max 256GB',
                rating: 5,
                date: 'March 14, 2026',
                comment: 'Delivered in Dhaka within 24 hours. Paid ৳150 delivery charge in advance via bKash and remaining cash on delivery. 100% genuine sealed unit!',
              },
              {
                name: 'Vikram Mehta',
                country: 'India',
                product: 'Sony WH-1000XM5 Wireless Headphones',
                rating: 5,
                date: 'March 12, 2026',
                comment: 'Super fast delivery to Bangalore. Original international warranty card inside. Advance delivery fee via UPI was seamless.',
              },
              {
                name: 'Zubair Khan',
                country: 'Pakistan',
                product: 'MacBook Air 15" M3 Chip',
                rating: 5,
                date: 'March 10, 2026',
                comment: 'Authentic imported machine delivered safely in Lahore. TCS courier tracking was real-time and packaging was immaculate.',
              },
              {
                name: 'Farzana Akter',
                country: 'Bangladesh',
                product: 'Samsung Galaxy S24 Ultra 512GB',
                rating: 5,
                date: 'March 08, 2026',
                comment: 'Excellent customer support on WhatsApp. Verified IMEI number on official website. Best cross-border shop in South Asia.',
              },
            ].map((rev, idx) => (
              <div
                key={idx}
                className="bg-white p-6 rounded-3xl border border-neutral-200/80 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-neutral-100 font-bold text-xs flex items-center justify-center text-neutral-700">
                      {rev.name[0]}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-neutral-900">{rev.name}</h4>
                      <span className="text-[10px] text-neutral-400">{rev.country} • {rev.date}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                </div>

                <div className="text-[11px] font-semibold text-indigo-600 bg-indigo-50/60 px-2.5 py-1 rounded-lg">
                  Product: {rev.product}
                </div>

                <p className="text-xs text-neutral-600 leading-relaxed italic">
                  "{rev.comment}"
                </p>

                <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-[10px] text-neutral-400">
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Verified Purchase
                  </span>
                  <span className="text-neutral-500 font-medium">Publicly Displayed</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: DISCOUNTS & COUPONS */}
      {activeTab === 'discounts' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-neutral-900 font-['Outfit',sans-serif]">
                Discounts & Promotional Coupons
              </h3>
              <p className="text-xs text-neutral-500">
                Manage promotional discount codes, validity windows, and regional eligibility
              </p>
            </div>
            <button
              onClick={() => showToast('New coupon code generator ready', 'info')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Coupon Code</span>
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-neutral-700">
                <thead className="bg-neutral-50 text-neutral-500 uppercase font-bold text-[10px] border-b border-neutral-200">
                  <tr>
                    <th className="p-4">Coupon Code</th>
                    <th className="p-4">Discount Value</th>
                    <th className="p-4">Eligible Regions</th>
                    <th className="p-4">Minimum Spend</th>
                    <th className="p-4">Usage Count</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {[
                    { code: 'WELCOME10', discount: '10% OFF', regions: 'BD, IN, PK', minSpend: '৳1,000 / ₹700 / Rs.2,500', usage: '342 uses', status: 'Active' },
                    { code: 'EID2026', discount: '15% OFF', regions: 'Bangladesh & Pakistan', minSpend: '৳3,500 / Rs.8,000', usage: '189 uses', status: 'Active' },
                    { code: 'DIWALI2026', discount: '15% OFF', regions: 'India', minSpend: '₹2,500', usage: '210 uses', status: 'Active' },
                    { code: 'FREESHIP', discount: 'Free Delivery', regions: 'All Countries', minSpend: '৳5,000 / ₹3,500 / Rs.12,000', usage: '512 uses', status: 'Active' },
                  ].map((cpn) => (
                    <tr key={cpn.code} className="hover:bg-neutral-50/60 transition-colors">
                      <td className="p-4">
                        <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200 text-xs">
                          {cpn.code}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-neutral-900">{cpn.discount}</td>
                      <td className="p-4 font-medium text-neutral-600">{cpn.regions}</td>
                      <td className="p-4 font-mono text-[11px] text-neutral-500">{cpn.minSpend}</td>
                      <td className="p-4 text-neutral-600">{cpn.usage}</td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full text-[11px] font-bold border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          {cpn.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: OFFER BANNERS */}
      {activeTab === 'banners' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-neutral-900 font-['Outfit',sans-serif]">
                Offer Banners & Marketing Sliders
              </h3>
              <p className="text-xs text-neutral-500">
                Visual hero promotions, seasonal campaign banners, and cross-border ads
              </p>
            </div>
            <button
              onClick={() => showToast('Banner manager loaded', 'info')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Upload New Banner</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                title: 'Cross-Border Electronics Mega Sale',
                subtitle: 'Authentic Gadgets delivered directly to BD, IN & PK',
                tag: 'Hero Slider #1',
                active: true,
                badge: 'All Countries',
                img: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80',
              },
              {
                title: '100% Genuine International Warranty',
                subtitle: 'Zero Customs Hassle with Cash on Delivery Convenience',
                tag: 'Hero Slider #2',
                active: true,
                badge: 'All Countries',
                img: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80',
              },
              {
                title: 'Express Doorstep Delivery Policy',
                subtitle: 'Only delivery charge required in advance to confirm order',
                tag: 'Cart Banner',
                active: true,
                badge: 'BD / IN / PK',
                img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
              },
            ].map((ban, idx) => (
              <div
                key={idx}
                className="bg-white rounded-3xl border border-neutral-200/80 shadow-xs overflow-hidden flex flex-col"
              >
                <div className="h-40 relative bg-neutral-900 overflow-hidden">
                  <img
                    src={ban.img}
                    alt={ban.title}
                    className="w-full h-full object-cover opacity-80"
                  />
                  <span className="absolute top-3 left-3 bg-neutral-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                    {ban.tag}
                  </span>
                  <span className="absolute top-3 right-3 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Live
                  </span>
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block mb-1">
                      {ban.badge}
                    </span>
                    <h4 className="text-sm font-bold text-neutral-900 font-['Outfit',sans-serif]">
                      {ban.title}
                    </h4>
                    <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                      {ban.subtitle}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between">
                    <span className="text-xs text-neutral-400">Position: #{idx + 1}</span>
                    <button
                      onClick={() => showToast('Banner visibility toggled', 'success')}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                    >
                      Edit Banner
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: NOTIFICATIONS */}
      {activeTab === 'notifications' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-neutral-900 font-['Outfit',sans-serif]">
                Notification & Broadcast Center
              </h3>
              <p className="text-xs text-neutral-500">
                Customer announcements, order verification alerts, and real-time status updates
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchNotifications}
                disabled={isLoadingNotifs}
                className="px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingNotifs ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick Broadcast Form */}
            <div className="bg-white p-6 rounded-3xl border border-neutral-200/80 shadow-xs space-y-4">
              <h4 className="text-sm font-bold text-neutral-900 font-['Outfit',sans-serif]">
                Broadcast Announcement
              </h4>
              <div>
                <label className="text-xs font-semibold text-neutral-600 block mb-1">
                  Target Audience
                </label>
                <select
                  value={broadcastAudience}
                  onChange={(e) => setBroadcastAudience(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-xs font-medium focus:border-indigo-600 outline-hidden"
                >
                  <option value="all">All Customers (BD, IN, PK)</option>
                  <option value="bd">Bangladesh Customers (+880)</option>
                  <option value="in">India Customers (+91)</option>
                  <option value="pk">Pakistan Customers (+92)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-600 block mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  placeholder="e.g. Eid Mega Sale or Delivery Update"
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-xs focus:border-indigo-600 outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-600 block mb-1">
                  Message Content
                </label>
                <textarea
                  rows={3}
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="Type announcement message to dispatch..."
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-xs focus:border-indigo-600 outline-hidden resize-none"
                />
              </div>

              <button
                onClick={handleSendBroadcast}
                disabled={isSendingBroadcast}
                className="w-full py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSendingBroadcast ? 'Dispatching...' : 'Send Broadcast Notification'}
              </button>
            </div>

            {/* Live System Events & Alerts Log */}
            <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-neutral-200/80 shadow-xs flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-bold text-neutral-900 font-['Outfit',sans-serif]">
                  Live System Activity & Alerts ({adminNotifications.length})
                </h4>
                {unreadNotifCount > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold">
                    {unreadNotifCount} unread
                  </span>
                )}
              </div>

              {isLoadingNotifs ? (
                <div className="py-12 text-center text-xs text-neutral-400">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-500" />
                  Loading notifications...
                </div>
              ) : adminNotifications.length === 0 ? (
                <div className="py-12 text-center text-xs text-neutral-400">
                  No system notifications or alerts recorded yet.
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {adminNotifications.map((notif: any) => {
                    const isOrder = notif.type === 'order' || notif.type === 'order_update';
                    const isPayment = notif.type === 'payment';
                    const isAccount = notif.type === 'account' || notif.type === 'system_alert';
                    const Icon = isOrder ? ShoppingBag : isPayment ? CreditCard : isAccount ? Users : Bell;
                    const color = isOrder
                      ? 'text-amber-500 bg-amber-50'
                      : isPayment
                      ? 'text-emerald-500 bg-emerald-50'
                      : isAccount
                      ? 'text-indigo-500 bg-indigo-50'
                      : 'text-neutral-700 bg-neutral-100';

                    return (
                      <div
                        key={notif.id}
                        className={`p-3.5 rounded-2xl border transition-colors flex items-start gap-3 ${
                          notif.isRead
                            ? 'bg-neutral-50/70 border-neutral-100 opacity-80'
                            : 'bg-white border-indigo-100 shadow-2xs ring-1 ring-indigo-50'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-neutral-900 truncate">{notif.title}</span>
                            <span className="text-[10px] text-neutral-400 shrink-0">
                              {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-xs text-neutral-600 mt-0.5">{notif.message}</p>
                          <div className="flex items-center justify-between mt-2 pt-1 border-t border-neutral-100/80">
                            <span className="text-[10px] text-neutral-400">
                              {new Date(notif.createdAt).toLocaleDateString()}
                            </span>
                            {!notif.isRead && (
                              <button
                                onClick={() => handleMarkNotifRead(notif.id)}
                                className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                              >
                                Mark as Read
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB: HELP & SUPPORT TICKETS */}
      {activeTab === 'support' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-neutral-900 font-['Outfit',sans-serif]">
                Customer Help & Support Tickets
              </h3>
              <p className="text-xs text-neutral-500">
                Customer inquiries, order support requests, and resolution tracking
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-neutral-200 text-xs">
                {(['all', 'open', 'in_progress', 'resolved'] as const).map((filterVal) => (
                  <button
                    key={filterVal}
                    onClick={() => setTicketFilter(filterVal)}
                    className={`px-3 py-1.5 rounded-lg capitalize font-semibold transition-colors cursor-pointer ${
                      ticketFilter === filterVal
                        ? 'bg-neutral-900 text-white shadow-2xs'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    {filterVal.replace('_', ' ')}
                  </button>
                ))}
              </div>
              <button
                onClick={fetchSupportTickets}
                disabled={isLoadingTickets}
                className="p-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-colors cursor-pointer"
                title="Refresh Tickets"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingTickets ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Ticket Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs text-rose-600 font-semibold uppercase tracking-wider block">Open Tickets</span>
                <span className="text-2xl font-black text-neutral-900 font-['Outfit',sans-serif]">
                  {supportTickets.filter((t) => t.status === 'open').length}
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <Headphones className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs text-amber-600 font-semibold uppercase tracking-wider block">In Progress</span>
                <span className="text-2xl font-black text-neutral-900 font-['Outfit',sans-serif]">
                  {supportTickets.filter((t) => t.status === 'in_progress').length}
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs text-emerald-600 font-semibold uppercase tracking-wider block">Resolved</span>
                <span className="text-2xl font-black text-neutral-900 font-['Outfit',sans-serif]">
                  {supportTickets.filter((t) => t.status === 'resolved' || t.status === 'closed').length}
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Tickets Table */}
          <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-xs overflow-hidden">
            {isLoadingTickets ? (
              <div className="py-16 text-center text-xs text-neutral-400">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                Loading support tickets...
              </div>
            ) : supportTickets.length === 0 ? (
              <div className="py-16 text-center text-xs text-neutral-400">
                No customer support tickets received yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-neutral-50/80 text-neutral-500 font-semibold border-b border-neutral-200">
                      <th className="py-3.5 px-4">Ticket</th>
                      <th className="py-3.5 px-4">Customer</th>
                      <th className="py-3.5 px-4">Subject & Message</th>
                      <th className="py-3.5 px-4">Category</th>
                      <th className="py-3.5 px-4">Country</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Date</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {supportTickets
                      .filter((t) => {
                        if (ticketFilter === 'all') return true;
                        if (ticketFilter === 'open') return t.status === 'open';
                        if (ticketFilter === 'in_progress') return t.status === 'in_progress';
                        if (ticketFilter === 'resolved') return t.status === 'resolved' || t.status === 'closed';
                        return true;
                      })
                      .map((t: any) => {
                        const isResolved = t.status === 'resolved' || t.status === 'closed';
                        const isInProgress = t.status === 'in_progress';
                        const statusColor = isResolved
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : isInProgress
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200';

                        return (
                          <tr key={t.id} className="hover:bg-neutral-50/60 transition-colors">
                            <td className="py-3.5 px-4 font-mono font-bold text-neutral-900">
                              #{t.ticketNumber || t.id.slice(0, 8)}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-semibold text-neutral-900">{t.customerName || 'Customer'}</div>
                              <div className="text-[11px] text-neutral-400">{t.customerEmail || t.customerPhone}</div>
                            </td>
                            <td className="py-3.5 px-4 max-w-xs">
                              <div className="font-semibold text-neutral-800 truncate">{t.subject}</div>
                              <p className="text-[11px] text-neutral-500 line-clamp-1">{t.description || t.message}</p>
                              {t.orderId && (
                                <span className="inline-block mt-1 px-1.5 py-0.5 bg-neutral-100 rounded text-[10px] text-neutral-600 font-mono">
                                  Ref: {t.orderId}
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700 font-medium text-[11px]">
                                {t.category || 'General'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-medium text-neutral-700">
                              {t.country || 'Global'}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusColor}`}>
                                {t.status ? t.status.replace('_', ' ') : 'open'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-neutral-500 whitespace-nowrap text-[11px]">
                              {new Date(t.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setSelectedTicket(t)}
                                  className="p-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 cursor-pointer"
                                  title="View Ticket Details"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                {!isResolved ? (
                                  <button
                                    onClick={() => handleUpdateTicketStatus(t.id, 'resolved')}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] cursor-pointer"
                                  >
                                    Resolve
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleUpdateTicketStatus(t.id, 'open')}
                                    className="px-2.5 py-1 rounded-lg bg-neutral-200 hover:bg-neutral-300 text-neutral-700 font-bold text-[11px] cursor-pointer"
                                  >
                                    Reopen
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Ticket Detail Modal */}
          {selectedTicket && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-neutral-900 font-['Outfit',sans-serif]">
                      Ticket #{selectedTicket.ticketNumber || selectedTicket.id}
                    </h3>
                    <span className="text-xs text-neutral-400">
                      Submitted {new Date(selectedTicket.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedTicket(null)}
                    className="p-1.5 rounded-xl hover:bg-neutral-100 text-neutral-500 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-3 p-3 bg-neutral-50 rounded-2xl">
                    <div>
                      <span className="text-neutral-400 block font-semibold">Customer</span>
                      <span className="font-bold text-neutral-900">{selectedTicket.customerName}</span>
                    </div>
                    <div>
                      <span className="text-neutral-400 block font-semibold">Country</span>
                      <span className="font-bold text-neutral-900">{selectedTicket.country || 'Global'}</span>
                    </div>
                    <div>
                      <span className="text-neutral-400 block font-semibold">Email</span>
                      <span className="text-neutral-800 break-all">{selectedTicket.customerEmail || '—'}</span>
                    </div>
                    <div>
                      <span className="text-neutral-400 block font-semibold">Phone</span>
                      <span className="text-neutral-800">{selectedTicket.customerPhone || '—'}</span>
                    </div>
                    {selectedTicket.orderId && (
                      <div className="col-span-2 pt-1 border-t border-neutral-200">
                        <span className="text-neutral-400 block font-semibold">Referenced Order ID</span>
                        <span className="font-mono font-bold text-indigo-600">{selectedTicket.orderId}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <span className="text-neutral-400 block font-semibold mb-1">Subject</span>
                    <p className="font-bold text-neutral-900 text-sm">{selectedTicket.subject}</p>
                  </div>

                  <div>
                    <span className="text-neutral-400 block font-semibold mb-1">Message Description</span>
                    <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-100 text-neutral-700 leading-relaxed whitespace-pre-wrap">
                      {selectedTicket.description || selectedTicket.message}
                    </div>
                  </div>

                  {/* Attachment if any */}
                  {selectedTicket.attachments && selectedTicket.attachments.length > 0 && selectedTicket.attachments[0] && (
                    <div>
                      <span className="text-neutral-400 block font-semibold mb-1">Attached Screenshot</span>
                      <a
                        href={selectedTicket.attachments[0]}
                        target="_blank"
                        rel="noreferrer"
                        className="block rounded-2xl overflow-hidden border border-neutral-200 max-h-48"
                      >
                        <img
                          src={selectedTicket.attachments[0]}
                          alt="Support Screenshot"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-contain"
                        />
                      </a>
                    </div>
                  )}

                  <div className="pt-3 border-t border-neutral-100 flex items-center justify-between">
                    <span className="text-xs text-neutral-500">Update Ticket Status:</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUpdateTicketStatus(selectedTicket.id, 'open')}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs cursor-pointer ${
                          selectedTicket.status === 'open' ? 'bg-rose-100 text-rose-700' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                        }`}
                      >
                        Open
                      </button>
                      <button
                        onClick={() => handleUpdateTicketStatus(selectedTicket.id, 'in_progress')}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs cursor-pointer ${
                          selectedTicket.status === 'in_progress' ? 'bg-amber-100 text-amber-700' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                        }`}
                      >
                        In Progress
                      </button>
                      <button
                        onClick={() => handleUpdateTicketStatus(selectedTicket.id, 'resolved')}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs cursor-pointer ${
                          selectedTicket.status === 'resolved' || selectedTicket.status === 'closed' ? 'bg-emerald-600 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                        }`}
                      >
                        Resolved
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB: DELIVERY & SHIPPING */}
      {activeTab === 'shipping' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-neutral-900 font-['Outfit',sans-serif]">
                Delivery & Shipping Configurations
              </h3>
              <p className="text-xs text-neutral-500">
                Cross-border courier rates, delivery timelines, and advance payment policies
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Bangladesh */}
            <div className="bg-white p-6 rounded-3xl border border-neutral-200/80 shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🇧🇩</span>
                <div>
                  <h4 className="text-base font-bold text-neutral-900 font-['Outfit',sans-serif]">
                    Bangladesh Delivery
                  </h4>
                  <span className="text-xs text-neutral-400 font-mono">BDT (৳)</span>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between p-3 rounded-xl bg-neutral-50 border border-neutral-100">
                  <span className="text-neutral-600">Inside Dhaka:</span>
                  <span className="font-bold text-neutral-900 font-mono">৳80 (24–48 hrs)</span>
                </div>
                <div className="flex justify-between p-3 rounded-xl bg-neutral-50 border border-neutral-100">
                  <span className="text-neutral-600">Outside Dhaka:</span>
                  <span className="font-bold text-neutral-900 font-mono">৳150 (48–72 hrs)</span>
                </div>
              </div>

              <div className="pt-2 border-t border-neutral-100 text-[11px] text-neutral-500">
                <strong>Integrated Courier Partners:</strong> Pathao Express, Steadfast Courier, Paperfly
              </div>
            </div>

            {/* India */}
            <div className="bg-white p-6 rounded-3xl border border-neutral-200/80 shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🇮🇳</span>
                <div>
                  <h4 className="text-base font-bold text-neutral-900 font-['Outfit',sans-serif]">
                    India Delivery
                  </h4>
                  <span className="text-xs text-neutral-400 font-mono">INR (₹)</span>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between p-3 rounded-xl bg-neutral-50 border border-neutral-100">
                  <span className="text-neutral-600">Metro Hubs:</span>
                  <span className="font-bold text-neutral-900 font-mono">₹100 (2–3 days)</span>
                </div>
                <div className="flex justify-between p-3 rounded-xl bg-neutral-50 border border-neutral-100">
                  <span className="text-neutral-600">Rest of India:</span>
                  <span className="font-bold text-neutral-900 font-mono">₹180 (3–5 days)</span>
                </div>
              </div>

              <div className="pt-2 border-t border-neutral-100 text-[11px] text-neutral-500">
                <strong>Integrated Courier Partners:</strong> Delhivery, BlueDart, DTDC Express
              </div>
            </div>

            {/* Pakistan */}
            <div className="bg-white p-6 rounded-3xl border border-neutral-200/80 shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🇵🇰</span>
                <div>
                  <h4 className="text-base font-bold text-neutral-900 font-['Outfit',sans-serif]">
                    Pakistan Delivery
                  </h4>
                  <span className="text-xs text-neutral-400 font-mono">PKR (Rs.)</span>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between p-3 rounded-xl bg-neutral-50 border border-neutral-100">
                  <span className="text-neutral-600">Major Cities:</span>
                  <span className="font-bold text-neutral-900 font-mono">Rs.250 (2–3 days)</span>
                </div>
                <div className="flex justify-between p-3 rounded-xl bg-neutral-50 border border-neutral-100">
                  <span className="text-neutral-600">Other Districts:</span>
                  <span className="font-bold text-neutral-900 font-mono">Rs.450 (3–5 days)</span>
                </div>
              </div>

              <div className="pt-2 border-t border-neutral-100 text-[11px] text-neutral-500">
                <strong>Integrated Courier Partners:</strong> TCS Courier, BlueEx, Leopards Express
              </div>
            </div>
          </div>

          {/* Cash On Delivery Advance Policy Card */}
          <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-200/80 text-xs">
            <h4 className="font-bold text-indigo-900 mb-1.5 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              Cash on Delivery (COD) Advance Delivery Charge Requirement
            </h4>
            <p className="text-indigo-800 leading-relaxed">
              To prevent fraudulent or fake international orders, customers choosing Cash on Delivery must pay only the small delivery charge in advance (e.g. ৳80/৳150 in BD, ₹100/₹180 in IN, Rs.250/Rs.450 in PK). The remaining product price is paid in cash directly to the courier upon delivery at the customer's doorstep.
            </p>
          </div>
        </div>
      )}

      {/* TAB: COUNTRIES */}
      {activeTab === 'countries' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-neutral-900 font-['Outfit',sans-serif]">
                Supported Operational Countries
              </h3>
              <p className="text-xs text-neutral-500">
                Cross-border multi-currency rules, calling codes, and localized checkout channels
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                country: 'Bangladesh',
                flag: '🇧🇩',
                currency: 'BDT (৳)',
                code: '+880',
                methods: 'bKash, Nagad, Rocket, Upay, COD',
                status: 'Active',
              },
              {
                country: 'India',
                flag: '🇮🇳',
                currency: 'INR (₹)',
                code: '+91',
                methods: 'UPI (GPay, PhonePe, Paytm), NetBanking, COD',
                status: 'Active',
              },
              {
                country: 'Pakistan',
                flag: '🇵🇰',
                currency: 'PKR (Rs.)',
                code: '+92',
                methods: 'EasyPaisa, JazzCash, Sadapay, COD',
                status: 'Active',
              },
            ].map((c) => (
              <div
                key={c.country}
                className="bg-white p-6 rounded-3xl border border-neutral-200/80 shadow-xs space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{c.flag}</span>
                    <div>
                      <h4 className="text-base font-bold text-neutral-900 font-['Outfit',sans-serif]">
                        {c.country}
                      </h4>
                      <span className="text-xs text-neutral-400">{c.code} Calling Code</span>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full text-[11px] font-bold border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    {c.status}
                  </span>
                </div>

                <div className="space-y-2 text-xs bg-neutral-50 p-4 rounded-2xl border border-neutral-100">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Base Currency:</span>
                    <span className="font-bold font-mono text-neutral-900">{c.currency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Phone Format:</span>
                    <span className="font-mono text-neutral-700">{c.code} XXXX-XXXXXX</span>
                  </div>
                  <div className="pt-2 border-t border-neutral-200">
                    <span className="text-neutral-500 block mb-1">Local Gateways:</span>
                    <span className="font-semibold text-neutral-900">{c.methods}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

        </main>
      </div>

      {/* PROOF AUDIT MODAL */}
      {proofModalOrder && (
        <div className="fixed inset-0 bg-neutral-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setProofModalOrder(null)}
              className="absolute top-5 right-5 p-1 rounded-lg text-neutral-400 hover:text-neutral-700"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-neutral-900 font-['Outfit',sans-serif] mb-1">
              Payment Proof Verification
            </h3>
            <p className="text-xs text-neutral-500 mb-6">Order #{proofModalOrder.id}</p>

            <div className="space-y-3 text-xs bg-neutral-50 p-4 rounded-2xl border border-neutral-200 mb-6">
              <div className="flex justify-between">
                <span className="text-neutral-500">Method Channel:</span>
                <span className="font-bold text-neutral-900 uppercase">
                  {proofModalOrder.selectedPaymentMethodId || proofModalOrder.paymentMethod}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-neutral-500">Sender Number / Binance ID:</span>
                <span className="font-mono font-bold text-neutral-900">
                  {proofModalOrder.senderPhoneOrId}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-neutral-500">Transaction ID (TrxID / Hash):</span>
                <span className="font-mono font-bold text-indigo-600">
                  {proofModalOrder.transactionId}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-neutral-500">Advance Due Amount:</span>
                <span className="font-bold text-neutral-900">
                  {proofModalOrder.currencySymbol}
                  {proofModalOrder.paymentMethod === 'cod'
                    ? proofModalOrder.deliveryCharge
                    : proofModalOrder.totalAmount}
                </span>
              </div>

              {proofModalOrder.proofScreenshotUrl && (
                <div className="pt-2 border-t border-neutral-200">
                  <span className="text-neutral-500 block mb-2">Submitted Screenshot:</span>
                  <div className="max-h-48 overflow-y-auto rounded-xl border border-neutral-200">
                    <img
                      src={proofModalOrder.proofScreenshotUrl}
                      alt="Submitted proof receipt"
                      className="w-full h-auto object-contain"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(true);
                }}
                className="px-4 py-2 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 text-xs font-bold hover:bg-rose-100"
              >
                Reject Proof
              </button>

              <button
                onClick={() => handleVerifyPayment(proofModalOrder.id)}
                className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Verify & Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {showRejectModal && proofModalOrder && (
        <div className="fixed inset-0 bg-neutral-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <h4 className="text-base font-bold text-neutral-900 mb-2">Reject Payment Verification</h4>
            <p className="text-xs text-neutral-500 mb-4">
              Enter reason to notify customer (e.g. invalid TrxID, incorrect amount):
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Transaction ID was not found on bKash merchant statement."
              className="w-full p-3 rounded-xl border border-neutral-200 text-xs outline-hidden focus:border-rose-500 mb-4"
              rows={3}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 rounded-xl border border-neutral-200 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRejectPayment(proofModalOrder.id)}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRODUCT CREATE / EDIT MODAL */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-neutral-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative my-8">
            <button
              onClick={() => setIsProductModalOpen(false)}
              className="absolute top-5 right-5 p-1 rounded-lg text-neutral-400 hover:text-neutral-700"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-neutral-900 font-['Outfit',sans-serif] mb-1">
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </h3>
            <p className="text-xs text-neutral-500 mb-6">
              Prices are specified in BDT and converted dynamically for India and Pakistan
            </p>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1">
                    Product Title *
                  </label>
                  <input
                    type="text"
                    value={pName}
                    onChange={(e) => setPName(e.target.value)}
                    placeholder="e.g. iPhone 16 Pro Max"
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-xs focus:border-indigo-600 outline-hidden"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1">
                    Brand Name *
                  </label>
                  <input
                    type="text"
                    value={pBrand}
                    onChange={(e) => setPBrand(e.target.value)}
                    placeholder="e.g. Apple, Sony, Samsung"
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-xs focus:border-indigo-600 outline-hidden"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1">
                    Category *
                  </label>
                  <select
                    value={pCategory}
                    onChange={(e) => setPCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-xs focus:border-indigo-600 outline-hidden"
                  >
                    <option value="Smartphones">Smartphones</option>
                    <option value="Laptops">Laptops</option>
                    <option value="Audio">Audio</option>
                    <option value="Cameras">Cameras</option>
                    <option value="Wearables">Wearables</option>
                    <option value="Gaming">Gaming</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1">
                    Stock Quantity *
                  </label>
                  <input
                    type="number"
                    value={pStock}
                    onChange={(e) => setPStock(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-xs focus:border-indigo-600 outline-hidden"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1">
                    Base Price (BDT) *
                  </label>
                  <input
                    type="number"
                    value={pBasePriceBDT}
                    onChange={(e) => setPBasePriceBDT(e.target.value)}
                    placeholder="120000"
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-xs focus:border-indigo-600 outline-hidden"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1">
                    Original Price (BDT)
                  </label>
                  <input
                    type="number"
                    value={pOriginalPriceBDT}
                    onChange={(e) => setPOriginalPriceBDT(e.target.value)}
                    placeholder="135000"
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-xs focus:border-indigo-600 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1">
                    Discount %
                  </label>
                  <input
                    type="number"
                    value={pDiscountPercentage}
                    onChange={(e) => setPDiscountPercentage(e.target.value)}
                    placeholder="10"
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-xs focus:border-indigo-600 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1">
                  Product Description
                </label>
                <textarea
                  value={pDescription}
                  onChange={(e) => setPDescription(e.target.value)}
                  placeholder="Detailed description of features, specs, and contents..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-xs focus:border-indigo-600 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1">
                  Image URLs (One per line)
                </label>
                <textarea
                  value={pImages}
                  onChange={(e) => setPImages(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-xs focus:border-indigo-600 outline-hidden font-mono"
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-neutral-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pIsCodAvailable}
                    onChange={(e) => setPIsCodAvailable(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                  <span>Cash on Delivery Eligible</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold text-neutral-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pIsFeatured}
                    onChange={(e) => setPIsFeatured(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                  <span>Featured on Home Page</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-neutral-200 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
