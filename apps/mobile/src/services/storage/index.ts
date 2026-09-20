import AsyncStorage from '../../shims/async-storage';

interface StorageOptions {
  namespace?: string;
}

class StorageService {
  private namespace: string;

  constructor(options?: StorageOptions) {
    this.namespace = options?.namespace || 'app';
  }

  private getKey(key: string): string {
    return `${this.namespace}:${key}`;
  }

  async setItem<T>(key: string, value: T): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      await AsyncStorage.setItem(this.getKey(key), serialized);
    } catch (error) {
      console.error(`Failed to set item ${key}:`, error);
      throw error;
    }
  }

  async getItem<T>(key: string, defaultValue?: T): Promise<T | null> {
    try {
      const item = await AsyncStorage.getItem(this.getKey(key));
      if (item === null) {
        return defaultValue ?? null;
      }
      return JSON.parse(item) as T;
    } catch (error) {
      console.error(`Failed to get item ${key}:`, error);
      return defaultValue ?? null;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.getKey(key));
    } catch (error) {
      console.error(`Failed to remove item ${key}:`, error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const namespacedKeys = keys.filter((k: string) =>
        k.startsWith(`${this.namespace}:`),
      );
      if (namespacedKeys.length > 0) {
        await AsyncStorage.multiRemove(namespacedKeys);
      }
    } catch (error) {
      console.error('Failed to clear storage:', error);
      throw error;
    }
  }

  async getAllKeys(): Promise<string[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      return keys
        .filter((k: string) => k.startsWith(`${this.namespace}:`))
        .map((k: string) => k.replace(`${this.namespace}:`, ''));
    } catch (error) {
      console.error('Failed to get all keys:', error);
      return [];
    }
  }

  async multiSet(items: Record<string, any>): Promise<void> {
    try {
      const pairs: [string, string][] = Object.entries(items).map(
        ([key, value]) => [this.getKey(key), JSON.stringify(value)],
      );
      await AsyncStorage.multiSet(pairs);
    } catch (error) {
      console.error('Failed to set multiple items:', error);
      throw error;
    }
  }

  async multiGet<T>(keys: string[]): Promise<Record<string, T | null>> {
    try {
      const namespacedKeys = keys.map(k => this.getKey(k));
      const result = await AsyncStorage.multiGet(namespacedKeys);
      return result.reduce(
        (
          acc: Record<string, T | null>,
          [key, value]: [string, string | null],
        ) => {
          const originalKey = key.replace(`${this.namespace}:`, '');
          acc[originalKey] = value ? (JSON.parse(value) as T) : null;
          return acc;
        },
        {} as Record<string, T | null>,
      );
    } catch (error) {
      console.error('Failed to get multiple items:', error);
      return {};
    }
  }
}

export const storage = new StorageService({ namespace: 'tripsplit' });
