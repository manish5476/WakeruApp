import { SplitMethod } from './trip.types';
export type ExpenseCategory =
  'food' | 'stay' | 'transport' | 'activity' | 'shopping' | 'health' | 'other';

export interface ISplit {
  userId: string;
  displayName: string;
  amountLocal: number;
  amountBase: number;
  percentage?: number;
  shares?: number;
  isPaid: boolean;
  paidAt?: string;
  paymentId?: string;
}

export interface IExpense {
  comments: any;
  _id: string;
  tripId: string;
  stopId: string;
  title: string;
  category: ExpenseCategory;
  notes?: string;
  receiptImages: string[];
  date: string;
  amountLocal: number;
  amountBase: number;
  localCurrency: string;
  baseCurrency: string;
  exchangeRateUsed: number;
  paidBy: string;
  paidByName: string;
  splitMethod: SplitMethod;
  splits: ISplit[];
  isSettled: boolean;
  isArchived: boolean;
  addedBy: string;
  editedBy?: string;
  editedAt?: string;
  createdAt: string;
  updatedAt: string;
}
