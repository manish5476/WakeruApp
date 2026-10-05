// ─── Primitive Union Types ────────────────────────────────────────────────────

export type ReminderType = 'payment' | 'settlement' | 'budget' | 'custom';

export type ReminderStatus = 'active' | 'paused' | 'completed' | 'cancelled';

export type ReminderFrequency =
  'once' | 'daily' | 'weekly' | 'monthly' | 'custom_days';

// ─── Domain Entity ────────────────────────────────────────────────────────────

/**
 * Clean domain representation of a Reminder.
 * No API-specific quirks (e.g. no method-shaped fields).
 */
export interface Reminder {
  id: string;
  title: string;
  message: string;
  type: ReminderType;
  status: ReminderStatus;
  frequency: ReminderFrequency;
  nextTriggerAt?: string;
  lastTriggeredAt?: string;
  dueDate?: string;
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

// ─── Payload Types ────────────────────────────────────────────────────────────

export interface CreateReminderPayload {
  targetUserId?: string;
  tripId?: string;
  type: ReminderType;
  title: string;
  message: string;
  frequency?: ReminderFrequency;
  customDays?: number;
}

export interface CreateSettlementReminderPayload {
  toUserId: string;
  amount: number;
  currency?: string;
  tripId?: string;
  expenseId?: string;
}

export interface CreateBudgetReminderPayload {
  category: string;
  spentPercent: number;
  month?: Date;
}

export interface PingUserPayload {
  targetUserId: string;
  amount: number;
  tripName: string;
  message?: string;
  expenseTitle?: string;
}

// ─── Filter / Query Types ─────────────────────────────────────────────────────

export interface ReminderFilters {
  status?: ReminderStatus;
  type?: ReminderType;
  tripId?: string;
  targetUserId?: string;
  page?: number;
  limit?: number;
}

// ─── UI / Presentation Types ──────────────────────────────────────────────────

export type TimelineGroup = 'overdue' | 'today' | 'upcoming' | 'completed';
