export interface ILimitConfig {
  value: number | null; // null indicates unlimited
  unlimited: boolean;
  unit?: string;
}

export interface ICurrencyTier {
  amount: number;
  yearlyAmount: number;
  currency: string;
}

export interface IPlanPricing {
  amount: number;
  currency: string;
  billingInterval: 'free' | 'month' | 'year' | 'lifetime';
  yearlyAmount?: number;
  tiers?: Record<string, ICurrencyTier>;
}

export interface IPlan {
  id: string;
  _id?: string;
  key: string;
  name: string;
  description: string;
  status: 'active' | 'draft' | 'archived';
  pricing: IPlanPricing;
  features: Record<string, boolean>;
  limits: Record<string, ILimitConfig>;
  permissions?: string[];
  displayOrder: number;
  isDefault: boolean;
  isPublic: boolean;
  activeSubscribers?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ISubscriptionMeta {
  id?: string;
  status: string; // 'none' | 'active' | 'trialing' | 'canceled' | 'expired' | 'past_due'
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd: boolean;
  autoRenew: boolean;
  provider?: string;
}

export interface IUserEntitlements {
  plan: {
    id: string;
    key: string;
    name: string;
    description: string;
    billingInterval: string;
    isDefault: boolean;
  };
  features: Record<string, boolean>;
  limits: Record<string, ILimitConfig>;
  usage: Record<string, number>;
  remaining: Record<string, number | null>;
  isPaid: boolean;
  subscription: ISubscriptionMeta;
}

export interface ILimitStatus {
  isReached: boolean;
  isApproaching: boolean; // >= 80% usage
  used: number;
  total: number | null;
  remaining: number | null;
  percent: number;
}

export interface IPlanInput {
  key: string;
  name: string;
  description?: string;
  status?: 'active' | 'draft' | 'archived';
  pricing: IPlanPricing;
  features: Record<string, boolean>;
  limits: Record<string, ILimitConfig>;
  displayOrder?: number;
  isDefault?: boolean;
  isPublic?: boolean;
  auditReason?: string;
}
