import type {
  Reminder,
  ReminderFilters,
  CreateReminderPayload,
  CreateSettlementReminderPayload,
  CreateBudgetReminderPayload,
  PingUserPayload,
} from '../../types/reminder.types';
import { GetRemindersUseCase } from '../useCases/GetRemindersUseCase';
import { CreateReminderUseCase } from '../useCases/CreateReminderUseCase';
import { ManageReminderUseCase } from '../useCases/ManageReminderUseCase';
import { ReminderRepository } from '../../infrastructure/repository/ReminderRepository';

/**
 * Application-level service that composes the three use-case classes and
 * exposes a flat, ergonomic API surface for consumers (screens, other services).
 *
 * A singleton instance is exported at the bottom of this file so that the
 * default repository wiring is done once.  Consumers can instantiate their own
 * `ReminderService` for testing by passing a custom repository.
 */
export class ReminderService {
  private readonly getRemindersUseCase: GetRemindersUseCase;
  private readonly createReminderUseCase: CreateReminderUseCase;
  private readonly manageReminderUseCase: ManageReminderUseCase;

  constructor(repository: ReminderRepository = new ReminderRepository()) {
    this.getRemindersUseCase = new GetRemindersUseCase(repository);
    this.createReminderUseCase = new CreateReminderUseCase(repository);
    this.manageReminderUseCase = new ManageReminderUseCase(repository);
  }

  // ─── Read ──────────────────────────────────────────────────────────────────

  getMyReminders(filters?: ReminderFilters): Promise<Reminder[]> {
    return this.getRemindersUseCase.execute(filters);
  }

  getIncomingReminders(): Promise<Reminder[]> {
    return this.getRemindersUseCase.executeIncoming();
  }

  getTripReminders(tripId: string): Promise<Reminder[]> {
    return this.getRemindersUseCase.executeForTrip(tripId);
  }

  // ─── Create ────────────────────────────────────────────────────────────────

  createReminder(payload: CreateReminderPayload): Promise<Reminder> {
    return this.createReminderUseCase.execute(payload);
  }

  createSettlementReminder(
    payload: CreateSettlementReminderPayload,
  ): Promise<Reminder> {
    return this.createReminderUseCase.executeSettlement(payload);
  }

  createBudgetReminder(
    payload: CreateBudgetReminderPayload,
  ): Promise<Reminder> {
    return this.createReminderUseCase.executeBudget(payload);
  }

  // ─── Manage ────────────────────────────────────────────────────────────────

  pauseReminder(reminderId: string): Promise<Reminder> {
    return this.manageReminderUseCase.pause(reminderId);
  }

  resumeReminder(reminderId: string): Promise<Reminder> {
    return this.manageReminderUseCase.resume(reminderId);
  }

  cancelReminder(reminderId: string, reason?: string): Promise<void> {
    return this.manageReminderUseCase.cancel(reminderId, reason);
  }

  pingUser(payload: PingUserPayload): Promise<void> {
    return this.manageReminderUseCase.pingUser(payload);
  }
}

/** Default singleton — uses the real `ReminderRepository` → API wiring. */
export const reminderService = new ReminderService();
