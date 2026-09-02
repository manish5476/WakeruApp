import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { expensesApi } from '../../../../core/api/services';
import { queryKeys } from '../../../../shared/hooks/queryKeys';

// ============================================================
// Stop Expenses (Paginated)
// ============================================================

export function useStopExpenses(stopId: string, filters?: Record<string, any>) {
  return useQuery({
    queryKey: queryKeys.expenses.byStop(stopId, filters),
    queryFn: async () => {
      const response = await expensesApi.getStopExpenses(stopId, filters);
      return response.data;
    },
    enabled: !!stopId,
  });
}

// ============================================================
// Infinite Stop Expenses (Load More)
// ============================================================

export function useInfiniteStopExpenses(
  stopId: string,
  filters?: Record<string, any>,
) {
  return useInfiniteQuery({
    queryKey: [...queryKeys.expenses.byStop(stopId, filters), 'infinite'],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await expensesApi.getStopExpenses(stopId, {
        ...filters,
        page: pageParam,
        limit: 30,
      });
      return response.data;
    },
    getNextPageParam: (lastPage: any) => {
      if (lastPage?.pagination?.hasMore) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    enabled: !!stopId,
  });
}

// ============================================================
// Stop Expense Summary (Categories & Payers)
// ============================================================

export function useStopExpenseSummary(stopId: string) {
  return useQuery({
    queryKey: [...queryKeys.expenses.byStop(stopId), 'summary'],
    queryFn: async () => {
      const response = await expensesApi.getStopExpenseSummary(stopId);
      return response.data;
    },
    enabled: !!stopId,
  });
}

// ============================================================
// Trip Expenses (All Stops)
// ============================================================

export function useTripExpenses(tripId: string, filters?: Record<string, any>) {
  return useQuery({
    queryKey: queryKeys.expenses.byTrip(tripId, filters),
    queryFn: async () => {
      const response = await expensesApi.getTripExpenses(tripId, filters);
      return response.data;
    },
    enabled: !!tripId,
  });
}

// ============================================================
// Infinite Trip Expenses (Load More / Pagination)
// ============================================================

export function useInfiniteTripExpenses(
  tripId: string,
  filters?: Record<string, any>,
) {
  return useInfiniteQuery({
    queryKey: [...queryKeys.expenses.byTrip(tripId, filters), 'infinite'],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await expensesApi.getTripExpenses(tripId, {
        ...filters,
        page: pageParam,
        limit: 30,
      });
      return response.data;
    },
    getNextPageParam: (lastPage: any) => {
      if (lastPage?.pagination?.hasMore) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    enabled: !!tripId,
  });
}

// ============================================================
// My Expenses (Across All Trips)
// ============================================================

export function useMyExpenses(filters?: Record<string, any>) {
  return useQuery({
    queryKey: queryKeys.expenses.mine(filters),
    queryFn: async () => {
      const response = await expensesApi.getMyExpenses(filters);
      return response.data;
    },
  });
}

// ============================================================
// Infinite My Expenses
// ============================================================

export function useInfiniteMyExpenses(filters?: Record<string, any>) {
  return useInfiniteQuery({
    queryKey: [...queryKeys.expenses.mine(filters), 'infinite'],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await expensesApi.getMyExpenses({
        ...filters,
        page: pageParam,
        limit: 30,
      });
      return response.data;
    },
    getNextPageParam: (lastPage: any) => {
      if (lastPage?.pagination?.hasMore) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
  });
}

// ============================================================
// Single Expense
// ============================================================

export function useExpense(expenseId: string) {
  return useQuery({
    queryKey: queryKeys.expenses.detail(expenseId),
    queryFn: async () => {
      const response = await expensesApi.getExpense(expenseId);
      return response.data?.expense;
    },
    enabled: !!expenseId,
  });
}

// ============================================================
// Create Expense
// ============================================================

export function useCreateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await expensesApi.create(data);
      return response.data?.expense;
    },
    onSuccess: expense => {
      // Invalidate all relevant queries
      if (expense) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.expenses.byStop(expense.stopId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.expenses.byTrip(expense.tripId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.trips.summary(expense.tripId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.trips.detail(expense.tripId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.settlements.detail(expense.tripId),
        });
      }
    },
  });
}

// ============================================================
// Update Expense
// ============================================================

export function useUpdateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      expenseId,
      data,
    }: {
      expenseId: string;
      data: any;
    }) => {
      const response = await expensesApi.updateExpense(expenseId, data);
      return response.data?.expense;
    },
    onSuccess: expense => {
      if (expense) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.expenses.detail(expense._id),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.expenses.byStop(expense.stopId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.expenses.byTrip(expense.tripId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.trips.summary(expense.tripId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.trips.detail(expense.tripId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.settlements.detail(expense.tripId),
        });
      }
    },
  });
}

// ============================================================
// Archive Expense (Soft Delete)
// ============================================================

export function useArchiveExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (expenseId: string) => {
      // Get expense first to know tripId/stopId for invalidation
      const expenseResponse = await expensesApi.getExpense(expenseId);
      const expense = expenseResponse.data?.expense;

      await expensesApi.archiveExpense(expenseId);

      return expense; // Return for onSuccess
    },
    onSuccess: expense => {
      if (expense) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.expenses.byStop(expense.stopId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.expenses.byTrip(expense.tripId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.trips.summary(expense.tripId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.trips.detail(expense.tripId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.settlements.detail(expense.tripId),
        });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all });
      Toast.show({ type: 'success', text1: 'Expense Archived' });
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Failed to archive expense',
        text2: error?.message || 'An unexpected error occurred',
      });
    },
  });
}

// ============================================================
// Unarchive Expense
// ============================================================

export function useUnarchiveExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (expenseId: string) => {
      const expenseResponse = await expensesApi.getExpense(expenseId);
      const expense = expenseResponse.data?.expense;

      await expensesApi.unarchiveExpense(expenseId);

      return expense;
    },
    onSuccess: expense => {
      if (expense) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.expenses.byStop(expense.stopId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.expenses.byTrip(expense.tripId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.trips.summary(expense.tripId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.trips.detail(expense.tripId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.settlements.detail(expense.tripId),
        });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all });
      Toast.show({ type: 'success', text1: 'Expense Unarchived' });
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Failed to unarchive expense',
        text2: error?.message || 'An unexpected error occurred',
      });
    },
  });
}

// ============================================================
// Delete Expense Permanent
// ============================================================

export function useDeleteExpensePermanent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (expenseId: string) => {
      const expenseResponse = await expensesApi.getExpense(expenseId);
      const expense = expenseResponse.data?.expense;

      await expensesApi.deleteExpensePermanent(expenseId);

      return expense;
    },
    onSuccess: expense => {
      if (expense) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.expenses.byStop(expense.stopId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.expenses.byTrip(expense.tripId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.trips.summary(expense.tripId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.trips.detail(expense.tripId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.settlements.detail(expense.tripId),
        });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all });
      Toast.show({ type: 'success', text1: 'Expense Deleted' });
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Failed to delete expense',
        text2: error?.message || 'An unexpected error occurred',
      });
    },
  });
}

// ============================================================
// Mark Split as Paid
// ============================================================

export function useMarkSplitPaid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      expenseId,
      userId,
      paymentId,
    }: {
      expenseId: string;
      userId: string;
      paymentId?: string;
    }) => {
      const response = await expensesApi.markSplitPaid(
        expenseId,
        userId,
        paymentId,
      );
      return response.data;
    },
    onSuccess: (data, { expenseId }) => {
      // Always refresh the expense detail itself
      queryClient.invalidateQueries({
        queryKey: queryKeys.expenses.detail(expenseId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all });

      // If the API returned the updated expense with tripId, invalidate trip/settlement queries too
      const tripId = (data as any)?.expense?.tripId;
      if (tripId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.trips.summary(tripId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.trips.detail(tripId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.settlements.detail(tripId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.expenses.byTrip(tripId),
        });
      } else {
        // Fallback: invalidate ALL settlements and trips so nothing stays stale
        queryClient.invalidateQueries({ queryKey: ['settlements'] });
        queryClient.invalidateQueries({ queryKey: ['trips'] });
      }

      // Also invalidate the dashboard if it's cached
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

// ============================================================
// Trip Analytics
// ============================================================

export function useTripAnalytics(tripId: string) {
  return useQuery({
    queryKey: [...queryKeys.expenses.byTrip(tripId), 'analytics'],
    queryFn: async () => {
      const response = await expensesApi.getTripAnalytics(tripId);
      return response.data;
    },
    enabled: !!tripId,
  });
}

// ============================================================
// Comments
// ============================================================

export function useAddComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      expenseId,
      content,
    }: {
      expenseId: string;
      content: string;
    }) => {
      const response = await expensesApi.addComment(expenseId, content);
      return response.data;
    },
    onSuccess: (data, { expenseId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.expenses.detail(expenseId),
      });
    },
  });
}

export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      expenseId,
      commentId,
    }: {
      expenseId: string;
      commentId: string;
    }) => {
      const response = await expensesApi.deleteComment(expenseId, commentId);
      return response.data;
    },
    onSuccess: (data, { expenseId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.expenses.detail(expenseId),
      });
    },
  });
}
