import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';

export class PushNotificationService {
  static async requestUserPermission(): Promise<boolean> {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log('[PushNotificationService] Authorization status:', authStatus);
    }
    return enabled;
  }

  static async getToken(): Promise<string | null> {
    try {
      const token = await messaging().getToken();
      return token;
    } catch (error) {
      console.error('[PushNotificationService] Failed to get FCM token:', error);
      return null;
    }
  }

  static async createDefaultChannel() {
    await notifee.createChannel({
      id: 'default',
      name: 'Default Channel',
      importance: AndroidImportance.HIGH,
    });
  }

  static onForegroundMessage(callback?: (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => void) {
    return messaging().onMessage(async remoteMessage => {
      console.log('[PushNotificationService] A new FCM message arrived in foreground!', JSON.stringify(remoteMessage));
      
      if (remoteMessage.notification) {
        await notifee.displayNotification({
          title: remoteMessage.notification.title,
          body: remoteMessage.notification.body,
          data: remoteMessage.data,
          android: {
            channelId: 'default',
            importance: AndroidImportance.HIGH,
            pressAction: {
              id: 'default',
            },
          },
        });
      }

      if (callback) {
        callback(remoteMessage);
      }
    });
  }

  static setBackgroundMessageHandler() {
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log('[PushNotificationService] Message handled in the background!', remoteMessage);
      // Usually, you don't need to manually display a notification here 
      // if it contains a `notification` payload, the OS handles it.
      // But for data-only messages, you would use notifee.displayNotification here.
    });
  }

  static onNotifeeForegroundEvent() {
    return notifee.onForegroundEvent(({ type, detail }) => {
      switch (type) {
        case EventType.DISMISSED:
          console.log('[PushNotificationService] User dismissed notification', detail.notification);
          break;
        case EventType.PRESS:
          console.log('[PushNotificationService] User pressed notification', detail.notification);
          // Handle deep linking or navigation here
          break;
      }
    });
  }
}
