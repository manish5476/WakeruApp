import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subscriptionApi } from '../services/api/subscription.api';
import {
  IUserEntitlements,
  ILimitStatus,
  ILimitConfig,
} from '../types/subscription.types';
import { useAuthStore } from '../stores/auth.store';
import { showToast } from '../utils/toast';

export const ENTITLEMENTS_QUERY_KEY = ['subscription', 'entitlements'];
export const PLANS_QUERY_KEY = ['subscription', 'plans'];

export function useEntitlements() {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);

  const {
    data: response,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ENTITLEMENTS_QUERY_KEY,
    queryFn: async () => {
      const res = await subscriptionApi.getEntitlements();
      return res.data;
    },
    enabled: isAuthenticated,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000,
  });

  const entitlements: IUserEntitlements | undefined = response;

  const canUseFeature = (featureKey: string): boolean => {
    if (!entitlements) return false;
    return !!entitlements.features[featureKey];
  };

  const getLimit = (limitKey: string): ILimitConfig | undefined => {
    return entitlements?.limits[limitKey];
  };

  const getUsage = (limitKey: string): number => {
    return entitlements?.usage[limitKey] || 0;
  };

  const getRemaining = (limitKey: string): number | null => {
    if (!entitlements) return null;
    const limit = entitlements.limits[limitKey];
    if (!limit || limit.unlimited || limit.value === null) return null;
    return (
      entitlements.remaining[limitKey] ??
      Math.max(0, limit.value - (entitlements.usage[limitKey] || 0))
    );
  };

  const isLimitReached = (limitKey: string): boolean => {
    if (!entitlements) return false;
    const limit = entitlements.limits[limitKey];
    if (!limit || limit.unlimited || limit.value === null) return false;
    const used = entitlements.usage[limitKey] || 0;
    return used >= limit.value;
  };

  const getLimitStatus = (limitKey: string): ILimitStatus => {
    const used = getUsage(limitKey);
    const limitConfig = getLimit(limitKey);

    if (!limitConfig || limitConfig.unlimited || limitConfig.value === null) {
      return {
        isReached: false,
        isApproaching: false,
        used,
        total: null,
        remaining: null,
        percent: 0,
      };
    }

    const total = limitConfig.value;
    const remaining = Math.max(0, total - used);
    const percent =
      total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 100;
    const isReached = used >= total;
    const isApproaching = !isReached && percent >= 80;

    return {
      isReached,
      isApproaching,
      used,
      total,
      remaining,
      percent,
    };
  };

  // Mutation to simulate instant upgrade / purchase (ideal for sandbox/dev testing)
  const upgradeMutation = useMutation({
    mutationFn: async (planKey: string) => {
      const res = await subscriptionApi.simulatePurchase(planKey);
      return res.data;
    },
    onSuccess: updatedData => {
      queryClient.setQueryData(ENTITLEMENTS_QUERY_KEY, updatedData);
      queryClient.invalidateQueries({ queryKey: ENTITLEMENTS_QUERY_KEY });
      showToast.success(
        'Plan Upgraded! 🌟',
        'Your subscription privileges have been updated.',
      );
    },
  });

  return {
    entitlements,
    plan: entitlements?.plan,
    planKey: entitlements?.plan.key || 'free',
    planName: entitlements?.plan.name || 'Free',
    isPaid: !!entitlements?.isPaid,
    isLoading,
    isError,
    error,
    canUseFeature,
    getLimit,
    getUsage,
    getRemaining,
    isLimitReached,
    getLimitStatus,
    refetchEntitlements: refetch,
    upgradePlan: upgradeMutation.mutateAsync,
    isUpgrading: upgradeMutation.isPending,
  };
}

/**
 * Hook to fetch all public plans for pricing comparison table
 */
export function usePublicPlans() {
  return useQuery({
    queryKey: PLANS_QUERY_KEY,
    queryFn: async () => {
      const res = await subscriptionApi.getPublicPlans();
      return res.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}
