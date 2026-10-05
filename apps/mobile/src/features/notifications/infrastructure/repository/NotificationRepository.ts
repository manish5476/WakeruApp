import type { INotificationRepository } from '../../domain/repositories/INotificationRepository';
import type {
  Notification,
  NotificationStats,
  NotificationFilters,
  NotificationType,
  BroadcastPayload,
} from '../../types/notification.types';
import { NotificationRemoteDataSource } from '../datasource/NotificationRemoteDataSource';
import { NotificationMapper } from '../mapper/NotificationMapper';

/**
 * Concrete implementation of `INotificationRepository`.
 * Delegates to `NotificationRemoteDataSource` for I/O and uses
 * `NotificationMapper` to convert raw DTOs into domain objects.
 */
export class NotificationRepository implements INotificationRepository {
  constructor(
    private readonly dataSource: NotificationRemoteDataSource = new NotificationRemoteDataSource(),
  ) {}

  async getAll(filters?: NotificationFilters): Promise<Notification[]> {
    const dto = await this.dataSource.getNotifications(filters);
    return dto.notifications.map(NotificationMapper.toDomain);
  }

  async getUnreadCount(): Promise<number> {
    const dto = await this.dataSource.getUnreadCount();
    return dto.unreadCount;
  }

  async getStats(): Promise<NotificationStats> {
    const dto = await this.dataSource.getNotificationStats();
    return NotificationMapper.statsFromDTO(dto);
  }

  async markAsRead(id: string): Promise<void> {
    await this.dataSource.markAsRead(id);
  }

  async markAllAsRead(): Promise<void> {
    await this.dataSource.markAllAsRead();
  }

  async markAsReadByType(type: NotificationType): Promise<void> {
    await this.dataSource.markAsReadByType(type);
  }

  async delete(id: string): Promise<void> {
    await this.dataSource.deleteNotification(id);
  }

  async clearAll(): Promise<void> {
    await this.dataSource.clearAll();
  }

  async deleteOld(days?: number): Promise<void> {
    await this.dataSource.deleteOld(days);
  }

  /**
   * **Admin-only.**
   * Sends a broadcast update to all users via the admin API.
   */
  async broadcastUpdate(payload: BroadcastPayload): Promise<void> {
    await this.dataSource.broadcastUpdate(payload.password, payload.link);
  }
}
