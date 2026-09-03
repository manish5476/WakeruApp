export interface IUserPreferences {
  defaultCurrency: string;
  language: string;
  theme: 'light' | 'dark' | 'system';
  timezone: string;
  notifications: {
    push: boolean;
    email: boolean;
    sms: boolean;
    expenseAdded: boolean;
    settlementReminder: boolean;
    monthlyReport: boolean;
  };
  appearance?: {
    backgroundType: 'color' | 'image';
    backgroundColor: string | null;
    backgroundImage: string | null;
    backgroundBlur: number;
    backgroundImagePosition: { x: number; y: number; scale: number };
  };
}

export interface IBankingDetails {
  upiId?: string;
  upiVerified?: boolean;
  bankAccount?: {
    accountNumber: string;
    ifscCode: string;
    bankName: string;
    accountHolderName: string;
  };
  walletDetails?: {
    provider: 'paytm' | 'phonepe' | 'googlepay' | 'amazonpay';
    walletId: string;
  };
}

export interface IUserStats {
  totalGroups: number;
  totalExpenses: number;
  totalSettled: number;
  totalPending: number;
  lastActiveAt: string;
  accountCreatedAt: string;
}

export interface IUser {
  _id: string;
  firebaseUid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  avatar?: string;
  phoneNumber?: string;
  bio?: string;
  role: 'user' | 'premium' | 'business' | 'admin';
  totalOwedAcrossTrips: number;
  totalLentAcrossTrips: number;
  friendIds: string[];
  preferences: IUserPreferences;
  bankingDetails: IBankingDetails;
  stats: IUserStats;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}
