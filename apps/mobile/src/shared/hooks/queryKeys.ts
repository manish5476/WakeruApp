// ============================================================
// Centralized Query Keys — prevents duplication & enables invalidation
// ============================================================

export const queryKeys = {
  // Auth & User
  auth: {
    profile: ['auth', 'profile'] as const,
  },
  users: {
    all: ['users'] as const,
    stats: ['users', 'stats'] as const,
    publicProfile: (userId: string) =>
      ['users', 'publicProfile', userId] as const,
    profile: ['users', 'profile'] as const,
  },

  // Trips
  trips: {
    all: ['trips'] as const,
    list: (filters?: Record<string, any>) =>
      ['trips', 'list', filters] as const,
    detail: (tripId: string) => ['trips', 'detail', tripId] as const,
    summary: (tripId: string) => ['trips', 'summary', tripId] as const,
    story: (tripId: string) => ['trips', 'story', tripId] as const,
    members: (tripId: string) => ['trips', 'members', tripId] as const,
    templates: ['trips', 'templates'] as const,
  },

  // Expenses
  expenses: {
    all: ['expenses'] as const,
    byStop: (stopId: string, filters?: Record<string, any>) =>
      ['expenses', 'stop', stopId, filters] as const,
    byTrip: (tripId: string, filters?: Record<string, any>) =>
      ['expenses', 'trip', tripId, filters] as const,
    mine: (filters?: Record<string, any>) =>
      ['expenses', 'mine', filters] as const,
    detail: (expenseId: string) => ['expenses', 'detail', expenseId] as const,
  },

  // Settlements
  settlements: {
    detail: (tripId: string) => ['settlements', tripId] as const,
    summary: (tripId: string) => ['settlements', 'summary', tripId] as const,
    history: (tripId: string) => ['settlements', 'history', tripId] as const,
  },

  // Notifications
  notifications: {
    all: (filters?: Record<string, any>) =>
      ['notifications', 'list', filters] as const,
    unreadCount: ['notifications', 'unreadCount'] as const,
    stats: ['notifications', 'stats'] as const,
  },

  // Reminders
  reminders: {
    all: ['reminders'] as const,
    list: (filters?: Record<string, any>) =>
      ['reminders', 'list', filters] as const,
    incoming: ['reminders', 'incoming'] as const,
    byTrip: (tripId: string) => ['reminders', 'trip', tripId] as const,
  },

  // Receipts
  receipts: {
    all: (filters?: Record<string, any>) =>
      ['receipts', 'list', filters] as const,
    byTrip: (tripId: string) => ['receipts', 'trip', tripId] as const,
    detail: (receiptId: string) => ['receipts', 'detail', receiptId] as const,
  },
} as const;
