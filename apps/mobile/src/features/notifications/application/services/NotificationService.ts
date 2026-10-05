import { NotificationRepository } from '../../infrastructure/repository/NotificationRepository';
import { GetNotificationsUseCase } from '../useCases/GetNotificationsUseCase';
import { ManageNotificationsUseCase } from '../useCases/ManageNotificationsUseCase';
import type {
  Notification,
  NotificationFilters,
  NotificationStats,
  NotificationType,
  BroadcastPayload,
} from '../../types/notification.types';

/**
 * Application-layer service that composes `GetNotificationsUseCase` and
 * `ManageNotificationsUseCase` behind a single, stable facade.
 *
 * Consumers (hooks, screens) should depend on this service rather than
 * importing use cases directly so that the composition root is centralised.
 */
export class NotificationService {
  private readonly getUseCase: GetNotificationsUseCase;
  private readonly manageUseCase: ManageNotificationsUseCase;

  constructor(
    repository: NotificationRepository = new NotificationRepository(),
  ) {
    this.getUseCase = new GetNotificationsUseCase(repository);
    this.manageUseCase = new ManageNotificationsUseCase(repository);
  }

  // ---------------------------------------------------------------------------
  // Read operations
  // ---------------------------------------------------------------------------

  getNotifications(filters?: NotificationFilters): Promise<Notification[]> {
    return this.getUseCase.execute(filters);
  }

  getUnreadCount(): Promise<number> {
    return this.getUseCase.executeUnreadCount();
  }

  getStats(): Promise<NotificationStats> {
    return this.getUseCase.executeStats();
  }

  // ---------------------------------------------------------------------------
  // Mutation operations
  // ---------------------------------------------------------------------------

  markAsRead(id: string): Promise<void> {
    return this.manageUseCase.markAsRead(id);
  }

  markAllAsRead(): Promise<void> {
    return this.manageUseCase.markAllAsRead();
  }

  markAsReadByType(type: NotificationType): Promise<void> {
    return this.manageUseCase.markAsReadByType(type);
  }

  delete(id: string): Promise<void> {
    return this.manageUseCase.delete(id);
  }

  clearAll(): Promise<void> {
    return this.manageUseCase.clearAll();
  }

  deleteOld(days?: number): Promise<void> {
    return this.manageUseCase.deleteOld(days);
  }

  /**
   * **Admin-only.**
   * Broadcasts an update notification to all users.
   */
  broadcast(payload: BroadcastPayload): Promise<void> {
    return this.manageUseCase.broadcast(payload);
  }
}

/**
 * Pre-built singleton for use in React hooks and screens.
 * Swap this out in tests by instantiating `NotificationService` with a mock
 * `NotificationRepository`.
 */
export const notificationService = new NotificationService();
