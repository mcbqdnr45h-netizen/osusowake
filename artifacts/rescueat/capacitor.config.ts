import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yuhi.osusowake',
  appName: 'Osusowake',
  webDir: 'dist-cap',
  bundledWebRuntime: false,

  // リリース/TestFlight ビルドでも Safari Web Inspector を使えるようにする
  ios: {
    scheme: 'Osusowake',
    contentInset: 'automatic',
    allowsLinkPreview: false,
    scrollEnabled: true,
    webContentsDebuggingEnabled: true,
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 500,
      launchAutoHide: true,
      backgroundColor: '#FBFBFA',
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
  },

  server: {
    hostname: 'osusowakejapan.org',
    iosScheme: 'https',
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
