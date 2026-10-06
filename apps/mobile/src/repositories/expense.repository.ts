// src/repositories/expense.repository.ts
import {
  getLocalDatabase,
  LocalExpense,
  LocalSplit,
  LocalTripMember,
} from '../db';
import { syncQueue } from '../sync/syncQueue';
// Lazy getters to break circular dependencies:
// expense.repository ↔ syncEngine, expense.repository ↔ widgetService
const getSyncEngine = () => require('../sync/syncEngine').syncEngine;
const getWidgetService = () => {
  updateAllWidgets: async () => {};
};
import { generateUUID } from '../utils/uuid';
import {
  toMinorUnits,
  toMajorUnits,
  splitEqual,
  splitByPercentage,
  splitByShares,
  validateExactSplit,
} from '../utils/money/money';
import { IExpense, ISplit } from '../types/expense.types';

export interface ReceiptMetadataPayload {
  receiptHash?: string;
  receiptNumber?: string;
  receiptMerchant?: string;
  receiptDate?: string;
  ocrParserVersion?: string;
  receiptImageUri?: string;
}

export interface CreateExpensePayload {
  tripId?: string;
  stopId?: string;
  title: string;
  category: string;
  amountLocal: number;
  currency?: string;
  baseCurrency?: string;
  exchangeRateUsed?: number;
  paidBy: string;
  paidByName?: string;
  date: string;
  notes?: string;
  tags?: string[];
  location?: any;
  receiptMetadata?: ReceiptMetadataPayload;
  split: {
    method: string;
    memberIds?: string[];
    members?: Array<{
      userId: string;
      displayName?: string;
      amount?: number;
      percentage?: number;
      shares?: number;
    }>;
  };
}

export class ExpenseRepository {
  private db = getLocalDatabase();

  /**
   * Helper to map a local DB expense and splits to the application's IExpense format.
   */
  private mapToIExpense(local: LocalExpense, splits: LocalSplit[]): IExpense {
    const currency = local.currency || 'INR';
    const baseCurrency = local.baseCurrency || 'INR';

    const mappedSplits: ISplit[] = splits.map(s => ({
      userId: s.userId,
      displayName: s.displayName,
      amountLocal: toMajorUnits(s.amountMinor, currency),
      amountBase: toMajorUnits(s.amountBaseMinor, baseCurrency),
      percentage: s.percentage,
      shares: s.shares,
      isPaid: s.isPaid,
    }));

    return {
      _id: local.id,
      tripId: local.tripId,
      stopId: local.stopId || '',
      title: local.title,
      category: local.category as any,
      notes: local.notes,
      receiptImages: local.receiptImagesJson
        ? JSON.parse(local.receiptImagesJson)
        : [],
      date: local.date,
      amountLocal: toMajorUnits(local.amountMinor, currency),
      amountBase: toMajorUnits(local.amountBaseMinor, baseCurrency),
      localCurrency: currency,
      baseCurrency: baseCurrency,
      exchangeRateUsed: local.exchangeRateUsed || 1,
      paidBy: local.paidBy,
      paidByName: local.paidByName,
      splitMethod: local.splitMethod as any,
      splits: mappedSplits,
      isSettled: local.isSettled,
      isArchived: local.isArchived,
      addedBy: local.paidBy,
      receiptHash: local.receiptHash,
      receiptNumber: local.receiptNumber,
      receiptMerchant: local.receiptMerchant,
      receiptDate: local.receiptDate,
      ocrParserVersion: local.ocrParserVersion,
      createdAt: local.createdAt,
      updatedAt: local.updatedAt,
      comments: [],
    };
  }

  /**
   * Retrieves expenses for a trip from the local SQLite/web storage, sorted newest first.
   */
  async getTripExpenses(tripId: string): Promise<IExpense[]> {
    const localExpenses = await this.db.getExpenses(tripId);
    const activeExpenses = localExpenses.filter(e => !e.isArchived);

    const results: IExpense[] = [];
    for (const exp of activeExpenses) {
      const splits = await this.db.getExpenseSplits(exp.id);
      results.push(this.mapToIExpense(exp, splits));
    }

    return results.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }

  /**
   * Retrieves a single expense by ID from the local database.
   */
  async getExpenseById(expenseId: string): Promise<IExpense | null> {
    const local = await this.db.getExpenseById(expenseId);
    if (!local) return null;
    const splits = await this.db.getExpenseSplits(local.id);
    return this.mapToIExpense(local, splits);
  }

  /**
   * Reconciles remote expenses from the server into the local database.
   */
  async reconcileServerExpenses(
    tripId: string,
    serverExpenses: IExpense[],
  ): Promise<void> {
    for (const exp of serverExpenses) {
      const currency = exp.localCurrency || 'INR';
      const baseCurrency = exp.baseCurrency || 'INR';
      const amountMinor = toMinorUnits(exp.amountLocal, currency);
      const amountBaseMinor = toMinorUnits(exp.amountBase, baseCurrency);

      const localSplits: LocalSplit[] = (exp.splits || []).map(s => ({
        id: generateUUID(),
        expenseId: exp._id,
        userId: s.userId,
        displayName: s.displayName || 'Member',
        amountMinor: toMinorUnits(s.amountLocal, currency),
        amountBaseMinor: toMinorUnits(s.amountBase, baseCurrency),
        percentage: s.percentage,
        shares: s.shares,
        isPaid: Boolean(s.isPaid),
      }));

      const localExpense: Partial<LocalExpense> = {
        id: exp._id,
        clientOperationId: (exp as any).clientOperationId || generateUUID(),
        tripId: exp.tripId || tripId,
        stopId: exp.stopId || '',
        title: exp.title,
        category: exp.category || 'other',
        amountMinor,
        currency,
        amountBaseMinor,
        baseCurrency,
        exchangeRateUsed: exp.exchangeRateUsed || 1,
        paidBy: exp.paidBy,
        paidByName: exp.paidByName || 'Unknown',
        splitMethod: exp.splitMethod || 'equal',
        date: exp.date || new Date().toISOString(),
        notes: exp.notes || '',
        receiptImagesJson: JSON.stringify(exp.receiptImages || []),
        receiptHash: exp.receiptHash,
        receiptNumber: exp.receiptNumber,
        receiptMerchant: exp.receiptMerchant,
        receiptDate: exp.receiptDate,
        ocrParserVersion: exp.ocrParserVersion,
        isSettled: Boolean(exp.isSettled),
        isArchived: Boolean(exp.isArchived),
        syncStatus: 'SYNCED',
        createdAt: exp.createdAt || new Date().toISOString(),
        updatedAt: exp.updatedAt || new Date().toISOString(),
        rawJson: JSON.stringify(exp),
      };

      await this.db.saveExpense(localExpense, localSplits);
    }

    // Refresh widget summaries
    await getWidgetService()
      .updateAllWidgets()
      .catch(() => {});
  }

  /**
   * Creates an expense locally using Safe Money math, records it in SQLite,
   * enqueues it for sync, and triggers background sync.
   */
  async createExpenseLocally(
    data: CreateExpensePayload,
    autoSync: boolean = true,
  ): Promise<IExpense> {
    const expenseId = generateUUID();
    const clientOperationId = generateUUID();
    const now = new Date().toISOString();

    // Determine target trip
    let tripId = data.tripId;
    if (!tripId) {
      const trips = await this.db.getTrips();
      const activeTrip = trips.find(t => t.status === 'active') || trips[0];
      tripId = activeTrip?.id || '';
    }

    const trip = tripId ? await this.db.getTripById(tripId) : null;
    const currency = data.currency || trip?.baseCurrency || 'INR';
    const baseCurrency = data.baseCurrency || trip?.baseCurrency || currency;
    const exchangeRate = data.exchangeRateUsed || 1;

    // Convert total amounts to integer minor units safely (zero floating point arithmetic)
    const amountMinor = toMinorUnits(data.amountLocal, currency);
    const amountBaseMinor = Math.round(amountMinor * exchangeRate);

    // Calculate splits with exact zero-remainder allocation
    const splitMethod = data.split.method || 'equal';
    const members = tripId ? await this.db.getTripMembers(tripId) : [];
    const localSplits: LocalSplit[] = [];

    if (splitMethod === 'equal') {
      const targetUserIds =
        data.split.memberIds && data.split.memberIds.length > 0
          ? data.split.memberIds
          : members.length > 0
            ? members.map(m => m.userId)
            : [data.paidBy];

      const splitMembers = targetUserIds.map(id => ({
        userId: id,
        displayName:
          members.find(m => m.userId === id)?.displayName || 'Member',
      }));

      // Exact zero-loss split
      const splitShares = splitEqual(amountMinor, splitMembers);

      for (const share of splitShares) {
        const memberInfo = members.find(m => m.userId === share.userId);
        const shareBaseMinor = Math.round(share.amountMinor * exchangeRate);
        localSplits.push({
          id: generateUUID(),
          expenseId,
          userId: share.userId,
          displayName: memberInfo?.displayName || share.displayName || 'Member',
          amountMinor: share.amountMinor,
          amountBaseMinor: shareBaseMinor,
          isPaid: share.userId === data.paidBy,
        });
      }
    } else if (splitMethod === 'percentage' && data.split.members) {
      const splitMembers = data.split.members.map(m => ({
        userId: m.userId,
        displayName:
          m.displayName ||
          members.find(mb => mb.userId === m.userId)?.displayName ||
          'Member',
        percentage: m.percentage || 0,
      }));

      const splitShares = splitByPercentage(amountMinor, splitMembers);
      for (const share of splitShares) {
        const memberInfo = members.find(m => m.userId === share.userId);
        const shareBaseMinor = Math.round(share.amountMinor * exchangeRate);
        localSplits.push({
          id: generateUUID(),
          expenseId,
          userId: share.userId,
          displayName: memberInfo?.displayName || share.displayName || 'Member',
          amountMinor: share.amountMinor,
          amountBaseMinor: shareBaseMinor,
          percentage: share.percentage,
          isPaid: share.userId === data.paidBy,
        });
      }
    } else if (splitMethod === 'shares' && data.split.members) {
      const splitMembers = data.split.members.map(m => ({
        userId: m.userId,
        displayName:
          m.displayName ||
          members.find(mb => mb.userId === m.userId)?.displayName ||
          'Member',
        shares: m.shares || 1,
      }));

      const splitShares = splitByShares(amountMinor, splitMembers);
      for (const share of splitShares) {
        const memberInfo = members.find(m => m.userId === share.userId);
        const shareBaseMinor = Math.round(share.amountMinor * exchangeRate);
        localSplits.push({
          id: generateUUID(),
          expenseId,
          userId: share.userId,
          displayName: memberInfo?.displayName || share.displayName || 'Member',
          amountMinor: share.amountMinor,
          amountBaseMinor: shareBaseMinor,
          shares: share.shares,
          isPaid: share.userId === data.paidBy,
        });
      }
    } else if (splitMethod === 'exact' && data.split.members) {
      const exactAmounts: Array<{ userId: string; amountMinor: number }> =
        data.split.members.map(m => ({
          userId: m.userId,
          amountMinor: toMinorUnits(m.amount || 0, currency),
        }));

      // Validate exact match
      validateExactSplit(amountMinor, exactAmounts);

      for (const item of exactAmounts) {
        const memberInfo = members.find(m => m.userId === item.userId);
        const shareBaseMinor = Math.round(item.amountMinor * exchangeRate);
        localSplits.push({
          id: generateUUID(),
          expenseId,
          userId: item.userId,
          displayName: memberInfo?.displayName || 'Member',
          amountMinor: item.amountMinor,
          amountBaseMinor: shareBaseMinor,
          isPaid: item.userId === data.paidBy,
        });
      }
    } else {
      // Personal or single payer
      localSplits.push({
        id: generateUUID(),
        expenseId,
        userId: data.paidBy,
        displayName: data.paidByName || 'Me',
        amountMinor,
        amountBaseMinor,
        isPaid: true,
      });
    }

    const payerMember = members.find(m => m.userId === data.paidBy);
    const paidByName = data.paidByName || payerMember?.displayName || 'Me';

    const localExpense: LocalExpense = {
      id: expenseId,
      clientOperationId,
      tripId,
      stopId: data.stopId || '',
      title: data.title,
      category: data.category,
      amountMinor,
      currency,
      amountBaseMinor,
      baseCurrency,
      exchangeRateUsed: exchangeRate,
      paidBy: data.paidBy,
      paidByName,
      splitMethod,
      date: data.date,
      notes: data.notes || '',
      receiptImagesJson: data.receiptMetadata?.receiptImageUri
        ? JSON.stringify([data.receiptMetadata.receiptImageUri])
        : '[]',
      receiptHash: data.receiptMetadata?.receiptHash,
      receiptNumber: data.receiptMetadata?.receiptNumber,
      receiptMerchant: data.receiptMetadata?.receiptMerchant,
      receiptDate: data.receiptMetadata?.receiptDate,
      ocrParserVersion: data.receiptMetadata?.ocrParserVersion,
      receiptImageUri: data.receiptMetadata?.receiptImageUri,
      isSettled: false,
      isArchived: false,
      syncStatus: 'PENDING',
      createdAt: now,
      updatedAt: now,
    };

    // 1. Write to local database
    await this.db.saveExpense(localExpense, localSplits);
    if (__DEV__) {
      console.log('[SYNC:EXPENSE_LOCAL_SAVE]', {
        expenseId,
        title: localExpense.title,
      });
      console.log('[SYNC:EXPENSE_LOCAL_ID]', { localExpenseId: expenseId });
      console.log('[SYNC:EXPENSE_PARENT_TRIP_ID]', { parentTripId: tripId });
    }

    // 2. Update local trip totalSpentMinor
    if (trip) {
      const updatedTotalSpent = (trip.totalSpentMinor || 0) + amountBaseMinor;
      await this.db.saveTrip({
        id: trip.id,
        totalSpentMinor: updatedTotalSpent,
        updatedAt: now,
      });
    }

    // 3. Update member balances locally
    if (members.length > 0) {
      const updatedMembers = members.map(m => {
        let paidDelta = 0;
        let owesDelta = 0;

        if (m.userId === data.paidBy) {
          paidDelta += amountBaseMinor;
        }

        const memberSplit = localSplits.find(s => s.userId === m.userId);
        if (memberSplit) {
          owesDelta += memberSplit.amountBaseMinor;
        }

        return {
          ...m,
          totalPaidMinor: (m.totalPaidMinor || 0) + paidDelta,
          totalOwesMinor: (m.totalOwesMinor || 0) + owesDelta,
        };
      });
      await this.db.saveTripMembers(tripId, updatedMembers);
    }

    // Clean payload for server creation: omit client UUID _id and internal minor units
    const queuePayload = {
      tripId,
      stopId: data.stopId,
      title: data.title,
      category: data.category,
      amountLocal: data.amountLocal,
      currency,
      baseCurrency,
      exchangeRateUsed: exchangeRate,
      paidBy: data.paidBy,
      paidByName,
      date: data.date,
      notes: data.notes,
      split: data.split,
      clientOperationId,
      receiptMetadata: data.receiptMetadata,
    };

    // 4. Enqueue into sync queue with clientOperationId for server idempotency
    await syncQueue.enqueue(
      clientOperationId,
      'expense',
      expenseId,
      'CREATE',
      queuePayload,
      tripId,
    );

    if (__DEV__) {
      console.log('[SYNC:EXPENSE_QUEUE_INSERTED]', {
        clientOperationId,
        entityId: expenseId,
        parentId: tripId,
      });
    }

    // 5. Update Android home-screen widgets
    await getWidgetService()
      .updateAllWidgets()
      .catch(() => {});

    // 6. Trigger background sync only if autoSync is enabled
    if (autoSync) {
      getSyncEngine()
        .sync(tripId)
        .catch(() => {});
    }

    // Return mapped IExpense immediately for instant UI render
    const mapped = this.mapToIExpense(localExpense, localSplits);
    (mapped as any).clientOperationId = clientOperationId;
    return mapped;
  }

  /**
   * Reconciles a server-confirmed expense, safely removing pending sync queue operations
   * and updating the local SQLite record without duplicate rows.
   */
  async confirmServerExpense(
    localId: string,
    serverExpense: any,
    clientOperationId?: string,
  ): Promise<void> {
    const serverId = serverExpense?._id || serverExpense?.id;
    const opId = clientOperationId || serverExpense?.clientOperationId;

    if (__DEV__) {
      console.log('[SYNC:LOCAL_ID → SERVER_ID]', {
        localExpenseId: localId,
        canonicalServerId: serverId,
      });
    }

    if (serverId && serverId !== localId) {
      await this.db.remapExpenseId(localId, serverId);
    }

    if (opId) {
      await this.db.removeSyncQueueByOperationId(opId).catch(() => {});
    }
    if (localId) {
      await this.db.removeSyncQueueByEntityId(localId).catch(() => {});
    }

    if (__DEV__) {
      console.log('[SYNC:QUEUE_STATUS_UPDATE]', {
        entityId: serverId || localId,
        status: 'SYNCED',
      });
    }

    if (serverExpense) {
      await this.reconcileServerExpenses(serverExpense.tripId, [
        serverExpense,
      ]).catch(() => {});
    }

    await getWidgetService()
      .updateAllWidgets()
      .catch(() => {});
  }

  /**
   * Updates an expense locally and queues sync.
   */
  async updateExpenseLocally(
    expenseId: string,
    updates: Partial<CreateExpensePayload>,
  ): Promise<void> {
    const existing = await this.db.getExpenseById(expenseId);
    if (!existing) return;

    const clientOperationId = generateUUID();
    const now = new Date().toISOString();

    const localUpdates: Partial<LocalExpense> = {
      ...existing,
      syncStatus: 'PENDING',
      updatedAt: now,
    };

    if (updates.title) localUpdates.title = updates.title;
    if (updates.category) localUpdates.category = updates.category;
    if (updates.notes !== undefined) localUpdates.notes = updates.notes;
    if (updates.date) localUpdates.date = updates.date;

    await this.db.updateExpense(expenseId, localUpdates);

    await syncQueue.enqueue(
      clientOperationId,
      'expense',
      expenseId,
      'UPDATE',
      updates,
    );

    await getWidgetService()
      .updateAllWidgets()
      .catch(() => {});
    getSyncEngine()
      .sync(existing.tripId)
      .catch(() => {});
  }

  /**
   * Deletes (archives) an expense locally and queues sync.
   */
  async deleteExpenseLocally(expenseId: string): Promise<void> {
    const existing = await this.db.getExpenseById(expenseId);
    if (!existing) return;

    const clientOperationId = generateUUID();

    // Soft delete locally
    await this.db.deleteExpense(expenseId, true);

    await syncQueue.enqueue(clientOperationId, 'expense', expenseId, 'DELETE', {
      expenseId,
    });

    await getWidgetService()
      .updateAllWidgets()
      .catch(() => {});
    getSyncEngine()
      .sync(existing.tripId)
      .catch(() => {});
  }

  /**
   * Finds an existing local expense matching the given receipt hash within a trip.
   */
  async findExpenseByReceiptHash(
    tripId: string,
    receiptHash: string,
  ): Promise<LocalExpense | null> {
    return this.db.findExpenseByReceiptHash(tripId, receiptHash);
  }
}

export const expenseRepository = new ExpenseRepository();
