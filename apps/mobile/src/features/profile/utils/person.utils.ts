import type {
  ActivityItem,
  PersonBalance,
  SharedExpense,
} from '../types/person.types';

/**
 * Derives up-to-two capitalised initials from a display name string.
 * Returns `'?'` when the name is blank.
 *
 * @example
 * getPersonInitials('Alice Bob') // → 'AB'
 * getPersonInitials('Charlie')   // → 'C'
 */
export function getPersonInitials(displayName: string): string {
  const trimmed = displayName.trim();
  if (!trimmed) return '?';
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Formats a `PersonBalance` into a human-readable string using the ₹ symbol.
 *
 * @example
 * formatNetBalance({ totalOwed: 500, totalLent: 0,   netBalance: -500 }) // → 'Owes ₹500'
 * formatNetBalance({ totalOwed: 0,   totalLent: 500, netBalance:  500 }) // → 'Gets back ₹500'
 * formatNetBalance({ totalOwed: 0,   totalLent: 0,   netBalance:  0   }) // → 'Settled'
 */
export function formatNetBalance(balance: PersonBalance): string {
  const net = balance.netBalance;
  if (net === 0) return 'Settled';
  const abs = Math.abs(net);
  return net < 0 ? `Owes ₹${abs}` : `Gets back ₹${abs}`;
}

/**
 * Returns a new array of activities sorted by `timestamp` descending
 * (most recent first). The original array is not mutated.
 */
export function sortActivitiesByDate(
  activities: ActivityItem[],
): ActivityItem[] {
  return [...activities].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
}

/**
 * Filters a list of shared expenses by `status`.
 * When `status` is `undefined` or an empty string the full list is returned.
 */
export function filterSharedExpenses(
  expenses: SharedExpense[],
  status?: string,
): SharedExpense[] {
  if (!status) return expenses;
  return expenses.filter(e => e.status === status);
}
