// src/services/ads/adConfig.ts
// Centralized Ad & Placement Configuration for TripSplit / Wakeru

export type AdPlacementId =
  | 'analytics'
  | 'dashboard'
  | 'finance'
  | 'planner'
  | 'trip_summary'
  | 'trip_details'
  | 'post_trip_create'
  | 'notifications'
  | 'travelPaid';

export type AdFormat =
  'banner' | 'interstitial' | 'rewarded' | 'native_card' | 'contextual_travel';

export interface PlacementConfig {
  id: AdPlacementId;
  enabled: boolean;
  screen: string;
  format: AdFormat;
  cooldownMs: number;
  maxPerSession: number;
  trigger: string;
  description: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// AD UNIT IDS (OFFICIAL TEST IDS vs PRODUCTION OVERRIDES)
// ─────────────────────────────────────────────────────────────────────────────
// When environment variables are not supplied, official Google test IDs are used.
// This guarantees 100% fill rate and zero "Error Code 3 (NO_FILL)" during testing and verification.
export const AD_UNIT_IDS = {
  // Android
  ANDROID_BANNER:
    process.env.EXPO_PUBLIC_ADMOB_ANDROID_BANNER ||
    (__DEV__
      ? 'ca-app-pub-3940256099942544/6300978111'
      : 'ca-app-pub-4944346636079363/5806615544'),
  ANDROID_INTERSTITIAL:
    process.env.EXPO_PUBLIC_ADMOB_ANDROID_INTERSTITIAL ||
    (__DEV__
      ? 'ca-app-pub-3940256099942544/1033173712'
      : 'ca-app-pub-4944346636079363/3941306433'),
  ANDROID_REWARDED:
    process.env.EXPO_PUBLIC_ADMOB_ANDROID_REWARDED ||
    'ca-app-pub-3940256099942544/5224354917',

  // iOS Test & Prod Defaults
  IOS_BANNER:
    process.env.EXPO_PUBLIC_ADMOB_IOS_BANNER ||
    'ca-app-pub-3940256099942544/2934735716',
  IOS_INTERSTITIAL:
    process.env.EXPO_PUBLIC_ADMOB_IOS_INTERSTITIAL ||
    'ca-app-pub-3940256099942544/4411468910',
  IOS_REWARDED:
    process.env.EXPO_PUBLIC_ADMOB_IOS_REWARDED ||
    'ca-app-pub-3940256099942544/1712485313',
};

// ─────────────────────────────────────────────────────────────────────────────
// CENTRALIZED ADS CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────
export const ADS_CONFIG = {
  enabled: true,
  testMode: process.env.EXPO_PUBLIC_ADMOB_IS_TEST_ADS !== 'false',

  placements: {
    analytics: {
      id: 'analytics',
      enabled: true,
      screen: 'AnalyticsScreen (/(app)/analytics)',
      format: 'interstitial',
      cooldownMs: __DEV__ ? 15 * 1000 : 8 * 60 * 1000, // 8m in prod, 15s in dev
      maxPerSession: 2,
      trigger: 'analytics_tab_open',
      description:
        'Triggered when free user navigates into financial intelligence/analytics tab',
    },
    dashboard: {
      id: 'dashboard',
      enabled: true,
      screen: 'DashboardScreen (/(app)/(tabs)/dashboard)',
      format: 'contextual_travel',
      cooldownMs: 0,
      maxPerSession: 999,
      trigger: 'feed_scroll',
      description:
        'Subtle contextual travel/hotel card between quick actions and widgets for free users',
    },
    finance: {
      id: 'finance',
      enabled: true,
      screen: 'FinanceAnalytics (components/finance/FinanceAnalytics)',
      format: 'banner',
      cooldownMs: 0,
      maxPerSession: 999,
      trigger: 'tab_view',
      description: 'Adaptive banner below payment methods card',
    },
    planner: {
      id: 'planner',
      enabled: true,
      screen: 'PlannerTab (components/trips/PlannerTab)',
      format: 'contextual_travel',
      cooldownMs: 0,
      maxPerSession: 999,
      trigger: 'itinerary_bottom',
      description:
        'Contextual tours and experiences affiliate card at end of itinerary',
    },
    trip_summary: {
      id: 'trip_summary',
      enabled: true,
      screen: 'TripSummaryScreen (/(app)/trips/[id]/summary)',
      format: 'contextual_travel',
      cooldownMs: 0,
      maxPerSession: 999,
      trigger: 'summary_footer',
      description:
        'Destination-aware hotel or flight deal card at summary footer',
    },
    trip_details: {
      id: 'trip_details',
      enabled: true,
      screen: 'TripAnalyticsScreen (/(app)/trips/[id]/analytics)',
      format: 'banner',
      cooldownMs: 0,
      maxPerSession: 999,
      trigger: 'screen_view',
      description: 'Adaptive banner in trip-level analytics screen',
    },
    post_trip_create: {
      id: 'post_trip_create',
      enabled: true,
      screen: 'CreateTripScreen (/(app)/create-trip)',
      format: 'interstitial',
      cooldownMs: __DEV__ ? 10 * 1000 : 5 * 60 * 1000,
      maxPerSession: 2,
      trigger: 'trip_created',
      description: 'Triggered once free user creates a new trip successfully',
    },
    notifications: {
      id: 'notifications',
      enabled: true,
      screen: 'NotificationsScreen (/(app)/(tabs)/notifications)',
      format: 'native_card',
      cooldownMs: 0,
      maxPerSession: 999,
      trigger: 'notification_feed',
      description: 'Contextual promo card inside notification stream',
    },
    travelPaid: {
      id: 'travelPaid',
      enabled: true,
      screen: 'Contextual travel surfaces',
      format: 'contextual_travel',
      cooldownMs: 0,
      maxPerSession: 999,
      trigger: 'partner_placement',
      description: 'Direct affiliate booking and forex deal card',
    },
  } as Record<AdPlacementId, PlacementConfig>,
};

// ─────────────────────────────────────────────────────────────────────────────
// FREQUENCY & COOLDOWN CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
export const AD_FREQUENCY_CONFIG = {
  // Global minimum gap between any interstitial ads across the entire app
  GLOBAL_INTERSTITIAL_COOLDOWN_MS: __DEV__ ? 20 * 1000 : 8 * 60 * 1000,

  // Maximum interstitials a user can ever see in a single app session
  MAX_INTERSTITIALS_PER_SESSION: 3,

  // Placements Registry referencing centralized ADS_CONFIG
  PLACEMENTS: ADS_CONFIG.placements,
};
