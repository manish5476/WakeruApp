import type {
  IPersonRepository,
  PaginatedResult,
} from '../../domain/repositories/IPersonRepository';
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

/**
 * Encapsulates all Person-related application use cases.
 * Each `execute*` method maps 1-to-1 with a repository capability.
 */
export class GetPersonUseCase {
  constructor(private readonly repository: IPersonRepository) {}

  /** Fetches the profile + balance for a user. */
  execute(userId: string): Promise<PersonProfile> {
    return this.repository.getProfile(userId);
  }

  /** Fetches a paginated list of shared expenses with a user. */
  executeSharedExpenses(
    userId: string,
    params?: SharedExpensesFilters,
  ): Promise<PaginatedResult<SharedExpense>> {
    return this.repository.getSharedExpenses(userId, params);
  }

  /** Fetches a paginated list of trips shared with a user. */
  executeSharedTrips(
    userId: string,
    params?: SharedTripsFilters,
  ): Promise<PaginatedResult<SharedTrip>> {
    return this.repository.getSharedTrips(userId, params);
  }

  /** Fetches recent activity items for a user. */
  executeActivity(userId: string, limit?: number): Promise<ActivityItem[]> {
    return this.repository.getRecentActivity(userId, limit);
  }

  /** Fetches available settlement options for a user. */
  executeSettlementOptions(userId: string): Promise<SettlementOption[]> {
    return this.repository.getSettlementOptions(userId);
  }

  /** Fetches the full aggregated detail record for a user. */
  executeFullDetail(userId: string): Promise<Person> {
    return this.repository.getFullDetail(userId);
  }
}
