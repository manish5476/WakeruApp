// types/travelPlan.types.ts

export interface IChecklistItem {
  _id?: string;
  item: string;
  checked: boolean;
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string;
  category?: string;
}
export interface IContact {
  _id?: string;
  type: 'emergency' | 'insurance' | 'hotel' | 'embassy' | 'localEmergency';
  name: string;
  phone: string;
  email?: string;
  address?: string;
  relation?: string;
  provider?: string;
  policyNo?: string;
  coverage?: string;
  country?: string;
  workingHours?: string;
  notes?: string;
  isPrimary?: boolean;
}
export interface IItineraryDay {
  _id?: string;
  date: string;
  day: string;
  destination: string;
  transport: string;
  accommodation: string;
  notes: string;
  stopId?: string;
  location?: string;
  meals?: Record<string, any>;
}

export interface IFlightDetail {
  _id?: string;
  type: 'departure' | 'return' | 'connecting';
  airline: string;
  flightNo: string;
  from: string;
  to: string;
  date: string;
  time: string;
  cost?: number;
  confirmationNo?: string;
  status?: 'confirmed' | 'pending' | 'cancelled';
}

export interface IAccommodationDetail {
  _id?: string;
  hotelName: string;
  address: string;
  checkIn: string;
  checkOut: string;
  confirmationNo: string;
  contact: string;
  notes: string;
  cost?: number;
  status?: 'confirmed' | 'pending' | 'cancelled';
}

export interface ITransportDetail {
  _id?: string;
  type:
    | 'train'
    | 'bus'
    | 'taxi'
    | 'ferry'
    | 'cab'
    | 'car-rental'
    | 'flight'
    | 'other';
  operator: string;
  pnr: string;
  from: string;
  to: string;
  date: string;
  time: string;
  notes: string;
  cost?: number;
  status?: 'confirmed' | 'pending' | 'cancelled';
}

export interface IPackingItem {
  _id?: string;
  name: string;
  checked: boolean;
  quantity?: number;
  priority?: 'essential' | 'recommended' | 'optional';
}

export interface IPackingCategory {
  _id?: string;
  category: string;
  icon?: string;
  items: IPackingItem[];
}

export interface IDocumentDetail {
  _id?: string;
  type: 'passport' | 'visa' | 'insurance' | 'ticket' | 'reservation' | 'other';
  name: string;
  number?: string;
  issueDate?: string;
  expiryDate?: string;
  verified: boolean;
  notes?: string;
}

export interface IBudgetOverview {
  total: number;
  spent: number;
  currency: string;
  flights: number;
  accommodation: number;
  transport: number;
  food: number;
  activities: number;
  shopping: number;
  miscellaneous: number;
}

export interface IPlanningProgress {
  overall: number;
  checklist: number;
  packing: number;
  bookings: number;
  documents: number;
}

export interface ITravelPlan {
  _id: string;
  tripId: string;
  tripStatus?: 'planning' | 'active' | 'completed' | 'cancelled';
  tripDaysUntil?: number;
  groupSize?: number;
  purpose: string;
  travelStyle?: 'luxury' | 'comfort' | 'backpacking' | 'business';
  budgetOverview: IBudgetOverview;
  planningProgress: IPlanningProgress;
  checklist: IChecklistItem[];
  itinerary: IItineraryDay[];
  flightDetails: IFlightDetail[];
  accommodationDetails: IAccommodationDetail[];
  transportDetails: ITransportDetail[];
  packingList: IPackingCategory[];
  documents: IDocumentDetail[];
  importantContacts: IContact[];
  notes: string;
  travelGoals: string[];
  createdAt: string;
  updatedAt: string;
}
