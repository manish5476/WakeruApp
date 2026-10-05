import type {
  PersonBalance,
  PersonRole,
  ActivityType,
} from '../../types/person.types';

// ─── Raw API shapes (use `_id` as returned by the server) ─────────────────────

/** Raw API representation of a person. */
export interface PersonAPIModel {
  _id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  avatar?: string;
  phoneNumber?: string;
  bio?: string;
  role: PersonRole;
  totalOwedAcrossTrips: number;
  totalLentAcrossTrips: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** API response shape for the profile endpoint. */
export interface PersonProfileResponseDTO {
  person: PersonAPIModel;
  balance: PersonBalance;
}

/** Raw API representation of a shared expense. */
export interface SharedExpenseAPIModel {
  _id: string;
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

/** Raw API representation of a shared trip. */
export interface SharedTripAPIModel {
  _id: string;
  title: string;
  destination?: string;
  memberCount: number;
  userBalance: number;
  status: string;
  startDate?: string;
  endDate?: string;
}

/** Raw API representation of an activity item. */
export interface ActivityItemAPIModel {
  _id: string;
  type: ActivityType;
  description: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

/** Generic paginated response envelope returned by list endpoints. */
export interface PaginatedResponseDTO<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}
