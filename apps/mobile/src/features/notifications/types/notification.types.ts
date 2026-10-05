/**
 * Notification feature — shared domain types.
 */

export type NotificationType =
  | 'expense_added'
  | 'settlement_reminder'
  | 'trip_invitation'
  | 'trip_update'
  | 'payment_received'
  | 'friend_request'
  | 'system'
  | 'broadcast';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  priority: NotificationPriority;
  metadata?: Record<string, unknown>;
  actionUrl?: string;
  imageUrl?: string;
  userId: string;
  createdAt: string;
  readAt?: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: Partial<Record<NotificationType, number>>;
}

export interface NotificationFilters {
  type?: NotificationType;
  isRead?: boolean;
  page?: number;
  limit?: number;
}

export interface BroadcastPayload {
  password: string;
  link: string;
}
