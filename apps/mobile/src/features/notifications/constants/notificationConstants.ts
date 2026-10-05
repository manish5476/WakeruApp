import type {
  NotificationPriority,
  NotificationType,
} from '../types/notification.types';

/** Human-readable label for each notification type. */
export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  expense_added: 'Expense Added',
  settlement_reminder: 'Settlement Reminder',
  trip_invitation: 'Trip Invitation',
  trip_update: 'Trip Update',
  payment_received: 'Payment Received',
  friend_request: 'Friend Request',
  system: 'System',
  broadcast: 'Broadcast',
};

/** Feather icon name for each notification type. */
export const NOTIFICATION_TYPE_ICONS: Record<NotificationType, string> = {
  expense_added: 'dollar-sign',
  settlement_reminder: 'clock',
  trip_invitation: 'mail',
  trip_update: 'map',
  payment_received: 'check-circle',
  friend_request: 'user-plus',
  system: 'settings',
  broadcast: 'radio',
};

/** Human-readable label for each priority level. */
export const NOTIFICATION_PRIORITY_LABELS: Record<
  NotificationPriority,
  string
> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

/** Stale time (ms) for notification list queries. */
export const NOTIFICATION_STALE_TIME_MS = 15_000;

/** Stale time (ms) for the unread count query. */
export const UNREAD_COUNT_STALE_TIME_MS = 15_000;

/** Default page size when fetching paginated notifications. */
export const DEFAULT_NOTIFICATION_PAGE_SIZE = 20;

/** Default age threshold (days) for the deleteOld operation. */
export const DEFAULT_DELETE_OLD_DAYS = 30;
