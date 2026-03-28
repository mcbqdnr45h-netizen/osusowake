// useMyStores は MyStoresContext の薄いラッパーです。
// すべての状態は MyStoresProvider で一元管理されます。
export type { MyStore } from '@/contexts/MyStoresContext';
export { useMyStoresContext as useMyStores } from '@/contexts/MyStoresContext';
