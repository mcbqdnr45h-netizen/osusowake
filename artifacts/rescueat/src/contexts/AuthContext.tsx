import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, type PublicUser } from '@/lib/supabase';

interface AuthContextValue {
  user: User | null;
  profile: PublicUser | null;
  session: Session | null;
  isLoading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: string | null; needsConfirmation: boolean }>;
  signUpAsStore: (email: string, password: string) => Promise<{ error: string | null; needsConfirmation: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null; role: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]       = useState<User | null>(null);
  const [profile, setProfile] = useState<PublicUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  // isLoading = true until the FIRST auth+profile check is fully complete
  const [isLoading, setIsLoading] = useState(true);

  // prevent concurrent fetchProfile calls from racing
  const fetchingRef = useRef(false);

  async function fetchProfile(userId: string): Promise<void> {
    fetchingRef.current = true;
    try {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      if (data) setProfile(data as PublicUser);
    } finally {
      fetchingRef.current = false;
    }
  }

  async function refreshProfile() {
    if (user) await fetchProfile(user.id);
  }

  useEffect(() => {
    let cancelled = false;

    // ── 初回セッション確認（await fetchProfile してから isLoading=false）──────────
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (cancelled) return;
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);   // ← await で確実にプロフィール取得後に進む
        }
      } catch (_) {
        // ignore network errors on init
      } finally {
        if (!cancelled) setIsLoading(false);     // ← profile 取得後に初めて false
      }
    };

    initAuth();

    // ── 以降の認証状態変化（ログイン/ログアウト/トークン更新）────────────────────
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (cancelled) return;
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          // signIn() が手動で setProfile する場合と競合しないよう、
          // まだフェッチ中でなければ最新プロフィールを取得
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
      subscription.unsubscribe();
    };
  }, []);

  async function signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      return { error: translateError(error.message), needsConfirmation: false };
    }

    if (data.user) {
      await supabase.from('users').upsert({
        id: data.user.id,
        email: data.user.email!,
        role: 'customer',
        points_balance: 0,
      }, { onConflict: 'id' });
    }

    const needsConfirmation = !data.session;
    return { error: null, needsConfirmation };
  }

  async function signUpAsStore(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      return { error: translateError(error.message), needsConfirmation: false };
    }

    if (data.user) {
      await supabase.from('users').upsert({
        id: data.user.id,
        email: data.user.email!,
        role: 'store_owner',
        points_balance: 0,
      }, { onConflict: 'id' });
    }

    const needsConfirmation = !data.session;
    return { error: null, needsConfirmation };
  }

  async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: translateError(error.message), role: null };

    let role: string | null = 'customer';
    if (data.user) {
      const { data: prof } = await supabase
        .from('users')
        .select('role, points_balance, email')
        .eq('id', data.user.id)
        .single();
      if (prof) {
        role = prof.role;
        // onAuthStateChange より先に profile をセットしておく（ちらつき防止）
        setProfile({
          id: data.user.id,
          email: prof.email,
          role: prof.role,
          points_balance: prof.points_balance,
          created_at: data.user.created_at,
        });
      }
    }

    return { error: null, role };
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
  }

  return (
    <AuthContext.Provider value={{ user, profile, session, isLoading, signUp, signUpAsStore, signIn, signOut, refreshProfile }}>
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
