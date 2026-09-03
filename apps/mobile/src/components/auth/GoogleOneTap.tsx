import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { useAuthStore } from '../../stores/auth.store';

import { router } from 'expo-router';

// Extend window object to recognize google identity services
declare global {
  interface Window {
    google?: any;
  }
}

export function GoogleOneTap() {
  const { loginWithGoogleIdToken, isAuthenticated, firebaseUser } =
    useAuthStore();

  useEffect(() => {
    // Only run on the web
    if (Platform.OS !== 'web') return;

    // Don't show if already authenticated
    if (isAuthenticated) return;

    const clientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
    if (!clientId) {
      console.warn(
        'Google One Tap: EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID is not defined.',
      );
      return;
    }

    const handleCredentialResponse = async (response: any) => {
      try {
        if (response.credential) {
          await loginWithGoogleIdToken(response.credential);
          // Check for password provider
          const user = useAuthStore.getState().firebaseUser;
          const hasPassword = user?.providerData.some(
            (p: any) => p.providerId === 'password',
          );
          if (user && !hasPassword) {
            router.replace('/(auth)/set-password');
          } else {
            router.replace('/(app)/(tabs)/home');
          }
        }
      } catch (error) {
        console.error('Google One Tap Login Failed:', error);
      }
    };

    const initializeGoogleOneTap = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
          cancel_on_tap_outside: false,
        });
        window.google.accounts.id.prompt();
      }
    };

    const scriptId = 'google-gsi-client';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogleOneTap;
      document.body.appendChild(script);
    } else {
      // Script is already there, just initialize
      initializeGoogleOneTap();
    }
  }, [isAuthenticated, loginWithGoogleIdToken]);
  return null;
}
