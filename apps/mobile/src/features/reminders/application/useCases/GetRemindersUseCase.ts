import type { IReminderRepository } from '../../domain/repositories/IReminderRepository';
import type { Reminder, ReminderFilters } from '../../types/reminder.types';

/**
 * Use case: fetch reminders in various scopes.
 */
export class GetRemindersUseCase {
  constructor(private readonly repository: IReminderRepository) {}

  /** Get the current user's own reminders, optionally filtered. */
  async execute(filters?: ReminderFilters): Promise<Reminder[]> {
    return this.repository.getMyReminders(filters);
  }

  /** Get reminders targeting the current user (incoming). */
  async executeIncoming(): Promise<Reminder[]> {
    return this.repository.getIncomingReminders();
  }

  /** Get all reminders scoped to a specific trip. */
  async executeForTrip(tripId: string): Promise<Reminder[]> {
    return this.repository.getTripReminders(tripId);
  }
}
