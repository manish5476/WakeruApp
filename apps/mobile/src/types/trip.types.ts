export type TripStatus = 'planning' | 'active' | 'completed' | 'archived';
export type TripRole = 'admin' | 'member' | 'viewer';
export type SplitMethod =
  'equal' | 'percentage' | 'exact' | 'shares' | 'personal';

export interface IStop {
  _id: string;
  name: string;
  emoji?: string;
  country?: string;
  location?: {
    lat: number;
    lng: number;
    formattedAddress: string;
  };
  currency: string;
  currentExchangeRate: number;
  rateLastUpdated?: string;
  budget?: number;
  budgetBase?: number;
  order: number;
  startDate?: string;
  endDate?: string;
  notes?: string;
  coverImage?: string;
  totalSpentLocal: number;
  totalSpentBase: number;
  expenseCount: number;
}

export interface ITripMember {
  avatarUrl: string;
  userId: string;
  displayName: string;
  photoURL?: string;
  role: TripRole;
  joinedAt: string;
  isActive: boolean;
  totalPaidBase: number;
  totalOwesBase: number;
}

export interface ITrip {
  _id: string;
  title: string;
  description?: string;
  coverImage?: string;
  startDate: string;
  endDate: string;
  status: TripStatus;
  baseCurrency: string;
  totalBudget?: number;
  createdBy: string;
  members: ITripMember[];
  stops: IStop[];
  stopCount: number;
  totalSpentBase: number;
  inviteCode?: any;
  inviteCodeExpiresAt?: string;
  defaultSplitMethod: SplitMethod;
  allowAnyPayer: boolean;
  allowOthersToArchiveTrip: boolean;
  isArchived: boolean;
  template?: 'quick' | 'domestic' | 'international';
  createdAt: string;
  updatedAt: string;
}
