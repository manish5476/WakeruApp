import { createMMKV } from 'react-native-mmkv';

const storage = createMMKV({ id: 'async-storage-shim' });

const AsyncStorage = {
  async getItem(key: string): Promise<string | null> {
    const val = storage.getString(key);
    return val !== undefined ? val : null;
  },

  async setItem(key: string, value: string): Promise<void> {
    storage.set(key, value);
  },

  async removeItem(key: string): Promise<void> {
    storage.remove(key);
  },

  async clear(): Promise<void> {
    storage.clearAll();
  },

  async getAllKeys(): Promise<string[]> {
    return storage.getAllKeys();
  },

  async multiGet(keys: string[]): Promise<[string, string | null][]> {
    return keys.map(k => {
      const val = storage.getString(k);
      return [k, val !== undefined ? val : null];
    });
  },

  async multiSet(keyValuePairs: [string, string][]): Promise<void> {
    for (const [k, v] of keyValuePairs) {
      storage.set(k, v);
    }
  },

  async multiRemove(keys: string[]): Promise<void> {
    for (const k of keys) {
      storage.remove(k);
    }
  },
};

export default AsyncStorage;
export { AsyncStorage };
