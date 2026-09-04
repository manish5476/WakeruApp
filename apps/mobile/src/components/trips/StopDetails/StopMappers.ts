// src/components/trips/StopDetails/StopMappers.ts
import { IStop, ITrip, IExpense } from '../../../types';
import {
  StopHeroUI,
  StopFinancialSummaryUI,
  LocationPreviewUI,
  ContributorUI,
  CategoryBreakdownUI,
  ExpenseTimelineItemUI,
} from './PresentationModels';

// Country flag mapping using unicode escapes for 100% encoding safety
function getCountryFlag(code?: string): string | null {
  if (!code || code.length !== 2) return null;
  const upper = code.toUpperCase();
  if (upper === 'IN') return '\uD83C\uDDEE\uD83C\uDDF3'; // ðŸ‡®ðŸ‡³
  if (upper === 'US') return '\uD83C\uDDFA\uD83C\uDDF8'; // ðŸ‡ºðŸ‡¸
  if (upper === 'GB' || upper === 'UK') return '\uD83C\uDDEC\uD83C\uDDE7'; // ðŸ‡¬ðŸ‡§
  if (upper === 'EU') return '\uD83C\uDDEA\uD83C\uDDFA'; // ðŸ‡ªðŸ‡º
  if (upper === 'JP') return '\uD83C\uDDEF\uD83C\uDDF5'; // ðŸ‡¯ðŸ‡µ
  if (upper === 'TH') return '\uD83C\uDDF9\uD83C\uDDED'; // ðŸ‡¹ðŸ‡­
  if (upper === 'SG') return '\uD83C\uDDF8\uD83C\uDDEC'; // ðŸ‡¸ðŸ‡¬
  if (upper === 'AE') return '\uD83C\uDDE6\uD83C\uDDEA'; // ðŸ‡¦ðŸ‡ª
  if (upper === 'FR') return '\uD83C\uDDEB\uD83C\uDDF7'; // ðŸ‡«ðŸ‡·
  if (upper === 'DE') return '\uD83C\uDDE9\uD83C\uDDEA'; // ðŸ‡©ðŸ‡ª
  if (upper === 'IT') return '\uD83C\uDDEE\uD83C\uDDF9'; // ðŸ‡®ðŸ‡¹
  if (upper === 'ES') return '\uD83C\uDDEA\uD83C\uDDF8'; // ðŸ‡ªðŸ‡¸
  if (upper === 'AU') return '\uD83C\uDDE6\uD83C\uDDFA'; // ðŸ‡¦ðŸ‡º
  if (upper === 'CA') return '\uD83C\uDDE8\uD83C\uDDE6'; // ðŸ‡¨ðŸ‡¦
  return null;
}

// Currency Symbol Helper with safe unicode
function getCurrencySymbol(code?: string): string {
  if (!code) return '\u20B9'; // â‚¹
  const c = code.toUpperCase();
  if (c === 'INR' || c === '\u20B9') return '\u20B9';
  if (c === 'USD' || c === '$') return '$';
  if (c === 'EUR' || c === '\u20AC') return '\u20AC';
  if (c === 'GBP' || c === '\u00A3') return '\u00A3';
  if (c === 'JPY' || c === '\u00A5') return '\u00A5';
  if (c === 'AED') return 'AED ';
  if (c === 'THB' || c === '\u0E3F') return '\u0E3F';
  if (c === 'SGD') return 'S$';
  return `${code} `;
}

export const safeFormatNumber = (
  value: number,
  currencyCode: string = 'INR',
): string => {
  if (!value || isNaN(value) || !isFinite(value))
    return `${getCurrencySymbol(currencyCode)}0`;
  const symbol = getCurrencySymbol(currencyCode);
  const abs = Math.abs(value);
  let numStr = '';
  if (abs >= 1e12) numStr = `${(abs / 1e12).toFixed(1)}T`;
  else if (abs >= 1e9) numStr = `${(abs / 1e9).toFixed(1)}B`;
  else if (abs >= 1e7) numStr = `${(abs / 1e7).toFixed(1)}Cr`;
  else if (abs >= 1e5) numStr = `${(abs / 1e5).toFixed(1)}L`;
  else if (abs >= 1e3) numStr = `${(abs / 1e3).toFixed(1)}K`;
  else numStr = value.toLocaleString(undefined, { maximumFractionDigits: 0 });

  return `${symbol}${numStr}`;
};

export const mapStopToHeroUI = (stop: IStop, trip?: ITrip): StopHeroUI => {
  const budget = stop.budget || 0;
  const spent = stop.totalSpentLocal || 0;
  const progressPercentage = budget > 0 ? (spent / budget) * 100 : 0;
  const currency = stop.currency || 'INR';

  // Check if emoji is country code or real emoji
  let displayEmoji = stop.emoji;
  if (
    stop.emoji &&
    stop.emoji.length <= 3 &&
    !stop.emoji.match(/\p{Extended_Pictographic}/u)
  ) {
    displayEmoji = getCountryFlag(stop.emoji) || '\uD83D\uDCCD';
  }
  if (!displayEmoji) {
    displayEmoji = getCountryFlag(stop.country) || '\uD83D\uDCCD';
  }

  // Weather
  const mockWeather = { temp: '24\u00B0C', icon: '\u2600\uFE0F' };

  // Format members
  const members =
    trip?.members?.slice(0, 5).map(m => ({
      id: m.userId,
      avatarUrl: m.photoURL,
      name: m.displayName || 'Traveler',
    })) || [];

  return {
    title: stop.name,
    subtitle:
      stop.country || stop.location?.formattedAddress?.split(',').pop()?.trim(),
    dateRange:
      stop.startDate && stop.endDate
        ? `${new Date(stop.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(stop.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
        : undefined,
    coverImageUrl:
      stop.coverImage ||
      'https://images.unsplash.com/photo-1517760442158-2ba8d69e4b35',
    status: trip?.status || 'active',
    emoji: displayEmoji,
    tripName: trip?.title,
    weather: mockWeather,
    members,
    progressPercentage,
    budgetFormatted:
      budget > 0 ? safeFormatNumber(budget, currency) : undefined,
    expenseCount: stop.expenseCount || 0,
    totalSpentFormatted: safeFormatNumber(spent, currency),
  };
};

export const mapStopToSummaryUI = (
  stop: IStop,
  trip?: ITrip,
): StopFinancialSummaryUI => {
  const budget = stop.budget || 0;
  const spent = stop.totalSpentLocal || 0;
  const currency = stop.currency || 'INR';

  return {
    totalSpentFormatted: safeFormatNumber(spent, currency),
    budgetFormatted:
      budget > 0 ? safeFormatNumber(budget, currency) : 'No Budget',
    spentPercentage: budget > 0 ? (spent / budget) * 100 : 0,
    expenseCount: stop.expenseCount || 0,
    memberCount: trip?.members?.length || 0,
    averageExpenseFormatted: safeFormatNumber(
      stop.expenseCount > 0 ? spent / stop.expenseCount : 0,
      currency,
    ),
    pendingSettlementsCount: 0,
  };
};

export const mapStopToLocationUI = (stop: IStop): LocationPreviewUI | null => {
  if (!stop.location || !stop.location.lat || !stop.location.lng) return null;

  return {
    address:
      stop.location.formattedAddress ||
      `${stop.location.lat.toFixed(4)}, ${stop.location.lng.toFixed(4)}`,
    coordinates: { lat: stop.location.lat, lng: stop.location.lng },
  };
};

export const mapExpenseToTimelineUI = (
  expense: IExpense,
): ExpenseTimelineItemUI => {
  return {
    id: expense._id,
    title: expense.title,
    amountFormatted: safeFormatNumber(
      expense.amountLocal,
      expense.localCurrency || 'INR',
    ),
    category: expense.category || 'other',
    paidBy: expense.paidByName || 'Member',
    dateFormatted: new Date(expense.date).toLocaleDateString(),
    isSettled: expense.isSettled,
    participantsCount: expense.splits?.length || 0,
    hasReceipt: expense.receiptImages?.length > 0,
    rawAmount: expense.amountLocal,
  };
};

export const mapContributorsUI = (
  payerBreakdown: any[],
  currency: string = 'INR',
): ContributorUI[] => {
  if (!payerBreakdown || payerBreakdown.length === 0) return [];

  // Sum total paid across all contributors for accurate percentage
  const totalPaid =
    payerBreakdown.reduce((sum, p) => sum + (p.totalPaidLocal || 0), 0) || 1;

  return payerBreakdown.map((payer, index) => {
    const paidAmount = payer.totalPaidLocal || 0;
    const percentage = Math.min((paidAmount / totalPaid) * 100, 100);
    return {
      userId: payer._id || `user-${index}`,
      name: payer.paidByName || 'Member',
      avatarUrl: payer.photoURL,
      paidAmountFormatted: safeFormatNumber(paidAmount, currency),
      percentage: percentage,
      isLargestContributor: index === 0,
      settlementStatus: 'pending',
    };
  });
};

export const mapCategoriesUI = (
  categoryBreakdown: any[],
  currency: string = 'INR',
): CategoryBreakdownUI[] => {
  if (!categoryBreakdown || categoryBreakdown.length === 0) return [];

  // Sum total category spend for accurate 100% distribution
  const totalCategorySpent =
    categoryBreakdown.reduce((sum, c) => sum + (c.totalLocal || 0), 0) || 1;

  return categoryBreakdown.map((cat, index) => {
    const spent = cat.totalLocal || 0;
    const percentage = Math.min((spent / totalCategorySpent) * 100, 100);
    return {
      category: cat._id || 'other',
      spentFormatted: safeFormatNumber(spent, currency),
      percentage: percentage,
      isTopCategory: index === 0,
    };
  });
};
