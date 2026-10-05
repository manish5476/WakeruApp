import { remindersApi } from '../../../../core/api/services/reminders.api';
import type { ReminderAPIModel } from '../dto/ReminderDTO';
import type {
  CreateReminderPayload,
  CreateSettlementReminderPayload,
  CreateBudgetReminderPayload,
  PingUserPayload,
  ReminderFilters,
} from '../../types/reminder.types';

/**
 * Thin wrapper around the raw `remindersApi` Axios calls.
 * Responsible only for network I/O; mapping happens in the repository layer.
 */
export class ReminderRemoteDataSource {
  async getMyReminders(filters?: ReminderFilters): Promise<ReminderAPIModel[]> {
    const response = await remindersApi.getMyReminders(filters);
    return (response.data?.reminders ?? []) as ReminderAPIModel[];
  }

  async getIncomingReminders(): Promise<ReminderAPIModel[]> {
    const response = await remindersApi.getIncomingReminders();
    return (response.data?.reminders ?? []) as ReminderAPIModel[];
  }

  async getTripReminders(tripId: string): Promise<ReminderAPIModel[]> {
    const response = await remindersApi.getTripReminders(tripId);
    return (response.data?.reminders ?? []) as ReminderAPIModel[];
  }

  async create(payload: CreateReminderPayload): Promise<ReminderAPIModel> {
    const response = await remindersApi.create(payload);
    return response.data?.reminder as ReminderAPIModel;
  }

  async createSettlement(
    payload: CreateSettlementReminderPayload,
  ): Promise<ReminderAPIModel> {
    const response = await remindersApi.createSettlementReminder(payload);
    return response.data?.reminder as ReminderAPIModel;
  }

  async createBudget(
    payload: CreateBudgetReminderPayload,
  ): Promise<ReminderAPIModel> {
    const response = await remindersApi.createBudgetReminder(payload);
    return response.data?.reminder as ReminderAPIModel;
  }

  async pause(reminderId: string): Promise<ReminderAPIModel> {
    const response = await remindersApi.pause(reminderId);
    return response.data?.reminder as ReminderAPIModel;
  }

  async resume(reminderId: string): Promise<ReminderAPIModel> {
    const response = await remindersApi.resume(reminderId);
    return response.data?.reminder as ReminderAPIModel;
  }

  async cancel(reminderId: string, reason?: string): Promise<void> {
    await remindersApi.cancel(reminderId, reason);
  }

  async pingUser(payload: PingUserPayload): Promise<void> {
    await remindersApi.pingUser(payload);
  }
}
