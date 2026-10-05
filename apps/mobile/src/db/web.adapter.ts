// src/db/web.adapter.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
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
import { buildStopMapper } from './remap.utils';

const KEYS = {
  TRIPS: 'tripsplit_db_trips',
  MEMBERS: 'tripsplit_db_members',
  EXPENSES: 'tripsplit_db_expenses',
  SPLITS: 'tripsplit_db_splits',
  SETTLEMENTS: 'tripsplit_db_settlements',
  SYNC_QUEUE: 'tripsplit_db_sync_queue',
  METADATA: 'tripsplit_db_metadata',
};

const LOCK_NAME = 'tripsplit_db_write_lock';
const uid = (prefix: string) =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

export class WebDatabaseAdapter implements ILocalDatabase {
  /** In-process write queue. Never rejects. */
  private lock: Promise<void> = Promise.resolve();

  async initialize(): Promise<void> {
    // Web storage needs no migration DDL
    return Promise.resolve();
  }

  // ==================================================================
  // LOW-LEVEL HELPERS
  // ==================================================================

  /**
   * Every read-modify-write MUST go through here. It serializes writes in this tab
   * and, where the Web Locks API exists, across browser tabs too. Without this,
   * two concurrent writes each load the whole map and the last setItem silently
   * erases the other's changes (e.g. a queue item being lost).
   *
   * Never call another mutate()-based method from inside `fn` (deadlock).
   */
  private mutate<T>(fn: () => Promise<T>): Promise<T> {
    const nav: any = typeof navigator !== 'undefined' ? navigator : undefined;
    const exec = (): Promise<T> =>
      nav?.locks?.request
        ? (nav.locks.request(LOCK_NAME, () => fn()) as Promise<T>)
        : fn();

    const run = this.lock.then(exec);
    this.lock = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }

  private async getMap<T>(key: string): Promise<Map<string, T>> {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return new Map();
    try {
      return new Map(Object.entries(JSON.parse(raw)));
    } catch (e) {
      console.warn(`[WEB_DB] Corrupt data in ${key}; treating as empty`, e);
      return new Map();
    }
  }

  private async saveMap<T>(key: string, map: Map<string, T>): Promise<void> {
    await AsyncStorage.setItem(key, JSON.stringify(Object.fromEntries(map)));
  }

  // ==================================================================
  // TRIPS
  // ==================================================================

  async getTrips(): Promise<LocalTrip[]> {
    const map = await this.getMap<LocalTrip>(KEYS.TRIPS);
    return Array.from(map.values()).sort((a, b) =>
      (b.startDate || '').localeCompare(a.startDate || ''),
    );
  }

  async getTripById(id: string): Promise<LocalTrip | null> {
    const map = await this.getMap<LocalTrip>(KEYS.TRIPS);
    return map.get(id) || null;
  }

  private mergeTrip(
    trip: Partial<LocalTrip>,
    existing?: LocalTrip | null,
  ): LocalTrip {
    const now = new Date().toISOString();
    return {
      id: trip.id || uid('web_trip'),
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
  }

  async saveTrip(trip: Partial<LocalTrip>): Promise<void> {
    await this.saveTrips([trip]);
  }

  async saveTrips(trips: Partial<LocalTrip>[]): Promise<void> {
    if (!trips.length) return;
    await this.mutate(async () => {
      const map = await this.getMap<LocalTrip>(KEYS.TRIPS);
      for (const trip of trips) {
        const merged = this.mergeTrip(trip, trip.id ? map.get(trip.id) : null);
        map.set(merged.id, merged);
      }
      await this.saveMap(KEYS.TRIPS, map);
    });
  }

  async deleteTrip(id: string): Promise<void> {
    await this.mutate(async () => {
      const members = await this.getMap<LocalTripMember[]>(KEYS.MEMBERS);
      if (members.delete(id)) await this.saveMap(KEYS.MEMBERS, members);

      const trips = await this.getMap<LocalTrip>(KEYS.TRIPS);
      if (trips.delete(id)) await this.saveMap(KEYS.TRIPS, trips);
    });
  }

  /**
   * Re-keys a local trip to its server ID. Web storage has no real transaction,
   * so this is written to be IDEMPOTENT and orders its writes so that the trip
   * record (which the remap is "discovered" through) is written LAST. If the app
   * dies half-way, running the remap again completes the job.
   */
  async remapTripId(
    localId: string,
    serverId: string,
    serverStops?: any[],
  ): Promise<void> {
    if (!localId || !serverId || localId === serverId) return;

    await this.mutate(async () => {
      const tripMap = await this.getMap<LocalTrip>(KEYS.TRIPS);
      const localTrip = tripMap.get(localId);
      const mapStop = buildStopMapper(localId, localTrip?.rawJson, serverStops);

      // 1. Expenses (trip id + per-stop mapping)
      const expenseMap = await this.getMap<LocalExpense>(KEYS.EXPENSES);
      let expensesChanged = false;
      for (const exp of expenseMap.values()) {
        if (exp.tripId === localId) {
          exp.tripId = serverId;
          expensesChanged = true;
        }
        if (exp.tripId === serverId) {
          const next = mapStop(exp.stopId);
          if (next && next !== exp.stopId) {
            exp.stopId = next;
            expensesChanged = true;
          }
        }
      }
      if (expensesChanged) await this.saveMap(KEYS.EXPENSES, expenseMap);

      // 2. Members
      const memberMap = await this.getMap<LocalTripMember[]>(KEYS.MEMBERS);
      const localMembers = memberMap.get(localId);
      if (localMembers) {
        memberMap.delete(localId);
        if (!memberMap.has(serverId)) {
          memberMap.set(
            serverId,
            localMembers.map(m => ({ ...m, tripId: serverId })),
          );
        }
        await this.saveMap(KEYS.MEMBERS, memberMap);
      }

      // 3. Settlements
      const settlementMap = await this.getMap<LocalSettlement>(
        KEYS.SETTLEMENTS,
      );
      const localSettlement = settlementMap.get(localId);
      if (localSettlement) {
        settlementMap.delete(localId);
        if (!settlementMap.has(serverId))
          settlementMap.set(serverId, { ...localSettlement, tripId: serverId });
        await this.saveMap(KEYS.SETTLEMENTS, settlementMap);
      }

      // 4. Queue: re-point dependents, drop only the confirmed trip CREATE
      const queueMap = await this.getMap<LocalSyncQueueItem>(KEYS.SYNC_QUEUE);
      let stillQueuedForTrip = 0;
      for (const [qId, q] of Array.from(queueMap.entries())) {
        if (
          q.entityType === 'trip' &&
          q.entityId === localId &&
          q.operationType === 'CREATE'
        ) {
          queueMap.delete(qId);
          continue;
        }
        if (q.parentId === localId) q.parentId = serverId;
        if (q.entityType === 'trip' && q.entityId === localId)
          q.entityId = serverId;

        if (q.entityType === 'expense' || q.entityType === 'settlement') {
          try {
            const p = JSON.parse(q.payloadJson);
            let changed = false;
            if (p.tripId === localId) {
              p.tripId = serverId;
              changed = true;
            }
            if (p.stopId !== undefined) {
              const next = mapStop(p.stopId);
              if (next && next !== p.stopId) {
                p.stopId = next;
                changed = true;
              }
            }
            if (changed) q.payloadJson = JSON.stringify(p);
          } catch {
            // unparsable payload: leave untouched
          }
        }
        if (q.entityType === 'trip' && q.entityId === serverId)
          stillQueuedForTrip++;
      }
      await this.saveMap(KEYS.SYNC_QUEUE, queueMap);

      // 5. Permanent mapping
      const meta = await this.getMap<string>(KEYS.METADATA);
      meta.set(`remapped_trip_${localId}`, serverId);
      await this.saveMap(KEYS.METADATA, meta);

      // 6. Trip record LAST
      const status = stillQueuedForTrip > 0 ? 'PENDING' : 'SYNCED';
      if (localTrip) {
        tripMap.delete(localId);
        const serverExisting = tripMap.get(serverId);
        tripMap.set(serverId, {
          ...(serverExisting ?? localTrip),
          id: serverId,
          syncStatus: status,
          updatedAt: new Date().toISOString(),
        });
      } else {
        const serverExisting = tripMap.get(serverId);
        if (serverExisting)
          tripMap.set(serverId, { ...serverExisting, syncStatus: status });
      }
      await this.saveMap(KEYS.TRIPS, tripMap);
    });
  }

  // ==================================================================
  // TRIP MEMBERS
  // ==================================================================

  async getTripMembers(tripId: string): Promise<LocalTripMember[]> {
    const map = await this.getMap<LocalTripMember[]>(KEYS.MEMBERS);
    return map.get(tripId) || [];
  }

  async saveTripMembers(
    tripId: string,
    members: LocalTripMember[],
  ): Promise<void> {
    await this.mutate(async () => {
      const map = await this.getMap<LocalTripMember[]>(KEYS.MEMBERS);
      map.set(tripId, members);
      await this.saveMap(KEYS.MEMBERS, map);
    });
  }

  // ==================================================================
  // EXPENSES
  // ==================================================================

  async getExpenses(tripId: string): Promise<LocalExpense[]> {
    const map = await this.getMap<LocalExpense>(KEYS.EXPENSES);
    return Array.from(map.values())
      .filter(e => e.tripId === tripId && !e.isArchived)
      .sort(
        (a, b) =>
          b.date.localeCompare(a.date) ||
          (b.createdAt || '').localeCompare(a.createdAt || ''),
      );
  }

  async getExpenseById(id: string): Promise<LocalExpense | null> {
    const map = await this.getMap<LocalExpense>(KEYS.EXPENSES);
    return map.get(id) || null;
  }

  async findExpenseByReceiptHash(
    tripId: string,
    receiptHash: string,
  ): Promise<LocalExpense | null> {
    const map = await this.getMap<LocalExpense>(KEYS.EXPENSES);
    for (const exp of map.values()) {
      if (
        exp.tripId === tripId &&
        exp.receiptHash === receiptHash &&
        !exp.isArchived
      )
        return exp;
    }
    return null;
  }

  private mergeExpense(
    expense: Partial<LocalExpense>,
    existing?: LocalExpense | null,
  ): LocalExpense {
    const now = new Date().toISOString();
    return {
      id: expense.id || uid('web_exp'),
      clientOperationId:
        expense.clientOperationId || existing?.clientOperationId || uid('op'),
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
  }

  private async _saveExpense(
    expense: Partial<LocalExpense>,
    splits?: LocalSplit[],
  ): Promise<void> {
    const map = await this.getMap<LocalExpense>(KEYS.EXPENSES);
    const merged = this.mergeExpense(
      expense,
      expense.id ? map.get(expense.id) : null,
    );
    map.set(merged.id, merged);
    await this.saveMap(KEYS.EXPENSES, map);

    if (splits && splits.length > 0) {
      const splitsMap = await this.getMap<LocalSplit[]>(KEYS.SPLITS);
      splitsMap.set(merged.id, splits);
      await this.saveMap(KEYS.SPLITS, splitsMap);
    }
  }

  async saveExpense(
    expense: Partial<LocalExpense>,
    splits?: LocalSplit[],
  ): Promise<void> {
    await this.mutate(() => this._saveExpense(expense, splits));
  }

  async updateExpense(
    id: string,
    updates: Partial<LocalExpense>,
  ): Promise<void> {
    await this.mutate(async () => {
      const map = await this.getMap<LocalExpense>(KEYS.EXPENSES);
      const existing = map.get(id);
      if (!existing) return;
      map.set(
        id,
        this.mergeExpense(
          { ...existing, ...updates, id, updatedAt: new Date().toISOString() },
          existing,
        ),
      );
      await this.saveMap(KEYS.EXPENSES, map);
    });
  }

  async deleteExpense(id: string, soft: boolean = true): Promise<void> {
    await this.mutate(async () => {
      const map = await this.getMap<LocalExpense>(KEYS.EXPENSES);
      const existing = map.get(id);
      if (!existing) return;

      if (soft) {
        map.set(id, {
          ...existing,
          isArchived: true,
          syncStatus: 'PENDING',
          updatedAt: new Date().toISOString(),
        });
        await this.saveMap(KEYS.EXPENSES, map);
      } else {
        map.delete(id);
        await this.saveMap(KEYS.EXPENSES, map);
        const splitsMap = await this.getMap<LocalSplit[]>(KEYS.SPLITS);
        if (splitsMap.delete(id)) await this.saveMap(KEYS.SPLITS, splitsMap);
      }
    });
  }

  async remapExpenseId(localId: string, serverId: string): Promise<void> {
    if (!localId || !serverId || localId === serverId) return;

    await this.mutate(async () => {
      // Splits first, expense record after (idempotent on retry)
      const splitsMap = await this.getMap<LocalSplit[]>(KEYS.SPLITS);
      const splits = splitsMap.get(localId);
      if (splits) {
        splitsMap.delete(localId);
        if (!splitsMap.has(serverId)) {
          splitsMap.set(
            serverId,
            splits.map(s => ({ ...s, expenseId: serverId })),
          );
        }
        await this.saveMap(KEYS.SPLITS, splitsMap);
      }

      const queueMap = await this.getMap<LocalSyncQueueItem>(KEYS.SYNC_QUEUE);
      let remaining = 0;
      for (const [qId, q] of Array.from(queueMap.entries())) {
        if (q.entityType !== 'expense' || q.entityId !== localId) {
          if (q.entityType === 'expense' && q.entityId === serverId)
            remaining++;
          continue;
        }
        if (q.operationType === 'CREATE') {
          queueMap.delete(qId);
        } else {
          q.entityId = serverId;
          remaining++;
        }
      }
      await this.saveMap(KEYS.SYNC_QUEUE, queueMap);

      const map = await this.getMap<LocalExpense>(KEYS.EXPENSES);
      const local = map.get(localId);
      const status = remaining > 0 ? 'PENDING' : 'SYNCED';
      if (local) {
        map.delete(localId);
        const serverExisting = map.get(serverId);
        map.set(serverId, {
          ...(serverExisting ?? local),
          id: serverId,
          syncStatus: status,
          updatedAt: new Date().toISOString(),
        });
        await this.saveMap(KEYS.EXPENSES, map);
      }
    });
  }

  // ==================================================================
  // SPLITS
  // ==================================================================

  async getExpenseSplits(expenseId: string): Promise<LocalSplit[]> {
    const map = await this.getMap<LocalSplit[]>(KEYS.SPLITS);
    return map.get(expenseId) || [];
  }

  // ==================================================================
  // SETTLEMENTS
  // ==================================================================

  async getSettlement(tripId: string): Promise<LocalSettlement | null> {
    const map = await this.getMap<LocalSettlement>(KEYS.SETTLEMENTS);
    return map.get(tripId) || null;
  }

  async saveSettlement(settlement: LocalSettlement): Promise<void> {
    await this.mutate(async () => {
      const map = await this.getMap<LocalSettlement>(KEYS.SETTLEMENTS);
      map.set(settlement.tripId, settlement);
      await this.saveMap(KEYS.SETTLEMENTS, map);
    });
  }

  // ==================================================================
  // SYNC QUEUE
  // ==================================================================

  async enqueueSync(item: {
    clientOperationId: string;
    entityType: SyncEntityType;
    entityId: string;
    parentId?: string;
    operationType: SyncOperationType;
    payloadJson: string;
  }): Promise<LocalSyncQueueItem> {
    return this.mutate(async () => {
      const map = await this.getMap<LocalSyncQueueItem>(KEYS.SYNC_QUEUE);

      // Idempotent, mirrors the UNIQUE(client_operation_id) constraint in SQLite
      for (const existing of map.values()) {
        if (existing.clientOperationId === item.clientOperationId)
          return existing;
      }

      const queueItem: LocalSyncQueueItem = {
        id: uid('web_sync'),
        clientOperationId: item.clientOperationId,
        entityType: item.entityType,
        entityId: item.entityId,
        parentId: item.parentId,
        operationType: item.operationType,
        payloadJson: item.payloadJson,
        retryCount: 0,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      };
      map.set(queueItem.id, queueItem);
      await this.saveMap(KEYS.SYNC_QUEUE, map);
      return queueItem;
    });
  }

  async getPendingSyncQueue(
    forceAll: boolean = false,
  ): Promise<LocalSyncQueueItem[]> {
    const map = await this.getMap<LocalSyncQueueItem>(KEYS.SYNC_QUEUE);
    const allowed = forceAll
      ? ['PENDING', 'FAILED', 'SYNCING']
      : ['PENDING', 'FAILED'];
    return Array.from(map.values())
      .filter(q => allowed.includes(q.status))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async updateSyncQueueItem(
    id: string,
    updates: Partial<LocalSyncQueueItem>,
  ): Promise<void> {
    await this.mutate(async () => {
      const map = await this.getMap<LocalSyncQueueItem>(KEYS.SYNC_QUEUE);
      const existing = map.get(id);
      if (!existing) return;

      // Ignore undefined values so they can't erase existing fields
      const defined = Object.fromEntries(
        Object.entries(updates).filter(([, v]) => v !== undefined),
      );
      map.set(id, { ...existing, ...defined });
      await this.saveMap(KEYS.SYNC_QUEUE, map);
    });
  }

  async removeSyncQueueItem(id: string): Promise<void> {
    await this.mutate(async () => {
      const map = await this.getMap<LocalSyncQueueItem>(KEYS.SYNC_QUEUE);
      if (map.delete(id)) await this.saveMap(KEYS.SYNC_QUEUE, map);
    });
  }

  async removeSyncQueueByOperationId(clientOperationId: string): Promise<void> {
    await this.mutate(async () => {
      const map = await this.getMap<LocalSyncQueueItem>(KEYS.SYNC_QUEUE);
      let changed = false;
      for (const [id, item] of Array.from(map.entries())) {
        if (item.clientOperationId === clientOperationId) {
          map.delete(id);
          changed = true;
        }
      }
      if (changed) await this.saveMap(KEYS.SYNC_QUEUE, map);
    });
  }

  async removeSyncQueueByEntityId(entityId: string): Promise<void> {
    await this.mutate(async () => {
      const map = await this.getMap<LocalSyncQueueItem>(KEYS.SYNC_QUEUE);
      let changed = false;
      for (const [id, item] of Array.from(map.entries())) {
        if (item.entityId === entityId) {
          map.delete(id);
          changed = true;
        }
      }
      if (changed) await this.saveMap(KEYS.SYNC_QUEUE, map);
    });
  }

  async resetStaleSyncingOperations(): Promise<void> {
    await this.mutate(async () => {
      const map = await this.getMap<LocalSyncQueueItem>(KEYS.SYNC_QUEUE);
      let changed = false;
      for (const item of map.values()) {
        if (item.status === 'SYNCING') {
          item.status = 'PENDING';
          changed = true;
        }
      }
      if (changed) await this.saveMap(KEYS.SYNC_QUEUE, map);
    });
  }

  // ==================================================================
  // SYNC METADATA
  // ==================================================================

  async getSyncMetadata(key: string): Promise<string | null> {
    const map = await this.getMap<string>(KEYS.METADATA);
    return map.get(key) || null;
  }

  async setSyncMetadata(key: string, value: string): Promise<void> {
    await this.mutate(async () => {
      const map = await this.getMap<string>(KEYS.METADATA);
      map.set(key, value);
      await this.saveMap(KEYS.METADATA, map);
    });
  }

  /** Follows remap chains (A -> B -> C) with a loop guard. Returns null if never remapped. */
  async getCanonicalTripId(tripId: string): Promise<string | null> {
    if (!tripId) return null;
    let current = tripId;
    let found: string | null = null;
    for (let i = 0; i < 5; i++) {
      const next = await this.getSyncMetadata(`remapped_trip_${current}`);
      if (!next || next === current) break;
      found = next;
      current = next;
    }
    return found;
  }

  // ==================================================================
  // USER LOGOUT CLEANUP
  // ==================================================================

  async clearUserData(): Promise<void> {
    await this.mutate(async () => {
      await AsyncStorage.multiRemove(Object.values(KEYS));
    });
  }
}
// // src/db/web.adapter.ts
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import {
//   ILocalDatabase,
//   LocalTrip,
//   LocalTripMember,
//   LocalExpense,
//   LocalSplit,
//   LocalSettlement,
//   LocalSyncQueueItem,
//   SyncEntityType,
//   SyncOperationType,
// } from './database.interface';

// const KEYS = {
//   TRIPS: 'tripsplit_db_trips',
//   MEMBERS: 'tripsplit_db_members',
//   EXPENSES: 'tripsplit_db_expenses',
//   SPLITS: 'tripsplit_db_splits',
//   SETTLEMENTS: 'tripsplit_db_settlements',
//   SYNC_QUEUE: 'tripsplit_db_sync_queue',
//   METADATA: 'tripsplit_db_metadata',
// };

// export class WebDatabaseAdapter implements ILocalDatabase {
//   async initialize(): Promise<void> {
//     // Web AsyncStorage requires no migration DDL
//     return Promise.resolve();
//   }

//   private async getMap<T>(key: string): Promise<Map<string, T>> {
//     const raw = await AsyncStorage.getItem(key);
//     if (!raw) return new Map();
//     try {
//       const parsed = JSON.parse(raw);
//       return new Map(Object.entries(parsed));
//     } catch {
//       return new Map();
//     }
//   }

//   private async saveMap<T>(key: string, map: Map<string, T>): Promise<void> {
//     const obj = Object.fromEntries(map);
//     await AsyncStorage.setItem(key, JSON.stringify(obj));
//   }

//   // ----------------------------------------------------------
//   // TRIPS
//   // ----------------------------------------------------------

//   async getTrips(): Promise<LocalTrip[]> {
//     const map = await this.getMap<LocalTrip>(KEYS.TRIPS);
//     return Array.from(map.values()).sort((a, b) =>
//       (b.startDate || '').localeCompare(a.startDate || '')
//     );
//   }

//   async getTripById(id: string): Promise<LocalTrip | null> {
//     const map = await this.getMap<LocalTrip>(KEYS.TRIPS);
//     return map.get(id) || null;
//   }

//   async saveTrip(trip: Partial<LocalTrip>): Promise<void> {
//     const map = await this.getMap<LocalTrip>(KEYS.TRIPS);
//     const existing = trip.id ? map.get(trip.id) : null;
//     const now = new Date().toISOString();

//     const merged: LocalTrip = {
//       id: trip.id || `web_trip_${Date.now()}`,
//       title: trip.title ?? existing?.title ?? 'Untitled Trip',
//       description: trip.description ?? existing?.description ?? '',
//       coverImage: trip.coverImage ?? existing?.coverImage ?? '',
//       startDate: trip.startDate ?? existing?.startDate ?? now,
//       endDate: trip.endDate ?? existing?.endDate ?? now,
//       status: trip.status ?? existing?.status ?? 'active',
//       baseCurrency: trip.baseCurrency ?? existing?.baseCurrency ?? 'INR',
//       totalBudgetMinor: trip.totalBudgetMinor ?? existing?.totalBudgetMinor ?? 0,
//       totalSpentMinor: trip.totalSpentMinor ?? existing?.totalSpentMinor ?? 0,
//       rawJson: trip.rawJson ?? existing?.rawJson ?? '',
//       syncStatus: trip.syncStatus ?? existing?.syncStatus ?? 'SYNCED',
//       updatedAt: trip.updatedAt ?? now,
//     };

//     map.set(merged.id, merged);
//     await this.saveMap(KEYS.TRIPS, map);
//   }

//   async saveTrips(trips: Partial<LocalTrip>[]): Promise<void> {
//     for (const trip of trips) {
//       await this.saveTrip(trip);
//     }
//   }

//   async deleteTrip(id: string): Promise<void> {
//     const map = await this.getMap<LocalTrip>(KEYS.TRIPS);
//     map.delete(id);
//     await this.saveMap(KEYS.TRIPS, map);
//   }

//   async remapTripId(localId: string, serverId: string, serverStops?: any[]): Promise<void> {
//     if (!localId || !serverId || localId === serverId) return;

//     // 1. Remap Trips
//     const tripMap = await this.getMap<LocalTrip>(KEYS.TRIPS);
//     const existing = tripMap.get(localId);
//     if (existing) {
//       tripMap.delete(localId);
//       tripMap.set(serverId, { ...existing, id: serverId, syncStatus: 'SYNCED', updatedAt: new Date().toISOString() });
//       await this.saveMap(KEYS.TRIPS, tripMap);
//     }

//     // 2. Remap Members
//     const memberMap = await this.getMap<LocalTripMember[]>(KEYS.MEMBERS);
//     const members = memberMap.get(localId);
//     if (members) {
//       memberMap.delete(localId);
//       memberMap.set(serverId, members.map(m => ({ ...m, tripId: serverId })));
//       await this.saveMap(KEYS.MEMBERS, memberMap);
//     }

//     // 3. Remap Expenses
//     const expenseMap = await this.getMap<LocalExpense>(KEYS.EXPENSES);
//     const primaryStopId = serverStops?.[0]?._id;
//     for (const [expId, exp] of expenseMap.entries()) {
//       if (exp.tripId === localId) {
//         exp.tripId = serverId;
//         if (primaryStopId && (exp.stopId?.startsWith('stop_') || exp.stopId === localId)) {
//           exp.stopId = primaryStopId;
//         }
//       }
//     }
//     await this.saveMap(KEYS.EXPENSES, expenseMap);

//     // 4. Remap Queue
//     const queueMap = await this.getMap<LocalSyncQueueItem>(KEYS.SYNC_QUEUE);
//     for (const [qId, qItem] of queueMap.entries()) {
//       if (qItem.parentId === localId) qItem.parentId = serverId;
//       try {
//         const p = JSON.parse(qItem.payloadJson);
//         let changed = false;
//         if (p.tripId === localId) { p.tripId = serverId; changed = true; }
//         if (primaryStopId && (p.stopId?.startsWith('stop_') || p.stopId === localId)) { p.stopId = primaryStopId; changed = true; }
//         if (changed) qItem.payloadJson = JSON.stringify(p);
//       } catch {}
//     }
//     await this.saveMap(KEYS.SYNC_QUEUE, queueMap);

//     // 5. Metadata & clean
//     await this.setSyncMetadata(`remapped_trip_${localId}`, serverId);
//     await this.removeSyncQueueByEntityId(localId);
//   }

//   // ----------------------------------------------------------
//   // TRIP MEMBERS
//   // ----------------------------------------------------------

//   async getTripMembers(tripId: string): Promise<LocalTripMember[]> {
//     const map = await this.getMap<LocalTripMember[]>(KEYS.MEMBERS);
//     return map.get(tripId) || [];
//   }

//   async saveTripMembers(tripId: string, members: LocalTripMember[]): Promise<void> {
//     const map = await this.getMap<LocalTripMember[]>(KEYS.MEMBERS);
//     map.set(tripId, members);
//     await this.saveMap(KEYS.MEMBERS, map);
//   }

//   // ----------------------------------------------------------
//   // EXPENSES
//   // ----------------------------------------------------------

//   async getExpenses(tripId: string): Promise<LocalExpense[]> {
//     const map = await this.getMap<LocalExpense>(KEYS.EXPENSES);
//     return Array.from(map.values())
//       .filter((e) => e.tripId === tripId && !e.isArchived)
//       .sort((a, b) => b.date.localeCompare(a.date));
//   }

//   async getExpenseById(id: string): Promise<LocalExpense | null> {
//     const map = await this.getMap<LocalExpense>(KEYS.EXPENSES);
//     return map.get(id) || null;
//   }

//   async findExpenseByReceiptHash(tripId: string, receiptHash: string): Promise<LocalExpense | null> {
//     const map = await this.getMap<LocalExpense>(KEYS.EXPENSES);
//     for (const exp of map.values()) {
//       if (exp.tripId === tripId && exp.receiptHash === receiptHash && !exp.isArchived) {
//         return exp;
//       }
//     }
//     return null;
//   }

//   async saveExpense(expense: Partial<LocalExpense>, splits?: LocalSplit[]): Promise<void> {
//     const map = await this.getMap<LocalExpense>(KEYS.EXPENSES);
//     const existing = expense.id ? map.get(expense.id) : null;
//     const now = new Date().toISOString();

//     const merged: LocalExpense = {
//       id: expense.id || `web_exp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
//       clientOperationId: expense.clientOperationId || existing?.clientOperationId || `op_${Date.now()}`,
//       tripId: expense.tripId ?? existing?.tripId ?? '',
//       stopId: expense.stopId ?? existing?.stopId ?? '',
//       title: expense.title ?? existing?.title ?? 'Untitled Expense',
//       category: expense.category ?? existing?.category ?? 'other',
//       amountMinor: expense.amountMinor ?? existing?.amountMinor ?? 0,
//       currency: expense.currency ?? existing?.currency ?? 'INR',
//       amountBaseMinor: expense.amountBaseMinor ?? existing?.amountBaseMinor ?? 0,
//       baseCurrency: expense.baseCurrency ?? existing?.baseCurrency ?? 'INR',
//       exchangeRateUsed: expense.exchangeRateUsed ?? existing?.exchangeRateUsed ?? 1,
//       paidBy: expense.paidBy ?? existing?.paidBy ?? '',
//       paidByName: expense.paidByName ?? existing?.paidByName ?? '',
//       splitMethod: expense.splitMethod ?? existing?.splitMethod ?? 'equal',
//       date: expense.date ?? existing?.date ?? now,
//       notes: expense.notes ?? existing?.notes ?? '',
//       receiptImagesJson: expense.receiptImagesJson ?? existing?.receiptImagesJson ?? '[]',
//       receiptHash: expense.receiptHash ?? existing?.receiptHash,
//       receiptNumber: expense.receiptNumber ?? existing?.receiptNumber,
//       receiptMerchant: expense.receiptMerchant ?? existing?.receiptMerchant,
//       receiptDate: expense.receiptDate ?? existing?.receiptDate,
//       ocrParserVersion: expense.ocrParserVersion ?? existing?.ocrParserVersion,
//       receiptImageUri: expense.receiptImageUri ?? existing?.receiptImageUri,
//       isSettled: expense.isSettled ?? existing?.isSettled ?? false,
//       isArchived: expense.isArchived ?? existing?.isArchived ?? false,
//       syncStatus: expense.syncStatus ?? existing?.syncStatus ?? 'PENDING',
//       createdAt: expense.createdAt ?? existing?.createdAt ?? now,
//       updatedAt: expense.updatedAt ?? now,
//       rawJson: expense.rawJson ?? existing?.rawJson ?? '',
//     };

//     map.set(merged.id, merged);
//     await this.saveMap(KEYS.EXPENSES, map);

//     if (splits && splits.length > 0) {
//       const splitsMap = await this.getMap<LocalSplit[]>(KEYS.SPLITS);
//       splitsMap.set(merged.id, splits);
//       await this.saveMap(KEYS.SPLITS, splitsMap);
//     }
//   }

//   async updateExpense(id: string, updates: Partial<LocalExpense>): Promise<void> {
//     const existing = await this.getExpenseById(id);
//     if (!existing) return;
//     await this.saveExpense({ ...existing, ...updates, updatedAt: new Date().toISOString() });
//   }

//   async deleteExpense(id: string, soft: boolean = true): Promise<void> {
//     const map = await this.getMap<LocalExpense>(KEYS.EXPENSES);
//     if (!map.has(id)) return;

//     if (soft) {
//       const existing = map.get(id)!;
//       existing.isArchived = true;
//       existing.syncStatus = 'PENDING';
//       existing.updatedAt = new Date().toISOString();
//       map.set(id, existing);
//     } else {
//       map.delete(id);
//       const splitsMap = await this.getMap<LocalSplit[]>(KEYS.SPLITS);
//       splitsMap.delete(id);
//       await this.saveMap(KEYS.SPLITS, splitsMap);
//     }
//     await this.saveMap(KEYS.EXPENSES, map);
//   }

//   async remapExpenseId(localId: string, serverId: string): Promise<void> {
//     if (!localId || !serverId || localId === serverId) return;
//     const map = await this.getMap<LocalExpense>(KEYS.EXPENSES);
//     const existing = map.get(localId);
//     if (existing) {
//       map.delete(localId);
//       map.set(serverId, { ...existing, id: serverId, syncStatus: 'SYNCED', updatedAt: new Date().toISOString() });
//       await this.saveMap(KEYS.EXPENSES, map);
//     }

//     const splitsMap = await this.getMap<LocalSplit[]>(KEYS.SPLITS);
//     const splits = splitsMap.get(localId);
//     if (splits) {
//       splitsMap.delete(localId);
//       splitsMap.set(serverId, splits.map(s => ({ ...s, expenseId: serverId })));
//       await this.saveMap(KEYS.SPLITS, splitsMap);
//     }
//     await this.removeSyncQueueByEntityId(localId);
//   }

//   // ----------------------------------------------------------
//   // SPLITS
//   // ----------------------------------------------------------

//   async getExpenseSplits(expenseId: string): Promise<LocalSplit[]> {
//     const map = await this.getMap<LocalSplit[]>(KEYS.SPLITS);
//     return map.get(expenseId) || [];
//   }

//   // ----------------------------------------------------------
//   // SETTLEMENTS
//   // ----------------------------------------------------------

//   async getSettlement(tripId: string): Promise<LocalSettlement | null> {
//     const map = await this.getMap<LocalSettlement>(KEYS.SETTLEMENTS);
//     return map.get(tripId) || null;
//   }

//   async saveSettlement(settlement: LocalSettlement): Promise<void> {
//     const map = await this.getMap<LocalSettlement>(KEYS.SETTLEMENTS);
//     map.set(settlement.tripId, settlement);
//     await this.saveMap(KEYS.SETTLEMENTS, map);
//   }

//   // ----------------------------------------------------------
//   // SYNC QUEUE
//   // ----------------------------------------------------------

//   async enqueueSync(item: {
//     clientOperationId: string;
//     entityType: SyncEntityType;
//     entityId: string;
//     parentId?: string;
//     operationType: SyncOperationType;
//     payloadJson: string;
//   }): Promise<LocalSyncQueueItem> {
//     const map = await this.getMap<LocalSyncQueueItem>(KEYS.SYNC_QUEUE);
//     const id = `web_sync_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
//     const queueItem: LocalSyncQueueItem = {
//       id,
//       clientOperationId: item.clientOperationId,
//       entityType: item.entityType,
//       entityId: item.entityId,
//       parentId: item.parentId,
//       operationType: item.operationType,
//       payloadJson: item.payloadJson,
//       retryCount: 0,
//       status: 'PENDING',
//       createdAt: new Date().toISOString(),
//     };
//     map.set(id, queueItem);
//     await this.saveMap(KEYS.SYNC_QUEUE, map);
//     return queueItem;
//   }

//   async getPendingSyncQueue(forceAll: boolean = false): Promise<LocalSyncQueueItem[]> {
//     const map = await this.getMap<LocalSyncQueueItem>(KEYS.SYNC_QUEUE);
//     return Array.from(map.values())
//       .filter((q) => forceAll ? (q.status === 'PENDING' || q.status === 'FAILED' || q.status === 'SYNCING') : (q.status === 'PENDING' || q.status === 'FAILED'))
//       .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
//   }

//   async updateSyncQueueItem(id: string, updates: Partial<LocalSyncQueueItem>): Promise<void> {
//     const map = await this.getMap<LocalSyncQueueItem>(KEYS.SYNC_QUEUE);
//     const existing = map.get(id);
//     if (!existing) return;
//     map.set(id, { ...existing, ...updates });
//     await this.saveMap(KEYS.SYNC_QUEUE, map);
//   }

//   async removeSyncQueueItem(id: string): Promise<void> {
//     const map = await this.getMap<LocalSyncQueueItem>(KEYS.SYNC_QUEUE);
//     map.delete(id);
//     await this.saveMap(KEYS.SYNC_QUEUE, map);
//   }

//   async removeSyncQueueByOperationId(clientOperationId: string): Promise<void> {
//     const map = await this.getMap<LocalSyncQueueItem>(KEYS.SYNC_QUEUE);
//     for (const [id, item] of map.entries()) {
//       if (item.clientOperationId === clientOperationId) {
//         map.delete(id);
//       }
//     }
//     await this.saveMap(KEYS.SYNC_QUEUE, map);
//   }

//   async removeSyncQueueByEntityId(entityId: string): Promise<void> {
//     const map = await this.getMap<LocalSyncQueueItem>(KEYS.SYNC_QUEUE);
//     for (const [id, item] of map.entries()) {
//       if (item.entityId === entityId) {
//         map.delete(id);
//       }
//     }
//     await this.saveMap(KEYS.SYNC_QUEUE, map);
//   }

//   async resetStaleSyncingOperations(): Promise<void> {
//     const map = await this.getMap<LocalSyncQueueItem>(KEYS.SYNC_QUEUE);
//     for (const item of map.values()) {
//       if (item.status === 'SYNCING') {
//         item.status = 'PENDING';
//       }
//     }
//     await this.saveMap(KEYS.SYNC_QUEUE, map);
//   }

//   // ----------------------------------------------------------
//   // SYNC METADATA
//   // ----------------------------------------------------------

//   async getSyncMetadata(key: string): Promise<string | null> {
//     const map = await this.getMap<string>(KEYS.METADATA);
//     return map.get(key) || null;
//   }

//   async setSyncMetadata(key: string, value: string): Promise<void> {
//     const map = await this.getMap<string>(KEYS.METADATA);
//     map.set(key, value);
//     await this.saveMap(KEYS.METADATA, map);
//   }

//   async getCanonicalTripId(tripId: string): Promise<string | null> {
//     if (!tripId) return null;
//     return this.getSyncMetadata(`remapped_trip_${tripId}`);
//   }

//   // ----------------------------------------------------------
//   // USER LOGOUT CLEANUP
//   // ----------------------------------------------------------

//   async clearUserData(): Promise<void> {
//     await AsyncStorage.multiRemove(Object.values(KEYS));
//   }
// }
