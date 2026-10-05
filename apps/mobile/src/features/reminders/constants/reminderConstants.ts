import type {
  ReminderStatus,
  ReminderFrequency,
  ReminderType,
} from '../types/reminder.types';

// ─── Filter Pills ─────────────────────────────────────────────────────────────

export const REMINDER_FILTER_PILLS: ReadonlyArray<{
  label: string;
  value: ReminderStatus | 'all';
}> = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Paused', value: 'paused' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
] as const;

// ─── Frequency Options ────────────────────────────────────────────────────────

export const FREQUENCY_OPTIONS: ReadonlyArray<{
  label: string;
  value: ReminderFrequency;
}> = [
  { label: 'Once', value: 'once' },
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Custom Days', value: 'custom_days' },
] as const;

// ─── Reminder Type Options ────────────────────────────────────────────────────

export const REMINDER_TYPE_OPTIONS: ReadonlyArray<{
  label: string;
  value: ReminderType;
}> = [
  { label: 'Payment', value: 'payment' },
  { label: 'Settlement', value: 'settlement' },
  { label: 'Budget', value: 'budget' },
  { label: 'Custom', value: 'custom' },
] as const;

// ─── Escalation Config ────────────────────────────────────────────────────────

/** Default interval in hours between successive escalation steps. */
export const DEFAULT_ESCALATION_INTERVAL_HOURS = 24;

/** Maximum number of escalation levels before a reminder is auto-cancelled. */
export const MAX_ESCALATION_LEVEL = 5;

export const ESCALATION_CONFIG = {
  defaultIntervalHours: DEFAULT_ESCALATION_INTERVAL_HOURS,
  maxLevel: MAX_ESCALATION_LEVEL,
} as const;

// ─── Escalation Level Labels ──────────────────────────────────────────────────

export const ESCALATION_LEVELS: Record<number, string> = {
  0: 'Initial',
  1: 'First Follow-up',
  2: 'Second Follow-up',
  3: 'Third Follow-up',
  4: 'Urgent',
  5: 'Final Notice',
};

// ─── Pagination Defaults ──────────────────────────────────────────────────────

export const DEFAULT_PAGE_SIZE = 20;
export const DEFAULT_PAGE = 1;

// ─── Stale Time ───────────────────────────────────────────────────────────────

/** React Query stale time for reminder lists (15 seconds). */
export const REMINDER_STALE_TIME_MS = 15_000;

// ─── Timeline Group Labels ────────────────────────────────────────────────────

export const TIMELINE_GROUP_LABELS = {
  overdue: 'Overdue',
  today: 'Today',
  upcoming: 'Upcoming',
  completed: 'Completed',
} as const;
