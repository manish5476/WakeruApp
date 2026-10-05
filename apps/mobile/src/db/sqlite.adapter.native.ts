// src/db/sqlite.adapter.native.ts
import * as SQLite from 'expo-sqlite';
import {
  ILocalDatabase,
  LocalTrip,
  LocalTripMember,
  LocalExpense,
  LocalSplit,
  LocalSettlement,
  LocalSyncQueueItem,
  SyncEntityType,
  SyncOperationType,
} from './database.interface';

export class SQLiteDatabaseAdapter implements ILocalDatabase {
  private db: SQLite.SQLiteDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  async initialize(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      this.db = await SQLite.openDatabaseAsync('tripsplit.db');
      await this.runMigrations();
    })();

    return this.initPromise;
  }

  private async getDb(): Promise<SQLite.SQLiteDatabase> {
    if (!this.db) {
      await this.initialize();
    }
    return this.db!;
  }

  private async runMigrations(): Promise<void> {
    const db = this.db!;
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;

      CREATE TABLE IF NOT EXISTS trips (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        cover_image TEXT,
        start_date TEXT,
        end_date TEXT,
        status TEXT NOT NULL,
        base_currency TEXT NOT NULL,
        total_budget_minor INTEGER NOT NULL DEFAULT 0,
        total_spent_minor INTEGER NOT NULL DEFAULT 0,
        raw_json TEXT,
        sync_status TEXT NOT NULL DEFAULT 'SYNCED',
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS trip_members (
        trip_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        display_name TEXT NOT NULL,
        photo_url TEXT,
        role TEXT NOT NULL,
        is_active INTEGER NOT NULL DEFAULT 1,
        total_paid_minor INTEGER NOT NULL DEFAULT 0,
        total_owes_minor INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (trip_id, user_id)
      );

      CREATE TABLE IF NOT EXISTS expenses (
        id TEXT PRIMARY KEY,
        client_operation_id TEXT NOT NULL,
        trip_id TEXT NOT NULL,
        stop_id TEXT,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        amount_minor INTEGER NOT NULL,
        currency TEXT NOT NULL,
        amount_base_minor INTEGER NOT NULL,
        base_currency TEXT NOT NULL,
        exchange_rate REAL NOT NULL,
        paid_by TEXT NOT NULL,
        paid_by_name TEXT NOT NULL,
        split_method TEXT NOT NULL,
        date TEXT NOT NULL,
        notes TEXT,
        receipt_images_json TEXT,
          latitude REAL,
          longitude REAL,
        is_settled INTEGER NOT NULL DEFAULT 0,
        is_archived INTEGER NOT NULL DEFAULT 0,
        sync_status TEXT NOT NULL DEFAULT 'PENDING',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        raw_json TEXT,
        receipt_hash TEXT,
        receipt_number TEXT,
        receipt_merchant TEXT,
        receipt_date TEXT,
        ocr_parser_version TEXT,
        receipt_image_uri TEXT
      );

      CREATE TABLE IF NOT EXISTS expense_splits (
        id TEXT PRIMARY KEY,
        expense_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        display_name TEXT NOT NULL,
        amount_minor INTEGER NOT NULL,
        amount_base_minor INTEGER NOT NULL,
        percentage REAL,
        shares REAL,
        is_paid INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS settlements (
        trip_id TEXT PRIMARY KEY,
        net_balances_json TEXT,
        transactions_json TEXT,
        is_fully_settled INTEGER NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS sync_queue (
        id TEXT PRIMARY KEY,
        client_operation_id TEXT UNIQUE NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        parent_id TEXT,
        operation_type TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        retry_count INTEGER NOT NULL DEFAULT 0,
        last_attempt_at TEXT,
        last_error TEXT,
        status TEXT NOT NULL DEFAULT 'PENDING',
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS sync_metadata (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_expenses_trip ON expenses(trip_id, is_archived, date DESC);
      CREATE INDEX IF NOT EXISTS idx_expenses_receipt_hash ON expenses(receipt_hash);
      CREATE INDEX IF NOT EXISTS idx_splits_expense ON expense_splits(expense_id);
      CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status, created_at ASC);
      CREATE INDEX IF NOT EXISTS idx_sync_queue_parent ON sync_queue(parent_id);
      CREATE INDEX IF NOT EXISTS idx_members_trip ON trip_members(trip_id);
    `);

    // Non-destructive migrations for existing databases
    try {
      await db.execAsync(`ALTER TABLE sync_queue ADD COLUMN parent_id TEXT;`);
    } catch {
      // column already exists
    }

    const receiptColumns = [
      { name: 'receipt_hash', type: 'TEXT' },
      { name: 'receipt_number', type: 'TEXT' },
      { name: 'receipt_merchant', type: 'TEXT' },
      { name: 'receipt_date', type: 'TEXT' },
      { name: 'ocr_parser_version', type: 'TEXT' },
      { name: 'receipt_image_uri', type: 'TEXT' },
    ];
    for (const col of receiptColumns) {
      try {
        await db.execAsync(
          `ALTER TABLE expenses ADD COLUMN ${col.name} ${col.type};`,
        );
      } catch {
        // column already exists, safe to ignore
      }
    }
  }

  // ----------------------------------------------------------
  // TRIPS
  // ----------------------------------------------------------

  async getTrips(): Promise<LocalTrip[]> {
    const db = await this.getDb();
    const rows = await db.getAllAsync<any>(
      `SELECT id, title, description, cover_image as coverImage, start_date as startDate,
              end_date as endDate, status, base_currency as baseCurrency,
              total_budget_minor as totalBudgetMinor, total_spent_minor as totalSpentMinor,
              raw_json as rawJson, sync_status as syncStatus, updated_at as updatedAt
       FROM trips ORDER BY start_date DESC`,
    );
    return rows;
  }

  async getTripById(id: string): Promise<LocalTrip | null> {
    const db = await this.getDb();
    const row = await db.getFirstAsync<any>(
      `SELECT id, title, description, cover_image as coverImage, start_date as startDate,
              end_date as endDate, status, base_currency as baseCurrency,
              total_budget_minor as totalBudgetMinor, total_spent_minor as totalSpentMinor,
              raw_json as rawJson, sync_status as syncStatus, updated_at as updatedAt
       FROM trips WHERE id = ?`,
      [id],
    );
    return row || null;
  }

  async saveTrip(trip: Partial<LocalTrip>): Promise<void> {
    const db = await this.getDb();
    const existing = trip.id ? await this.getTripById(trip.id) : null;
    const now = new Date().toISOString();

    const merged: LocalTrip = {
      id: trip.id || `local_trip_${Date.now()}`,
      title: trip.title ?? existing?.title ?? 'Untitled Trip',
      description: trip.description ?? existing?.description ?? '',
      coverImage: trip.coverImage ?? existing?.coverImage ?? '',
      startDate: trip.startDate ?? existing?.startDate ?? now,
      endDate: trip.endDate ?? existing?.endDate ?? now,
      status: trip.status ?? existing?.status ?? 'active',
      baseCurrency: trip.baseCurrency ?? existing?.baseCurrency ?? 'INR',
      totalBudgetMinor:
        trip.totalBudgetMinor ?? existing?.totalBudgetMinor ?? 0,
      totalSpentMinor: trip.totalSpentMinor ?? existing?.totalSpentMinor ?? 0,
      rawJson: trip.rawJson ?? existing?.rawJson ?? '',
      syncStatus: trip.syncStatus ?? existing?.syncStatus ?? 'SYNCED',
      updatedAt: trip.updatedAt ?? now,
    };

    await db.runAsync(
      `INSERT OR REPLACE INTO trips (
        id, title, description, cover_image, start_date, end_date, status,
        base_currency, total_budget_minor, total_spent_minor, raw_json, sync_status, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        merged.id,
        merged.title,
        merged.description || '',
        merged.coverImage || '',
        merged.startDate || '',
        merged.endDate || '',
        merged.status,
        merged.baseCurrency,
        merged.totalBudgetMinor,
        merged.totalSpentMinor,
        merged.rawJson || '',
        merged.syncStatus,
        merged.updatedAt,
      ],
    );
  }

  async saveTrips(trips: Partial<LocalTrip>[]): Promise<void> {
    for (const trip of trips) {
      await this.saveTrip(trip);
    }
  }

  async deleteTrip(id: string): Promise<void> {
    const db = await this.getDb();
    await db.runAsync(`DELETE FROM trips WHERE id = ?`, [id]);
  }

  async remapTripId(
    localId: string,
    serverId: string,
    serverStops?: any[],
  ): Promise<void> {
    if (!localId || !serverId || localId === serverId) return;
    const db = await this.getDb();

    // 1. Clean up old local trip record if a record with serverId exists, or remap its ID
    const serverTripExists = await this.getTripById(serverId);
    if (serverTripExists) {
      await db.runAsync(`DELETE FROM trips WHERE id = ?`, [localId]);
    } else {
      await db.runAsync(
        `UPDATE trips SET id = ?, sync_status = 'SYNCED' WHERE id = ?`,
        [serverId, localId],
      );
    }

    // 2. Remap trip_members
    await db.runAsync(
      `UPDATE OR IGNORE trip_members SET trip_id = ? WHERE trip_id = ?`,
      [serverId, localId],
    );
    await db.runAsync(`DELETE FROM trip_members WHERE trip_id = ?`, [localId]);

    // 3. Remap expenses in local DB
    await db.runAsync(`UPDATE expenses SET trip_id = ? WHERE trip_id = ?`, [
      serverId,
      localId,
    ]);

    // 4. Remap stops if canonical server stops are provided
    if (serverStops && serverStops.length > 0 && serverStops[0]?._id) {
      const canonicalStopId = serverStops[0]._id;
      await db.runAsync(
        `UPDATE expenses SET stop_id = ? WHERE trip_id = ? AND (stop_id LIKE 'stop_%' OR stop_id = ? OR stop_id = '' OR stop_id IS NULL)`,
        [canonicalStopId, serverId, localId],
      );
    }

    // 5. Remap pending sync queue items that depend on this trip
    await db.runAsync(
      `UPDATE sync_queue SET parent_id = ? WHERE parent_id = ?`,
      [serverId, localId],
    );
    const queueRows = await db.getAllAsync<any>(
      `SELECT id, payload_json as payloadJson FROM sync_queue WHERE entity_type = 'expense'`,
    );
    for (const row of queueRows) {
      try {
        const payload = JSON.parse(row.payloadJson);
        let changed = false;
        if (payload.tripId === localId) {
          payload.tripId = serverId;
          changed = true;
        }
        if (serverStops && serverStops.length > 0 && serverStops[0]?._id) {
          const canonicalStopId = serverStops[0]._id;
          if (
            payload.stopId &&
            (payload.stopId.startsWith('stop_') || payload.stopId === localId)
          ) {
            payload.stopId = canonicalStopId;
            changed = true;
          }
        }
        if (changed) {
          await db.runAsync(
            `UPDATE sync_queue SET payload_json = ? WHERE id = ?`,
            [JSON.stringify(payload), row.id],
          );
        }
      } catch {}
    }

    // 6. Record mapping in metadata for offline/online reconciliation lookups
    await this.setSyncMetadata(`remapped_trip_${localId}`, serverId);

    // 7. Remove any remaining trip queue entry for this localId
    await this.removeSyncQueueByEntityId(localId);
  }

  // ----------------------------------------------------------
  // TRIP MEMBERS
  // ----------------------------------------------------------

  async getTripMembers(tripId: string): Promise<LocalTripMember[]> {
    const db = await this.getDb();
    const rows = await db.getAllAsync<any>(
      `SELECT trip_id as tripId, user_id as userId, display_name as displayName,
              photo_url as photoURL, role, is_active as isActive,
              total_paid_minor as totalPaidMinor, total_owes_minor as totalOwesMinor
       FROM trip_members WHERE trip_id = ?`,
      [tripId],
    );
    return rows.map(r => ({ ...r, isActive: Boolean(r.isActive) }));
  }

  async saveTripMembers(
    tripId: string,
    members: LocalTripMember[],
  ): Promise<void> {
    const db = await this.getDb();
    for (const m of members) {
      await db.runAsync(
        `INSERT OR REPLACE INTO trip_members (
          trip_id, user_id, display_name, photo_url, role, is_active, total_paid_minor, total_owes_minor
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          tripId,
          m.userId,
          m.displayName,
          m.photoURL || '',
          m.role || 'member',
          m.isActive ? 1 : 0,
          m.totalPaidMinor || 0,
          m.totalOwesMinor || 0,
        ],
      );
    }
  }

  // ----------------------------------------------------------
  // EXPENSES
  // ----------------------------------------------------------

  async getExpenses(tripId: string): Promise<LocalExpense[]> {
    const db = await this.getDb();
    const rows = await db.getAllAsync<any>(
      `SELECT id, client_operation_id as clientOperationId, trip_id as tripId, stop_id as stopId,
              title, category, amount_minor as amountMinor, currency,
              amount_base_minor as amountBaseMinor, base_currency as baseCurrency,
              exchange_rate as exchangeRateUsed, paid_by as paidBy, paid_by_name as paidByName,
              split_method as splitMethod, date, notes, receipt_images_json as receiptImagesJson,
              is_settled as isSettled, is_archived as isArchived, sync_status as syncStatus,
              created_at as createdAt, updated_at as updatedAt, raw_json as rawJson,
              receipt_hash as receiptHash, receipt_number as receiptNumber,
              receipt_merchant as receiptMerchant, receipt_date as receiptDate,
              ocr_parser_version as ocrParserVersion, receipt_image_uri as receiptImageUri
       FROM expenses WHERE trip_id = ? AND is_archived = 0 ORDER BY date DESC, created_at DESC`,
      [tripId],
    );
    return rows.map(r => ({
      ...r,
      isSettled: Boolean(r.isSettled),
      isArchived: Boolean(r.isArchived),
    }));
  }

  async getExpenseById(id: string): Promise<LocalExpense | null> {
    const db = await this.getDb();
    const row = await db.getFirstAsync<any>(
      `SELECT id, client_operation_id as clientOperationId, trip_id as tripId, stop_id as stopId,
              title, category, amount_minor as amountMinor, currency,
              amount_base_minor as amountBaseMinor, base_currency as baseCurrency,
              exchange_rate as exchangeRateUsed, paid_by as paidBy, paid_by_name as paidByName,
              split_method as splitMethod, date, notes, receipt_images_json as receiptImagesJson,
              is_settled as isSettled, is_archived as isArchived, sync_status as syncStatus,
              created_at as createdAt, updated_at as updatedAt, raw_json as rawJson,
              receipt_hash as receiptHash, receipt_number as receiptNumber,
              receipt_merchant as receiptMerchant, receipt_date as receiptDate,
              ocr_parser_version as ocrParserVersion, receipt_image_uri as receiptImageUri
       FROM expenses WHERE id = ?`,
      [id],
    );
    if (!row) return null;
    return {
      ...row,
      isSettled: Boolean(row.isSettled),
      isArchived: Boolean(row.isArchived),
    };
  }

  async findExpenseByReceiptHash(
    tripId: string,
    receiptHash: string,
  ): Promise<LocalExpense | null> {
    const db = await this.getDb();
    const row = await db.getFirstAsync<any>(
      `SELECT id, client_operation_id as clientOperationId, trip_id as tripId, stop_id as stopId,
              title, category, amount_minor as amountMinor, currency,
              amount_base_minor as amountBaseMinor, base_currency as baseCurrency,
              exchange_rate as exchangeRateUsed, paid_by as paidBy, paid_by_name as paidByName,
              split_method as splitMethod, date, notes, receipt_images_json as receiptImagesJson,
              is_settled as isSettled, is_archived as isArchived, sync_status as syncStatus,
              created_at as createdAt, updated_at as updatedAt, raw_json as rawJson,
              receipt_hash as receiptHash, receipt_number as receiptNumber,
              receipt_merchant as receiptMerchant, receipt_date as receiptDate,
              ocr_parser_version as ocrParserVersion, receipt_image_uri as receiptImageUri
       FROM expenses WHERE trip_id = ? AND receipt_hash = ? AND is_archived = 0 LIMIT 1`,
      [tripId, receiptHash],
    );
    if (!row) return null;
    return {
      ...row,
      isSettled: Boolean(row.isSettled),
      isArchived: Boolean(row.isArchived),
    };
  }

  async saveExpense(
    expense: Partial<LocalExpense>,
    splits?: LocalSplit[],
  ): Promise<void> {
    const db = await this.getDb();
    const existing = expense.id ? await this.getExpenseById(expense.id) : null;
    const now = new Date().toISOString();

    const merged: LocalExpense = {
      id:
        expense.id ||
        `local_exp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      clientOperationId:
        expense.clientOperationId ||
        existing?.clientOperationId ||
        `op_${Date.now()}`,
      tripId: expense.tripId ?? existing?.tripId ?? '',
      stopId: expense.stopId ?? existing?.stopId ?? '',
      title: expense.title ?? existing?.title ?? 'Untitled Expense',
      category: expense.category ?? existing?.category ?? 'other',
      amountMinor: expense.amountMinor ?? existing?.amountMinor ?? 0,
      currency: expense.currency ?? existing?.currency ?? 'INR',
      amountBaseMinor:
        expense.amountBaseMinor ?? existing?.amountBaseMinor ?? 0,
      baseCurrency: expense.baseCurrency ?? existing?.baseCurrency ?? 'INR',
      exchangeRateUsed:
        expense.exchangeRateUsed ?? existing?.exchangeRateUsed ?? 1,
      paidBy: expense.paidBy ?? existing?.paidBy ?? '',
      paidByName: expense.paidByName ?? existing?.paidByName ?? '',
      splitMethod: expense.splitMethod ?? existing?.splitMethod ?? 'equal',
      date: expense.date ?? existing?.date ?? now,
      notes: expense.notes ?? existing?.notes ?? '',
      latitude: expense.latitude ?? existing?.latitude ?? null,
      longitude: expense.longitude ?? existing?.longitude ?? null,
      receiptImagesJson:
        expense.receiptImagesJson ?? existing?.receiptImagesJson ?? '[]',
      receiptHash: expense.receiptHash ?? existing?.receiptHash,
      receiptNumber: expense.receiptNumber ?? existing?.receiptNumber,
      receiptMerchant: expense.receiptMerchant ?? existing?.receiptMerchant,
      receiptDate: expense.receiptDate ?? existing?.receiptDate,
      ocrParserVersion: expense.ocrParserVersion ?? existing?.ocrParserVersion,
      receiptImageUri: expense.receiptImageUri ?? existing?.receiptImageUri,
      isSettled: expense.isSettled ?? existing?.isSettled ?? false,
      isArchived: expense.isArchived ?? existing?.isArchived ?? false,
      syncStatus: expense.syncStatus ?? existing?.syncStatus ?? 'PENDING',
      createdAt: expense.createdAt ?? existing?.createdAt ?? now,
      updatedAt: expense.updatedAt ?? now,
      rawJson: expense.rawJson ?? existing?.rawJson ?? '',
    };

    await db.runAsync(
      `INSERT OR REPLACE INTO expenses (
        id, client_operation_id, trip_id, stop_id, title, category,
        amount_minor, currency, amount_base_minor, base_currency, exchange_rate,
        paid_by, paid_by_name, split_method, date, notes, receipt_images_json, latitude, longitude,
        is_settled, is_archived, sync_status, created_at, updated_at, raw_json,
        receipt_hash, receipt_number, receipt_merchant, receipt_date,
        ocr_parser_version, receipt_image_uri
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        merged.id,
        merged.clientOperationId,
        merged.tripId,
        merged.stopId || '',
        merged.title,
        merged.category,
        merged.amountMinor,
        merged.currency,
        merged.amountBaseMinor,
        merged.baseCurrency,
        merged.exchangeRateUsed,
        merged.paidBy,
        merged.paidByName,
        merged.splitMethod,
        merged.date,
        merged.notes || '',
        merged.receiptImagesJson || '[]',
        merged.latitude || null,
        merged.longitude || null,
        merged.isSettled ? 1 : 0,
        merged.isArchived ? 1 : 0,
        merged.syncStatus,
        merged.createdAt,
        merged.updatedAt,
        merged.rawJson || '',
        merged.receiptHash || null,
        merged.receiptNumber || null,
        merged.receiptMerchant || null,
        merged.receiptDate || null,
        merged.ocrParserVersion || null,
        merged.receiptImageUri || null,
      ],
    );

    if (splits && splits.length > 0) {
      await db.runAsync(`DELETE FROM expense_splits WHERE expense_id = ?`, [
        merged.id,
      ]);
      for (const s of splits) {
        await db.runAsync(
          `INSERT INTO expense_splits (
            id, expense_id, user_id, display_name, amount_minor, amount_base_minor, percentage, shares, is_paid
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            s.id || `split_${merged.id}_${s.userId}`,
            merged.id,
            s.userId,
            s.displayName,
            s.amountMinor,
            s.amountBaseMinor,
            s.percentage ?? null,
            s.shares ?? null,
            s.isPaid ? 1 : 0,
          ],
        );
      }
    }
  }

  async updateExpense(
    id: string,
    updates: Partial<LocalExpense>,
  ): Promise<void> {
    const existing = await this.getExpenseById(id);
    if (!existing) return;
    await this.saveExpense({
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  }

  async deleteExpense(id: string, soft: boolean = true): Promise<void> {
    const db = await this.getDb();
    if (soft) {
      await db.runAsync(
        `UPDATE expenses SET is_archived = 1, sync_status = 'PENDING', updated_at = ? WHERE id = ?`,
        [new Date().toISOString(), id],
      );
    } else {
      await db.runAsync(`DELETE FROM expense_splits WHERE expense_id = ?`, [
        id,
      ]);
      await db.runAsync(`DELETE FROM expenses WHERE id = ?`, [id]);
    }
  }

  async remapExpenseId(localId: string, serverId: string): Promise<void> {
    if (!localId || !serverId || localId === serverId) return;
    const db = await this.getDb();

    const serverExpenseExists = await this.getExpenseById(serverId);
    if (serverExpenseExists) {
      await db.runAsync(`DELETE FROM expenses WHERE id = ?`, [localId]);
    } else {
      await db.runAsync(
        `UPDATE expenses SET id = ?, sync_status = 'SYNCED' WHERE id = ?`,
        [serverId, localId],
      );
    }

    await db.runAsync(
      `UPDATE OR IGNORE expense_splits SET expense_id = ? WHERE expense_id = ?`,
      [serverId, localId],
    );
    await db.runAsync(`DELETE FROM expense_splits WHERE expense_id = ?`, [
      localId,
    ]);
    await this.removeSyncQueueByEntityId(localId);
  }

  // ----------------------------------------------------------
  // SPLITS
  // ----------------------------------------------------------

  async getExpenseSplits(expenseId: string): Promise<LocalSplit[]> {
    const db = await this.getDb();
    const rows = await db.getAllAsync<any>(
      `SELECT id, expense_id as expenseId, user_id as userId, display_name as displayName,
              amount_minor as amountMinor, amount_base_minor as amountBaseMinor,
              percentage, shares, is_paid as isPaid
       FROM expense_splits WHERE expense_id = ?`,
      [expenseId],
    );
    return rows.map(r => ({ ...r, isPaid: Boolean(r.isPaid) }));
  }

  // ----------------------------------------------------------
  // SETTLEMENTS
  // ----------------------------------------------------------

  async getSettlement(tripId: string): Promise<LocalSettlement | null> {
    const db = await this.getDb();
    const row = await db.getFirstAsync<any>(
      `SELECT trip_id as tripId, net_balances_json as netBalancesJson,
              transactions_json as transactionsJson, is_fully_settled as isFullySettled,
              updated_at as updatedAt
       FROM settlements WHERE trip_id = ?`,
      [tripId],
    );
    if (!row) return null;
    return {
      ...row,
      isFullySettled: Boolean(row.isFullySettled),
    };
  }

  async saveSettlement(settlement: LocalSettlement): Promise<void> {
    const db = await this.getDb();
    await db.runAsync(
      `INSERT OR REPLACE INTO settlements (
        trip_id, net_balances_json, transactions_json, is_fully_settled, updated_at
      ) VALUES (?, ?, ?, ?, ?)`,
      [
        settlement.tripId,
        settlement.netBalancesJson,
        settlement.transactionsJson,
        settlement.isFullySettled ? 1 : 0,
        settlement.updatedAt || new Date().toISOString(),
      ],
    );
  }

  // ----------------------------------------------------------
  // SYNC QUEUE
  // ----------------------------------------------------------

  async enqueueSync(item: {
    clientOperationId: string;
    entityType: SyncEntityType;
    entityId: string;
    parentId?: string;
    operationType: SyncOperationType;
    payloadJson: string;
  }): Promise<LocalSyncQueueItem> {
    const db = await this.getDb();
    const now = new Date().toISOString();
    const id = `sync_q_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    const queueItem: LocalSyncQueueItem = {
      id,
      clientOperationId: item.clientOperationId,
      entityType: item.entityType,
      entityId: item.entityId,
      parentId: item.parentId,
      operationType: item.operationType,
      payloadJson: item.payloadJson,
      retryCount: 0,
      status: 'PENDING',
      createdAt: now,
    };

    await db.runAsync(
      `INSERT OR REPLACE INTO sync_queue (
        id, client_operation_id, entity_type, entity_id, parent_id, operation_type,
        payload_json, retry_count, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        queueItem.id,
        queueItem.clientOperationId,
        queueItem.entityType,
        queueItem.entityId,
        queueItem.parentId || null,
        queueItem.operationType,
        queueItem.payloadJson,
        queueItem.retryCount,
        queueItem.status,
        queueItem.createdAt,
      ],
    );

    return queueItem;
  }

  async getPendingSyncQueue(
    forceAll: boolean = false,
  ): Promise<LocalSyncQueueItem[]> {
    const db = await this.getDb();
    const statusClause = forceAll
      ? `'PENDING', 'FAILED', 'SYNCING'`
      : `'PENDING', 'FAILED'`;
    const rows = await db.getAllAsync<any>(
      `SELECT id, client_operation_id as clientOperationId, entity_type as entityType,
              entity_id as entityId, parent_id as parentId, operation_type as operationType, payload_json as payloadJson,
              retry_count as retryCount, last_attempt_at as lastAttemptAt, last_error as lastError,
              status, created_at as createdAt
       FROM sync_queue WHERE status IN (${statusClause}) ORDER BY created_at ASC`,
    );
    return rows;
  }

  async updateSyncQueueItem(
    id: string,
    updates: Partial<LocalSyncQueueItem>,
  ): Promise<void> {
    const db = await this.getDb();
    const sets: string[] = [];
    const params: any[] = [];

    if (updates.status !== undefined) {
      sets.push('status = ?');
      params.push(updates.status);
    }
    if (updates.retryCount !== undefined) {
      sets.push('retry_count = ?');
      params.push(updates.retryCount);
    }
    if (updates.lastAttemptAt !== undefined) {
      sets.push('last_attempt_at = ?');
      params.push(updates.lastAttemptAt);
    }
    if (updates.lastError !== undefined) {
      sets.push('last_error = ?');
      params.push(updates.lastError);
    }
    if (updates.payloadJson !== undefined) {
      sets.push('payload_json = ?');
      params.push(updates.payloadJson);
    }
    if (updates.parentId !== undefined) {
      sets.push('parent_id = ?');
      params.push(updates.parentId);
    }

    if (sets.length === 0) return;
    params.push(id);
    await db.runAsync(
      `UPDATE sync_queue SET ${sets.join(', ')} WHERE id = ?`,
      params,
    );
  }

  async removeSyncQueueItem(id: string): Promise<void> {
    const db = await this.getDb();
    await db.runAsync(`DELETE FROM sync_queue WHERE id = ?`, [id]);
  }

  async removeSyncQueueByOperationId(clientOperationId: string): Promise<void> {
    const db = await this.getDb();
    await db.runAsync(`DELETE FROM sync_queue WHERE client_operation_id = ?`, [
      clientOperationId,
    ]);
  }

  async removeSyncQueueByEntityId(entityId: string): Promise<void> {
    const db = await this.getDb();
    await db.runAsync(`DELETE FROM sync_queue WHERE entity_id = ?`, [entityId]);
  }

  async resetStaleSyncingOperations(): Promise<void> {
    const db = await this.getDb();
    await db.runAsync(
      `UPDATE sync_queue SET status = 'PENDING' WHERE status = 'SYNCING'`,
    );
  }

  // ----------------------------------------------------------
  // SYNC METADATA
  // ----------------------------------------------------------

  async getSyncMetadata(key: string): Promise<string | null> {
    const db = await this.getDb();
    const row = await db.getFirstAsync<any>(
      `SELECT value FROM sync_metadata WHERE key = ?`,
      [key],
    );
    return row?.value || null;
  }

  async setSyncMetadata(key: string, value: string): Promise<void> {
    const db = await this.getDb();
    await db.runAsync(
      `INSERT OR REPLACE INTO sync_metadata (key, value, updated_at) VALUES (?, ?, ?)`,
      [key, value, new Date().toISOString()],
    );
  }

  async getCanonicalTripId(tripId: string): Promise<string | null> {
    if (!tripId) return null;
    return this.getSyncMetadata(`remapped_trip_${tripId}`);
  }

  // ----------------------------------------------------------
  // USER LOGOUT CLEANUP
  // ----------------------------------------------------------

  async clearUserData(): Promise<void> {
    const db = await this.getDb();
    await db.execAsync(`
      DELETE FROM expense_splits;
      DELETE FROM expenses;
      DELETE FROM settlements;
      DELETE FROM trip_members;
      DELETE FROM trips;
      DELETE FROM sync_queue;
      DELETE FROM sync_metadata;
    `);
  }
}
