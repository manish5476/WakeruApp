// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type {
  Notification,
  NotificationType,
  NotificationPriority,
  NotificationStats,
  NotificationFilters,
  BroadcastPayload,
} from './types/notification.types';

// ---------------------------------------------------------------------------
// Domain — models & helpers
// ---------------------------------------------------------------------------
export {
  isUnread,
  isHighPriority,
  isSystem,
  notificationIcon,
  displayTitle,
} from './domain/models/Notification';

// Domain repository interface (useful for testing / DI)
export type { INotificationRepository } from './domain/repositories/INotificationRepository';

// ---------------------------------------------------------------------------
// Infrastructure
// ---------------------------------------------------------------------------
export type {
  NotificationAPIModel,
  NotificationListResponseDTO,
  NotificationStatsDTO,
  UnreadCountResponseDTO,
} from './infrastructure/index';
export {
  NotificationMapper,
  NotificationRemoteDataSource,
  NotificationRepository,
} from './infrastructure/index';

// ---------------------------------------------------------------------------
// Application — use cases
// ---------------------------------------------------------------------------
export { GetNotificationsUseCase } from './application/useCases/GetNotificationsUseCase';
export { ManageNotificationsUseCase } from './application/useCases/ManageNotificationsUseCase';

// ---------------------------------------------------------------------------
// Application — service
// ---------------------------------------------------------------------------
export {
  NotificationService,
  notificationService,
} from './application/services/NotificationService';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
export {
  NOTIFICATION_TYPE_LABELS,
  NOTIFICATION_TYPE_ICONS,
  NOTIFICATION_PRIORITY_LABELS,
  NOTIFICATION_STALE_TIME_MS,
  UNREAD_COUNT_STALE_TIME_MS,
  DEFAULT_NOTIFICATION_PAGE_SIZE,
  DEFAULT_DELETE_OLD_DAYS,
} from './constants/notificationConstants';

// ---------------------------------------------------------------------------
// Utils
// ---------------------------------------------------------------------------
export {
  groupNotificationsByDate,
  countUnread,
  sortByDate,
  filterByType,
  getNotificationColor,
} from './utils/notification.utils';

// ---------------------------------------------------------------------------
// Presentation — hooks
// (useNotifications.ts is the source of truth — re-exported for external consumers)
// ---------------------------------------------------------------------------
export {
  useNotifications,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllAsRead,
  useDeleteNotification,
  useClearAllNotifications,
  useNotificationStats,
  useMarkAsReadByType,
  useDeleteOldNotifications,
} from './presentation/hooks/useNotifications';
