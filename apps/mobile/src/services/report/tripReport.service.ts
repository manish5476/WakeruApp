import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { format } from 'date-fns';

const CATEGORY_COLORS: Record<string, string> = {
  food: '#FF6B6B',
  stay: '#4ECDC4',
  transport: '#45B7D1',
  activity: '#96CEB4',
  shopping: '#FFEAA7',
  health: '#DDA0DD',
  other: '#98D8C8',
};

const CATEGORY_EMOJIS: Record<string, string> = {
  food: '🍽️',
  stay: '🏨',
  transport: '🚗',
  activity: '🎯',
  shopping: '🛍️',
  health: '💊',
  other: '📌',
};

export async function generateTripReport(
  trip: any,
  summary: any,
  analytics: any,
): Promise<string> {
  const currencySymbol = trip.baseCurrency === 'INR' ? '₹' : trip.baseCurrency;
  const activeMembers = trip.members?.filter((m: any) => m.isActive) || [];
  const categories = analytics?.categories || [];
  const stops = analytics?.stopBreakdown || trip.stops || [];

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1F2937; padding: 20px; }
    .cover { text-align: center; padding: 60px 20px; background: linear-gradient(135deg, #1A56DB, #1E40AF); color: white; border-radius: 16px; margin-bottom: 24px; }
    .cover h1 { font-size: 32px; margin-bottom: 8px; }
    .cover .emoji { font-size: 64px; margin-bottom: 16px; }
    .cover .dates { font-size: 14px; opacity: 0.9; }
    .section { background: white; border-radius: 12px; padding: 20px; margin-bottom: 16px; border: 1px solid #E5E7EB; }
    .section-title { font-size: 16px; font-weight: 700; margin-bottom: 16px; color: #1A56DB; }
    .stats-grid { display: flex; flex-wrap: wrap; gap: 12px; }
    .stat-card { flex: 1; min-width: 45%; background: #F9FAFB; border-radius: 12px; padding: 16px; text-align: center; }
    .stat-value { font-size: 22px; font-weight: 700; color: #1F2937; }
    .stat-label { font-size: 11px; color: #6B7280; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #E5E7EB; font-size: 13px; }
    th { color: #6B7280; font-weight: 600; font-size: 11px; text-transform: uppercase; }
    .category-bar { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
    .category-dot { width: 10px; height: 10px; border-radius: 5px; }
    .category-name { flex: 1; font-size: 13px; }
    .category-percent { font-weight: 600; font-size: 13px; }
    .progress-bar { height: 6px; background: #E5E7EB; border-radius: 3px; overflow: hidden; }
    .progress-fill { height: 100%; border-radius: 3px; }
    .member-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #F3F4F6; }
    .member-name { font-weight: 500; }
    .balance-positive { color: #059669; font-weight: 600; }
    .balance-negative { color: #DC2626; font-weight: 600; }
    .footer { text-align: center; padding: 20px; color: #9CA3AF; font-size: 12px; }
    .stop-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .stop-name { font-weight: 600; font-size: 15px; }
    .stop-amount { font-weight: 700; color: #1A56DB; }
  </style>
</head>
<body>
  <!-- Cover -->
  <div class="cover">
    <div class="emoji">✈️</div>
    <h1>${trip.title || 'Trip Report'}</h1>
    <div class="dates">${format(new Date(trip.startDate), 'MMM d, yyyy')} — ${format(new Date(trip.endDate), 'MMM d, yyyy')}</div>
  </div>

  <!-- Summary Stats -->
  <div class="section">
    <div class="section-title">📊 Trip Summary</div>
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-value">${currencySymbol}${(analytics?.summary?.totalSpent || 0).toLocaleString()}</div><div class="stat-label">Total Spent</div></div>
      <div class="stat-card"><div class="stat-value">${analytics?.summary?.totalExpenses || 0}</div><div class="stat-label">Expenses</div></div>
      <div class="stat-card"><div class="stat-value">${activeMembers.length}</div><div class="stat-label">Travelers</div></div>
      <div class="stat-card"><div class="stat-value">${trip.stopCount || stops.length}</div><div class="stat-label">Stops</div></div>
    </div>
  </div>

  <!-- Categories -->
  ${
    categories.length > 0
      ? `
  <div class="section">
    <div class="section-title">📈 Spending by Category</div>
    ${categories
      .map(
        (cat: any) => `
      <div class="category-bar">
        <div class="category-dot" style="background: ${CATEGORY_COLORS[cat.category] || '#9CA3AF'}"></div>
        <span class="category-name">${CATEGORY_EMOJIS[cat.category] || ''} ${cat.category}</span>
        <span class="category-percent">${cat.percentage}%</span>
      </div>
      <div class="progress-bar" style="margin-bottom: 8px;">
        <div class="progress-fill" style="width: ${cat.percentage}%; background: ${CATEGORY_COLORS[cat.category] || '#9CA3AF'}"></div>
      </div>
    `,
      )
      .join('')}
  </div>
  `
      : ''
  }

  <!-- Stops Breakdown -->
  ${
    stops.length > 0
      ? `
  <div class="section">
    <div class="section-title">📍 Stop-by-Stop Breakdown</div>
    ${stops
      .map(
        (stop: any) => `
      <div class="stop-header">
        <span class="stop-name">${stop.emoji || '📍'} ${stop.stopName || stop.name}</span>
        <span class="stop-amount">${currencySymbol}${(stop.totalBase || stop.totalSpentBase || 0).toLocaleString()}</span>
      </div>
    `,
      )
      .join('')}
  </div>
  `
      : ''
  }

  <!-- Members -->
  <div class="section">
    <div class="section-title">👥 Per Member</div>
    ${(analytics?.memberSpending || activeMembers)
      .map((m: any) => {
        const netBalance =
          (m.totalPaid || m.totalPaidBase || 0) -
          (m.totalOwed || m.totalOwesBase || 0);
        const isPositive = netBalance >= 0;
        return `
        <div class="member-row">
          <span class="member-name">${m.displayName}</span>
          <span class="${isPositive ? 'balance-positive' : 'balance-negative'}">
            ${isPositive ? '+' : ''}${currencySymbol}${Math.abs(netBalance).toLocaleString()}
          </span>
        </div>
      `;
      })
      .join('')}
  </div>

  <!-- Settlement -->
  ${
    analytics?.settlement
      ? `
  <div class="section">
    <div class="section-title">💸 Settlement Status</div>
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-value" style="color: #059669;">${analytics.settlement.settledCount}</div><div class="stat-label">Settled</div></div>
      <div class="stat-card"><div class="stat-value" style="color: #D97706;">${analytics.settlement.unsettledCount}</div><div class="stat-label">Pending</div></div>
      <div class="stat-card"><div class="stat-value">${analytics.settlement.settlementRate}%</div><div class="stat-label">Settlement Rate</div></div>
    </div>
  </div>
  `
      : ''
  }

  <div class="footer">
    <p>Generated by ✈️ Wakeru</p>
    <p>${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
  </div>
</body>
</html>`;

  // Generate PDF
  const { uri } = await Print.printToFileAsync({
    html,
    width: 595,
    height: 842,
  });

  // Share
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Share Trip Report',
      UTI: 'com.adobe.pdf',
    });
  }

  return uri;
}
