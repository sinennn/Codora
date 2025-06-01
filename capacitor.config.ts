import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.vercel.codora',
  appName: 'Codora',
  webDir: 'dist',
  // "server": {
  //   "url": "http://192.168.167.161:5173/",
  //   "cleartext": true
  // },
  plugins: {
    GoogleAuth: {
      scopes: ["profile", "email"],
      serverClientId: '459099093980-0v3g2k1fsvqqq71sivaff8agmjkf1pks.apps.googleusercontent.com',
         },
         "android": {
          "needPermission": true
        }
  }
};

export default config;
