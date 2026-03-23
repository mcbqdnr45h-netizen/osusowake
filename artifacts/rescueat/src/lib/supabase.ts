import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'rescueat-auth-token',
    storage: window.localStorage,
  },
});

export type UserRole = 'customer' | 'store_owner';

export interface PublicUser {
  id: string;
  email: string;
  role: UserRole;
  points_balance: number;
  created_at: string;
  full_name: string | null;
  phone_number: string | null;
}
