import type {
  Reminder,
  ReminderStatus,
  ReminderFrequency,
} from '../../types/reminder.types';

// Re-export the domain entity so consumers import from here.
export type { Reminder };

// ─── Value-Object Helpers ─────────────────────────────────────────────────────

/**
 * Returns `true` when the reminder is currently active and not paused/cancelled.
 */
export function isActive(reminder: Reminder): boolean {
  return reminder.status === 'active';
}

/**
 * Returns `true` when the next trigger date is in the past and the reminder
 * is still in an actionable state.
 */
export function isOverdue(reminder: Reminder): boolean {
  if (!reminder.nextTriggerAt) return false;
  if (reminder.status === 'completed' || reminder.status === 'cancelled') {
    return false;
  }
  return new Date(reminder.nextTriggerAt) < new Date();
}

/**
 * Returns `true` when the reminder fires only once.
 */
export function isOneTime(reminder: Reminder): boolean {
  return reminder.frequency === 'once';
}

/**
 * Returns `true` when the reminder has been escalated at least once.
 */
export function isEscalated(reminder: Reminder): boolean {
  return reminder.escalationLevel > 0;
}

/**
 * Human-readable label for a reminder status.
 */
export function statusLabel(status: ReminderStatus): string {
  const labels: Record<ReminderStatus, string> = {
    active: 'Active',
    paused: 'Paused',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };
  return labels[status];
}

/**
 * Human-readable label for a reminder frequency.
 */
export function frequencyLabel(frequency: ReminderFrequency): string {
  const labels: Record<ReminderFrequency, string> = {
    once: 'Once',
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    custom_days: 'Custom',
  };
  return labels[frequency];
}
