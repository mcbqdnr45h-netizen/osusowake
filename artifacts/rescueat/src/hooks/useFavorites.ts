import { useContext } from 'react';
import { FavoritesContext } from '@/contexts/FavoritesContextValue';

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used inside FavoritesProvider');
  return ctx;
}
