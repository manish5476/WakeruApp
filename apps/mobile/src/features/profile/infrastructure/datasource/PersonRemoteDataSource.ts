import { personApi } from '../../../../core/api/services/person.api';
import type {
  ActivityItemAPIModel,
  PaginatedResponseDTO,
  PersonAPIModel,
  PersonProfileResponseDTO,
  SharedExpenseAPIModel,
  SharedTripAPIModel,
} from '../dto/PersonDTO';
import type {
  SharedExpensesFilters,
  SharedTripsFilters,
} from '../../types/person.types';

/**
 * Remote data source that wraps the raw `personApi` client and returns typed DTOs.
 * Any HTTP-level concerns (auth headers, retries) are handled by the underlying
 * `apiClient` — this class only adds type safety.
 */
export class PersonRemoteDataSource {
  /**
   * Fetches the combined profile + balance for a user.
   * The response is cast to `PersonProfileResponseDTO` — justified because the
   * shape is determined by the server contract and validated end-to-end.
   */
  async getProfile(userId: string): Promise<PersonProfileResponseDTO> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- API boundary: response shape is server-defined
    const response = (await personApi.getPersonProfile(userId)) as any;
    return response.data as PersonProfileResponseDTO;
  }

  /**
   * Fetches the raw person detail (non-profile variant).
   */
  async getPersonDetail(userId: string): Promise<PersonAPIModel> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- API boundary
    const response = (await personApi.getPersonDetail(userId)) as any;
    return response.data as PersonAPIModel;
  }

  /**
   * Fetches a paginated list of expenses shared with `userId`.
   */
  async getSharedExpenses(
    userId: string,
    params?: SharedExpensesFilters,
  ): Promise<PaginatedResponseDTO<SharedExpenseAPIModel>> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- API boundary
    const response = (await personApi.getSharedExpenses(userId, params)) as any;
    return response.data as PaginatedResponseDTO<SharedExpenseAPIModel>;
  }

  /**
   * Fetches a paginated list of trips shared with `userId`.
   */
  async getSharedTrips(
    userId: string,
    params?: SharedTripsFilters,
  ): Promise<PaginatedResponseDTO<SharedTripAPIModel>> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- API boundary
    const response = (await personApi.getSharedTrips(userId, params)) as any;
    return response.data as PaginatedResponseDTO<SharedTripAPIModel>;
  }

  /**
   * Fetches recent activity items for `userId`.
   */
  async getRecentActivity(
    userId: string,
    limit: number = 10,
  ): Promise<ActivityItemAPIModel[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- API boundary
    const response = (await personApi.getRecentActivity(userId, limit)) as any;
    return response.data as ActivityItemAPIModel[];
  }

  /**
   * Fetches settlement options available for `userId`.
   */
  async getSettlementOptions(userId: string): Promise<unknown[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- API boundary: settlement shape TBD
    const response = (await personApi.getSettlementOptions(userId)) as any;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- API boundary
    return response.data as unknown[];
  }

  /**
   * Fetches the full aggregated detail record for `userId`.
   */
  async getFullDetail(userId: string): Promise<PersonAPIModel> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- API boundary
    const response = (await personApi.getFullDetail(userId)) as any;
    return response.data as PersonAPIModel;
  }
}
