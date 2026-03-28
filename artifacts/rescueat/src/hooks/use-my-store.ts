// 後方互換レイヤー: use-my-stores から選択中の店舗を1件返す
export type { MyStore } from './use-my-stores';
export { useMyStores as _useMyStores } from './use-my-stores';
import { useMyStores } from './use-my-stores';

export function useMyStore() {
  const {
    currentStore: store,
    loading,
    fetchError,
    refetch,
    isApprovedOwner,
    needsBankSetup,
  } = useMyStores();

  return { store, loading, fetchError, isApprovedOwner, needsBankSetup, refetch };
}
