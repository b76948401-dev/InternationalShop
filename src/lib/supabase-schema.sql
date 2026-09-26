-- ========================================================
-- SHARED SUPABASE DATABASE SCHEMA & SAFE MIGRATION
-- Project: International Shop & Admin Panel Unified Backend
-- Safe & Idempotent: Can be run multiple times without data loss
-- ========================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================================
-- 1. PROFILES TABLE (Linked with Supabase Auth users)
-- ========================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  full_name TEXT,
  username TEXT UNIQUE,
  email TEXT UNIQUE,
  mobile TEXT,
  country TEXT DEFAULT 'Bangladesh',
  dob DATE,
  gender TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'customer',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure all columns exist on profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS mobile TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Bangladesh';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS dob DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'customer';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ========================================================
-- 2. CATEGORIES TABLE
-- ========================================================
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  parent_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS parent_id TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ========================================================
-- 3. PRODUCTS TABLE
-- ========================================================
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  base_price_bdt NUMERIC NOT NULL DEFAULT 0,
  original_price_bdt NUMERIC,
  discount_percentage INTEGER DEFAULT 0,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  images TEXT[] DEFAULT ARRAY[]::TEXT[],
  brand TEXT,
  category_id TEXT,
  category TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  is_cod_available BOOLEAN DEFAULT TRUE,
  rating NUMERIC DEFAULT 5.0,
  reviews_count INTEGER DEFAULT 0,
  features JSONB DEFAULT '[]'::jsonb,
  specifications JSONB DEFAULT '{}'::jsonb,
  sku TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS base_price_bdt NUMERIC DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS original_price_bdt NUMERIC;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS discount_percentage INTEGER DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS brand TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category_id TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_cod_available BOOLEAN DEFAULT TRUE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS rating NUMERIC DEFAULT 5.0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS reviews_count INTEGER DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS specifications JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sku TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ========================================================
-- 4. ORDERS TABLE
-- ========================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  order_number TEXT,
  user_id TEXT,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  customer_mobile TEXT,
  country TEXT DEFAULT 'Bangladesh',
  currency TEXT DEFAULT 'BDT',
  total_amount NUMERIC NOT NULL DEFAULT 0,
  amount_paid_online NUMERIC DEFAULT 0,
  remaining_cod_amount NUMERIC DEFAULT 0,
  payment_method TEXT,
  payment_method_id TEXT,
  is_cod BOOLEAN DEFAULT TRUE,
  payment_status TEXT DEFAULT 'pending_verification',
  order_status TEXT DEFAULT 'Pending',
  shipping_address JSONB,
  delivery_address JSONB,
  items JSONB,
  payment_proof JSONB,
  timeline JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_number TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_email TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_phone TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_mobile TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Bangladesh';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'BDT';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS total_amount NUMERIC DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS amount_paid_online NUMERIC DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS remaining_cod_amount NUMERIC DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS is_cod BOOLEAN DEFAULT TRUE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending_verification';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_status TEXT DEFAULT 'Pending';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_address JSONB;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_address JSONB;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS items JSONB;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_proof JSONB;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS timeline JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ========================================================
-- 5. ORDER_ITEMS TABLE
-- ========================================================
CREATE TABLE IF NOT EXISTS public.order_items (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  order_id TEXT NOT NULL,
  product_id TEXT,
  product_name TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC DEFAULT 0,
  subtotal NUMERIC DEFAULT 0,
  color TEXT,
  storage TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS unit_price NUMERIC DEFAULT 0;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS subtotal NUMERIC DEFAULT 0;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS color TEXT;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS storage TEXT;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS image_url TEXT;

-- ========================================================
-- 6. ADDRESSES TABLE
-- ========================================================
CREATE TABLE IF NOT EXISTS public.addresses (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  user_id TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  mobile TEXT,
  country TEXT DEFAULT 'Bangladesh',
  full_address TEXT,
  street_address TEXT,
  division_or_state TEXT,
  district_or_city TEXT,
  upazila_thana TEXT,
  postal_code TEXT,
  pin_code TEXT,
  state TEXT,
  city TEXT,
  district TEXT,
  division TEXT,
  province TEXT,
  area TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS mobile TEXT;
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Bangladesh';
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS full_address TEXT;
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS street_address TEXT;
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS division_or_state TEXT;
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS district_or_city TEXT;
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS upazila_thana TEXT;
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS postal_code TEXT;
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS pin_code TEXT;
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS district TEXT;
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS division TEXT;
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS province TEXT;
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS area TEXT;
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT FALSE;
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ========================================================
-- 7. REVIEWS TABLE
-- ========================================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  product_id TEXT NOT NULL,
  user_id TEXT,
  user_name TEXT,
  user_country TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  comment TEXT,
  verified_purchase BOOLEAN DEFAULT FALSE,
  helpful_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'approved',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS user_name TEXT;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS user_country TEXT;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS comment TEXT;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS verified_purchase BOOLEAN DEFAULT FALSE;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS helpful_count INTEGER DEFAULT 0;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'approved';
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ========================================================
-- 8. WEBSITE_SETTINGS TABLE
-- ========================================================
CREATE TABLE IF NOT EXISTS public.website_settings (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================================
-- 9. DISCOUNTS TABLE
-- ========================================================
CREATE TABLE IF NOT EXISTS public.discounts (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT DEFAULT 'percentage', -- 'percentage' or 'fixed'
  discount_value NUMERIC NOT NULL DEFAULT 0,
  min_purchase NUMERIC DEFAULT 0,
  max_discount NUMERIC,
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  usage_limit INTEGER,
  times_used INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.discounts ADD COLUMN IF NOT EXISTS min_purchase NUMERIC DEFAULT 0;
ALTER TABLE public.discounts ADD COLUMN IF NOT EXISTS max_discount NUMERIC;
ALTER TABLE public.discounts ADD COLUMN IF NOT EXISTS valid_from TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.discounts ADD COLUMN IF NOT EXISTS valid_until TIMESTAMPTZ;
ALTER TABLE public.discounts ADD COLUMN IF NOT EXISTS times_used INTEGER DEFAULT 0;

-- ========================================================
-- 10. OFFERS TABLE
-- ========================================================
CREATE TABLE IF NOT EXISTS public.offers (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  title TEXT NOT NULL,
  description TEXT,
  badge TEXT,
  discount_percentage INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ,
  image_url TEXT,
  product_id TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS badge TEXT;
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS discount_percentage INTEGER DEFAULT 0;
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS product_id TEXT;
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ========================================================
-- 11. WISHLISTS TABLE
-- ========================================================
CREATE TABLE IF NOT EXISTS public.wishlists (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  user_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, product_id)
);

-- ========================================================
-- 12. NOTIFICATIONS TABLE
-- ========================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'order',
  is_read BOOLEAN DEFAULT FALSE,
  order_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================================
-- 13. ADMIN ROLE HELPER FUNCTION
-- ========================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()::text AND role = 'admin'
    )
    OR
    (auth.jwt() ->> 'email') IN ('admin@shop.com', 'b76948401@gmail.com')
    OR
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================================
-- 14. ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Public profiles read" ON public.profiles;
CREATE POLICY "Public profiles read" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (
  auth.uid()::text = id OR public.is_admin()
);

-- Categories Policies
DROP POLICY IF EXISTS "Public categories read" ON public.categories;
CREATE POLICY "Public categories read" ON public.categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can modify categories" ON public.categories;
CREATE POLICY "Admins can modify categories" ON public.categories FOR ALL USING (
  public.is_admin() OR auth.role() = 'anon'
);

-- Products Policies
DROP POLICY IF EXISTS "Public products read" ON public.products;
CREATE POLICY "Public products read" ON public.products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can modify products" ON public.products;
CREATE POLICY "Admins can modify products" ON public.products FOR ALL USING (
  public.is_admin() OR auth.role() = 'anon'
);

-- Orders Policies
DROP POLICY IF EXISTS "Customers can read own orders" ON public.orders;
CREATE POLICY "Customers can read own orders" ON public.orders FOR SELECT USING (
  auth.uid()::text = user_id OR public.is_admin() OR auth.role() = 'anon'
);

DROP POLICY IF EXISTS "Customers can insert orders" ON public.orders;
CREATE POLICY "Customers can insert orders" ON public.orders FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
CREATE POLICY "Admins can update orders" ON public.orders FOR UPDATE USING (
  public.is_admin() OR auth.uid()::text = user_id OR auth.role() = 'anon'
);

-- Order Items Policies
DROP POLICY IF EXISTS "Order items read" ON public.order_items;
CREATE POLICY "Order items read" ON public.order_items FOR SELECT USING (true);

DROP POLICY IF EXISTS "Order items insert" ON public.order_items;
CREATE POLICY "Order items insert" ON public.order_items FOR INSERT WITH CHECK (true);

-- Addresses Policies
DROP POLICY IF EXISTS "Addresses read" ON public.addresses;
CREATE POLICY "Addresses read" ON public.addresses FOR SELECT USING (
  auth.uid()::text = user_id OR public.is_admin() OR auth.role() = 'anon'
);

DROP POLICY IF EXISTS "Addresses insert" ON public.addresses;
CREATE POLICY "Addresses insert" ON public.addresses FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Addresses update" ON public.addresses;
CREATE POLICY "Addresses update" ON public.addresses FOR UPDATE USING (
  auth.uid()::text = user_id OR public.is_admin() OR auth.role() = 'anon'
);

-- Reviews Policies
DROP POLICY IF EXISTS "Reviews read" ON public.reviews;
CREATE POLICY "Reviews read" ON public.reviews FOR SELECT USING (true);

DROP POLICY IF EXISTS "Reviews insert" ON public.reviews;
CREATE POLICY "Reviews insert" ON public.reviews FOR INSERT WITH CHECK (true);

-- Website Settings Policies
DROP POLICY IF EXISTS "Website settings read" ON public.website_settings;
CREATE POLICY "Website settings read" ON public.website_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can update website settings" ON public.website_settings;
CREATE POLICY "Admins can update website settings" ON public.website_settings FOR ALL USING (
  public.is_admin() OR auth.role() = 'anon'
);

-- Discounts Policies
DROP POLICY IF EXISTS "Discounts read" ON public.discounts;
CREATE POLICY "Discounts read" ON public.discounts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins modify discounts" ON public.discounts;
CREATE POLICY "Admins modify discounts" ON public.discounts FOR ALL USING (
  public.is_admin() OR auth.role() = 'anon'
);

-- Offers Policies
DROP POLICY IF EXISTS "Offers read" ON public.offers;
CREATE POLICY "Offers read" ON public.offers FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins modify offers" ON public.offers;
CREATE POLICY "Admins modify offers" ON public.offers FOR ALL USING (
  public.is_admin() OR auth.role() = 'anon'
);

-- Wishlists Policies
DROP POLICY IF EXISTS "Wishlists access" ON public.wishlists;
CREATE POLICY "Wishlists access" ON public.wishlists FOR ALL USING (
  auth.uid()::text = user_id OR public.is_admin() OR auth.role() = 'anon'
);

-- Notifications Policies
DROP POLICY IF EXISTS "Notifications access" ON public.notifications;
CREATE POLICY "Notifications access" ON public.notifications FOR ALL USING (
  auth.uid()::text = user_id OR public.is_admin() OR auth.role() = 'anon'
);

-- ========================================================
-- 15. DEFAULT SEED DATA (Only inserted if tables are empty)
-- ========================================================

-- Initial Categories
INSERT INTO public.categories (name, slug, description, image_url)
VALUES
  ('Audio & Gadgets', 'audio-gadgets', 'Premium headphones, wireless earbuds, bluetooth speakers, and modern acoustic accessories.', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80'),
  ('Computers & Laptops', 'computers-laptops', 'High-performance laptops, ultrabooks, MacBooks, and desktop workstations.', 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80'),
  ('Smartphones & Tablets', 'smartphones-tablets', 'Flagship smartphones, iPads, Android tablets, and mobile photography gear.', 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80'),
  ('Wearables & Smartwatches', 'wearables-smartwatches', 'Health tracking smartwatches, fitness bands, and connected wrist accessories.', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80'),
  ('Cameras & Photography', 'cameras-photography', 'Mirrorless camera bodies, cinema lenses, vlogging kits, and stabilizers.', 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80'),
  ('Gaming & Consoles', 'gaming-consoles', 'Next-gen consoles, mechanical gaming keyboards, gaming mice, and VR headsets.', 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800&q=80')
ON CONFLICT (slug) DO NOTHING;

-- Initial Settings if not present
INSERT INTO public.website_settings (setting_key, setting_value)
VALUES
  ('site', '{"brand_name": "International Shop", "name": "International Shop", "tagline": "Shop Globally, Delivered Locally"}'::jsonb),
  ('checkout', '{"cod_enabled": true, "require_delivery_payment_for_cod": true}'::jsonb),
  ('delivery', '{"cod_charge_bdt": 100, "city_charge_bdt": 100, "outside_city_charge_bdt": 150}'::jsonb),
  ('seo', '{"title": "International Shop", "keywords": "ecommerce, electronics, smartphones, laptops", "description": "Shop international electronics in Bangladesh, India, and Pakistan."}'::jsonb)
ON CONFLICT (setting_key) DO NOTHING;

-- ========================================================
-- 10. SUPPORT_MESSAGES TABLE
-- ========================================================
CREATE TABLE IF NOT EXISTS public.support_messages (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  ticket_number TEXT NOT NULL,
  user_id TEXT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  country TEXT,
  subject TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  message TEXT NOT NULL,
  screenshot_url TEXT,
  order_id TEXT,
  status TEXT DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_messages_email ON public.support_messages(email);
CREATE INDEX IF NOT EXISTS idx_support_messages_user_id ON public.support_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_ticket ON public.support_messages(ticket_number);

ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can submit support messages" ON public.support_messages;
CREATE POLICY "Public can submit support messages"
  ON public.support_messages FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view their own support messages" ON public.support_messages;
CREATE POLICY "Users can view their own support messages"
  ON public.support_messages FOR SELECT
  USING (true);

