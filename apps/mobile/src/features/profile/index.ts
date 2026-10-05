// ─── Types ────────────────────────────────────────────────────────────────────
export type {
  ActivityItem,
  ActivityType,
  Person,
  PersonBalance,
  PersonProfile,
  PersonRole,
  SettlementOption,
  SharedExpense,
  SharedExpensesFilters,
  SharedTrip,
  SharedTripsFilters,
} from './types/person.types';

// ─── Domain ───────────────────────────────────────────────────────────────────
export {
  getDisplayInitials,
  getNetBalance,
  isInDebt,
  isPremium,
} from './domain/models/Person';

export type {
  IPersonRepository,
  PaginatedResult,
} from './domain/repositories/IPersonRepository';

// ─── Infrastructure ───────────────────────────────────────────────────────────
export {
  PersonMapper,
  PersonRemoteDataSource,
  PersonRepository,
} from './infrastructure';

export type {
  ActivityItemAPIModel,
  PaginatedResponseDTO,
  PersonAPIModel,
  PersonProfileResponseDTO,
  SharedExpenseAPIModel,
  SharedTripAPIModel,
} from './infrastructure';

// ─── Application ─────────────────────────────────────────────────────────────
export { GetPersonUseCase } from './application/useCases/GetPersonUseCase';
export {
  PersonService,
  personService,
} from './application/services/PersonService';

// ─── Constants ────────────────────────────────────────────────────────────────
export {
  ACTIVITY_TYPE_LABELS,
  DEFAULT_ACTIVITY_LIMIT,
  DEFAULT_SHARED_EXPENSES_PAGE_SIZE,
  DEFAULT_SHARED_TRIPS_PAGE_SIZE,
  PERSON_ACTIVITY_STALE_TIME_MS,
  PERSON_PROFILE_STALE_TIME_MS,
  PERSON_ROLE_LABELS,
} from './constants/personConstants';

// ─── Utils ────────────────────────────────────────────────────────────────────
export {
  filterSharedExpenses,
  formatNetBalance,
  getPersonInitials,
  sortActivitiesByDate,
} from './utils/person.utils';

// ─── Hooks (presentation layer) ───────────────────────────────────────────────
export {
  usePersonActivity,
  usePersonFullDetail,
  usePersonProfile,
  useSettlementOptions,
  useSharedExpenses,
  useSharedTrips,
} from './presentation/hooks/usePerson';
