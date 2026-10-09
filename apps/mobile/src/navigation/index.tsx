import React from 'react';
import { NavigationContainer, LinkingOptions } from '@react-navigation/native';
import { navigationRef } from './navigationRef';
import { useAuthSession } from '@/features/authentication/presentation/hooks/AuthSessionProvider';
import { GuestNavigator } from './GuestNavigator';
import { AuthenticatedNavigator } from './AuthenticatedNavigator';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '@tripsplit/design-system';

import { useAuthStore } from '@/state/auth.store';

const linking: LinkingOptions<any> = {
  prefixes: [
    'wakeru://',
    'tripsplit://',
    'https://wakeru.com',
    'https://www.wakeru.com',
  ],
  config: {
    screens: {
      Tabs: {
        screens: {
          Home: 'home',
          TripsTab: 'trips',
          ExpensesTab: 'expenses',
          FinanceTab: 'finance',
          NotificationsTab: 'notifications',
          ProfileTab: 'profile',
        },
      },
      TripDetails: 'trips/:id',
      TripExpenses: 'trips/:id/expenses',
      AddExpense: 'trips/:id/add-expense',
      EditExpense: 'trips/:id/edit-expense',
      AddStop: 'trips/:id/add-stop',
      EditStop: 'trips/:id/edit-stop',
      TripStopDetails: 'trips/:id/stops/:stopId',
      TripStopsReorder: 'trips/:id/stops/reorder',
      TripAnalytics: 'trips/:id/analytics',
      TripInsights: 'trips/:id/insights',
      TripLeaderboard: 'trips/:id/leaderboard',
      TripMap: 'trips/:id/map',
      TripSettings: 'trips/:id/settings',
      TripStory: 'trips/:id/story',
      TripSummary: 'trips/:id/summary',
      TripJoin: 'trips/join',
      ExpenseDetails: 'expenses/:id',
      SettlementsList: 'settlements',
      SettlementDetails: 'settlements/:tripId',
      Reminders: 'reminders',
      Requests: 'requests',
      Friends: 'friends',
      ProfileDashboard: 'profile/dashboard',
      ProfileEdit: 'profile/edit',
      Reviews: 'profile/reviews',
      ReviewDetail: 'profile/review-detail',
      Feedback: 'profile/feedback',
    },
  },
};

export function RootNavigator() {
  const { isHydrated, session } = useAuthSession();
  const { isAuthenticated, isInitialized, initialize } = useAuthStore();
  const theme = useTheme();

  console.log(
    '>>> [BOOT] RootNavigator rendering, isHydrated:',
    isHydrated,
    'isInitialized:',
    isInitialized,
    'session:',
    !!session,
    'isAuthenticated:',
    isAuthenticated,
  );

  React.useEffect(() => {
    initialize();
  }, [initialize]);

  if (!isHydrated && !isInitialized) {
    console.log('>>> [BOOT] RootNavigator: waiting for hydration/init');
    return (
      <View
        style={[styles.loading, { backgroundColor: theme.colors.background }]}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const isLoggedIn = !!session || isAuthenticated;
  console.log('>>> [BOOT] RootNavigator: isLoggedIn =', isLoggedIn);

  return (
    <NavigationContainer ref={navigationRef} linking={linking}>
      {isLoggedIn ? <AuthenticatedNavigator /> : <GuestNavigator />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default RootNavigator;
