import 'dotenv/config';
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
      serverClientId: process.env.GOOGLE_AUTH_SERVER_CLIENT_ID,
      forceCodeForRefreshToken: true,
      webClientId: process.env.GOOGLE_AUTH_WEB_CLIENT_ID,
      androidClientId: process.env.GOOGLE_AUTH_ANDROID_CLIENT_ID
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
