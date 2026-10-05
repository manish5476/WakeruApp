import type { IReminderRepository } from '../../domain/repositories/IReminderRepository';
import type {
  Reminder,
  CreateReminderPayload,
  CreateSettlementReminderPayload,
  CreateBudgetReminderPayload,
} from '../../types/reminder.types';

/**
 * Use case: create reminders of different types.
 */
export class CreateReminderUseCase {
  constructor(private readonly repository: IReminderRepository) {}

  /** Create a generic (payment / custom) reminder. */
  async execute(payload: CreateReminderPayload): Promise<Reminder> {
    return this.repository.create(payload);
  }

  /** Create a settlement-specific reminder. */
  async executeSettlement(
    payload: CreateSettlementReminderPayload,
  ): Promise<Reminder> {
    return this.repository.createSettlement(payload);
  }

  /** Create a budget-alert reminder. */
  async executeBudget(payload: CreateBudgetReminderPayload): Promise<Reminder> {
    return this.repository.createBudget(payload);
  }
}
