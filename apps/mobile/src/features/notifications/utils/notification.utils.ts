import type {
  Notification,
  NotificationPriority,
  NotificationType,
} from '../types/notification.types';

// ---------------------------------------------------------------------------
// Grouping
// ---------------------------------------------------------------------------

type DateGroup = 'Today' | 'Yesterday' | 'This Week' | 'Older';

/**
 * Groups an array of notifications into labelled date buckets.
 * Buckets are mutually exclusive and ordered: Today → Yesterday → This Week → Older.
 */
export function groupNotificationsByDate(
  notifications: Notification[],
): Record<DateGroup, Notification[]> {
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - 7);

  const groups: Record<DateGroup, Notification[]> = {
    Today: [],
    Yesterday: [],
    'This Week': [],
    Older: [],
  };

  for (const n of notifications) {
    const d = new Date(n.createdAt);
    if (d >= startOfToday) {
      groups.Today.push(n);
    } else if (d >= startOfYesterday) {
      groups.Yesterday.push(n);
    } else if (d >= startOfWeek) {
      groups['This Week'].push(n);
    } else {
      groups.Older.push(n);
    }
  }

  return groups;
}

// ---------------------------------------------------------------------------
// Counting
// ---------------------------------------------------------------------------

/** Returns the number of unread notifications in the provided array. */
export function countUnread(notifications: Notification[]): number {
  return notifications.filter(n => !n.isRead).length;
}

// ---------------------------------------------------------------------------
// Sorting
// ---------------------------------------------------------------------------

/**
 * Returns a new array sorted by `createdAt` descending (newest first).
 * Does not mutate the original array.
 */
export function sortByDate(notifications: Notification[]): Notification[] {
  return [...notifications].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

// ---------------------------------------------------------------------------
// Filtering
// ---------------------------------------------------------------------------

/** Returns only the notifications that match the given type. */
export function filterByType(
  notifications: Notification[],
  type: NotificationType,
): Notification[] {
  return notifications.filter(n => n.type === type);
}

// ---------------------------------------------------------------------------
// Colour resolution
// ---------------------------------------------------------------------------

/** Maps a priority level to a hex colour string for UI rendering. */
export function getNotificationColor(priority: NotificationPriority): string {
  const colours: Record<NotificationPriority, string> = {
    low: '#6B7280', // grey-500
    medium: '#3B82F6', // blue-500
    high: '#F59E0B', // amber-500
    critical: '#EF4444', // red-500
  };
  return colours[priority];
}
