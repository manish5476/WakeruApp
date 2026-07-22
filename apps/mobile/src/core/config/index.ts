import Config from 'react-native-config';

export const config = {
  // App
  APP_NAME: 'TripSplit',
  ENVIRONMENT: Config.ENVIRONMENT || 'development',
  IS_DEV: Config.ENVIRONMENT === 'development',

  // API
  API_URL: Config.API_URL || 'http://localhost:8000/api/v1',
  API_TIMEOUT: parseInt(Config.API_TIMEOUT || '15000', 10),

  // Firebase
  FIREBASE: {
    apiKey: Config.FIREBASE_API_KEY || '',
    authDomain: Config.FIREBASE_AUTH_DOMAIN || '',
    projectId: Config.FIREBASE_PROJECT_ID || '',
    storageBucket: Config.FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: Config.FIREBASE_MESSAGING_SENDER_ID || '',
    appId: Config.FIREBASE_APP_ID || '',
  },

  // Google Sign-In
  GOOGLE_WEB_CLIENT_ID: Config.GOOGLE_WEB_CLIENT_ID || '',

  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,

  // Cache
  CACHE_TTL: {
    USER_PROFILE: 3600,
    TRIPS_LIST: 300,
    EXPENSES_LIST: 120,
    SETTLEMENTS: 600,
  },

  // Upload
  UPLOAD: {
    MAX_IMAGE_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/heic', 'image/webp'],
  },
} as const;

export default config;
