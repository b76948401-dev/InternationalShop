import { Router, Request, Response } from 'express';
import { getDb, saveDatabase } from '../db';
import { AuthenticatedRequest, requireAuth } from '../middleware/authMiddleware';
import { COUNTRY_CURRENCIES, convertPrice } from '../../src/config/countries';
import { Product, ProductReview, SupportedCountry, ProductVariant } from '../../src/types';
import { supabase, supabaseServer } from '../supabase';

const router = Router();

const DEFAULT_CATEGORIES = [
  'Audio & Gadgets',
  'Computers & Laptops',
  'Smartphones & Tablets',
  'Home & Kitchen',
  'Wearables & Smartwatches',
  'Gaming & Consoles',
];

// Helper to map Supabase product row with payment rules and variants
export function mapSupabaseProductRow(row: any): Product {
  // Map variants
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

  // Map COD and payment rules
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
    category: row.category_name || row.category || row.specifications?.category || (row.category_id ? 'Electronics' : 'Audio & Gadgets'),
    description: row.description || '',
    basePriceBDT: basePrice,
    originalPriceBDT: origPrice,
    discountPercentage: Number(row.discount_percentage ?? row.specifications?.discount_percentage ?? discountPct ?? 0),
    stock: Number(row.stock_quantity ?? row.stock ?? 0),
    images:
      Array.isArray(row.images) && row.images.length > 0
        ? row.images
        : row.main_image
        ? [row.main_image]
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
    isFeatured: Boolean(row.is_featured ?? row.specifications?.is_featured ?? false),
    rating: Number(row.rating ?? row.specifications?.rating ?? 5.0),
    reviewCount: Number(row.reviews_count ?? row.specifications?.reviews_count ?? 0),
    features: Array.isArray(row.features) ? row.features : [],
    specifications: typeof row.specifications === 'object' ? row.specifications : {},
    shippingInfo: 'Ships within 24-48 hours via express courier with real-time tracking.',
    returnPolicy: '7-day replacement policy for verified manufacturing defects.',
    warrantyInfo: '1-Year Official International Manufacturer Warranty.',
  };
}

// Helper to filter demo/placeholder products
const isDemoProduct = (id: string, name?: string) =>
  /^prod-0(0[1-9]|1[0-5])$/.test(id) ||
  id === 'prod-1789722236197-mwo2' ||
  (Boolean(name) && String(name).toLowerCase().includes('sony wh-1000xm6'));

// In-memory cache for live products to prevent latency and connection thrashing
let cachedLiveProducts: Product[] | null = null;
let lastLiveFetchTime = 0;
const LIVE_PRODUCTS_CACHE_TTL_MS = 25 * 1000; // 25 seconds cache
let activeFetchPromise: Promise<Product[]> | null = null;

export function invalidateLiveProductsCache(): void {
  cachedLiveProducts = null;
  lastLiveFetchTime = 0;
}

// Helper to load live products from Supabase or fallback
export async function getLiveProducts(forceFresh = false): Promise<Product[]> {
  const now = Date.now();
  // Return from fresh cache if available
  if (!forceFresh && cachedLiveProducts && (now - lastLiveFetchTime < LIVE_PRODUCTS_CACHE_TTL_MS)) {
    return cachedLiveProducts;
  }

  // Deduplicate concurrent inflight requests
  if (activeFetchPromise) {
    return activeFetchPromise;
  }

  activeFetchPromise = (async () => {
    const db = getDb();
    const productMap = new Map<string, Product>();

    // 1. Query live active products from Supabase with a 3000ms safety timeout
    try {
      const fetchPromise = supabaseServer
        .from('products')
        .select(`
          *,
          product_payment_rules (*),
          product_variants (*)
        `)
        .eq('status', 'active')
        .eq('is_archived', false);

      const timeoutPromise = new Promise<{ data: null; error: Error }>((_, reject) =>
        setTimeout(() => reject(new Error('Supabase product query timed out after 3000ms')), 3000)
      );

      const { data: products, error } = await Promise.race([fetchPromise, timeoutPromise]);

      if (!error && Array.isArray(products) && products.length > 0) {
        const activeProducts: Product[] = [];
        for (const row of products) {
          if (!isDemoProduct(row.id, row.name || row.title)) {
            const mapped = mapSupabaseProductRow(row);
            productMap.set(mapped.id, mapped);
            activeProducts.push(mapped);
          }
        }

        if (activeProducts.length > 0) {
          // Update local store so persistent fallback is always fresh
          db.products = activeProducts;
          saveDatabase();
          cachedLiveProducts = activeProducts;
          lastLiveFetchTime = Date.now();
          return activeProducts;
        }
      }
    } catch (err: any) {
      console.warn('[Supabase Products] Fallback to persistent local store:', err?.message || err);
    }

    // 2. Fallback to local store if Supabase returned 0 items or timed out
    for (const p of db.products || []) {
      if (!isDemoProduct(p.id, p.name) && p.status !== 'archived' && !p.is_archived) {
        productMap.set(p.id, p);
      }
    }

    const fallbackProducts = Array.from(productMap.values());
    if (fallbackProducts.length > 0) {
      cachedLiveProducts = fallbackProducts;
      lastLiveFetchTime = Date.now();
    }
    return fallbackProducts;
  })().finally(() => {
    activeFetchPromise = null;
  });

  return activeFetchPromise;
}

// GET /api/products/budget - Budget-based product finder
router.get('/budget', async (req: Request, res: Response): Promise<void> => {
  try {
    const liveProducts = await getLiveProducts();
    const minBudget = parseFloat(req.query.minBudget as string) || 0;
    const maxBudget = parseFloat(req.query.maxBudget as string) || Infinity;
    const country = (req.query.country as SupportedCountry) || 'Bangladesh';

    const matching = liveProducts.filter((p) => {
      const localPrice = convertPrice(p.basePriceBDT, country);
      return localPrice >= minBudget && localPrice <= maxBudget;
    });

    res.json({
      country,
      currency: COUNTRY_CURRENCIES[country]?.code || 'BDT',
      symbol: COUNTRY_CURRENCIES[country]?.symbol || '৳',
      minBudget,
      maxBudget,
      count: matching.length,
      products: matching,
    });
  } catch (err) {
    console.error('Budget finder error:', err);
    res.status(500).json({ error: 'Failed to find products within specified budget.' });
  }
});

// GET /api/products/offers - Active promotional offers
router.get('/offers', async (req: Request, res: Response): Promise<void> => {
  try {
    const liveProducts = await getLiveProducts();
    const now = new Date();

    const offerProducts = liveProducts
      .filter((p) => p.offer)
      .map((p) => {
        const isExpired = new Date(p.offer!.expiresAt) < now;
        return {
          ...p,
          offer: {
            ...p.offer!,
            isExpired,
          },
        };
      });

    res.json({
      activeOffers: offerProducts.filter((p) => !p.offer?.isExpired),
      expiredOffers: offerProducts.filter((p) => p.offer?.isExpired),
      allOffers: offerProducts,
    });
  } catch (err) {
    console.error('Offers fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch offers.' });
  }
});

// GET /api/products - List, filter, and search
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const liveProducts = await getLiveProducts();
    let results = [...liveProducts];

    const search = (req.query.search as string)?.trim().toLowerCase();
    const category = (req.query.category as string)?.trim();
    const brand = (req.query.brand as string)?.trim();
    const minRating = parseFloat(req.query.minRating as string);
    const inStockOnly = req.query.inStock === 'true';
    const discountOnly = req.query.discountOnly === 'true';
    const country = (req.query.country as SupportedCountry) || 'Bangladesh';
    const minPrice = parseFloat(req.query.minPrice as string);
    const maxPrice = parseFloat(req.query.maxPrice as string);
    const sort = (req.query.sort as string) || 'featured';

    // Search query
    if (search) {
      results = results.filter(
        (p) =>
          p.name.toLowerCase().includes(search) ||
          p.brand.toLowerCase().includes(search) ||
          p.category.toLowerCase().includes(search) ||
          p.description.toLowerCase().includes(search)
      );
    }

    // Category
    if (category && category !== 'All') {
      results = results.filter((p) => p.category.toLowerCase() === category.toLowerCase());
    }

    // Brand
    if (brand && brand !== 'All') {
      results = results.filter((p) => p.brand.toLowerCase() === brand.toLowerCase());
    }

    // Minimum Rating
    if (!isNaN(minRating) && minRating > 0) {
      results = results.filter((p) => p.rating >= minRating);
    }

    // In stock
    if (inStockOnly) {
      results = results.filter((p) => p.stock > 0);
    }

    // Discount only
    if (discountOnly) {
      results = results.filter((p) => (p.discountPercentage || 0) > 0);
    }

    // Price range (in target country's currency)
    if (!isNaN(minPrice)) {
      results = results.filter((p) => convertPrice(p.basePriceBDT, country) >= minPrice);
    }
    if (!isNaN(maxPrice)) {
      results = results.filter((p) => convertPrice(p.basePriceBDT, country) <= maxPrice);
    }

    // Sorting
    switch (sort) {
      case 'price-asc':
        results.sort((a, b) => a.basePriceBDT - b.basePriceBDT);
        break;
      case 'price-desc':
        results.sort((a, b) => b.basePriceBDT - a.basePriceBDT);
        break;
      case 'rating-desc':
      case 'highest-rated':
        results.sort((a, b) => b.rating - a.rating);
        break;
      case 'best-selling':
        results.sort((a, b) => (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0) || b.reviewCount - a.reviewCount);
        break;
      case 'discount-desc':
      case 'biggest-discount':
        results.sort((a, b) => (b.discountPercentage || 0) - (a.discountPercentage || 0));
        break;
      case 'newest':
        results.sort((a, b) => (b.isNewArrival ? 1 : 0) - (a.isNewArrival ? 1 : 0));
        break;
      case 'featured':
      default:
        results.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
        break;
    }

    res.json({
      total: results.length,
      products: results,
      categories: Array.from(new Set([...DEFAULT_CATEGORIES, ...liveProducts.map((p) => p.category)])),
      brands: Array.from(new Set(liveProducts.map((p) => p.brand))),
    });
  } catch (err) {
    console.error('Products fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch products.' });
  }
});

// GET /api/products/:identifier - Full product details by id or slug
router.get('/:identifier', async (req: Request, res: Response): Promise<void> => {
  try {
    const { identifier } = req.params;
    const liveProducts = await getLiveProducts();
    const db = getDb();

    const product = liveProducts.find(
      (p) => p.id === identifier || p.slug.toLowerCase() === identifier.toLowerCase()
    );

    if (!product) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }

    // Load reviews
    const productReviews = db.reviews.filter(
      (r) => r.productId === product.id && r.status === 'approved'
    );

    // Rating distribution
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    productReviews.forEach((r) => {
      const star = Math.min(5, Math.max(1, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
      distribution[star] += 1;
    });

    // Related products (same category or brand, excluding current)
    const relatedProducts = liveProducts
      .filter((p) => p.id !== product.id && (p.category === product.category || p.brand === product.brand))
      .slice(0, 6);

    res.json({
      product,
      reviews: productReviews,
      ratingDistribution: distribution,
      relatedProducts,
    });
  } catch (err) {
    console.error('Product details error:', err);
    res.status(500).json({ error: 'Failed to fetch product details.' });
  }
});

// POST /api/products/:id/reviews - Submit customer review
router.post('/:id/reviews', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const productId = req.params.id;
    const { rating, title, comment, photos } = req.body;

    if (!rating || !title || !comment) {
      res.status(400).json({ error: 'Rating, title, and comment are required.' });
      return;
    }

    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      res.status(400).json({ error: 'Rating must be between 1 and 5 stars.' });
      return;
    }

    const liveProducts = await getLiveProducts();
    const db = getDb();
    const product =
      liveProducts.find((p) => p.id === productId || p.slug === productId) ||
      db.products.find((p) => p.id === productId || p.slug === productId);
    if (!product) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }

    // Check if customer has verified purchase of this product
    const hasPurchased = db.orders.some(
      (o) =>
        o.userId === user.id &&
        o.items.some((i) => i.productId === productId) &&
        (o.orderStatus === 'Delivered' || o.orderStatus === 'Shipped' || o.paymentStatus === 'verified' || o.paymentStatus === 'paid')
    );

    const newReview: ProductReview = {
      id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      productId,
      userId: user.id,
      customerName: user.fullName,
      avatarUrl: user.avatarUrl,
      rating: numRating,
      title: title.trim(),
      comment: comment.trim(),
      date: new Date().toISOString().split('T')[0],
      isVerifiedPurchase: hasPurchased,
      photos: Array.isArray(photos) ? photos : [],
      status: 'approved',
    };

    db.reviews.unshift(newReview);

    // Recalculate product rating
    const allApproved = db.reviews.filter((r) => r.productId === productId && r.status === 'approved');
    const avgRating = allApproved.reduce((acc, r) => acc + r.rating, 0) / allApproved.length;
    product.rating = Math.round(avgRating * 10) / 10;
    product.reviewCount = allApproved.length;

    saveDatabase();

    res.status(201).json({
      message: 'Review submitted successfully. Thank you for your feedback!',
      review: newReview,
      newRating: product.rating,
      newReviewCount: product.reviewCount,
    });
  } catch (err) {
    console.error('Review submission error:', err);
    res.status(500).json({ error: 'Internal server error during review submission.' });
  }
});

export default router;
