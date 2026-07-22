import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { usersApi } from '../../core/api/services/users.api';
import { useAuthStore } from '../stores/auth.store';
import { getMessaging, getToken } from 'firebase/messaging';
import { app } from '../config/firebase';
import Constants from 'expo-constants';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export function usePushNotifications() {
  const [pushToken, setPushToken] = useState('');
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  const user = useAuthStore(state => state.user);

  useEffect(() => {
    if (!user) return;

    registerForPushNotificationsAsync().then(token => {
      if (token) {
        setPushToken(token);
        // Send to backend
        usersApi.registerFCMToken(token).catch(err => console.log('Failed to save FCM token:', err));
      }
    });

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification tapped:', response);
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [user]);

  return { pushToken, notification };
}

async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice || Platform.OS === 'web') {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }

    try {
      if (Platform.OS === 'web') {
        if (app) {
          const messaging = getMessaging(app);
          const vapidKey = (Constants.expoConfig?.notification as any)?.vapidPublicKey;
          token = await getToken(messaging, { vapidKey });
        } else {
          console.log('Firebase app not initialized, cannot get web push token');
        }
      } else {
        // getDevicePushTokenAsync gives the raw FCM/APNs token for mobile
        const res = await Notifications.getDevicePushTokenAsync();
        token = res.data;
      }
    } catch (error) {
      console.log('Error getting push token', error);
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}

