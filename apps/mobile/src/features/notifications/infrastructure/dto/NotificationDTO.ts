/**
 * Raw API shapes returned by the notifications backend.
 * These types intentionally mirror the server response and
 * are distinct from the clean domain `Notification` model.
 */

export interface NotificationAPIModel {
  /** MongoDB document id — mapped to `id` in the domain layer. */
  _id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  priority: string;
  metadata?: Record<string, unknown>;
  actionUrl?: string;
  imageUrl?: string;
  userId: string;
  createdAt: string;
  readAt?: string;
}

export interface NotificationListResponseDTO {
  notifications: NotificationAPIModel[];
  total?: number;
  unread?: number;
}

export interface NotificationStatsDTO {
  stats: {
    total: number;
    unread: number;
    byType: Record<string, number>;
  };
}

export interface UnreadCountResponseDTO {
  unreadCount: number;
}
