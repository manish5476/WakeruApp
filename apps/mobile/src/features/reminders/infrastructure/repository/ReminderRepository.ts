import type { IReminderRepository } from '../../domain/repositories/IReminderRepository';
import type {
  Reminder,
  ReminderFilters,
  CreateReminderPayload,
  CreateSettlementReminderPayload,
  CreateBudgetReminderPayload,
  PingUserPayload,
} from '../../types/reminder.types';
import { ReminderRemoteDataSource } from '../datasource/ReminderRemoteDataSource';
import { ReminderMapper } from '../mapper/ReminderMapper';

/**
 * Concrete implementation of `IReminderRepository`.
 * Delegates network calls to `ReminderRemoteDataSource` and converts raw DTOs
 * to domain entities via `ReminderMapper`.
 */
export class ReminderRepository implements IReminderRepository {
  private readonly dataSource: ReminderRemoteDataSource;

  constructor(
    dataSource: ReminderRemoteDataSource = new ReminderRemoteDataSource(),
  ) {
    this.dataSource = dataSource;
  }

  async getMyReminders(filters?: ReminderFilters): Promise<Reminder[]> {
    const dtos = await this.dataSource.getMyReminders(filters);
    return dtos.map(ReminderMapper.toDomain);
  }

  async getIncomingReminders(): Promise<Reminder[]> {
    const dtos = await this.dataSource.getIncomingReminders();
    return dtos.map(ReminderMapper.toDomain);
  }

  async getTripReminders(tripId: string): Promise<Reminder[]> {
    const dtos = await this.dataSource.getTripReminders(tripId);
    return dtos.map(ReminderMapper.toDomain);
  }

  async create(payload: CreateReminderPayload): Promise<Reminder> {
    const dto = await this.dataSource.create(payload);
    return ReminderMapper.toDomain(dto);
  }

  async createSettlement(
    payload: CreateSettlementReminderPayload,
  ): Promise<Reminder> {
    const dto = await this.dataSource.createSettlement(payload);
    return ReminderMapper.toDomain(dto);
  }

  async createBudget(payload: CreateBudgetReminderPayload): Promise<Reminder> {
    const dto = await this.dataSource.createBudget(payload);
    return ReminderMapper.toDomain(dto);
  }

  async pause(reminderId: string): Promise<Reminder> {
    const dto = await this.dataSource.pause(reminderId);
    return ReminderMapper.toDomain(dto);
  }

  async resume(reminderId: string): Promise<Reminder> {
    const dto = await this.dataSource.resume(reminderId);
    return ReminderMapper.toDomain(dto);
  }

  async cancel(reminderId: string, reason?: string): Promise<void> {
    await this.dataSource.cancel(reminderId, reason);
  }

  async pingUser(payload: PingUserPayload): Promise<void> {
    await this.dataSource.pingUser(payload);
  }
}
