import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settlementsApi } from '../services/api';
import { queryKeys } from './queryKeys';
import { showToast } from '../utils/toast';
import { settlementRepository } from '../repositories/settlement.repository';

// ============================================================
// Get/Create Settlement
// ============================================================

export function useSettlement(tripId: string) {
  return useQuery({
    queryKey: queryKeys.settlements.detail(tripId),
    queryFn: async () => {
      const isMongoId = /^[a-f\d]{24}$/i.test(tripId);
      if (!isMongoId) {
        const localSummary =
          await settlementRepository.getTripSettlement(tripId);
        return {
          settlement: {
            ...localSummary,
            baseCurrency: 'INR',
            totalTransactions: localSummary.transactions?.length || 0,
            pendingCount: localSummary.transactions?.length || 0,
            initiatedCount: 0,
            confirmedCount: 0,
            disputedCount: 0,
            totalAmount:
              localSummary.transactions?.reduce(
                (sum, t) => sum + (t.amount || 0),
                0,
              ) || 0,
          },
          summary: localSummary,
        } as any;
      }
      try {
        const response = await settlementsApi.getSettlement(tripId);
        if (response.data) {
          await settlementRepository
            .reconcileServerSettlement(tripId, response.data)
            .catch(() => {});
        }
        return response.data;
      } catch {
        const localSummary =
          await settlementRepository.getTripSettlement(tripId);
        return {
          settlement: {
            ...localSummary,
            baseCurrency: 'INR',
            totalTransactions: localSummary.transactions?.length || 0,
            pendingCount: localSummary.transactions?.length || 0,
            initiatedCount: 0,
            confirmedCount: 0,
            disputedCount: 0,
            totalAmount:
              localSummary.transactions?.reduce(
                (sum, t) => sum + (t.amount || 0),
                0,
              ) || 0,
          },
          summary: localSummary,
        } as any;
      }
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
      if (!tripId) throw new Error('Trip ID is required');

      const isMongoId = /^[a-f\d]{24}$/i.test(tripId);
      if (!isMongoId) {
        const localSummary =
          await settlementRepository.computeLocalSettlement(tripId);
        const normalizedSettlement = {
          ...localSummary,
          baseCurrency: 'INR',
          totalTransactions: localSummary.transactions?.length || 0,
          pendingCount: localSummary.transactions?.length || 0,
          initiatedCount: 0,
          confirmedCount: 0,
          disputedCount: 0,
          totalAmount:
            localSummary.transactions?.reduce(
              (sum, t) => sum + (t.amount || 0),
              0,
            ) || 0,
        };
        queryClient.setQueryData(queryKeys.settlements.detail(tripId), {
          settlement: normalizedSettlement,
          summary: localSummary,
        });
        return normalizedSettlement;
      }

      try {
        const response = await settlementsApi.calculateSettlement(tripId);
        return response.data?.settlement;
      } catch (err: any) {
        // If offline or validation/network error, fallback to offline local computation
        try {
          const localSummary =
            await settlementRepository.computeLocalSettlement(tripId);
          const normalizedSettlement = {
            ...localSummary,
            baseCurrency: 'INR',
            totalTransactions: localSummary.transactions?.length || 0,
            pendingCount: localSummary.transactions?.length || 0,
            initiatedCount: 0,
            confirmedCount: 0,
            disputedCount: 0,
            totalAmount:
              localSummary.transactions?.reduce(
                (sum, t) => sum + (t.amount || 0),
                0,
              ) || 0,
          };
          queryClient.setQueryData(queryKeys.settlements.detail(tripId), {
            settlement: normalizedSettlement,
            summary: localSummary,
          });
          return normalizedSettlement;
        } catch {
          throw err;
        }
      }
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
    onSuccess: (data: any, { tripId }) => {
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
      showToast.success(
        'Payment Confirmed! 🎉',
        'Transfer confirmed and balance settled.',
      );
      if (data?.notificationStatus === 'FAILED') {
        showToast.info(
          'Notification Queued',
          'Payment is recorded. Recipient notification will sync shortly.',
        );
      }
    },
    onError: (err: any) => {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Could not confirm payment.';
      showToast.error('Confirmation Failed', message);
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
    onSuccess: (data: any, { tripId }) => {
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
      showToast.success(
        'Payment Confirmed! 🎉',
        'Transfer confirmed and balance settled.',
      );
      if (data?.notificationStatus === 'FAILED') {
        showToast.info(
          'Notification Queued',
          'Payment is recorded. Recipient notification will sync shortly.',
        );
      }
    },
    onError: (err: any) => {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Could not confirm transaction.';
      showToast.error('Confirmation Failed', message);
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
    onSuccess: (data: any, { tripId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.settlements.detail(tripId),
      });
      showToast.success(
        'Transfers Marked as Sent 💸',
        'Recipients notified to confirm receipt.',
      );
      if (data?.notificationStatus === 'FAILED') {
        showToast.info(
          'Notification Pending',
          'Payments initiated. Notification delivery will retry.',
        );
      }
    },
    onError: (err: any) => {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Could not initiate transfers.';
      showToast.error('Action Failed', message);
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
    onSuccess: (data: any, { tripId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.settlements.detail(tripId),
      });
      showToast.success(
        'Payments Marked as Sent 💸',
        'Selected payments updated.',
      );
      if (data?.notificationStatus === 'FAILED') {
        showToast.info(
          'Notification Pending',
          'Payments initiated. Notification delivery will retry.',
        );
      }
    },
    onError: (err: any) => {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Could not initiate selected payments.';
      showToast.error('Action Failed', message);
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
    onSuccess: (data: any, { tripId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.settlements.detail(tripId),
      });
      showToast.success(
        'Payment Marked as Sent 💸',
        'Recipient notified to confirm receipt.',
      );
      if (data?.notificationStatus === 'FAILED') {
        showToast.info(
          'Notification Pending',
          'Payment recorded. Notification delivery will retry.',
        );
      }
    },
    onError: (err: any) => {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Could not mark payment as sent.';
      showToast.error('Action Failed', message);
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
      showToast.info('Payment Rejected', 'Payer notified to retry transfer.');
    },
  });
}

// ============================================================
// Revert Payment — Reset initiated/confirmed payment back to pending
// ============================================================

export function useRevertPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tripId,
      transactionId,
      reason,
    }: {
      tripId: string;
      transactionId: string;
      reason?: string;
    }) => {
      const response = await settlementsApi.revertPayment(
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
      queryClient.invalidateQueries({ queryKey: ['settlements'] });
      queryClient.invalidateQueries({
        queryKey: queryKeys.expenses.byTrip(tripId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.trips.summary(tripId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.trips.detail(tripId),
      });
      queryClient.invalidateQueries({ queryKey: ['balances'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      showToast.info('Payment Reverted', 'Transaction reset back to pending.');
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
    onSuccess: () => {
      showToast.success(
        'Reminder Sent! 🔔',
        'A gentle reminder was sent to the payer.',
      );
    },
    onError: (err: any) => {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Could not send reminder.';
      showToast.error('Reminder Failed', message);
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
      showToast.warning(
        'Dispute Flagged ⚠️',
        'Flagged for review by the trip admin.',
      );
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
