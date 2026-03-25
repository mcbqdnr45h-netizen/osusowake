import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, '') || '';
// v3: Supabase 統一移行に伴い ID 変更のため v2 キャッシュをクリア
const CACHE_KEY_PREFIX = 'taberosu_myStore_v3_';

export type MyStore = {
  id: number;
  name: string;
  status: 'pending' | 'approved' | 'rejected' | 'pending_review' | 'applied';
  ownerId: string | null;
  stripeAccountId: string | null;
};

function cacheKey(userId: string) {
  return `${CACHE_KEY_PREFIX}${userId}`;
}

function readCache(userId: string): MyStore | null {
  try {
    const raw = localStorage.getItem(cacheKey(userId));
    return raw ? (JSON.parse(raw) as MyStore) : null;
  } catch {
    return null;
  }
}

function writeCache(userId: string, store: MyStore | null) {
  try {
    if (store) {
      localStorage.setItem(cacheKey(userId), JSON.stringify(store));
    } else {
      localStorage.removeItem(cacheKey(userId));
    }
  } catch {}
}

function clearLegacyCache() {
  try {
    // v1, v2 キャッシュを全ユーザー分クリア（プレフィックスで一括削除）
    localStorage.removeItem('taberosu_myStore_v1');
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith('taberosu_myStore_v1') || k.startsWith('taberosu_myStore_v2_'))) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
  } catch {}
}

export function useMyStore() {
  const { user, isLoading: authLoading } = useAuth();

  const [store, setStore] = useState<MyStore | null>(() => {
    clearLegacyCache();
    if (!user) return null;
    return readCache(user.id);
  });
  const [loading, setLoading]       = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const retryTimerRef               = useRef<ReturnType<typeof setTimeout> | null>(null);

  const storeRef = useRef<MyStore | null>(store);
  useEffect(() => { storeRef.current = store; }, [store]);

  const fetchStore = useCallback(() => {
    if (!user) {
      storeRef.current = null;
      setStore(null);
      setFetchError(false);
      setLoading(false);
      return;
    }
    const uid = user.id;
    setLoading(true);
    setFetchError(false);
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);

    fetch(`${BASE}/api/stores/by-owner?userId=${encodeURIComponent(uid)}`, {
      cache: 'no-store',
    })
      .then(r => {
        if (r.ok) return r.json() as Promise<MyStore>;
        if (r.status === 404) return '__404__' as const;
        throw new Error(`API error: ${r.status}`);
      })
      .then(data => {
        if (data === '__404__') {
          const cached = storeRef.current;
          if (cached !== null && cached.ownerId === uid) {
            // キャッシュが現在のユーザーのもの → 一時的エラーとみなしリトライ
            console.warn('[useMyStore] 404 but have cached store – retry in 8s');
            setFetchError(true);
            retryTimerRef.current = setTimeout(fetchStore, 8000);
          } else {
            // キャッシュが別ユーザーのもの、または空 → キャッシュクリアして "店舗なし"
            storeRef.current = null;
            setStore(null);
            setFetchError(false);
            writeCache(uid, null);
          }
          return;
        }
        const newStore = data ?? null;
        storeRef.current = newStore;
        setStore(newStore);
        setFetchError(false);
        writeCache(uid, newStore);
      })
      .catch(err => {
        console.warn('[useMyStore] fetch error (will retry in 4s):', err);
        setFetchError(true);
        retryTimerRef.current = setTimeout(fetchStore, 4000);
      })
      .finally(() => setLoading(false));
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (authLoading) return;
    // ユーザー切り替え時にキャッシュをユーザーIDで再読み込み
    if (user) {
      const cached = readCache(user.id);
      storeRef.current = cached;
      setStore(cached);
    } else {
      storeRef.current = null;
      setStore(null);
    }
    fetchStore();
    return () => {
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    };
  }, [user, authLoading, fetchStore]);

  const isApprovedOwner =
    store?.status === 'approved' && !!store?.stripeAccountId;

  const needsBankSetup =
    store?.status === 'approved' && !store?.stripeAccountId;

  return { store, loading, fetchError, isApprovedOwner, needsBankSetup, refetch: fetchStore };
}
