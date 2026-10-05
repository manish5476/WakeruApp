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
      filters && Object.keys(filters).length > 0
        ? (['trips', 'list', filters] as const)
        : (['trips', 'list'] as const),
    latest: ['trips', 'latest'] as const,
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
      filters && Object.keys(filters).length > 0
        ? (['expenses', 'stop', stopId, filters] as const)
        : (['expenses', 'stop', stopId] as const),
    byTrip: (tripId: string, filters?: Record<string, any>) =>
      filters && Object.keys(filters).length > 0
        ? (['expenses', 'trip', tripId, filters] as const)
        : (['expenses', 'trip', tripId] as const),
    mine: (filters?: Record<string, any>) =>
      filters && Object.keys(filters).length > 0
        ? (['expenses', 'mine', filters] as const)
        : (['expenses', 'mine'] as const),
    detail: (expenseId: string) => ['expenses', 'detail', expenseId] as const,
  },

  // Settlements
  settlements: {
    detail: (tripId: string) => ['settlements', tripId] as const,
    summary: (tripId: string) => ['settlements', 'summary', tripId] as const,
    history: (tripId: string) => ['settlements', 'history', tripId] as const,
    mine: ['settlements', 'mine'] as const,
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

  // Invitations
  invitations: {
    all: ['invitations'] as const,
    pending: ['invitations', 'pending'] as const,
    sent: ['invitations', 'sent'] as const,
  },

  // Finance
  finance: {
    overview: (month?: string) =>
      ['finance', 'overview', month ?? 'current'] as const,
    dashboard: (month?: string) =>
      ['finance', 'dashboard', month ?? 'current'] as const,
  },

  // Wakeru Local Discovery & Bounded Context
  local: {
    all: ['local'] as const,
    nearby: (params?: Record<string, any>) =>
      ['local', 'nearby', params] as const,
    destination: (params?: Record<string, any>) =>
      ['local', 'destination', params] as const,
    compare: (ids: string) => ['local', 'compare', ids] as const,
    business: (id: string) => ['local', 'business', id] as const,
    services: (businessId: string) =>
      ['local', 'business', businessId, 'services'] as const,
    offers: (businessId: string) =>
      ['local', 'business', businessId, 'offers'] as const,
    reviews: (businessId: string) =>
      ['local', 'business', businessId, 'reviews'] as const,
    reviewsSummary: (businessId: string) =>
      ['local', 'business', businessId, 'reviewsSummary'] as const,
    travelerBookings: ['local', 'traveler', 'bookings'] as const,
    travelerBookingDetail: (id: string) =>
      ['local', 'traveler', 'booking', id] as const,
    travelerReservationDetail: (id: string) =>
      ['local', 'traveler', 'reservation', id] as const,
    eligibleCampaigns: (params?: Record<string, any>) =>
      ['local', 'campaigns', 'eligible', params] as const,
    masterCategories: ['local', 'master', 'categories'] as const,
    masterAmenities: (category?: string) =>
      ['local', 'master', 'amenities', category] as const,
    masterDestinations: ['local', 'master', 'destinations'] as const,
    serviceTypes: (category: string) =>
      ['local', 'services', 'types', category] as const,

    // Vendor Portal
    vendorProfile: ['local', 'vendor', 'me'] as const,
    vendorBusinesses: ['local', 'vendor', 'businesses'] as const,
    vendorBusiness: (id: string) =>
      ['local', 'vendor', 'business', id] as const,
    vendorOverview: (id: string) =>
      ['local', 'vendor', 'business', id, 'overview'] as const,
    vendorCompleteness: (id: string) =>
      ['local', 'vendor', 'business', id, 'completeness'] as const,
    vendorMedia: (businessId: string) =>
      ['local', 'vendor', 'business', businessId, 'media'] as const,
    vendorOffers: (businessId: string) =>
      ['local', 'vendor', 'business', businessId, 'offers'] as const,
    vendorServices: (businessId: string) =>
      ['local', 'vendor', 'business', businessId, 'services'] as const,
    vendorLeads: (businessId: string) =>
      ['local', 'vendor', 'business', businessId, 'leads'] as const,
    vendorBookings: (businessId: string) =>
      ['local', 'vendor', 'business', businessId, 'bookings'] as const,
    vendorReservations: (businessId: string) =>
      ['local', 'vendor', 'business', businessId, 'reservations'] as const,
    vendorReviews: (businessId: string) =>
      ['local', 'vendor', 'business', businessId, 'reviews'] as const,
    vendorCampaigns: (businessId: string) =>
      ['local', 'vendor', 'business', businessId, 'campaigns'] as const,
    vendorAnalytics: (businessId: string, timeframe?: string) =>
      [
        'local',
        'vendor',
        'business',
        businessId,
        'analytics',
        timeframe,
      ] as const,

    // Admin Operational
    adminBusinesses: (page?: number) =>
      ['local', 'admin', 'businesses', page] as const,
    adminBusiness: (id: string) => ['local', 'admin', 'business', id] as const,
    adminMediaQueue: ['local', 'admin', 'media'] as const,
    adminReviewReports: ['local', 'admin', 'review-reports'] as const,
    adminVendors: (page?: number) =>
      ['local', 'admin', 'vendors', page] as const,
    adminBookingQueue: ['local', 'admin', 'booking-queue'] as const,
    adminReservations: ['local', 'admin', 'reservations'] as const,
    adminCampaigns: ['local', 'admin', 'campaigns'] as const,
    adminAuditLogs: (page?: number) =>
      ['local', 'admin', 'audit-logs', page] as const,
    adminDemandInsights: ['local', 'admin', 'demand-insights'] as const,
  },
} as const;
