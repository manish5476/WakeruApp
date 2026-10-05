import { useMemo, useCallback } from 'react';
import { useAuthStore } from '../stores/auth.store';
import { useMyTrips } from './useTrips';
import { useDashboard } from './useDashboard';
import { storage } from '../utils/storage';

export type UserJourneyState =
  | 'NEW_USER'
  | 'NEW_USER_JOINED_TRIP'
  | 'NEW_USER_CREATED_TRIP'
  | 'ACTIVE_USER'
  | 'RETURNING_USER';

export interface ChecklistItem {
  id: string;
  title: string;
  subtitle: string;
  completed: boolean;
  route?: string;
  actionKey?: string;
  icon: string;
}

export interface UserJourneyInfo {
  state: UserJourneyState;
  isNewUser: boolean;
  isReturningUser: boolean;
  isActiveUser: boolean;
  hasTrips: boolean;
  hasExpenses: boolean;
  hasSettlements: boolean;
  joinedTrip: any | null;
  createdTrip: any | null;
  checklist: ChecklistItem[];
  completedCount: number;
  totalChecklistCount: number;
  progressPercent: number;
  dismissOnboarding: () => void;
  resetOnboarding: () => void;
}

/**
 * Hook to classify user journey stage dynamically from actual backend data.
 * Correctly flattens InfiniteQuery pages and dashboard telemetry.
 */
export function useUserJourneyState(): UserJourneyInfo {
  const user = useAuthStore(s => s.user);
  const { data: tripsData } = useMyTrips();
  const { data: dashboardData } = useDashboard();

  const dismissOnboarding = useCallback(() => {
    storage.setBoolean('dismiss_onboarding', true);
  }, []);

  const resetOnboarding = useCallback(() => {
    storage.delete('dismiss_onboarding');
  }, []);

  return useMemo(() => {
    // 1. Accurately resolve trips from InfiniteQuery or Dashboard query
    let trips: any[] = [];
    if (tripsData) {
      if (Array.isArray(tripsData)) {
        trips = tripsData;
      } else if (Array.isArray((tripsData as any).pages)) {
        trips = (tripsData as any).pages.flatMap((page: any) =>
          Array.isArray(page?.trips)
            ? page.trips
            : Array.isArray(page?.data?.trips)
              ? page.data.trips
              : Array.isArray(page?.data)
                ? page.data
                : Array.isArray(page)
                  ? page
                  : [],
        );
      } else if (Array.isArray((tripsData as any).trips)) {
        trips = (tripsData as any).trips;
      } else if (Array.isArray((tripsData as any).data?.trips)) {
        trips = (tripsData as any).data.trips;
      } else if (Array.isArray((tripsData as any).data)) {
        trips = (tripsData as any).data;
      }
    }

    const dData = (dashboardData as any)?.data || dashboardData || {};
    const dActiveTrips = dData?.activeTrips || [];
    const dUpcomingTrips = dData?.upcomingTrips || [];
    const dCompletedTrips = dData?.completedTrips || [];
    const dAllTrips = [...dActiveTrips, ...dUpcomingTrips, ...dCompletedTrips];

    // Merge any trips discovered in dashboard telemetry if trips list query was empty
    if (trips.length === 0 && dAllTrips.length > 0) {
      trips = dAllTrips;
    }

    const recentExpenses = dData?.recentExpenses || [];
    const balances = dData?.balances || {};
    const totalOwed = balances?.totalOwed || 0;
    const totalLent = balances?.totalLent || 0;

    const tripsCount = Math.max(
      trips.length,
      Number(dData?.totalTripsCount || 0),
    );
    const totalUserExpenses = Math.max(
      Number(user?.stats?.totalExpenses || 0),
      recentExpenses.length,
      Number(dData?.thisMonthStats?.[0]?.count || 0),
    );

    const hasTrips = tripsCount > 0;
    const hasExpenses = totalUserExpenses > 0;
    const hasSettlements =
      (user?.stats?.totalSettled || 0) > 0 ||
      totalOwed > 0 ||
      totalLent > 0 ||
      (dData?.pendingSettlements && dData.pendingSettlements.length > 0);

    // Detect newest trip and ownership
    const newestTrip = trips.length > 0 ? trips[0] : dAllTrips[0] || null;
    const userId = user?._id || user?.firebaseUid;
    const isNewestTripOwner = newestTrip
      ? String(
          newestTrip.createdBy?._id ||
            newestTrip.createdBy ||
            newestTrip.adminId ||
            '',
        ) === String(userId) || !newestTrip.createdBy // Default creator if not marked
      : false;

    // Determine state
    let state: UserJourneyState = 'NEW_USER';

    if (!hasTrips && !hasExpenses) {
      state = 'NEW_USER';
    } else if (hasTrips && !hasExpenses) {
      if (isNewestTripOwner) {
        state = 'NEW_USER_CREATED_TRIP';
      } else {
        state = 'NEW_USER_JOINED_TRIP';
      }
    } else if (
      hasTrips &&
      hasExpenses &&
      (tripsCount > 1 || totalUserExpenses >= 2 || hasSettlements)
    ) {
      state = 'ACTIVE_USER';
    } else if (hasTrips && hasExpenses) {
      state = 'RETURNING_USER';
    }

    // Dynamic checklist verification
    const hasCreatedOrJoinedTrip = hasTrips;
    const hasAddedExpense = hasExpenses;
    const hasInvitedFriends =
      (user?.friendIds && user.friendIds.length > 0) ||
      trips.some((t: any) => {
        const mCount =
          t.memberCount ||
          (Array.isArray(t.members) ? t.members.length : 0) ||
          (Array.isArray(t.memberPreviews) ? t.memberPreviews.length : 0);
        return mCount > 1;
      }) ||
      Boolean(storage.getBoolean('crew_invited'));

    const hasCheckedBalances =
      Boolean(storage.getBoolean('balances_checked')) ||
      hasSettlements ||
      totalOwed > 0 ||
      totalLent > 0;

    const checklistTripRoute = newestTrip
      ? `/(app)/trips/${newestTrip._id || newestTrip.tripId || newestTrip.id}`
      : '/create-trip';

    const checklist: ChecklistItem[] = [
      {
        id: 'account_created',
        title: 'Create your account',
        subtitle: 'Account verified and ready to split',
        completed: true,
        icon: 'circle-check',
      },
      {
        id: 'create_or_join_trip',
        title: 'Create or join your first trip',
        subtitle: 'Keep your crew and shared costs in one place',
        completed: hasCreatedOrJoinedTrip,
        route: hasCreatedOrJoinedTrip ? checklistTripRoute : '/create-trip',
        icon: 'map-pin',
      },
      {
        id: 'invite_crew',
        title: 'Invite your travel crew',
        subtitle: 'Share your 8-character trip invite code',
        completed: Boolean(hasInvitedFriends),
        route: checklistTripRoute,
        icon: 'users',
      },
      {
        id: 'add_first_expense',
        title: 'Add your first expense',
        subtitle: 'Split dinner, hotels, or gas in seconds',
        completed: hasAddedExpense,
        route: checklistTripRoute,
        icon: 'receipt',
      },
      {
        id: 'check_balances',
        title: 'Check who owes whom',
        subtitle: 'See smart simplified debt balances',
        completed: Boolean(hasCheckedBalances),
        route: '/(app)/settlements',
        icon: 'arrow-left-right',
      },
    ];

    const completedCount = checklist.filter(item => item.completed).length;
    const totalChecklistCount = checklist.length;
    const progressPercent = Math.round(
      (completedCount / totalChecklistCount) * 100,
    );

    const isDismissed = Boolean(storage.getBoolean('dismiss_onboarding'));

    // The user graduates from the new user screen if:
    // 1. They explicitly dismissed onboarding
    // 2. OR they have created trips AND added expenses/crew (progress >= 80% or active user)
    // 3. OR they already have active expenses / settlements
    const isNewUser =
      !isDismissed &&
      !hasExpenses &&
      (!hasTrips ||
        (!hasInvitedFriends && state === 'NEW_USER_CREATED_TRIP') ||
        state === 'NEW_USER_JOINED_TRIP');

    const isReturningUser = state === 'RETURNING_USER';
    const isActiveUser = state === 'ACTIVE_USER' || (!isNewUser && hasTrips);

    return {
      state,
      isNewUser,
      isReturningUser,
      isActiveUser,
      hasTrips,
      hasExpenses,
      hasSettlements,
      joinedTrip: state === 'NEW_USER_JOINED_TRIP' ? newestTrip : null,
      createdTrip: state === 'NEW_USER_CREATED_TRIP' ? newestTrip : null,
      checklist,
      completedCount,
      totalChecklistCount,
      progressPercent,
      dismissOnboarding,
      resetOnboarding,
    };
  }, [user, tripsData, dashboardData, dismissOnboarding, resetOnboarding]);
}
