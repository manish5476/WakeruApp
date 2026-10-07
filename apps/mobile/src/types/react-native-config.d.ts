/**
 * Type declarations for react-native-config.
 * Each key here maps to a variable in the .env file.
 * Without this file, accessing any Config.KEY shows:
 *   "Context access might be invalid: KEY"
 */
declare module 'react-native-config' {
  export interface NativeConfig {
    // API
    API_URL?: string;
    API_TIMEOUT?: string;

    // Environment
    ENVIRONMENT?: string;
    APP_ENV?: string;
    USE_LOCAL_MOCK?: string;

    // Expo-style variants (also read by react-native-config when present)
    EXPO_PUBLIC_API_URL?: string;
    EXPO_PUBLIC_ENVIRONMENT?: string;
    EXPO_PUBLIC_APP_ENV?: string;
    EXPO_PUBLIC_USE_LOCAL_MOCK?: string;

    // Firebase
    FIREBASE_API_KEY?: string;
    FIREBASE_AUTH_DOMAIN?: string;
    FIREBASE_PROJECT_ID?: string;
    FIREBASE_STORAGE_BUCKET?: string;
    FIREBASE_MESSAGING_SENDER_ID?: string;
    FIREBASE_APP_ID?: string;

    // Google Sign-In
    GOOGLE_WEB_CLIENT_ID?: string;
  }

  export const Config: NativeConfig;
  export default Config;
}
