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
  return { status: 'granted', granted: true };
}

export async function getForegroundPermissionsAsync() {
  return { status: 'granted', granted: true };
}

export async function getCurrentPositionAsync(_options?: any) {
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
