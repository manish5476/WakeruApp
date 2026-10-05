import type { NotificationType } from '../../types/notification.types';
import { NOTIFICATION_TYPE_ICONS } from '../../constants/notificationConstants';

/** Re-export for convenience — domain consumers import from here. */
export type { Notification } from '../../types/notification.types';

import type { Notification } from '../../types/notification.types';

// ---------------------------------------------------------------------------
// Pure domain helpers — no side-effects, fully testable
// ---------------------------------------------------------------------------

/** Returns `true` when the notification has not been read yet. */
export function isUnread(n: Notification): boolean {
  return !n.isRead;
}

/** Returns `true` when priority is `high` or `critical`. */
export function isHighPriority(n: Notification): boolean {
  return n.priority === 'high' || n.priority === 'critical';
}

/** Returns `true` when the notification originates from the system or broadcast channels. */
export function isSystem(n: Notification): boolean {
  return n.type === 'system' || n.type === 'broadcast';
}

/**
 * Resolves the Feather icon name for a given notification type.
 * Falls back to `'bell'` if the type is somehow unknown.
 */
export function notificationIcon(type: NotificationType): string {
  return NOTIFICATION_TYPE_ICONS[type] ?? 'bell';
}

/**
 * Returns a display-friendly title.
 * Prefers the notification's own `title` field; falls back to a capitalised
 * version of the type string for resilience.
 */
export function displayTitle(n: Notification): string {
  if (n.title.trim().length > 0) return n.title;
  return n.type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
