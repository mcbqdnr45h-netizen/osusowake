import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string)
  || 'https://dqybzbsdqpbfpimapnwx.supabase.co';
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string)
  || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxeWJ6YnNkcXBiZnBpbWFwbnd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwOTcyMzgsImV4cCI6MjA4OTY3MzIzOH0.oEZDaDldnTJ190VRt7hsbrypwQ05RaI1OUhQOLjO6pc';

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
  created_at: string;
  full_name: string | null;
  phone_number: string | null;
  display_name: string | null;
}
