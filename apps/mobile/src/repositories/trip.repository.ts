// src/repositories/trip.repository.ts
import { getLocalDatabase, LocalTrip, LocalTripMember } from '../db';
import { syncQueue } from '../sync/syncQueue';
// Lazy getters to break circular dependencies:
// trip.repository ↔ syncEngine, trip.repository ↔ widgetService
const getSyncEngine = () => require('../sync/syncEngine').syncEngine;
const getWidgetService = () => ({ updateAllWidgets: async () => {} });
import { generateUUID } from '../utils/uuid';
import { toMinorUnits } from '../utils/money/money';
import { ITrip, ITripMember } from '../types/trip.types';

const warn = (tag: string, e: unknown) =>
  console.warn(tag, e instanceof Error ? e.message : e);
const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

/** Fields callers may change on an existing trip. `totalBudget` is in major units. */
export type TripUpdateInput = Partial<LocalTrip> & { totalBudget?: number };

export class TripRepository {
  private db = getLocalDatabase();

  // ==================================================================
  // READS
  // ==================================================================

  async getLocalTrips(): Promise<LocalTrip[]> {
    return this.db.getTrips();
  }

  async getLocalTripById(id: string): Promise<LocalTrip | null> {
    return this.db.getTripById(id);
  }

  async getLocalTripMembers(tripId: string): Promise<LocalTripMember[]> {
    return this.db.getTripMembers(tripId);
  }

  async getCanonicalTripId(tripId: string): Promise<string | null> {
    return this.db.getCanonicalTripId(tripId);
  }

  // ==================================================================
  // PULL: server -> local
  // ==================================================================

  /**
   * Saves or reconciles remote trips into local storage.
   *
   * SAFETY: a trip that still has queued (unsynced) operations is NOT overwritten,
   * otherwise a background pull would erase the user's offline edits and mark the
   * trip SYNCED. The decision is based on the real queue, not the syncStatus flag,
   * so a stale flag can never block refreshes forever.
   *
   * One bad trip never aborts the rest of the batch.
   */
  async reconcileServerTrips(
    serverTrips: ITrip[],
    opts: { force?: boolean } = {},
  ): Promise<void> {
    if (!Array.isArray(serverTrips) || serverTrips.length === 0) return;

    let protectedIds = new Set<string>();
    if (!opts.force) {
      try {
        const pending = await this.db.getPendingSyncQueue(true);
        protectedIds = new Set(
          pending.filter(q => q.entityType === 'trip').map(q => q.entityId),
        );
      } catch (e) {
        warn('[SYNC:RECONCILE_QUEUE_READ_FAILED]', e);
      }
    }

    for (const trip of serverTrips) {
      try {
        if (!trip?._id) continue;
        if (protectedIds.has(trip._id)) {
          if (__DEV__)
            console.log('[SYNC:RECONCILE_SKIP_PENDING]', { tripId: trip._id });
          continue;
        }

        const currency = trip.baseCurrency || 'INR';
        const totalBudgetMinor = trip.totalBudget
          ? toMinorUnits(trip.totalBudget, currency)
          : 0;
        const totalSpentMinor = trip.totalSpentBase
          ? toMinorUnits(trip.totalSpentBase, currency)
          : 0;

        await this.db.saveTrip({
          id: trip._id,
          title: trip.title,
          description: trip.description || '',
          coverImage: trip.coverImage || '',
          startDate: trip.startDate || '',
          endDate: trip.endDate || '',
          status: trip.status || 'planning',
          baseCurrency: currency,
          totalBudgetMinor,
          totalSpentMinor,
          rawJson: JSON.stringify(trip),
          syncStatus: 'SYNCED',
          updatedAt: trip.updatedAt || new Date().toISOString(),
        });

        if (Array.isArray(trip.members)) {
          const localMembers: LocalTripMember[] = trip.members.map(
            (m: ITripMember) => ({
              tripId: trip._id,
              userId: m.userId,
              displayName: m.displayName || 'Member',
              photoURL: m.photoURL || m.avatarUrl || '',
              role: m.role || 'member',
              isActive: m.isActive !== false,
              totalPaidMinor: toMinorUnits(m.totalPaidBase || 0, currency),
              totalOwesMinor: toMinorUnits(m.totalOwesBase || 0, currency),
            }),
          );
          await this.db.saveTripMembers(trip._id, localMembers);
        }
      } catch (e) {
        warn('[SYNC:RECONCILE_TRIP_FAILED]', e);
      }
    }

    await getWidgetService()
      .updateAllWidgets()
      .catch((e: unknown) => warn('[WIDGET:UPDATE_FAILED]', e));
  }

  // ==================================================================
  // CREATE (offline-first)
  // ==================================================================

  async createTripLocally(
    input: {
      title: string;
      description?: string;
      coverImage?: string;
      startDate?: string;
      endDate?: string;
      baseCurrency?: string;
      totalBudget?: number;
      defaultSplitMethod?: string;
      status?: string;
      initialStop?: any;
      members?: Array<{
        userId: string;
        displayName: string;
        role?: string;
        photoURL?: string;
      }>;
    },
    autoSync: boolean = true,
  ): Promise<LocalTrip> {
    if (__DEV__)
      console.log('[SYNC:TRIP_CREATE_START]', { title: input.title });

    const tripId = generateUUID();
    const clientOperationId = generateUUID();
    const currency = input.baseCurrency || 'INR';
    const totalBudgetMinor = input.totalBudget
      ? toMinorUnits(input.totalBudget, currency)
      : 0;
    const now = new Date().toISOString();

    // At least one stop must exist so offline users can log expenses immediately
    const initialStops = [
      input.initialStop
        ? {
            _id: generateUUID(),
            title:
              input.initialStop.city || input.initialStop.name || 'First Stop',
            city: input.initialStop.city || '',
            country: input.initialStop.country || '',
            startDate: input.startDate || now,
            endDate: input.endDate || now,
            currency: input.initialStop.currency || currency,
            currentExchangeRate: 1,
          }
        : {
            _id: generateUUID(),
            title: 'General',
            city: '',
            country: '',
            startDate: input.startDate || now,
            endDate: input.endDate || now,
            currency,
            currentExchangeRate: 1,
          },
    ];

    const localMembersList: LocalTripMember[] = (input.members || []).map(
      m => ({
        tripId,
        userId: m.userId,
        displayName: m.displayName || 'Member',
        photoURL: m.photoURL || '',
        role: m.role || 'member',
        isActive: true,
        totalPaidMinor: 0,
        totalOwesMinor: 0,
      }),
    );

    const tripObj: ITrip = {
      _id: tripId,
      title: input.title,
      description: input.description || '',
      coverImage: input.coverImage || '',
      startDate: input.startDate || now,
      endDate: input.endDate || now,
      status: (input.status as any) || 'planning',
      baseCurrency: currency,
      totalBudget: input.totalBudget || 0,
      totalSpentBase: 0,
      members: localMembersList.map(m => ({
        userId: m.userId,
        displayName: m.displayName,
        photoURL: m.photoURL,
        role: m.role as any,
        isActive: true,
        totalPaidBase: 0,
        totalOwesBase: 0,
      })),
      stops: initialStops as any,
      createdAt: now,
      updatedAt: now,
    } as any;

    const localTrip: LocalTrip = {
      id: tripId,
      title: input.title,
      description: input.description || '',
      coverImage: input.coverImage || '',
      startDate: input.startDate || now,
      endDate: input.endDate || now,
      status: input.status || 'planning',
      baseCurrency: currency,
      totalBudgetMinor,
      totalSpentMinor: 0,
      rawJson: JSON.stringify(tripObj),
      syncStatus: 'PENDING',
      updatedAt: now,
    };

    // Clean payload for the server: no client _id, no internal minor units
    const queuePayload = {
      title: input.title,
      description: input.description,
      coverImage: input.coverImage,
      startDate: input.startDate || now,
      endDate: input.endDate || now,
      baseCurrency: currency,
      totalBudget: input.totalBudget,
      defaultSplitMethod: input.defaultSplitMethod,
      allowAnyPayer: (input as any).allowAnyPayer,
      memberIds: (input as any).memberIds,
      status: input.status || 'planning',
      initialStop: input.initialStop,
      clientOperationId,
    };

    // Save + enqueue must succeed together. If enqueue fails, roll the local trip
    // back so we never leave a PENDING trip that nothing will ever sync.
    try {
      await this.db.saveTrip(localTrip);
      if (localMembersList.length > 0) {
        await this.db.saveTripMembers(tripId, localMembersList);
      }
      if (__DEV__)
        console.log('[SYNC:TRIP_LOCAL_SAVE]', {
          tripId,
          title: localTrip.title,
        });

      await syncQueue.enqueue(
        clientOperationId,
        'trip',
        tripId,
        'CREATE',
        queuePayload,
        undefined,
      );
      if (__DEV__)
        console.log('[SYNC:TRIP_QUEUE_INSERTED]', {
          clientOperationId,
          entityId: tripId,
        });
    } catch (e) {
      warn('[SYNC:TRIP_CREATE_LOCAL_FAILED]', e);
      await this.db.deleteTrip(tripId).catch(() => {});
      throw e;
    }

    await getWidgetService()
      .updateAllWidgets()
      .catch((e: unknown) => warn('[WIDGET:UPDATE_FAILED]', e));
    if (autoSync) {
      getSyncEngine()
        .sync(tripId)
        .catch((e: unknown) => warn('[SYNC:AUTO_SYNC_FAILED]', e));
    }

    return localTrip;
  }

  // ==================================================================
  // CONFIRM (server accepted the CREATE)
  // ==================================================================

  /**
   * Called when the server confirms a trip CREATE.
   *
   *  - Re-keys local data to the server ID (atomic on SQLite, idempotent on web).
   *  - Retries the remap; if it still fails it THROWS, and the CREATE stays queued
   *    (it is only removed after a successful remap). The server must therefore be
   *    idempotent on `clientOperationId`, otherwise a retry would create a duplicate.
   *  - Removes only the CREATE operation. Later offline edits stay queued.
   */
  async confirmServerTrip(
    localId: string,
    serverTrip: any,
    clientOperationId?: string,
  ): Promise<void> {
    const serverId: string | undefined = serverTrip?._id || serverTrip?.id;
    const opId: string | undefined =
      clientOperationId || serverTrip?.clientOperationId;
    const canonicalId = serverId || localId;

    if (__DEV__)
      console.log('[SYNC:LOCAL_ID → SERVER_ID]', { localId, serverId });

    // 1. Remap (must succeed before we forget the CREATE)
    if (serverId && serverId !== localId) {
      try {
        await this.withRetry(
          () => this.db.remapTripId(localId, serverId, serverTrip?.stops),
          3,
          250,
        );
      } catch (e) {
        warn('[SYNC:REMAP_FAILED]', e);
        throw e;
      }
      if (__DEV__)
        console.log('[SYNC:CHILD_ID_REMAP]', {
          localTripId: localId,
          canonicalServerId: serverId,
        });
    }

    // 2. Remove ONLY the confirmed CREATE (never other pending ops for this trip)
    try {
      if (opId) {
        await this.db.removeSyncQueueByOperationId(opId);
      } else {
        await this.removeTripCreateOps([localId, canonicalId]);
      }
    } catch (e) {
      warn('[SYNC:QUEUE_CLEANUP_FAILED]', e);
    }

    // 3. Only overwrite local data with the server copy if nothing else is queued for it
    let hasPending = false;
    try {
      const pending = await this.db.getPendingSyncQueue(true);
      hasPending = pending.some(
        q =>
          q.entityType === 'trip' &&
          (q.entityId === canonicalId || q.entityId === localId),
      );
    } catch (e) {
      warn('[SYNC:PENDING_CHECK_FAILED]', e);
      hasPending = true; // be conservative: don't clobber local data
    }

    if (serverTrip) {
      const normalized = serverId
        ? { ...serverTrip, _id: serverId }
        : serverTrip;
      await this.reconcileServerTrips([normalized], {
        force: !hasPending,
      }).catch(e => warn('[SYNC:CONFIRM_RECONCILE_FAILED]', e));
    }

    if (__DEV__)
      console.log('[SYNC:QUEUE_STATUS_UPDATE]', {
        entityId: canonicalId,
        status: 'SYNCED',
      });
    await getWidgetService()
      .updateAllWidgets()
      .catch((e: unknown) => warn('[WIDGET:UPDATE_FAILED]', e));
  }

  // ==================================================================
  // UPDATE (offline-first)
  // ==================================================================

  /**
   * Updates a trip locally and queues a server-shaped UPDATE.
   * Accepts either the local trip ID or an old (remapped) ID.
   */
  async updateTripLocally(
    tripId: string,
    updates: TripUpdateInput,
  ): Promise<void> {
    // Resolve to the canonical ID if this trip has been remapped since the caller got its ID
    let id = tripId;
    let existing = await this.db.getTripById(id);
    if (!existing) {
      const canonical = await this.db.getCanonicalTripId(tripId);
      if (canonical) {
        id = canonical;
        existing = await this.db.getTripById(id);
      }
    }
    if (!existing)
      throw new Error(`[TripRepository] Trip not found: ${tripId}`);

    const now = new Date().toISOString();
    const currency = updates.baseCurrency ?? existing.baseCurrency;

    // Whitelisted, server-shaped fields (undefined values are dropped)
    const serverFields: Record<string, unknown> = {
      title: updates.title,
      description: updates.description,
      coverImage: updates.coverImage,
      startDate: updates.startDate,
      endDate: updates.endDate,
      status: updates.status,
      baseCurrency: updates.baseCurrency,
      totalBudget: updates.totalBudget,
    };
    const payload: Record<string, unknown> = Object.fromEntries(
      Object.entries(serverFields).filter(([, v]) => v !== undefined),
    );

    // Local patch (never persist syncStatus/updatedAt coming from the caller)
    const localPatch: Partial<LocalTrip> = {
      ...(updates.title !== undefined && { title: updates.title }),
      ...(updates.description !== undefined && {
        description: updates.description,
      }),
      ...(updates.coverImage !== undefined && {
        coverImage: updates.coverImage,
      }),
      ...(updates.startDate !== undefined && { startDate: updates.startDate }),
      ...(updates.endDate !== undefined && { endDate: updates.endDate }),
      ...(updates.status !== undefined && { status: updates.status }),
      ...(updates.baseCurrency !== undefined && {
        baseCurrency: updates.baseCurrency,
      }),
    };
    if (updates.totalBudget !== undefined) {
      localPatch.totalBudgetMinor = toMinorUnits(updates.totalBudget, currency);
    } else if (updates.totalBudgetMinor !== undefined) {
      localPatch.totalBudgetMinor = updates.totalBudgetMinor; // local-only; no server field without major units
    }

    if (
      Object.keys(payload).length === 0 &&
      localPatch.totalBudgetMinor === undefined
    )
      return;

    // Keep rawJson (what widgets/UI may read) consistent with the edit
    try {
      const raw = existing.rawJson ? JSON.parse(existing.rawJson) : {};
      localPatch.rawJson = JSON.stringify({
        ...raw,
        ...payload,
        updatedAt: now,
      });
    } catch {
      // leave rawJson untouched if it is not valid JSON
    }

    const clientOperationId = generateUUID();

    await this.db.saveTrip({
      id,
      ...localPatch,
      syncStatus: 'PENDING',
      updatedAt: now,
    });

    try {
      // Ordered by created_at after any pending CREATE; remapTripId re-points entityId when the CREATE confirms
      await syncQueue.enqueue(
        clientOperationId,
        'trip',
        id,
        'UPDATE',
        payload,
        undefined,
      );
    } catch (e) {
      warn('[SYNC:TRIP_UPDATE_ENQUEUE_FAILED]', e);
      // Restore the previous local state so UI never shows an edit that will never sync
      await this.db.saveTrip({ ...existing }).catch(() => {});
      throw e;
    }

    await getWidgetService()
      .updateAllWidgets()
      .catch((e: unknown) => warn('[WIDGET:UPDATE_FAILED]', e));
    getSyncEngine()
      .sync(id)
      .catch((e: unknown) => warn('[SYNC:AUTO_SYNC_FAILED]', e));
  }

  // ==================================================================
  // INTERNAL HELPERS
  // ==================================================================

  private async withRetry<T>(
    fn: () => Promise<T>,
    attempts: number,
    delayMs: number,
  ): Promise<T> {
    let lastError: unknown;
    for (let i = 1; i <= attempts; i++) {
      try {
        return await fn();
      } catch (e) {
        lastError = e;
        if (i < attempts) await sleep(delayMs * i);
      }
    }
    throw lastError;
  }

  private async removeTripCreateOps(entityIds: string[]): Promise<void> {
    const ids = new Set(entityIds.filter(Boolean));
    const pending = await this.db.getPendingSyncQueue(true);
    for (const q of pending) {
      if (
        q.entityType === 'trip' &&
        q.operationType === 'CREATE' &&
        ids.has(q.entityId)
      ) {
        await this.db.removeSyncQueueItem(q.id);
      }
    }
  }
}

export const tripRepository = new TripRepository();

// // src/repositories/trip.repository.ts
// import { getLocalDatabase, LocalTrip, LocalTripMember } from '../db';
// import { syncQueue } from '../sync/syncQueue';
// import { syncEngine } from '../sync/syncEngine';
// import { widgetService } from '../services/widget/widgetService';
// import { generateUUID } from '../utils/uuid';
// import { toMinorUnits } from '../utils/money/money';
// import { ITrip, ITripMember } from '../types/trip.types';

// export class TripRepository {
//   private db = getLocalDatabase();

//   /**
//    * Retrieves all trips stored in the local persistent database.
//    */
//   async getLocalTrips(): Promise<LocalTrip[]> {
//     return this.db.getTrips();
//   }

//   /**
//    * Retrieves a single trip by ID from the local database.
//    */
//   async getLocalTripById(id: string): Promise<LocalTrip | null> {
//     return this.db.getTripById(id);
//   }

//   /**
//    * Retrieves all members of a trip from the local database.
//    */
//   async getLocalTripMembers(tripId: string): Promise<LocalTripMember[]> {
//     return this.db.getTripMembers(tripId);
//   }

//   /**
//    * Saves or reconciles remote trips into local SQLite/web storage.
//    */
//   async reconcileServerTrips(serverTrips: ITrip[]): Promise<void> {
//     for (const trip of serverTrips) {
//       const currency = trip.baseCurrency || 'INR';
//       const totalBudgetMinor = trip.totalBudget
//         ? toMinorUnits(trip.totalBudget, currency)
//         : 0;
//       const totalSpentMinor = trip.totalSpentBase
//         ? toMinorUnits(trip.totalSpentBase, currency)
//         : 0;

//       const localTrip: Partial<LocalTrip> = {
//         id: trip._id,
//         title: trip.title,
//         description: trip.description || '',
//         coverImage: trip.coverImage || '',
//         startDate: trip.startDate || '',
//         endDate: trip.endDate || '',
//         status: trip.status || 'planning',
//         baseCurrency: currency,
//         totalBudgetMinor,
//         totalSpentMinor,
//         rawJson: JSON.stringify(trip),
//         syncStatus: 'SYNCED',
//         updatedAt: trip.updatedAt || new Date().toISOString(),
//       };

//       await this.db.saveTrip(localTrip);

//       if (trip.members && Array.isArray(trip.members)) {
//         const localMembers: LocalTripMember[] = trip.members.map((m: ITripMember) => ({
//           tripId: trip._id,
//           userId: m.userId,
//           displayName: m.displayName || 'Member',
//           photoURL: m.photoURL || m.avatarUrl || '',
//           role: m.role || 'member',
//           isActive: m.isActive !== false,
//           totalPaidMinor: toMinorUnits(m.totalPaidBase || 0, currency),
//           totalOwesMinor: toMinorUnits(m.totalOwesBase || 0, currency),
//         }));
//         await this.db.saveTripMembers(trip._id, localMembers);
//       }
//     }

//     // Refresh Android widgets with newly reconciled trips
//     await widgetService.updateAllWidgets().catch(() => {});
//   }

//   /**
//    * Creates a trip locally first, queues it for background sync, and updates widgets.
//    */
//   async createTripLocally(input: {
//     title: string;
//     description?: string;
//     coverImage?: string;
//     startDate?: string;
//     endDate?: string;
//     baseCurrency?: string;
//     totalBudget?: number;
//     defaultSplitMethod?: string;
//     status?: string;
//     initialStop?: any;
//     members?: Array<{ userId: string; displayName: string; role?: string; photoURL?: string }>;
//   }, autoSync: boolean = true): Promise<LocalTrip> {
//     if (__DEV__) {
//       console.log('[SYNC:TRIP_CREATE_START]', { title: input.title });
//     }
//     const tripId = generateUUID();
//     const clientOperationId = generateUUID();
//     const currency = input.baseCurrency || 'INR';
//     const totalBudgetMinor = input.totalBudget ? toMinorUnits(input.totalBudget, currency) : 0;
//     const now = new Date().toISOString();

//     // Ensure at least one initial stop exists so offline users can log expenses immediately
//     const initialStops = input.initialStop
//       ? [{
//           _id: generateUUID(),
//           title: input.initialStop.city || input.initialStop.name || 'First Stop',
//           city: input.initialStop.city || '',
//           country: input.initialStop.country || '',
//           startDate: input.startDate || now,
//           endDate: input.endDate || now,
//           currency: input.initialStop.currency || currency,
//           currentExchangeRate: 1,
//         }]
//       : [{
//           _id: generateUUID(),
//           title: 'General',
//           city: '',
//           country: '',
//           startDate: input.startDate || now,
//           endDate: input.endDate || now,
//           currency,
//           currentExchangeRate: 1,
//         }];

//     const localMembersList = (input.members && input.members.length > 0)
//       ? input.members.map((m) => ({
//           tripId,
//           userId: m.userId,
//           displayName: m.displayName || 'Member',
//           photoURL: m.photoURL || '',
//           role: m.role || 'member',
//           isActive: true,
//           totalPaidMinor: 0,
//           totalOwesMinor: 0,
//         }))
//       : [];

//     const tripObj: ITrip = {
//       _id: tripId,
//       title: input.title,
//       description: input.description || '',
//       coverImage: input.coverImage || '',
//       startDate: input.startDate || now,
//       endDate: input.endDate || now,
//       status: (input.status as any) || 'planning',
//       baseCurrency: currency,
//       totalBudget: input.totalBudget || 0,
//       totalSpentBase: 0,
//       members: localMembersList.map((m) => ({
//         userId: m.userId,
//         displayName: m.displayName,
//         photoURL: m.photoURL,
//         role: m.role as any,
//         isActive: true,
//         totalPaidBase: 0,
//         totalOwesBase: 0,
//       })),
//       stops: initialStops as any,
//       createdAt: now,
//       updatedAt: now,
//     } as any;

//     const localTrip: LocalTrip = {
//       id: tripId,
//       title: input.title,
//       description: input.description || '',
//       coverImage: input.coverImage || '',
//       startDate: input.startDate || now,
//       endDate: input.endDate || now,
//       status: input.status || 'planning',
//       baseCurrency: currency,
//       totalBudgetMinor,
//       totalSpentMinor: 0,
//       rawJson: JSON.stringify(tripObj),
//       syncStatus: 'PENDING',
//       updatedAt: now,
//     };

//     await this.db.saveTrip(localTrip);
//     if (__DEV__) {
//       console.log('[SYNC:TRIP_LOCAL_SAVE]', { tripId, title: localTrip.title });
//       console.log('[SYNC:TRIP_LOCAL_ID]', { localTripId: tripId });
//     }

//     if (localMembersList.length > 0) {
//       await this.db.saveTripMembers(tripId, localMembersList);
//     }

//     // Clean payload for server creation: omit client UUID _id and internal minor units
//     const queuePayload = {
//       title: input.title,
//       description: input.description,
//       coverImage: input.coverImage,
//       startDate: input.startDate || now,
//       endDate: input.endDate || now,
//       baseCurrency: currency,
//       totalBudget: input.totalBudget,
//       defaultSplitMethod: input.defaultSplitMethod,
//       allowAnyPayer: (input as any).allowAnyPayer,
//       memberIds: (input as any).memberIds,
//       status: input.status || 'planning',
//       initialStop: input.initialStop,
//       clientOperationId,
//     };

//     // Enqueue operation for background synchronization
//     await syncQueue.enqueue(
//       clientOperationId,
//       'trip',
//       tripId,
//       'CREATE',
//       queuePayload,
//       undefined
//     );

//     if (__DEV__) {
//       console.log('[SYNC:TRIP_QUEUE_INSERTED]', { clientOperationId, entityId: tripId });
//     }

//     // Update widgets and trigger background sync
//     await widgetService.updateAllWidgets().catch(() => {});
//     if (autoSync) {
//       syncEngine.sync(tripId).catch(() => {});
//     }

//     return localTrip;
//   }

//   /**
//    * Reconciles a server-confirmed trip, safely clearing queue items
//    * and updating child entities (expenses/stops) if server allocated a new ID.
//    */
//   async confirmServerTrip(localId: string, serverTrip: any, clientOperationId?: string): Promise<void> {
//     const serverId = serverTrip?._id || serverTrip?.id;
//     const opId = clientOperationId || serverTrip?.clientOperationId;

//     if (__DEV__) {
//       console.log('[SYNC:LOCAL_ID → SERVER_ID]', { localId, serverId });
//     }

//     if (serverId && serverId !== localId) {
//       await this.db.remapTripId(localId, serverId, serverTrip?.stops);
//       if (__DEV__) {
//         console.log('[SYNC:CHILD_ID_REMAP]', { localTripId: localId, canonicalServerId: serverId });
//       }
//     }

//     if (opId) {
//       await this.db.removeSyncQueueByOperationId(opId).catch(() => {});
//     }
//     if (localId) {
//       await this.db.removeSyncQueueByEntityId(localId).catch(() => {});
//     }

//     if (__DEV__) {
//       console.log('[SYNC:QUEUE_STATUS_UPDATE]', { entityId: serverId || localId, status: 'SYNCED' });
//     }

//     if (serverTrip) {
//       await this.reconcileServerTrips([serverTrip]).catch(() => {});
//     }

//     await widgetService.updateAllWidgets().catch(() => {});
//   }

//   async getCanonicalTripId(tripId: string): Promise<string | null> {
//     return this.db.getCanonicalTripId(tripId);
//   }

//   /**
//    * Updates an existing trip locally and enqueues sync.
//    */
//   async updateTripLocally(tripId: string, updates: Partial<LocalTrip>): Promise<void> {
//     const clientOperationId = generateUUID();
//     const now = new Date().toISOString();

//     await this.db.saveTrip({
//       id: tripId,
//       ...updates,
//       syncStatus: 'PENDING',
//       updatedAt: now,
//     });

//     await syncQueue.enqueue(
//       clientOperationId,
//       'trip',
//       tripId,
//       'UPDATE',
//       updates
//     );

//     await widgetService.updateAllWidgets().catch(() => {});
//     syncEngine.sync(tripId).catch(() => {});
//   }
// }

// export const tripRepository = new TripRepository();
