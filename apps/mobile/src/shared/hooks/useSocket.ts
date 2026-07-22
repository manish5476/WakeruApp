import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { Alert, Linking, Vibration } from 'react-native';
import config from '../../core/config';
import { useAuthStore } from '../stores/auth.store';
import { useThemeStore } from '../stores/theme.store';
import { queryKeys } from './queryKeys';
import { storage } from '../../core/storage/MMKVStorage';

// ============================================================
// Types
// ============================================================

interface ExpenseEvent {
  type: string;
  tripId: string;
  expenseId: string;
  title: string;
  amount: number;
  currency: string;
  paidBy: string;
  timestamp: string;
}

interface SettlementEvent {
  type: string;
  tripId: string;
  amount: number;
  currency: string;
  fromName?: string;
  userName?: string;
  timestamp: string;
}

interface InvitationEvent {
  type: string;
  invitationId: string;
  tripId: string;
  tripTitle: string;
  inviterName?: string;
  userName?: string;
  message?: string;
  timestamp: string;
}

interface StopEvent {
  type: string;
  tripId: string;
  stopName: string;
  timestamp: string;
}

// ============================================================
// Socket Hook
// ============================================================

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const tokens = useAuthStore((s) => s.tokens);
  const queryClient = useQueryClient();

  // ============================================================
  // Connect / Disconnect
  // ============================================================

  useEffect(() => {
    if (!tokens?.accessToken) {
      // Disconnect if logged out
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    // Don't reconnect if already connected
    if (socketRef.current?.connected) return;

    const socketUrl = config.API_URL.replace('/api/v1', '');

    const socket = io(socketUrl, {
      auth: { token: tokens.accessToken },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
    });

    socket.on('connect', () => {
      console.log('🔌 Socket connected:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log('🔌 Socket reconnected after', attemptNumber, 'attempts');
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [tokens?.accessToken]);

  // ============================================================
  // Event Listeners — Invalidate React Query Cache
  // ============================================================

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    // ── Expense Events ──────────────────────────────────────
    socket.on('expense:added', (data: ExpenseEvent) => {
      console.log('📩 expense:added', data.title);
      // Invalidate all expense-related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.trips.detail(data.tripId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.trips.summary(data.tripId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.settlements.detail(data.tripId) });
    });

    socket.on('expense:updated', (data: ExpenseEvent) => {
      console.log('📩 expense:updated', data.title);
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.detail(data.expenseId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.trips.detail(data.tripId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.trips.summary(data.tripId) });
    });

    socket.on('expense:deleted', (data: ExpenseEvent) => {
      console.log('📩 expense:deleted', data.title);
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.trips.detail(data.tripId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.trips.summary(data.tripId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.settlements.detail(data.tripId) });
    });

    socket.on('expense:comment_added', (data: any) => {
      console.log('📩 expense:comment_added', data.title, data.authorName);
      // Instantly refresh the specific expense's details to show the new comment
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.detail(data.expenseId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all }); // Update lists if they show comment counts
      
      // We do not show an intrusive alert here because the user will get a notification,
      // and if they are on the screen, they will see it pop up. We can just invalidate cache.
    });

    socket.on('expense:comment_deleted', (data: any) => {
      console.log('📩 expense:comment_deleted', data.title);
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.detail(data.expenseId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all });
    });

    // ── Settlement Events ───────────────────────────────────
    socket.on('settlement:request', (data: SettlementEvent) => {
      console.log('📩 settlement:request', data.amount, data.currency);
      queryClient.invalidateQueries({ queryKey: queryKeys.settlements.detail(data.tripId) });
      Alert.alert(
        'Settlement Request',
        `${data.fromName || 'Someone'} requests ${data.amount} ${data.currency}`
      );
    });

    socket.on('settlement:completed', (data: SettlementEvent) => {
      console.log('📩 settlement:completed', data.amount, data.currency);
      queryClient.invalidateQueries({ queryKey: queryKeys.settlements.detail(data.tripId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.trips.summary(data.tripId) });

      const role = (data as any).role;
      if (role === 'recipient') {
        Alert.alert('Payment Received!', `You received ${data.amount} ${data.currency}`);
      }
    });

    // ── Invitation Events ───────────────────────────────────
    socket.on('invitation:received', (data: InvitationEvent) => {
      console.log('📩 invitation:received', data.tripTitle);
      queryClient.invalidateQueries({ queryKey: ['invitations', 'pending'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount });

      Alert.alert(
        'Trip Invitation! 🎉',
        data.message || `${data.inviterName || 'Someone'} invited you to "${data.tripTitle}"`,
        [
          { text: 'Later', style: 'cancel' },
          {
            text: 'View',
            onPress: () => {
              // Navigate to trip or invitations screen
              // router.push('/(app)/notifications');
            }
          },
        ]
      );
    });

    socket.on('invitation:accepted', (data: InvitationEvent) => {
      console.log('📩 invitation:accepted', data.userName);
      queryClient.invalidateQueries({ queryKey: queryKeys.trips.members(data.tripId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.trips.detail(data.tripId) });

      Alert.alert(
        'Invitation Accepted ✅',
        `${data.userName || 'Someone'} accepted your invitation to "${data.tripTitle}"`
      );
    });

    socket.on('invitation:declined', (data: InvitationEvent) => {
      console.log('📩 invitation:declined', data.userName);
      queryClient.invalidateQueries({ queryKey: ['invitations'] });

      Alert.alert(
        'Invitation Declined ❌',
        `${data.userName || 'Someone'} declined your invitation to "${data.tripTitle}"`
      );
    });

    // ── Trip Events ─────────────────────────────────────────
    socket.on('trip:member_joined', (data: any) => {
      console.log('📩 trip:member_joined', data.joinerName);
      queryClient.invalidateQueries({ queryKey: queryKeys.trips.members(data.tripId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.trips.detail(data.tripId) });
    });

    // ── Stop Events ─────────────────────────────────────────
    socket.on('stop:added', (data: StopEvent) => {
      console.log('📩 stop:added', data.stopName);
      queryClient.invalidateQueries({ queryKey: queryKeys.trips.detail(data.tripId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.trips.summary(data.tripId) });
    });

    socket.on('stop:rate_updated', (data: any) => {
      console.log('📩 stop:rate_updated', data.stopName, data.newRate);
      queryClient.invalidateQueries({ queryKey: queryKeys.trips.detail(data.tripId) });
    });

    // ── Global App Events ───────────────────────────────────
    socket.on('user:preferences_updated', (data: any) => {
      console.log('📩 user:preferences_updated');
      if (data.preferences?.appearance || data.preferences?.theme) {
        useThemeStore.getState().hydrateFromBackend(data.preferences.appearance, data.preferences.theme);
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.auth?.profile || ['profile'] });
    });

    socket.on('trip:member_updated', (data: any) => {
      console.log('📩 trip:member_updated', data.userId);
      queryClient.invalidateQueries({ queryKey: queryKeys.trips.members(data.tripId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.trips.detail(data.tripId) });
    });

    socket.on('app:update_broadcast', (data: { link: string }) => {
      console.log('📩 app:update_broadcast', data.link);
      storage.setString('latest_app_update_link', data.link);

      // Invalidate notifications query so the new persistent notification shows up
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount });

      Alert.alert(
        '🚀 New Update Available!',
        'A new version of the app has been released. Please download it now for the best experience.',
        [
          { text: 'Later', style: 'cancel' },
          {
            text: 'Download',
            style: 'default',
            onPress: () => {
              Linking.openURL(data.link).catch(err => console.error("Couldn't load page", err));
            }
          },
        ]
      );
    });

    socket.on('reminder:ping', (data: any) => {
      console.log('📩 reminder:ping', data.amount);

      // Invalidate notifications query so the ping shows up in the notification list
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount });

      Vibration.vibrate([0, 500, 200, 500]); // Haptic/Vibration pattern

      Alert.alert(
        '🔔 Payment Reminder',
        data.message,
        [
          { text: 'Okay', style: 'default' }
        ]
      );
    });

    // ── Cleanup Listeners ───────────────────────────────────
    return () => {
      socket.off('expense:added');
      socket.off('expense:updated');
      socket.off('expense:deleted');
      socket.off('expense:comment_added');
      socket.off('expense:comment_deleted');
      socket.off('settlement:request');
      socket.off('settlement:completed');
      socket.off('invitation:received');
      socket.off('invitation:accepted');
      socket.off('invitation:declined');
      socket.off('trip:member_joined');
      socket.off('stop:added');
      socket.off('stop:rate_updated');
      socket.off('user:preferences_updated');
      socket.off('trip:member_updated');
      socket.off('app:update_broadcast');
      socket.off('reminder:ping');
    };
  }, [socketRef.current?.connected, queryClient]);

  // ============================================================
  // Room Management
  // ============================================================

  const subscribeToTrip = useCallback((tripId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('subscribe:trip', tripId);
      console.log('📨 Subscribed to trip:', tripId);
    }
  }, []);

  const unsubscribeFromTrip = useCallback((tripId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('unsubscribe:trip', tripId);
      console.log('📨 Unsubscribed from trip:', tripId);
    }
  }, []);

  return {
    socket: socketRef.current,
    subscribeToTrip,
    unsubscribeFromTrip,
  };
}

