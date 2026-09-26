import { Router, Response } from 'express';
import { AuthenticatedRequest, requireAdmin } from '../middleware/authMiddleware';
import { getDb, saveDatabase } from '../db';
import { supabaseServer, getSupabaseClientForRequest } from '../supabase';
import { Order, OrderStatus, Product } from '../../src/types';
import { invalidateLiveProductsCache } from './productRoutes';

const router = Router();

// Strict server-side admin guard - any call without verified server-side admin credentials returns 403 Forbidden
router.use(requireAdmin);

// ==========================================
// 1. DASHBOARD OVERVIEW & STATS
// ==========================================
function mapSupabaseOrderRow(o: any) {
  let deliveryAddress = o.delivery_address || o.shipping_address || {};
  if (typeof deliveryAddress === 'string') {
    if (deliveryAddress.trim().startsWith('{')) {
      try {
        deliveryAddress = JSON.parse(deliveryAddress);
      } catch {
        deliveryAddress = { fullAddress: deliveryAddress, fullName: o.customer_name || 'Customer' };
      }
    } else {
      deliveryAddress = { fullAddress: deliveryAddress, fullName: o.customer_name || 'Customer' };
    }
  }
  if (!deliveryAddress.fullName) {
    deliveryAddress.fullName = o.customer_name || 'Customer';
  }
  if (!deliveryAddress.mobileNumber) {
    deliveryAddress.mobileNumber = o.customer_mobile || o.customer_phone || '';
  }

  const grandTotal = Number(o.grand_total ?? o.total_amount ?? o.product_total ?? 0);
  const deliveryCharge = Number(o.delivery_charge || 0);
  const productSubtotal = Number(o.product_total ?? (grandTotal - deliveryCharge));
  const amountPaidOnline = Number(o.online_paid ?? o.advance_paid_amount ?? o.amount_paid_online ?? 0);
  const remainingCodAmount = Number(o.cod_remaining ?? o.remaining_cod_amount ?? (grandTotal - amountPaidOnline));

  const hasProof = Boolean(o.payment_proof_url || o.advance_transaction_id || o.payment_proof);
  const paymentProof = hasProof
    ? (o.payment_proof || {
        senderInfo: o.customer_mobile || '',
        transactionId: o.advance_transaction_id || '',
        screenshotUrl: o.payment_proof_url || '',
      })
    : null;

  let normOrderStatus = o.order_status || 'Pending';
  if (normOrderStatus.toLowerCase() === 'pending') normOrderStatus = 'Pending';
  else if (normOrderStatus.toLowerCase() === 'confirmed') normOrderStatus = 'Confirmed';
  else if (normOrderStatus.toLowerCase() === 'processing') normOrderStatus = 'Processing';
  else if (normOrderStatus.toLowerCase() === 'shipped') normOrderStatus = 'Shipped';
  else if (normOrderStatus.toLowerCase() === 'delivered') normOrderStatus = 'Delivered';
  else if (normOrderStatus.toLowerCase() === 'cancelled') normOrderStatus = 'Cancelled';

  const isVerified = o.payment_status === 'verified' || o.payment_status === 'approved';
  const currencyCode = o.currency || 'BDT';
  const currencySymbol = o.currency_symbol || (currencyCode === 'INR' ? '₹' : currencyCode === 'PKR' ? 'Rs ' : '৳');

  return {
    id: o.id,
    orderNumber: o.order_number || o.id,
    userId: o.customer_id || o.user_id,
    customerName: o.customer_name || 'Customer',
    customerUsername: o.customer_username || '',
    customerEmail: o.customer_email || '',
    customerMobile: o.customer_mobile || o.customer_phone || '',
    country: o.country || 'Bangladesh',
    currency: currencyCode,
    currencySymbol,
    productSubtotal,
    deliveryCharge,
    deliveryFee: deliveryCharge,
    totalAmount: grandTotal,
    amountPaidOnline,
    remainingCodAmount,
    paymentMethod: o.payment_method || 'Cash on Delivery',
    paymentType: o.payment_type || (o.is_cod ? 'COD' : 'ONLINE_PAYMENT'),
    isCod: Boolean(o.is_cod),
    isCashOnDelivery: Boolean(o.is_cod),
    selectedPaymentMethodId: o.selected_payment_method_id || o.payment_method || 'bKash',
    senderPhoneOrId: o.sender_phone_or_id || o.customer_mobile || (paymentProof?.senderInfo ?? ''),
    transactionId: o.advance_transaction_id || o.transaction_id || (paymentProof?.transactionId ?? ''),
    proofScreenshotUrl: o.payment_proof_url || o.proof_screenshot_url || (paymentProof?.screenshotUrl ?? ''),
    paymentStatus: o.payment_status || (o.is_cod ? 'pending' : 'submitted'),
    deliveryPaymentStatus: hasProof ? (isVerified ? 'Verified' : 'Pending') : 'N/A',
    orderStatus: normOrderStatus as OrderStatus,
    deliveryAddress,
    items: Array.isArray(o.items) ? o.items : [],
    paymentProof,
    timeline: Array.isArray(o.timeline) && o.timeline.length > 0 ? o.timeline : [
      {
        status: normOrderStatus,
        title: 'Order Placed',
        description: 'Order placed and logged in cross-border system.',
        timestamp: o.created_at,
        completed: true,
      }
    ],
    createdAt: o.created_at,
    updatedAt: o.updated_at || o.created_at,
  };
}

router.get('/dashboard', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const db = getDb();
    const orderMap = new Map<string, any>();

    for (const o of db.orders || []) {
      orderMap.set(o.id, o);
    }

    try {
      const { data: supaOrders, error } = await supabaseServer
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && supaOrders) {
        for (const row of supaOrders) {
          orderMap.set(row.id, mapSupabaseOrderRow(row));
        }
      }
    } catch {
      // Use local orders
    }

    const allOrders = Array.from(orderMap.values());
    const totalRevenue = allOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
    const pendingOrders = allOrders.filter((o) => o.orderStatus === 'Pending').length;
    const pendingVerifications = allOrders.filter(
      (o) => (o.deliveryPaymentStatus === 'Pending' || o.paymentStatus === 'submitted' || o.paymentStatus === 'pending_verification') && o.paymentProof
    ).length;

    res.json({
      totalOrders: allOrders.length,
      totalRevenue,
      pendingOrders,
      pendingVerifications,
      totalProducts: db.products.length,
      totalCustomers: db.users.filter((u) => !u.isAdmin).length,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to load dashboard metrics' });
  }
});

// ==========================================
// 2. ORDER MANAGEMENT
// ==========================================
// GET /api/admin/orders - Get all orders
router.get('/orders', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const db = getDb();
    const orderMap = new Map<string, any>();

    for (const o of db.orders || []) {
      orderMap.set(o.id, o);
    }

    try {
      const { data: supaOrders, error } = await supabaseServer
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && supaOrders && supaOrders.length > 0) {
        for (const row of supaOrders) {
          orderMap.set(row.id, mapSupabaseOrderRow(row));
        }
      }
    } catch (err) {
      console.warn('[Admin orders] Supabase read fallback:', err);
    }

    const ordersList = Array.from(orderMap.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    res.json({ orders: ordersList });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to load orders' });
  }
});

// PUT /api/admin/orders/:id/status - Update order status
router.put('/orders/:id/status', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body as { status: OrderStatus };

    if (!status) {
      res.status(400).json({ error: 'Order status is required.' });
      return;
    }

    const db = getDb();
    const order = db.orders.find((o) => o.id === id);

    const timelineItem = {
      status,
      title: `Order ${status}`,
      description: `Order status updated to ${status} by administrator.`,
      timestamp: new Date().toISOString(),
      completed: true,
    };

    if (order) {
      order.orderStatus = status;
      order.timeline.push(timelineItem);
      saveDatabase();
    }

    // Sync to Supabase
    try {
      const { data: supaOrder } = await supabaseServer
        .from('orders')
        .select('timeline')
        .eq('id', id)
        .maybeSingle();

      const existingTimeline = supaOrder?.timeline || order?.timeline || [];
      existingTimeline.push(timelineItem);

      await supabaseServer
        .from('orders')
        .update({
          order_status: status,
          timeline: existingTimeline,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
    } catch (supaErr: any) {
      console.warn('[Admin order status sync]:', supaErr.message);
    }

    res.json({ message: `Order status updated to ${status}`, order });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update order status' });
  }
});

// PUT /api/admin/orders/:id/verify-payment - Verify or reject advance payment
router.put('/orders/:id/verify-payment', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body; // status: 'Verified' | 'Rejected'

    const db = getDb();
    const order = db.orders.find((o) => o.id === id);

    const isVerified = status === 'Verified';
    const newPaymentStatus = isVerified ? 'verified' : 'failed';
    const newOrderStatus = isVerified ? 'Confirmed' : (order?.orderStatus || 'Pending');

    const timelineEntry = {
      status: isVerified ? 'Payment Verified' : 'Payment Rejected',
      title: isVerified ? 'Advance Delivery Payment Verified' : 'Payment Verification Failed',
      description: isVerified
        ? 'Advance delivery payment proof verified. Order confirmed for processing.'
        : `Payment proof rejected: ${reason || 'Invalid transaction ID or screenshot'}.`,
      timestamp: new Date().toISOString(),
      completed: true,
    };

    if (order) {
      order.paymentStatus = newPaymentStatus as any;
      order.orderStatus = newOrderStatus as any;
      order.timeline.push(timelineEntry);
      saveDatabase();
    }

    // Sync with Supabase
    try {
      const { data: supaOrder } = await supabaseServer
        .from('orders')
        .select('timeline')
        .eq('id', id)
        .maybeSingle();

      const existingTimeline = supaOrder?.timeline || order?.timeline || [];
      existingTimeline.push(timelineEntry);

      await supabaseServer
        .from('orders')
        .update({
          payment_status: newPaymentStatus,
          order_status: newOrderStatus,
          timeline: existingTimeline,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
    } catch (supaErr: any) {
      console.warn('[Admin payment verify sync]:', supaErr.message);
    }

    res.json({
      message: isVerified ? 'Payment verified successfully.' : 'Payment rejected.',
      order,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update payment status' });
  }
});

// ==========================================
// 3. PRODUCT & INVENTORY CRUD
// ==========================================
// POST /api/admin/products - Create new product
router.post('/products', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const {
      name,
      brand,
      category,
      description,
      basePriceBDT,
      originalPriceBDT,
      discountPercentage,
      stock,
      images,
      isCodAvailable,
      isFeatured,
      features,
      specifications,
    } = req.body;

    if (!name || !brand || !category || basePriceBDT === undefined) {
      res.status(400).json({ error: 'Name, brand, category, and base price (BDT) are required.' });
      return;
    }

    const db = getDb();
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36);

    const newProduct: Product = {
      id: `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      slug,
      name: name.trim(),
      brand: brand.trim(),
      category: category.trim(),
      description: description || '',
      basePriceBDT: Number(basePriceBDT),
      originalPriceBDT: originalPriceBDT ? Number(originalPriceBDT) : undefined,
      discountPercentage: discountPercentage ? Number(discountPercentage) : 0,
      rating: 5.0,
      reviewCount: 0,
      stock: Number(stock) || 0,
      images: Array.isArray(images) && images.length > 0 ? images : ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80'],
      isCodEligible: isCodAvailable ?? true,
      isCodAvailable: isCodAvailable ?? true,
      isFeatured: Boolean(isFeatured),
      shippingInfo: 'Ships within 24-48 hours via express courier with real-time tracking.',
      returnPolicy: '7-day replacement policy for verified manufacturing defects.',
      warrantyInfo: '1-Year Official International Manufacturer Warranty.',
      features: Array.isArray(features) ? features : [],
      specifications: typeof specifications === 'object' ? specifications : {},
    };

    db.products.unshift(newProduct);
    saveDatabase();
    invalidateLiveProductsCache();

    // 1. Sync to Supabase products table
    try {
      let categoryId = 'cat-general';
      try {
        const { data: catData } = await supabaseServer
          .from('categories')
          .select('id')
          .ilike('name', newProduct.category)
          .maybeSingle();

        if (catData?.id) {
          categoryId = catData.id;
        } else {
          const newCatId = `cat-${newProduct.category.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
          await supabaseServer.from('categories').upsert({
            id: newCatId,
            name: newProduct.category,
            slug: newProduct.category.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            is_active: true,
            display_order: 10,
          });
          categoryId = newCatId;
        }
      } catch {
        // Non-blocking
      }

      const productRow = {
        id: newProduct.id,
        name: newProduct.name,
        slug: newProduct.slug,
        brand: newProduct.brand,
        category_name: newProduct.category,
        category_id: categoryId,
        description: newProduct.description,
        selling_price: newProduct.basePriceBDT,
        original_price: newProduct.originalPriceBDT || newProduct.basePriceBDT,
        final_price: newProduct.basePriceBDT,
        stock_quantity: newProduct.stock,
        main_image: newProduct.images[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
        images: newProduct.images,
        gallery_images: newProduct.images,
        status: 'active',
        is_archived: false,
        is_active: true,
        features: newProduct.features || [],
        specifications: {
          ...(newProduct.specifications || {}),
          is_featured: Boolean(newProduct.isFeatured),
          is_cod_available: newProduct.isCodAvailable ?? true,
          category: newProduct.category,
          discount_percentage: newProduct.discountPercentage || 0,
          rating: 5.0,
          reviews_count: 0,
        },
        sku: (newProduct.slug || newProduct.id).toUpperCase(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error: insertErr } = await supabaseServer.from('products').upsert(productRow);
      if (insertErr) {
        console.warn('[Admin Supabase Product Insert Warning]:', insertErr.message);
      } else {
        console.log('[Admin Supabase Product Insert Success]: Product', newProduct.id, 'stored in Supabase');
      }
    } catch (supaErr: any) {
      console.warn('[Admin product insert sync error]:', supaErr.message);
    }

    res.status(201).json({ message: 'Product created successfully', product: newProduct });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create product' });
  }
});

// PUT /api/admin/products/:id - Update product
router.put('/products/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const db = getDb();
    const product = db.products.find((p) => p.id === id);

    const updates = req.body;
    if (product) {
      if (updates.name !== undefined) product.name = updates.name.trim();
      if (updates.brand !== undefined) product.brand = updates.brand.trim();
      if (updates.category !== undefined) product.category = updates.category.trim();
      if (updates.description !== undefined) product.description = updates.description;
      if (updates.basePriceBDT !== undefined) product.basePriceBDT = Number(updates.basePriceBDT);
      if (updates.originalPriceBDT !== undefined) product.originalPriceBDT = Number(updates.originalPriceBDT);
      if (updates.discountPercentage !== undefined) product.discountPercentage = Number(updates.discountPercentage);
      if (updates.stock !== undefined) product.stock = Number(updates.stock);
      if (updates.images !== undefined) product.images = updates.images;
      if (updates.isCodAvailable !== undefined) {
        product.isCodAvailable = updates.isCodAvailable;
        product.isCodEligible = updates.isCodAvailable;
      }
      if (updates.isFeatured !== undefined) product.isFeatured = updates.isFeatured;
      saveDatabase();
    }

    // Sync to Supabase
    try {
      const supaUpdates: any = { updated_at: new Date().toISOString() };
      if (updates.name !== undefined) supaUpdates.name = updates.name;
      if (updates.brand !== undefined) supaUpdates.brand = updates.brand;
      if (updates.category !== undefined) supaUpdates.category_name = updates.category;
      if (updates.description !== undefined) supaUpdates.description = updates.description;
      if (updates.basePriceBDT !== undefined) {
        supaUpdates.selling_price = Number(updates.basePriceBDT);
        supaUpdates.final_price = Number(updates.basePriceBDT);
      }
      if (updates.originalPriceBDT !== undefined) supaUpdates.original_price = Number(updates.originalPriceBDT);
      if (updates.stock !== undefined) supaUpdates.stock_quantity = Number(updates.stock);
      if (updates.images !== undefined && Array.isArray(updates.images)) {
        supaUpdates.images = updates.images;
        supaUpdates.gallery_images = updates.images;
        if (updates.images[0]) supaUpdates.main_image = updates.images[0];
      }
      if (updates.isFeatured !== undefined || updates.isCodAvailable !== undefined || updates.category !== undefined) {
        supaUpdates.specifications = {
          ...(product?.specifications || {}),
          is_featured: updates.isFeatured !== undefined ? Boolean(updates.isFeatured) : product?.isFeatured,
          is_cod_available: updates.isCodAvailable !== undefined ? Boolean(updates.isCodAvailable) : product?.isCodAvailable,
          category: updates.category || product?.category,
        };
      }

      await supabaseServer.from('products').update(supaUpdates).eq('id', id);
    } catch (supaErr: any) {
      console.warn('[Admin product update sync]:', supaErr.message);
    }

    invalidateLiveProductsCache();
    res.json({ message: 'Product updated successfully', product });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update product' });
  }
});

// DELETE /api/admin/products/:id - Delete product
router.delete('/products/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const db = getDb();
    
    // Prune completely from local database
    db.products = db.products.filter((p) => p.id !== id && p.slug !== id);
    saveDatabase();
    invalidateLiveProductsCache();

    // Delete directly and archive in Supabase so it immediately disappears everywhere
    try {
      // 1. Mark archived and inactive first to ensure immediate exclusion from all customer queries
      await supabaseServer.from('products').update({
        status: 'archived',
        is_archived: true,
        is_active: false,
        updated_at: new Date().toISOString(),
      }).eq('id', id);

      // 2. Remove dependent rules/variants if foreign keys exist
      try {
        await supabaseServer.from('product_payment_rules').delete().eq('product_id', id);
        await supabaseServer.from('product_variants').delete().eq('product_id', id);
      } catch {}

      // 3. Delete product record from Supabase
      await supabaseServer.from('products').delete().eq('id', id);
      console.log('[Admin Product Delete]: Pruned product', id, 'from Supabase and local store.');
    } catch (supaErr: any) {
      console.warn('[Admin product delete sync]:', supaErr.message);
    }

    res.json({ message: 'Product deleted successfully', id });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete product' });
  }
});

// ==========================================
// 4. CUSTOMER MANAGEMENT
// ==========================================
// GET /api/admin/customers
router.get('/customers', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const db = getDb();
    const customerMap = new Map<string, any>();

    // 1. Add local registered users
    for (const u of db.users || []) {
      if (u.isAdmin) continue;
      const custObj = {
        id: u.id,
        authUserId: u.id,
        name: u.fullName || 'Customer',
        fullName: u.fullName || 'Customer',
        username: u.username || u.email?.split('@')[0],
        email: u.email,
        phone: u.mobile || '',
        mobile: u.mobile || '',
        country: u.country || 'Bangladesh',
        dob: u.dob || '1995-01-01',
        gender: u.gender || 'Male',
        role: 'customer',
        status: 'Active',
        createdAt: u.createdAt || new Date().toISOString(),
      };
      customerMap.set(u.email.toLowerCase(), custObj);
    }

    // 2. Query Supabase public.customers
    try {
      const { data: supaCustomers, error: custErr } = await supabaseServer
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (!custErr && supaCustomers && supaCustomers.length > 0) {
        for (const c of supaCustomers) {
          if (c.role === 'admin') continue;
          const emailKey = (c.email || c.id).toLowerCase();
          customerMap.set(emailKey, {
            id: c.id,
            authUserId: c.auth_user_id || c.id,
            name: c.full_name || c.name || 'Customer',
            fullName: c.full_name || c.name || 'Customer',
            username: c.username || c.email?.split('@')[0],
            email: c.email,
            phone: c.phone || c.mobile || '',
            mobile: c.mobile || c.phone || '',
            country: c.country || 'Bangladesh',
            dob: c.date_of_birth || c.dob || '1995-01-01',
            gender: c.gender || 'Male',
            role: c.role || 'customer',
            status: c.status || 'Active',
            createdAt: c.created_at,
          });
        }
      }
    } catch (err) {
      console.warn('[Admin customers query warning]:', err);
    }

    // 3. Query Supabase public.profiles
    try {
      const { data: supaProfiles, error: profErr } = await supabaseServer
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (!profErr && supaProfiles && supaProfiles.length > 0) {
        for (const p of supaProfiles) {
          if (p.role === 'admin') continue;
          const emailKey = (p.email || p.id).toLowerCase();
          const existing = customerMap.get(emailKey) || {};
          customerMap.set(emailKey, {
            id: p.id || existing.id,
            authUserId: p.id || existing.authUserId,
            name: p.full_name || existing.name || 'Customer',
            fullName: p.full_name || existing.fullName || 'Customer',
            username: p.username || existing.username || p.email?.split('@')[0],
            email: p.email || existing.email,
            phone: p.phone || existing.phone || '',
            mobile: p.phone || existing.mobile || '',
            country: p.country || existing.country || 'Bangladesh',
            dob: existing.dob || '1995-01-01',
            gender: existing.gender || 'Male',
            role: p.role || 'customer',
            status: existing.status || 'Active',
            createdAt: p.created_at || existing.createdAt || new Date().toISOString(),
          });
        }
      }
    } catch (err) {
      console.warn('[Admin profiles query warning]:', err);
    }

    const customers = Array.from(customerMap.values());
    res.json({ customers });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to load customers' });
  }
});

// ==========================================
// 5. WEBSITE SETTINGS
// ==========================================
// GET /api/admin/settings
router.get('/settings', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabaseServer.from('website_settings').select('*');
    const settingsMap: Record<string, any> = {};

    if (!error && data) {
      for (const row of data) {
        settingsMap[row.setting_key] = row.setting_value;
      }
    }

    res.json({ settings: settingsMap });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to load website settings' });
  }
});

// PUT /api/admin/settings/:key
router.put('/settings/:key', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    const { error } = await supabaseServer
      .from('website_settings')
      .upsert({ setting_key: key, setting_value: value, updated_at: new Date().toISOString() }, { onConflict: 'setting_key' });

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    res.json({ message: `Setting '${key}' saved successfully.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update setting' });
  }
});

// ==========================================
// 6. NOTIFICATION SYSTEM (ADMIN VIEW & BROADCAST)
// ==========================================
// GET /api/admin/notifications
router.get('/notifications', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const db = getDb();
    const notifMap = new Map<string, any>();

    // 1. Add local notifications
    for (const n of db.notifications || []) {
      notifMap.set(n.id, {
        id: n.id,
        title: n.title,
        message: n.message,
        type: n.type || 'system_alert',
        recipientType: 'all',
        isRead: Boolean(n.isRead),
        createdAt: n.createdAt,
      });
    }

    // 2. Fetch live notifications from Supabase
    try {
      const { data: supaNotifs, error } = await supabaseServer
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(supaNotifs)) {
        for (const row of supaNotifs) {
          notifMap.set(row.id, {
            id: row.id,
            title: row.title,
            message: row.message,
            type: row.type || 'system_alert',
            recipientType: row.recipient_type || 'all',
            targetCountry: row.target_country,
            recipientCustomerId: row.recipient_customer_id,
            recipientCustomerName: row.recipient_customer_name,
            link: row.link,
            isRead: Boolean(row.is_read),
            createdAt: row.created_at || row.sent_at || new Date().toISOString(),
          });
        }
      }
    } catch (err: any) {
      console.warn('[Admin Notifications Supabase Fetch Warning]:', err.message);
    }

    const notifications = Array.from(notifMap.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const unreadCount = notifications.filter((n) => !n.isRead).length;

    res.json({ notifications, unreadCount });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch admin notifications' });
  }
});

// POST /api/admin/notifications/broadcast
router.post('/notifications/broadcast', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { title, message, audience, targetCountry } = req.body;
    if (!title || !message) {
      res.status(400).json({ error: 'Title and message are required.' });
      return;
    }

    const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const recipientType = audience === 'country' ? 'country' : 'all';

    // 1. Supabase persistence
    const supaRow = {
      id: notifId,
      title: title.trim(),
      message: message.trim(),
      type: 'general_announcement',
      recipient_type: recipientType,
      target_country: recipientType === 'country' ? (targetCountry || 'Bangladesh') : null,
      link: '/',
      is_read: false,
      created_at: new Date().toISOString(),
      sent_at: new Date().toISOString(),
    };

    try {
      const { error: supaErr } = await supabaseServer.from('notifications').insert(supaRow);
      if (supaErr) {
        console.warn('[Supabase Broadcast Warning]:', supaErr.message);
      }
    } catch (supaErr: any) {
      console.warn('[Supabase Broadcast Error]:', supaErr.message);
    }

    // 2. Local store persistence
    const db = getDb();
    db.notifications.unshift({
      id: notifId,
      userId: 'all',
      title: title.trim(),
      message: message.trim(),
      type: 'announcement',
      isRead: false,
      createdAt: new Date().toISOString(),
    });
    saveDatabase();

    res.status(201).json({ message: 'Broadcast sent successfully', notification: supaRow });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to dispatch broadcast' });
  }
});

// PUT /api/admin/notifications/:id/read
router.put('/notifications/:id/read', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const db = getDb();
    const localNotif = db.notifications.find((n) => n.id === id);
    if (localNotif) {
      localNotif.isRead = true;
      saveDatabase();
    }

    try {
      await supabaseServer.from('notifications').update({ is_read: true }).eq('id', id);
    } catch {
      // Non-blocking
    }

    res.json({ success: true, message: 'Notification marked as read.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update notification' });
  }
});

// ==========================================
// 7. SUPPORT TICKETS MANAGEMENT
// ==========================================
// GET /api/admin/support-tickets
router.get('/support-tickets', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const db = getDb();
    const ticketMap = new Map<string, any>();

    // 1. Add local support messages
    for (const m of db.supportMessages || []) {
      ticketMap.set(m.id, {
        id: m.id,
        ticketNumber: m.ticketNumber || m.id,
        customerId: m.userId,
        customerName: m.name,
        customerEmail: m.email,
        customerPhone: m.phone,
        country: m.country,
        orderId: m.orderId,
        subject: m.subject,
        category: m.category,
        priority: 'medium',
        status: m.status,
        description: m.message,
        attachments: m.screenshotUrl ? [m.screenshotUrl] : [],
        createdAt: m.createdAt,
        updatedAt: m.updatedAt || m.createdAt,
      });
    }

    // 2. Query Supabase support_tickets
    try {
      const { data: supaTickets, error } = await supabaseServer
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(supaTickets)) {
        for (const row of supaTickets) {
          ticketMap.set(row.id, {
            id: row.id,
            ticketNumber: row.ticket_number || row.id,
            customerId: row.customer_id,
            customerName: row.customer_name || 'Customer',
            customerEmail: row.customer_email || '',
            customerPhone: row.customer_phone || '',
            country: row.country || 'Global',
            orderId: row.order_id || null,
            subject: row.subject || 'Support Ticket',
            category: row.category || 'General',
            priority: row.priority || 'medium',
            status: row.status || 'open',
            description: row.description || '',
            attachments: Array.isArray(row.attachments) ? row.attachments : [],
            createdAt: row.created_at || new Date().toISOString(),
            updatedAt: row.updated_at || row.created_at || new Date().toISOString(),
          });
        }
      }
    } catch (err: any) {
      console.warn('[Admin Support Tickets Supabase Fetch Warning]:', err.message);
    }

    const tickets = Array.from(ticketMap.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    res.json({ tickets, total: tickets.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch support tickets' });
  }
});

// PUT /api/admin/support-tickets/:id/status
router.put('/support-tickets/:id/status', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'open' | 'in_progress' | 'resolved' | 'closed'

    if (!status) {
      res.status(400).json({ error: 'Status is required.' });
      return;
    }

    const db = getDb();
    const local = (db.supportMessages || []).find((m) => m.id === id || m.ticketNumber === id);
    if (local) {
      local.status = status;
      local.updatedAt = new Date().toISOString();
      saveDatabase();
    }

    try {
      await supabaseServer
        .from('support_tickets')
        .update({ status, updated_at: new Date().toISOString() })
        .or(`id.eq.${id},ticket_number.eq.${id}`);
    } catch (supaErr: any) {
      console.warn('[Supabase support ticket update]:', supaErr.message);
    }

    res.json({ success: true, message: `Support ticket status updated to ${status}.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update ticket status' });
  }
});

export default router;
