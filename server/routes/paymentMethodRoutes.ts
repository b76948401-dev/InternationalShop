import { Router, Request, Response } from 'express';
import { supabaseServer } from '../supabase';

const router = Router();

export interface PaymentMethodRow {
  id: string;
  name: string;
  display_name: string;
  code: string;
  type: string;
  short_description?: string | null;
  full_description?: string | null;
  logo_url?: string | null;
  icon_name?: string | null;
  is_active: boolean;
  is_archived: boolean;
  sort_order: number;
  country?: string | null;
  supported_countries?: string[] | null;
  supported_currencies?: string[] | null;
  account_number?: string | null;
  mobile_number?: string | null;
  merchant_number?: string | null;
  wallet_address?: string | null;
  crypto_network?: string | null;
  bank_name?: string | null;
  account_name?: string | null;
  branch?: string | null;
  routing_swift?: string | null;
  account_type?: string | null;
  instructions?: string | null;
  customer_instructions?: string | null;
  admin_verification_instructions?: string | null;
  require_sender_number?: boolean;
  require_transaction_id?: boolean;
  require_screenshot?: boolean;
  require_email?: boolean;
  require_wallet_address?: boolean;
  require_transaction_hash?: boolean;
  require_account_name?: boolean;
  require_sender_bank_account?: boolean;
  min_amount?: number | null;
  max_amount?: number | null;
  created_at?: string;
  updated_at?: string;
}

// GET /api/payment-methods - Fetch live payment methods from Supabase
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { country, include_all } = req.query;

    const query = supabaseServer
      .from('payment_methods')
      .select('*')
      .order('sort_order', { ascending: true });

    if (include_all !== 'true') {
      query.eq('is_active', true).eq('is_archived', false);
    }

    const { data, error } = await query;

    if (error) {
      console.warn('[PaymentMethods API] Supabase query notice:', error.message);
      res.status(500).json({ error: error.message, paymentMethods: [] });
      return;
    }

    let methods: PaymentMethodRow[] = data || [];

    // Filter by country if specified and not requesting all
    if (country && typeof country === 'string' && include_all !== 'true') {
      const targetCountry = country.trim().toLowerCase();
      methods = methods.filter((m) => {
        // If supported_countries is an array with items, check inclusion
        if (Array.isArray(m.supported_countries) && m.supported_countries.length > 0) {
          return m.supported_countries.some(
            (c) => c.trim().toLowerCase() === targetCountry || c.trim().toLowerCase() === 'all'
          );
        }
        // If single country field is defined
        if (m.country) {
          return m.country.trim().toLowerCase() === targetCountry || m.country.trim().toLowerCase() === 'all';
        }
        // If no country constraint is defined, available in all countries
        return true;
      });
    }

    res.json({
      success: true,
      count: methods.length,
      paymentMethods: methods,
    });
  } catch (err: any) {
    console.error('[PaymentMethods API] Error:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch payment methods', paymentMethods: [] });
  }
});

// GET /api/payment-methods/:id - Single payment method
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseServer
      .from('payment_methods')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      res.status(404).json({ error: 'Payment method not found' });
      return;
    }

    res.json({ success: true, paymentMethod: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
