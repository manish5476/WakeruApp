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
import { PersonRemoteDataSource } from '../datasource/PersonRemoteDataSource';
import { PersonMapper } from '../mapper/PersonMapper';

/**
 * Concrete implementation of `IPersonRepository`.
 * Delegates to `PersonRemoteDataSource` for HTTP transport and uses
 * `PersonMapper` to convert raw DTOs into domain objects.
 */
export class PersonRepository implements IPersonRepository {
  constructor(private readonly dataSource: PersonRemoteDataSource) {}

  async getProfile(userId: string): Promise<PersonProfile> {
    const dto = await this.dataSource.getProfile(userId);
    return {
      person: PersonMapper.toDomain(dto.person),
      balance: dto.balance,
    };
  }

  async getSharedExpenses(
    userId: string,
    params?: SharedExpensesFilters,
  ): Promise<PaginatedResult<SharedExpense>> {
    const dto = await this.dataSource.getSharedExpenses(userId, params);
    return {
      data: dto.data.map(PersonMapper.expenseToDomain),
      pagination: dto.pagination,
    };
  }

  async getSharedTrips(
    userId: string,
    params?: SharedTripsFilters,
  ): Promise<PaginatedResult<SharedTrip>> {
    const dto = await this.dataSource.getSharedTrips(userId, params);
    return {
      data: dto.data.map(PersonMapper.tripToDomain),
      pagination: dto.pagination,
    };
  }

  async getRecentActivity(
    userId: string,
    limit?: number,
  ): Promise<ActivityItem[]> {
    const dtos = await this.dataSource.getRecentActivity(userId, limit);
    return dtos.map(PersonMapper.activityToDomain);
  }

  async getSettlementOptions(userId: string): Promise<SettlementOption[]> {
    // Settlement options arrive as a loosely-typed array from the API;
    // we cast here because the server contract defines the shape.
    const raw = await this.dataSource.getSettlementOptions(userId);
    return raw as SettlementOption[];
  }

  async getFullDetail(userId: string): Promise<Person> {
    const dto = await this.dataSource.getFullDetail(userId);
    return PersonMapper.toDomain(dto);
  }
}
