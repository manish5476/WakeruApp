export interface MappedRoute {
  name: string;
  params?: Record<string, any>;
}

export function mapPathToRoute(
  path: string,
  params?: Record<string, any>,
): MappedRoute {
  const cleanPath = (path.split('?')[0] || '').replace(/^\/|\/$/g, '');
  const queryParams: Record<string, any> = { ...params };

  if (path.includes('?')) {
    const queryString = path.split('?')[1] || '';
    const searchParams = new URLSearchParams(queryString);
    searchParams.forEach((val, key) => {
      queryParams[key] = val;
    });
  }

  // Tabs
  if (
    cleanPath === '(app)/(tabs)/home' ||
    cleanPath === 'home' ||
    cleanPath === ''
  ) {
    return { name: 'Tabs', params: { screen: 'Home', ...queryParams } };
  }
  if (cleanPath === '(app)/(tabs)/trips' || cleanPath === 'trips') {
    return { name: 'Tabs', params: { screen: 'TripsTab', ...queryParams } };
  }
  if (cleanPath === '(app)/(tabs)/expenses' || cleanPath === 'expenses') {
    return { name: 'Tabs', params: { screen: 'ExpensesTab', ...queryParams } };
  }
  if (cleanPath === '(app)/(tabs)/finance' || cleanPath === 'finance') {
    return { name: 'Tabs', params: { screen: 'FinanceTab', ...queryParams } };
  }
  if (
    cleanPath === '(app)/(tabs)/notifications' ||
    cleanPath === 'notifications'
  ) {
    return {
      name: 'Tabs',
      params: { screen: 'NotificationsTab', ...queryParams },
    };
  }
  if (cleanPath === '(app)/(tabs)/profile' || cleanPath === 'profile') {
    return { name: 'Tabs', params: { screen: 'ProfileTab', ...queryParams } };
  }
  if (cleanPath === '(app)/(tabs)/create' || cleanPath === 'create') {
    return { name: 'CreateTrip', params: queryParams };
  }

  // Auth routes
  if (cleanPath === '(auth)/login' || cleanPath === 'login')
    return { name: 'Login', params: queryParams };
  if (cleanPath === '(auth)/register' || cleanPath === 'register')
    return { name: 'Register', params: queryParams };
  if (cleanPath === '(auth)/forgot-password' || cleanPath === 'forgot-password')
    return { name: 'ForgotPassword', params: queryParams };
  if (cleanPath === '(auth)/set-password' || cleanPath === 'set-password')
    return { name: 'SetPassword', params: queryParams };
  if (cleanPath === '(auth)/onboarding' || cleanPath === 'onboarding')
    return { name: 'Onboarding', params: queryParams };

  // Common root screens
  if (cleanPath === 'create-trip' || cleanPath === '(app)/create-trip')
    return { name: 'CreateTrip', params: queryParams };
  if (cleanPath === 'friends' || cleanPath === '(app)/friends')
    return { name: 'Friends', params: queryParams };
  if (cleanPath === 'analytics' || cleanPath === '(app)/analytics')
    return { name: 'Analytics', params: queryParams };
  if (cleanPath === 'achievements' || cleanPath === '(app)/achievements')
    return { name: 'Achievements', params: queryParams };
  if (cleanPath === 'appearance' || cleanPath === '(app)/appearance')
    return { name: 'Appearance', params: queryParams };
  if (cleanPath === 'insights' || cleanPath === '(app)/insights')
    return { name: 'Insights', params: queryParams };
  if (cleanPath === 'invitations' || cleanPath === '(app)/invitations')
    return { name: 'Invitations', params: queryParams };
  if (cleanPath === 'privacy' || cleanPath === '(app)/privacy')
    return { name: 'Privacy', params: queryParams };
  if (cleanPath === 'quick-actions' || cleanPath === '(app)/quick-actions')
    return { name: 'QuickActions', params: queryParams };
  if (cleanPath === 'reminders' || cleanPath === '(app)/reminders')
    return { name: 'Reminders', params: queryParams };
  if (cleanPath === 'requests' || cleanPath === '(app)/requests')
    return { name: 'Requests', params: queryParams };
  if (cleanPath === 'receipts/upload' || cleanPath === '(app)/receipts/upload')
    return { name: 'ReceiptUpload', params: queryParams };

  // Settlements
  if (cleanPath === 'settlements' || cleanPath === '(app)/settlements')
    return { name: 'SettlementsList', params: queryParams };
  const settlementMatch = cleanPath.match(
    /^(?:\(app\)\/)?settlements\/([^/]+)$/,
  );
  if (settlementMatch) {
    return {
      name: 'SettlementDetails',
      params: { tripId: settlementMatch[1], ...queryParams },
    };
  }

  // Finance sub-routes
  if (cleanPath === 'finance/add' || cleanPath === '(app)/finance/add')
    return { name: 'FinanceAdd', params: queryParams };
  if (cleanPath === 'finance/budget' || cleanPath === '(app)/finance/budget')
    return { name: 'FinanceBudget', params: queryParams };
  if (
    cleanPath === 'finance/timeline' ||
    cleanPath === '(app)/finance/timeline'
  )
    return { name: 'FinanceTimeline', params: queryParams };
  if (
    cleanPath === 'finance/transactions' ||
    cleanPath === '(app)/finance/transactions'
  )
    return { name: 'FinanceTransactions', params: queryParams };
  if (
    cleanPath === 'finance/transaction/create' ||
    cleanPath === '(app)/finance/transaction/create'
  )
    return { name: 'TransactionCreate', params: queryParams };

  const transEditMatch = cleanPath.match(
    /^(?:\(app\)\/)?finance\/transaction\/edit\/([^/]+)$/,
  );
  if (transEditMatch) {
    return {
      name: 'TransactionEdit',
      params: { id: transEditMatch[1], ...queryParams },
    };
  }
  const transDetailMatch = cleanPath.match(
    /^(?:\(app\)\/)?finance\/transaction\/([^/]+)$/,
  );
  if (transDetailMatch) {
    return {
      name: 'TransactionDetails',
      params: { id: transDetailMatch[1], ...queryParams },
    };
  }

  // Profile sub-routes
  if (cleanPath === 'profile/banking' || cleanPath === '(app)/profile/banking')
    return { name: 'Banking', params: queryParams };
  if (
    cleanPath === 'profile/change-password' ||
    cleanPath === '(app)/profile/change-password'
  )
    return { name: 'ChangePassword', params: queryParams };
  if (
    cleanPath === 'profile/dashboard' ||
    cleanPath === '(app)/profile/dashboard'
  )
    return { name: 'ProfileDashboard', params: queryParams };
  if (cleanPath === 'profile/edit' || cleanPath === '(app)/profile/edit')
    return { name: 'ProfileEdit', params: queryParams };
  if (
    cleanPath === 'profile/feedback' ||
    cleanPath === '(app)/profile/feedback'
  )
    return { name: 'Feedback', params: queryParams };
  if (cleanPath === 'profile/reviews' || cleanPath === '(app)/profile/reviews')
    return { name: 'Reviews', params: queryParams };
  if (
    cleanPath === 'profile/review-detail' ||
    cleanPath === '(app)/profile/review-detail'
  )
    return { name: 'ReviewDetail', params: queryParams };
  if (
    cleanPath === 'profile/sessions' ||
    cleanPath === '(app)/profile/sessions'
  )
    return { name: 'Sessions', params: queryParams };

  // Person
  const personMatch = cleanPath.match(/^(?:\(app\)\/)?person\/([^/]+)$/);
  if (personMatch) {
    return {
      name: 'PersonProfile',
      params: { userId: personMatch[1], ...queryParams },
    };
  }

  // Expenses
  const expMatch = cleanPath.match(/^(?:\(app\)\/)?expenses\/([^/]+)$/);
  if (expMatch) {
    return {
      name: 'ExpenseDetails',
      params: { id: expMatch[1], ...queryParams },
    };
  }

  // Trips sub-routes
  if (cleanPath === 'trips/join' || cleanPath === '(app)/trips/join')
    return { name: 'TripJoin', params: queryParams };

  const tripAddExpMatch = cleanPath.match(
    /^(?:\(app\)\/)?trips\/([^/]+)\/add-expense$/,
  );
  if (tripAddExpMatch)
    return {
      name: 'AddExpense',
      params: { id: tripAddExpMatch[1], ...queryParams },
    };

  const tripEditExpMatch = cleanPath.match(
    /^(?:\(app\)\/)?trips\/([^/]+)\/edit-expense$/,
  );
  if (tripEditExpMatch)
    return {
      name: 'EditExpense',
      params: { id: tripEditExpMatch[1], ...queryParams },
    };

  const tripAddStopMatch = cleanPath.match(
    /^(?:\(app\)\/)?trips\/([^/]+)\/add-stop$/,
  );
  if (tripAddStopMatch)
    return {
      name: 'AddStop',
      params: { id: tripAddStopMatch[1], ...queryParams },
    };

  const tripEditStopMatch = cleanPath.match(
    /^(?:\(app\)\/)?trips\/([^/]+)\/edit-stop$/,
  );
  if (tripEditStopMatch)
    return {
      name: 'EditStop',
      params: { id: tripEditStopMatch[1], ...queryParams },
    };

  const tripStopDetailMatch = cleanPath.match(
    /^(?:\(app\)\/)?trips\/([^/]+)\/stops\/([^/]+)$/,
  );
  if (tripStopDetailMatch) {
    if (tripStopDetailMatch[2] === 'reorder') {
      return {
        name: 'TripStopsReorder',
        params: { id: tripStopDetailMatch[1], ...queryParams },
      };
    }
    return {
      name: 'TripStopDetails',
      params: {
        id: tripStopDetailMatch[1],
        stopId: tripStopDetailMatch[2],
        ...queryParams,
      },
    };
  }

  const tripAnalyticsMatch = cleanPath.match(
    /^(?:\(app\)\/)?trips\/([^/]+)\/analytics$/,
  );
  if (tripAnalyticsMatch)
    return {
      name: 'TripAnalytics',
      params: { id: tripAnalyticsMatch[1], ...queryParams },
    };

  const tripExpensesMatch = cleanPath.match(
    /^(?:\(app\)\/)?trips\/([^/]+)\/expenses$/,
  );
  if (tripExpensesMatch)
    return {
      name: 'TripExpenses',
      params: { id: tripExpensesMatch[1], ...queryParams },
    };

  const tripInsightsMatch = cleanPath.match(
    /^(?:\(app\)\/)?trips\/([^/]+)\/insights$/,
  );
  if (tripInsightsMatch)
    return {
      name: 'TripInsights',
      params: { id: tripInsightsMatch[1], ...queryParams },
    };

  const tripLeaderboardMatch = cleanPath.match(
    /^(?:\(app\)\/)?trips\/([^/]+)\/leaderboard$/,
  );
  if (tripLeaderboardMatch)
    return {
      name: 'TripLeaderboard',
      params: { id: tripLeaderboardMatch[1], ...queryParams },
    };

  const tripMapMatch = cleanPath.match(/^(?:\(app\)\/)?trips\/([^/]+)\/map$/);
  if (tripMapMatch)
    return { name: 'TripMap', params: { id: tripMapMatch[1], ...queryParams } };

  const tripSettingsMatch = cleanPath.match(
    /^(?:\(app\)\/)?trips\/([^/]+)\/settings$/,
  );
  if (tripSettingsMatch)
    return {
      name: 'TripSettings',
      params: { id: tripSettingsMatch[1], ...queryParams },
    };

  const tripStoryMatch = cleanPath.match(
    /^(?:\(app\)\/)?trips\/([^/]+)\/story$/,
  );
  if (tripStoryMatch)
    return {
      name: 'TripStory',
      params: { id: tripStoryMatch[1], ...queryParams },
    };

  const tripSummaryMatch = cleanPath.match(
    /^(?:\(app\)\/)?trips\/([^/]+)\/summary$/,
  );
  if (tripSummaryMatch)
    return {
      name: 'TripSummary',
      params: { id: tripSummaryMatch[1], ...queryParams },
    };

  const tripDetailMatch = cleanPath.match(/^(?:\(app\)\/)?trips\/([^/]+)$/);
  if (tripDetailMatch)
    return {
      name: 'TripDetails',
      params: { id: tripDetailMatch[1], ...queryParams },
    };

  // Local & Travel routes
  if (cleanPath === 'explore' || cleanPath === '(app)/explore')
    return { name: 'Explore', params: queryParams };
  if (cleanPath === 'explore/compare' || cleanPath === '(app)/explore/compare')
    return { name: 'CompareBusinesses', params: queryParams };
  const busDetailMatch = cleanPath.match(
    /^(?:\(app\)\/)?explore\/business\/([^/]+)$/,
  );
  if (busDetailMatch)
    return {
      name: 'BusinessDetail',
      params: { id: busDetailMatch[1], ...queryParams },
    };

  if (cleanPath === 'bookings' || cleanPath === '(app)/bookings')
    return { name: 'Bookings', params: queryParams };
  const bookingDetailMatch = cleanPath.match(
    /^(?:\(app\)\/)?bookings\/([^/]+)$/,
  );
  if (bookingDetailMatch)
    return {
      name: 'BookingDetail',
      params: { id: bookingDetailMatch[1], ...queryParams },
    };

  const reservationDetailMatch = cleanPath.match(
    /^(?:\(app\)\/)?reservations\/([^/]+)$/,
  );
  if (reservationDetailMatch)
    return {
      name: 'ReservationDetail',
      params: { id: reservationDetailMatch[1], ...queryParams },
    };

  if (cleanPath === 'vendor' || cleanPath === '(app)/vendor')
    return { name: 'VendorHub', params: queryParams };
  const vendorBizMatch = cleanPath.match(
    /^(?:\(app\)\/)?vendor\/business\/([^/]+)$/,
  );
  if (vendorBizMatch)
    return {
      name: 'VendorBusinessManage',
      params: { id: vendorBizMatch[1], ...queryParams },
    };

  if (
    cleanPath === 'admin/businesses' ||
    cleanPath === '(app)/admin/businesses'
  )
    return { name: 'AdminBusinesses', params: queryParams };
  if (cleanPath === 'admin/plans' || cleanPath === '(app)/admin/plans')
    return { name: 'AdminPlans', params: queryParams };
  const adminPlanMatch = cleanPath.match(
    /^(?:\(app\)\/)?admin\/plans\/([^/]+)$/,
  );
  if (adminPlanMatch)
    return {
      name: 'AdminPlanDetail',
      params: { id: adminPlanMatch[1], ...queryParams },
    };

  if (cleanPath === 'plans' || cleanPath === '(app)/plans')
    return { name: 'Plans', params: queryParams };
  if (cleanPath === 'balances' || cleanPath === '(app)/balances')
    return { name: 'Balances', params: queryParams };
  if (
    cleanPath === 'splits' ||
    cleanPath === '(app)/splits' ||
    cleanPath === '(app)/(tabs)/splits'
  )
    return { name: 'Splits', params: queryParams };
  if (
    cleanPath === 'receipts/confirm' ||
    cleanPath === '(app)/receipts/confirm'
  )
    return { name: 'ReceiptConfirm', params: queryParams };

  return { name: cleanPath || 'Tabs', params: queryParams };
}
