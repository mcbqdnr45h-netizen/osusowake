import React, { useState, useRef, useEffect } from 'react';
import { Bell, X, CheckCheck, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import { useNotifications, AppNotification } from '@/hooks/use-notifications';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';

function timeAgo(dateStr: string) {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: ja });
  } catch {
    return '';
  }
}

function notificationLink(n: AppNotification): string | null {
  switch (n.type) {
    case 'store_approved':   return '/store/bank-setup';   // 承認→口座・本人確認へ
    case 'store_rejected':   return '/store/reapply';      // 却下→店舗情報の再申請へ
    case 'bag_sold':         return '/store/sales';        // 店主宛
    // ★ pickup_reminder はユーザー(購入者)宛のみ送信される (lib/pickup-reminder.ts)。
    //   /store/dashboard は store_owner 専用 Protected ルートで、一般ユーザーは
    //   弾かれて navigate しても何も起きないバグになっていた。 → /my-reservations へ。
    case 'pickup_reminder':  return '/my-reservations';
    case 'new_bag':          return '/';                   // お気に入り店から新規バッグ→トップへ
    default:                 return null;
  }
}

function notificationIcon(type: string) {
  const icons: Record<string, string> = {
    store_approved:  '✅',
    store_rejected:  '❌',
    bag_sold:        '💰',
    pickup_reminder: '⏰',
    new_bag:         '🛍️',
  };
  return icons[type] ?? '📢';
}

function NotificationItem({ n, onRead, onClose }: {
  n: AppNotification;
  onRead: (id: number) => void;
  onClose: () => void;
}) {
  const [, navigate] = useLocation();
  const link = notificationLink(n);

  const handleClick = () => {
    if (!n.read) onRead(n.id);
    if (link) {
      onClose();
      navigate(link);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`w-full text-left px-4 py-3 border-b border-gray-100 last:border-0 transition-colors ${
        n.read ? 'bg-white hover:bg-gray-50' : 'bg-orange-50/60 hover:bg-orange-50'
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="text-base shrink-0 mt-0.5 leading-none">{notificationIcon(n.type)}</span>
        <div className="flex-1 min-w-0">
          <p className={`text-sm leading-snug ${n.read ? 'font-medium text-gray-600' : 'font-black text-gray-900'}`}>
            {n.title}
          </p>
          {n.body && (
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed line-clamp-3">{n.body}</p>
          )}
          <div className="flex items-center justify-between mt-1">
            <p className="text-[10px] text-gray-400">{timeAgo(n.createdAt)}</p>
            {link && (
              <span className="text-[10px] text-primary font-bold flex items-center gap-0.5">
                {n.type === 'store_rejected' ? '修正して再申請' : n.type === 'store_approved' ? '口座登録へ' : '詳細を見る'}
                <ChevronRight className="w-2.5 h-2.5" />
              </span>
            )}
          </div>
        </div>
        {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5" />}
      </div>
    </button>
  );
}

export function NotificationsBell() {
  const { notifications, unreadCount, loading, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const [popupStyle, setPopupStyle] = useState<React.CSSProperties>({ right: 0 });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  // ポップアップがビューポート左端を超えないよう位置を調整
  useEffect(() => {
    if (!open || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const popupWidth = 320; // w-80
    const margin = 8;
    const leftEdge = rect.right - popupWidth;
    if (leftEdge < margin) {
      // 右にずらして左端がmargin以上になるようにする
      setPopupStyle({ right: -(margin - leftEdge) });
    } else {
      setPopupStyle({ right: 0 });
    }
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="relative w-9 h-9 rounded-xl flex items-center justify-center hover:bg-orange-50 active:scale-95 transition-all"
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
            <span className="text-[9px] font-black text-white leading-none">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            style={popupStyle}
            className="absolute top-11 w-80 bg-white rounded-2xl shadow-2xl shadow-black/10 border border-gray-100 z-50 overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <p className="font-black text-sm text-gray-900">お知らせ</p>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="flex items-center gap-1 text-[11px] text-primary font-bold px-2 py-1 rounded-lg hover:bg-orange-50 transition-colors"
                  >
                    <CheckCheck className="w-3 h-3" />
                    すべて既読
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="max-h-72 overflow-y-auto overscroll-contain">
              {loading ? (
                <div className="py-8 text-center">
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-10 text-center">
                  <Bell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-xs text-gray-400 font-medium">お知らせはありません</p>
                </div>
              ) : (
                notifications.map(n => (
                  <NotificationItem key={n.id} n={n} onRead={markRead} onClose={() => setOpen(false)} />
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
