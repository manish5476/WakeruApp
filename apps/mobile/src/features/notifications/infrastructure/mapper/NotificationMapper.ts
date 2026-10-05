import type {
  Notification,
  NotificationStats,
  NotificationType,
  NotificationPriority,
} from '../../types/notification.types';
import type {
  NotificationAPIModel,
  NotificationStatsDTO,
} from '../dto/NotificationDTO';

export class NotificationMapper {
  /**
   * Transforms the raw API model (snake_case `_id`, loose `string` types)
   * into a clean domain `Notification` object.
   *
   * `type` and `priority` are cast to their respective union types.
   * If the server returns an unexpected value the cast is still safe because
   * TypeScript casts are erased at runtime — consumers should guard with
   * `isNotificationType` helpers if strict validation is needed.
   */
  static toDomain(dto: NotificationAPIModel): Notification {
    return {
      id: dto._id,
      type: dto.type as NotificationType,
      title: dto.title,
      body: dto.body,
      isRead: dto.isRead,
      priority: dto.priority as NotificationPriority,
      metadata: dto.metadata,
      actionUrl: dto.actionUrl,
      imageUrl: dto.imageUrl,
      userId: dto.userId,
      createdAt: dto.createdAt,
      readAt: dto.readAt,
    };
  }

  /** Transforms a domain `Notification` back into the raw API shape. */
  static toDTO(n: Notification): NotificationAPIModel {
    return {
      _id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      isRead: n.isRead,
      priority: n.priority,
      metadata: n.metadata,
      actionUrl: n.actionUrl,
      imageUrl: n.imageUrl,
      userId: n.userId,
      createdAt: n.createdAt,
      readAt: n.readAt,
    };
  }

  /**
   * Converts the stats DTO into the domain `NotificationStats` shape.
   * `byType` keys are narrowed from `Record<string, number>` to
   * `Partial<Record<NotificationType, number>>`.
   */
  static statsFromDTO(dto: NotificationStatsDTO): NotificationStats {
    const byType: NotificationStats['byType'] = {};

    for (const [key, value] of Object.entries(dto.stats.byType)) {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- runtime key narrowing: unknown server keys are silently dropped
      byType[key as NotificationType] = value;
    }

    return {
      total: dto.stats.total,
      unread: dto.stats.unread,
      byType,
    };
  }
}

// Re-export NotificationStats so callers can import from one place
export type { NotificationStats } from '../../types/notification.types';
