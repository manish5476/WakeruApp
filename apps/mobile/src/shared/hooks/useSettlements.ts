import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settlementsApi } from '../../core/api/services';
import { queryKeys } from './queryKeys';

// ============================================================
// Get/Create Settlement
// ============================================================

export function useSettlement(tripId: string) {
    return useQuery({
        queryKey: queryKeys.settlements.detail(tripId),
        queryFn: async () => {
            const response = await settlementsApi.getSettlement(tripId);
            return response.data;
        },
        enabled: !!tripId,
    });
}

// ============================================================
// Calculate Settlement
// ============================================================

export function useCalculateSettlement() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (tripId: string) => {
            const response = await settlementsApi.calculateSettlement(tripId);
            return response.data?.settlement;
        },
        onSuccess: (_, tripId) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.settlements.detail(tripId) });
        },
    });
}

// ============================================================
// Initiate UPI Payment
// ============================================================

export function useInitiatePayment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ tripId, transactionId }: { tripId: string; transactionId: string }) => {
            const response = await settlementsApi.initiatePayment(tripId, transactionId);
            return response.data;
        },
        onSuccess: (_, { tripId }) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.settlements.detail(tripId) });
        },
    });
}

// ============================================================
// Confirm Payment
// ============================================================

export function useConfirmPayment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ tripId, transactionId }: { tripId: string; transactionId: string }) => {
            const response = await settlementsApi.confirmPayment(tripId, transactionId);
            return response.data;
        },
        onSuccess: (_, { tripId }) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.settlements.detail(tripId) });
            queryClient.invalidateQueries({ queryKey: queryKeys.expenses.byTrip(tripId) });
            queryClient.invalidateQueries({ queryKey: queryKeys.trips.summary(tripId) });
            queryClient.invalidateQueries({ queryKey: queryKeys.trips.detail(tripId) });
        },
    });
}

// ============================================================
// Dispute Payment
// ============================================================

export function useDisputePayment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ tripId, transactionId }: { tripId: string; transactionId: string }) => {
            const response = await settlementsApi.disputePayment(tripId, transactionId);
            return response.data?.settlement;
        },
        onSuccess: (_, { tripId }) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.settlements.detail(tripId) });
        },
    });
}

// ============================================================
// Get Settlement History
// ============================================================

export function useSettlementHistory(tripId: string) {
    return useQuery({
        queryKey: queryKeys.settlements.history(tripId),
        queryFn: async () => {
            const response = await settlementsApi.getSettlementHistory(tripId);
            return response.data;
        },
        enabled: !!tripId,
    });
}

// ============================================================
// Get My Settlements
// ============================================================

export function useMySettlements() {
    return useQuery({
        queryKey: ['settlements', 'mine'],
        queryFn: async () => {
            const response = await settlementsApi.getMySettlements();
            return response.data;
        },
    });
}

// ============================================================
// Get Settlement Summary
// ============================================================

export function useSettlementSummary(tripId: string) {
    return useQuery({
        queryKey: queryKeys.settlements.summary(tripId),
        queryFn: async () => {
            const response = await settlementsApi.getSummary(tripId);
            return response.data;
        },
        enabled: !!tripId,
    });
}

// ============================================================
// Retry Payment
// ============================================================

export function useRetryPayment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ tripId, transactionId }: { tripId: string; transactionId: string }) => {
            const response = await settlementsApi.retryPayment(tripId, transactionId);
            return response.data;
        },
        onSuccess: (_, { tripId }) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.settlements.detail(tripId) });
            queryClient.invalidateQueries({ queryKey: queryKeys.settlements.summary(tripId) });
        },
    });
}
