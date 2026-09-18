import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.gambberone.trainingtracker',
  appName: 'gambberone-training-tracker',
  webDir: 'dist',
  android: {
    // WaveBinder's current license heartbeat endpoint is HTTP-only.
    allowMixedContent: true,
  },
  plugins: {
    SystemBars: {
      insetsHandling: 'native',
    },
  },
};

export default config;
