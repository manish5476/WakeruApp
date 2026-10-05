import type {
  Notification,
  NotificationStats,
  NotificationFilters,
  NotificationType,
  BroadcastPayload,
} from '../../types/notification.types';

/**
 * Port — the domain's view of persistence / remote data.
 * Implemented by `NotificationRepository` in the infrastructure layer.
 */
export interface INotificationRepository {
  /** Fetch a (possibly filtered) list of notifications. */
  getAll(filters?: NotificationFilters): Promise<Notification[]>;

  /** Return the current unread notification count for the authenticated user. */
  getUnreadCount(): Promise<number>;

  /** Return aggregate stats (total, unread, breakdown by type). */
  getStats(): Promise<NotificationStats>;

  /** Mark a single notification as read by its id. */
  markAsRead(id: string): Promise<void>;

  /** Mark every notification belonging to the user as read. */
  markAllAsRead(): Promise<void>;

  /** Mark all notifications of a specific type as read. */
  markAsReadByType(type: NotificationType): Promise<void>;

  /** Permanently delete a single notification. */
  delete(id: string): Promise<void>;

  /** Permanently delete all notifications for the authenticated user. */
  clearAll(): Promise<void>;

  /**
   * Delete notifications older than `days` days.
   * Defaults to 30 days when omitted.
   */
  deleteOld(days?: number): Promise<void>;

  /**
   * **Admin-only.**
   * Broadcast an update notification to all users.
   * Requires the admin `password` for authorisation.
   */
  broadcastUpdate(payload: BroadcastPayload): Promise<void>;
}
