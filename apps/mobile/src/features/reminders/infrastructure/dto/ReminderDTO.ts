/**
 * Raw shape of a Reminder as returned by the REST API.
 *
 * Note: the original `utils/reminder.utils.ts` had an erroneous method
 * signature `dueDate(dueDate: any): unknown` — corrected here to the plain
 * optional string field it should always have been.
 */
export interface ReminderAPIModel {
  _id: string;
  title: string;
  message: string;
  type: 'payment' | 'settlement' | 'budget' | 'custom';
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  frequency: 'once' | 'daily' | 'weekly' | 'monthly' | 'custom_days';
  dueDate?: string;
  nextTriggerAt?: string;
  lastTriggeredAt?: string;
  createdAt: string;
  updatedAt: string;
  targetUserId?: string;
  targetUserName?: string;
  tripId?: string;
  tripName?: string;
  escalationLevel: number;
  escalationInterval: number;
  channels?: string[];
  triggerCount: number;
  cancelledAt?: string;
  customDays?: number;
}

/** Shape of the paginated list response from GET /reminders */
export interface ReminderListResponseDTO {
  reminders: ReminderAPIModel[];
  total?: number;
  page?: number;
  limit?: number;
}

/** Shape of a single reminder response (create / pause / resume). */
export interface ReminderResponseDTO {
  reminder: ReminderAPIModel;
}
