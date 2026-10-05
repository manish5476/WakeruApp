// src/sync/syncEngine.ts
import apiClient from '../services/api/client';
import { getLocalDatabase } from '../db';
import { syncQueue } from './syncQueue';
import { ConflictResolver } from './conflictResolver';
import { queryClient } from '../providers/QueryProvider';
import { queryKeys } from '../hooks/queryKeys';

// Lazy getters to break circular dependencies:
// syncEngine ↔ trip.repository, syncEngine ↔ expense.repository, syncEngine ↔ widgetService
const getWidgetService = () =>
  require('../services/widget/widgetService').widgetService;
const getTripRepository = () =>
  require('../repositories/trip.repository').tripRepository;
const getExpenseRepository = () =>
  require('../repositories/expense.repository').expenseRepository;

export interface SyncResult {
  pushedCount: number;
  pulledCount: number;
  conflictsCount: number;
  errors: string[];
}

export type SyncListener = (
  state: 'IDLE' | 'SYNCING' | 'SYNCED' | 'ERROR',
) => void;

export class SyncEngine {
  private db = getLocalDatabase();
  private isSyncing = false;
  private listeners: Set<SyncListener> = new Set();

  subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(state: 'IDLE' | 'SYNCING' | 'SYNCED' | 'ERROR') {
    this.listeners.forEach(fn => fn(state));
  }

  /**
   * Pushes all pending local operations to the backend with idempotency keys.
   * Orders operations (Trips -> Expenses -> Settlements) and handles ID reconciliation.
   */
  async pushPendingChanges(
    forceRetry: boolean = false,
  ): Promise<{ pushedCount: number; conflicts: number; errors: string[] }> {
    // 0. Recover any operations stuck in SYNCING from a previous crash/interruption
    await this.db.resetStaleSyncingOperations().catch(() => {});

    // 1. Fetch pending/failed operations (forceRetry bypasses backoff delay)
    const rawOps = await syncQueue.getPendingOperations(forceRetry);
    if (rawOps.length === 0) {
      return { pushedCount: 0, conflicts: 0, errors: [] };
    }

    console.log(
      `[SYNC_OPERATION_START] Found ${rawOps.length} pending operations (forceRetry=${forceRetry})`,
    );

    // Dependency ordering: Trips first (1), then Expenses (2), then Settlements (3); then by createdAt ascending (FIFO)
    const entityPriority: Record<string, number> = {
      trip: 1,
      expense: 2,
      settlement: 3,
    };
    const pendingOps = [...rawOps].sort((a, b) => {
      const pA = entityPriority[a.entityType] || 99;
      const pB = entityPriority[b.entityType] || 99;
      if (pA !== pB) return pA - pB;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    let pushedCount = 0;
    let conflicts = 0;
    const errors: string[] = [];

    // Mark as SYNCING in local DB
    for (const op of pendingOps) {
      await syncQueue.markSyncing(op.id);
    }

    const { tripsApi } = require('../services/api/trips.api');
    const { expensesApi } = require('../services/api/expenses.api');
    const idMap = new Map<string, string>();

    for (const op of pendingOps) {
      const endpoint =
        op.entityType === 'trip'
          ? '/trips'
          : op.entityType === 'expense'
            ? '/expenses'
            : '/settlements';
      console.log(
        `[SYNC_OPERATION_START] [OPERATION_ID]: ${op.id} [ENTITY]: ${op.entityType} [LOCAL_ID]: ${op.entityId} [PARENT_ID]: ${op.parentId || 'none'} [ENDPOINT]: ${endpoint} [ATTEMPT]: ${op.retryCount + 1}`,
      );

      try {
        let payload: any = {};
        try {
          payload = JSON.parse(op.payloadJson);
        } catch {
          payload = {};
        }

        if (op.entityType === 'trip') {
          if (op.operationType === 'CREATE') {
            // Sanitize payload: strip any client _id or internal minor-unit fields
            const {
              _id,
              id,
              totalBudgetMinor,
              totalSpentMinor,
              ...cleanPayload
            } = payload;
            const res = await tripsApi.create({
              ...cleanPayload,
              clientOperationId: op.clientOperationId,
            });
            const serverTrip = res.data?.trip;
            const serverId = serverTrip?._id;
            const httpStatus = res.status || 201;

            if (serverId) {
              console.log(
                `[HTTP_STATUS]: ${httpStatus} [SERVER_ID]: ${serverId} [RESPONSE_BODY]: ${JSON.stringify(serverTrip).slice(0, 200)}`,
              );
              console.log(
                `[LOCAL_ID → SERVER_ID] trip: ${op.entityId} → ${serverId}`,
              );

              idMap.set(op.entityId, serverId);
              // Confirm server trip (remaps SQLite trips, members, expenses, stops, and sync_queue items)
              await getTripRepository().confirmServerTrip(
                op.entityId,
                serverTrip,
                op.clientOperationId,
              );
              console.log(
                `[CHILD_ID_REMAP] remapped children of ${op.entityId} to ${serverId}`,
              );

              // Update React Query caches
              queryClient.setQueryData(
                queryKeys.trips.detail(serverId),
                serverTrip,
              );
              queryClient.invalidateQueries({ queryKey: queryKeys.trips.all });
              queryClient.invalidateQueries({
                queryKey: queryKeys.trips.latest,
              });
              queryClient.invalidateQueries({ queryKey: ['dashboard'] });
              console.log(
                `[CACHE_UPDATE] Invalidated React Query caches for trip ${serverId}`,
              );
            }

            await syncQueue.markSuccess(op.id);
            console.log(
              `[QUEUE_STATUS_UPDATE] [OPERATION_ID]: ${op.id} status: SUCCESS [OPERATION_STATE]: COMPLETED`,
            );
            pushedCount++;
          } else if (op.operationType === 'UPDATE') {
            const canonicalId =
              (await this.db.getCanonicalTripId(op.entityId)) ||
              idMap.get(op.entityId) ||
              op.entityId;
            const { _id, id, ...cleanPayload } = payload;
            const res = await tripsApi.updateTrip(canonicalId, cleanPayload);
            const httpStatus = res.status || 200;
            console.log(
              `[HTTP_STATUS]: ${httpStatus} [SERVER_ID]: ${canonicalId} [RESPONSE_BODY]: ${JSON.stringify(res.data || {}).slice(0, 200)}`,
            );
            await syncQueue.markSuccess(op.id);
            console.log(
              `[QUEUE_STATUS_UPDATE] [OPERATION_ID]: ${op.id} status: SUCCESS [OPERATION_STATE]: COMPLETED`,
            );
            pushedCount++;
          } else if (op.operationType === 'DELETE') {
            const canonicalId =
              (await this.db.getCanonicalTripId(op.entityId)) ||
              idMap.get(op.entityId) ||
              op.entityId;
            await tripsApi.deleteTrip(canonicalId).catch(() => {});
            await syncQueue.markSuccess(op.id);
            console.log(
              `[QUEUE_STATUS_UPDATE] [OPERATION_ID]: ${op.id} status: SUCCESS [OPERATION_STATE]: COMPLETED`,
            );
            pushedCount++;
          }
        } else if (op.entityType === 'expense') {
          // Reconcile parent trip ID
          let parentTripId = op.parentId || payload.tripId;
          if (parentTripId) {
            const canonicalParent =
              (await this.db.getCanonicalTripId(parentTripId)) ||
              idMap.get(parentTripId);
            if (canonicalParent) {
              parentTripId = canonicalParent;
              payload.tripId = canonicalParent;
            }
          }

          if (op.operationType === 'CREATE') {
            // Sanitize expense payload: strip client _id, format amounts correctly
            const {
              _id,
              id,
              amountMinor,
              amountBaseMinor,
              splits,
              ...cleanExpense
            } = payload;

            // Ensure amountLocal is present and is a clean number
            const amountLocal =
              cleanExpense.amountLocal ??
              (amountMinor != null ? amountMinor / 100 : 0);
            const expenseData = {
              ...cleanExpense,
              tripId: parentTripId,
              amountLocal,
              split: cleanExpense.split || 'EQUAL',
            };

            // If stopId is temporary or invalid, omit it
            if (
              expenseData.stopId &&
              (typeof expenseData.stopId !== 'string' ||
                expenseData.stopId.startsWith('stop_') ||
                expenseData.stopId.length < 12)
            ) {
              delete expenseData.stopId;
            }

            const res = await expensesApi.create({
              ...expenseData,
              clientOperationId: op.clientOperationId,
            });
            const serverExpense = res.data?.expense;
            const serverId = serverExpense?._id;
            const httpStatus = res.status || 201;

            if (serverId) {
              console.log(
                `[HTTP_STATUS]: ${httpStatus} [SERVER_ID]: ${serverId} [RESPONSE_BODY]: ${JSON.stringify(serverExpense).slice(0, 200)}`,
              );
              console.log(
                `[LOCAL_ID → SERVER_ID] expense: ${op.entityId} → ${serverId}`,
              );

              idMap.set(op.entityId, serverId);
              // Confirm server expense (remaps SQLite expense id, sets SYNCED)
              await getExpenseRepository().confirmServerExpense(
                op.entityId,
                serverExpense,
                op.clientOperationId,
              );

              // Update React Query caches
              queryClient.invalidateQueries({
                queryKey: queryKeys.expenses.all,
              });
              if (parentTripId) {
                queryClient.invalidateQueries({
                  queryKey: queryKeys.expenses.byTrip(parentTripId),
                });
                queryClient.invalidateQueries({
                  queryKey: queryKeys.trips.summary(parentTripId),
                });
                queryClient.invalidateQueries({
                  queryKey: queryKeys.trips.detail(parentTripId),
                });
              }
              queryClient.invalidateQueries({ queryKey: queryKeys.trips.all });
              queryClient.invalidateQueries({ queryKey: ['dashboard'] });
              console.log(
                `[CACHE_UPDATE] Invalidated React Query caches for expense ${serverId} (parentTrip: ${parentTripId})`,
              );
            }

            await syncQueue.markSuccess(op.id);
            console.log(
              `[QUEUE_STATUS_UPDATE] [OPERATION_ID]: ${op.id} status: SUCCESS [OPERATION_STATE]: COMPLETED`,
            );
            pushedCount++;
          } else if (op.operationType === 'UPDATE') {
            const canonicalExpenseId = idMap.get(op.entityId) || op.entityId;
            const { _id, id, ...cleanPayload } = payload;
            const res = await expensesApi.updateExpense(
              canonicalExpenseId,
              cleanPayload,
            );
            const httpStatus = res.status || 200;
            console.log(
              `[HTTP_STATUS]: ${httpStatus} [SERVER_ID]: ${canonicalExpenseId} [RESPONSE_BODY]: ${JSON.stringify(res.data || {}).slice(0, 200)}`,
            );
            await syncQueue.markSuccess(op.id);
            console.log(
              `[QUEUE_STATUS_UPDATE] [OPERATION_ID]: ${op.id} status: SUCCESS [OPERATION_STATE]: COMPLETED`,
            );
            pushedCount++;
          } else if (op.operationType === 'DELETE') {
            const canonicalExpenseId = idMap.get(op.entityId) || op.entityId;
            await expensesApi
              .archiveExpense(canonicalExpenseId)
              .catch(() => {});
            await syncQueue.markSuccess(op.id);
            console.log(
              `[QUEUE_STATUS_UPDATE] [OPERATION_ID]: ${op.id} status: SUCCESS [OPERATION_STATE]: COMPLETED`,
            );
            pushedCount++;
          }
        }
      } catch (opErr: any) {
        const httpStatus = opErr?.statusCode || opErr?.response?.status || 0;
        const errCode =
          opErr?.code || (httpStatus ? `HTTP_${httpStatus}` : 'UNKNOWN_ERROR');
        const errMsg = opErr?.message || 'Operation sync failure';

        console.warn(
          `[HTTP_STATUS]: ${httpStatus} [ERROR_CODE]: ${errCode} [ERROR_MESSAGE]: ${errMsg} [OPERATION_STATE]: FAILED [RETRY_STATE]: ${op.retryCount + 1}`,
        );

        if (
          errCode === 'NETWORK_OFFLINE' ||
          errMsg.includes('offline') ||
          errMsg.includes('Network Error')
        ) {
          // Device went offline mid-sync: keep operation for later retry
          await syncQueue.markFailed(
            op.id,
            op.retryCount,
            'Offline, will retry when connected',
          );
          errors.push(errMsg);
          break; // Stop iterating through remaining operations while offline
        }

        // If 4xx client validation error or server error, mark failed with incremented retry count
        await syncQueue.markFailed(op.id, op.retryCount + 1, errMsg);
        errors.push(errMsg);
      }
    }

    return { pushedCount, conflicts, errors };
  }

  /**
   * Pulls all changes from the server modified since last sync.
   */
  async pullRemoteChanges(
    tripId?: string,
  ): Promise<{ pulledCount: number; errors: string[] }> {
    let pulledCount = 0;
    const errors: string[] = [];

    try {
      const lastSync =
        (await this.db.getSyncMetadata('last_sync_timestamp')) ||
        '1970-01-01T00:00:00.000Z';
      let response: any;
      try {
        response = await apiClient.post('/sync/pull', {
          sinceTimestamp: lastSync,
          tripId,
        });
      } catch (pullErr: any) {
        const status = pullErr?.statusCode || pullErr?.response?.status;
        if (status === 404 || status === 501) {
          // Fallback to REST endpoint
          const { tripsApi } = require('../services/api/trips.api');
          const res = await tripsApi.getMyTrips({ limit: 50 });
          if (res.data?.trips) {
            await getTripRepository().reconcileServerTrips(res.data.trips);
            pulledCount += res.data.trips.length;
          }
          return { pulledCount, errors };
        }
        throw pullErr;
      }

      const { serverTimestamp, trips, expenses, settlements } =
        response.data || {};

      // Reconcile Trips
      if (trips && Array.isArray(trips)) {
        for (const t of trips) {
          await this.db.saveTrip({
            id: t._id,
            title: t.title,
            description: t.description,
            coverImage: t.coverImage,
            startDate: t.startDate,
            endDate: t.endDate,
            status: t.status,
            baseCurrency: t.baseCurrency,
            totalBudgetMinor: Math.round((t.totalBudget || 0) * 100),
            totalSpentMinor: Math.round((t.totalSpentBase || 0) * 100),
            syncStatus: 'SYNCED',
            updatedAt: t.updatedAt || new Date().toISOString(),
            rawJson: JSON.stringify(t),
          });
          pulledCount++;
        }
      }

      // Reconcile Expenses
      if (expenses && Array.isArray(expenses)) {
        for (const e of expenses) {
          const local = await this.db.getExpenseById(e._id);
          const evalResult = ConflictResolver.evaluateExpenseConflict(local, e);

          if (evalResult.resolution === 'FLAG_CONFLICT') {
            await this.db.updateExpense(local!.id, { syncStatus: 'CONFLICT' });
          } else {
            await this.db.saveExpense({
              id: e._id,
              clientOperationId: e.clientOperationId || `srv_${e._id}`,
              tripId: e.tripId,
              stopId: e.stopId,
              title: e.title,
              category: e.category,
              amountMinor: Math.round((e.amountLocal || 0) * 100),
              currency: e.localCurrency || 'INR',
              amountBaseMinor: Math.round((e.amountBase || 0) * 100),
              baseCurrency: e.baseCurrency || 'INR',
              exchangeRateUsed: e.exchangeRateUsed || 1,
              paidBy: e.paidBy,
              paidByName: e.paidByName || '',
              splitMethod: e.splitMethod || 'equal',
              date: e.date,
              notes: e.notes || '',
              isSettled: Boolean(e.isSettled),
              isArchived: Boolean(e.isArchived),
              syncStatus: 'SYNCED',
              createdAt: e.createdAt,
              updatedAt: e.updatedAt || new Date().toISOString(),
              rawJson: JSON.stringify(e),
            });
            pulledCount++;
          }
        }
      }

      // Reconcile Settlements
      if (settlements && Array.isArray(settlements)) {
        for (const s of settlements) {
          await this.db.saveSettlement({
            tripId: s.tripId,
            netBalancesJson: JSON.stringify(s.netBalances || {}),
            transactionsJson: JSON.stringify(s.transactions || []),
            isFullySettled: Boolean(s.isFullySettled),
            updatedAt: s.updatedAt || new Date().toISOString(),
          });
        }
      }

      if (serverTimestamp) {
        await this.db.setSyncMetadata('last_sync_timestamp', serverTimestamp);
      }
    } catch (err: any) {
      errors.push(err?.message || 'Pull sync failure');
    }

    return { pulledCount, errors };
  }

  /**
   * Full bidirectional synchronization (Push pending changes -> Pull new changes).
   */
  async sync(
    tripId?: string,
    forceRetry: boolean = false,
  ): Promise<SyncResult> {
    if (this.isSyncing) {
      if (forceRetry) {
        // Unlock stuck synchronization on explicit manual retry or reconnect
        this.isSyncing = false;
      } else {
        return {
          pushedCount: 0,
          pulledCount: 0,
          conflictsCount: 0,
          errors: [],
        };
      }
    }

    this.isSyncing = true;
    this.notify('SYNCING');

    const result: SyncResult = {
      pushedCount: 0,
      pulledCount: 0,
      conflictsCount: 0,
      errors: [],
    };

    try {
      const pushRes = await this.pushPendingChanges(forceRetry);
      result.pushedCount = pushRes.pushedCount;
      result.conflictsCount = pushRes.conflicts;
      result.errors.push(...pushRes.errors);

      const pullRes = await this.pullRemoteChanges(tripId);
      result.pulledCount = pullRes.pulledCount;
      result.errors.push(...pullRes.errors);

      // Refresh Android home-screen widgets with fresh local data
      await getWidgetService()
        .updateAllWidgets()
        .catch(() => {});

      // Invalidate relevant React Query caches
      queryClient.invalidateQueries({ queryKey: queryKeys.trips.all });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      if (tripId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.trips.detail(tripId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.expenses.byTrip(tripId),
        });
      }

      this.notify(result.errors.length > 0 ? 'ERROR' : 'SYNCED');
    } catch (err: any) {
      result.errors.push(err?.message || 'Sync error');
      this.notify('ERROR');
    } finally {
      this.isSyncing = false;
      setTimeout(() => this.notify('IDLE'), 4000);
    }

    return result;
  }
}

export const syncEngine = new SyncEngine();
