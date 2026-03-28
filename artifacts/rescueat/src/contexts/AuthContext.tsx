import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, type PublicUser } from '@/lib/supabase';

interface AuthContextValue {
  user: User | null;
  profile: PublicUser | null;
  session: Session | null;
  isLoading: boolean;
  signUp: (email: string, password: string, name: string, phone: string) => Promise<{ error: string | null; needsConfirmation: boolean }>;
  signUpAsStore: (email: string, password: string, name: string, phone: string) => Promise<{ error: string | null; needsConfirmation: boolean }>;
  signIn: (email: string, password: string, forceRole?: 'store_owner' | 'customer') => Promise<{ error: string | null; role: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  resetPasswordForEmail: (email: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// タイムアウト付きPromise競走（PromiseLike にも対応）
function raceTimeout<T>(p: PromiseLike<T>, ms: number): Promise<T | null> {
  return Promise.race([
    Promise.resolve(p),
    new Promise<null>(resolve => setTimeout(() => resolve(null), ms)),
  ]);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]       = useState<User | null>(null);
  const [profile, setProfile] = useState<PublicUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const fetchingRef = useRef(false);

  async function fetchProfile(userId: string): Promise<void> {
    fetchingRef.current = true;
    try {
      const result = await raceTimeout(
        supabase.from('users').select('*').eq('id', userId).single().then(r => r),
        5000  // 5秒でタイムアウト
      );
      if (result && result.data) {
        const prof = result.data as PublicUser;
        // 管理者がユーザーモードでログインしている場合はsessionRoleをcustomerにする
        const ADMIN_EMAIL = 'yuuhi0125416@icloud.com';
        const adminUserMode = sessionStorage.getItem('adminUserMode') === 'true';
        if (prof.email?.toLowerCase() === ADMIN_EMAIL && adminUserMode) {
          setProfile({ ...prof, role: 'customer' });
        } else {
          setProfile(prof);
        }
      }
    } catch (err) {
      console.warn('[AuthContext] fetchProfile error:', err);
    } finally {
      fetchingRef.current = false;
    }
  }

  async function refreshProfile() {
    if (user) await fetchProfile(user.id);
  }

  useEffect(() => {
    let cancelled = false;

    // 絶対タイムアウト: 8秒で強制的に isLoading=false
    const absoluteTimeout = setTimeout(() => {
      if (!cancelled) {
        console.warn('[AuthContext] initAuth absolute timeout — forcing isLoading=false');
        setIsLoading(false);
      }
    }, 8000);

    const initAuth = async () => {
      try {
        const sessionResult = await raceTimeout(
          supabase.auth.getSession().then(r => r),
          6000
        );
        if (cancelled) return;

        const sess = sessionResult?.data?.session ?? null;
        setSession(sess);
        setUser(sess?.user ?? null);
        if (sess?.user) {
          await fetchProfile(sess.user.id);
        }
      } catch (err) {
        console.warn('[AuthContext] initAuth error:', err);
      } finally {
        clearTimeout(absoluteTimeout);
        if (!cancelled) setIsLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (cancelled) return;
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          if (!fetchingRef.current) {
            fetchProfile(session.user.id);
          }
        } else {
          setProfile(null);
        }
      },
    );

    return () => {
      cancelled = true;
      clearTimeout(absoluteTimeout);
      subscription.unsubscribe();
    };
  }, []);

  function getApiBase() {
    const base = (typeof import.meta !== 'undefined' ? (import.meta as any).env?.BASE_URL : '') ?? '';
    return base.replace(/\/$/, '') || '';
  }

  async function checkPhoneAvailable(normalizedPhone: string): Promise<boolean> {
    try {
      const res = await fetch(`${getApiBase()}/api/auth/check-phone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: normalizedPhone }),
      });
      if (!res.ok) return true; // エラー時は通過させてDBエラーで捕捉
      const { taken } = await res.json();
      return !taken;
    } catch {
      return true; // ネットワークエラー時は通過させてDBエラーで捕捉
    }
  }

  async function cleanupOrphanedAuthUser(token: string) {
    try {
      await fetch(`${getApiBase()}/api/auth/cleanup-user`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch { /* ignore */ }
  }

  async function signUp(email: string, password: string, name: string, phone: string) {
    const normalizedPhone = phone.trim().replace(/[-\s]/g, '');

    // サーバーサイドでphone重複チェック（RLSをバイパス）
    const phoneAvailable = await checkPhoneAvailable(normalizedPhone);
    if (!phoneAvailable) {
      return { error: 'この電話番号は既に登録されています', needsConfirmation: false };
    }

    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      return { error: translateError(error.message), needsConfirmation: false };
    }

    if (data.user) {
      const { error: upsertErr } = await supabase.from('users').upsert({
        id: data.user.id,
        email: data.user.email!,
        role: 'customer',
        points_balance: 0,
        full_name: name.trim(),
        phone_number: normalizedPhone,
      }, { onConflict: 'id' });

      if (upsertErr?.code === '23505' || upsertErr?.message?.includes('unique')) {
        // DB登録失敗 → auth.usersに孤立ユーザーが残るため削除
        const sessionToken = data.session?.access_token;
        if (sessionToken) await cleanupOrphanedAuthUser(sessionToken);
        return { error: 'この電話番号は既に登録されています', needsConfirmation: false };
      }
      if (upsertErr) {
        const sessionToken = data.session?.access_token;
        if (sessionToken) await cleanupOrphanedAuthUser(sessionToken);
        return { error: '登録中にエラーが発生しました。もう一度お試しください', needsConfirmation: false };
      }
    }

    const needsConfirmation = !data.session;
    return { error: null, needsConfirmation };
  }

  async function signUpAsStore(email: string, password: string, name: string, phone: string) {
    const normalizedPhone = phone.trim().replace(/[-\s]/g, '');

    // サーバーサイドでphone重複チェック（RLSをバイパス）
    const phoneAvailable = await checkPhoneAvailable(normalizedPhone);
    if (!phoneAvailable) {
      return { error: 'この電話番号は既に登録されています', needsConfirmation: false };
    }

    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      return { error: translateError(error.message), needsConfirmation: false };
    }

    if (data.user) {
      const { error: upsertErr } = await supabase.from('users').upsert({
        id: data.user.id,
        email: data.user.email!,
        role: 'store_owner',
        points_balance: 0,
        full_name: name.trim(),
        phone_number: normalizedPhone,
      }, { onConflict: 'id' });

      if (upsertErr?.code === '23505' || upsertErr?.message?.includes('unique')) {
        const sessionToken = data.session?.access_token;
        if (sessionToken) await cleanupOrphanedAuthUser(sessionToken);
        return { error: 'この電話番号は既に登録されています', needsConfirmation: false };
      }
      if (upsertErr) {
        const sessionToken = data.session?.access_token;
        if (sessionToken) await cleanupOrphanedAuthUser(sessionToken);
        return { error: '登録中にエラーが発生しました。もう一度お試しください', needsConfirmation: false };
      }
    }

    const needsConfirmation = !data.session;
    return { error: null, needsConfirmation };
  }

  async function signIn(email: string, password: string, forceRole?: 'store_owner' | 'customer') {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: translateError(error.message), role: null };

    // onAuthStateChange が並走して fetchProfile を呼ばないよう制御
    fetchingRef.current = true;

    let role: string | null = forceRole ?? 'customer';
    try {
      if (data.user) {
        if (forceRole) {
          // ロール更新 or 初回挿入
          const existResult = await raceTimeout(
            supabase.from('users').select('id').eq('id', data.user.id).single().then(r => r),
            5000
          );
          if (existResult?.data) {
            await supabase.from('users').update({ role: forceRole }).eq('id', data.user.id);
          } else {
            await supabase.from('users').insert({
              id: data.user.id,
              email: data.user.email!,
              role: forceRole,
              points_balance: 0,
            });
          }
        }

        // プロフィール取得（5秒タイムアウト）
        const profResult = await raceTimeout(
          supabase.from('users').select('role, points_balance, email, full_name, phone_number, display_name')
            .eq('id', data.user.id).single().then(r => r),
          5000
        );

        if (profResult?.data) {
          const prof = profResult.data;
          // 管理者がユーザータブ（forceRoleなし）でログインした場合はセッション内でcustomerとして扱う
          const ADMIN_EMAIL = 'yuuhi0125416@icloud.com';
          const sessionRole = (!forceRole && prof.email?.toLowerCase() === ADMIN_EMAIL)
            ? 'customer'
            : prof.role;
          role = sessionRole;
          setProfile({
            id: data.user.id,
            email: prof.email,
            role: sessionRole,
            points_balance: prof.points_balance,
            full_name: prof.full_name ?? null,
            phone_number: prof.phone_number ?? null,
            display_name: prof.display_name ?? null,
            created_at: data.user.created_at,
          });
          console.log('[AuthContext] profile set:', prof.email, 'role:', sessionRole);
        } else {
          // タイムアウトまたはDBエラー → フォールバックプロフィール
          role = forceRole ?? 'customer';
          setProfile({
            id: data.user.id,
            email: data.user.email!,
            role: forceRole ?? 'customer',
            points_balance: 0,
            full_name: null,
            phone_number: null,
            display_name: null,
            created_at: data.user.created_at,
          });
          console.warn('[AuthContext] profile fetch failed — using fallback profile');
        }
      }
    } catch (err) {
      console.warn('[AuthContext] signIn profile error:', err);
      // タイムアウト時もフォールバック
      if (data.user) {
        role = forceRole ?? 'customer';
        setProfile({
          id: data.user.id,
          email: data.user.email!,
          role: forceRole ?? 'customer',
          points_balance: 0,
          full_name: null,
          phone_number: null,
          display_name: null,
          created_at: data.user.created_at,
        });
      }
    } finally {
      fetchingRef.current = false;
    }

    return { error: null, role };
  }

  async function signOut() {
    sessionStorage.removeItem('adminUserMode');
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
  }

  async function resetPasswordForEmail(email: string): Promise<{ error: string | null }> {
    try {
      const origin = window.location.origin;
      const base = (typeof import.meta !== 'undefined' ? (import.meta as any).env?.BASE_URL : '') ?? '';
      const redirectTo = `${origin}${base.replace(/\/$/, '')}/reset-password`;
      const BASE_URL = base.replace(/\/$/, '') || '';
      const res = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: email.trim(), redirectTo }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        return { error: body.message || 'エラーが発生しました' };
      }
      return { error: null };
    } catch {
      return { error: 'エラーが発生しました。しばらくしてから再試行してください' };
    }
  }

  return (
    <AuthContext.Provider value={{ user, profile, session, isLoading, signUp, signUpAsStore, signIn, signOut, refreshProfile, resetPasswordForEmail }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

function translateError(msg: string): string {
  if (msg.includes('Invalid login credentials')) return 'メールアドレスまたはパスワードが正しくありません';
  if (msg.includes('Email not confirmed'))        return 'メールアドレスが未確認です。確認メールのリンクをクリックしてください';
  if (msg.includes('User already registered'))   return 'このメールアドレスは既に登録されています';
  if (msg.includes('Password should be at least')) return 'パスワードは6文字以上で入力してください';
  if (msg.includes('rate limit'))                return 'しばらく時間をおいてから再試行してください';
  return msg;
}
