// src/components/trips/Expenses/PresentationModels.ts

export type ExpenseCategoryUI =
  | 'all'
  | 'food'
  | 'stay'
  | 'transport'
  | 'activity'
  | 'shopping'
  | 'health'
  | 'other'
  | 'archived';

export interface SplitUI {
  userId: string;
  displayName: string;
  avatarUrl: string;
  amount: number;
  formattedAmount: string;
  isPaid: boolean;
  percentage?: number;
  shares?: number;
}

export interface ExpenseUI {
  id: string;
  tripId: string;
  title: string;
  category: ExpenseCategoryUI;
  categoryEmoji: string;
  categoryColor: string;
  date: Date;
  formattedDate: string;
  formattedTime: string;
  amount: number;
  formattedAmount: string;
  currency: string;
  paidById: string;
  paidByName: string;
  isSettled: boolean;
  isArchived: boolean;
  status: {
    label: string;
    variant: 'success' | 'warning' | 'danger' | undefined;
  };
  splits: SplitUI[];
  splitUrls: string[];
  stopName?: string;
  notes?: string;
  receiptImages: string[];
  commentsCount: number;
  rawExpense: any;
}

export interface ExpenseGroupUI {
  date: Date;
  formattedDate: string; // e.g. "Today", "Yesterday", "July 12, 2026"
  monthYear: string;
  items: ExpenseUI[];
}

export interface FinancialHeroUI {
  netBalance: number;
  formattedNetBalance: string;
  balanceStatus: 'positive' | 'negative' | 'neutral'; // positive = you are owed, negative = you owe
  totalTripSpend: number;
  formattedTotalTripSpend: string;
  yourSpend: number;
  formattedYourSpend: string;
  budgetRemaining?: number;
  formattedBudgetRemaining?: string;
  budgetStatus?: 'healthy' | 'warning' | 'danger';
  expenseCount: number;
}

export interface SettlementOverviewUI {
  youOwe: number;
  formattedYouOwe: string;
  youAreOwed: number;
  formattedYouAreOwed: string;
  settlementPercentage: number;
  formattedSettlementPercentage: string;
}

export interface CategoryAnalyticsItemUI {
  category: ExpenseCategoryUI;
  categoryEmoji: string;
  categoryColor: string;
  amount: number;
  formattedAmount: string;
  percentage: number;
}

export interface ExpensesDashboardUI {
  hero: FinancialHeroUI;
  settlement: SettlementOverviewUI;
  analytics: CategoryAnalyticsItemUI[];
  groups: ExpenseGroupUI[];
  isEmpty: boolean;
  isFetching: boolean;
}
