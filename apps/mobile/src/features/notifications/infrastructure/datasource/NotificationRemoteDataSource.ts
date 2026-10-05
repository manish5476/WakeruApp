import { notificationsApi } from '../../../../core/api/services';
import type {
  NotificationListResponseDTO,
  NotificationStatsDTO,
  UnreadCountResponseDTO,
  NotificationAPIModel,
} from '../dto/NotificationDTO';
import type { NotificationFilters } from '../../types/notification.types';

/**
 * Wraps the raw `notificationsApi` client and returns typed DTOs.
 * All network concerns (retries, auth headers, etc.) are handled by the
 * underlying `apiClient` — this class only adds typing.
 */
export class NotificationRemoteDataSource {
  async getNotifications(
    filters?: NotificationFilters,
  ): Promise<NotificationListResponseDTO> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- apiClient response is `any` at the boundary
    const response = await notificationsApi.getNotifications(filters);
    return response.data as NotificationListResponseDTO;
  }

  async getUnreadCount(): Promise<UnreadCountResponseDTO> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- apiClient response is `any` at the boundary
    const response = await notificationsApi.getUnreadCount();
    return response.data as UnreadCountResponseDTO;
  }

  async getNotificationStats(): Promise<NotificationStatsDTO> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- apiClient response is `any` at the boundary
    const response = await notificationsApi.getNotificationStats();
    return response.data as NotificationStatsDTO;
  }

  async markAsRead(notificationId: string): Promise<void> {
    await notificationsApi.markAsRead(notificationId);
  }

  async markAsReadByType(type: string): Promise<void> {
    await notificationsApi.markAsReadByType(type);
  }

  async markAllAsRead(): Promise<void> {
    await notificationsApi.markAllAsRead();
  }

  async deleteNotification(notificationId: string): Promise<void> {
    await notificationsApi.deleteNotification(notificationId);
  }

  async clearAll(): Promise<void> {
    await notificationsApi.clearAll();
  }

  async deleteOld(days?: number): Promise<void> {
    await notificationsApi.deleteOld(days);
  }

  /**
   * **Admin-only.**
   * Broadcasts an update notification to all users.
   */
  async broadcastUpdate(password: string, link: string): Promise<void> {
    await notificationsApi.broadcastUpdate(password, link);
  }
}
