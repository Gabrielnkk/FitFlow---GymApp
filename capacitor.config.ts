import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fitflow.app',
  appName: 'FitFlow',
  webDir: 'dist',
  backgroundColor: '#0b1437',
  plugins: {
    LocalNotifications: {
      iconColor: '#3B82F6',
    },
  },
};

export default config;
