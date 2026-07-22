// hooks/useJoinRequests.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { joinRequestsApi } from '../../core/api/services/joinRequests.api';

export function useAdminJoinRequests() {
    return useQuery({
        queryKey: ['admin-join-requests'],
        queryFn: async () => {
            const response = await joinRequestsApi.getAllAdminPending();
            
            // ✅ Handle standardized backend response: { success: true, data: { requests: [...] } }
            if (response?.data?.requests) {
                return response.data.requests;
            }
            
            // Fallback
            if (Array.isArray(response?.data)) {
                return response.data;
            }
            
            if (Array.isArray(response)) {
                return response;
            }
            
            return [];
        },
        staleTime: 15000,
    });
}

export function usePendingJoinRequests(tripId: string) {
    return useQuery({
        queryKey: ['trips', tripId, 'join-requests'],
        queryFn: async () => {
            const response = await joinRequestsApi.getPending(tripId);
            
            if (response?.data?.requests) {
                return response.data.requests;
            }
            
            if (Array.isArray(response?.data)) {
                return response.data;
            }
            
            return [];
        },
        enabled: !!tripId,
    });
}

export function useApproveJoinRequest(tripId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (requestId: string) => {
            const response = await joinRequestsApi.approve(tripId, requestId);
            return response.data?.trip;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-join-requests'] });
            queryClient.invalidateQueries({ queryKey: ['trips', tripId, 'join-requests'] });
            queryClient.invalidateQueries({ queryKey: ['trips', tripId] });
            queryClient.invalidateQueries({ queryKey: ['trips'] });
        },
    });
}

export function useRejectJoinRequest(tripId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (requestId: string) => {
            return joinRequestsApi.reject(tripId, requestId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-join-requests'] });
            queryClient.invalidateQueries({ queryKey: ['trips', tripId, 'join-requests'] });
        },
    });
}
