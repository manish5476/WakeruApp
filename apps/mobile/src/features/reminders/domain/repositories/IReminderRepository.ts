import type {
  Reminder,
  ReminderFilters,
  CreateReminderPayload,
  CreateSettlementReminderPayload,
  CreateBudgetReminderPayload,
  PingUserPayload,
} from '../../types/reminder.types';

/**
 * Port / contract that any reminder data source must satisfy.
 * Concrete implementations live in infrastructure/repository/.
 */
export interface IReminderRepository {
  /** Fetch the current user's own reminders, optionally filtered. */
  getMyReminders(filters?: ReminderFilters): Promise<Reminder[]>;

  /** Fetch reminders targeting the current user (incoming). */
  getIncomingReminders(): Promise<Reminder[]>;

  /** Fetch all reminders associated with a specific trip. */
  getTripReminders(tripId: string): Promise<Reminder[]>;

  /** Create a generic reminder. */
  create(payload: CreateReminderPayload): Promise<Reminder>;

  /** Create a settlement-specific reminder. */
  createSettlement(payload: CreateSettlementReminderPayload): Promise<Reminder>;

  /** Create a budget-alert reminder. */
  createBudget(payload: CreateBudgetReminderPayload): Promise<Reminder>;

  /** Pause an active reminder. */
  pause(reminderId: string): Promise<Reminder>;

  /** Resume a paused reminder. */
  resume(reminderId: string): Promise<Reminder>;

  /** Cancel a reminder, optionally with a reason. */
  cancel(reminderId: string, reason?: string): Promise<void>;

  /** Send an immediate ping / nudge to a target user. */
  pingUser(payload: PingUserPayload): Promise<void>;
}
