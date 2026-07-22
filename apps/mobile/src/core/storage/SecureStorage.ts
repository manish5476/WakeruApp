import * as Keychain from 'react-native-keychain';

export interface Tokens {
  accessToken: string;
  refreshToken?: string;
}

const SERVICE_NAME = 'com.tripsplit.auth';

export const SecureStorage = {
  saveTokens: async (tokens: Tokens): Promise<void> => {
    try {
      const credentials = JSON.stringify(tokens);
      await Keychain.setGenericPassword('tokens', credentials, {
        service: SERVICE_NAME,
        accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
    } catch (error) {
      console.error('[SecureStorage] Error saving tokens:', error);
    }
  },

  getTokens: async (): Promise<Tokens | null> => {
    try {
      const credentials = await Keychain.getGenericPassword({
        service: SERVICE_NAME,
      });
      
      if (credentials) {
        return JSON.parse(credentials.password) as Tokens;
      }
      return null;
    } catch (error) {
      console.error('[SecureStorage] Error getting tokens:', error);
      return null;
    }
  },

  clearTokens: async (): Promise<void> => {
    try {
      await Keychain.resetGenericPassword({
        service: SERVICE_NAME,
      });
    } catch (error) {
      console.error('[SecureStorage] Error clearing tokens:', error);
    }
  },
};
