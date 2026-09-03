import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settlementsApi } from '../services/api';
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
    staleTime: 15 * 1000, // Cache for 15s to avoid duplicate recalculations
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
      queryClient.invalidateQueries({
        queryKey: queryKeys.settlements.detail(tripId),
      });
    },
  });
}

// ============================================================
// Initiate UPI Payment
// ============================================================

export function useInitiatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tripId,
      transactionId,
    }: {
      tripId: string;
      transactionId: string;
    }) => {
      const response = await settlementsApi.initiatePayment(
        tripId,
        transactionId,
      );
      return response.data;
    },
    onSuccess: (_, { tripId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.settlements.detail(tripId),
      });
    },
  });
}

// ============================================================
// Confirm Payment (legacy body-based)
// ============================================================

export function useConfirmPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tripId,
      transactionId,
    }: {
      tripId: string;
      transactionId: string;
    }) => {
      const response = await settlementsApi.confirmPayment(
        tripId,
        transactionId,
      );
      return response.data;
    },
    onSuccess: (_, { tripId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.settlements.detail(tripId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.expenses.byTrip(tripId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.trips.summary(tripId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.trips.detail(tripId),
      });
    },
  });
}

// ============================================================
// Confirm Transaction (URL-based, preferred)
// ============================================================

export function useConfirmTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tripId,
      transactionId,
      notes,
    }: {
      tripId: string;
      transactionId: string;
      notes?: string;
    }) => {
      const response = await settlementsApi.confirmTransaction(
        tripId,
        transactionId,
        notes,
      );
      return response.data;
    },
    onSuccess: (_, { tripId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.settlements.detail(tripId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.expenses.byTrip(tripId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.trips.summary(tripId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.trips.detail(tripId),
      });
    },
  });
}

// ============================================================
// Settle All — Payer initiates all outstanding payments
// ============================================================

export function useSettleAll() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tripId }: { tripId: string }) => {
      const response = await settlementsApi.settleAll(tripId);
      return response.data;
    },
    onSuccess: (_, { tripId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.settlements.detail(tripId),
      });
    },
  });
}

// ============================================================
// Settle Selected — Payer initiates chosen transactions
// ============================================================

export function useSettleSelected() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tripId,
      transactionIds,
    }: {
      tripId: string;
      transactionIds: string[];
    }) => {
      const response = await settlementsApi.settleSelected(
        tripId,
        transactionIds,
      );
      return response.data;
    },
    onSuccess: (_, { tripId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.settlements.detail(tripId),
      });
    },
  });
}

// ============================================================
// Settle Single — Payer marks a single payment as paid
// ============================================================

export function useSettleSingle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tripId,
      transactionId,
    }: {
      tripId: string;
      transactionId: string;
    }) => {
      const response = await settlementsApi.settleSingle(tripId, transactionId);
      return response.data;
    },
    onSuccess: (_, { tripId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.settlements.detail(tripId),
      });
    },
  });
}

// ============================================================
// Reject Payment — Receiver rejects a payment claim
// ============================================================

export function useRejectPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tripId,
      transactionId,
      reason,
    }: {
      tripId: string;
      transactionId: string;
      reason: string;
    }) => {
      const response = await settlementsApi.rejectPayment(
        tripId,
        transactionId,
        reason,
      );
      return response.data;
    },
    onSuccess: (_, { tripId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.settlements.detail(tripId),
      });
    },
  });
}

// ============================================================
// Remind Payer — Receiver sends a 30-min-cooldown reminder
// ============================================================

export function useRemindPayer() {
  return useMutation({
    mutationFn: async ({
      tripId,
      transactionId,
    }: {
      tripId: string;
      transactionId: string;
    }) => {
      const response = await settlementsApi.remindPayer(tripId, transactionId);
      return response.data;
    },
  });
}

// ============================================================
// Dispute Payment
// ============================================================

export function useDisputePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tripId,
      transactionId,
    }: {
      tripId: string;
      transactionId: string;
    }) => {
      const response = await settlementsApi.disputePayment(
        tripId,
        transactionId,
      );
      return response.data?.settlement;
    },
    onSuccess: (_, { tripId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.settlements.detail(tripId),
      });
    },
  });
}

// ============================================================
// Get Settlement History
// ============================================================

export function useSettlementHistory(
  tripId: string,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: queryKeys.settlements.history(tripId),
    queryFn: async () => {
      const response = await settlementsApi.getSettlementHistory(tripId);
      const data = response?.data;
      if (Array.isArray(data)) return data;
      if (Array.isArray((data as any)?.data)) return (data as any).data;
      if (Array.isArray((data as any)?.history)) return (data as any).history;
      return [];
    },
    enabled: (options?.enabled ?? true) && !!tripId,
    staleTime: 30 * 1000,
  });
}

// ============================================================
// Get My Settlements
// ============================================================

export function useMySettlements() {
  return useQuery({
    queryKey: queryKeys.settlements.mine,
    queryFn: async () => {
      const response = await settlementsApi.getMySettlements();
      return response.data;
    },
    staleTime: 10 * 1000,
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
    staleTime: 15 * 1000,
  });
}

// ============================================================
// Retry Payment
// ============================================================

export function useRetryPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tripId,
      transactionId,
    }: {
      tripId: string;
      transactionId: string;
    }) => {
      const response = await settlementsApi.retryPayment(tripId, transactionId);
      return response.data;
    },
    onSuccess: (_, { tripId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.settlements.detail(tripId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.settlements.summary(tripId),
      });
    },
  });
}
