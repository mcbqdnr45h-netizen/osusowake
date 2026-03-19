import React, { createContext, useContext, useState, useCallback } from 'react';

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
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<Set<number>>(loadFromStorage);

  const toggle = useCallback((storeId: number) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(storeId)) {
        next.delete(storeId);
      } else {
        next.add(storeId);
      }
      saveToStorage(next);
      return next;
    });
  }, []);

  const isFavorite = useCallback(
    (storeId: number) => favorites.has(storeId),
    [favorites]
  );

  return (
    <FavoritesContext.Provider value={{ favorites, toggle, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used inside FavoritesProvider');
  return ctx;
}
