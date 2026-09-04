/**
 * @format
 */

import { AppRegistry } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import App from './App';
import { name as appName } from './app.json';

// Register background handler for FCM push notifications
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('FCM message handled in background:', remoteMessage.messageId);
});

AppRegistry.registerComponent(appName, () => App);
