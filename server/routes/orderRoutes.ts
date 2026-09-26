import { Router, Response } from 'express';
import { AuthenticatedRequest, requireAuth } from '../middleware/authMiddleware';
import { getDb, saveDatabase } from '../db';
import { Address, Order, OrderItem, OrderTimelineItem, SupportedCountry } from '../../src/types';
import { COUNTRY_CURRENCIES, DELIVERY_CONFIGS, convertPrice } from '../../src/config/countries';
import { supabase, supabaseServer } from '../supabase';
import { getLiveProducts, mapSupabaseProductRow } from './productRoutes';

const router = Router();

// ==========================================
// SAVED ADDRESSES
// ==========================================

// GET /api/addresses
router.get('/addresses', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;
  const db = getDb();
  const addresses = db.addresses.filter((a) => a.userId === user.id);
  res.json({ addresses });
});

// POST /api/addresses
router.post('/addresses', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const user = req.user!;
    const {
      country,
      fullName,
      phone,
      fullAddress,
      isDefault,
      // Bangladesh
      division,
      district,
      upazila,
      area,
      postalCode,
      // India
      state,
      city,
      pinCode,
      // Pakistan
      province,
    } = req.body;

    if (!country || !fullName || !phone || !fullAddress) {
      res.status(400).json({ error: 'Name, phone, country, and full address are required.' });
      return;
    }

    // Country specific validation
    if (country === 'Bangladesh') {
      if (!division || !district) {
        res.status(400).json({ error: 'Division and District are required for Bangladesh addresses.' });
        return;
      }
    } else if (country === 'India') {
      if (!state || !city || !pinCode) {
        res.status(400).json({ error: 'State, City, and PIN Code are required for India addresses.' });
        return;
      }
    } else if (country === 'Pakistan') {
      if (!province || !city) {
        res.status(400).json({ error: 'Province and City are required for Pakistan addresses.' });
        return;
      }
    }

    const db = getDb();
    const userAddresses = db.addresses.filter((a) => a.userId === user.id);
    const shouldBeDefault = isDefault || userAddresses.length === 0;

    if (shouldBeDefault) {
      userAddresses.forEach((a) => (a.isDefault = false));
    }

    const newAddress: Address = {
      id: `addr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: user.id,
      country,
      fullName: fullName.trim(),
      phone: phone.trim(),
      fullAddress: fullAddress.trim(),
      isDefault: shouldBeDefault,
      division,
      district,
      upazila,
      area,
      postalCode,
      state,
      city,
      pinCode,
      province,
    };

    db.addresses.push(newAddress);
    saveDatabase();

    res.status(201).json({ message: 'Address saved successfully.', address: newAddress });
  } catch (err) {
    console.error('Save address error:', err);
    res.status(500).json({ error: 'Internal server error while saving address.' });
  }
});

// PUT /api/addresses/:id
router.put('/addresses/:id', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const user = req.user!;
    const db = getDb();
    const address = db.addresses.find((a) => a.id === req.params.id && a.userId === user.id);

    if (!address) {
      res.status(404).json({ error: 'Address not found.' });
      return;
    }

    const {
      country,
      fullName,
      phone,
      fullAddress,
      isDefault,
      division,
      district,
      upazila,
      area,
      postalCode,
      state,
      city,
      pinCode,
      province,
    } = req.body;

    if (fullName) address.fullName = fullName.trim();
    if (phone) address.phone = phone.trim();
    if (fullAddress) address.fullAddress = fullAddress.trim();
    if (country) address.country = country;
    if (division !== undefined) address.division = division;
    if (district !== undefined) address.district = district;
    if (upazila !== undefined) address.upazila = upazila;
    if (area !== undefined) address.area = area;
    if (postalCode !== undefined) address.postalCode = postalCode;
    if (state !== undefined) address.state = state;
    if (city !== undefined) address.city = city;
    if (pinCode !== undefined) address.pinCode = pinCode;
    if (province !== undefined) address.province = province;

    if (isDefault) {
      db.addresses.filter((a) => a.userId === user.id && a.id !== address.id).forEach((a) => (a.isDefault = false));
      address.isDefault = true;
    }

    saveDatabase();
    res.json({ message: 'Address updated successfully.', address });
  } catch (err) {
    console.error('Update address error:', err);
    res.status(500).json({ error: 'Internal server error while updating address.' });
  }
});

// DELETE /api/addresses/:id
router.delete('/addresses/:id', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const user = req.user!;
    const db = getDb();
    const index = db.addresses.findIndex((a) => a.id === req.params.id && a.userId === user.id);

    if (index === -1) {
      res.status(404).json({ error: 'Address not found.' });
      return;
    }

    const wasDefault = db.addresses[index].isDefault;
    db.addresses.splice(index, 1);

    // If deleted address was default, make another one default
    if (wasDefault) {
      const remaining = db.addresses.filter((a) => a.userId === user.id);
      if (remaining.length > 0) {
        remaining[0].isDefault = true;
      }
    }

    saveDatabase();
    res.json({ message: 'Address deleted successfully.' });
  } catch (err) {
    console.error('Delete address error:', err);
    res.status(500).json({ error: 'Internal server error while deleting address.' });
  }
});

// PUT /api/addresses/:id/default
router.put('/addresses/:id/default', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const user = req.user!;
    const db = getDb();
    const address = db.addresses.find((a) => a.id === req.params.id && a.userId === user.id);

    if (!address) {
      res.status(404).json({ error: 'Address not found.' });
      return;
    }

    db.addresses.filter((a) => a.userId === user.id).forEach((a) => {
      a.isDefault = a.id === address.id;
    });

    saveDatabase();
    res.json({ message: 'Default address updated.', address });
  } catch (err) {
    console.error('Set default address error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ==========================================
// WISHLIST
// ==========================================

// GET /api/wishlist
router.get('/wishlist', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const user = req.user!;
  const db = getDb();
  const productIds = db.wishlists[user.id] || [];
  const liveProducts = await getLiveProducts();
  const productMap = new Map<string, any>();
  for (const p of db.products) productMap.set(p.id, p);
  for (const p of liveProducts) productMap.set(p.id, p);
  const products = productIds.map((id) => productMap.get(id)).filter(Boolean);
  res.json({ productIds, products });
});

// POST /api/wishlist/toggle
router.post('/wishlist/toggle', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;
  const { productId } = req.body;
  if (!productId) {
    res.status(400).json({ error: 'Product ID is required.' });
    return;
  }

  const db = getDb();
  if (!db.wishlists[user.id]) {
    db.wishlists[user.id] = [];
  }

  const list = db.wishlists[user.id];
  const exists = list.includes(productId);
  if (exists) {
    db.wishlists[user.id] = list.filter((id) => id !== productId);
  } else {
    db.wishlists[user.id].push(productId);
  }

  saveDatabase();

  res.json({
    isInWishlist: !exists,
    wishlistCount: db.wishlists[user.id].length,
    productIds: db.wishlists[user.id],
  });
});

// ==========================================
// ORDERS
// ==========================================

// GET /api/orders
router.get('/orders', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const user = req.user!;
  const status = req.query.status as string;
  const db = getDb();

  let userOrders = db.orders.filter((o) => o.userId === user.id);

  // Attempt to query Supabase orders for this user
  try {
    const { data: supaOrders, error } = await supabaseServer
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && supaOrders && supaOrders.length > 0) {
      userOrders = supaOrders.map((o: any) => ({
        ...o,
        id: o.id,
        userId: o.user_id,
        customerName: o.customer_name,
        customerEmail: o.customer_email,
        customerMobile: o.customer_mobile || o.customer_phone,
        totalAmount: Number(o.total_amount) || 0,
        amountPaidOnline: Number(o.amount_paid_online) || 0,
        remainingCodAmount: Number(o.remaining_cod_amount) || 0,
        paymentMethod: o.payment_method,
        isCod: Boolean(o.is_cod),
        paymentStatus: o.payment_status,
        orderStatus: o.order_status,
        deliveryAddress: o.delivery_address || o.shipping_address,
        items: o.items || [],
        paymentProof: o.payment_proof,
        timeline: o.timeline || [],
        createdAt: o.created_at,
      }));
    }
  } catch (err) {
    console.warn('[Supabase Orders]: user orders fallback:', err);
  }

  if (status && status !== 'All') {
    userOrders = userOrders.filter((o) => o.orderStatus.toLowerCase() === status.toLowerCase());
  }

  // Sort newest first
  userOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({ orders: userOrders });
});

// GET /api/orders/:id
router.get('/orders/:id', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const user = req.user!;
  const db = getDb();
  let order = db.orders.find((o) => o.id === req.params.id && o.userId === user.id);

  if (!order) {
    try {
      const { data: supaOrder, error } = await supabaseServer
        .from('orders')
        .select('*')
        .eq('id', req.params.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (!error && supaOrder) {
        order = {
          ...supaOrder,
          id: supaOrder.id,
          userId: supaOrder.user_id,
          customerName: supaOrder.customer_name,
          customerEmail: supaOrder.customer_email,
          customerMobile: supaOrder.customer_mobile || supaOrder.customer_phone,
          totalAmount: Number(supaOrder.total_amount) || 0,
          amountPaidOnline: Number(supaOrder.amount_paid_online) || 0,
          remainingCodAmount: Number(supaOrder.remaining_cod_amount) || 0,
          paymentMethod: supaOrder.payment_method,
          isCod: Boolean(supaOrder.is_cod),
          paymentStatus: supaOrder.payment_status,
          orderStatus: supaOrder.order_status,
          deliveryAddress: supaOrder.delivery_address || supaOrder.shipping_address,
          items: supaOrder.items || [],
          paymentProof: supaOrder.payment_proof,
          timeline: supaOrder.timeline || [],
          createdAt: supaOrder.created_at,
        };
      }
    } catch {
      // Continue
    }
  }

  if (!order) {
    res.status(404).json({ error: 'Order not found.' });
    return;
  }

  res.json({ order });
});

// POST /api/orders - Place order
router.post('/orders', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const {
      addressId,
      items, // array of { productId, quantity, selectedVariants }
      paymentMethod, // 'cod' | 'bkash' | 'nagad' | 'upay' | 'binance_usd' | 'card' | 'upi'
      isCod,
      country, // SupportedCountry
      isOutsideCity,
      paymentProof, // optional initial payment proof if provided at checkout
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'Your cart is empty. Please add items to proceed.' });
      return;
    }

    const db = getDb();

    const orderCountry: SupportedCountry = country || (req.body.deliveryAddress?.country) || user.country;
    const currencyConfig = COUNTRY_CURRENCIES[orderCountry] || COUNTRY_CURRENCIES['Bangladesh'];
    const deliveryConfig = DELIVERY_CONFIGS[orderCountry] || DELIVERY_CONFIGS['Bangladesh'];

    // Resolve delivery address: check by ID or construct from inline deliveryAddress
    let address = addressId ? db.addresses.find((a) => a.id === addressId && a.userId === user.id) : null;
    if (!address && req.body.deliveryAddress) {
      const inline = req.body.deliveryAddress;
      const addrId = `addr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      address = {
        id: addrId,
        userId: user.id,
        country: inline.country || orderCountry,
        fullName: inline.fullName || user.fullName,
        phone: inline.phone || inline.mobileNumber || user.mobile,
        mobileNumber: inline.mobileNumber || inline.phone || user.mobile,
        fullAddress: inline.fullAddress || inline.streetAddress || '',
        streetAddress: inline.streetAddress || inline.fullAddress || '',
        isDefault: false,
        division: inline.division || inline.divisionOrState,
        divisionOrState: inline.divisionOrState || inline.division,
        district: inline.district || inline.districtOrCity,
        districtOrCity: inline.districtOrCity || inline.district,
        upazila: inline.upazila || inline.upazilaThana,
        upazilaThana: inline.upazilaThana || inline.upazila,
        area: inline.area,
        postalCode: inline.postalCode || inline.pinCode,
        state: inline.state || inline.divisionOrState,
        city: inline.city || inline.districtOrCity,
        pinCode: inline.pinCode || inline.postalCode,
        province: inline.province || inline.divisionOrState,
      };
      if (req.body.saveAddress) {
        db.addresses.push(address);
      }
    }

    if (!address) {
      res.status(400).json({ error: 'Please provide or select a valid delivery address.' });
      return;
    }

    const isCodResolved = isCod !== undefined ? Boolean(isCod) : paymentMethod === 'cod';

    // Resolve live products dynamically so no product-not-found occurs for available products
    const liveProducts = await getLiveProducts();
    const orderItems: OrderItem[] = [];
    let productSubtotal = 0;

    for (const item of items) {
      const pid = item.productId || (item as any).id || (item as any).slug;

      // 1. Check liveProducts (by ID, then by slug)
      let prod = liveProducts.find(
        (p) => p.id === pid || (p.slug && pid && p.slug.toLowerCase() === pid.toLowerCase())
      );

      // 2. Check local db.products (by ID, then by slug)
      if (!prod && pid) {
        prod = db.products.find(
          (p) => p.id === pid || (p.slug && p.slug.toLowerCase() === pid.toLowerCase())
        );
      }

      // 3. Directly query Supabase for this product using service role client
      if (!prod && pid) {
        try {
          const { data: row } = await supabaseServer
            .from('products')
            .select(`
              *,
              product_payment_rules (*),
              product_variants (*)
            `)
            .or(`id.eq.${pid},slug.eq.${pid}`)
            .maybeSingle();

          if (row) {
            prod = mapSupabaseProductRow(row);
            const existingIdx = db.products.findIndex((p) => p.id === prod!.id);
            if (existingIdx >= 0) {
              db.products[existingIdx] = prod;
            } else {
              db.products.push(prod);
            }
            saveDatabase();
          }
        } catch (supaErr) {
          console.warn('[orderRoutes] Direct product query note:', supaErr);
        }
      }

      // 4. Check by product name if available in payload
      if (!prod && item.name) {
        prod =
          liveProducts.find((p) => p.name.toLowerCase() === item.name.toLowerCase()) ||
          db.products.find((p) => p.name.toLowerCase() === item.name.toLowerCase());
      }

      // 5. Robust fallback: Never fail checkout with product-not-found if item was selected by customer
      if (!prod) {
        const basePrice = Number(
          item.basePriceBDT ??
          (item.price && orderCountry !== 'Bangladesh'
            ? Math.round(item.price / (COUNTRY_CURRENCIES[orderCountry]?.exchangeRateFromBDT || 1))
            : item.price || 1000)
        );
        prod = {
          id: pid || `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: item.name || 'Catalog Item',
          slug: item.slug || pid || 'product',
          brand: 'Verified Brand',
          category: 'General',
          description: '',
          basePriceBDT: basePrice,
          stock: 999,
          images: item.image ? [item.image] : ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80'],
          isCodEligible: !item.direct_payment_required,
          isCodAvailable: !item.direct_payment_required,
          isFeatured: false,
          rating: 5.0,
          reviewCount: 0,
          features: [],
          specifications: {},
          shippingInfo: 'Ships within 24-48 hours via express courier with real-time tracking.',
          returnPolicy: '7-day replacement policy for verified manufacturing defects.',
          warrantyInfo: '1-Year Official International Manufacturer Warranty.',
        };
        db.products.push(prod);
        saveDatabase();
      }

      if (!prod) {
        res.status(400).json({ error: `Product with ID ${item.productId} was not found.` });
        return;
      }

      if (isCodResolved && prod.isCodEligible === false) {
        res.status(400).json({
          error: `Product "${prod.name}" is not eligible for Cash on Delivery (Prepaid only). Please remove this item or choose online prepaid payment.`,
        });
        return;
      }

      const unitPrice = prod.basePriceBDT
        ? convertPrice(prod.basePriceBDT, orderCountry)
        : Number(item.price || 0);
      const lineSubtotal = unitPrice * item.quantity;
      productSubtotal += lineSubtotal;

      orderItems.push({
        productId: prod.id,
        name: prod.name,
        image: prod.images[0] || item.image || '',
        selectedVariants: item.selectedVariants,
        quantity: item.quantity,
        unitPrice,
        subtotal: lineSubtotal,
      });
    }

    // Delivery Charge Calculation (100 inside Dhaka, 150 outside Dhaka; 150 for India; 450 for Pakistan)
    let deliveryCharge = deliveryConfig.defaultCodCharge;
    if (orderCountry === 'Bangladesh') {
      const districtName = (address.district || address.districtOrCity || address.city || '').trim().toLowerCase();
      const isOutsideDhaka = isOutsideCity ?? (districtName !== 'dhaka' && districtName !== '');
      deliveryCharge = isOutsideDhaka ? 150 : 100;
    } else if (isOutsideCity && deliveryConfig.outsideCityCharge) {
      deliveryCharge = deliveryConfig.outsideCityCharge;
    }

    const discount = 0; // Discount already reflected in base pricing or promotional pricing
    const tax = 0; // Tax is strictly disabled at this stage per Section 32!
    const totalAmount = productSubtotal - discount + deliveryCharge;

    // COD vs Prepaid calculation (Section 25 & 31)
    let amountPaidOnline = 0;
    let remainingCodAmount = 0;
    let paymentStatus: 'pending_verification' | 'paid' | 'verified' = 'pending_verification';

    if (isCodResolved) {
      // For COD: Customer pays ONLY Delivery Charge online
      amountPaidOnline = deliveryCharge;
      remainingCodAmount = productSubtotal - discount;
      paymentStatus = 'pending_verification';
    } else {
      // Normal prepaid: Full amount paid
      amountPaidOnline = totalAmount;
      remainingCodAmount = 0;
      paymentStatus = paymentMethod === 'card' ? 'paid' : 'pending_verification';
    }

    const countryPrefix = orderCountry === 'Bangladesh' ? 'BD' : orderCountry === 'India' ? 'IN' : 'PK';
    const orderId = req.body.id || `${countryPrefix}-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    const orderNumber = req.body.order_number || `INTL-${Date.now().toString().slice(-6)}`;

    const resolvedProof = paymentProof || (req.body.senderPhoneOrId || req.body.transactionId ? {
      method: req.body.selectedPaymentMethodId || paymentMethod,
      senderInfo: req.body.senderPhoneOrId || '',
      transactionId: req.body.transactionId || '',
      screenshotUrl: req.body.proofScreenshotUrl || undefined,
      submittedAt: new Date().toISOString(),
    } : undefined);

    const initialTimeline: OrderTimelineItem[] = [
      {
        status: 'Order Placed',
        title: 'Order Placed Successfully',
        description: `Order #${orderId} was recorded on our system.`,
        timestamp: new Date().toISOString(),
        completed: true,
      },
      {
        status: 'Payment/Delivery Charge Verification',
        title: isCod ? 'Delivery Charge Verification' : 'Payment Verification',
        description: isCod
          ? `Delivery charge of ${currencyConfig.symbol}${deliveryCharge} online payment submitted and pending verification.`
          : 'Payment awaiting verification.',
        timestamp: new Date().toISOString(),
        completed: paymentStatus === 'paid',
      },
      {
        status: 'Processing',
        title: 'Order Processing & Quality Check',
        description: 'Items will be inspected and packed in tamper-proof security carton.',
        timestamp: '',
        completed: false,
      },
      {
        status: 'Shipped',
        title: 'Dispatched with Courier',
        description: 'Parcel handed over to regional courier with real-time tracking.',
        timestamp: '',
        completed: false,
      },
      {
        status: 'Delivered',
        title: 'Out for Delivery & Collection',
        description: isCod
          ? `Delivery courier will collect remaining COD amount of ${currencyConfig.symbol}${remainingCodAmount} in cash.`
          : 'Parcel delivered directly to recipient.',
        timestamp: '',
        completed: false,
      },
    ];

    const newOrder: Order = {
      id: orderId,
      userId: user.id,
      customerName: address.fullName || user.fullName,
      customerEmail: user.email,
      customerMobile: address.phone || user.mobile,
      country: orderCountry,
      currency: currencyConfig.code,
      exchangeRate: currencyConfig.exchangeRateFromBDT,
      deliveryAddress: address,
      items: orderItems,
      productSubtotal,
      discount,
      deliveryCharge,
      tax,
      totalAmount,
      paymentMethod,
      isCod: isCodResolved,
      amountPaidOnline,
      remainingCodAmount,
      paymentStatus,
      paymentProof: resolvedProof,
      orderStatus: 'Pending',
      timeline: initialTimeline,
      createdAt: new Date().toISOString(),
    };

    db.orders.unshift(newOrder);

    // Create user notification
    db.notifications.unshift({
      id: `notif-${Date.now()}`,
      userId: user.id,
      title: `Order #${orderId} Placed`,
      message: isCod
        ? `Your Cash on Delivery order has been registered. Online delivery charge payment is pending verification. Remaining ${currencyConfig.symbol}${remainingCodAmount} will be collected upon delivery.`
        : `Your prepaid order #${orderId} was registered successfully. Total: ${currencyConfig.symbol}${totalAmount}.`,
      type: 'order',
      isRead: false,
      createdAt: new Date().toISOString(),
      orderId,
    });

    // Create admin notification
    db.notifications.unshift({
      id: `notif-admin-${Date.now()}`,
      userId: 'admin',
      title: `New Order: #${orderId}`,
      message: `Order of ${currencyConfig.symbol}${totalAmount} placed by ${newOrder.customerName} (${orderCountry}).`,
      type: 'order',
      isRead: false,
      createdAt: new Date().toISOString(),
      orderId,
    });

    saveDatabase();

    // Async sync to Supabase public.orders and public.payments
    (async () => {
      try {
        const requiresDirectPayment = (newOrder.items || []).some((item: any) => item.direct_payment_required);
        const paymentType = req.body.paymentType || (requiresDirectPayment ? 'DIRECT_PAYMENT_REQUIRED' : (newOrder.isCod ? 'COD' : 'ONLINE_PAYMENT'));
        const isCodOrder = !requiresDirectPayment && newOrder.isCod;

        const customerUsername = user.username || user.fullName?.replace(/\s+/g, '_').toLowerCase() || user.email.split('@')[0];

        const { error: orderSyncErr } = await supabaseServer.from('orders').upsert({
          id: newOrder.id,
          order_number: orderNumber,
          customer_id: newOrder.userId,
          customer_name: newOrder.customerName,
          customer_username: customerUsername,
          customer_email: newOrder.customerEmail,
          customer_mobile: newOrder.customerMobile,
          country: newOrder.country,
          shipping_address: newOrder.deliveryAddress,
          delivery_address: JSON.stringify(newOrder.deliveryAddress),
          items: newOrder.items,
          product_total: newOrder.productSubtotal,
          delivery_charge: newOrder.deliveryCharge,
          grand_total: newOrder.totalAmount,
          online_paid: newOrder.amountPaidOnline || 0,
          cod_remaining: newOrder.remainingCodAmount || 0,
          advance_paid_amount: newOrder.amountPaidOnline || 0,
          advance_transaction_id: resolvedProof?.transactionId || null,
          payment_proof_url: resolvedProof?.screenshotUrl || null,
          payment_method: newOrder.paymentMethod,
          payment_type: paymentType,
          is_cod: isCodOrder,
          order_status: 'pending',
          payment_status: isCodOrder ? 'pending' : (resolvedProof ? 'submitted' : 'pending'),
          currency: newOrder.currency,
          created_at: newOrder.createdAt,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });

        if (orderSyncErr) {
          console.log('[Supabase Orders Sync Note]:', orderSyncErr.message);
        } else {
          console.log('[Supabase Orders Sync Success]: Order', newOrder.id, 'synced to Supabase');
        }

        // Trigger Admin Notification in Supabase notifications table
        const adminOrderNotif = {
          id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          title: `New Order: #${newOrder.id}`,
          message: `Order of ${newOrder.currency} ${newOrder.totalAmount} placed by ${newOrder.customerName} (${newOrder.country}).`,
          type: 'order_update',
          recipient_type: 'all',
          target_country: newOrder.country,
          recipient_customer_id: newOrder.userId,
          recipient_customer_name: newOrder.customerName,
          link: '/admin',
          is_read: false,
          created_at: new Date().toISOString(),
          sent_at: new Date().toISOString(),
        };
        await supabaseServer.from('notifications').insert(adminOrderNotif);

        // Sync payment proof to payments table if provided
        if (resolvedProof && (resolvedProof.senderInfo || resolvedProof.transactionId)) {
          const { error: pmtSyncErr } = await supabaseServer.from('payments').insert({
            id: `pmt_${Date.now()}`,
            order_id: newOrder.id,
            order_number: orderNumber,
            customer_id: newOrder.userId,
            customer_name: newOrder.customerName,
            amount: newOrder.totalAmount,
            currency: newOrder.currency,
            payment_method: newOrder.paymentMethod,
            sender_number: resolvedProof.senderInfo,
            transaction_id: resolvedProof.transactionId,
            payment_screenshot: resolvedProof.screenshotUrl || '',
            status: 'pending',
          });
          if (pmtSyncErr) {
            console.log('[Supabase Payments Sync Note]:', pmtSyncErr.message);
          }
        }
      } catch (err: any) {
        console.log('[Supabase Sync Error]:', err.message);
      }
    })();

    res.status(201).json({
      message: 'Order placed successfully.',
      order: newOrder,
    });
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ error: 'Internal server error during order creation.' });
  }
});

// POST /api/orders/:id/payment-proof - Submit payment proof for COD delivery charge or prepaid transfer
router.post('/orders/:id/payment-proof', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const user = req.user!;
    const { method, senderInfo, transactionId, screenshotUrl, notes } = req.body;

    if (!method || !senderInfo || !transactionId) {
      res.status(400).json({ error: 'Payment method, sender mobile/account, and Transaction ID are required.' });
      return;
    }

    const db = getDb();
    const order = db.orders.find((o) => o.id === req.params.id && o.userId === user.id);

    if (!order) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }

    order.paymentProof = {
      method,
      senderInfo: senderInfo.trim(),
      transactionId: transactionId.trim(),
      screenshotUrl,
      submittedAt: new Date().toISOString(),
      notes,
    };

    // Strictly set to pending_verification per Section 26, 27, 28, 30
    order.paymentStatus = 'pending_verification';

    // Update timeline
    const verificationStep = order.timeline.find((t) => t.status.includes('Verification'));
    if (verificationStep) {
      verificationStep.description = `Payment proof submitted via ${method} (TrxID: ${transactionId}). Pending verification by finance department.`;
      verificationStep.timestamp = new Date().toISOString();
    }

    // Add notification
    db.notifications.unshift({
      id: `notif-${Date.now()}`,
      userId: user.id,
      title: 'Payment Proof Submitted',
      message: `Proof of payment for Order #${order.id} via ${method} (TrxID: ${transactionId}) has been received and is pending verification.`,
      type: 'payment',
      isRead: false,
      createdAt: new Date().toISOString(),
      orderId: order.id,
    });

    saveDatabase();

    // Sync payment proof to Supabase payments table
    (async () => {
      try {
        await supabaseServer.from('payments').insert({
          id: `pmt_${Date.now()}`,
          order_id: order.id,
          order_number: order.id,
          customer_id: user.id,
          customer_name: order.customerName,
          amount: order.totalAmount,
          currency: order.currency,
          payment_method: method,
          sender_number: senderInfo.trim(),
          transaction_id: transactionId.trim(),
          payment_screenshot: screenshotUrl || '',
          status: 'pending',
        });
      } catch (pmtErr: any) {
        console.log('[Supabase Payment Proof Sync Notice]:', pmtErr.message);
      }
    })();

    res.json({
      message: 'Payment proof submitted successfully. Your payment is now pending verification.',
      order,
    });
  } catch (err) {
    console.error('Payment proof submission error:', err);
    res.status(500).json({ error: 'Internal server error while submitting payment proof.' });
  }
});

export default router;
