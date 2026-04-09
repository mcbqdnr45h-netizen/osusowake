import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.osusowake',
  appName: 'Osusowake',
  webDir: 'dist-cap',
  bundledWebRuntime: false,

  ios: {
    scheme: 'osusowake',
    contentInset: 'automatic',
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 1800,
      launchAutoHide: true,
      backgroundColor: '#FBFBFA',
      iosSpinnerStyle: 'small',
      spinnerColor: '#F26419',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: false,
    },
    StatusBar: {
      style: 'DEFAULT',
      backgroundColor: '#FBFBFA',
    },
    App: {
      launchUrl: 'app.osusowake://app',
    },
  },
};

export default config;
