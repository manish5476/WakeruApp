import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { RouteProp } from '@react-navigation/native';

export type GuestStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  SetPassword: undefined;
  Onboarding: undefined;
};

export type AuthenticatedTabParamList = {
  Home: undefined;
  TripsTab: undefined;
  ExpensesTab: undefined;
  FinanceTab: undefined;
  NotificationsTab: undefined;
  ProfileTab: undefined;
};

export type RootStackParamList = {
  Tabs: undefined;
  CreateTrip: undefined;
  TripDetails: { id: string };
  TripExpenses: { id: string };
  AddExpense: { id: string };
  EditExpense: { id: string; expenseId: string };
  AddStop: { id: string };
  EditStop: { id: string; stopId: string };
  TripAnalytics: { id: string };
  TripInsights: { id: string };
  TripLeaderboard: { id: string };
  TripMap: { id: string };
  TripSettings: { id: string };
  TripStory: { id: string };
  TripSummary: { id: string };
  TripJoin: { code?: string } | undefined;
  ExpenseDetails: { id: string };
  FinanceAdd: undefined;
  FinanceBudget: undefined;
  FinanceTimeline: undefined;
  FinanceTransactions: undefined;
  TransactionDetails: { id: string };
  TransactionCreate: undefined;
  TransactionEdit: { id: string };
  SettlementsList: undefined;
  SettlementDetails: { tripId: string };
  ReceiptUpload: undefined;
  Reminders: undefined;
  Requests: undefined;
  Friends: undefined;
  Analytics: undefined;
  Achievements: undefined;
  Appearance: undefined;
  Insights: undefined;
  Invitations: undefined;
  Privacy: undefined;
  QuickActions: undefined;
  PersonProfile: { userId: string };
  Banking: undefined;
  ChangePassword: undefined;
  ProfileDashboard: undefined;
  ProfileEdit: undefined;
  Feedback: undefined;
  Reviews: undefined;
  ReviewDetail: { id?: string; reviewId?: string } | undefined;
  Sessions: undefined;
  TripStopDetails: { id: string; stopId: string };
  TripStopsReorder: { id: string };
};

export type GuestNavigationProp<T extends keyof GuestStackParamList> =
  NativeStackNavigationProp<GuestStackParamList, T>;

export type RootNavigationProp<
  T extends keyof RootStackParamList = keyof RootStackParamList,
> = NativeStackNavigationProp<RootStackParamList, T>;

export type RootRouteProp<T extends keyof RootStackParamList> = RouteProp<
  RootStackParamList,
  T
>;

export type TabNavigationProp<T extends keyof AuthenticatedTabParamList> =
  BottomTabNavigationProp<AuthenticatedTabParamList, T>;
