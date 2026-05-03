import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Loader2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const BASE = (((import.meta as never as { env?: { VITE_API_BASE?: string } }).env?.VITE_API_BASE) || '') ||
             (import.meta.env.BASE_URL?.replace(/\/$/, '') || '');

export default function AuthCallback() {
  const [, navigate] = useLocation();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: { session }, error: sessErr } = await supabase.auth.getSession();
        if (sessErr || !session) {
          for (let i = 0; i < 30 && !cancelled; i++) {
            await new Promise(r => setTimeout(r, 150));
            const r = await supabase.auth.getSession();
            if (r.data.session) break;
          }
        }
        const { data: { session: finalSession } } = await supabase.auth.getSession();
        if (cancelled) return;
        if (!finalSession) {
          setError('ログインに失敗しました。 もう一度お試しください');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }

        const user = finalSession.user;
        const meta = (user.user_metadata ?? {}) as { full_name?: string; name?: string; phone?: string };
        const fullName = meta.full_name || meta.name || (user.email ? user.email.split('@')[0] : 'ユーザー');
        const phone = meta.phone || '';

        try {
          const r = await fetch(`${BASE}/api/auth/create-profile`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${finalSession.access_token}`,
            },
            body: JSON.stringify({
              role: 'customer',
              full_name: fullName,
              phone_number: phone,
            }),
          });
          if (!r.ok) {
            const body = await r.json().catch(() => ({} as { message?: string }));
            console.warn('[auth-callback] create-profile failed', r.status, body);
            // 致命では無いので継続 (既存ユーザの再ログイン時は ON CONFLICT で no-op)
          }
        } catch (e) {
          console.warn('[auth-callback] create-profile network error', e);
        }

        navigate('/mypage');
      } catch (e: unknown) {
        if (cancelled) return;
        setError((e as { message?: string })?.message ?? '予期しないエラーが発生しました');
        setTimeout(() => navigate('/login'), 2500);
      }
    })();
    return () => { cancelled = true; };
  }, [navigate]);

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-background px-6">
      {error ? (
        <div className="flex flex-col items-center text-center max-w-sm">
          <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
          <h2 className="text-lg font-black text-foreground mb-2">ログインに失敗しました</h2>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      ) : (
        <div className="flex flex-col items-center text-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
          <h2 className="text-lg font-black text-foreground mb-1">ログイン中...</h2>
          <p className="text-xs text-muted-foreground">セッションを確立しています</p>
        </div>
      )}
    </div>
  );
}
