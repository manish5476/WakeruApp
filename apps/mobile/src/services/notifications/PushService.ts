import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';
import { useAuthStore } from '../../stores/auth.store';
import apiClient from '../api/client';

export class PushNotificationService {
  static async requestPermission(): Promise<boolean> {
    if (Platform.OS === 'ios') {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;
      return enabled;
    }
    // Android 13+ requires POST_NOTIFICATIONS, usually handled via PermissionsAndroid
    return true;
  }

  static async syncToken(): Promise<void> {
    const hasPermission = await this.requestPermission();
    if (!hasPermission) return;

    try {
      const token = await messaging().getToken();
      const user = useAuthStore.getState().user;

      if (user && token) {
        // Send token to Wakeru/Firebase backend
        await apiClient
          .post('/users/fcm-token', {
            token,
            platform: Platform.OS,
            deviceId: 'native-app',
          })
          .catch(() => {
            // Fire and forget
          });
      }

      // Listen to token refreshes
      messaging().onTokenRefresh(newToken => {
        if (useAuthStore.getState().user) {
          apiClient
            .post('/users/fcm-token', {
              token: newToken,
              platform: Platform.OS,
            })
            .catch(() => {});
        }
      });
    } catch (error) {
      console.log('FCM Token error:', error);
    }
  }

  static setupBackgroundHandlers() {
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log('Message handled in the background!', remoteMessage);
      // Update local SQLite queue or badge counts if necessary
    });
  }
}
