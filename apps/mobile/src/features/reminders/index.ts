// ─── Types ────────────────────────────────────────────────────────────────────
export type {
  ReminderType,
  ReminderStatus,
  ReminderFrequency,
  Reminder,
  CreateReminderPayload,
  CreateSettlementReminderPayload,
  CreateBudgetReminderPayload,
  PingUserPayload,
  ReminderFilters,
  TimelineGroup,
} from './types/reminder.types';

// ─── Domain Models ────────────────────────────────────────────────────────────
export {
  isActive,
  isOverdue,
  isOneTime,
  isEscalated,
  statusLabel,
  frequencyLabel,
} from './domain/models/Reminder';

// ─── Domain Repository Interface ──────────────────────────────────────────────
export type { IReminderRepository } from './domain/repositories/IReminderRepository';

// ─── Infrastructure (barrel) ──────────────────────────────────────────────────
export type { ReminderAPIModel } from './infrastructure/dto/ReminderDTO';
export { ReminderMapper } from './infrastructure/mapper/ReminderMapper';
export { ReminderRemoteDataSource } from './infrastructure/datasource/ReminderRemoteDataSource';
export { ReminderRepository } from './infrastructure/repository/ReminderRepository';

// ─── Application Use Cases ────────────────────────────────────────────────────
export { GetRemindersUseCase } from './application/useCases/GetRemindersUseCase';
export { CreateReminderUseCase } from './application/useCases/CreateReminderUseCase';
export { ManageReminderUseCase } from './application/useCases/ManageReminderUseCase';

// ─── Application Service ──────────────────────────────────────────────────────
export {
  ReminderService,
  reminderService,
} from './application/services/ReminderService';

// ─── Constants ────────────────────────────────────────────────────────────────
export {
  REMINDER_FILTER_PILLS,
  FREQUENCY_OPTIONS,
  REMINDER_TYPE_OPTIONS,
  ESCALATION_CONFIG,
  ESCALATION_LEVELS,
  DEFAULT_ESCALATION_INTERVAL_HOURS,
  MAX_ESCALATION_LEVEL,
  DEFAULT_PAGE_SIZE,
  DEFAULT_PAGE,
  REMINDER_STALE_TIME_MS,
  TIMELINE_GROUP_LABELS,
} from './constants/reminderConstants';

// ─── Utils ────────────────────────────────────────────────────────────────────
export {
  extractAmount,
  getInitials,
  getTimelineGroup,
  groupRemindersByTimeline,
  calculateCompletionRate,
  countByStatus,
} from './utils/reminder.utils';

// ─── Presentation Hooks ───────────────────────────────────────────────────────
export {
  useReminders,
  useIncomingReminders,
  useTripReminders,
  useCreateReminder,
  useCreateSettlementReminder,
  useCreateBudgetReminder,
  usePauseReminder,
  useResumeReminder,
  useCancelReminder,
  usePingUser,
} from './presentation/hooks/useReminders';
