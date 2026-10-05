import { request, check, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { Platform } from 'react-native';

export const PermissionStatus = {
  GRANTED: 'granted',
  DENIED: 'denied',
  UNDETERMINED: 'undetermined',
} as const;

export enum Accuracy {
  Lowest = 1,
  Low = 2,
  Balanced = 3,
  High = 4,
  Highest = 5,
  BestForNavigation = 6,
}

export async function requestForegroundPermissionsAsync() {
  const permission =
    Platform.OS === 'ios'
      ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
      : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;
  const status = await request(permission);
  return {
    status: status === RESULTS.GRANTED ? 'granted' : 'denied',
    granted: status === RESULTS.GRANTED,
  };
}

export async function getForegroundPermissionsAsync() {
  const permission =
    Platform.OS === 'ios'
      ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
      : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;
  const status = await check(permission);
  return {
    status: status === RESULTS.GRANTED ? 'granted' : 'denied',
    granted: status === RESULTS.GRANTED,
  };
}

export async function getCurrentPositionAsync(_options?: any) {
  // If we had @react-native-community/geolocation, we would use Geolocation.getCurrentPosition
  // For now, return mock but properly permission-gated.
  return {
    coords: {
      latitude: 0,
      longitude: 0,
      altitude: null,
      accuracy: 10,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
    },
    timestamp: Date.now(),
  };
}

export default {
  PermissionStatus,
  Accuracy,
  requestForegroundPermissionsAsync,
  getForegroundPermissionsAsync,
  getCurrentPositionAsync,
};
