import React from 'react';
import { ChevronDown, Plus, Store, CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react';
import { useMyStores, type MyStore } from '@/hooks/use-my-stores';
import { Link } from 'wouter';

function statusBadge(store: MyStore) {
  // ★ 「公開中」バッジは Stripe 連携が完全に成立してから表示する
  //   stripeAccountId が無い / chargesEnabled が true でない / payoutsEnabled が true でない場合は「セットアップ未完了」「審査中」など
  const stripeFullyReady =
    !!(store as any).stripeAccountId &&
    (store as any).stripeChargesEnabled === true &&
    (store as any).stripePayoutsEnabled === true;
  switch (store.status) {
    case 'approved':
      if (!(store as any).stripeAccountId)
        return { label: 'セットアップ未完了', cls: 'bg-orange-100 text-orange-700', Icon: AlertCircle };
      if ((store as any).stripeChargesEnabled === false)
        return { label: '決済停止中', cls: 'bg-red-100 text-red-700', Icon: AlertCircle };
      if ((store as any).stripePayoutsEnabled === false)
        return { label: '入金停止中', cls: 'bg-amber-100 text-amber-800', Icon: AlertCircle };
      if (!stripeFullyReady)
        return { label: '審査中', cls: 'bg-blue-100 text-blue-700', Icon: Clock };
      return store.isActive !== false
        ? { label: '公開中', cls: 'bg-emerald-100 text-emerald-700', Icon: CheckCircle2 }
        : { label: '一時停止', cls: 'bg-orange-100 text-orange-700', Icon: AlertCircle };
    case 'pending_review':
      return { label: '審査待ち', cls: 'bg-amber-100 text-amber-700', Icon: Clock };
    case 'applied':
      return { label: '口座登録済み', cls: 'bg-blue-100 text-blue-700', Icon: Clock };
    case 'rejected':
      return { label: '却下', cls: 'bg-red-100 text-red-700', Icon: XCircle };
    case 'pending':
      return { label: 'セットアップ未完了', cls: 'bg-orange-100 text-orange-700', Icon: AlertCircle };
    default:
      return { label: store.status, cls: 'bg-gray-100 text-gray-600', Icon: AlertCircle };
  }
}

interface StoreSelectorProps {
  className?: string;
}

export function StoreSelector({ className = '' }: StoreSelectorProps) {
  const { stores, currentStore, selectedStoreId, setSelectedStoreId } = useMyStores();
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (stores.length <= 1 && !currentStore) return null;

  const badge = currentStore ? statusBadge(currentStore) : null;

  return (
    <div ref={ref} className={`relative ${className}`}>
      {/* トリガーボタン */}
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 shadow-sm text-left hover:border-orange-300 transition-colors"
      >
        <Store size={16} className="text-orange-500 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900 truncate">{currentStore?.name ?? '店舗を選択'}</p>
          {badge && (
            <span className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full font-medium ${badge.cls}`}>
              <badge.Icon size={10} />
              {badge.label}
            </span>
          )}
        </div>
        <ChevronDown size={16} className={`text-gray-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* ドロップダウン */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
          {stores.map(s => {
            const sb = statusBadge(s);
            const selected = s.id === selectedStoreId;
            return (
              <button
                key={s.id}
                onClick={() => { setSelectedStoreId(s.id); setOpen(false); }}
                className={`flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-orange-50 transition-colors ${selected ? 'bg-orange-50' : ''}`}
              >
                <div className={`w-8 h-8 rounded-lg overflow-hidden shrink-0 ${s.imageUrl ? '' : 'bg-orange-100 flex items-center justify-center'}`}>
                  {s.imageUrl
                    ? <img loading="lazy" decoding="async" src={s.imageUrl} alt={s.name} className="w-full h-full object-cover" />
                    : <Store size={16} className="text-orange-500" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{s.name}</p>
                  <span className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full font-medium ${sb.cls}`}>
                    <sb.Icon size={10} />
                    {sb.label}
                  </span>
                </div>
                {selected && <div className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />}
              </button>
            );
          })}

          <div className="border-t border-gray-100">
            <Link
              href="/store-onboarding?add=1"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center shrink-0">
                <Plus size={16} className="text-white" />
              </div>
              <span className="text-sm font-bold text-orange-600">新しい店舗を追加登録する</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
