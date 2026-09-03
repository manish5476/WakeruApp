import * as Keychain from 'react-native-keychain';
import { storage } from '../../utils/storage';

class BiometricAuth {
  async isAvailable(): Promise<boolean> {
    try {
      const biometryType = await Keychain.getSupportedBiometryType();
      return biometryType !== null;
    } catch {
      return false;
    }
  }

  async getSupportedTypes(): Promise<string[]> {
    try {
      const type = await Keychain.getSupportedBiometryType();
      const result: string[] = [];
      if (
        type === Keychain.BIOMETRY_TYPE.FINGERPRINT ||
        type === Keychain.BIOMETRY_TYPE.TOUCH_ID
      ) {
        result.push('fingerprint');
      }
      if (
        type === Keychain.BIOMETRY_TYPE.FACE ||
        type === Keychain.BIOMETRY_TYPE.FACE_ID
      ) {
        result.push('face');
      }
      if (type === Keychain.BIOMETRY_TYPE.IRIS) {
        result.push('iris');
      }
      return result;
    } catch {
      return [];
    }
  }

  async authenticate(): Promise<boolean> {
    try {
      // Prompt biometrics by requesting credentials protected by biometry
      const credentials = await Keychain.getGenericPassword({
        authenticationPrompt: {
          title: 'Unlock TripSplit',
          subtitle: 'Confirm it is you to access your TripSplit account.',
          cancel: 'Cancel',
        },
      });
      return !!credentials;
    } catch {
      return false;
    }
  }

  isEnabled(): boolean {
    return storage.getBoolean('biometricEnabled') || false;
  }

  enable(): void {
    storage.setBoolean('biometricEnabled', true);
  }

  disable(): void {
    storage.setBoolean('biometricEnabled', false);
  }
}

export const biometricAuth = new BiometricAuth();
export default biometricAuth;
