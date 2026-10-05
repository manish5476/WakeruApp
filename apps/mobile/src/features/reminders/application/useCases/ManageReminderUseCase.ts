import type { IReminderRepository } from '../../domain/repositories/IReminderRepository';
import type { Reminder, PingUserPayload } from '../../types/reminder.types';

/**
 * Use case: lifecycle management of existing reminders.
 */
export class ManageReminderUseCase {
  constructor(private readonly repository: IReminderRepository) {}

  /** Pause an active reminder. */
  async pause(reminderId: string): Promise<Reminder> {
    return this.repository.pause(reminderId);
  }

  /** Resume a previously paused reminder. */
  async resume(reminderId: string): Promise<Reminder> {
    return this.repository.resume(reminderId);
  }

  /** Cancel a reminder with an optional reason. */
  async cancel(reminderId: string, reason?: string): Promise<void> {
    return this.repository.cancel(reminderId, reason);
  }

  /** Send an immediate nudge / ping to a user. */
  async pingUser(payload: PingUserPayload): Promise<void> {
    return this.repository.pingUser(payload);
  }
}
