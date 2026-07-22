import { createMMKV } from 'react-native-mmkv';

export const storage = createMMKV();

export const MMKVStorage = {
  setItem: (key: string, value: boolean | string | number | Uint8Array) => {
    if (value instanceof Uint8Array) {
      storage.set(key, value.buffer);
    } else {
      storage.set(key, value);
    }
  },
  
  setObject: <T>(key: string, value: T) => {
    storage.set(key, JSON.stringify(value));
  },

  getString: (key: string): string | undefined => {
    return storage.getString(key);
  },

  getNumber: (key: string): number | undefined => {
    return storage.getNumber(key);
  },

  getBoolean: (key: string): boolean | undefined => {
    return storage.getBoolean(key);
  },
  
  getObject: <T>(key: string): T | undefined => {
    const json = storage.getString(key);
    if (!json) return undefined;
    try {
      return JSON.parse(json) as T;
    } catch {
      return undefined;
    }
  },

  deleteItem: (key: string) => {
    storage.delete(key);
  },

  clearAll: () => {
    storage.clearAll();
  },
};
