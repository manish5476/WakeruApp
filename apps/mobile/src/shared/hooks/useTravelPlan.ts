// hooks/useTravelPlan.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tripsApi } from '../../core/api/services/trips.api';
import { queryKeys } from './queryKeys';
import { ITravelPlan, IContact } from '../types/travelPlan.types';

// ───────────────────────────────────────────────────────────────────────────
// PLAN & BUDGET HOOKS
// ───────────────────────────────────────────────────────────────────────────

export function useTravelPlan(tripId: string) {
    return useQuery({
        queryKey: [...queryKeys.trips.detail(tripId), 'plan'],
        queryFn: async () => {
            const response = await tripsApi.getTravelPlan(tripId);
            // API returns: { status, data: { ...planFields } }
            // apiClient.get() unwraps axios .data, so `response` = { status, data: planObject }
            return response.data as unknown as ITravelPlan;
        },
        enabled: !!tripId,
    });
}

export function useUpdateTravelPlan(tripId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Partial<ITravelPlan>) => tripsApi.updateTravelPlan(tripId, data),
        onSuccess: (response) => {
            queryClient.setQueryData([...queryKeys.trips.detail(tripId), 'plan'], response.data);
        },
    });
}


export function useUpdateBudget(tripId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => tripsApi.updateBudget(tripId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [...queryKeys.trips.detail(tripId), 'plan'] });
        },
    });
}

// ───────────────────────────────────────────────────────────────────────────
// CHECKLIST HOOKS
// ───────────────────────────────────────────────────────────────────────────

export function useAddChecklistItem(tripId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => tripsApi.addChecklistItem(tripId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [...queryKeys.trips.detail(tripId), 'plan'] });
        },
    });
}

export function useToggleChecklistItem(tripId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (itemId: string) => tripsApi.toggleChecklistItem(tripId, itemId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [...queryKeys.trips.detail(tripId), 'plan'] });
        },
    });
}

export function useUpdateChecklistItem(tripId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ itemId, data }: { itemId: string; data: any }) =>
            tripsApi.updateChecklistItem(tripId, itemId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [...queryKeys.trips.detail(tripId), 'plan'] });
        },
    });
}

export function useDeleteChecklistItem(tripId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (itemId: string) => tripsApi.deleteChecklistItem(tripId, itemId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [...queryKeys.trips.detail(tripId), 'plan'] });
        },
    });
}

// ───────────────────────────────────────────────────────────────────────────
// ITINERARY HOOKS
// ───────────────────────────────────────────────────────────────────────────

export function useAddItineraryDay(tripId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => tripsApi.addItineraryDay(tripId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [...queryKeys.trips.detail(tripId), 'plan'] });
        },
    });
}

export function useUpdateItineraryDay(tripId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ dayId, data }: { dayId: string; data: any }) =>
            tripsApi.updateItineraryDay(tripId, dayId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [...queryKeys.trips.detail(tripId), 'plan'] });
        },
    });
}

export function useDeleteItineraryDay(tripId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (dayId: string) => tripsApi.deleteItineraryDay(tripId, dayId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [...queryKeys.trips.detail(tripId), 'plan'] });
        },
    });
}

export function useGenerateItinerary(tripId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => tripsApi.generateItinerary(tripId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [...queryKeys.trips.detail(tripId), 'plan'] });
        },
    });
}

// ───────────────────────────────────────────────────────────────────────────
// FLIGHT HOOKS
// ───────────────────────────────────────────────────────────────────────────

export function useAddFlight(tripId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => tripsApi.addFlight(tripId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [...queryKeys.trips.detail(tripId), 'plan'] });
        },
    });
}

export function useUpdateFlight(tripId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ flightId, data }: { flightId: string; data: any }) =>
            tripsApi.updateFlight(tripId, flightId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [...queryKeys.trips.detail(tripId), 'plan'] });
        },
    });
}

export function useDeleteFlight(tripId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (flightId: string) => tripsApi.deleteFlight(tripId, flightId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [...queryKeys.trips.detail(tripId), 'plan'] });
        },
    });
}
// export function useDeleteTransport(tripId: string) {
//     const queryClient = useQueryClient();
//     return useMutation({
//         mutationFn: (transportId: string) => tripsApi.deleteTransport(tripId, transportId),
//         onSuccess: () => {
//             queryClient.invalidateQueries({ queryKey: [...queryKeys.trips.detail(tripId), 'plan'] });
//         },
//     });
// }

// ───────────────────────────────────────────────────────────────────────────
// PACKING LIST HOOKS
// ───────────────────────────────────────────────────────────────────────────

// export function useDeletePackingItem(tripId: string) {
//     const queryClient = useQueryClient();
//     return useMutation({
//         mutationFn: ({ categoryId, itemId }: { categoryId: string; itemId: string }) => 
//             tripsApi.deletePackingItem(tripId, categoryId, itemId),
//         onSuccess: () => {
//             queryClient.invalidateQueries({ queryKey: [...queryKeys.trips.detail(tripId), 'plan'] });
//         },
//     });
// }
// ───────────────────────────────────────────────────────────────────────────
// ACCOMMODATION HOOKS
// ───────────────────────────────────────────────────────────────────────────

export function useAddAccommodation(tripId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => tripsApi.addAccommodation(tripId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [...queryKeys.trips.detail(tripId), 'plan'] });
        },
    });
}

export function useUpdateAccommodation(tripId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ accommodationId, data }: { accommodationId: string; data: any }) =>
            tripsApi.updateAccommodation(tripId, accommodationId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [...queryKeys.trips.detail(tripId), 'plan'] });
        },
    });
}

export function useDeleteAccommodation(tripId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (accommodationId: string) => tripsApi.deleteAccommodation(tripId, accommodationId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [...queryKeys.trips.detail(tripId), 'plan'] });
        },
    });
}

// ───────────────────────────────────────────────────────────────────────────
// TRANSPORT HOOKS
// ───────────────────────────────────────────────────────────────────────────

export function useAddTransport(tripId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => tripsApi.addTransport(tripId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [...queryKeys.trips.detail(tripId), 'plan'] });
        },
    });
}

// ───────────────────────────────────────────────────────────────────────────
// PACKING LIST HOOKS
// ───────────────────────────────────────────────────────────────────────────

export function useAddPackingItem(tripId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => tripsApi.addPackingItem(tripId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [...queryKeys.trips.detail(tripId), 'plan'] });
        },
    });
}

export function useTogglePackingItem(tripId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ categoryId, itemId }: { categoryId: string; itemId: string }) =>
            tripsApi.togglePackingItem(tripId, categoryId, itemId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [...queryKeys.trips.detail(tripId), 'plan'] });
        },
    });
}

export function useInitializePackingList(tripId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => tripsApi.initializePackingList(tripId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [...queryKeys.trips.detail(tripId), 'plan'] });
        },
    });
}

// ───────────────────────────────────────────────────────────────────────────
// DOCUMENTS HOOKS
// ───────────────────────────────────────────────────────────────────────────

export function useAddDocument(tripId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => tripsApi.addDocument(tripId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [...queryKeys.trips.detail(tripId), 'plan'] });
        },
    });
}

export function useVerifyDocument(tripId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (documentId: string) => tripsApi.verifyDocument(tripId, documentId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [...queryKeys.trips.detail(tripId), 'plan'] });
        },
    });
}

// ───────────────────────────────────────────────────────────────────────────
// CONTACTS HOOKS (NEW)
// ───────────────────────────────────────────────────────────────────────────

export function useGetContacts(tripId: string) {
    return useQuery({
        queryKey: [...queryKeys.trips.detail(tripId), 'contacts'],
        queryFn: async () => {
            const response = await tripsApi.getContacts(tripId);
            return response.data?.data as IContact[];
        },
        enabled: !!tripId,
    });
}

export function useAddContact(tripId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Partial<IContact>) => tripsApi.addContact(tripId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [...queryKeys.trips.detail(tripId), 'plan'] });
            queryClient.invalidateQueries({ queryKey: [...queryKeys.trips.detail(tripId), 'contacts'] });
        },
    });
}

export function useUpdateContact(tripId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ contactId, data }: { contactId: string; data: Partial<IContact> }) =>
            tripsApi.updateContact(tripId, contactId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [...queryKeys.trips.detail(tripId), 'plan'] });
            queryClient.invalidateQueries({ queryKey: [...queryKeys.trips.detail(tripId), 'contacts'] });
        },
    });
}

export function useDeleteContact(tripId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (contactId: string) => tripsApi.deleteContact(tripId, contactId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [...queryKeys.trips.detail(tripId), 'plan'] });
            queryClient.invalidateQueries({ queryKey: [...queryKeys.trips.detail(tripId), 'contacts'] });
        },
    });
}

export function useSetPrimaryContact(tripId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ contactId, type }: { contactId: string; type: string }) =>
            tripsApi.setPrimaryContact(tripId, contactId, type),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [...queryKeys.trips.detail(tripId), 'plan'] });
            queryClient.invalidateQueries({ queryKey: [...queryKeys.trips.detail(tripId), 'contacts'] });
        },
    });
}

// ───────────────────────────────────────────────────────────────────────────
// ACTIVATION & COMPLETION HOOKS
// ───────────────────────────────────────────────────────────────────────────

export function useActivateTrip(tripId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => tripsApi.activateTravelPlan(tripId),
        onSuccess: (response) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.trips.all });
            queryClient.setQueryData(queryKeys.trips.detail(tripId), response.data?.trip);
        },
    });
}

export function useCompleteTrip(tripId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => tripsApi.completeTrip(tripId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.trips.all });
            queryClient.invalidateQueries({ queryKey: queryKeys.trips.detail(tripId) });
        },
    });
}

// ───────────────────────────────────────────────────────────────────────────
// PROGRESS & SUMMARY HOOKS
// ───────────────────────────────────────────────────────────────────────────

export function usePlanningProgress(tripId: string) {
    return useQuery({
        queryKey: [...queryKeys.trips.detail(tripId), 'progress'],
        queryFn: async () => {
            const response = await tripsApi.getPlanningProgress(tripId);
            return response.data?.data;
        },
        enabled: !!tripId,
    });
}

export function useTripSummary(tripId: string) {
    return useQuery({
        queryKey: [...queryKeys.trips.detail(tripId), 'summary'],
        queryFn: async () => {
            const response = await tripsApi.getTripSummary(tripId);
            return response.data;
        },
        enabled: !!tripId,
    });
}


// ───────────────────────────────────────────────────────────────────────────
// TRANSPORT HOOKS
// ───────────────────────────────────────────────────────────────────────────

export function useDeleteTransport(tripId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (transportId: string) => tripsApi.deleteTransport(tripId, transportId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [...queryKeys.trips.detail(tripId), 'plan'] });
        },
    });
}

// ───────────────────────────────────────────────────────────────────────────
// PACKING LIST HOOKS
// ───────────────────────────────────────────────────────────────────────────

export function useDeletePackingItem(tripId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ categoryId, itemId }: { categoryId: string; itemId: string }) =>
            tripsApi.deletePackingItem(tripId, categoryId, itemId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [...queryKeys.trips.detail(tripId), 'plan'] });
        },
    });
}
// ───────────────────────────────────────────────────────────────────────────
// COMPOSED MUTATIONS HOOK (For convenience)
// ───────────────────────────────────────────────────────────────────────────

export function usePlanMutations(tripId: string) {
    const updatePlan = useUpdateTravelPlan(tripId);
    const updateBudget = useUpdateBudget(tripId);
    const addChecklist = useAddChecklistItem(tripId);
    const toggleChecklist = useToggleChecklistItem(tripId);
    const deleteChecklist = useDeleteChecklistItem(tripId);
    const addItinerary = useAddItineraryDay(tripId);
    const deleteItinerary = useDeleteItineraryDay(tripId);
    const generateItinerary = useGenerateItinerary(tripId);
    const addFlight = useAddFlight(tripId);
    const deleteFlight = useDeleteFlight(tripId);
    const addHotel = useAddAccommodation(tripId);
    const deleteHotel = useDeleteAccommodation(tripId);
    const addTransport = useAddTransport(tripId);
    const deleteTransport = useDeleteTransport(tripId); // ← Add this
    const addPacking = useAddPackingItem(tripId);
    const togglePacking = useTogglePackingItem(tripId);
    const deletePacking = useDeletePackingItem(tripId); // ← Add this
    const addContact = useAddContact(tripId);
    const updateContact = useUpdateContact(tripId);
    const deleteContact = useDeleteContact(tripId);
    const setPrimaryContact = useSetPrimaryContact(tripId);
    const activateTrip = useActivateTrip(tripId);
    const completeTrip = useCompleteTrip(tripId);
    const initializePacking = useInitializePackingList(tripId);

    return {
        // Plan
        updatePlan: updatePlan.mutate,
        updateBudget: updateBudget.mutate,

        // Checklist
        addChecklistItem: addChecklist.mutate,
        toggleChecklistItem: toggleChecklist.mutate,
        deleteChecklistItem: deleteChecklist.mutate,

        // Itinerary
        addItineraryDay: addItinerary.mutate,
        deleteItineraryDay: deleteItinerary.mutate,
        generateItinerary: generateItinerary.mutate,

        // Bookings
        addFlight: addFlight.mutate,
        deleteFlight: deleteFlight.mutate,
        addHotel: addHotel.mutate,
        deleteHotel: deleteHotel.mutate,
        addTransport: addTransport.mutate,
        deleteTransport: deleteTransport.mutate, // ← Add this

        // Packing
        addPackingItem: addPacking.mutate,
        togglePackingItem: togglePacking.mutate,
        deletePackingItem: deletePacking.mutate, // ← Add this
        initializePackingList: initializePacking.mutate,

        // Contacts
        addContact: addContact.mutate,
        updateContact: updateContact.mutate,
        deleteContact: deleteContact.mutate,
        setPrimaryContact: setPrimaryContact.mutate,

        // Trip Actions
        activateTrip: activateTrip.mutate,
        completeTrip: completeTrip.mutate,

        // Loading states
        isMutating:
            updatePlan.isPending ||
            updateBudget.isPending ||
            addChecklist.isPending ||
            toggleChecklist.isPending ||
            deleteChecklist.isPending ||
            addItinerary.isPending ||
            deleteItinerary.isPending ||
            addFlight.isPending ||
            deleteFlight.isPending ||
            addHotel.isPending ||
            deleteHotel.isPending ||
            addTransport.isPending ||
            deleteTransport.isPending || // ← Add this
            addPacking.isPending ||
            togglePacking.isPending ||
            deletePacking.isPending || // ← Add this
            addContact.isPending ||
            updateContact.isPending ||
            deleteContact.isPending ||
            setPrimaryContact.isPending ||
            generateItinerary.isPending ||
            activateTrip.isPending ||
            completeTrip.isPending ||
            initializePacking.isPending
    };
}
