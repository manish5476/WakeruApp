import type { Person, PersonBalance } from '../../types/person.types';

// Re-export so consumers can import from domain layer directly.
export type { Person };

// ─── Pure Domain Helpers ───────────────────────────────────────────────────────

/** Returns `true` if the person holds a premium (or higher) subscription. */
export function isPremium(person: Person): boolean {
  return (
    person.role === 'premium' ||
    person.role === 'business' ||
    person.role === 'admin'
  );
}

/**
 * Derives up-to-two capitalised initials from a display name.
 * Falls back to a single '?' when the name is empty.
 */
export function getDisplayInitials(person: Person): string {
  const name = person.displayName.trim();
  if (!name) return '?';
  const parts = name.split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Computes the net balance from a `PersonBalance` object.
 * Positive → net lender; negative → net borrower.
 */
export function getNetBalance(balance: PersonBalance): number {
  return balance.totalLent - balance.totalOwed;
}

/** Returns `true` when the person owes more than they are owed. */
export function isInDebt(balance: PersonBalance): boolean {
  return getNetBalance(balance) < 0;
}
