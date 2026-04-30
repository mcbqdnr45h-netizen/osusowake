import { useEffect, useState, useCallback } from 'react';

export const AVATAR_KEY_PREFIX = 'osusowake_avatar_v1_';
const AVATAR_EVENT = 'osusowake:avatar-changed';

function readAvatar(userId: string | null | undefined): string | null {
  if (!userId) return null;
  try {
    return localStorage.getItem(`${AVATAR_KEY_PREFIX}${userId}`);
  } catch {
    return null;
  }
}

export function saveAvatar(userId: string, dataUrl: string): boolean {
  try {
    localStorage.setItem(`${AVATAR_KEY_PREFIX}${userId}`, dataUrl);
    window.dispatchEvent(new CustomEvent(AVATAR_EVENT, { detail: { userId } }));
    return true;
  } catch {
    return false;
  }
}

export function clearAvatar(userId: string): void {
  try {
    localStorage.removeItem(`${AVATAR_KEY_PREFIX}${userId}`);
    window.dispatchEvent(new CustomEvent(AVATAR_EVENT, { detail: { userId } }));
  } catch {
    /* noop */
  }
}

/**
 * 端末ローカルに保存されたユーザアバターを購読する。
 * 同タブ内での更新 (saveAvatar 経由) と、別タブからの storage event の両方に追従する。
 */
export function useAvatar(userId: string | null | undefined): string | null {
  const [dataUrl, setDataUrl] = useState<string | null>(() => readAvatar(userId));

  const refresh = useCallback(() => {
    setDataUrl(readAvatar(userId));
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!userId) return;
    const onCustom = (e: Event) => {
      const detail = (e as CustomEvent<{ userId?: string }>).detail;
      if (!detail?.userId || detail.userId === userId) refresh();
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === `${AVATAR_KEY_PREFIX}${userId}`) refresh();
    };
    window.addEventListener(AVATAR_EVENT, onCustom);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(AVATAR_EVENT, onCustom);
      window.removeEventListener('storage', onStorage);
    };
  }, [userId, refresh]);

  return dataUrl;
}
