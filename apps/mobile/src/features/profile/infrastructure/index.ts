// ─── DTOs ─────────────────────────────────────────────────────────────────────
export type {
  ActivityItemAPIModel,
  PaginatedResponseDTO,
  PersonAPIModel,
  PersonProfileResponseDTO,
  SharedExpenseAPIModel,
  SharedTripAPIModel,
} from './dto/PersonDTO';

// ─── Mapper ───────────────────────────────────────────────────────────────────
export { PersonMapper } from './mapper/PersonMapper';

// ─── Data Source ──────────────────────────────────────────────────────────────
export { PersonRemoteDataSource } from './datasource/PersonRemoteDataSource';

// ─── Repository ───────────────────────────────────────────────────────────────
export { PersonRepository } from './repository/PersonRepository';
