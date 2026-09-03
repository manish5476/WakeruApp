import { useState, useEffect } from 'react';
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance } from '@notifee/react-native';
import { usersApi } from '../services/api/users.api';
import { useAuthStore } from '../stores/auth.store';
import { router } from '../navigation/native-router';

export function usePushNotifications() {
  const [pushToken, setPushToken] = useState('');
  const [notification, setNotification] = useState<any>(null);
  const user = useAuthStore(state => state.user);

  useEffect(() => {
    if (!user) return;

    async function setupNotifications() {
      try {
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (enabled) {
          const token = await messaging().getToken();
          if (token) {
            setPushToken(token);
            usersApi
              .registerFCMToken(token)
              .catch(err => console.log('Failed to save FCM token:', err));
          }
        }

        // Setup Android channel
        await notifee.createChannel({
          id: 'default',
          name: 'Default Channel',
          importance: AndroidImportance.HIGH,
        });

        // Foreground listener
        const unsubscribeOnMessage = messaging().onMessage(
          async remoteMessage => {
            setNotification(remoteMessage);
            if (remoteMessage.notification) {
              await notifee.displayNotification({
                title: remoteMessage.notification.title,
                body: remoteMessage.notification.body,
                android: {
                  channelId: 'default',
                  smallIcon: 'ic_launcher',
                },
                data: remoteMessage.data,
              });
            }
          },
        );

        // App opened from background notification
        const unsubscribeNotificationOpened =
          messaging().onNotificationOpenedApp(remoteMessage => {
            handleNotificationData(remoteMessage.data);
          });

        // App opened from quit state
        messaging()
          .getInitialNotification()
          .then(remoteMessage => {
            if (remoteMessage) {
              handleNotificationData(remoteMessage.data);
            }
          });

        return () => {
          unsubscribeOnMessage();
          unsubscribeNotificationOpened();
        };
      } catch (error) {
        console.log('Error configuring push notifications:', error);
      }
    }

    setupNotifications();
  }, [user]);

  return { pushToken, notification };
}

function handleNotificationData(data?: Record<string, any>) {
  if (!data) return;
  if (typeof data.tripId === 'string') {
    router.push(`/(app)/trips/${data.tripId}`);
  } else if (typeof data.expenseId === 'string') {
    router.push(`/(app)/expenses/${data.expenseId}`);
  } else if (
    typeof data.actionUrl === 'string' &&
    data.actionUrl.startsWith('/')
  ) {
    router.push(data.actionUrl);
  }
}

export default usePushNotifications;
