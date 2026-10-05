import type {
  ActivityItem,
  Person,
  PersonProfile,
  SettlementOption,
  SharedExpense,
  SharedExpensesFilters,
  SharedTrip,
  SharedTripsFilters,
} from '../../types/person.types';

/** Paginated result envelope used by list-based repository methods. */
export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

/**
 * Port (interface) for the Person repository.
 * The infrastructure layer provides the concrete implementation.
 */
export interface IPersonRepository {
  /** Fetches the combined profile + balance for a user. */
  getProfile(userId: string): Promise<PersonProfile>;

  /** Fetches expenses shared between the current user and `userId`. */
  getSharedExpenses(
    userId: string,
    params?: SharedExpensesFilters,
  ): Promise<PaginatedResult<SharedExpense>>;

  /** Fetches trips shared between the current user and `userId`. */
  getSharedTrips(
    userId: string,
    params?: SharedTripsFilters,
  ): Promise<PaginatedResult<SharedTrip>>;

  /** Fetches recent activity for `userId`. */
  getRecentActivity(userId: string, limit?: number): Promise<ActivityItem[]>;

  /** Fetches available settlement options for `userId`. */
  getSettlementOptions(userId: string): Promise<SettlementOption[]>;

  /**
   * Fetches the full detail payload for `userId`.
   * Returns the raw aggregated object from the API — typed as `Person` for now;
   * extend to a richer type when the API contract is formalised.
   */
  getFullDetail(userId: string): Promise<Person>;
}
