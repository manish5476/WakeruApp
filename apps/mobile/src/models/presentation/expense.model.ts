import { format } from 'date-fns';
import { formatCompactCurrency } from '../../formatters/currency';

export interface ExpenseSplitPresentationModel {
  id: string;
  userId: string;
  displayName: string;
  avatarInitial: string;
  amountFormatted: string;
  isPaid: boolean;
}

export interface ExpensePresentationModel {
  id: string;
  rawExpense: any; // Keep reference to original for actions
  title: string;
  tripName: string | null;
  amountFormatted: string;
  dateFormatted: string;
  categoryEmoji: string;
  categoryColorToken: string;
  categoryName: string;
  isSettled: boolean;
  settlementPercentage: number;
  payerName: string;
  isPaidByYou: boolean;
  isCreator: boolean;
  splits: ExpenseSplitPresentationModel[];
  totalSplits: number;
  paidSplits: number;
}

const CATEGORY_EMOJIS: Record<string, string> = {
  food: '🍽️',
  stay: '🏨',
  transport: '🚗',
  activity: '🎯',
  shopping: '🛍️',
  health: '💊',
  other: '📌',
  rent: '🛏️',
  beers: '🍻',
  taxis: '🚕',
};

const CATEGORY_COLORS: Record<string, string> = {
  food: 'warning',
  stay: 'info',
  transport: 'success',
  activity: 'danger',
  shopping: 'purple',
  health: 'success',
  other: 'neutral',
  rent: 'warning',
  beers: 'warning',
  taxis: 'info',
};

export const mapExpenseToPresentation = (
  expense: any,
  currentUserId: string,
): ExpensePresentationModel => {
  const isPayer = expense.paidBy === currentUserId;
  const isCreator = expense.addedBy === currentUserId || isPayer;

  const amount = expense.amountLocal || expense.amountBase || 0;
  const categoryKey = expense.category?.toLowerCase() || 'other';

  const totalSplits = expense.splits?.length || 0;
  const paidSplits = expense.splits?.filter((s: any) => s.isPaid).length || 0;
  const settlePct =
    totalSplits > 0 ? paidSplits / totalSplits : expense.isSettled ? 1 : 0;

  // --- FIX START: Robust date handling ---
  const expenseDate = expense.date ? new Date(expense.date) : null;
  let dateFormatted = 'No date';

  if (expenseDate && !isNaN(expenseDate.getTime())) {
    const isToday = new Date().toDateString() === expenseDate.toDateString();
    if (isToday) {
      dateFormatted = 'Today';
    } else {
      dateFormatted = format(expenseDate, 'MMM d, yyyy');
    }
  }
  // --- FIX END ---

  return {
    id: expense._id,
    rawExpense: expense,
    title: expense.title || 'Untitled Expense',
    tripName: expense.tripId?.title || null,
    amountFormatted: formatCompactCurrency(amount),
    dateFormatted: dateFormatted, // Use the safe, formatted date
    categoryEmoji: CATEGORY_EMOJIS[categoryKey] || '📌',
    categoryColorToken: CATEGORY_COLORS[categoryKey] || 'primary',
    categoryName: expense.category || 'Other',
    isSettled: !!expense.isSettled,
    settlementPercentage: settlePct,
    payerName: isPayer ? 'You' : expense.paidByName?.split(' ')[0] || 'Unknown',
    isPaidByYou: isPayer,
    isCreator,
    totalSplits,
    paidSplits,
    splits: (expense.splits || []).map((split: any, index: number) => ({
      id: split.userId || split._id || `split-${index}`,
      userId: split.userId,
      displayName: split.displayName || 'Unknown',
      avatarInitial: split.displayName?.charAt(0)?.toUpperCase() || '?',
      amountFormatted: formatCompactCurrency(
        split.amountLocal || split.amountBase || 0,
      ),
      isPaid: !!split.isPaid,
    })),
  };
};
