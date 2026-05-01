import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yuhi.osusowake',
  appName: 'Osusowake',
  webDir: 'dist-cap',
  bundledWebRuntime: false,

  ios: {
    scheme: 'Osusowake',
    contentInset: 'never',
    allowsLinkPreview: false,
    scrollEnabled: true,
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
