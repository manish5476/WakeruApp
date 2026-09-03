import { ITrip } from '../types/trip.types';
import { TripCardUI } from './trip.presentation';
import { formatCompactCurrency } from '../utils/formatters/currency';
import {
  formatTripDateRange,
  calculateTripDuration,
} from '../utils/formatters/date';
import { calculateProgress } from '../utils/formatters/percentage';
import { fallbackCoverImages } from '../constants/coverImages';

function getFallbackImageForTrip(tripId: string) {
  if (!tripId || !fallbackCoverImages || fallbackCoverImages.length === 0)
    return '';
  let hash = 0;
  for (let i = 0; i < tripId.length; i++) {
    hash = tripId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % fallbackCoverImages.length;
  return fallbackCoverImages[index];
}

export function mapTripToCardUI(trip: ITrip): TripCardUI {
  // Basic fields
  const id = trip._id || '';
  const title = trip.title || 'Untitled Trip';
  const coverImage = trip.coverImage || getFallbackImageForTrip(id);
  const status = trip.status || 'planning';

  // Status Logic
  let statusLabel = 'Planning';
  let statusColorKey = 'textTertiary';
  if (status === 'active') {
    statusLabel = 'Active Now';
    statusColorKey = 'success';
  } else if (status === 'completed') {
    statusLabel = 'Completed';
    statusColorKey = 'textSecondary';
  } else if (status === 'archived') {
    statusLabel = 'Archived';
    statusColorKey = 'textTertiary';
  }

  // Time & Location
  const dateRange = formatTripDateRange(trip.startDate, trip.endDate);
  const duration = calculateTripDuration(trip.startDate, trip.endDate);
  const stopCountLabel = trip.stopCount
    ? `${trip.stopCount} Stop${trip.stopCount > 1 ? 's' : ''}`
    : 'No Stops';

  // Members
  const members = trip.members || [];
  const memberCount = members.length;
  const memberAvatars = members
    .map(m => m.photoURL || m.avatarUrl || '')
    .filter(url => url !== '');

  // Financials
  const budget = trip.totalBudget || 0;
  const spent = trip.totalSpentBase || 0;
  const isOverBudget = budget > 0 && spent > budget;

  const budgetDisplay =
    budget > 0 ? formatCompactCurrency(budget) : 'No Budget';
  const spentDisplay = formatCompactCurrency(spent);
  const progressValue = calculateProgress(spent, budget);

  return {
    id,
    title,
    coverImage: coverImage || '',
    status,
    statusLabel,
    statusColorKey,
    dateRange,
    duration,
    stopCountLabel,
    memberAvatars,
    memberCount,
    budgetDisplay,
    spentDisplay,
    progressValue,
    isOverBudget,
  };
}
