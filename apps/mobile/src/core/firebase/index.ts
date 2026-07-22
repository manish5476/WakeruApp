import firebase from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import crashlytics from '@react-native-firebase/crashlytics';
import analytics from '@react-native-firebase/analytics';

// React Native Firebase uses native configuration files (google-services.json & GoogleService-Info.plist).
// No explicit initializeApp() is needed for the default app.

export { firebase, auth, crashlytics, analytics };
