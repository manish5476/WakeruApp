import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { AuthenticatedTabParamList, RootStackParamList } from './types';
import { useAppTheme } from '@/shared/theme/ThemeProvider';
import AppIcon from '@/shared/components/AppIcon';
import { Typography } from '@/shared/components/Typography';

// Tab screens
import HomeScreen from '../app/(app)/(tabs)/home';
import TripsListScreen from '../app/(app)/trips/index';
import ExpensesScreen from '../app/(app)/(tabs)/expenses';
import FinanceScreen from '../app/(app)/(tabs)/finance';
import NotificationsScreen from '../app/(app)/(tabs)/notifications';
import ProfileScreen from '../app/(app)/(tabs)/profile';

// Stack screens
import CreateTripScreen from '../app/(app)/create-trip';
import TripDetailsScreen from '../app/(app)/trips/[id]';
import TripExpensesScreen from '../app/(app)/trips/[id]/expenses';
import AddExpenseScreen from '../app/(app)/trips/[id]/add-expense';
import EditExpenseScreen from '../app/(app)/trips/[id]/edit-expense';
import AddStopScreen from '../app/(app)/trips/[id]/add-stop';
import EditStopScreen from '../app/(app)/trips/[id]/edit-stop';
import TripAnalyticsScreen from '../app/(app)/trips/[id]/analytics';
import TripInsightsScreen from '../app/(app)/trips/[id]/insights';
import TripLeaderboardScreen from '../app/(app)/trips/[id]/leaderboard';
import TripMapScreen from '../app/(app)/trips/[id]/map';
import TripSettingsScreen from '../app/(app)/trips/[id]/settings';
import TripStoryScreen from '../app/(app)/trips/[id]/story';
import TripSummaryScreen from '../app/(app)/trips/[id]/summary';
import TripJoinScreen from '../app/(app)/trips/join';
import ExpenseDetailsScreen from '../app/(app)/expenses/[id]';
import FinanceAddScreen from '../app/(app)/finance/add';
import FinanceBudgetScreen from '../app/(app)/finance/budget';
import FinanceTimelineScreen from '../app/(app)/finance/timeline';
import FinanceTransactionsScreen from '../app/(app)/finance/transactions';
import TransactionDetailsScreen from '../app/(app)/finance/transaction/[id]';
import TransactionCreateScreen from '../app/(app)/finance/transaction/create';
import TransactionEditScreen from '../app/(app)/finance/transaction/edit/[id]';
import SettlementsListScreen from '../app/(app)/settlements/index';
import SettlementDetailsScreen from '../app/(app)/settlements/[tripId]';
import ReceiptUploadScreen from '../app/(app)/receipts/upload';
import RemindersScreen from '../app/(app)/reminders';
import RequestsScreen from '../app/(app)/requests';
import FriendsScreen from '../app/(app)/friends';
import AnalyticsScreen from '../app/(app)/analytics';
import AchievementsScreen from '../app/(app)/achievements';
import AppearanceScreen from '../app/(app)/appearance';
import InsightsScreen from '../app/(app)/insights';
import InvitationsScreen from '../app/(app)/invitations';
import PrivacyScreen from '../app/(app)/privacy';
import QuickActionsScreen from '../app/(app)/quick-actions';
import PersonProfileScreen from '../app/(app)/person/[userId]';
import BankingScreen from '../app/(app)/profile/banking';
import ChangePasswordScreen from '../app/(app)/profile/change-password';
import ProfileDashboardScreen from '../app/(app)/profile/dashboard';
import ProfileEditScreen from '../app/(app)/profile/edit';
import FeedbackScreen from '../app/(app)/profile/feedback';
import ReviewsScreen from '../app/(app)/profile/reviews';
import ReviewDetailScreen from '../app/(app)/profile/review-detail';
import SessionsScreen from '../app/(app)/profile/sessions';
import TripStopDetailsScreen from '../app/(app)/trips/[id]/stops/[stopId]';
import TripStopsReorderScreen from '../app/(app)/trips/[id]/stops/reorder';

// Newly Migrated Screens
import ExploreScreen from '../app/(app)/explore/index';
import BusinessDetailScreen from '../app/(app)/explore/business/[id]';
import CompareBusinessesScreen from '../app/(app)/explore/compare';
import BookingsScreen from '../app/(app)/bookings/index';
import BookingDetailScreen from '../app/(app)/bookings/[id]';
import ReservationDetailScreen from '../app/(app)/reservations/[id]';
import VendorHubScreen from '../app/(app)/vendor/index';
import VendorBusinessManageScreen from '../app/(app)/vendor/business/[id]';
import AdminBusinessesScreen from '../app/(app)/admin/businesses';
import AdminPlansScreen from '../app/(app)/admin/plans/index';
import AdminPlanDetailScreen from '../app/(app)/admin/plans/[id]';
import PlansScreen from '../app/(app)/plans';
import ReceiptConfirmScreen from '../app/(app)/receipts/confirm';
import BalancesScreen from '../app/(app)/balances';
import SplitsScreen from '../app/(app)/splits';

const Tab = createBottomTabNavigator<AuthenticatedTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

function BottomTabs() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: Math.max(insets.bottom, 12),
          left: 16,
          right: 16,
          height: 64,
          borderRadius: 24,
          backgroundColor: theme.isDark
            ? 'rgba(24, 24, 27, 0.88)'
            : 'rgba(255, 255, 255, 0.92)',
          borderTopWidth: 1,
          borderTopColor: theme.isDark
            ? 'rgba(255, 255, 255, 0.1)'
            : 'rgba(0, 0, 0, 0.06)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.15,
          shadowRadius: 16,
          elevation: 10,
          paddingBottom: 0,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.tabItem}>
              <AppIcon
                name="home"
                size={22}
                color={
                  focused ? theme.colors.primary : theme.colors.textTertiary
                }
              />
              <Typography
                variant="caption"
                weight={focused ? 'bold' : 'normal'}
                style={{
                  color: focused
                    ? theme.colors.primary
                    : theme.colors.textTertiary,
                  fontSize: 10,
                  marginTop: 2,
                }}
              >
                Home
              </Typography>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="TripsTab"
        component={TripsListScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.tabItem}>
              <AppIcon
                name="plane"
                size={22}
                color={
                  focused ? theme.colors.primary : theme.colors.textTertiary
                }
              />
              <Typography
                variant="caption"
                weight={focused ? 'bold' : 'normal'}
                style={{
                  color: focused
                    ? theme.colors.primary
                    : theme.colors.textTertiary,
                  fontSize: 10,
                  marginTop: 2,
                }}
              >
                Trips
              </Typography>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="ExpensesTab"
        component={ExpensesScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.tabItem}>
              <AppIcon
                name="arrow-left-right"
                size={22}
                color={
                  focused ? theme.colors.primary : theme.colors.textTertiary
                }
              />
              <Typography
                variant="caption"
                weight={focused ? 'bold' : 'normal'}
                style={{
                  color: focused
                    ? theme.colors.primary
                    : theme.colors.textTertiary,
                  fontSize: 10,
                  marginTop: 2,
                }}
              >
                Splits
              </Typography>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="FinanceTab"
        component={FinanceScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.tabItem}>
              <AppIcon
                name="wallet"
                size={22}
                color={
                  focused ? theme.colors.primary : theme.colors.textTertiary
                }
              />
              <Typography
                variant="caption"
                weight={focused ? 'bold' : 'normal'}
                style={{
                  color: focused
                    ? theme.colors.primary
                    : theme.colors.textTertiary,
                  fontSize: 10,
                  marginTop: 2,
                }}
              >
                Budget
              </Typography>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="NotificationsTab"
        component={NotificationsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.tabItem}>
              <AppIcon
                name="bell"
                size={22}
                color={
                  focused ? theme.colors.primary : theme.colors.textTertiary
                }
              />
              <Typography
                variant="caption"
                weight={focused ? 'bold' : 'normal'}
                style={{
                  color: focused
                    ? theme.colors.primary
                    : theme.colors.textTertiary,
                  fontSize: 10,
                  marginTop: 2,
                }}
              >
                Alerts
              </Typography>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.tabItem}>
              <AppIcon
                name="user"
                size={22}
                color={
                  focused ? theme.colors.primary : theme.colors.textTertiary
                }
              />
              <Typography
                variant="caption"
                weight={focused ? 'bold' : 'normal'}
                style={{
                  color: focused
                    ? theme.colors.primary
                    : theme.colors.textTertiary,
                  fontSize: 10,
                  marginTop: 2,
                }}
              >
                Profile
              </Typography>
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export function AuthenticatedNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Tabs"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Tabs" component={BottomTabs} />
      <Stack.Screen name="CreateTrip" component={CreateTripScreen} />
      <Stack.Screen name="TripDetails" component={TripDetailsScreen} />
      <Stack.Screen name="TripExpenses" component={TripExpensesScreen} />
      <Stack.Screen name="AddExpense" component={AddExpenseScreen} />
      <Stack.Screen name="EditExpense" component={EditExpenseScreen} />
      <Stack.Screen name="AddStop" component={AddStopScreen} />
      <Stack.Screen name="EditStop" component={EditStopScreen} />
      <Stack.Screen name="TripAnalytics" component={TripAnalyticsScreen} />
      <Stack.Screen name="TripInsights" component={TripInsightsScreen} />
      <Stack.Screen name="TripLeaderboard" component={TripLeaderboardScreen} />
      <Stack.Screen name="TripMap" component={TripMapScreen} />
      <Stack.Screen name="TripSettings" component={TripSettingsScreen} />
      <Stack.Screen name="TripStory" component={TripStoryScreen} />
      <Stack.Screen name="TripSummary" component={TripSummaryScreen} />
      <Stack.Screen name="TripJoin" component={TripJoinScreen} />
      <Stack.Screen name="ExpenseDetails" component={ExpenseDetailsScreen} />
      <Stack.Screen name="FinanceAdd" component={FinanceAddScreen} />
      <Stack.Screen name="FinanceBudget" component={FinanceBudgetScreen} />
      <Stack.Screen name="FinanceTimeline" component={FinanceTimelineScreen} />
      <Stack.Screen
        name="FinanceTransactions"
        component={FinanceTransactionsScreen}
      />
      <Stack.Screen
        name="TransactionDetails"
        component={TransactionDetailsScreen}
      />
      <Stack.Screen
        name="TransactionCreate"
        component={TransactionCreateScreen}
      />
      <Stack.Screen name="TransactionEdit" component={TransactionEditScreen} />
      <Stack.Screen name="SettlementsList" component={SettlementsListScreen} />
      <Stack.Screen
        name="SettlementDetails"
        component={SettlementDetailsScreen}
      />
      <Stack.Screen name="ReceiptUpload" component={ReceiptUploadScreen} />
      <Stack.Screen name="Reminders" component={RemindersScreen} />
      <Stack.Screen name="Requests" component={RequestsScreen} />
      <Stack.Screen name="Friends" component={FriendsScreen} />
      <Stack.Screen name="Analytics" component={AnalyticsScreen} />
      <Stack.Screen name="Achievements" component={AchievementsScreen} />
      <Stack.Screen name="Appearance" component={AppearanceScreen} />
      <Stack.Screen name="Insights" component={InsightsScreen} />
      <Stack.Screen name="Invitations" component={InvitationsScreen} />
      <Stack.Screen name="Privacy" component={PrivacyScreen} />
      <Stack.Screen name="QuickActions" component={QuickActionsScreen} />
      <Stack.Screen name="PersonProfile" component={PersonProfileScreen} />
      <Stack.Screen name="Banking" component={BankingScreen} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <Stack.Screen
        name="ProfileDashboard"
        component={ProfileDashboardScreen}
      />
      <Stack.Screen name="ProfileEdit" component={ProfileEditScreen} />
      <Stack.Screen name="Feedback" component={FeedbackScreen} />
      <Stack.Screen name="Reviews" component={ReviewsScreen} />
      <Stack.Screen name="ReviewDetail" component={ReviewDetailScreen} />
      <Stack.Screen name="Sessions" component={SessionsScreen} />
      <Stack.Screen name="TripStopDetails" component={TripStopDetailsScreen} />
      <Stack.Screen
        name="TripStopsReorder"
        component={TripStopsReorderScreen}
      />
      {/* Migrated Screens */}
      <Stack.Screen name="Explore" component={ExploreScreen} />
      <Stack.Screen name="BusinessDetail" component={BusinessDetailScreen} />
      <Stack.Screen
        name="CompareBusinesses"
        component={CompareBusinessesScreen}
      />
      <Stack.Screen name="Bookings" component={BookingsScreen} />
      <Stack.Screen name="BookingDetail" component={BookingDetailScreen} />
      <Stack.Screen
        name="ReservationDetail"
        component={ReservationDetailScreen}
      />
      <Stack.Screen name="VendorHub" component={VendorHubScreen} />
      <Stack.Screen
        name="VendorBusinessManage"
        component={VendorBusinessManageScreen}
      />
      <Stack.Screen name="AdminBusinesses" component={AdminBusinessesScreen} />
      <Stack.Screen name="AdminPlans" component={AdminPlansScreen} />
      <Stack.Screen name="AdminPlanDetail" component={AdminPlanDetailScreen} />
      <Stack.Screen name="Plans" component={PlansScreen} />
      <Stack.Screen name="ReceiptConfirm" component={ReceiptConfirmScreen} />
      <Stack.Screen name="Balances" component={BalancesScreen} />
      <Stack.Screen name="Splits" component={SplitsScreen} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
});

export default AuthenticatedNavigator;
