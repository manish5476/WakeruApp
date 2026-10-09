import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { PushNotificationService } from '../services/notifications/PushService';
import * as Location from 'expo-location';
import {
  View,
  StyleSheet,
  Platform,
  useWindowDimensions,
  Pressable,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

import type { AuthenticatedTabParamList, RootStackParamList } from './types';
import { useAppTheme } from '@/shared/theme/ThemeProvider';
import AppIcon from '@/shared/components/AppIcon';
import { Typography } from '@/shared/components/Typography';
import { GlobalBackground } from '../components/ui/GlobalBackground';
import { AppSidebar } from '../components/ui/AppSidebar';
import { GlobalFloatingTabBar } from '../components/navigation/GlobalFloatingTabBar';
import { SidebarMenuContext } from '../app/(app)/(tabs)/_layout';

// Tab screens
import HomeScreen from '../app/(app)/(tabs)/dashboard';
import TripsListScreen from '../app/(app)/(tabs)/home';
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

import { navigationRef } from './navigationRef';
import { usePathname } from '../shims/expo-router';

const Tab = createBottomTabNavigator<AuthenticatedTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' }, // HIDE default tab bar completely
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="TripsTab" component={TripsListScreen} />
      <Tab.Screen name="ExpensesTab" component={ExpensesScreen} />
      <Tab.Screen name="FinanceTab" component={FinanceScreen} />
      <Tab.Screen name="NotificationsTab" component={NotificationsScreen} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export function AuthenticatedNavigator() {
  const theme = useAppTheme();
  const { width } = useWindowDimensions();
  const [sidebarOpen, setSidebarOpen] = useState(
    Platform.OS === 'web' && width > 768,
  );
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentRoute, setCurrentRoute] = useState<string>('Home');
  const isDesktop = Platform.OS === 'web' && width > 768;
  const pathname = usePathname();

  useEffect(() => {
    setSidebarOpen(isDesktop);
  }, [isDesktop]);

  useEffect(() => {
    PushNotificationService.syncToken();
    Location.requestForegroundPermissionsAsync().catch(() => {});
  }, []);

  useEffect(() => {
    // Listen to route changes to update currentRoute state
    if (navigationRef.isReady()) {
      setCurrentRoute(navigationRef.getCurrentRoute()?.name || 'Home');
    }
    const unsubscribe = navigationRef.addListener('state', () => {
      setCurrentRoute(navigationRef.getCurrentRoute()?.name || 'Home');
    });
    return unsubscribe;
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  const toggleSidebarCollapsed = useCallback(() => {
    setSidebarCollapsed(prev => !prev);
  }, []);

  // Sync logic with Expo app _layout.tsx
  const isModalRoute = useMemo(() => {
    const modalRoutes = [
      'CreateTrip',
      'AddExpense',
      'EditExpense',
      'AddStop',
      'EditStop',
      'TripJoin',
      'ExpenseDetails',
      'FinanceAdd',
      'TransactionCreate',
      'TransactionEdit',
      'ProfileEdit',
      'ReceiptUpload',
      'QuickActions',
    ];
    return (
      modalRoutes.includes(currentRoute) ||
      pathname.includes('/edit') ||
      pathname.includes('/create') ||
      pathname.includes('/quick-actions') ||
      pathname.includes('/join')
    );
  }, [currentRoute, pathname]);

  const isInsideTabs = useMemo(() => {
    const tabRoutes = [
      'Home',
      'TripsTab',
      'ExpensesTab',
      'FinanceTab',
      'NotificationsTab',
      'ProfileTab',
      'Tabs',
    ];
    return tabRoutes.includes(currentRoute);
  }, [currentRoute]);

  const shouldShowGlobalBottomBar = !isDesktop && !isModalRoute;
  const sidebarOffset =
    isDesktop && sidebarOpen ? (sidebarCollapsed ? 96 : 294) : 0;

  const styles = StyleSheet.create({
    mainContainer: {
      flex: 1,
      flexDirection: 'column',
    },
    body: {
      flex: 1,
      overflow: 'hidden',
    },
  });

  return (
    <SidebarMenuContext.Provider
      value={{ onMenuPress: !isDesktop ? toggleSidebar : undefined }}
    >
      <GlobalBackground>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <BottomSheetModalProvider>
            <View style={styles.mainContainer}>
              <View style={{ flex: 1, flexDirection: 'row' }}>
                <AppSidebar
                  open={sidebarOpen}
                  collapsed={sidebarCollapsed}
                  isDesktop={isDesktop}
                  onToggleCollapsed={toggleSidebarCollapsed}
                  onClose={() => setSidebarOpen(false)}
                />
                <View style={[styles.body, { marginLeft: sidebarOffset }]}>
                  <Stack.Navigator
                    initialRouteName="Tabs"
                    screenOptions={{
                      headerShown: false,
                      animation: 'slide_from_right',
                      contentStyle: { backgroundColor: 'transparent' },
                    }}
                  >
                    <Stack.Screen name="Tabs" component={BottomTabs} />
                    <Stack.Screen
                      name="CreateTrip"
                      component={CreateTripScreen}
                      options={{
                        animation: 'slide_from_bottom',
                        presentation: 'modal',
                      }}
                    />
                    <Stack.Screen
                      name="TripDetails"
                      component={TripDetailsScreen}
                    />
                    <Stack.Screen
                      name="TripExpenses"
                      component={TripExpensesScreen}
                    />
                    <Stack.Screen
                      name="AddExpense"
                      component={AddExpenseScreen}
                      options={{
                        animation: 'slide_from_bottom',
                        presentation: 'modal',
                      }}
                    />
                    <Stack.Screen
                      name="EditExpense"
                      component={EditExpenseScreen}
                      options={{
                        animation: 'slide_from_bottom',
                        presentation: 'modal',
                      }}
                    />
                    <Stack.Screen name="AddStop" component={AddStopScreen} />
                    <Stack.Screen name="EditStop" component={EditStopScreen} />
                    <Stack.Screen
                      name="TripAnalytics"
                      component={TripAnalyticsScreen}
                    />
                    <Stack.Screen
                      name="TripInsights"
                      component={TripInsightsScreen}
                    />
                    <Stack.Screen
                      name="TripLeaderboard"
                      component={TripLeaderboardScreen}
                    />
                    <Stack.Screen name="TripMap" component={TripMapScreen} />
                    <Stack.Screen
                      name="TripSettings"
                      component={TripSettingsScreen}
                    />
                    <Stack.Screen
                      name="TripStory"
                      component={TripStoryScreen}
                    />
                    <Stack.Screen
                      name="TripSummary"
                      component={TripSummaryScreen}
                    />
                    <Stack.Screen
                      name="TripJoin"
                      component={TripJoinScreen}
                      options={{
                        animation: 'slide_from_bottom',
                        presentation: 'modal',
                      }}
                    />
                    <Stack.Screen
                      name="ExpenseDetails"
                      component={ExpenseDetailsScreen}
                      options={{
                        animation: 'slide_from_bottom',
                        presentation: 'modal',
                      }}
                    />
                    <Stack.Screen
                      name="FinanceAdd"
                      component={FinanceAddScreen}
                      options={{
                        animation: 'slide_from_bottom',
                        presentation: 'modal',
                      }}
                    />
                    <Stack.Screen
                      name="FinanceBudget"
                      component={FinanceBudgetScreen}
                    />
                    <Stack.Screen
                      name="FinanceTimeline"
                      component={FinanceTimelineScreen}
                    />
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
                      options={{
                        animation: 'slide_from_right',
                        presentation: 'modal',
                      }}
                    />
                    <Stack.Screen
                      name="TransactionEdit"
                      component={TransactionEditScreen}
                      options={{
                        animation: 'slide_from_right',
                        presentation: 'modal',
                      }}
                    />
                    <Stack.Screen
                      name="SettlementsList"
                      component={SettlementsListScreen}
                    />
                    <Stack.Screen
                      name="SettlementDetails"
                      component={SettlementDetailsScreen}
                    />
                    <Stack.Screen
                      name="ReceiptUpload"
                      component={ReceiptUploadScreen}
                      options={{
                        animation: 'slide_from_bottom',
                        presentation: 'modal',
                      }}
                    />
                    <Stack.Screen
                      name="Reminders"
                      component={RemindersScreen}
                    />
                    <Stack.Screen name="Requests" component={RequestsScreen} />
                    <Stack.Screen name="Friends" component={FriendsScreen} />
                    <Stack.Screen
                      name="Analytics"
                      component={AnalyticsScreen}
                    />
                    <Stack.Screen
                      name="Achievements"
                      component={AchievementsScreen}
                    />
                    <Stack.Screen
                      name="Appearance"
                      component={AppearanceScreen}
                    />
                    <Stack.Screen name="Insights" component={InsightsScreen} />
                    <Stack.Screen
                      name="Invitations"
                      component={InvitationsScreen}
                    />
                    <Stack.Screen name="Privacy" component={PrivacyScreen} />
                    <Stack.Screen
                      name="QuickActions"
                      component={QuickActionsScreen}
                      options={{
                        animation: 'slide_from_bottom',
                        presentation: 'modal',
                      }}
                    />
                    <Stack.Screen
                      name="PersonProfile"
                      component={PersonProfileScreen}
                    />
                    <Stack.Screen name="Banking" component={BankingScreen} />
                    <Stack.Screen
                      name="ChangePassword"
                      component={ChangePasswordScreen}
                    />
                    <Stack.Screen
                      name="ProfileDashboard"
                      component={ProfileDashboardScreen}
                    />
                    <Stack.Screen
                      name="ProfileEdit"
                      component={ProfileEditScreen}
                      options={{
                        animation: 'slide_from_right',
                        presentation: 'modal',
                      }}
                    />
                    <Stack.Screen name="Feedback" component={FeedbackScreen} />
                    <Stack.Screen name="Reviews" component={ReviewsScreen} />
                    <Stack.Screen
                      name="ReviewDetail"
                      component={ReviewDetailScreen}
                    />
                    <Stack.Screen name="Sessions" component={SessionsScreen} />
                    <Stack.Screen
                      name="TripStopDetails"
                      component={TripStopDetailsScreen}
                    />
                    <Stack.Screen
                      name="TripStopsReorder"
                      component={TripStopsReorderScreen}
                    />

                    {/* Migrated Screens */}
                    <Stack.Screen name="Explore" component={ExploreScreen} />
                    <Stack.Screen
                      name="BusinessDetail"
                      component={BusinessDetailScreen}
                    />
                    <Stack.Screen
                      name="CompareBusinesses"
                      component={CompareBusinessesScreen}
                    />
                    <Stack.Screen name="Bookings" component={BookingsScreen} />
                    <Stack.Screen
                      name="BookingDetail"
                      component={BookingDetailScreen}
                    />
                    <Stack.Screen
                      name="ReservationDetail"
                      component={ReservationDetailScreen}
                    />
                    <Stack.Screen
                      name="VendorHub"
                      component={VendorHubScreen}
                    />
                    <Stack.Screen
                      name="VendorBusinessManage"
                      component={VendorBusinessManageScreen}
                    />
                    <Stack.Screen
                      name="AdminBusinesses"
                      component={AdminBusinessesScreen}
                    />
                    <Stack.Screen
                      name="AdminPlans"
                      component={AdminPlansScreen}
                    />
                    <Stack.Screen
                      name="AdminPlanDetail"
                      component={AdminPlanDetailScreen}
                    />
                    <Stack.Screen name="Plans" component={PlansScreen} />
                    <Stack.Screen
                      name="ReceiptConfirm"
                      component={ReceiptConfirmScreen}
                    />
                    <Stack.Screen name="Balances" component={BalancesScreen} />
                    <Stack.Screen name="Splits" component={SplitsScreen} />
                  </Stack.Navigator>

                  {shouldShowGlobalBottomBar && <GlobalFloatingTabBar />}
                </View>
              </View>
            </View>
          </BottomSheetModalProvider>
        </GestureHandlerRootView>
      </GlobalBackground>
    </SidebarMenuContext.Provider>
  );
}

export default AuthenticatedNavigator;
