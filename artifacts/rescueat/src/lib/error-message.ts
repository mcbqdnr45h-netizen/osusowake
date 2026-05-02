/**
 * 生のエラーオブジェクトを、エンドユーザー向けの自然な日本語メッセージに変換する。
 * 元のエラーは console.error 経由でデバッグ可能性を維持する想定 (呼び出し側で行う)。
 *
 * 使い方:
 *   try { ... } catch (err) {
 *     console.error('[xxx] failed:', err);
 *     toast({ title: '失敗しました', description: toUserErrorMessage(err) });
 *   }
 */
export function toUserErrorMessage(err: unknown, fallback = '時間をおいて再度お試しください'): string {
  // ネットワーク切断 (fetch failed / NetworkError)
  if (err instanceof TypeError && /fetch|network|load failed/i.test(err.message)) {
    return 'インターネット接続を確認してください';
  }

  // Response-like (HTTP status を含む)
  if (typeof err === 'object' && err !== null) {
    const e = err as { status?: number; message?: string; code?: string };
    if (typeof e.status === 'number') {
      if (e.status === 401 || e.status === 403) return 'もう一度ログインし直してください';
      if (e.status === 404) return '対象が見つかりませんでした';
      if (e.status === 408) return '通信がタイムアウトしました。電波状況をご確認ください';
      if (e.status === 409) return '既に処理済みのようです。画面を更新してご確認ください';
      if (e.status === 413) return 'データが大きすぎます。サイズを小さくしてお試しください';
      if (e.status === 429) return 'リクエストが集中しています。少し時間をおいてお試しください';
      if (e.status >= 500)  return 'サーバーが一時的に応答しません。しばらく待ってお試しください';
      if (e.status >= 400)  return e.message && isJapanese(e.message) ? e.message : fallback;
    }
    if (e.message && isJapanese(e.message)) return e.message;
  }

  if (err instanceof Error && isJapanese(err.message)) return err.message;

  return fallback;
}

/** メッセージに日本語が含まれていれば、そのままユーザーに見せられる文言と判定 */
function isJapanese(s: string): boolean {
  return /[\u3040-\u30ff\u4e00-\u9fff]/.test(s);
}
