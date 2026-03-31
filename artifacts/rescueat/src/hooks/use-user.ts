import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase';

/**
 * 現在のユーザーIDを返す。
 * - ログイン中: Supabase Auth のユーザーID（アカウントに紐づく・デバイス不問）
 * - 未ログイン: localStorage のランダムUUID（ゲスト用・後方互換）
 *
 * これにより異なるアカウントの購入履歴が混在しなくなる。
 */
export function useUserId() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    function resolveGuestId(): string {
      try {
        let id = localStorage.getItem('rescueat_user_id');
        if (!id) {
          id = uuidv4();
          localStorage.setItem('rescueat_user_id', id);
        }
        return id;
      } catch {
        return uuidv4();
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      setUserId(session?.user?.id ?? resolveGuestId());
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      setUserId(session?.user?.id ?? resolveGuestId());
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return userId;
}
