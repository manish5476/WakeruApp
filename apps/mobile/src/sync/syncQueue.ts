// src/sync/syncQueue.ts
import {
  getLocalDatabase,
  LocalSyncQueueItem,
  SyncEntityType,
  SyncOperationType,
} from '../db';

export class SyncQueueManager {
  private db = getLocalDatabase();

  /**
   * Calculates exponential backoff delay in milliseconds.
   */
  static getBackoffDelayMs(retryCount: number): number {
    return Math.min(1000 * Math.pow(2, retryCount), 30000);
  }

  async enqueue(
    clientOperationId: string,
    entityType: SyncEntityType,
    entityId: string,
    operationType: SyncOperationType,
    payload: any,
    parentId?: string,
  ): Promise<LocalSyncQueueItem> {
    return this.db.enqueueSync({
      clientOperationId,
      entityType,
      entityId,
      parentId,
      operationType,
      payloadJson: JSON.stringify(payload),
    });
  }

  async getPendingOperations(
    forceRetry: boolean = false,
  ): Promise<LocalSyncQueueItem[]> {
    const items = await this.db.getPendingSyncQueue(forceRetry);
    const now = Date.now();

    return items.filter((item: LocalSyncQueueItem) => {
      if (forceRetry) return true;
      if (!item.lastAttemptAt) return true;
      const lastAttempt = new Date(item.lastAttemptAt).getTime();
      const delay = SyncQueueManager.getBackoffDelayMs(item.retryCount);
      return now - lastAttempt >= delay;
    });
  }

  async resetStaleSyncing(): Promise<void> {
    await this.db.resetStaleSyncingOperations();
  }

  async markSyncing(id: string): Promise<void> {
    await this.db.updateSyncQueueItem(id, {
      status: 'SYNCING',
      lastAttemptAt: new Date().toISOString(),
    });
  }

  async markFailed(
    id: string,
    currentRetryCount: number,
    error: string,
  ): Promise<void> {
    await this.db.updateSyncQueueItem(id, {
      status: 'FAILED',
      retryCount: currentRetryCount + 1,
      lastError: error,
      lastAttemptAt: new Date().toISOString(),
    });
  }

  async markConflict(id: string, error: string): Promise<void> {
    await this.db.updateSyncQueueItem(id, {
      status: 'CONFLICT',
      lastError: error,
    });
  }

  async markSuccess(id: string): Promise<void> {
    await this.db.removeSyncQueueItem(id);
  }
}

export const syncQueue = new SyncQueueManager();
