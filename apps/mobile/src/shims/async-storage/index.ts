const isTestEnv =
  typeof jest !== 'undefined' || process.env.NODE_ENV === 'test';

let storage: {
  getString: (k: string) => string | undefined;
  set: (k: string, v: string) => void;
  remove: (k: string) => void;
  clearAll: () => void;
  getAllKeys: () => string[];
};

if (isTestEnv) {
  const testMap = new Map<string, string>();
  storage = {
    getString: (k: string) => testMap.get(k),
    set: (k: string, v: string) => testMap.set(k, String(v)),
    remove: (k: string) => {
      testMap.delete(k);
    },
    clearAll: () => testMap.clear(),
    getAllKeys: () => Array.from(testMap.keys()),
  };
} else {
  const { createMMKV } = require('react-native-mmkv');
  storage = createMMKV({ id: 'async-storage-shim' });
}

const AsyncStorage = {
  async getItem(
    key: string,
    callback?: (error?: Error | null, result?: string | null) => void,
  ): Promise<string | null> {
    const val = storage.getString(key);
    const result = val !== undefined ? val : null;
    callback?.(null, result);
    return result;
  },

  async setItem(
    key: string,
    value: string,
    callback?: (error?: Error | null) => void,
  ): Promise<void> {
    storage.set(key, value);
    callback?.(null);
  },

  async removeItem(
    key: string,
    callback?: (error?: Error | null) => void,
  ): Promise<void> {
    storage.remove(key);
    callback?.(null);
  },

  async clear(callback?: (error?: Error | null) => void): Promise<void> {
    storage.clearAll();
    callback?.(null);
  },

  async getAllKeys(
    callback?: (error?: Error | null, keys?: string[]) => void,
  ): Promise<string[]> {
    const keys = storage.getAllKeys();
    callback?.(null, keys);
    return keys;
  },

  async multiGet(
    keys: string[],
    callback?: (
      errors?: (Error | null)[],
      result?: [string, string | null][],
    ) => void,
  ): Promise<[string, string | null][]> {
    const result: [string, string | null][] = keys.map(k => {
      const val = storage.getString(k);
      return [k, val !== undefined ? val : null];
    });
    callback?.(undefined, result);
    return result;
  },

  async multiSet(
    keyValuePairs: [string, string][],
    callback?: (errors?: (Error | null)[]) => void,
  ): Promise<void> {
    for (const [k, v] of keyValuePairs) {
      storage.set(k, v);
    }
    callback?.(undefined);
  },

  async multiRemove(
    keys: string[],
    callback?: (errors?: (Error | null)[]) => void,
  ): Promise<void> {
    for (const k of keys) {
      storage.remove(k);
    }
    callback?.(undefined);
  },
};

export default AsyncStorage;
export { AsyncStorage };
