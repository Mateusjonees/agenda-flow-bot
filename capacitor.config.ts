import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.04803414cc414ed8883c354d6b3c2a06',
  appName: 'Foguete Gestão',
  webDir: 'dist',
  server: {
    url: 'https://04803414-cc41-4ed8-883c-354d6b3c2a06.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#E31837',
      showSpinner: false,
      androidSpinnerStyle: 'small',
      iosSpinnerStyle: 'small',
    },
  },
};

export default config;
