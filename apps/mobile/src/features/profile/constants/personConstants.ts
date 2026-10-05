import type { ActivityType, PersonRole } from '../types/person.types';

// ─── Label Maps ───────────────────────────────────────────────────────────────

export const PERSON_ROLE_LABELS: Record<PersonRole, string> = {
  user: 'User',
  premium: 'Premium',
  business: 'Business',
  admin: 'Admin',
};

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  expense_added: 'Expense Added',
  settlement_made: 'Settlement Made',
  trip_joined: 'Trip Joined',
  trip_created: 'Trip Created',
  friend_added: 'Friend Added',
};

// ─── Cache / Stale-Time Settings ─────────────────────────────────────────────

/** React Query stale time for profile data (1 minute). */
export const PERSON_PROFILE_STALE_TIME_MS = 60_000;

/** React Query stale time for activity data (30 seconds). */
export const PERSON_ACTIVITY_STALE_TIME_MS = 30_000;

// ─── Pagination Defaults ──────────────────────────────────────────────────────

export const DEFAULT_ACTIVITY_LIMIT = 10;
export const DEFAULT_SHARED_EXPENSES_PAGE_SIZE = 50;
export const DEFAULT_SHARED_TRIPS_PAGE_SIZE = 10;
