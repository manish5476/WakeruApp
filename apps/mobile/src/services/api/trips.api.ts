import apiClient, { ApiResponse, PaginatedResponse } from './client';
import { ITrip } from '../../types/trip.types';
import { IContact, ITravelPlan } from '../../types/travelPlan.types';

export const tripsApi = {
  // ───────────────────────────────────────────────────────────────────────────
  // TRIP TEMPLATES & CREATION
  // ───────────────────────────────────────────────────────────────────────────

  getTemplates: async (): Promise<ApiResponse<{ templates: any[] }>> => {
    return apiClient.get('/trips/templates');
  },

  createFromTemplate: async (
    template: string,
    data: any,
  ): Promise<ApiResponse<{ trip: ITrip }>> => {
    return apiClient.post(`/trips/template/${template}`, data);
  },

  create: async (data: any): Promise<ApiResponse<{ trip: ITrip }>> => {
    return apiClient.post('/trips', data);
  },

  // ───────────────────────────────────────────────────────────────────────────
  // TRIP CORE CRUD
  // ───────────────────────────────────────────────────────────────────────────

  getMyTrips: async (
    params?: any,
  ): Promise<
    ApiResponse<{
      trips: ITrip[];
      pagination: {
        totalCount: number;
        totalPages: number;
        page: number;
        limit: number;
      };
      stats: {
        activeTripsCount: number;
        totalSpentBase: number;
        totalCountries: number;
        totalTravelers: number;
      };
    }>
  > => {
    return apiClient.get('/trips', { params });
  },

  getTrip: async (tripId: string): Promise<ApiResponse<{ trip: ITrip }>> => {
    return apiClient.get(`/trips/${tripId}`);
  },

  updateTrip: async (
    tripId: string,
    data: any,
  ): Promise<ApiResponse<{ trip: ITrip }>> => {
    return apiClient.patch(`/trips/${tripId}`, data);
  },

  archiveTrip: async (tripId: string): Promise<ApiResponse<void>> => {
    return apiClient.delete(`/trips/${tripId}`);
  },

  unarchiveTrip: async (tripId: string): Promise<ApiResponse<void>> => {
    return apiClient.post(`/trips/${tripId}/unarchive`);
  },

  deleteTripPermanent: async (tripId: string): Promise<ApiResponse<void>> => {
    return apiClient.delete(`/trips/${tripId}/permanent`);
  },

  // ───────────────────────────────────────────────────────────────────────────
  // TRIP DASHBOARD & INSIGHTS
  // ───────────────────────────────────────────────────────────────────────────

  // Core Trip Dashboard Summary (Balances, Budget Health, etc.)
  getTripSummary: async (
    tripId: string,
  ): Promise<ApiResponse<{ summary: any }>> => {
    return apiClient.get(`/trips/${tripId}/summary`);
  },

  getInsights: async (tripId: string): Promise<ApiResponse<any>> => {
    return apiClient.get(`/trips/${tripId}/insights`);
  },

  getTripStory: async (
    tripId: string,
  ): Promise<ApiResponse<{ story: any }>> => {
    return apiClient.get(`/trips/${tripId}/story`);
  },

  // ───────────────────────────────────────────────────────────────────────────
  // STOPS API
  // ───────────────────────────────────────────────────────────────────────────

  addStop: async (
    tripId: string,
    data: any,
  ): Promise<ApiResponse<{ stop: any; trip: ITrip }>> => {
    return apiClient.post(`/trips/${tripId}/stops`, data);
  },

  updateStop: async (
    tripId: string,
    stopId: string,
    data: any,
  ): Promise<ApiResponse<{ stop: any }>> => {
    return apiClient.patch(`/trips/${tripId}/stops/${stopId}`, data);
  },

  updateStopRate: async (
    tripId: string,
    stopId: string,
    data: any,
  ): Promise<ApiResponse<{ stop: any }>> => {
    return apiClient.patch(`/trips/${tripId}/stops/${stopId}/rate`, data);
  },

  reorderStops: async (
    tripId: string,
    stopIds: string[],
  ): Promise<ApiResponse<{ stops: any[] }>> => {
    return apiClient.patch(`/trips/${tripId}/stops/reorder`, { stopIds });
  },

  deleteStop: async (
    tripId: string,
    stopId: string,
  ): Promise<ApiResponse<void>> => {
    return apiClient.delete(`/trips/${tripId}/stops/${stopId}`);
  },

  // ───────────────────────────────────────────────────────────────────────────
  // MEMBERS API
  // ───────────────────────────────────────────────────────────────────────────

  getMembers: async (
    tripId: string,
  ): Promise<ApiResponse<{ members: any[] }>> => {
    return apiClient.get(`/trips/${tripId}/members`);
  },

  addMember: async (
    tripId: string,
    userId: string,
    role = 'member',
  ): Promise<ApiResponse<{ trip: ITrip }>> => {
    return apiClient.post(`/trips/${tripId}/members`, { userId, role });
  },

  updateMemberRole: async (
    tripId: string,
    userId: string,
    role: string,
  ): Promise<ApiResponse<void>> => {
    return apiClient.patch(`/trips/${tripId}/members/${userId}/role`, { role });
  },

  removeMember: async (
    tripId: string,
    userId: string,
  ): Promise<ApiResponse<void>> => {
    return apiClient.delete(`/trips/${tripId}/members/${userId}`);
  },

  // ───────────────────────────────────────────────────────────────────────────
  // INVITES API
  // ───────────────────────────────────────────────────────────────────────────

  getTripPreview: async (
    inviteCode: string,
  ): Promise<ApiResponse<{ trip: any }>> => {
    return apiClient.get(`/trips/join/${inviteCode}`);
  },

  joinTrip: async (
    inviteCode: string,
  ): Promise<ApiResponse<{ joinRequest: any }>> => {
    return apiClient.post(`/trips/join/${inviteCode}`);
  },

  generateInvite: async (
    tripId: string,
    expiresInDays?: number,
  ): Promise<
    ApiResponse<{ inviteCode: string; expiresAt: string; joinUrl: string }>
  > => {
    return apiClient.post(`/trips/${tripId}/invite/generate`, {
      expiresInDays,
    });
  },

  revokeInvite: async (tripId: string): Promise<ApiResponse<void>> => {
    return apiClient.delete(`/trips/${tripId}/invite`);
  },

  // ───────────────────────────────────────────────────────────────────────────
  // JOIN REQUESTS API
  // ───────────────────────────────────────────────────────────────────────────

  getPendingJoinRequests: async (
    tripId: string,
  ): Promise<ApiResponse<{ requests: any[]; count: number }>> => {
    return apiClient.get(`/trips/${tripId}/join-requests`);
  },

  approveJoinRequest: async (
    tripId: string,
    requestId: string,
  ): Promise<ApiResponse<{ trip: ITrip }>> => {
    return apiClient.post(
      `/trips/${tripId}/join-requests/${requestId}/approve`,
    );
  },

  rejectJoinRequest: async (
    tripId: string,
    requestId: string,
  ): Promise<ApiResponse<void>> => {
    return apiClient.post(`/trips/${tripId}/join-requests/${requestId}/reject`);
  },

  getAdminJoinRequests: async (): Promise<
    ApiResponse<{ requests: any[]; count: number }>
  > => {
    return apiClient.get('/trips/join-requests/all');
  },

  // ───────────────────────────────────────────────────────────────────────────
  // TRAVEL PLAN API
  // ───────────────────────────────────────────────────────────────────────────

  getTravelPlan: async (
    tripId: string,
  ): Promise<ApiResponse<{ plan: any }>> => {
    return apiClient.get(`/trips/${tripId}/plan`);
  },

  updateTravelPlan: async (
    tripId: string,
    data: any,
  ): Promise<ApiResponse<{ plan: any }>> => {
    return apiClient.patch(`/trips/${tripId}/plan`, data);
  },

  updatePlanSection: async (
    tripId: string,
    section: string,
    data: any,
  ): Promise<ApiResponse<{ plan: any }>> => {
    return apiClient.patch(`/trips/${tripId}/plan/section/${section}`, data);
  },

  // ───────────────────────────────────────────────────────────────────────────
  // BUDGET
  // ───────────────────────────────────────────────────────────────────────────

  getBudgetAnalysis: async (
    tripId: string,
  ): Promise<ApiResponse<{ data: any }>> => {
    return apiClient.get(`/trips/${tripId}/plan/budget`);
  },

  updateBudget: async (
    tripId: string,
    data: any,
  ): Promise<ApiResponse<{ plan: any }>> => {
    return apiClient.patch(`/trips/${tripId}/plan/budget`, data);
  },

  // ───────────────────────────────────────────────────────────────────────────
  // CHECKLIST
  // ───────────────────────────────────────────────────────────────────────────

  addChecklistItem: async (
    tripId: string,
    data: any,
  ): Promise<ApiResponse<{ plan: any }>> => {
    return apiClient.post(`/trips/${tripId}/plan/checklist`, data);
  },

  updateChecklistItem: async (
    tripId: string,
    itemId: string,
    data: any,
  ): Promise<ApiResponse<{ plan: any }>> => {
    return apiClient.patch(`/trips/${tripId}/plan/checklist/${itemId}`, data);
  },

  toggleChecklistItem: async (
    tripId: string,
    itemId: string,
  ): Promise<ApiResponse<{ plan: any }>> => {
    return apiClient.patch(`/trips/${tripId}/plan/checklist/${itemId}/toggle`);
  },

  deleteChecklistItem: async (
    tripId: string,
    itemId: string,
  ): Promise<ApiResponse<{ plan: any }>> => {
    return apiClient.delete(`/trips/${tripId}/plan/checklist/${itemId}`);
  },

  // ───────────────────────────────────────────────────────────────────────────
  // ITINERARY
  // ───────────────────────────────────────────────────────────────────────────

  generateItinerary: async (
    tripId: string,
  ): Promise<ApiResponse<{ plan: any }>> => {
    return apiClient.post(`/trips/${tripId}/plan/itinerary/generate`);
  },

  addItineraryDay: async (
    tripId: string,
    data: any,
  ): Promise<ApiResponse<{ plan: any }>> => {
    return apiClient.post(`/trips/${tripId}/plan/itinerary`, data);
  },

  updateItineraryDay: async (
    tripId: string,
    dayId: string,
    data: any,
  ): Promise<ApiResponse<{ plan: any }>> => {
    return apiClient.patch(`/trips/${tripId}/plan/itinerary/${dayId}`, data);
  },

  deleteItineraryDay: async (
    tripId: string,
    dayId: string,
  ): Promise<ApiResponse<{ plan: any }>> => {
    return apiClient.delete(`/trips/${tripId}/plan/itinerary/${dayId}`);
  },

  // ───────────────────────────────────────────────────────────────────────────
  // BOOKINGS (FLIGHTS, ACCOMMODATION, TRANSPORT)
  // ───────────────────────────────────────────────────────────────────────────

  addFlight: async (
    tripId: string,
    data: any,
  ): Promise<ApiResponse<{ plan: any }>> => {
    return apiClient.post(`/trips/${tripId}/plan/flights`, data);
  },

  updateFlight: async (
    tripId: string,
    flightId: string,
    data: any,
  ): Promise<ApiResponse<{ plan: ITravelPlan }>> => {
    return apiClient.patch(`/trips/${tripId}/plan/flights/${flightId}`, data);
  },

  deleteFlight: async (
    tripId: string,
    flightId: string,
  ): Promise<ApiResponse<{ plan: ITravelPlan }>> => {
    return apiClient.delete(`/trips/${tripId}/plan/flights/${flightId}`);
  },

  addAccommodation: async (
    tripId: string,
    data: any,
  ): Promise<ApiResponse<{ plan: ITravelPlan }>> => {
    return apiClient.post(`/trips/${tripId}/plan/accommodations`, data);
  },

  updateAccommodation: async (
    tripId: string,
    accommodationId: string,
    data: any,
  ): Promise<ApiResponse<{ plan: ITravelPlan }>> => {
    return apiClient.patch(
      `/trips/${tripId}/plan/accommodations/${accommodationId}`,
      data,
    );
  },

  deleteAccommodation: async (
    tripId: string,
    accommodationId: string,
  ): Promise<ApiResponse<{ plan: ITravelPlan }>> => {
    return apiClient.delete(
      `/trips/${tripId}/plan/accommodations/${accommodationId}`,
    );
  },

  addTransport: async (
    tripId: string,
    data: any,
  ): Promise<ApiResponse<{ plan: ITravelPlan }>> => {
    return apiClient.post(`/trips/${tripId}/plan/transport`, data);
  },

  updateTransport: async (
    tripId: string,
    transportId: string,
    data: any,
  ): Promise<ApiResponse<{ plan: ITravelPlan }>> => {
    return apiClient.patch(
      `/trips/${tripId}/plan/transport/${transportId}`,
      data,
    );
  },

  deleteTransport: async (
    tripId: string,
    transportId: string,
  ): Promise<ApiResponse<{ plan: ITravelPlan }>> => {
    return apiClient.delete(`/trips/${tripId}/plan/transport/${transportId}`);
  },

  // ───────────────────────────────────────────────────────────────────────────
  // PACKING LIST API
  // ───────────────────────────────────────────────────────────────────────────

  addPackingItem: async (
    tripId: string,
    data: any,
  ): Promise<ApiResponse<{ plan: ITravelPlan }>> => {
    return apiClient.post(`/trips/${tripId}/plan/packing`, data);
  },

  togglePackingItem: async (
    tripId: string,
    categoryId: string,
    itemId: string,
  ): Promise<ApiResponse<{ plan: ITravelPlan }>> => {
    return apiClient.patch(
      `/trips/${tripId}/plan/packing/${categoryId}/items/${itemId}/toggle`,
    );
  },

  deletePackingItem: async (
    tripId: string,
    categoryId: string,
    itemId: string,
  ): Promise<ApiResponse<{ plan: ITravelPlan }>> => {
    return apiClient.delete(
      `/trips/${tripId}/plan/packing/${categoryId}/items/${itemId}`,
    );
  },

  initializePackingList: async (
    tripId: string,
  ): Promise<ApiResponse<{ plan: ITravelPlan }>> => {
    return apiClient.post(`/trips/${tripId}/plan/packing/init`);
  },

  // ───────────────────────────────────────────────────────────────────────────
  // DOCUMENTS API
  // ───────────────────────────────────────────────────────────────────────────

  addDocument: async (
    tripId: string,
    data: any,
  ): Promise<ApiResponse<{ plan: ITravelPlan }>> => {
    return apiClient.post(`/trips/${tripId}/plan/documents`, data);
  },

  verifyDocument: async (
    tripId: string,
    documentId: string,
  ): Promise<ApiResponse<{ plan: ITravelPlan }>> => {
    return apiClient.patch(
      `/trips/${tripId}/plan/documents/${documentId}/verify`,
    );
  },

  // ───────────────────────────────────────────────────────────────────────────
  // CONTACTS API
  // ───────────────────────────────────────────────────────────────────────────

  getContacts: async (
    tripId: string,
  ): Promise<ApiResponse<{ data: IContact[] }>> => {
    return apiClient.get(`/trips/${tripId}/plan/contacts`);
  },

  addContact: async (
    tripId: string,
    data: Partial<IContact>,
  ): Promise<ApiResponse<{ plan: ITravelPlan }>> => {
    return apiClient.post(`/trips/${tripId}/plan/contacts`, data);
  },

  updateContact: async (
    tripId: string,
    contactId: string,
    data: Partial<IContact>,
  ): Promise<ApiResponse<{ plan: ITravelPlan }>> => {
    return apiClient.patch(`/trips/${tripId}/plan/contacts/${contactId}`, data);
  },

  deleteContact: async (
    tripId: string,
    contactId: string,
  ): Promise<ApiResponse<{ plan: ITravelPlan }>> => {
    return apiClient.delete(`/trips/${tripId}/plan/contacts/${contactId}`);
  },

  setPrimaryContact: async (
    tripId: string,
    contactId: string,
    type: string,
  ): Promise<ApiResponse<{ plan: ITravelPlan }>> => {
    return apiClient.patch(
      `/trips/${tripId}/plan/contacts/${contactId}/primary`,
      { type },
    );
  },

  // ───────────────────────────────────────────────────────────────────────────
  // PROGRESS & PLAN SUMMARY
  // ───────────────────────────────────────────────────────────────────────────

  getPlanningProgress: async (
    tripId: string,
  ): Promise<ApiResponse<{ data: any }>> => {
    return apiClient.get(`/trips/${tripId}/plan/progress`);
  },

  // Renamed from getTripSummary to getPlanSummary to avoid conflict with the core trip summary above
  getPlanSummary: async (
    tripId: string,
  ): Promise<ApiResponse<{ data: any }>> => {
    return apiClient.get(`/trips/${tripId}/plan/summary`);
  },

  // ───────────────────────────────────────────────────────────────────────────
  // PLAN ACTIVATION & COMPLETION
  // ───────────────────────────────────────────────────────────────────────────

  activateTravelPlan: async (
    tripId: string,
  ): Promise<ApiResponse<{ trip: ITrip; plan: any }>> => {
    return apiClient.post(`/trips/${tripId}/plan/activate`);
  },

  completeTrip: async (tripId: string): Promise<ApiResponse<any>> => {
    return apiClient.post(`/trips/${tripId}/plan/complete`);
  },
};
