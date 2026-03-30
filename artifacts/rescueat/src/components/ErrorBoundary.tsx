import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';

interface State {
  hasError: boolean;
  isNetworkError: boolean;
  errorMessage: string;
}

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, isNetworkError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    const msg = error?.message ?? '';
    const isNet =
      msg.includes('fetch') ||
      msg.includes('network') ||
      msg.includes('Failed to load') ||
      msg.includes('Loading chunk') ||
      msg.includes('dynamically imported module') ||
      !navigator.onLine;
    return { hasError: true, isNetworkError: isNet, errorMessage: msg };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info);
  }

  handleReload = () => {
    this.setState({ hasError: false, isNetworkError: false, errorMessage: '' });
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    if (this.props.fallback) return this.props.fallback;

    return (
      <div className="min-h-dvh bg-background flex flex-col items-center justify-center px-6 py-12">
        <div className="flex flex-col items-center gap-5 max-w-sm w-full">
          <div className="w-20 h-20 rounded-3xl bg-orange-50 flex items-center justify-center">
            <WifiOff className="w-9 h-9 text-orange-400" />
          </div>

          <div className="text-center space-y-2">
            <h1 className="text-xl font-black text-foreground">
              {this.state.isNetworkError
                ? '通信エラーが発生しました'
                : '表示エラーが発生しました'}
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {this.state.isNetworkError
                ? '通信状況を確認して、もう一度お試しください。Wi-Fiや通信環境をご確認ください。'
                : '申し訳ありません。予期しないエラーが発生しました。再読み込みしてください。'}
            </p>
          </div>

          <button
            onClick={this.handleReload}
            className="flex items-center gap-2 bg-primary text-white font-black px-6 py-3 rounded-2xl shadow-md shadow-primary/20 hover:bg-primary/90 active:scale-95 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            再読み込み
          </button>

          <p className="text-xs text-muted-foreground text-center">
            問題が続く場合は、アプリを再起動してください
          </p>
        </div>
      </div>
    );
  }
}
