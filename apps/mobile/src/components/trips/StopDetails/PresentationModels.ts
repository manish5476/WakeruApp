export interface StopHeroUI {
  title: string;
  subtitle?: string; // e.g. "Paris, France"
  dateRange?: string;
  coverImageUrl: string;
  status: 'planning' | 'active' | 'completed' | 'archived';
  emoji?: string;
  country?: string;
  tripName?: string;
  weather?: { temp: string; icon: string };
  members?: { id: string; avatarUrl?: string; name: string }[];
  progressPercentage?: number;
  budgetFormatted?: string;
  expenseCount?: number;
  totalSpentFormatted?: string;
}

export interface StopFinancialSummaryUI {
  totalSpentFormatted: string;
  budgetFormatted: string;
  spentPercentage: number;
  expenseCount: number;
  memberCount: number;
  averageExpenseFormatted: string;
  pendingSettlementsCount: number;
}

export interface LocationPreviewUI {
  address: string;
  coordinates: { lat: number; lng: number };
  mapThumbnailUrl?: string;
  distanceFromPrevious?: string;
}

export interface ContributorUI {
  userId: string;
  name: string;
  avatarUrl?: string;
  paidAmountFormatted: string;
  percentage: number;
  isLargestContributor: boolean;
  settlementStatus: 'pending' | 'settled';
}

export interface CategoryBreakdownUI {
  category: string;
  spentFormatted: string;
  percentage: number;
  isTopCategory: boolean;
}

export interface ExpenseTimelineItemUI {
  id: string;
  title: string;
  amountFormatted: string;
  category: string;
  paidBy: string;
  paidByAvatar?: string;
  dateFormatted: string;
  isSettled: boolean;
  participantsCount: number;
  hasReceipt: boolean;
  rawAmount: number;
}

export interface QuickActionUI {
  icon: string;
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
}
