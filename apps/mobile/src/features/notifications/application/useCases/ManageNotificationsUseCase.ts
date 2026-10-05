import type { INotificationRepository } from '../../domain/repositories/INotificationRepository';
import type {
  NotificationType,
  BroadcastPayload,
} from '../../types/notification.types';

/**
 * Application use case that handles all mutation operations for notifications.
 */
export class ManageNotificationsUseCase {
  constructor(private readonly repository: INotificationRepository) {}

  /** Mark a single notification as read. */
  async markAsRead(id: string): Promise<void> {
    return this.repository.markAsRead(id);
  }

  /** Mark all of the user's notifications as read. */
  async markAllAsRead(): Promise<void> {
    return this.repository.markAllAsRead();
  }

  /** Mark all notifications of a given type as read. */
  async markAsReadByType(type: NotificationType): Promise<void> {
    return this.repository.markAsReadByType(type);
  }

  /** Permanently delete a single notification by id. */
  async delete(id: string): Promise<void> {
    return this.repository.delete(id);
  }

  /** Permanently delete all of the user's notifications. */
  async clearAll(): Promise<void> {
    return this.repository.clearAll();
  }

  /**
   * Delete notifications older than `days` days.
   * Defaults to 30 days when omitted.
   */
  async deleteOld(days?: number): Promise<void> {
    return this.repository.deleteOld(days);
  }

  /**
   * **Admin-only.**
   * Broadcasts an update notification to all users.
   * The `payload.password` field is required for server-side authorisation.
   */
  async broadcast(payload: BroadcastPayload): Promise<void> {
    return this.repository.broadcastUpdate(payload);
  }
}
