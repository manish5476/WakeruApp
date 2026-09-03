// src/components/trips/Expenses/ExpenseMappers.ts

import { isSameDay, format } from 'date-fns';
import {
  IExpense,
  ISplit,
  ExpenseCategory,
} from '../../../types/expense.types';
import { ITrip } from '../../../types/trip.types';
import {
  safeFormatCurrency,
  formatTime,
  getRelativeTime,
} from '../../../utils/formatters';
import {
  ExpenseCategoryUI,
  ExpenseGroupUI,
  ExpenseUI,
  FinancialHeroUI,
  SettlementOverviewUI,
  SplitUI,
  CategoryAnalyticsItemUI,
  ExpensesDashboardUI,
} from './PresentationModels';

export type SortOption =
  'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc';

const CATEGORY_EMOJIS: Record<string, string> = {
  all: '📋',
  food: '🍽️',
  stay: '🏨',
  transport: '🚗',
  activity: '🎯',
  shopping: '🛍️',
  health: '💊',
  other: '📌',
  archived: '📦',
};

const CATEGORY_COLORS: Record<string, string> = {
  food: '#F59E0B',
  stay: '#8B5CF6',
  transport: '#3B82F6',
  activity: '#EC4899',
  shopping: '#F472B6',
  health: '#10B981',
  other: '#6B7280',
  archived: '#9CA3AF',
};

function getExpenseStatus(
  expense: IExpense,
  currentUserId: string | undefined,
): { label: string; variant: 'success' | 'warning' | 'danger' | undefined } {
  if (expense.isSettled) return { label: 'Settled', variant: 'success' };
  const mySplit = expense.splits?.find(
    (s: ISplit) => s.userId === currentUserId,
  );
  if (expense.paidBy === currentUserId)
    return { label: 'You Paid', variant: 'success' };
  if (mySplit && mySplit.amountLocal > 0 && !mySplit.isPaid)
    return { label: 'You Owe', variant: 'warning' };
  return { label: 'Pending', variant: 'warning' };
}

export function mapExpensesToGroups(
  expenses: IExpense[],
  currentUserId: string | undefined,
  sortBy: SortOption = 'date_desc',
): ExpenseGroupUI[] {
  if (!expenses || expenses.length === 0) return [];

  const groups: {
    date: Date;
    items: ExpenseUI[];
    monthYear: string;
    formattedDate: string;
  }[] = [];

  expenses.forEach(exp => {
    const expDate = new Date(exp.date);
    const existingGroup = groups.find(g => isSameDay(g.date, expDate));

    const categoryUI = (
      exp.isArchived ? 'archived' : exp.category || 'other'
    ) as ExpenseCategoryUI;

    const status = getExpenseStatus(exp, currentUserId);
    const splitUrls =
      exp.splits?.map((s: ISplit) =>
        s.displayName
          ? `https://ui-avatars.com/api/?name=${encodeURIComponent(s.displayName)}&background=random&color=fff`
          : `https://ui-avatars.com/api/?name=U&background=random&color=fff`,
      ) || [];

    const expenseUI: ExpenseUI = {
      id: exp._id,
      tripId: exp.tripId,
      title: exp.title || 'Untitled Expense',
      category: categoryUI,
      categoryEmoji: CATEGORY_EMOJIS[categoryUI] || '📌',
      categoryColor: CATEGORY_COLORS[categoryUI] || '#6B7280',
      date: expDate,
      formattedDate: getRelativeTime(expDate),
      formattedTime: formatTime(expDate),
      amount: exp.amountLocal || 0,
      formattedAmount: safeFormatCurrency(
        exp.amountLocal || 0,
        exp.localCurrency || 'INR',
      ),
      currency: exp.localCurrency || 'INR',
      paidById: exp.paidBy,
      paidByName: exp.paidByName?.split(' ')[0] || 'Someone',
      isSettled: !!exp.isSettled,
      isArchived: !!exp.isArchived,
      status,
      splits: (exp.splits || []).map(s => ({
        userId: s.userId,
        displayName: s.displayName,
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(s.displayName || 'U')}&background=random&color=fff`,
        amount: s.amountLocal || 0,
        formattedAmount: safeFormatCurrency(
          s.amountLocal || 0,
          exp.localCurrency || 'INR',
        ),
        isPaid: !!s.isPaid,
        percentage: s.percentage,
        shares: s.shares,
      })),
      splitUrls,
      stopName: exp.stopId ? 'Stop' : undefined, // Assuming stop info might be limited without full populate
      notes: exp.notes,
      receiptImages: exp.receiptImages || [],
      commentsCount: exp.comments?.length || 0,
      rawExpense: exp,
    };

    if (existingGroup) {
      existingGroup.items.push(expenseUI);
    } else {
      groups.push({
        date: expDate,
        items: [expenseUI],
        monthYear: format(expDate, 'MMMM yyyy'),
        formattedDate: getRelativeTime(expDate),
      });
    }
  });

  if (sortBy === 'amount_desc' || sortBy === 'amount_asc') {
    const allItems = groups.flatMap(g => g.items);
    allItems.sort((a, b) =>
      sortBy === 'amount_desc' ? b.amount - a.amount : a.amount - b.amount,
    );
    return [
      {
        date: new Date(),
        items: allItems,
        monthYear: '',
        formattedDate: 'Sorted by Amount',
      },
    ];
  }

  groups.forEach(g => {
    g.items.sort((a, b) =>
      sortBy === 'date_asc'
        ? a.date.getTime() - b.date.getTime()
        : b.date.getTime() - a.date.getTime(),
    );
  });

  return groups.sort((a, b) =>
    sortBy === 'date_asc'
      ? a.date.getTime() - b.date.getTime()
      : b.date.getTime() - a.date.getTime(),
  );
}

export function generateDashboardUI(
  expenses: IExpense[],
  trip: ITrip | null | undefined,
  currentUserId: string | undefined,
  sortBy: SortOption = 'date_desc',
): ExpensesDashboardUI {
  // Calculate Financial Hero & Settlement
  let totalTripSpend = 0;
  let youPaid = 0;
  let youOwe = 0;
  let totalOwedToYou = 0;

  const categoryTotals: Record<string, number> = {};

  expenses.forEach(exp => {
    const amt = exp.amountLocal || 0;
    totalTripSpend += amt;

    // Category distribution
    const cat = exp.category || 'other';
    categoryTotals[cat] = (categoryTotals[cat] || 0) + amt;

    if (exp.paidBy === currentUserId) {
      youPaid += amt;
      // Calculate how much others owe you for this expense
      exp.splits?.forEach((s: ISplit) => {
        if (s.userId !== currentUserId && !s.isPaid) {
          totalOwedToYou += s.amountLocal || 0;
        }
      });
    } else {
      const mySplit = exp.splits?.find(
        (s: ISplit) => s.userId === currentUserId,
      );
      if (mySplit && !mySplit.isPaid) {
        youOwe += mySplit.amountLocal || 0;
      }
    }
  });

  const netBalance = totalOwedToYou - youOwe;
  const balanceStatus =
    netBalance > 0 ? 'positive' : netBalance < 0 ? 'negative' : 'neutral';

  let budgetRemaining = undefined;
  let budgetStatus: 'healthy' | 'warning' | 'danger' | undefined = undefined;

  if (trip?.totalBudget && trip.totalBudget > 0) {
    budgetRemaining = trip.totalBudget - totalTripSpend;
    const percentageSpent = (totalTripSpend / trip.totalBudget) * 100;
    if (percentageSpent < 75) budgetStatus = 'healthy';
    else if (percentageSpent < 90) budgetStatus = 'warning';
    else budgetStatus = 'danger';
  }

  const currency = trip?.baseCurrency || 'INR';

  const hero: FinancialHeroUI = {
    netBalance,
    formattedNetBalance: `${netBalance >= 0 ? '+' : ''}${safeFormatCurrency(Math.abs(netBalance), currency)}`,
    balanceStatus,
    totalTripSpend,
    formattedTotalTripSpend: safeFormatCurrency(totalTripSpend, currency),
    yourSpend: youPaid,
    formattedYourSpend: safeFormatCurrency(youPaid, currency),
    budgetRemaining,
    formattedBudgetRemaining:
      budgetRemaining !== undefined
        ? safeFormatCurrency(budgetRemaining, currency)
        : undefined,
    budgetStatus,
    expenseCount: expenses.length,
  };

  const settlement: SettlementOverviewUI = {
    youOwe,
    formattedYouOwe: safeFormatCurrency(youOwe, currency),
    youAreOwed: totalOwedToYou,
    formattedYouAreOwed: safeFormatCurrency(totalOwedToYou, currency),
    settlementPercentage:
      youOwe === 0 && totalOwedToYou === 0
        ? 100
        : Math.round(
            (Math.max(youPaid - totalOwedToYou, 0) / (youPaid || 1)) * 100,
          ),
    formattedSettlementPercentage: '0%', // Will calculate proper completion later if needed
  };

  // Analytics
  const analytics: CategoryAnalyticsItemUI[] = Object.entries(categoryTotals)
    .map(([cat, amt]) => ({
      category: cat as ExpenseCategoryUI,
      categoryEmoji: CATEGORY_EMOJIS[cat] || '📌',
      categoryColor: CATEGORY_COLORS[cat] || '#6B7280',
      amount: amt,
      formattedAmount: safeFormatCurrency(amt, currency),
      percentage: totalTripSpend > 0 ? (amt / totalTripSpend) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  const groups = mapExpensesToGroups(expenses, currentUserId, sortBy);

  return {
    hero,
    settlement,
    analytics,
    groups,
    isEmpty: expenses.length === 0,
    isFetching: false,
  };
}
