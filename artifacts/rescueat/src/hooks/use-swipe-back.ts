import { useEffect } from 'react';

// iOS の WebView/Capacitor は SPA だとネイティブの「左端スワイプで戻る」が効かない。
//   → 画面左端(24px以内)から右へスワイプしたら window.history.back() する＝iOS標準の戻る体験を再現。
//   リモートロード方式なので JS だけで実装＝アプリ再申請 不要で即反映。
//   左端起点に限定するので、 横スクロール要素や地図パンとほぼ干渉しない。
export function useSwipeBack() {
  useEffect(() => {
    let startX = 0;
    let startY = 0;
    let startT = 0;
    let tracking = false;

    const onStart = (e: TouchEvent) => {
      // マルチタッチ(ピンチ等)は対象外
      if (e.touches.length > 1) { tracking = false; return; }
      const t = e.touches[0];
      if (!t) { tracking = false; return; }
      if (t.clientX <= 24) {
        tracking = true;
        startX = t.clientX;
        startY = t.clientY;
        startT = Date.now();
      } else {
        tracking = false;
      }
    };

    const onEnd = (e: TouchEvent) => {
      if (!tracking) return;
      tracking = false;
      const t = e.changedTouches[0];
      if (!t) return;
      const dx = t.clientX - startX;          // 右への移動量
      const dy = Math.abs(t.clientY - startY); // 縦ブレ
      const dt = Date.now() - startT;          // 所要時間
      // 右に十分スワイプ & 縦ブレ小 & スクロールでない素早い操作 → 戻る
      if (dx > 70 && dy < 45 && dt < 700) {
        if (window.history.length > 1) window.history.back();
      }
    };

    window.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchend', onEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', onStart);
      window.removeEventListener('touchend', onEnd);
    };
  }, []);
}
