import {
  format,
  differenceInDays,
  isValid,
  isSameMonth,
  isSameYear,
} from 'date-fns';

export function formatTripDateRange(
  startDateStr?: string,
  endDateStr?: string,
): string {
  if (!startDateStr || !endDateStr) return 'Dates pending';

  const start = new Date(startDateStr);
  const end = new Date(endDateStr);

  if (!isValid(start) || !isValid(end)) return 'Invalid Dates';

  // If same exact day
  if (start.getTime() === end.getTime()) {
    return format(start, 'MMM d, yyyy');
  }

  if (isSameYear(start, end)) {
    if (isSameMonth(start, end)) {
      // Jul 6 - 8, 2024
      return `${format(start, 'MMM d')} – ${format(end, 'd, yyyy')}`;
    }
    // Jul 6 - Aug 8, 2024
    return `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`;
  }

  // Dec 28, 2023 - Jan 5, 2024
  return `${format(start, 'MMM d, yy')} – ${format(end, 'MMM d, yy')}`;
}

export function calculateTripDuration(
  startDateStr?: string,
  endDateStr?: string,
): string {
  if (!startDateStr || !endDateStr) return '';

  const start = new Date(startDateStr);
  const end = new Date(endDateStr);

  if (!isValid(start) || !isValid(end)) return '';

  const days = differenceInDays(end, start) + 1;
  if (days === 1) return '1 Day';
  return `${days} Days`;
}
