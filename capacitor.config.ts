import 'dotenv/config';
import type { CapacitorConfig } from '@capacitor/cli';

const env = (globalThis as typeof globalThis & {
  process?: { env?: Record<string, string | undefined> };
}).process?.env ?? {};

const config: CapacitorConfig = {
  appId: 'app.vercel.codora',
  appName: 'Codora',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true
  },
  plugins: {
    GoogleAuth: {
      scopes: ["profile", "email"],
      serverClientId: env.GOOGLE_AUTH_SERVER_CLIENT_ID,
      forceCodeForRefreshToken: true,
      webClientId: env.GOOGLE_AUTH_WEB_CLIENT_ID,
      androidClientId: env.GOOGLE_AUTH_ANDROID_CLIENT_ID
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
