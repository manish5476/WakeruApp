// src/shims/expo-sqlite.ts
// Shim for expo-sqlite in pure React Native environment using @op-engineering/op-sqlite
import { open } from '@op-engineering/op-sqlite';

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

class OPSQLiteDatabase implements SQLiteDatabase {
  private db: any;

  constructor(name: string) {
    this.db = open({ name });
  }

  async execAsync(sql: string): Promise<void> {
    await this.db.executeAsync(sql);
  }

  async runAsync(
    sql: string,
    ...params: any[]
  ): Promise<{ changes: number; lastInsertRowId: number }> {
    const result = await this.db.executeAsync(sql, params);
    return {
      changes: result.rowsAffected || 0,
      lastInsertRowId: result.insertId || 0,
    };
  }

  async getFirstAsync<T = any>(
    sql: string,
    ...params: any[]
  ): Promise<T | null> {
    const result = await this.db.executeAsync(sql, params);
    if (result.rows && result.rows._array && result.rows._array.length > 0) {
      return result.rows._array[0] as T;
    } else if (result.rows && result.rows.length > 0) {
      return (
        typeof result.rows.item === 'function'
          ? result.rows.item(0)
          : result.rows[0]
      ) as T;
    }
    return null;
  }

  async getAllAsync<T = any>(sql: string, ...params: any[]): Promise<T[]> {
    const result = await this.db.executeAsync(sql, params);
    if (result.rows && result.rows._array) {
      return result.rows._array as T[];
    } else if (result.rows) {
      const arr = [];
      for (let i = 0; i < (result.rows.length || 0); i++) {
        arr.push(
          typeof result.rows.item === 'function'
            ? result.rows.item(i)
            : result.rows[i],
        );
      }
      return arr as T[];
    }
    return [];
  }

  async withTransactionAsync<T>(task: () => Promise<T>): Promise<T> {
    await this.db.executeAsync('BEGIN TRANSACTION');
    try {
      const res = await task();
      await this.db.executeAsync('COMMIT');
      return res;
    } catch (e) {
      await this.db.executeAsync('ROLLBACK');
      throw e;
    }
  }

  async closeAsync(): Promise<void> {
    this.db.close();
  }
}

export function openDatabaseSync(name: string, _options?: any): SQLiteDatabase {
  return new OPSQLiteDatabase(name);
}

export async function openDatabaseAsync(
  name: string,
  _options?: any,
): Promise<SQLiteDatabase> {
  return new OPSQLiteDatabase(name);
}

export default {
  openDatabaseSync,
  openDatabaseAsync,
};
