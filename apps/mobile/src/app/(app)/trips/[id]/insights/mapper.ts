import { formatCompactCurrency } from '../../../../../formatters/currency';
import {
  TripIntelligenceUI,
  InsightCategoryUI,
  InsightMemberUI,
  RecommendationUI,
  FunFactUI,
} from './models';

function getCategoryColors(theme: any): string[] {
  return [
    theme.colors.info,
    theme.colors.danger,
    theme.colors.success,
    theme.colors.warning,
    theme.colors.purple,
    theme.colors.secondary,
    theme.colors.warm,
    theme.colors.primary,
    theme.colors.textSecondary,
    theme.colors.info,
  ];
}

function getPriorityMeta(
  theme: any,
): Record<string, { color: string; bg: string; label: string }> {
  return {
    high: {
      color: theme.colors.danger,
      bg: theme.colors.dangerBg ?? theme.colors.danger + '22',
      label: 'High',
    },
    medium: {
      color: theme.colors.warning,
      bg: theme.colors.warningBg ?? theme.colors.warning + '22',
      label: 'Medium',
    },
    low: {
      color: theme.colors.success,
      bg: theme.colors.successBg ?? theme.colors.success + '22',
      label: 'Low',
    },
  };
}

export function mapInsightsToUI(
  raw: any,
  theme: any,
  totalBudget: number = 0,
): TripIntelligenceUI {
  if (!raw) {
    return {
      hasData: false,
      healthScore: 0,
      healthStatus: '',
      healthColor: '',
      healthBg: '',
      healthSummary: '',
      estimatedFinalCost: 0,
      formattedFinalCost: '',
      budgetStatus: '',
      budgetStatusLabel: '',
      budgetStatusColor: '',
      budgetStatusBg: '',
      daysRemaining: 0,
      isOverBudget: false,
      averageDailySpend: 0,
      formattedDailySpend: '',
      mostExpensiveDayAmount: 0,
      formattedMostExpensiveDay: '',
      categories: [],
      topSpenders: [],
      recommendations: [],
      funFacts: [],
    };
  }

  const predictions = raw.predictions || {};
  const spendingPatterns = raw.spendingPatterns || {};
  const categoryInsights = raw.categoryInsights || {};
  const memberInsights = raw.memberInsights || {};
  const recommendationsRaw = raw.recommendations || [];

  const hasData =
    spendingPatterns.averageDailySpend > 0 ||
    categoryInsights.categoryRanking?.length > 0;

  // ── Forecast ──
  const estimatedFinalCost = predictions.estimatedFinalCost || 0;
  const daysRemaining = predictions.daysRemaining || 0;
  const isOverBudget = predictions.budgetStatus !== 'on_track';

  const budgetStatusLabel = isOverBudget ? 'Over Budget' : 'On Track';
  const budgetStatusColor = isOverBudget
    ? theme.colors.danger
    : theme.colors.success;
  const budgetStatusBg = isOverBudget
    ? (theme.colors.dangerBg ?? theme.colors.danger + '22')
    : (theme.colors.successBg ?? theme.colors.success + '22');

  // ── Health Score (Calculated) ──
  let score = 100;
  if (isOverBudget) {
    const overspendRatio =
      totalBudget > 0 ? (estimatedFinalCost - totalBudget) / totalBudget : 0;
    score -= Math.min(50, Math.floor(overspendRatio * 100)); // Lose up to 50 pts for overspending
  }
  if (recommendationsRaw.some((r: any) => r.priority === 'high')) score -= 15;
  if (recommendationsRaw.some((r: any) => r.priority === 'medium')) score -= 5;
  score = Math.max(0, Math.min(100, score));

  let healthStatus = 'Excellent';
  let healthColor = theme.colors.success;
  let healthBg = theme.colors.successBg ?? theme.colors.success + '22';
  let healthSummary = 'Your trip spending is highly efficient.';

  if (score < 50) {
    healthStatus = 'Needs Attention';
    healthColor = theme.colors.danger;
    healthBg = theme.colors.dangerBg ?? theme.colors.danger + '22';
    healthSummary = 'Significant overspending detected.';
  } else if (score < 80) {
    healthStatus = 'Fair';
    healthColor = theme.colors.warning;
    healthBg = theme.colors.warningBg ?? theme.colors.warning + '22';
    healthSummary = 'Watch out for unexpected expenses.';
  }

  // ── Categories ──
  const CAT_COLORS = getCategoryColors(theme);
  const rawCategories = categoryInsights.categoryRanking || [];
  const totalCatAmount =
    rawCategories.reduce((s: number, c: any) => s + (c.amount || 0), 0) || 1;

  const categories: InsightCategoryUI[] = rawCategories.map(
    (c: any, i: number) => ({
      category: c.category,
      amount: c.amount || 0,
      formattedAmount: formatCompactCurrency(c.amount || 0),
      pct: ((c.amount || 0) / totalCatAmount) * 100,
      color: CAT_COLORS[i % CAT_COLORS.length],
      rank: i + 1,
    }),
  );

  // ── Members ──
  const rawMembers = memberInsights.memberRanking || [];
  const topSpenders: InsightMemberUI[] = rawMembers
    .slice(0, 4)
    .map((m: any, i: number) => ({
      userId: m.userId || String(i),
      displayName: m.displayName || 'Unknown',
      initial: (m.displayName || '?')[0].toUpperCase(),
      amount: m.totalPaid || m.totalSpend || 0,
      formattedAmount: formatCompactCurrency(m.totalPaid || m.totalSpend || 0),
      color: CAT_COLORS[(i + 3) % CAT_COLORS.length],
    }));

  // ── Recommendations ──
  const PRIORITY_META = getPriorityMeta(theme);
  const recommendations: RecommendationUI[] = recommendationsRaw.map(
    (r: any, i: number) => {
      const p = r.priority || 'low';
      const meta = PRIORITY_META[p] || PRIORITY_META.low;
      return {
        id: `rec-${i}`,
        priority: p as any,
        message: r.message,
        detail: r.detail,
        icon:
          r.icon ||
          (p === 'high'
            ? 'alert-triangle'
            : p === 'medium'
              ? 'alert-circle'
              : 'info'),
        color: meta.color,
        bgColor: meta.bg,
        label: meta.label,
      };
    },
  );

  // ── Fun Facts (Generated) ──
  const funFacts: FunFactUI[] = [];
  if (categories.length > 0) {
    const topCat = categories[0];
    funFacts.push({
      id: 'fact-1',
      icon: '🎯',
      message: `You've spent most of your money on ${topCat.category.charAt(0).toUpperCase() + topCat.category.slice(1)} (${Math.round(topCat.pct)}%).`,
    });
  }
  if (spendingPatterns.peakSpendingDay) {
    funFacts.push({
      id: 'fact-2',
      icon: '🔥',
      message: `${spendingPatterns.peakSpendingDay} is your highest spending day of the week.`,
    });
  }
  if (topSpenders.length > 0 && topSpenders[0].amount > 0) {
    funFacts.push({
      id: 'fact-3',
      icon: '👑',
      message: `${topSpenders[0].displayName} has spent the most so far.`,
    });
  }

  return {
    hasData,
    healthScore: score,
    healthStatus,
    healthColor,
    healthBg,
    healthSummary,
    estimatedFinalCost,
    formattedFinalCost: formatCompactCurrency(estimatedFinalCost),
    budgetStatus: predictions.budgetStatus,
    budgetStatusLabel,
    budgetStatusColor,
    budgetStatusBg,
    daysRemaining,
    isOverBudget,
    averageDailySpend: spendingPatterns.averageDailySpend || 0,
    formattedDailySpend: formatCompactCurrency(
      spendingPatterns.averageDailySpend || 0,
    ),
    mostExpensiveDayAmount: spendingPatterns.mostExpensiveDay?.amount || 0,
    formattedMostExpensiveDay: formatCompactCurrency(
      spendingPatterns.mostExpensiveDay?.amount || 0,
    ),
    mostExpensiveDayDate: spendingPatterns.mostExpensiveDay?.date,
    peakSpendingDayOfWeek: spendingPatterns.peakSpendingDay,
    categories,
    topSpenders,
    recommendations,
    funFacts,
  };
}
