import firebase from '@react-native-firebase/app';
import authInstance from '@react-native-firebase/auth';

const app = firebase.app();
const auth = authInstance();

export const getAuth = () => auth;
export { app, auth };
export default app;
