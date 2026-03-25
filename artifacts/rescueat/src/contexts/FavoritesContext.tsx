import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const STORAGE_KEY = 'rescueat_favorites_v1';

function loadFromStorage(): Set<number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as number[]);
  } catch {
    return new Set();
  }
}

function saveToStorage(favorites: Set<number>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...favorites]));
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
  const { session } = useAuth();
  const [favorites, setFavorites] = useState<Set<number>>(loadFromStorage);
  const [synced, setSynced] = useState(false);
  const syncedRef = useRef(false);

  // ログイン時: サーバーからお気に入りを取得してlocalStorageと統合
  useEffect(() => {
    if (!session?.access_token) {
      setSynced(false);
      syncedRef.current = false;
      return;
    }
    if (syncedRef.current) return;

    const sync = async () => {
      try {
        const res = await fetch('/api/favorites', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (!res.ok) return;
        const data = await res.json() as { storeIds: number[] };
        const serverSet = new Set(data.storeIds);

        // localStorageのお気に入りをサーバーにアップロード（マージ）
        const localSet = loadFromStorage();
        const toAdd = [...localSet].filter(id => !serverSet.has(id));
        await Promise.all(
          toAdd.map(id =>
            fetch(`/api/favorites/${id}`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${session.access_token}` },
            }).catch(() => {})
          )
        );

        const merged = new Set([...serverSet, ...localSet]);
        setFavorites(merged);
        saveToStorage(merged);
        syncedRef.current = true;
        setSynced(true);
      } catch (err) {
        console.error('[favorites] sync error:', err);
      }
    };

    sync();
  }, [session?.access_token]);

  const toggle = useCallback((storeId: number) => {
    setFavorites(prev => {
      const next = new Set(prev);
      const adding = !next.has(storeId);
      if (adding) {
        next.add(storeId);
      } else {
        next.delete(storeId);
      }
      saveToStorage(next);

      // ログイン中ならサーバーにも同期
      if (session?.access_token) {
        const token = session.access_token;
        if (adding) {
          fetch(`/api/favorites/${storeId}`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
          }).catch(err => console.error('[favorites] add error:', err));
        } else {
          fetch(`/api/favorites/${storeId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          }).catch(err => console.error('[favorites] remove error:', err));
        }
      }

      return next;
    });
  }, [session?.access_token]);

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
