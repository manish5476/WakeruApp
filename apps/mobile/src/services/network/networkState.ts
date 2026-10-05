// src/services/network/networkState.ts
import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { syncEngine } from '../../sync/syncEngine';
import { syncQueue } from '../../sync/syncQueue';

export type NetworkStatus = 'ONLINE' | 'OFFLINE';
export type SyncStatusState = 'IDLE' | 'SYNCING' | 'SYNCED' | 'ERROR';

export type NetworkListener = (status: {
  isOnline: boolean;
  syncState: SyncStatusState;
  pendingCount: number;
}) => void;

class NetworkStateService {
  private isOnline: boolean = true;
  private syncState: SyncStatusState = 'IDLE';
  private pendingCount: number = 0;
  private listeners: Set<NetworkListener> = new Set();
  private subscription: any = null;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    // Initial connectivity check
    await this.checkConnectivity();

    // Listen for network changes
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        window.addEventListener('online', () => this.handleOnlineChange(true));
        window.addEventListener('offline', () =>
          this.handleOnlineChange(false),
        );
      }
    } else {
      try {
        this.subscription = NetInfo.addEventListener(state => {
          const online = Boolean(
            state.isConnected && (state.isInternetReachable ?? true),
          );
          this.handleOnlineChange(online);
        });
      } catch (err) {
        console.warn(
          '[NetworkState] Failed to attach NetworkStateListener:',
          err,
        );
      }
    }

    // Subscribe to sync engine status
    syncEngine.subscribe(state => {
      this.syncState = state;
      this.refreshPendingCount();
    });

    // Periodic check for pending count
    this.refreshPendingCount();
  }

  async checkConnectivity(): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        this.isOnline =
          typeof navigator !== 'undefined' ? navigator.onLine : true;
      } else {
        const state = await NetInfo.fetch();
        this.isOnline = Boolean(
          state.isConnected && (state.isInternetReachable ?? true),
        );
      }
    } catch {
      this.isOnline = true;
    }
    this.notify();
    return this.isOnline;
  }

  private async handleOnlineChange(online: boolean) {
    const wasOffline = !this.isOnline;
    this.isOnline = online;
    await this.refreshPendingCount();

    // Auto-trigger sync when transitioning from offline to online
    if (wasOffline && online) {
      console.log('[NETWORK_ONLINE] Connectivity restored');
      console.log(
        '[SYNC_TRIGGERED] Reason: network_reconnect (forceRetry=true)',
      );
      syncEngine.sync(undefined, true).catch(() => {});
    }

    this.notify();
  }

  async refreshPendingCount(): Promise<number> {
    try {
      const ops = await syncQueue.getPendingOperations(true);
      this.pendingCount = ops.length;
    } catch {
      this.pendingCount = 0;
    }
    this.notify();
    return this.pendingCount;
  }

  subscribe(listener: NetworkListener): () => void {
    this.listeners.add(listener);
    listener({
      isOnline: this.isOnline,
      syncState: this.syncState,
      pendingCount: this.pendingCount,
    });
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const state = {
      isOnline: this.isOnline,
      syncState: this.syncState,
      pendingCount: this.pendingCount,
    };
    this.listeners.forEach(fn => fn(state));
  }

  getStatus() {
    return {
      isOnline: this.isOnline,
      syncState: this.syncState,
      pendingCount: this.pendingCount,
    };
  }
}

export const networkStateService = new NetworkStateService();
