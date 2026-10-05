// src/hooks/useNetworkState.ts
import { useState, useEffect, useCallback } from 'react';
import {
  networkStateService,
  SyncStatusState,
} from '../services/network/networkState';
import { syncEngine } from '../sync/syncEngine';

export interface NetworkStateHook {
  isOnline: boolean;
  syncState: SyncStatusState;
  pendingCount: number;
  isPending: boolean;
  triggerSync: (tripId?: string, forceRetry?: boolean) => Promise<any>;
}

export function useNetworkState(): NetworkStateHook {
  const [state, setState] = useState(() => networkStateService.getStatus());

  useEffect(() => {
    const unsubscribe = networkStateService.subscribe(updated => {
      setState(updated);
    });
    return unsubscribe;
  }, []);

  const triggerSync = useCallback(
    async (tripId?: string, forceRetry: boolean = true) => {
      console.log('[SYNC_TRIGGERED] Reason: manual_retry (forceRetry=true)');
      return syncEngine.sync(tripId, forceRetry);
    },
    [],
  );

  return {
    isOnline: state.isOnline,
    syncState: state.syncState,
    pendingCount: state.pendingCount,
    isPending: state.pendingCount > 0,
    triggerSync,
  };
}
