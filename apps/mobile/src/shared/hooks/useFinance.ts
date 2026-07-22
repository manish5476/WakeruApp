// hooks/useFinance.ts

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { financeApi } from '../../core/api/services/finance.api';

export const financeKeys = {
    all: ['finance'] as const,
    dashboard: (params?: any) => [...financeKeys.all, 'dashboard', params] as const,
    analytics: (params?: any) => [...financeKeys.all, 'analytics', params] as const,
    trends: (params?: any) => [...financeKeys.all, 'trends', params] as const,
    transactions: (params?: any) => [...financeKeys.all, 'transactions', params] as const,
    transaction: (id: string) => [...financeKeys.all, 'transaction', id] as const,
    budget: (params?: any) => [...financeKeys.all, 'budget', params] as const,
    bills: (params?: any) => [...financeKeys.all, 'bills', params] as const,
    goals: (params?: any) => [...financeKeys.all, 'goals', params] as const,
    debt: ['debt'] as const,
    categories: ['categories'] as const,
    tags: ['tags'] as const,
    monthlyReport: (month?: string) => [...financeKeys.all, 'monthlyReport', month] as const,
    yearlyReport: (year?: string) => [...financeKeys.all, 'yearlyReport', year] as const,
    streak: () => [...financeKeys.all, 'streak'] as const,
};

type FinanceExportParams = {
    startDate?: string;
    endDate?: string;
    format?: 'csv' | 'pdf' | 'excel';
    type?: 'income' | 'expense' | 'all';
};

// ─────────────────────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────────────────────
export function useFinanceDashboard(params?: { month?: string; includeTripExpenses?: boolean }) {
    return useQuery({
        queryKey: financeKeys.dashboard(params),
        queryFn: async () => {
            const response = await financeApi.getDashboard(params);
            if (!response.data) throw new Error('No data in response');
            return response.data;
        },
        retry: (failureCount, error: any) => {
            if (error?.response?.status === 401 || error?.response?.status === 404) return false;
            return failureCount < 3;
        },
        staleTime: 30 * 1000,
        refetchOnWindowFocus: false,
    });
}

export function useAnalytics(params?: { period?: 'week' | 'month' | 'quarter' | 'year' | 'all'; startDate?: string; endDate?: string; category?: string; type?: 'income' | 'expense' | 'all' }) {
    return useQuery({
        queryKey: financeKeys.analytics(params),
        queryFn: async () => {
            const response = await financeApi.getAnalytics(params);
            return response.data;
        },
        staleTime: 5 * 60 * 1000,
    });
}

export function useSpendingTrends(params?: { months?: number; category?: string }) {
    return useQuery({
        queryKey: financeKeys.trends(params),
        queryFn: async () => {
            const response = await financeApi.getSpendingTrends(params);
            return response.data;
        },
        staleTime: 5 * 60 * 1000,
    });
}

export function useSyncTripExpenses() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (tripId?: string) => financeApi.syncTripExpenses(tripId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: financeKeys.all });
        },
    });
}

export function useSpendingStreak() {
    return useQuery({
        queryKey: financeKeys.streak(),
        queryFn: async () => {
            const response = await financeApi.getSpendingStreak();
            return response.data;
        },
        staleTime: 5 * 60 * 1000,
    });
}

// ─────────────────────────────────────────────────────────────
// TRANSACTIONS
// ─────────────────────────────────────────────────────────────

export function useInfiniteTransactions(params?: {
    limit?: number;
    type?: 'income' | 'expense' | 'transfer' | 'trip_expense' | 'settlement_paid' | 'settlement_received' | 'all';
    search?: string;
}) {
    return useInfiniteQuery({
        queryKey: [...financeKeys.transactions(params), 'infinite'],
        queryFn: async ({ pageParam = 1 }) => {
            const response = await financeApi.getTransactions({ ...params, page: pageParam });
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

export function useTransactions(params?: any) {
    return useQuery({
        queryKey: financeKeys.transactions(params),
        queryFn: async () => {
            const response = await financeApi.getTransactions(params);
            return response.data;
        },
        staleTime: 2 * 60 * 1000,
    });
}
export function useTransaction(id: string) {
    return useQuery({
        queryKey: financeKeys.transaction(id),
        queryFn: async () => {
            const response = await financeApi.getTransactionById(id);
            let responseData = response.data;
            if (typeof responseData === 'string') {
                try {
                    responseData = JSON.parse(responseData);
                } catch (e) {
                    console.error('Failed to parse response data:', e);
                }
            }

            if (responseData?.success && responseData?.data) {
                return responseData.data;
            }
            return responseData?.data || responseData;
        },
        enabled: !!id,
    });
}

export function useCreateTransaction() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: financeApi.createTransaction,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: financeKeys.all });
        },
    });
}

export function useUpdateTransaction() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) =>
            financeApi.updateTransaction(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: financeKeys.all });
            queryClient.invalidateQueries({ queryKey: financeKeys.transaction(id) });
        },
    });
}

export function useDeleteTransaction() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, permanent }: { id: string; permanent?: boolean }) =>
            financeApi.deleteTransaction(id, permanent),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: financeKeys.all });
        },
    });
}

export function useRestoreTransaction() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => financeApi.restoreTransaction(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: financeKeys.all });
        },
    });
}

export function useBulkDeleteTransactions() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (ids: string[]) => financeApi.bulkDeleteTransactions(ids),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: financeKeys.all });
        },
    });
}

// ─────────────────────────────────────────────────────────────
// BUDGET
// ─────────────────────────────────────────────────────────────

export function useBudget(params?: { month?: string }) {
    return useQuery({
        queryKey: financeKeys.budget(params),
        queryFn: async () => {
            const response = await financeApi.getBudget(params);
            return response.data;
        },
        staleTime: 5 * 60 * 1000,
    });
}

export function useSetBudget() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: financeApi.setBudget,
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: financeKeys.budget({ month: variables.month })
            });
        },
    });
}

export function useUpdateBudget() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) =>
            financeApi.updateBudget(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: financeKeys.all });
        },
    });
}

export function useDeleteBudget() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => financeApi.deleteBudget(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: financeKeys.all });
        },
    });
}

export function useBudgetCategories() {
    return useQuery({
        queryKey: financeKeys.categories,
        queryFn: async () => {
            const response = await financeApi.getBudgetCategories();
            return response.data;
        },
        staleTime: 10 * 60 * 1000,
    });
}

// ─────────────────────────────────────────────────────────────
// BILLS
// ─────────────────────────────────────────────────────────────

export function useBills(params?: any) {
    return useQuery({
        queryKey: financeKeys.bills(params),
        queryFn: async () => {
            const response = await financeApi.getBills(params);
            return response.data;
        },
        staleTime: 5 * 60 * 1000,
    });
}

export function useInfiniteBills(params?: any) {
    return useInfiniteQuery({
        queryKey: financeKeys.bills(params),
        queryFn: async ({ pageParam = 1 }) => {
            const response = await financeApi.getBills({ ...params, page: pageParam, limit: 20 });
            return response.data; // this should return { bills: [...], pagination: {...} }
        },
        getNextPageParam: (lastPage: any) => {
            if (!lastPage || !lastPage.pagination) return undefined;
            const { page, totalPages } = lastPage.pagination;
            return page < totalPages ? page + 1 : undefined;
        },
        initialPageParam: 1,
        staleTime: 5 * 60 * 1000,
    });
}

export function useBill(id: string) {
    return useQuery({
        queryKey: ['bill', id],
        queryFn: async () => {
            const response = await financeApi.getBillById(id);
            return response.data;
        },
        enabled: !!id,
    });
}

export function useCreateBill() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: financeApi.createBill,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: financeKeys.bills() });
        },
    });
}

export function useUpdateBill() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) =>
            financeApi.updateBill(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: financeKeys.bills() });
        },
    });
}

export function usePayBill() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data?: any }) =>
            financeApi.payBill(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: financeKeys.bills() });
        },
    });
}

export function useSkipBill() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => financeApi.skipBill(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: financeKeys.bills() });
        },
    });
}

export function useDeleteBill() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => financeApi.deleteBill(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: financeKeys.bills() });
        },
    });
}

// ─────────────────────────────────────────────────────────────
// GOALS
// ─────────────────────────────────────────────────────────────

export function useGoals(params?: { isCompleted?: boolean; category?: string }) {
    return useQuery({
        queryKey: financeKeys.goals(params),
        queryFn: async () => {
            const response = await financeApi.getGoals(params);
            return response.data;
        },
        staleTime: 5 * 60 * 1000,
    });
}

export function useGoal(id: string) {
    return useQuery({
        queryKey: ['goal', id],
        queryFn: async () => {
            const response = await financeApi.getGoalById(id);
            return response.data;
        },
        enabled: !!id,
    });
}

export function useCreateGoal() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: financeApi.createGoal,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: financeKeys.goals() });
            queryClient.invalidateQueries({ queryKey: financeKeys.dashboard() });
        },
    });
}

export function useUpdateGoal() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) =>
            financeApi.updateGoal(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: financeKeys.goals() });
            queryClient.invalidateQueries({ queryKey: financeKeys.dashboard() });
        },
    });
}

export function useContributeToGoal() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: { amount: number; date?: string } }) =>
            financeApi.contributeToGoal(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: financeKeys.goals() });
            queryClient.invalidateQueries({ queryKey: financeKeys.dashboard() });
        },
    });
}

export function useDeleteGoal() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => financeApi.deleteGoal(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: financeKeys.goals() });
            queryClient.invalidateQueries({ queryKey: financeKeys.dashboard() });
        },
    });
}

// ─────────────────────────────────────────────────────────────
// DEBT
// ─────────────────────────────────────────────────────────────

export function useDebtSummary(params?: { includeTrips?: boolean }) {
    return useQuery({
        queryKey: [...financeKeys.debt, 'summary', params],
        queryFn: async () => {
            const response = await financeApi.getDebtSummary(params);
            return response.data;
        },
        staleTime: 2 * 60 * 1000,
    });
}

export function useDebtDetails(params?: { tripId?: string; status?: 'pending' | 'initiated' | 'confirmed' | 'disputed' | 'settled'; includeTrips?: boolean }) {
    return useQuery({
        queryKey: [...financeKeys.debt, 'details', params],
        queryFn: async () => {
            const response = await financeApi.getDebtDetails(params);
            return response.data;
        },
        staleTime: 2 * 60 * 1000,
    });
}

export function useCreateDebt() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: financeApi.createDebt,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: financeKeys.debt });
            queryClient.invalidateQueries({ queryKey: financeKeys.dashboard() });
        },
    });
}

export function useSettleDebt() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => financeApi.settleDebt(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: financeKeys.debt });
            queryClient.invalidateQueries({ queryKey: financeKeys.dashboard() });
        },
    });
}

// ─────────────────────────────────────────────────────────────
// CATEGORIES & TAGS
// ─────────────────────────────────────────────────────────────

export function useCategories(params?: { type?: 'income' | 'expense' }) {
    return useQuery({
        queryKey: financeKeys.categories,
        queryFn: async () => {
            const response = await financeApi.getCategories(params);
            return response.data;
        },
        staleTime: 10 * 60 * 1000,
    });
}

export function useTags() {
    return useQuery({
        queryKey: financeKeys.tags,
        queryFn: async () => {
            const response = await financeApi.getTags();
            return response.data;
        },
        staleTime: 10 * 60 * 1000,
    });
}

export function useExportTransactions() {
    return useMutation({
        mutationFn: (params?: FinanceExportParams) => financeApi.exportTransactions(params),
    });
}

// ─────────────────────────────────────────────────────────────
// REPORTS
// ─────────────────────────────────────────────────────────────

export function useMonthlyReport(month?: string) {
    return useQuery({
        queryKey: financeKeys.monthlyReport(month),
        queryFn: async () => {
            const response = await financeApi.getMonthlyReport(month);
            return response.data;
        },
        staleTime: 5 * 60 * 1000,
    });
}

export function useYearlyReport(year?: string) {
    return useQuery({
        queryKey: financeKeys.yearlyReport(year),
        queryFn: async () => {
            const response = await financeApi.getYearlyReport(year);
            return response.data;
        },
        staleTime: 5 * 60 * 1000,
    });
}

// ─────────────────────────────────────────────────────────────
// COMPOSED MUTATIONS HOOK
// ─────────────────────────────────────────────────────────────

export function useFinanceMutations() {
    const createTransaction = useCreateTransaction();
    const updateTransaction = useUpdateTransaction();
    const deleteTransaction = useDeleteTransaction();
    const restoreTransaction = useRestoreTransaction();
    const bulkDeleteTransactions = useBulkDeleteTransactions();
    const setBudget = useSetBudget();
    const updateBudget = useUpdateBudget();
    const deleteBudget = useDeleteBudget();
    const createBill = useCreateBill();
    const updateBill = useUpdateBill();
    const payBill = usePayBill();
    const skipBill = useSkipBill();
    const deleteBill = useDeleteBill();
    const createGoal = useCreateGoal();
    const updateGoal = useUpdateGoal();
    const contributeToGoal = useContributeToGoal();
    const deleteGoal = useDeleteGoal();
    const createDebt = useCreateDebt();
    const settleDebt = useSettleDebt();
    const syncTripExpenses = useSyncTripExpenses();
    const exportTransactions = useExportTransactions();

    return {
        // Transactions
        createTransaction: createTransaction.mutate,
        updateTransaction: updateTransaction.mutate,
        deleteTransaction: deleteTransaction.mutate,
        restoreTransaction: restoreTransaction.mutate,
        bulkDeleteTransactions: bulkDeleteTransactions.mutate,
        // Budget
        setBudget: setBudget.mutate,
        updateBudget: updateBudget.mutate,
        deleteBudget: deleteBudget.mutate,
        // Bills
        createBill: createBill.mutate,
        updateBill: updateBill.mutate,
        payBill: payBill.mutate,
        skipBill: skipBill.mutate,
        deleteBill: deleteBill.mutate,
        // Goals
        createGoal: createGoal.mutate,
        updateGoal: updateGoal.mutate,
        contributeToGoal: contributeToGoal.mutate,
        deleteGoal: deleteGoal.mutate,
        // Debts
        createDebt: createDebt.mutate,
        settleDebt: settleDebt.mutate,
        // Sync
        syncTripExpenses: syncTripExpenses.mutate,
        // Export
        exportTransactions: exportTransactions.mutate,
        // Loading states
        isMutating:
            createTransaction.isPending ||
            updateTransaction.isPending ||
            deleteTransaction.isPending ||
            restoreTransaction.isPending ||
            bulkDeleteTransactions.isPending ||
            setBudget.isPending ||
            updateBudget.isPending ||
            deleteBudget.isPending ||
            createBill.isPending ||
            updateBill.isPending ||
            payBill.isPending ||
            skipBill.isPending ||
            deleteBill.isPending ||
            createGoal.isPending ||
            updateGoal.isPending ||
            contributeToGoal.isPending ||
            deleteGoal.isPending ||
            createDebt.isPending ||
            settleDebt.isPending ||
            syncTripExpenses.isPending ||
            exportTransactions.isPending
    };
}

