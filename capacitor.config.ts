import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.vercel.codora',
  appName: 'Codora',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    allowNavigation: [
      'openrouter.ai',
    ],
    cleartext: true
  },
  plugins: {
    GoogleAuth: {
      scopes: ["profile", "email"],
      serverClientId: '459099093980-0v3g2k1fsvqqq71sivaff8agmjkf1pks.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
      webClientId: '459099093980-0v3g2k1fsvqqq71sivaff8agmjkf1pks.apps.googleusercontent.com',
      androidClientId: '459099093980-ufqetavp37fbip4ilq9inb8mhanvpk19.apps.googleusercontent.com'
    },
    android: {
      needPermission: true
    },
    Network: {
      enabled: true
    }
  }
};

export default config;
