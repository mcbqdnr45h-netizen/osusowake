import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { FavoritesContext } from '@/contexts/FavoritesContextValue';

const GUEST_KEY = 'rescueat_favorites_v1_guest';
const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, '') || '';

function getUserKey(userId: string | null): string {
  return userId ? `rescueat_favorites_v1_${userId}` : GUEST_KEY;
}

function loadFromStorage(userId: string | null): Set<number> {
  try {
    const raw = localStorage.getItem(getUserKey(userId));
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as number[]);
  } catch {
    return new Set();
  }
}

function saveToStorage(favorites: Set<number>, userId: string | null) {
  try {
    localStorage.setItem(getUserKey(userId), JSON.stringify([...favorites]));
  } catch (err) {
    // Safari Private Mode 等で localStorage が書き込めない場合に備えて log のみ
    console.warn('[favorites] saveToStorage failed (likely localStorage quota / private mode)', err);
  }
}

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { session, user } = useAuth();
  const userId = user?.id ?? null;

  const [favorites, setFavorites] = useState<Set<number>>(() => loadFromStorage(userId));
  const [synced, setSynced] = useState(false);
  const syncedRef = useRef(false);
  const prevUserIdRef = useRef<string | null>(userId);

  // ★ 最新の favorites 集合を ref に保持。
  //   ・useEffect 経由の同期だと同一フレーム内の連続 toggle で stale を読む。
  //   ・そのため setFavorites の updater 内で `favoritesRef.current = next` を
  //     即座に更新し、 同期的に最新状態を反映する (二重ソース・オブ・トゥルース回避)。
  const favoritesRef = useRef<Set<number>>(favorites);
  useEffect(() => { favoritesRef.current = favorites; }, [favorites]);

  // ★ storeId 単位の操作シーケンス番号 (同一ユーザー内での連打対策)。
  const opSeqRef = useRef<Map<number, number>>(new Map());

  // ★ ユーザー操作 (toggle) の単調増加カウンタ。
  //   sync 開始時に startSeq を capture し、 commit 直前に
  //   mutationSeqRef.current !== startSeq なら「sync 開始時刻の前後で
  //   toggle が発生した」とみなして commit を skip。
  //   userId 変更時に 0 リセット (旧ユーザーの操作が新ユーザー sync に影響しない)。
  const mutationSeqRef = useRef(0);

  // ★ ローカル削除 tombstone。 union merge による「削除再出現」を防ぐ要。
  //   toggle で削除した storeId をここに記録し、 サーバへの DELETE が完了
  //   (または rollback) するまで保持する。 sync の commit 時に
  //   merged から tombstone を引くことで、 サーバが古い状態 (削除前) を
  //   返しても削除意図が必ず尊重される。
  //   - 追加 toggle: tombstone から削除 (削除取り消し)
  //   - 削除 toggle: tombstone に追加
  //   - DELETE 成功 (or 409): tombstone から削除 (永続化完了)
  //   - DELETE 失敗 → rollback: tombstone から削除 (削除自体が無かったことに)
  //   - userId 変更: 全 clear
  const pendingDeletesRef = useRef<Set<number>>(new Set());

  // ★ auth epoch (ユーザー世代カウンタ)。
  //   ユーザー切替・ログイン/アウトを跨ぐ in-flight リクエストの応答が、
  //   別ユーザーの favorites を巻き戻す事故を防ぐためのガード。
  //   userId 変更で +1 し、 各非同期処理開始時に capture → 完了時に一致確認。
  //   さらに opSeqRef も clear して旧 seq を無効化、 in-flight fetch は
  //   AbortController で中断する。
  //   ★ この useEffect は sync useEffect より前に置く必要がある:
  //     useEffect は宣言順に実行されるため、 userId 変更時にまず epoch を進めて
  //     旧 in-flight を abort してから、 後続の sync が新 epoch で開始される。
  const authEpochRef = useRef<number>(0);
  const inFlightControllersRef = useRef<Set<AbortController>>(new Set());
  useEffect(() => {
    authEpochRef.current += 1;
    opSeqRef.current.clear();
    mutationSeqRef.current = 0;
    pendingDeletesRef.current.clear();
    // 旧ユーザー由来の in-flight リクエストを全 abort
    inFlightControllersRef.current.forEach(c => { try { c.abort(); } catch { /* noop */ } });
    inFlightControllersRef.current.clear();
  }, [userId]);

  // ユーザーが切り替わったらローカルストレージもリセット
  useEffect(() => {
    if (prevUserIdRef.current !== userId) {
      prevUserIdRef.current = userId;
      syncedRef.current = false;
      setSynced(false);
      const loaded = loadFromStorage(userId);
      setFavorites(loaded);
      favoritesRef.current = loaded;
    }
  }, [userId]);

  // ログイン時: サーバーからお気に入りを取得してユーザー固有のlocalStorageと統合
  useEffect(() => {
    if (!session?.access_token || !userId) {
      setSynced(false);
      syncedRef.current = false;
      return;
    }
    if (syncedRef.current) return;

    // ★ 開始時に epoch + mutation seq を capture し、 fetch には
    //   AbortController を渡す。 ユーザー切替で epoch が変わったり、
    //   sync 開始前後で toggle が発生 (mutationSeq が進行) したら
    //   setFavorites 前のチェックで破棄する。
    const epoch = authEpochRef.current;
    const startMutationSeq = mutationSeqRef.current;
    const controller = new AbortController();
    inFlightControllersRef.current.add(controller);

    const sync = async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/favorites`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
          signal: controller.signal,
        });
        if (!res.ok) return;
        // ★ epoch チェック (ユーザー切替済みなら破棄)
        if (authEpochRef.current !== epoch) return;

        const data = await res.json() as { storeIds: number[] };
        const serverSet = new Set(data.storeIds);

        // ★ サーバへ送る toAdd は最新ローカル状態 (favoritesRef) ベースで、
        //   pendingDeletes に入ったものは絶対に送らない (削除意図を尊重)。
        //   loadFromStorage は古いスナップショットの可能性があるので使わない。
        const localSet = favoritesRef.current;
        const toAdd = [...localSet].filter(
          id => !serverSet.has(id) && !pendingDeletesRef.current.has(id)
        );

        // ★ 各 POST の発行前 + 完了後にもチェック:
        //   - 発行前: sync 中の delete トグル後ならその時点で skip
        //   - 完了後: POST 中に delete トグルされたらフォローアップ DELETE を発行し
        //             サーバ側の "復活" を確実に打ち消す
        await Promise.all(
          toAdd.map(async (id) => {
            // 発行直前の最終チェック
            if (
              controller.signal.aborted ||
              pendingDeletesRef.current.has(id) ||
              !favoritesRef.current.has(id)
            ) return;
            try {
              const r = await fetch(`${BASE_URL}/api/favorites/${id}`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${session.access_token}` },
                signal: controller.signal,
              });
              // POST 成功 (or 409) 後、 sync 中に delete されていたなら
              // サーバ状態を巻き戻すために DELETE を follow-up で発行。
              // ★ tombstone と favoritesRef の両方をチェック:
              //   - DELETE in-flight: tombstone あり
              //   - DELETE 成功完了: tombstone は無いが favoritesRef からも消えている
              //   どちらでも検知可能。
              if (
                (r.ok || r.status === 409) &&
                (pendingDeletesRef.current.has(id) || !favoritesRef.current.has(id))
              ) {
                // ★ follow-up DELETE 発行前に最終確認: 既に re-ADD されていたら skip。
                //   re-ADD 後の DELETE で意図しない削除が走るのを防ぐ。
                if (!favoritesRef.current.has(id) || pendingDeletesRef.current.has(id)) {
                  await fetch(`${BASE_URL}/api/favorites/${id}`, {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${session.access_token}` },
                    signal: controller.signal,
                  }).catch(() => { /* noop */ });
                }
              }
            } catch { /* noop: AbortError 含む */ }
          })
        );

        // ★ 完了時にも epoch を再確認 (Promise.all 中に切替された可能性)
        if (authEpochRef.current !== epoch) return;

        // ★ sync 開始の前後でユーザーが toggle していた場合、 commit を skip。
        //   楽観更新済みの favoritesRef/state を上書きして lost-update や
        //   削除再出現を起こさない。 toggle 自体が POST/DELETE をサーバに発行
        //   しているので再同期は不要、 synced 扱いにする。
        if (mutationSeqRef.current !== startMutationSeq) {
          console.warn('[favorites] sync commit skipped: toggle occurred around sync', {
            startMutationSeq, current: mutationSeqRef.current,
          });
          syncedRef.current = true;
          setSynced(true);
          return;
        }

        // ★ commit 直前のマージ。 単純 union だと「ローカルで削除済み &
        //   サーバが古い状態 (削除前) を返した」場合に削除が復活してしまう。
        //   そこで pendingDeletesRef (削除 tombstone) を引いて削除意図を尊重。
        const merged = new Set([...serverSet, ...favoritesRef.current]);
        pendingDeletesRef.current.forEach(id => merged.delete(id));

        setFavorites(merged);
        favoritesRef.current = merged;
        saveToStorage(merged, userId);
        syncedRef.current = true;
        setSynced(true);
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
        console.error('[favorites] sync error:', err);
      } finally {
        inFlightControllersRef.current.delete(controller);
      }
    };

    sync();

    // cleanup: effect 再実行/unmount 時に in-flight を abort
    return () => {
      try { controller.abort(); } catch { /* noop */ }
      inFlightControllersRef.current.delete(controller);
    };
  }, [session?.access_token, userId]);

  const toggle = useCallback((storeId: number) => {
    // 1) 同期的に「追加 or 削除」を確定 (ref から最新集合を直接読む)
    const adding = !favoritesRef.current.has(storeId);

    // 2) この操作のシーケンス番号 + auth epoch を払い出し
    const seq = (opSeqRef.current.get(storeId) ?? 0) + 1;
    opSeqRef.current.set(storeId, seq);
    const epoch = authEpochRef.current;

    // ★ mutation 世代をインクリメント。 進行中 (または直後に開始する) sync の
    //   commit は startMutationSeq と比較して skip される。
    mutationSeqRef.current += 1;

    // ★ 削除 tombstone の更新:
    //   - 削除トグル → tombstone 追加 (sync の union 復活を防ぐ)
    //   - 追加トグル → tombstone から除去 (削除取り消しを反映)
    if (adding) pendingDeletesRef.current.delete(storeId);
    else pendingDeletesRef.current.add(storeId);

    // 3) 楽観更新: state + ref + localStorage を同一トランザクションで反映
    setFavorites(prev => {
      const next = new Set(prev);
      if (adding) next.add(storeId);
      else next.delete(storeId);
      favoritesRef.current = next;
      saveToStorage(next, userId);
      return next;
    });

    // 4) ログイン中ならサーバーにも同期
    if (session?.access_token) {
      const token = session.access_token;
      const url = `${BASE_URL}/api/favorites/${storeId}`;
      const method = adding ? 'POST' : 'DELETE';
      const controller = new AbortController();
      inFlightControllersRef.current.add(controller);

      fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      })
        .then(res => {
          // 409 (既処理) は許容: サーバ状態が既に楽観更新後と一致しているケース
          if (!res.ok && res.status !== 409) {
            throw new Error(`favorites ${method} ${storeId} → ${res.status}`);
          }
          // ★ 永続化完了 → DELETE の tombstone を解除 (削除意図がサーバに反映済み)
          if (!adding && opSeqRef.current.get(storeId) === seq) {
            pendingDeletesRef.current.delete(storeId);
          }
        })
        .catch(err => {
          // ★ AbortError (ユーザー切替で中断された) は何もしない
          if (err?.name === 'AbortError') return;
          // ★ ユーザー世代が変わっている → 別アカウントの状態を絶対に巻き戻さない
          if (authEpochRef.current !== epoch) {
            console.warn('[favorites] cross-user rollback ignored:', { storeId, seq, epoch });
            return;
          }
          // ★ 最新操作でない (= 後続トグルが既に発火済み) なら破棄
          if (opSeqRef.current.get(storeId) !== seq) {
            console.warn('[favorites] stale rollback ignored:', { storeId, seq });
            return;
          }
          console.error('[favorites] sync failed → rolling back:', err);
          // ★ tombstone 復元: 削除失敗なら削除自体が無かったことに
          if (!adding) pendingDeletesRef.current.delete(storeId);
          setFavorites(prev => {
            const rolled = new Set(prev);
            if (adding) rolled.delete(storeId);
            else rolled.add(storeId);
            favoritesRef.current = rolled;
            saveToStorage(rolled, userId);
            return rolled;
          });
        })
        .finally(() => {
          inFlightControllersRef.current.delete(controller);
        });
    }
  }, [session?.access_token, userId]);

  const isFavorite = useCallback(
    (storeId: number) => favorites.has(storeId),
    [favorites]
  );

  return (
    <FavoritesContext.Provider value={{ favorites, toggle, isFavorite, synced }}>
      {children}
    </FavoritesContext.Provider>
  );
}
