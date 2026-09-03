export interface InsightCategoryUI {
  category: string;
  amount: number;
  formattedAmount: string;
  pct: number;
  color: string;
  rank: number;
}

export interface InsightMemberUI {
  userId: string;
  displayName: string;
  initial: string;
  amount: number;
  formattedAmount: string;
  color: string;
}

export interface RecommendationUI {
  id: string;
  priority: 'high' | 'medium' | 'low';
  message: string;
  detail?: string;
  icon: string;
  color: string;
  bgColor: string;
  label: string;
}

export interface FunFactUI {
  id: string;
  icon: string;
  message: string;
}

export interface TripIntelligenceUI {
  hasData: boolean;

  // Health Score
  healthScore: number;
  healthStatus: string;
  healthColor: string;
  healthBg: string;
  healthSummary: string;

  // Forecast
  estimatedFinalCost: number;
  formattedFinalCost: string;
  budgetStatus: string;
  budgetStatusLabel: string;
  budgetStatusColor: string;
  budgetStatusBg: string;
  daysRemaining: number;
  isOverBudget: boolean;

  // Spending Patterns
  averageDailySpend: number;
  formattedDailySpend: string;
  mostExpensiveDayAmount: number;
  formattedMostExpensiveDay: string;
  mostExpensiveDayDate?: string;
  peakSpendingDayOfWeek?: string;

  // Derived
  categories: InsightCategoryUI[];
  topSpenders: InsightMemberUI[];
  recommendations: RecommendationUI[];
  funFacts: FunFactUI[];
}
