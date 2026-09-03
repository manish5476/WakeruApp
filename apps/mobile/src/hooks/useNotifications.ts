import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../services/api';
import { queryKeys } from './queryKeys';

// ============================================================
// Notifications List
// ============================================================

export function useNotifications(filters?: Record<string, any>) {
  return useQuery({
    queryKey: queryKeys.notifications.all(filters),
    queryFn: async () => {
      const response = await notificationsApi.getNotifications(filters);
      return response.data;
    },
  });
}

// ============================================================
// Unread Count
// ============================================================

export function useUnreadCount() {
  return useQuery({
    queryKey: queryKeys.notifications.unreadCount,
    queryFn: async () => {
      const response = await notificationsApi.getUnreadCount();
      return response.data?.unreadCount || 0;
    },

    staleTime: 15000,
  });
}

// ============================================================
// Mark as Read
// ============================================================

export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      return notificationsApi.markAsRead(notificationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.unreadCount,
      });
    },
  });
}

// ============================================================
// Mark All as Read
// ============================================================

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      return notificationsApi.markAllAsRead();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.unreadCount,
      });
    },
  });
}

// ============================================================
// Delete Notification
// ============================================================

export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      return notificationsApi.deleteNotification(notificationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.unreadCount,
      });
    },
  });
}

// ============================================================
// Clear All Notifications
// ============================================================

export function useClearAllNotifications() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      return notificationsApi.clearAll();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.unreadCount,
      });
    },
  });
}

// ============================================================
// Notification Stats
// ============================================================

export function useNotificationStats() {
  return useQuery({
    queryKey: queryKeys.notifications.stats,
    queryFn: async () => {
      const response = await notificationsApi.getNotificationStats();
      return response.data?.stats || null;
    },
  });
}

// ============================================================
// Mark As Read By Type
// ============================================================

export function useMarkAsReadByType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (type: string) => {
      return notificationsApi.markAsReadByType(type);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.unreadCount,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.stats,
      });
    },
  });
}

// ============================================================
// Delete Old Notifications
// ============================================================

export function useDeleteOldNotifications() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (days: number = 30) => {
      return notificationsApi.deleteOld(days);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.unreadCount,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.stats,
      });
    },
  });
}
