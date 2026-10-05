// ─── Enumerations ─────────────────────────────────────────────────────────────

export type PersonRole = 'user' | 'premium' | 'business' | 'admin';

export type ActivityType =
  | 'expense_added'
  | 'settlement_made'
  | 'trip_joined'
  | 'trip_created'
  | 'friend_added';

// ─── Core Domain Types ─────────────────────────────────────────────────────────

/** Lean domain representation of a person — uses `id` (not `_id`). */
export interface Person {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  avatar?: string;
  phoneNumber?: string;
  bio?: string;
  role: PersonRole;
  totalOwed: number;
  totalLent: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PersonBalance {
  totalOwed: number;
  totalLent: number;
  /** Positive → net lender; negative → net borrower */
  netBalance: number;
}

export interface PersonProfile {
  person: Person;
  balance: PersonBalance;
}

// ─── Shared Expense (lightweight) ─────────────────────────────────────────────

export interface SharedExpense {
  id: string;
  title: string;
  amount: number;
  currency: string;
  paidBy: string;
  userShare: number;
  status: string;
  tripId?: string;
  tripName?: string;
  createdAt: string;
}

// ─── Shared Trip (lightweight) ─────────────────────────────────────────────────

export interface SharedTrip {
  id: string;
  title: string;
  destination?: string;
  memberCount: number;
  userBalance: number;
  status: string;
  startDate?: string;
  endDate?: string;
}

// ─── Activity ─────────────────────────────────────────────────────────────────

export interface ActivityItem {
  id: string;
  type: ActivityType;
  description: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

// ─── Settlement ───────────────────────────────────────────────────────────────

export interface SettlementOption {
  method: string;
  identifier: string;
  label: string;
  isVerified: boolean;
}

// ─── Filter / Param Types ─────────────────────────────────────────────────────

/** Mirrors `SharedExpensesParams` from the core API. */
export interface SharedExpensesFilters {
  page?: number;
  limit?: number;
  status?: string;
  category?: string;
  tripId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/** Mirrors `SharedTripsParams` from the core API. */
export interface SharedTripsFilters {
  page?: number;
  limit?: number;
}
