// 後方互換レイヤー: MyStoresContext から選択中の1店舗を返す
export type { MyStore } from '@/contexts/MyStoresContext';
import { useMyStoresContext } from '@/contexts/MyStoresContext';

export function useMyStore() {
  const { currentStore: store, loading, fetchError, refetch, isApprovedOwner, needsBankSetup } = useMyStoresContext();
  return { store, loading, fetchError, isApprovedOwner, needsBankSetup, refetch };
}
