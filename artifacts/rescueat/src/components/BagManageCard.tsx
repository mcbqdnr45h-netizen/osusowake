import React from 'react';
import {
  Clock, Loader2, Minus, Package2, Pencil, Plus, ToggleLeft, ToggleRight, Trash2,
  ShoppingBag, Utensils,
} from 'lucide-react';

// ─── 型 ──────────────────────────────────────────────────────────────────────
export interface Bag {
  id: number;
  title: string;
  discountedPrice: number;
  originalPrice: number;
  stockCount: number;
  reservedCount?: number;
  pickupStart: string | null;
  pickupEnd: string | null;
  isActive: boolean;
  createdAt: string;
  itemType?: string | null;
}

export function getItemTypeLabel(itemType?: string | null): { label: string; emoji: string; cls: string } {
  if (itemType === 'item') {
    return { label: '単品', emoji: '🥡', cls: 'bg-blue-50 text-blue-600 border border-blue-200' };
  }
  return { label: 'おすそわけ袋', emoji: '🛍', cls: 'bg-orange-50 text-orange-600 border border-orange-200' };
}

export type BagRealStatus = 'active' | 'expired' | 'soldout' | 'inactive';

export function getBagStatus(
  bag: { isActive: boolean; stockCount: number; pickupEnd: string | null; pickupStart?: string | null; createdAt: string },
  now: Date,
): BagRealStatus {
  if (!bag.isActive) return 'inactive';
  if (bag.pickupEnd) {
    // JST での現在時刻文字列 "HH:MM"
    const jstNow       = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    const currentTime  = jstNow.toISOString().slice(11, 16);
    const todayStr     = jstNow.toISOString().slice(0, 10);
    const yesterdayStr = new Date(jstNow.getTime() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const jstCreated = new Date(new Date(bag.createdAt).getTime() + 9 * 60 * 60 * 1000);
    const createdStr = jstCreated.toISOString().slice(0, 10);

    // 深夜またぎ判定（例: pickupStart="22:00", pickupEnd="01:00"）
    const isOvernight = bag.pickupStart != null && bag.pickupEnd < bag.pickupStart;

    if (isOvernight) {
      if (createdStr === todayStr) {
        // 今日出品 → 翌日の pickupEnd まで有効（まだ期限切れではない）
        return bag.stockCount === 0 ? 'soldout' : 'active';
      } else if (createdStr === yesterdayStr) {
        // 昨日出品 → 翌日（今日）の pickupEnd を過ぎたら期限切れ
        if (currentTime > bag.pickupEnd) return 'expired';
      } else {
        return 'expired'; // 2日以上前
      }
    } else {
      // 通常バッグ：今日出品 かつ pickupEnd 未達ならアクティブ
      if (createdStr !== todayStr) return 'expired';
      if (currentTime > bag.pickupEnd) return 'expired';
    }
  }
  if (bag.stockCount === 0) return 'soldout';
  return 'active';
}

export const STATUS_BADGE: Record<BagRealStatus, { text: string; cls: string }> = {
  active:   { text: '公開中',   cls: 'bg-green-50 text-green-700 border border-green-200' },
  expired:  { text: '受付終了', cls: 'bg-slate-100 text-slate-500 border border-slate-200' },
  soldout:  { text: '完売',     cls: 'bg-red-50 text-red-500 border border-red-200' },
  inactive: { text: '非公開',   cls: 'bg-gray-100 text-gray-500 border border-gray-200' },
};

// ─── Props ───────────────────────────────────────────────────────────────────
interface Props {
  bag: Bag;
  togglingId: number | null;
  deletingId: number | null;
  adjustingId: number | null;
  confirmId: number | null;
  onToggle: (bag: Bag) => void;
  onDelete: (bag: Bag) => void;
  onStockAdjust: (bag: Bag, delta: number) => void;
  onConfirmChange: (id: number | null) => void;
  onEdit: (bag: Bag) => void;
}

// ─── コンポーネント ───────────────────────────────────────────────────────────
export function BagManageCard({
  bag, togglingId, deletingId, adjustingId, confirmId,
  onToggle, onDelete, onStockAdjust, onConfirmChange, onEdit,
}: Props) {
  const now       = new Date();
  const status    = getBagStatus(bag, now);
  const badge     = STATUS_BADGE[status];
  const isExpired = status === 'expired';
  const typeInfo  = getItemTypeLabel(bag.itemType);
  const remaining = bag.stockCount - (bag.reservedCount ?? 0);
  const discountPct = Math.round((1 - bag.discountedPrice / bag.originalPrice) * 100);

  const isToggling  = togglingId  === bag.id;
  const isDeleting  = deletingId  === bag.id;
  const isAdjusting = adjustingId === bag.id;

  return (
    <div
      className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-opacity ${
        status === 'active' ? 'border-orange-100' : 'border-border opacity-70'
      }`}
    >
      <div className="px-4 pt-4 pb-3">
        {/* ── 上段：情報 + トグル ── */}
        <div className="flex items-start justify-between gap-3">
          {/* 左：テキスト情報 */}
          <div className="flex-1 min-w-0">
            {/* ステータスバッジ */}
            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${badge.cls}`}>
                {badge.text}
              </span>
              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${typeInfo.cls}`}>
                {typeInfo.emoji} {typeInfo.label}
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-orange-50 text-orange-600">
                {discountPct}%OFF
              </span>
            </div>
            {/* タイトル */}
            <p className="font-black text-foreground leading-snug">{bag.title}</p>
            {/* 価格 */}
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs line-through text-muted-foreground">
                ¥{bag.originalPrice.toLocaleString()}
              </span>
              <span className="text-base font-black text-primary">
                ¥{bag.discountedPrice.toLocaleString()}
              </span>
            </div>
            {/* 受取時間 */}
            {(bag.pickupStart || bag.pickupEnd) && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <Clock className="w-3 h-3" />
                {bag.pickupStart}〜{bag.pickupEnd}
              </p>
            )}
          </div>

          {/* 右：編集 + トグル + 削除 */}
          <div className="shrink-0 flex flex-col items-center gap-2">
            {/* 編集ボタン（右上） */}
            <button
              type="button"
              onClick={() => onEdit(bag)}
              className="w-8 h-8 rounded-xl bg-secondary hover:bg-primary/10 hover:text-primary flex items-center justify-center text-muted-foreground transition-colors"
              title="編集"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>

            {/* 公開/非公開トグル */}
            <button
              type="button"
              onClick={() => onToggle(bag)}
              disabled={isToggling || isDeleting || isExpired}
              title={isExpired ? '受付時間が終了しているため変更できません' : undefined}
              className="flex flex-col items-center gap-0.5 text-muted-foreground hover:text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isToggling
                ? <Loader2 className="w-7 h-7 animate-spin" />
                : bag.isActive
                  ? <ToggleRight className={`w-8 h-8 ${isExpired ? 'text-slate-300' : 'text-primary'}`} />
                  : <ToggleLeft className="w-8 h-8 text-muted-foreground" />
              }
              <span className="text-[9px] font-black tracking-tight">
                {badge.text}
              </span>
            </button>

            {/* 削除（非公開のみ） */}
            {!bag.isActive && (
              <div className="flex flex-col items-center gap-1">
                {confirmId === bag.id ? (
                  <div className="flex flex-col items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onDelete(bag)}
                      disabled={isDeleting}
                      className="text-[9px] font-black text-white bg-red-500 px-2 py-1 rounded-lg active:scale-95 transition-transform disabled:opacity-50"
                    >
                      {isDeleting
                        ? <Loader2 className="w-3 h-3 animate-spin" />
                        : '削除する'}
                    </button>
                    <button
                      type="button"
                      onClick={() => onConfirmChange(null)}
                      className="text-[9px] text-muted-foreground underline"
                    >
                      戻る
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => onConfirmChange(bag.id)}
                    disabled={isToggling}
                    className="flex flex-col items-center gap-0.5 text-red-400 hover:text-red-600 transition-colors disabled:opacity-30"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="text-[9px] font-bold">削除</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── 下段：在庫インライン調整バー ── */}
        {/* 「残りわずか」判定: remaining ≤ 2 かつ 公開中 → 全画面共通ロジック */}
        {(() => {
          const isLowStock = status === 'active' && remaining > 0 && remaining <= 2;
          return (
        <div className={`mt-3 flex items-center gap-2 rounded-xl px-3 py-2 ${
          isLowStock ? 'bg-red-50 border border-red-100' : 'bg-secondary/40'
        }`}>
          <Package2 className={`w-3.5 h-3.5 shrink-0 ${isLowStock ? 'text-red-500' : 'text-muted-foreground'}`} />
          <span className={`text-xs font-bold ${isLowStock ? 'text-red-600' : 'text-muted-foreground'}`}>残り在庫</span>
          <span className={`text-xs font-black ml-0.5 ${isLowStock ? 'text-red-700' : 'text-foreground'}`}>
            {remaining}
            <span className={`font-medium ${isLowStock ? 'text-red-500' : 'text-muted-foreground'}`}>個</span>
          </span>
          {isLowStock && (
            <span className="text-[10px] font-black text-red-600 bg-red-100 px-1.5 py-0.5 rounded-full">
              残りわずか！
            </span>
          )}

          <div className="ml-auto flex items-center gap-1.5">
            {/* − */}
            <button
              type="button"
              onClick={() => onStockAdjust(bag, -1)}
              disabled={isAdjusting || bag.stockCount <= 0}
              className="w-7 h-7 rounded-lg bg-white border border-border flex items-center justify-center text-foreground hover:bg-muted active:scale-90 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
            >
              {isAdjusting
                ? <Loader2 className="w-3 h-3 animate-spin" />
                : <Minus className="w-3.5 h-3.5" strokeWidth={2.5} />}
            </button>

            {/* 在庫数表示 */}
            <span className="w-8 text-center text-sm font-black text-foreground tabular-nums">
              {bag.stockCount}
            </span>

            {/* ＋ */}
            <button
              type="button"
              onClick={() => onStockAdjust(bag, 1)}
              disabled={isAdjusting}
              className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-white hover:bg-primary/90 active:scale-90 transition-all disabled:opacity-30 shadow-sm"
            >
              {isAdjusting
                ? <Loader2 className="w-3 h-3 animate-spin" />
                : <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />}
            </button>
          </div>
        </div>
          );
        })()}
      </div>
    </div>
  );
}
