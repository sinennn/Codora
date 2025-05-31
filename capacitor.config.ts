import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.vercel.codora',
  appName: 'Codora',
  webDir: 'dist',
  "server": {
    "url": "http://192.168.167.161:5173/",
    "cleartext": true
  },
  plugins: {
    GoogleAuth: {
      scopes: ["profile", "email"],
      serverClientId: process.env.WEB_CLIENT_ID,
      forceCodeForRefreshToken: true,
    },
  }
};

export default config;
