export interface TripCardUI {
  id: string;
  title: string;
  coverImage: string;

  // Status Information
  status: 'planning' | 'active' | 'completed' | 'archived';
  statusLabel: string;
  statusColorKey: string; // References a color in the theme (e.g. 'success', 'warning')

  // Time & Location
  dateRange: string;
  duration: string;
  stopCountLabel: string;

  // People
  memberAvatars: string[];
  memberCount: number;

  // Financials
  budgetDisplay: string;
  spentDisplay: string;
  progressValue: number; // 0 to 100
  isOverBudget: boolean;
}
