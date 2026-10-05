import type { Reminder } from '../../types/reminder.types';
import type { ReminderAPIModel } from '../dto/ReminderDTO';

/**
 * Bidirectional mapper between the raw API DTO and the clean domain entity.
 */
export class ReminderMapper {
  /**
   * Converts a raw API response object into a domain `Reminder`.
   */
  static toDomain(dto: ReminderAPIModel): Reminder {
    return {
      id: dto._id,
      title: dto.title,
      message: dto.message,
      type: dto.type,
      status: dto.status,
      frequency: dto.frequency,
      dueDate: dto.dueDate,
      nextTriggerAt: dto.nextTriggerAt,
      lastTriggeredAt: dto.lastTriggeredAt,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      targetUserId: dto.targetUserId,
      targetUserName: dto.targetUserName,
      tripId: dto.tripId,
      tripName: dto.tripName,
      escalationLevel: dto.escalationLevel,
      escalationInterval: dto.escalationInterval,
      channels: dto.channels,
      triggerCount: dto.triggerCount,
      cancelledAt: dto.cancelledAt,
      customDays: dto.customDays,
    };
  }

  /**
   * Converts a domain `Reminder` back into a raw API model shape.
   * Useful for optimistic updates or cache seeding.
   */
  static toDTO(reminder: Reminder): ReminderAPIModel {
    return {
      _id: reminder.id,
      title: reminder.title,
      message: reminder.message,
      type: reminder.type,
      status: reminder.status,
      frequency: reminder.frequency,
      dueDate: reminder.dueDate,
      nextTriggerAt: reminder.nextTriggerAt,
      lastTriggeredAt: reminder.lastTriggeredAt,
      createdAt: reminder.createdAt,
      updatedAt: reminder.updatedAt,
      targetUserId: reminder.targetUserId,
      targetUserName: reminder.targetUserName,
      tripId: reminder.tripId,
      tripName: reminder.tripName,
      escalationLevel: reminder.escalationLevel,
      escalationInterval: reminder.escalationInterval,
      channels: reminder.channels,
      triggerCount: reminder.triggerCount,
      cancelledAt: reminder.cancelledAt,
      customDays: reminder.customDays,
    };
  }
}
