import { Platform } from 'react-native';

declare const process: { env: Record<string, string | undefined> };

export const config = {
  // App
  APP_NAME: 'Wakeru',
  APP_VERSION: '1.0.0',
  ENVIRONMENT: process.env.EXPO_PUBLIC_ENVIRONMENT || 'development',
  IS_DEV:
    (process.env.EXPO_PUBLIC_ENVIRONMENT || 'development') === 'development',

  // API
  API_URL:
    process.env.EXPO_PUBLIC_API_URL ||
    (__DEV__
      ? process.env.EXPO_PUBLIC_API_URL_DEV ||
        'https://wakeru.onrender.com/api/v1'
      : 'https://wakeru.onrender.com/api/v1'),
  API_TIMEOUT: parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT || '15000', 10),

  // Firebase
  FIREBASE: {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId:
      process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
    appId:
      Platform.OS === 'android'
        ? process.env.EXPO_PUBLIC_FIREBASE_ANDROID_APP_ID
        : process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '',
  },

  // Google Sign-In
  GOOGLE_WEB_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '',
  GOOGLE_ANDROID_CLIENT_ID:
    process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '',
  GOOGLE_CLIENT_ID:
    Platform.OS === 'web'
      ? process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
      : process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,

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
    ALLOWED_IMAGE_TYPES: [
      'image/jpeg',
      'image/png',
      'image/heic',
      'image/webp',
    ],
  },
} as const;

export default config;
