import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, '') || '';
const CACHE_KEY = 'taberosu_myStore_v1';

export type MyStore = {
  id: number;
  name: string;
  status: 'pending' | 'approved' | 'rejected' | 'pending_review' | 'applied';
  ownerId: string | null;
  stripeAccountId: string | null;
};

function readCache(): MyStore | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as MyStore) : null;
  } catch {
    return null;
  }
}

function writeCache(store: MyStore | null) {
  try {
    if (store) {
      localStorage.setItem(CACHE_KEY, JSON.stringify(store));
    } else {
      localStorage.removeItem(CACHE_KEY);
    }
  } catch {}
}

export function useMyStore() {
  const { user, isLoading: authLoading } = useAuth();

  // localStorage から初期値を読み込み → ページリロード時のフラッシュ防止
  const [store, setStore] = useState<MyStore | null>(readCache);
  const [loading, setLoading]       = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const retryTimerRef               = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Promise チェーン内から最新の store 値を参照するための ref
  const storeRef = useRef<MyStore | null>(store);
  useEffect(() => { storeRef.current = store; }, [store]);

  const fetchStore = useCallback(() => {
    if (!user) {
      storeRef.current = null;
      setStore(null);
      setFetchError(false);
      setLoading(false);
      writeCache(null);
      return;
    }
    setLoading(true);
    setFetchError(false);
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);

    fetch(`${BASE}/api/stores/by-owner?userId=${encodeURIComponent(user.id)}`, {
      cache: 'no-store',
    })
      .then(r => {
        if (r.ok) return r.json() as Promise<MyStore>;
        if (r.status === 404) return '__404__' as const;
        throw new Error(`API error: ${r.status}`);
      })
      .then(data => {
        if (data === '__404__') {
          if (storeRef.current !== null) {
            // 既存ストアデータがある場合：404 は一時的エラーとみなしリトライ
            // store を null にしない
            console.warn('[useMyStore] 404 but have cached store – retry in 8s');
            setFetchError(true);
            retryTimerRef.current = setTimeout(fetchStore, 8000);
          } else {
            // 初回取得で 404 → 本当に店舗なし
            setStore(null);
            storeRef.current = null;
            setFetchError(false);
            writeCache(null);
          }
          return;
        }
        const newStore = data ?? null;
        storeRef.current = newStore;
        setStore(newStore);
        setFetchError(false);
        writeCache(newStore);
      })
      .catch(err => {
        console.warn('[useMyStore] fetch error (will retry in 4s):', err);
        setFetchError(true);
        // エラー時は store を null にしない（古いデータを維持）
        retryTimerRef.current = setTimeout(fetchStore, 4000);
      })
      .finally(() => setLoading(false));
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (authLoading) return;
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
