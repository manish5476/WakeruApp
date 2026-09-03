export type PaymentStatus = 'pending' | 'initiated' | 'confirmed' | 'disputed';

export interface ISettlementTransaction {
  _id: string;
  from: string;
  fromName: string;
  to: string;
  toName: string;
  amountBase: number;
  baseCurrency: string;
  status: PaymentStatus;
  upiDeepLink?: string;
  paymentId?: string;
  initiatedAt?: string;
  confirmedAt?: string;
}

export interface ISettlement {
  _id: string;
  tripId: string;
  baseCurrency: string;
  transactions: ISettlementTransaction[];
  totalTransactions: number;
  calculatedAt: string;
  isStale: boolean;
  createdAt: string;
  updatedAt: string;
}
