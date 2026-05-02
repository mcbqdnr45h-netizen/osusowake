import { createContext } from 'react';

export interface FavoritesContextValue {
  favorites: Set<number>;
  toggle: (storeId: number) => void;
  isFavorite: (storeId: number) => boolean;
  synced: boolean;
}

export const FavoritesContext = createContext<FavoritesContextValue | null>(null);
