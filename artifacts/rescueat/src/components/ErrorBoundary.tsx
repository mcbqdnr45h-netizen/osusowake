import React from 'react';

interface State {
  hasError: boolean;
  errorMessage: string;
}

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error?.message ?? 'Unknown error' };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info);
    // ── ステイル チャンク自動回復 ──────────────────────────────────────
    // デプロイ直後に古いタブ/キャッシュが残っていると、新バージョンの JS チャンク
    // ハッシュが合わずサーバが index.html(404) を返すことがあり、
    //   "'text/html' is not a valid JavaScript MIME type"
    //   "Failed to fetch dynamically imported module"
    //   "Loading chunk N failed"
    // のいずれかが発生する。これらは キャッシュ無効化 = ハードリロードで100%治る。
    // 無限ループ防止のため sessionStorage で 1セッション 1回のみ自動リロード。
    const msg = String(error?.message ?? '');
    const isStaleChunk =
      msg.includes('MIME type') ||
      msg.includes('dynamically imported module') ||
      msg.includes('Loading chunk') ||
      msg.includes('Loading CSS chunk') ||
      msg.includes('Importing a module script failed');
    if (isStaleChunk) {
      try {
        const KEY = '__staleChunkReloaded';
        if (!sessionStorage.getItem(KEY)) {
          sessionStorage.setItem(KEY, '1');
          // フォールバック画面が一瞬見えないよう即時リロード
          window.location.reload();
          return;
        }
      } catch { /* sessionStorage 不可環境は通常 fallback 表示へ */ }
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    if (this.props.fallback) return this.props.fallback;

    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#F26419',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'sans-serif',
        padding: '24px',
        boxSizing: 'border-box',
      }}>
        <div style={{ color: 'white', fontSize: '20px', fontWeight: 'bold', marginBottom: '12px', textAlign: 'center' }}>
          一時的に問題が発生しました
        </div>
        <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '13px', marginBottom: '8px', textAlign: 'center', maxWidth: '280px', lineHeight: 1.5 }}>
          再読み込みすると解消することが多いです。
        </div>
        <button
          onClick={this.handleReload}
          style={{
            marginTop: '20px',
            backgroundColor: 'white',
            color: '#F26419',
            border: 'none',
            borderRadius: '14px',
            padding: '13px 32px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer',
          }}
        >
          再読み込み
        </button>
      </div>
    );
  }
}
