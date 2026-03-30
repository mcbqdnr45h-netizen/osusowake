import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, type PublicUser } from '@/lib/supabase';

interface AuthContextValue {
  user: User | null;
  profile: PublicUser | null;
  session: Session | null;
  isLoading: boolean;
  isAdmin: boolean;
  pendingAdminMfa: boolean;
  signUp: (email: string, password: string, name: string, phone: string) => Promise<{ error: string | null; needsConfirmation: boolean }>;
  signUpAsStore: (email: string, password: string, name: string, phone: string) => Promise<{ error: string | null; needsConfirmation: boolean }>;
  signIn: (email: string, password: string, forceRole?: 'store_owner' | 'customer') => Promise<{ error: string | null; role: string | null; isAdmin?: boolean; requiresMfa?: boolean }>;
  sendAdminMfa: () => Promise<{ error: string | null }>;
  verifyAdminMfa: (code: string) => Promise<{ error: string | null }>;
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

// 管理者セッションのタイムアウト（2時間）
const ADMIN_SESSION_TIMEOUT_MS = 2 * 60 * 60 * 1000;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]       = useState<User | null>(null);
  const [profile, setProfile] = useState<PublicUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading]         = useState(true);
  const [isAdmin, setIsAdmin]             = useState(false);
  const [pendingAdminMfa, setPendingAdminMfa] = useState(false);
  const isAdminRef    = useRef(false);
  const fetchingRef   = useRef(false);
  const adminLoginAt  = useRef<number | null>(null);

  // MFA 検証済みか sessionStorage で確認（同一タブのページ更新では再要求しない）
  function isMfaVerifiedInSession(): boolean {
    const ts = sessionStorage.getItem('adminMfaVerifiedAt');
    if (!ts) return false;
    return Date.now() - Number(ts) < ADMIN_SESSION_TIMEOUT_MS;
  }

  // 管理者セッションタイムアウト監視（2時間で自動ログアウト）
  useEffect(() => {
    if (!isAdmin) return;
    const timer = setInterval(() => {
      if (adminLoginAt.current && Date.now() - adminLoginAt.current > ADMIN_SESSION_TIMEOUT_MS) {
        console.warn('[AuthContext] 管理者セッションタイムアウト — 自動ログアウト');
        signOut();
      }
    }, 60 * 1000); // 1 分ごとにチェック
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  // 管理者判定をサーバー API に委譲（メールをクライアントに露出させない）
  async function checkIsAdmin(token: string): Promise<boolean> {
    try {
      const base = (typeof import.meta !== 'undefined' ? (import.meta as any).env?.BASE_URL : '') ?? '';
      const apiBase = base.replace(/\/$/, '') || '';
      const res = await fetch(`${apiBase}/api/auth/is-admin`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return false;
      const { isAdmin: adminFlag } = await res.json();
      return Boolean(adminFlag);
    } catch {
      return false;
    }
  }

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
        const adminUserMode = sessionStorage.getItem('adminUserMode') === 'true';
        if (isAdminRef.current && adminUserMode) {
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
          // セッション復元時: 管理者チェック + MFA 検証確認
          if (sess.access_token) {
            const adminCheck = await checkIsAdmin(sess.access_token);
            if (adminCheck) {
              if (isMfaVerifiedInSession()) {
                // 同一タブ内で MFA 検証済み → そのまま管理者として続行
                isAdminRef.current = true;
                setIsAdmin(true);
                adminLoginAt.current = Date.now();
              } else {
                // MFA 未検証 → ページ更新や新しいタブでは再認証を要求、OTP も自動送信
                setPendingAdminMfa(true);
                fetch(`${getApiBase()}/api/auth/admin-otp/send`, {
                  method: 'POST',
                  headers: { Authorization: `Bearer ${sess.access_token}` },
                }).catch(() => {});
              }
            }
          }
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
      // RLS バイパスのためサーバー経由でプロフィールを upsert
      const token = data.session?.access_token;
      if (!token) {
        // メール確認が必要なため session が発行されていない（確認待ち）
        // この場合は後でログイン時に create-profile が呼ばれる想定
        return { error: null, needsConfirmation: true };
      }
      const profileRes = await fetch(`${getApiBase()}/api/auth/create-profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role: 'customer', full_name: name.trim(), phone_number: normalizedPhone }),
      });
      if (!profileRes.ok) {
        const errData = await profileRes.json().catch(() => ({}));
        await cleanupOrphanedAuthUser(token);
        if (profileRes.status === 409 || errData?.error === 'phone_taken') {
          return { error: 'この電話番号は既に登録されています', needsConfirmation: false };
        }
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

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { intended_role: 'store_owner' } },
    });

    if (error) {
      // 「既に登録済み」の場合は店舗タブでのログインを促す
      if (error.message.includes('User already registered')) {
        return { error: 'このメールアドレスは既に登録されています。「飲食店・パートナー」タブからログインしてください。', needsConfirmation: false };
      }
      return { error: translateError(error.message), needsConfirmation: false };
    }

    if (data.user) {
      const token = data.session?.access_token;
      if (!token) {
        return { error: null, needsConfirmation: true };
      }
      const profileRes = await fetch(`${getApiBase()}/api/auth/create-profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role: 'store_owner', full_name: name.trim(), phone_number: normalizedPhone }),
      });
      if (!profileRes.ok) {
        const errData = await profileRes.json().catch(() => ({}));
        await cleanupOrphanedAuthUser(token);
        if (profileRes.status === 409 || errData?.error === 'phone_taken') {
          return { error: 'この電話番号は既に登録されています', needsConfirmation: false };
        }
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
    let requiresMfaFlag = false;
    try {
      if (data.user && data.session?.access_token) {
        const token = data.session.access_token;
        const apiBase = getApiBase();

        // ── 管理者チェック（サーバー API 経由・メールをバンドルに露出させない）──
        const adminVerified = await checkIsAdmin(token);
        // 管理者の場合: isAdmin はまだ true にしない（MFA 完了後に設定）
        if (adminVerified) {
          requiresMfaFlag = true;
          setPendingAdminMfa(true);
          // OTP メール送信
          try {
            await fetch(`${apiBase}/api/auth/admin-otp/send`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}` },
            });
          } catch { /* メール送信エラーは UI 側で再送できるため無視 */ }
        }

        // ── ロール確定（サーバー経由で RLS バイパス・クロスログイン防止）───────
        // desiredRole: store タブ → 'store_owner', user タブ → 'customer'
        // ただし管理者はどちらのタブでもサーバーチェックをスキップ
        if (!adminVerified && forceRole) {
          const roleRes = await fetch(`${apiBase}/api/auth/update-role`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ desiredRole: forceRole }),
          });
          if (!roleRes.ok) {
            const errData = await roleRes.json().catch(() => ({}));
            // ロールが合わない場合はサインアウトしてエラーを返す
            if (roleRes.status === 403) {
              await supabase.auth.signOut();
              fetchingRef.current = false;
              return { error: errData?.message ?? 'ログインできませんでした', role: null };
            }
            // その他のエラーはフォールスルー（プロフィール取得で補完）
            console.warn('[AuthContext] update-role error:', errData);
          } else {
            const { role: confirmedRole } = await roleRes.json();
            role = confirmedRole;
          }
        } else if (!adminVerified) {
          // user タブ（forceRole なし）でもサーバーで store_owner かチェック
          const roleRes = await fetch(`${apiBase}/api/auth/update-role`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ desiredRole: 'customer' }),
          });
          if (!roleRes.ok) {
            const errData = await roleRes.json().catch(() => ({}));
            if (roleRes.status === 403) {
              // store_owner が user タブでログイン試みた → ブロック
              await supabase.auth.signOut();
              fetchingRef.current = false;
              return { error: errData?.message ?? 'このアカウントは店舗オーナー用です', role: null };
            }
          } else {
            const { role: confirmedRole } = await roleRes.json();
            role = confirmedRole;
          }
        }

        // ── プロフィール取得（Admin 経由・RLS バイパス）──────────────────────
        const profRes = await fetch(`${apiBase}/api/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (profRes.ok) {
          const { profile: prof } = await profRes.json();
          if (prof) {
            // 管理者が user タブでログインした場合はセッション内で customer として扱う
            const sessionRole = (!forceRole && adminVerified)
              ? 'customer'
              : (role ?? prof.role);
            role = sessionRole;
            setProfile({
              id: data.user.id,
              email: prof.email,
              role: sessionRole,
              full_name: prof.full_name ?? null,
              phone_number: prof.phone_number ?? null,
              display_name: prof.display_name ?? null,
              created_at: data.user.created_at,
            });
            console.log('[AuthContext] profile set:', prof.email, 'role:', sessionRole);
          } else {
            // プロフィールが存在しない場合（まれ）
            role = forceRole ?? 'customer';
            setProfile({ id: data.user.id, email: data.user.email!, role: role as import('@/lib/supabase').UserRole, full_name: null, phone_number: null, display_name: null, created_at: data.user.created_at });
          }
        } else {
          // プロフィール取得失敗 → フォールバック
          role = forceRole ?? 'customer';
          setProfile({ id: data.user.id, email: data.user.email!, role: role as import('@/lib/supabase').UserRole, full_name: null, phone_number: null, display_name: null, created_at: data.user.created_at });
          console.warn('[AuthContext] profile fetch failed — using fallback');
        }
      }
    } catch (err) {
      console.warn('[AuthContext] signIn profile error:', err);
      if (data.user) {
        role = forceRole ?? 'customer';
        setProfile({ id: data.user.id, email: data.user.email!, role: role as import('@/lib/supabase').UserRole, full_name: null, phone_number: null, display_name: null, created_at: data.user.created_at });
      }
    } finally {
      fetchingRef.current = false;
    }

    return { error: null, role, isAdmin: isAdminRef.current, requiresMfa: requiresMfaFlag };
  }

  // ── OTP メール送信（管理者が MFA 待機中に呼ぶ）────────────────────────────
  async function sendAdminMfa(): Promise<{ error: string | null }> {
    const token = session?.access_token;
    if (!token) return { error: 'セッションが無効です' };
    try {
      const res = await fetch(`${getApiBase()}/api/auth/admin-otp/send`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        return { error: d?.message ?? 'コードの送信に失敗しました' };
      }
      return { error: null };
    } catch {
      return { error: 'ネットワークエラーが発生しました' };
    }
  }

  // ── OTP コード検証（成功で isAdmin=true を確定）──────────────────────────
  async function verifyAdminMfa(code: string): Promise<{ error: string | null }> {
    const token = session?.access_token;
    if (!token) return { error: 'セッションが無効です' };
    try {
      const res = await fetch(`${getApiBase()}/api/auth/admin-otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ code }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) return { error: d?.message ?? '認証に失敗しました' };

      // MFA 成功 → isAdmin を確定し、sessionStorage に記録
      isAdminRef.current = true;
      setIsAdmin(true);
      setPendingAdminMfa(false);
      adminLoginAt.current = Date.now();
      sessionStorage.setItem('adminMfaVerifiedAt', Date.now().toString());
      return { error: null };
    } catch {
      return { error: 'ネットワークエラーが発生しました' };
    }
  }

  async function signOut() {
    sessionStorage.removeItem('adminUserMode');
    sessionStorage.removeItem('adminMfaVerifiedAt');
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
    setIsAdmin(false);
    setPendingAdminMfa(false);
    isAdminRef.current = false;
    adminLoginAt.current = null;
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
    <AuthContext.Provider value={{ user, profile, session, isLoading, isAdmin, pendingAdminMfa, signUp, signUpAsStore, signIn, sendAdminMfa, verifyAdminMfa, signOut, refreshProfile, resetPasswordForEmail }}>
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
