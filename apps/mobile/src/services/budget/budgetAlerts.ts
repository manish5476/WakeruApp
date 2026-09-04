import { storage } from '../../utils/storage';

interface BudgetLimit {
  id: string;
  type: 'daily' | 'weekly' | 'monthly' | 'trip' | 'category';
  tripId?: string;
  category?: string;
  amount: number;
  currency: string;
  createdAt: string;
}

interface BudgetAlert {
  limit: BudgetLimit;
  currentSpent: number;
  percentage: number;
  message: string;
  severity: 'info' | 'warning' | 'critical';
}

export const budgetAlerts = {
  getLimits(): BudgetLimit[] {
    return storage.getObject<BudgetLimit[]>('budget_limits') || [];
  },

  addLimit(limit: Omit<BudgetLimit, 'id' | 'createdAt'>): void {
    const limits = this.getLimits();
    limits.push({
      ...limit,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    });
    storage.setObject('budget_limits', limits);
  },

  removeLimit(id: string): void {
    const limits = this.getLimits().filter(l => l.id !== id);
    storage.setObject('budget_limits', limits);
  },

  checkBudget(limit: BudgetLimit, currentSpent: number): BudgetAlert | null {
    const percentage = (currentSpent / limit.amount) * 100;

    if (percentage >= 100) {
      return {
        limit,
        currentSpent,
        percentage,
        message: `🚨 You've exceeded your ${limit.type} budget of ₹${limit.amount.toLocaleString()}!`,
        severity: 'critical',
      };
    }

    if (percentage >= 80) {
      return {
        limit,
        currentSpent,
        percentage,
        message: `⚠️ You've used ${percentage.toFixed(0)}% of your ${limit.type} budget (₹${currentSpent.toLocaleString()} of ₹${limit.amount.toLocaleString()})`,
        severity: 'warning',
      };
    }

    if (percentage >= 50) {
      return {
        limit,
        currentSpent,
        percentage,
        message: `📊 You're at ${percentage.toFixed(0)}% of your ${limit.type} budget`,
        severity: 'info',
      };
    }

    return null;
  },

  checkAllBudgets(tripId: string, expenses: any[]): BudgetAlert[] {
    const limits = this.getLimits().filter(
      l => !l.tripId || l.tripId === tripId,
    );
    const alerts: BudgetAlert[] = [];

    for (const limit of limits) {
      let currentSpent = 0;

      if (limit.type === 'trip') {
        currentSpent = expenses.reduce((s, e) => s + e.amountBase, 0);
      } else if (limit.type === 'category') {
        currentSpent = expenses
          .filter(e => e.category === limit.category)
          .reduce((s, e) => s + e.amountBase, 0);
      }
      // daily/weekly/monthly checked separately with date filtering

      const alert = this.checkBudget(limit, currentSpent);
      if (alert) alerts.push(alert);
    }

    return alerts;
  },
};
