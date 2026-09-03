import { MMKVStorage } from './MMKVStorage';
import { SecureStorage } from './SecureStorage';

export { MMKVStorage, SecureStorage };

export const storage = {
  // ── Tokens (Keychain / Secure Hardware) ───────────────────
  async saveTokens(tokens: {
    accessToken: string;
    refreshToken?: string;
  }): Promise<void> {
    await SecureStorage.saveTokens({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  },

  async getTokens(): Promise<{
    accessToken: string;
    refreshToken?: string;
  } | null> {
    return SecureStorage.getTokens();
  },

  async clearTokens(): Promise<void> {
    await SecureStorage.clearTokens();
  },

  async purgeLegacyCredentials(): Promise<void> {
    // No-op for fresh native app
  },

  // ── General Fast Synchronous Storage (MMKV) ───────────────
  getString(key: string): string | undefined {
    return MMKVStorage.getString(key);
  },

  setString(key: string, value: string): void {
    MMKVStorage.setItem(key, value);
  },

  getBoolean(key: string): boolean | undefined {
    return MMKVStorage.getBoolean(key);
  },

  setBoolean(key: string, value: boolean): void {
    MMKVStorage.setItem(key, value);
  },

  getNumber(key: string): number | undefined {
    return MMKVStorage.getNumber(key);
  },

  setNumber(key: string, value: number): void {
    MMKVStorage.setItem(key, value);
  },

  getObject<T>(key: string): T | undefined {
    return MMKVStorage.getObject<T>(key);
  },

  setObject(key: string, value: unknown): void {
    MMKVStorage.setObject(key, value);
  },

  delete(key: string): void {
    MMKVStorage.deleteItem(key);
  },

  clearAll(): void {
    MMKVStorage.clearAll();
  },

  async clearCachedData(): Promise<void> {
    MMKVStorage.clearAll();
  },
};

export default storage;
