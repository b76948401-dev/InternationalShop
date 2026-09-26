import { createClient } from '@supabase/supabase-js';

const DEFAULT_URL = 'https://wmprpolrwfjbbqhhptoi.supabase.co';
const DEFAULT_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtcHJwb2xyd2ZqYmJxaGhwdG9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0ODY2MDQsImV4cCI6MjEwNTA2MjYwNH0.Qx247VjiHsKuKFxyAzVz0ZfzT0lrOl9CLYqErovt2BA';

// Ensure process and process.env exist across browser and Node.js environments
if (typeof process === 'undefined') {
  (globalThis as any).process = { env: {} };
}
if (!process.env) {
  (process as any).env = {};
}

function isValidSupabaseUrl(url?: string): boolean {
  if (!url || typeof url !== 'string') return false;
  return url.startsWith('https://') && url.includes('.supabase.co');
}

function isValidJwtKey(key?: string): boolean {
  if (!key || typeof key !== 'string') return false;
  const parts = key.trim().split('.');
  return parts.length === 3;
}

const clientEnvUrl = typeof window !== 'undefined' ? (import.meta as any).env?.VITE_SUPABASE_URL : undefined;
const clientEnvKey = typeof window !== 'undefined' ? (import.meta as any).env?.VITE_SUPABASE_ANON_KEY : undefined;

const resolvedUrl =
  (isValidSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL) && process.env.NEXT_PUBLIC_SUPABASE_URL) ||
  (isValidSupabaseUrl(clientEnvUrl) && clientEnvUrl) ||
  DEFAULT_URL;

const resolvedKey =
  (isValidJwtKey(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
  (isValidJwtKey(clientEnvKey) && clientEnvKey) ||
  DEFAULT_KEY;

process.env.NEXT_PUBLIC_SUPABASE_URL = resolvedUrl;
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = resolvedKey;

export const supabase = createClient(resolvedUrl, resolvedKey);

