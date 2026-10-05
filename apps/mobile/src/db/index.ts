// src/db/index.ts
import { ILocalDatabase } from './database.interface';
import { SQLiteDatabaseAdapter } from './sqlite.adapter';

let instance: ILocalDatabase | null = null;

export function getLocalDatabase(): ILocalDatabase {
  if (!instance) {
    instance = new SQLiteDatabaseAdapter();
  }
  return instance!;
}
export * from './database.interface';
