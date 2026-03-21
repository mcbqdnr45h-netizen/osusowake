import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env['SUPABASE_URL'];
const supabaseServiceKey = process.env['SUPABASE_SERVICE_ROLE_KEY'];
const supabaseAnonKey = process.env['SUPABASE_ANON_KEY'];

if (!supabaseUrl) throw new Error('SUPABASE_URL is not set');
if (!supabaseServiceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey!, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export type Database = {
  users: {
    id: string;
    email: string;
    role: 'customer' | 'store_owner';
    points_balance: number;
    created_at: string;
  };
  stores: {
    id: string;
    owner_id: string;
    name: string;
    address: string | null;
    status: 'pending' | 'active';
    created_at: string;
  };
  products: {
    id: string;
    store_id: string;
    title: string;
    original_price: number;
    discount_price: number;
    stock_quantity: number;
    is_active: boolean;
    created_at: string;
  };
  orders: {
    id: string;
    user_id: string;
    product_id: string;
    final_price: number;
    status: 'unpicked' | 'picked_up' | 'cancelled';
    stripe_payment_id: string | null;
    created_at: string;
    picked_up_at: string | null;
  };
};
