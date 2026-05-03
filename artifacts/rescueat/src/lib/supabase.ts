import { createClient } from '@supabase/supabase-js';

// ★ ハードコード fallback を撤去 (gitleaks/SAST 警告解消)。
//    URL / ANON_KEY は build 時に Vite が埋め込む。
//    - Web (dev/prod): artifacts/rescueat/.env.local の VITE_SUPABASE_*
//    - iOS Capacitor build: vite.config.cap.ts が process.env から注入
//    値が無い場合は明示的に throw し、 silent 起動失敗を防ぐ。
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY が未設定です。 .env.local または build 環境変数を確認してください。',
  );
}

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
