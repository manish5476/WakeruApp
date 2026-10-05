// src/shims/expo-sqlite.ts
// Shim for expo-sqlite in pure React Native environment

export interface SQLiteDatabase {
  execAsync(sql: string): Promise<void>;
  runAsync(
    sql: string,
    ...params: any[]
  ): Promise<{ changes: number; lastInsertRowId: number }>;
  getFirstAsync<T = any>(sql: string, ...params: any[]): Promise<T | null>;
  getAllAsync<T = any>(sql: string, ...params: any[]): Promise<T[]>;
  withTransactionAsync<T>(task: () => Promise<T>): Promise<T>;
  closeAsync(): Promise<void>;
}

class MockSQLiteDatabase implements SQLiteDatabase {
  async execAsync(_sql: string): Promise<void> {}
  async runAsync(
    _sql: string,
    ..._params: any[]
  ): Promise<{ changes: number; lastInsertRowId: number }> {
    return { changes: 1, lastInsertRowId: 1 };
  }
  async getFirstAsync<T = any>(
    _sql: string,
    ..._params: any[]
  ): Promise<T | null> {
    return null;
  }
  async getAllAsync<T = any>(_sql: string, ..._params: any[]): Promise<T[]> {
    return [];
  }
  async withTransactionAsync<T>(task: () => Promise<T>): Promise<T> {
    return task();
  }
  async closeAsync(): Promise<void> {}
}

export function openDatabaseSync(
  _name: string,
  _options?: any,
): SQLiteDatabase {
  return new MockSQLiteDatabase();
}

export async function openDatabaseAsync(
  _name: string,
  _options?: any,
): Promise<SQLiteDatabase> {
  return new MockSQLiteDatabase();
}

export default {
  openDatabaseSync,
  openDatabaseAsync,
};
