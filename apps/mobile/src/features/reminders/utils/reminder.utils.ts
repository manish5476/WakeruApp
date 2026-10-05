import type { Reminder, TimelineGroup } from '../types/reminder.types';

// ─── String helpers ───────────────────────────────────────────────────────────

/**
 * Attempts to parse a numeric amount from the reminder title or message.
 * Returns `null` when no amount is found.
 *
 * Example: "Pay ₹1,200 to Alice" → 1200
 */
export function extractAmount(reminder: Reminder): number | null {
  const text = `${reminder.title} ${reminder.message}`;
  // Match optional currency symbols / codes followed by a number.
  const match = text.match(/[₹$€£¥]?\s*([\d,]+(?:\.\d{1,2})?)/);
  if (!match) return null;
  const parsed = parseFloat(match[1].replace(/,/g, ''));
  return isNaN(parsed) ? null : parsed;
}

/**
 * Derives initials from a display name.
 * "Alice Bob" → "AB", "Alice" → "A", "" → "?"
 */
export function getInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '?';
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ─── Timeline grouping ────────────────────────────────────────────────────────

/**
 * Assigns a `TimelineGroup` to a reminder based on its next trigger date and
 * current status.
 */
export function getTimelineGroup(reminder: Reminder): TimelineGroup {
  if (reminder.status === 'completed' || reminder.status === 'cancelled') {
    return 'completed';
  }

  if (!reminder.nextTriggerAt) {
    return 'upcoming';
  }

  const trigger = new Date(reminder.nextTriggerAt);
  const now = new Date();

  if (trigger < now) {
    return 'overdue';
  }

  // "Today" = same calendar date as now in local time.
  const isToday =
    trigger.getFullYear() === now.getFullYear() &&
    trigger.getMonth() === now.getMonth() &&
    trigger.getDate() === now.getDate();

  return isToday ? 'today' : 'upcoming';
}

/**
 * Groups an array of reminders into a `Record<TimelineGroup, Reminder[]>`.
 * Groups are always present (possibly empty arrays) for predictable rendering.
 */
export function groupRemindersByTimeline(
  reminders: Reminder[],
): Record<TimelineGroup, Reminder[]> {
  const groups: Record<TimelineGroup, Reminder[]> = {
    overdue: [],
    today: [],
    upcoming: [],
    completed: [],
  };

  for (const reminder of reminders) {
    groups[getTimelineGroup(reminder)].push(reminder);
  }

  return groups;
}

// ─── Stats ────────────────────────────────────────────────────────────────────

/**
 * Calculates the percentage of reminders that are in a `completed` status.
 * Returns `0` for an empty array.
 */
export function calculateCompletionRate(reminders: Reminder[]): number {
  if (reminders.length === 0) return 0;
  const completed = reminders.filter(r => r.status === 'completed').length;
  return Math.round((completed / reminders.length) * 100);
}

/**
 * Counts reminders by status.
 */
export function countByStatus(
  reminders: Reminder[],
): Record<Reminder['status'], number> {
  return reminders.reduce<Record<Reminder['status'], number>>(
    (acc, r) => {
      acc[r.status] += 1;
      return acc;
    },
    { active: 0, paused: 0, completed: 0, cancelled: 0 },
  );
}
