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
          エラーが発生しました
        </div>
        <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '12px', marginBottom: '8px', textAlign: 'center', wordBreak: 'break-all', maxWidth: '280px' }}>
          {this.state.errorMessage}
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
