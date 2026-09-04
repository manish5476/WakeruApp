import apiClient from '../api/client';

// ============================================================
// Smart Notification Triggers
// Called after expense creation, settlement, etc.
// ============================================================

export const smartNotifications = {
  /**
   * Check if user is overspending today
   */
  async checkDailySpendingAlert(_userId: string) {
    try {
      const stats = await apiClient.get('/analytics/quick-stats');
      const data = stats?.data as any;
      if (!data) return null;

      const dailyAvg =
        (data.thisMonth?.total ?? 0) / Math.max(1, new Date().getDate());
      const todaySpent = data.today?.total ?? 0;

      if (todaySpent > dailyAvg * 2) {
        return {
          title: '⚠️ High Spending Day',
          message: `You've spent ₹${todaySpent.toLocaleString()} today — 2x your daily average. Want to review?`,
          priority: 'medium' as const,
        };
      }
    } catch {
      // silently skip if analytics unavailable
    }
    return null;
  },

  /**
   * Check if trip is over budget
   */
  async checkTripBudgetAlert(tripId: string) {
    try {
      const analytics = await apiClient.get(`/analytics/trip/${tripId}`);
      const data = analytics?.data as any;
      if (!data) return null;

      const utilization = data.tripInfo?.budgetUtilization ?? 0;
      const daysLeft =
        (data.tripInfo?.duration ?? 0) -
        Math.ceil(
          (Date.now() - new Date(data.tripInfo?.startDate).getTime()) /
            86400000,
        );

      if (utilization > 80 && daysLeft > 0) {
        return {
          title: `📊 ${data.tripInfo?.title} at ${utilization}%`,
          message: `You've used ${utilization}% of your budget with ${daysLeft} days left. Slow down!`,
          priority: 'high' as const,
        };
      }
    } catch {
      // silently skip
    }
    return null;
  },

  /**
   * Check for late payments
   */
  async checkLatePaymentAlert() {
    try {
      const stats = await apiClient.get('/analytics/quick-stats');
      const data = stats?.data as any;

      if (data?.pendingSettlements > 3) {
        return {
          title: '💸 Pending Settlements',
          message: `You have ${data.pendingSettlements} unsettled payments. Remind your friends?`,
          priority: 'high' as const,
        };
      }
    } catch {
      // silently skip
    }
    return null;
  },

  /**
   * Weekend spending warning
   */
  checkWeekendAlert() {
    const today = new Date().getDay();
    if (today === 5) {
      // Friday
      return {
        title: '🎉 Weekend Ahead!',
        message: 'You typically spend 40% more on weekends. Set a budget?',
        priority: 'low' as const,
      };
    }
    return null;
  },

  /**
   * Monthly report ready
   */
  checkMonthlyReportAlert() {
    const today = new Date().getDate();
    if (today === 1) {
      // First of month
      return {
        title: '📊 Monthly Report Ready',
        message: 'See your spending summary for last month. Any surprises?',
        priority: 'medium' as const,
      };
    }
    return null;
  },

  /**
   * Run all checks and return alerts
   */
  async runAllChecks(userId: string, tripId?: string) {
    const alerts: any[] = [];

    const dailyAlert = await this.checkDailySpendingAlert(userId);
    if (dailyAlert) alerts.push(dailyAlert);

    if (tripId) {
      const budgetAlert = await this.checkTripBudgetAlert(tripId);
      if (budgetAlert) alerts.push(budgetAlert);
    }

    const paymentAlert = await this.checkLatePaymentAlert();
    if (paymentAlert) alerts.push(paymentAlert);

    const weekendAlert = this.checkWeekendAlert();
    if (weekendAlert) alerts.push(weekendAlert);

    const monthlyAlert = this.checkMonthlyReportAlert();
    if (monthlyAlert) alerts.push(monthlyAlert);

    return alerts;
  },
};
