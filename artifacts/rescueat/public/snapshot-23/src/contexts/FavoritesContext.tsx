import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const GUEST_KEY = 'rescueat_favorites_v1_guest';
const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, '') || '';

function getUserKey(userId: string | null): string {
  return userId ? `rescueat_favorites_v1_${userId}` : GUEST_KEY;
}

function loadFromStorage(userId: string | null): Set<number> {
  try {
    const raw = localStorage.getItem(getUserKey(userId));
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as number[]);
  } catch {
    return new Set();
  }
}

function saveToStorage(favorites: Set<number>, userId: string | null) {
  try {
    localStorage.setItem(getUserKey(userId), JSON.stringify([...favorites]));
  } catch {}
}

interface FavoritesContextValue {
  favorites: Set<number>;
  toggle: (storeId: number) => void;
  isFavorite: (storeId: number) => boolean;
  synced: boolean;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { session, user } = useAuth();
  const userId = user?.id ?? null;

  const [favorites, setFavorites] = useState<Set<number>>(() => loadFromStorage(userId));
  const [synced, setSynced] = useState(false);
  const syncedRef = useRef(false);
  const prevUserIdRef = useRef<string | null>(userId);

  // ユーザーが切り替わったらローカルストレージもリセット
  useEffect(() => {
    if (prevUserIdRef.current !== userId) {
      prevUserIdRef.current = userId;
      syncedRef.current = false;
      setSynced(false);
      const loaded = loadFromStorage(userId);
      setFavorites(loaded);
    }
  }, [userId]);

  // ログイン時: サーバーからお気に入りを取得してユーザー固有のlocalStorageと統合
  useEffect(() => {
    if (!session?.access_token || !userId) {
      setSynced(false);
      syncedRef.current = false;
      return;
    }
    if (syncedRef.current) return;

    const sync = async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/favorites`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (!res.ok) return;
        const data = await res.json() as { storeIds: number[] };
        const serverSet = new Set(data.storeIds);

        // このユーザー固有のlocalStorageお気に入りをサーバーにアップロード（マージ）
        const localSet = loadFromStorage(userId);
        const toAdd = [...localSet].filter(id => !serverSet.has(id));
        await Promise.all(
          toAdd.map(id =>
            fetch(`${BASE_URL}/api/favorites/${id}`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${session.access_token}` },
            }).catch(() => {})
          )
        );

        const merged = new Set([...serverSet, ...localSet]);
        setFavorites(merged);
        saveToStorage(merged, userId);
        syncedRef.current = true;
        setSynced(true);
      } catch (err) {
        console.error('[favorites] sync error:', err);
      }
    };

    sync();
  }, [session?.access_token, userId]);

  const toggle = useCallback((storeId: number) => {
    setFavorites(prev => {
      const next = new Set(prev);
      const adding = !next.has(storeId);
      if (adding) {
        next.add(storeId);
      } else {
        next.delete(storeId);
      }
      saveToStorage(next, userId);

      // ログイン中ならサーバーにも同期
      if (session?.access_token) {
        const token = session.access_token;
        if (adding) {
          fetch(`${BASE_URL}/api/favorites/${storeId}`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
          }).catch(err => console.error('[favorites] add error:', err));
        } else {
          fetch(`${BASE_URL}/api/favorites/${storeId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          }).catch(err => console.error('[favorites] remove error:', err));
        }
      }

      return next;
    });
  }, [session?.access_token, userId]);

  const isFavorite = useCallback(
    (storeId: number) => favorites.has(storeId),
    [favorites]
  );

  return (
    <FavoritesContext.Provider value={{ favorites, toggle, isFavorite, synced }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used inside FavoritesProvider');
  return ctx;
}
