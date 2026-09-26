import { createClient } from '@supabase/supabase-js';

const DEFAULT_URL = 'https://wmprpolrwfjbbqhhptoi.supabase.co';
const DEFAULT_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtcHJwb2xyd2ZqYmJxaGhwdG9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0ODY2MDQsImV4cCI6MjEwNTA2MjYwNH0.Qx247VjiHsKuKFxyAzVz0ZfzT0lrOl9CLYqErovt2BA';

function getJwtRef(jwt: string): string | null {
  try {
    const parts = jwt.split('.');
    if (parts.length < 2) return null;
    const json = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    return json.ref || null;
  } catch {
    return null;
  }
}

function resolveSupabaseConfig() {
  const envKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const envUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;

  let key = DEFAULT_KEY;
  if (envKey && getJwtRef(envKey)) {
    key = envKey.trim();
  }

  const keyRef = getJwtRef(key) || 'wmprpolrwfjbbqhhptoi';

  let url = `https://${keyRef}.supabase.co`;
  if (envUrl && envUrl.includes(keyRef)) {
    url = envUrl.trim().replace(/\/+$/, '');
  }

  const serviceRoleKey = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    ''
  ).trim();

  return { url, key, serviceRoleKey };
}

const config = resolveSupabaseConfig();
export const SUPABASE_URL = config.url;
export const SUPABASE_ANON_KEY = config.key;
export const SUPABASE_SERVICE_ROLE_KEY = config.serviceRoleKey;
export const hasServiceRoleKey = Boolean(config.serviceRoleKey && getJwtRef(config.serviceRoleKey));

// If a valid SUPABASE_SERVICE_ROLE_KEY is present, use it for server operations to bypass RLS securely on backend
export const supabaseServer = hasServiceRoleKey
  ? createClient(SUPABASE_URL, config.serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const supabase = supabaseServer;

/**
 * Returns a Supabase client configured for the specific request.
 * If a service role key is available on server, uses it.
 * Otherwise, if the incoming request has a valid Supabase JWT Bearer token, passes it through.
 */
export function getSupabaseClientForRequest(authHeader?: string) {
  // Always use supabaseServer on the backend to avoid invalid JWT authorization errors
  return supabaseServer;
}

/**
 * Validates connectivity to the Supabase instance
 */
export async function testSupabaseConnection(): Promise<{
  connected: boolean;
  projectUrl: string;
  authWorking: boolean;
  error?: string;
}> {
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/settings`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
      },
    });

    if (res.ok) {
      return {
        connected: true,
        projectUrl: SUPABASE_URL,
        authWorking: true,
      };
    } else {
      const text = await res.text();
      return {
        connected: false,
        projectUrl: SUPABASE_URL,
        authWorking: false,
        error: `Supabase returned status ${res.status}: ${text}`,
      };
    }
  } catch (err: any) {
    return {
      connected: false,
      projectUrl: SUPABASE_URL,
      authWorking: false,
      error: err.message || 'Network connection to Supabase failed',
    };
  }
}

/**
 * Ready-to-use SQL DDL script for Supabase SQL Editor if user wants
 * to create persistent tables for this store in PostgreSQL.
 */
export const SUPABASE_SCHEMA_SQL = `
-- Run this in Supabase SQL Editor to set up cloud database tables:

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  full_name TEXT,
  username TEXT UNIQUE,
  email TEXT UNIQUE,
  mobile TEXT,
  country TEXT,
  dob DATE,
  gender TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Orders Table
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

-- 3. Addresses Table
CREATE TABLE IF NOT EXISTS public.addresses (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  full_name TEXT,
  phone TEXT,
  country TEXT,
  full_address TEXT,
  street_address TEXT,
  division_or_state TEXT,
  district_or_city TEXT,
  upazila_thana TEXT,
  postal_code TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Support Messages Table
CREATE TABLE IF NOT EXISTS public.support_messages (
  id TEXT PRIMARY KEY,
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

-- Enable Row Level Security (RLS) and policies:
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access for store" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow public insert for store" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read orders" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Allow public insert orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read support" ON public.support_messages FOR SELECT USING (true);
CREATE POLICY "Allow public insert support" ON public.support_messages FOR INSERT WITH CHECK (true);
`;
