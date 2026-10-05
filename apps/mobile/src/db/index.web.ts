// src/db/index.web.ts
import { ILocalDatabase } from './database.interface';
import { WebDatabaseAdapter } from './web.adapter';

let instance: ILocalDatabase | null = null;

export function getLocalDatabase(): ILocalDatabase {
  if (!instance) {
    instance = new WebDatabaseAdapter();
  }
  return instance!;
}

export * from './database.interface';
