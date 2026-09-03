import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { remindersApi } from '../services/api/reminders.api';
import { queryKeys } from './queryKeys';

export function useReminders(filters?: {
  status?: string;
  type?: string;
  tripId?: string;
  targetUserId?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: queryKeys.reminders.list(filters),
    queryFn: async () => {
      const response = await remindersApi.getMyReminders(filters);
      return response.data?.reminders || [];
    },
    staleTime: 15000,
  });
}

export function useIncomingReminders() {
  return useQuery({
    queryKey: queryKeys.reminders.incoming,
    queryFn: async () => {
      const response = await remindersApi.getIncomingReminders();
      return response.data?.reminders || [];
    },
    staleTime: 15000,
  });
}

export function useTripReminders(tripId: string) {
  return useQuery({
    queryKey: queryKeys.reminders.byTrip(tripId),
    queryFn: async () => {
      const response = await remindersApi.getTripReminders(tripId);
      return response.data?.reminders || [];
    },
    enabled: !!tripId,
    staleTime: 15000,
  });
}

export function useCreateReminder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: remindersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reminders.all });
    },
  });
}

export function useCreateSettlementReminder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: remindersApi.createSettlementReminder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reminders.all });
    },
  });
}

export function useCreateBudgetReminder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: remindersApi.createBudgetReminder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reminders.all });
    },
  });
}

export function usePauseReminder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: remindersApi.pause,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.reminders.all }),
  });
}

export function useResumeReminder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: remindersApi.resume,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.reminders.all }),
  });
}

export function useCancelReminder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      reminderId,
      reason,
    }: {
      reminderId: string;
      reason?: string;
    }) => remindersApi.cancel(reminderId, reason),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.reminders.all }),
  });
}

export function usePingUser() {
  return useMutation({
    mutationFn: remindersApi.pingUser,
  });
}
