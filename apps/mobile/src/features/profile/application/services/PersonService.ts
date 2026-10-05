import { GetPersonUseCase } from '../useCases/GetPersonUseCase';
import { PersonRemoteDataSource } from '../../infrastructure/datasource/PersonRemoteDataSource';
import { PersonRepository } from '../../infrastructure/repository/PersonRepository';
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
import type { PaginatedResult } from '../../domain/repositories/IPersonRepository';

/**
 * Application service that composes the full Person feature stack.
 * Exposes a clean, method-based API to presentation layer consumers
 * (screens, hooks) without leaking infrastructure details.
 */
export class PersonService {
  private readonly useCase: GetPersonUseCase;

  constructor() {
    const dataSource = new PersonRemoteDataSource();
    const repository = new PersonRepository(dataSource);
    this.useCase = new GetPersonUseCase(repository);
  }

  getProfile(userId: string): Promise<PersonProfile> {
    return this.useCase.execute(userId);
  }

  getSharedExpenses(
    userId: string,
    params?: SharedExpensesFilters,
  ): Promise<PaginatedResult<SharedExpense>> {
    return this.useCase.executeSharedExpenses(userId, params);
  }

  getSharedTrips(
    userId: string,
    params?: SharedTripsFilters,
  ): Promise<PaginatedResult<SharedTrip>> {
    return this.useCase.executeSharedTrips(userId, params);
  }

  getRecentActivity(userId: string, limit?: number): Promise<ActivityItem[]> {
    return this.useCase.executeActivity(userId, limit);
  }

  getSettlementOptions(userId: string): Promise<SettlementOption[]> {
    return this.useCase.executeSettlementOptions(userId);
  }

  getFullDetail(userId: string): Promise<Person> {
    return this.useCase.executeFullDetail(userId);
  }
}

/** Singleton instance for use throughout the application. */
export const personService = new PersonService();
