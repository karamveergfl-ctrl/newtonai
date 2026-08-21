import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.p2625657b31574497b1c01d235054c1d0',
  appName: 'NewtonAI',
  webDir: 'dist',
  server: {
    // The native shell always loads the live site, so published web changes
    // reach installed apps without shipping a new APK.
    url: 'https://newtonai.site',
    cleartext: false,
    androidScheme: 'https',
  },
  android: {
    allowMixedContent: false,
    webContentsDebuggingEnabled: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: false,
      backgroundColor: '#0B1020',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: true,
      androidSpinnerStyle: 'small',
      spinnerColor: '#6366F1',
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0B1020',
      overlaysWebView: false,
    },
    Keyboard: {
      resize: 'body',
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
