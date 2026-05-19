import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yuhi.osusowake',
  // ★ ユーザー可視のアプリ名は日本語表記「おすそわけ」 に統一 (Info.plist CFBundleDisplayName とも整合)
  appName: 'おすそわけ',
  webDir: 'dist-cap',
  bundledWebRuntime: false,

  ios: {
    // ⚠️ scheme は iOS の URL スキーム識別子 (deep link 等)。 既存ビルドや Apple 登録物との
    //    互換性を保つため Bundle ID 同様に英字のまま維持する (表示には出ない)
    scheme: 'Osusowake',
    contentInset: 'never',
    allowsLinkPreview: false,
    scrollEnabled: true,
    // ★ WebView の背景色をスプラッシュと同色に。
    //    リモート URL (osusowakejapan.org) をロード中に WebView が白く見えるのを防ぐ。
    backgroundColor: '#FBF8F4',
  },

  plugins: {
    SplashScreen: {
      // ★ 起動スプラッシュを 30 秒 (実質、ずっと) 表示し続ける。
      //    React マウント + 認証確定後に SplashHider が明示的に hide する。
      //    launchShowDuration: 0 は launchAutoHide: false より優先され、
      //    スプラッシュが即非表示 → WebView ロード中の白画面が長時間出る原因。
      launchShowDuration: 30000,
      launchAutoHide: false,
      launchFadeOutDuration: 200,
      backgroundColor: '#FBF8F4',
      iosSpinnerStyle: 'small',
      spinnerColor: '#F26419',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: false,
      fadeOutDuration: 200,
    },
    StatusBar: {
      style: 'DEFAULT',
      backgroundColor: '#FBFBFA',
      overlaysWebView: false,
    },
    App: {
      launchUrl: 'com.yuhi.osusowake://app',
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },

  server: {
    // ⚠️ url を設定することで初めてリモートロードになります
    // hostname だけだとローカル dist-cap が使われ、Web 修正が反映されません
    url: 'https://osusowakejapan.org/',
    hostname: 'osusowakejapan.org',
    iosScheme: 'https',
    cleartext: false,
    allowNavigation: [
      'maps.googleapis.com',
      'maps.gstatic.com',
      '*.googleapis.com',
      'js.stripe.com',
      '*.stripe.com',
      '*.supabase.co',
      '*.supabase.io',
      'osusowakejapan.org',
      '*.osusowakejapan.org',
    ],
  },
};

export default config;
