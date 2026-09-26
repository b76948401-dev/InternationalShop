import { supabase } from '../lib/supabase';
import {
  DynamicPaymentMethod,
  Order,
  OrderItem,
  OrderStatus,
  PaymentProof,
  PaymentStatus,
  Product,
  ProductReview,
  ProductVariant,
  SupportedCountry,
  SupportTicket,
  User,
} from '../types';

/**
 * Interface mapping for Supabase products row
 */
export interface SupabaseProductRow {
  id: string;
  name: string;
  slug: string;
  description: string;
  base_price_bdt: number;
  original_price_bdt?: number | null;
  discount_percentage?: number | null;
  stock_quantity: number;
  images: string[];
  brand?: string | null;
  category_id?: string | null;
  category?: string | null;
  is_featured?: boolean | null;
  is_active?: boolean | null;
  is_cod_available?: boolean | null;
  rating?: number | null;
  reviews_count?: number | null;
  features?: string[] | null;
  specifications?: Record<string, string> | null;
  sku?: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Interface mapping for Supabase categories row
 */
export interface SupabaseCategoryRow {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image_url?: string | null;
  is_active?: boolean | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Converts Supabase payment_methods row into front-end DynamicPaymentMethod interface
 */
export function mapSupabasePaymentMethodRow(row: any): DynamicPaymentMethod {
  return {
    id: String(row.id || ''),
    name: row.name || row.display_name || 'Payment Method',
    displayName: row.display_name || row.name || 'Payment Method',
    code: row.code || (row.id ? String(row.id).replace(/^pm_/, '') : 'custom'),
    type: row.type || 'mobile_banking',
    shortDescription: row.short_description || null,
    fullDescription: row.full_description || null,
    logoUrl: row.logo_url || null,
    iconName: row.icon_name || null,
    isActive: row.is_active ?? true,
    isArchived: row.is_archived ?? false,
    sortOrder: Number(row.sort_order ?? 0),
    country: row.country || null,
    supportedCountries: Array.isArray(row.supported_countries)
      ? row.supported_countries
      : typeof row.supported_countries === 'string'
      ? [row.supported_countries]
      : [],
    supportedCurrencies: Array.isArray(row.supported_currencies)
      ? row.supported_currencies
      : typeof row.supported_currencies === 'string'
      ? [row.supported_currencies]
      : [],
    accountNumber: row.account_number || null,
    mobileNumber: row.mobile_number || null,
    merchantNumber: row.merchant_number || null,
    accountType: row.account_type || null,
    walletAddress: row.wallet_address || null,
    cryptoNetwork: row.crypto_network || null,
    bankName: row.bank_name || null,
    accountName: row.account_name || null,
    branch: row.branch || null,
    routingSwift: row.routing_swift || null,
    instructions: row.instructions || null,
    customerInstructions: row.customer_instructions || null,
    adminVerificationInstructions: row.admin_verification_instructions || null,
    requireSenderNumber: Boolean(row.require_sender_number),
    requireTransactionId: Boolean(row.require_transaction_id),
    requireScreenshot: Boolean(row.require_screenshot),
    requireEmail: Boolean(row.require_email),
    requireWalletAddress: Boolean(row.require_wallet_address),
    requireTransactionHash: Boolean(row.require_transaction_hash),
    requireAccountName: Boolean(row.require_account_name),
    requireSenderBankAccount: Boolean(row.require_sender_bank_account),
    minAmount: row.min_amount != null ? Number(row.min_amount) : null,
    maxAmount: row.max_amount != null ? Number(row.max_amount) : null,
  };
}

/**
 * Converts Supabase product row into front-end Product interface
 */
export function mapSupabaseProductToModel(
  row: any,
  categoryName?: string
): Product {
  const cat = row.category || categoryName || (row.category_id ? 'Electronics' : 'Audio & Gadgets');

  // Handle variants from product_variants join or row.variants
  let variants: ProductVariant[] = [];
  if (Array.isArray(row.variants) && row.variants.length > 0) {
    variants = row.variants;
  } else if (Array.isArray(row.product_variants) && row.product_variants.length > 0) {
    const grouped: Record<string, Set<string>> = {};
    for (const v of row.product_variants) {
      if (v.name && Array.isArray(v.options)) {
        variants.push(v);
      } else {
        const vName = v.variant_name || v.name || v.type || 'Option';
        const vOption = v.option_value || v.value || v.sku || v.name || v.id;
        if (!grouped[vName]) grouped[vName] = new Set();
        if (vOption) grouped[vName].add(String(vOption));
      }
    }
    if (variants.length === 0) {
      variants = Object.entries(grouped).map(([name, optSet]) => ({
        name,
        options: Array.from(optSet),
      }));
    }
  }

  // Handle cash on delivery and payment rules
  let isCodEligible = row.is_cod_available ?? row.is_cod_eligible ?? true;
  if (Array.isArray(row.product_payment_rules) && row.product_payment_rules.length > 0) {
    const codRule = row.product_payment_rules.find((r: any) =>
      (r.payment_method && /cod|cash/i.test(r.payment_method)) ||
      (r.rule_type && /cod|cash/i.test(r.rule_type)) ||
      r.is_cod_allowed !== undefined ||
      r.cod_allowed !== undefined
    );
    if (codRule) {
      isCodEligible = Boolean(codRule.is_cod_allowed ?? codRule.cod_allowed ?? codRule.is_allowed ?? true);
    }
  }

  const basePrice = Number(row.selling_price ?? row.base_price_bdt ?? row.price ?? 0);
  const origPrice = row.original_price != null
    ? Number(row.original_price)
    : row.original_price_bdt != null
    ? Number(row.original_price_bdt)
    : undefined;

  let discountPct = row.discount_percentage ? Number(row.discount_percentage) : undefined;
  if (discountPct === undefined && origPrice && origPrice > basePrice) {
    discountPct = Math.round(((origPrice - basePrice) / origPrice) * 100);
  }

  return {
    id: row.id,
    name: row.name || row.title || 'Product',
    slug: row.slug || row.id,
    brand: row.brand || 'Premium Brand',
    category: cat,
    description: row.description || '',
    basePriceBDT: basePrice,
    originalPriceBDT: origPrice,
    discountPercentage: discountPct,
    stock: Number(row.stock_quantity ?? row.stock ?? 0),
    images:
      Array.isArray(row.images) && row.images.length > 0
        ? row.images
        : row.image_url
        ? [row.image_url]
        : ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80'],
    variants: variants.length > 0 ? variants : undefined,
    product_variants: row.product_variants || [],
    product_payment_rules: row.product_payment_rules || [],
    status: row.status || 'active',
    is_archived: Boolean(row.is_archived),
    direct_payment_required: Boolean(row.direct_payment_required ?? (isCodEligible === false)),
    isCodEligible: isCodEligible,
    isCodAvailable: isCodEligible,
    isFeatured: Boolean(row.is_featured),
    rating: Number(row.rating) || 5.0,
    reviewCount: Number(row.reviews_count) || 0,
    features: Array.isArray(row.features) ? row.features : [],
    specifications:
      row.specifications && typeof row.specifications === 'object'
        ? row.specifications
        : {},
    shippingInfo: 'Ships within 24-48 hours via express courier with live tracking.',
    returnPolicy: '7-day replacement policy for verified manufacturing defects.',
    warrantyInfo: '1-Year Official International Manufacturer Warranty.',
  };
}

/**
 * Converts Supabase order row into front-end Order interface
 */
export function mapSupabaseOrderToModel(row: any): Order {
  const items: OrderItem[] = Array.isArray(row.items)
    ? row.items
    : typeof row.items === 'string'
    ? JSON.parse(row.items)
    : [];

  const deliveryAddress =
    row.delivery_address ||
    row.shipping_address || {
      id: 'addr-default',
      userId: row.user_id,
      fullName: row.customer_name || 'Valued Customer',
      phone: row.customer_phone || row.customer_mobile || '',
      country: (row.country as SupportedCountry) || 'Bangladesh',
      fullAddress: 'Direct Address Provided at Checkout',
      isDefault: true,
    };

  return {
    id: row.id,
    userId: row.user_id,
    customerName: row.customer_name || 'Customer',
    customerEmail: row.customer_email || '',
    customerMobile: row.customer_mobile || row.customer_phone || '',
    country: (row.country as SupportedCountry) || 'Bangladesh',
    currency: row.currency || 'BDT',
    exchangeRate: 1,
    deliveryAddress,
    items,
    productSubtotal: Number(row.total_amount) || 0,
    subtotal: Number(row.total_amount) || 0,
    discount: 0,
    deliveryCharge: 100,
    tax: 0,
    totalAmount: Number(row.total_amount) || 0,
    paymentMethod: row.payment_method || (row.is_cod ? 'Cash on Delivery' : 'Online Payment'),
    isCod: Boolean(row.is_cod),
    amountPaidOnline: Number(row.amount_paid_online) || 0,
    remainingCodAmount: Number(row.remaining_cod_amount) || 0,
    paymentStatus: (row.payment_status as PaymentStatus) || 'pending_verification',
    paymentProof: row.payment_proof || undefined,
    orderStatus: (row.order_status as OrderStatus) || 'Pending',
    timeline: Array.isArray(row.timeline) ? row.timeline : [],
    createdAt: row.created_at || new Date().toISOString(),
  };
}

// ==========================================
// DATA SERVICE CORE API
// ==========================================
export const dataService = {
  // ----------------------------------------
  // PRODUCTS
  // ----------------------------------------
  async getProducts(filter?: {
    category?: string;
    search?: string;
    isFeatured?: boolean;
  }): Promise<Product[]> {
    try {
      const { data: products } = await supabase
        .from('products')
        .select(`
          *,
          product_payment_rules (*),
          product_variants (*)
        `)
        .eq('status', 'active')
        .eq('is_archived', false);

      if (!products) {
        return [];
      }

      const isDemo = (id: string) => /^prod-0(0[1-9]|1[0-5])$/.test(id);
      let list = (products || [])
        .filter((row: any) => !isDemo(row.id))
        .map((row: any) => mapSupabaseProductToModel(row));

      if (filter?.isFeatured !== undefined) {
        list = list.filter((p) => p.isFeatured === filter.isFeatured);
      }

      if (filter?.category && filter.category !== 'All') {
        const cat = filter.category.toLowerCase();
        list = list.filter((p) => p.category?.toLowerCase().includes(cat));
      }

      if (filter?.search) {
        const query = filter.search.toLowerCase();
        list = list.filter(
          (p) =>
            p.name.toLowerCase().includes(query) ||
            p.brand.toLowerCase().includes(query) ||
            p.description.toLowerCase().includes(query)
        );
      }

      return list;
    } catch (err) {
      console.error('[DataService] getProducts failed:', err);
      return [];
    }
  },

  async getProductById(id: string): Promise<Product | null> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          product_payment_rules (*),
          product_variants (*)
        `)
        .eq('id', id)
        .eq('status', 'active')
        .eq('is_archived', false)
        .maybeSingle();

      if (error || !data) return null;
      return mapSupabaseProductToModel(data);
    } catch (err) {
      console.error('[DataService] getProductById error:', err);
      return null;
    }
  },

  async createProduct(product: Partial<Product>): Promise<{ success: boolean; data?: Product; error?: string }> {
    try {
      const slug = (product.name || 'product')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36);

      const row: Partial<SupabaseProductRow> = {
        name: product.name || 'New Product',
        slug,
        description: product.description || '',
        base_price_bdt: product.basePriceBDT || 0,
        original_price_bdt: product.originalPriceBDT || null,
        discount_percentage: product.discountPercentage || 0,
        stock_quantity: product.stock ?? 20,
        images: product.images && product.images.length > 0 ? product.images : [],
        brand: product.brand || 'Brand',
        category: product.category || 'Audio & Gadgets',
        is_featured: Boolean(product.isFeatured),
        is_active: true,
        is_cod_available: product.isCodAvailable ?? true,
        rating: 5.0,
        reviews_count: 0,
        features: product.features || [],
        specifications: product.specifications || {},
      };

      const { data, error } = await supabase.from('products').insert(row).select().single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: mapSupabaseProductToModel(data) };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to create product' };
    }
  },

  async updateProduct(
    id: string,
    updates: Partial<Product>
  ): Promise<{ success: boolean; data?: Product; error?: string }> {
    try {
      const rowUpdates: any = {
        updated_at: new Date().toISOString(),
      };

      if (updates.name !== undefined) rowUpdates.name = updates.name;
      if (updates.brand !== undefined) rowUpdates.brand = updates.brand;
      if (updates.category !== undefined) rowUpdates.category = updates.category;
      if (updates.description !== undefined) rowUpdates.description = updates.description;
      if (updates.basePriceBDT !== undefined) rowUpdates.base_price_bdt = updates.basePriceBDT;
      if (updates.originalPriceBDT !== undefined) rowUpdates.original_price_bdt = updates.originalPriceBDT;
      if (updates.discountPercentage !== undefined) rowUpdates.discount_percentage = updates.discountPercentage;
      if (updates.stock !== undefined) rowUpdates.stock_quantity = updates.stock;
      if (updates.images !== undefined) rowUpdates.images = updates.images;
      if (updates.isFeatured !== undefined) rowUpdates.is_featured = updates.isFeatured;
      if (updates.isCodAvailable !== undefined) rowUpdates.is_cod_available = updates.isCodAvailable;
      if (updates.features !== undefined) rowUpdates.features = updates.features;
      if (updates.specifications !== undefined) rowUpdates.specifications = updates.specifications;

      const { data, error } = await supabase
        .from('products')
        .update(rowUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: mapSupabaseProductToModel(data) };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to update product' };
    }
  },

  async deleteProduct(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to delete product' };
    }
  },

  // ----------------------------------------
  // CATEGORIES
  // ----------------------------------------
  async getCategories(): Promise<SupabaseCategoryRow[]> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.warn('[DataService] Categories query error:', error.message);
        return [];
      }
      return data || [];
    } catch (err) {
      console.error('[DataService] getCategories failed:', err);
      return [];
    }
  },

  async createCategory(category: {
    name: string;
    description?: string;
    image_url?: string;
  }): Promise<{ success: boolean; data?: SupabaseCategoryRow; error?: string }> {
    try {
      const slug = category.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const { data, error } = await supabase
        .from('categories')
        .insert({
          name: category.name,
          slug,
          description: category.description || null,
          image_url: category.image_url || null,
          is_active: true,
        })
        .select()
        .single();

      if (error) return { success: false, error: error.message };
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to create category' };
    }
  },

  // ----------------------------------------
  // ORDERS
  // ----------------------------------------
  async getOrders(userId?: string): Promise<Order[]> {
    try {
      let query = supabase.from('orders').select('*');

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.warn('[DataService] Error querying orders from Supabase:', error.message);
        return [];
      }

      return (data || []).map(mapSupabaseOrderToModel);
    } catch (err) {
      console.error('[DataService] getOrders failed:', err);
      return [];
    }
  },

  async getOrderById(orderId: string): Promise<Order | null> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .maybeSingle();

      if (error || !data) return null;
      return mapSupabaseOrderToModel(data);
    } catch (err) {
      console.error('[DataService] getOrderById failed:', err);
      return null;
    }
  },

  async createOrder(
    order: Order
  ): Promise<{ success: boolean; data?: Order; error?: string }> {
    try {
      const row: any = {
        id: order.id,
        order_number: order.id,
        user_id: order.userId,
        customer_name: order.customerName,
        customer_email: order.customerEmail,
        customer_phone: order.customerMobile,
        customer_mobile: order.customerMobile,
        country: order.country,
        currency: order.currency,
        total_amount: order.totalAmount,
        amount_paid_online: order.amountPaidOnline,
        remaining_cod_amount: order.remainingCodAmount,
        payment_method: order.paymentMethod,
        is_cod: order.isCod,
        payment_status: order.paymentStatus,
        order_status: order.orderStatus,
        delivery_address: order.deliveryAddress,
        shipping_address: order.deliveryAddress,
        items: order.items,
        payment_proof: order.paymentProof || null,
        timeline: order.timeline,
        created_at: order.createdAt || new Date().toISOString(),
      };

      const { data, error } = await supabase.from('orders').insert(row).select().single();

      if (error) {
        console.warn('[DataService] Direct Supabase order insert notice:', error.message);
      }

      // Also insert into order_items table for normalized relations if possible
      if (Array.isArray(order.items) && order.items.length > 0) {
        const orderItemsPayload = order.items.map((item) => ({
          order_id: order.id,
          product_id: item.productId,
          product_name: item.name,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          subtotal: item.subtotal,
        }));
        try {
          await supabase.from('order_items').insert(orderItemsPayload);
        } catch {
          // Soft ignore if table does not exist
        }
      }

      return { success: true, data: order };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to persist order' };
    }
  },

  async updateOrderStatus(
    orderId: string,
    newStatus: OrderStatus
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const current = await this.getOrderById(orderId);
      const timeline = current?.timeline || [];

      timeline.push({
        status: newStatus,
        title: `Order ${newStatus}`,
        description: `Order status changed to ${newStatus} by store administrator.`,
        timestamp: new Date().toISOString(),
        completed: true,
      });

      const { error } = await supabase
        .from('orders')
        .update({
          order_status: newStatus,
          timeline,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to update order status' };
    }
  },

  async verifyPayment(
    orderId: string,
    notes?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const current = await this.getOrderById(orderId);
      const timeline = current?.timeline || [];

      timeline.push({
        status: 'Payment Verified',
        title: 'Advance Payment Verified',
        description: notes || 'Your payment was verified by finance administrator. Order is approved for dispatch.',
        timestamp: new Date().toISOString(),
        completed: true,
      });

      const { error } = await supabase
        .from('orders')
        .update({
          payment_status: 'verified',
          order_status: 'Confirmed',
          timeline,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to verify payment' };
    }
  },

  async rejectPayment(
    orderId: string,
    reason: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const current = await this.getOrderById(orderId);
      const timeline = current?.timeline || [];

      timeline.push({
        status: 'Payment Rejected',
        title: 'Advance Payment Rejected',
        description: `Payment verification failed: ${reason}. Please resubmit a valid transaction proof or contact support.`,
        timestamp: new Date().toISOString(),
        completed: true,
      });

      const { error } = await supabase
        .from('orders')
        .update({
          payment_status: 'failed',
          timeline,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to reject payment' };
    }
  },

  async submitPaymentProof(
    orderId: string,
    proof: PaymentProof
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const current = await this.getOrderById(orderId);
      const timeline = current?.timeline || [];

      timeline.push({
        status: 'Verification Pending',
        title: 'Payment Proof Submitted',
        description: `Proof submitted via ${proof.method} (TrxID: ${proof.transactionId}). Under review by accounts department.`,
        timestamp: new Date().toISOString(),
        completed: true,
      });

      const { error } = await supabase
        .from('orders')
        .update({
          payment_proof: proof,
          payment_status: 'pending_verification',
          timeline,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      try {
        await supabase.from('payments').insert({
          id: `pmt_${Date.now()}`,
          order_id: orderId,
          order_number: current?.id || orderId,
          customer_id: current?.userId || '',
          customer_name: current?.customerName || '',
          amount: current?.totalAmount || 0,
          currency: current?.currency || 'BDT',
          payment_method: proof.method,
          sender_number: proof.senderInfo,
          transaction_id: proof.transactionId,
          payment_screenshot: proof.screenshotUrl || '',
          status: 'pending',
        });
      } catch (pmtErr: any) {
        console.warn('[Supabase payments insert notice]:', pmtErr?.message);
      }

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to submit payment proof' };
    }
  },

  // ----------------------------------------
  // WEBSITE SETTINGS
  // ----------------------------------------
  async getWebsiteSettings(): Promise<Record<string, any>> {
    try {
      const { data, error } = await supabase.from('website_settings').select('*');
      if (error || !data) return {};

      const map: Record<string, any> = {};
      for (const row of data) {
        if (row.setting_key) {
          map[row.setting_key] = row.setting_value;
        }
      }
      return map;
    } catch (err) {
      console.error('[DataService] getWebsiteSettings failed:', err);
      return {};
    }
  },

  async updateWebsiteSetting(
    key: string,
    value: any
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('website_settings')
        .upsert(
          {
            setting_key: key,
            setting_value: value,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'setting_key' }
        );

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to update website setting' };
    }
  },

  // ----------------------------------------
  // CUSTOMER PROFILES
  // ----------------------------------------
  async getProfiles(): Promise<User[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data) return [];

      return data.map((row) => ({
        id: row.id,
        fullName: row.full_name || 'Customer',
        username: row.username || row.email?.split('@')[0] || 'customer',
        email: row.email || '',
        mobile: row.mobile || '',
        country: (row.country as SupportedCountry) || 'Bangladesh',
        dob: row.dob || '1995-01-01',
        gender: (row.gender as 'Male' | 'Female') || 'Male',
        avatarUrl: row.avatar_url,
        createdAt: row.created_at || new Date().toISOString(),
      }));
    } catch (err) {
      console.error('[DataService] getProfiles failed:', err);
      return [];
    }
  },

  // ----------------------------------------
  // REAL-TIME SUBSCRIPTIONS
  // ----------------------------------------
  subscribeToOrders(onUpdate: (order: Order) => void): () => void {
    const channel = supabase
      .channel(`public:orders-${Date.now()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          if (payload.new && Object.keys(payload.new).length > 0) {
            const mapped = mapSupabaseOrderToModel(payload.new as any);
            onUpdate(mapped);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  subscribeToProducts(onUpdate: (product: Product) => void): () => void {
    const channel = supabase
      .channel(`public:products-${Date.now()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        (payload) => {
          if (payload.new && Object.keys(payload.new).length > 0) {
            const mapped = mapSupabaseProductToModel(payload.new as any);
            onUpdate(mapped);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  async getPaymentMethods(country?: string): Promise<DynamicPaymentMethod[]> {
    try {
      // First attempt: Call our server API route which queries Supabase with proper credentials & filtering
      const apiUrl = country
        ? `/api/payment-methods?country=${encodeURIComponent(country)}`
        : '/api/payment-methods';
      const response = await fetch(apiUrl);
      if (response.ok) {
        const json = await response.json();
        if (json.success && Array.isArray(json.paymentMethods)) {
          return json.paymentMethods.map(mapSupabasePaymentMethodRow);
        }
      }
    } catch (apiErr) {
      console.warn('[dataService] API fetch payment methods notice:', apiErr);
    }

    try {
      // Direct Supabase client query as resilient fallback
      let query = supabase
        .from('payment_methods')
        .select('*')
        .eq('is_active', true)
        .eq('is_archived', false)
        .order('sort_order', { ascending: true });

      const { data, error } = await query;
      if (error) {
        console.warn('[dataService] Supabase payment_methods query notice:', error.message);
        return [];
      }

      let methods = (data || []).map(mapSupabasePaymentMethodRow);
      if (country) {
        const target = country.trim().toLowerCase();
        methods = methods.filter((m) => {
          if (m.supportedCountries && m.supportedCountries.length > 0) {
            return m.supportedCountries.some(
              (c) => c.trim().toLowerCase() === target || c.trim().toLowerCase() === 'all'
            );
          }
          if (m.country) {
            return m.country.trim().toLowerCase() === target || m.country.trim().toLowerCase() === 'all';
          }
          return true;
        });
      }
      return methods;
    } catch (err) {
      console.error('[dataService] Error fetching payment methods:', err);
      return [];
    }
  },

  subscribeToPaymentMethods(onUpdate: () => void): () => void {
    const channel = supabase
      .channel(`public:payment_methods-${Date.now()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'payment_methods' },
        () => {
          onUpdate();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  /**
   * Submit a customer support message or problem report
   */
  async submitSupportMessage(payload: {
    name: string;
    email: string;
    phone?: string;
    country?: string;
    subject?: string;
    category?: string;
    message: string;
    screenshotUrl?: string;
    orderId?: string;
  }): Promise<{ success: boolean; message: string; ticket?: SupportTicket }> {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/support/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit support message');
      }

      return {
        success: true,
        message: data.message || 'Support ticket submitted successfully.',
        ticket: data.ticket,
      };
    } catch (err: any) {
      console.error('[dataService] Error submitting support message:', err);
      throw err;
    }
  },

  /**
   * Retrieve support tickets for customer or admin
   */
  async getSupportMessages(filter?: { email?: string; orderId?: string }): Promise<SupportTicket[]> {
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('admin_token');
      let url = '/api/support/messages';
      const params = new URLSearchParams();
      if (filter?.email) params.append('email', filter.email);
      if (filter?.orderId) params.append('orderId', filter.orderId);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) return [];
      const data = await res.json();
      return data.messages || [];
    } catch (err) {
      console.error('[dataService] Error fetching support messages:', err);
      return [];
    }
  },
};
