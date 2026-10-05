// src/db/database.interface.ts

export type SyncStatus =
  'SYNCED' | 'PENDING' | 'SYNCING' | 'FAILED' | 'CONFLICT';
export type SyncOperationType = 'CREATE' | 'UPDATE' | 'DELETE';
export type SyncEntityType = 'trip' | 'expense' | 'settlement';

export interface LocalTrip {
  id: string; // Server ID or client UUID
  title: string;
  description?: string;
  coverImage?: string;
  startDate?: string;
  endDate?: string;
  status: string;
  baseCurrency: string;
  totalBudgetMinor: number;
  totalSpentMinor: number;
  rawJson?: string;
  syncStatus: SyncStatus;
  updatedAt: string;
}

export interface LocalTripMember {
  tripId: string;
  userId: string;
  displayName: string;
  photoURL?: string;
  role: string;
  isActive: boolean;
  totalPaidMinor: number;
  totalOwesMinor: number;
}

export interface LocalExpense {
  id: string; // Server ID or client-generated ID
  clientOperationId: string; // Idempotency key
  tripId: string;
  stopId?: string;
  title: string;
  category: string;
  amountMinor: number;
  currency: string;
  amountBaseMinor: number;
  baseCurrency: string;
  exchangeRateUsed: number;
  paidBy: string;
  paidByName: string;
  splitMethod: string;
  date: string;
  notes?: string;
  receiptImagesJson?: string;
  isSettled: boolean;
  isArchived: boolean;
  syncStatus: SyncStatus;
  createdAt: string;
  updatedAt: string;
  rawJson?: string;
  receiptHash?: string;
  receiptNumber?: string;
  receiptMerchant?: string;
  receiptDate?: string;
  ocrParserVersion?: string;
  receiptImageUri?: string;
}

export interface LocalSplit {
  id: string;
  expenseId: string;
  userId: string;
  displayName: string;
  amountMinor: number;
  amountBaseMinor: number;
  percentage?: number;
  shares?: number;
  isPaid: boolean;
}

export interface LocalSettlement {
  tripId: string;
  netBalancesJson: string;
  transactionsJson: string;
  isFullySettled: boolean;
  updatedAt: string;
}

export interface LocalSyncQueueItem {
  id: string; // UUID of queue entry
  clientOperationId: string; // Idempotency key
  entityType: SyncEntityType;
  entityId: string;
  parentId?: string; // e.g. tripId for an expense
  operationType: SyncOperationType;
  payloadJson: string;
  retryCount: number;
  lastAttemptAt?: string;
  lastError?: string;
  status: 'PENDING' | 'SYNCING' | 'FAILED' | 'CONFLICT';
  createdAt: string;
}

export interface ILocalDatabase {
  initialize(): Promise<void>;

  // Trips
  getTrips(): Promise<LocalTrip[]>;
  getTripById(id: string): Promise<LocalTrip | null>;
  saveTrip(trip: Partial<LocalTrip>): Promise<void>;
  saveTrips(trips: Partial<LocalTrip>[]): Promise<void>;
  deleteTrip(id: string): Promise<void>;
  remapTripId(
    localId: string,
    serverId: string,
    serverStops?: any[],
  ): Promise<void>;

  // Members
  getTripMembers(tripId: string): Promise<LocalTripMember[]>;
  saveTripMembers(tripId: string, members: LocalTripMember[]): Promise<void>;

  // Expenses
  getExpenses(tripId: string): Promise<LocalExpense[]>;
  getExpenseById(id: string): Promise<LocalExpense | null>;
  findExpenseByReceiptHash(
    tripId: string,
    receiptHash: string,
  ): Promise<LocalExpense | null>;
  saveExpense(
    expense: Partial<LocalExpense>,
    splits?: LocalSplit[],
  ): Promise<void>;
  updateExpense(id: string, updates: Partial<LocalExpense>): Promise<void>;
  deleteExpense(id: string, soft?: boolean): Promise<void>;
  remapExpenseId(localId: string, serverId: string): Promise<void>;

  // Splits
  getExpenseSplits(expenseId: string): Promise<LocalSplit[]>;

  // Settlements
  getSettlement(tripId: string): Promise<LocalSettlement | null>;
  saveSettlement(settlement: LocalSettlement): Promise<void>;

  // Sync Queue
  enqueueSync(item: {
    clientOperationId: string;
    entityType: SyncEntityType;
    entityId: string;
    parentId?: string;
    operationType: SyncOperationType;
    payloadJson: string;
  }): Promise<LocalSyncQueueItem>;
  getPendingSyncQueue(forceAll?: boolean): Promise<LocalSyncQueueItem[]>;
  updateSyncQueueItem(
    id: string,
    updates: Partial<LocalSyncQueueItem>,
  ): Promise<void>;
  removeSyncQueueItem(id: string): Promise<void>;
  removeSyncQueueByOperationId(clientOperationId: string): Promise<void>;
  removeSyncQueueByEntityId(entityId: string): Promise<void>;
  resetStaleSyncingOperations(): Promise<void>;

  // Sync Metadata
  getSyncMetadata(key: string): Promise<string | null>;
  setSyncMetadata(key: string, value: string): Promise<void>;
  getCanonicalTripId(tripId: string): Promise<string | null>;

  // User Reset (Logout cleanup)
  clearUserData(): Promise<void>;
}
