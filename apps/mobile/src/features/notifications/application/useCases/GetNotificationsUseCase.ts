import type { INotificationRepository } from '../../domain/repositories/INotificationRepository';
import type {
  Notification,
  NotificationFilters,
  NotificationStats,
} from '../../types/notification.types';

/**
 * Application use case that handles all read operations for notifications.
 */
export class GetNotificationsUseCase {
  constructor(private readonly repository: INotificationRepository) {}

  /**
   * Fetches a list of notifications, optionally filtered.
   * @param filters - Optional query parameters (type, isRead, page, limit).
   */
  async execute(filters?: NotificationFilters): Promise<Notification[]> {
    return this.repository.getAll(filters);
  }

  /**
   * Returns the current unread notification count for the authenticated user.
   */
  async executeUnreadCount(): Promise<number> {
    return this.repository.getUnreadCount();
  }

  /**
   * Returns aggregate statistics (total, unread, breakdown by type).
   */
  async executeStats(): Promise<NotificationStats> {
    return this.repository.getStats();
  }
}
