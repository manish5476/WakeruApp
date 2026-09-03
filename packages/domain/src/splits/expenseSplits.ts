export type SplitMethod = 'equal' | 'percentage' | 'exact' | 'shares' | 'personal';

export interface SplitMemberInput {
  userId: string;
  displayName: string;
  percentage?: number;
  amountLocal?: number;
  shares?: number;
}

export interface CalculatedSplit {
  userId: string;
  displayName: string;
  amountLocal: number;
  amountBase: number;
  percentage?: number;
  shares?: number;
  isPaid: boolean;
}

export interface SplitCalculationParams {
  amountLocal: number;
  exchangeRate: number; // local to base currency multiplier
  splitMethod: SplitMethod;
  payerId: string;
  memberIds?: string[];
  members?: SplitMemberInput[];
  allTripMembers?: { userId: string; displayName: string }[];
}

/**
 * Calculates local and base amounts for each participant based on the selected split method.
 */
export function calculateSplits(params: SplitCalculationParams): CalculatedSplit[] {
  const {
    amountLocal,
    exchangeRate = 1,
    splitMethod,
    payerId,
    memberIds = [],
    members = [],
    allTripMembers = [],
  } = params;

  if (amountLocal <= 0) return [];

  const roundTwo = (val: number): number => Math.round((val + Number.EPSILON) * 100) / 100;

  switch (splitMethod) {
    case 'personal': {
      const payer = allTripMembers.find((m) => m.userId === payerId) || {
        userId: payerId,
        displayName: 'Payer',
      };
      const base = roundTwo(amountLocal * exchangeRate);
      return [
        {
          userId: payer.userId,
          displayName: payer.displayName,
          amountLocal,
          amountBase: base,
          isPaid: true,
        },
      ];
    }

    case 'equal': {
      if (memberIds.length === 0) return [];
      const count = memberIds.length;
      const perPerson = Math.floor((amountLocal / count) * 100) / 100;
      const remainderCents = Math.round((amountLocal - perPerson * count) * 100);

      return memberIds.map((uid, index) => {
        const memberObj = allTripMembers.find((m) => m.userId === uid);
        const displayName = memberObj?.displayName || 'Member';
        const itemLocal = index < remainderCents ? roundTwo(perPerson + 0.01) : perPerson;
        const itemBase = roundTwo(itemLocal * exchangeRate);

        return {
          userId: uid,
          displayName,
          amountLocal: itemLocal,
          amountBase: itemBase,
          isPaid: uid === payerId,
        };
      });
    }

    case 'percentage': {
      if (members.length === 0) return [];
      return members.map((m) => {
        const pct = m.percentage || 0;
        const itemLocal = roundTwo((amountLocal * pct) / 100);
        const itemBase = roundTwo(itemLocal * exchangeRate);

        return {
          userId: m.userId,
          displayName: m.displayName,
          percentage: pct,
          amountLocal: itemLocal,
          amountBase: itemBase,
          isPaid: m.userId === payerId,
        };
      });
    }

    case 'exact': {
      if (members.length === 0) return [];
      return members.map((m) => {
        const itemLocal = roundTwo(m.amountLocal || 0);
        const itemBase = roundTwo(itemLocal * exchangeRate);

        return {
          userId: m.userId,
          displayName: m.displayName,
          amountLocal: itemLocal,
          amountBase: itemBase,
          isPaid: m.userId === payerId,
        };
      });
    }

    case 'shares': {
      if (members.length === 0) return [];
      const totalShares = members.reduce(
        (sum, m) => sum + (m.shares && m.shares > 0 ? m.shares : 1),
        0,
      );
      if (totalShares <= 0) return [];

      return members.map((m) => {
        const s = m.shares && m.shares > 0 ? m.shares : 1;
        const itemLocal = roundTwo((amountLocal * s) / totalShares);
        const itemBase = roundTwo(itemLocal * exchangeRate);

        return {
          userId: m.userId,
          displayName: m.displayName,
          shares: s,
          amountLocal: itemLocal,
          amountBase: itemBase,
          isPaid: m.userId === payerId,
        };
      });
    }

    default:
      return [];
  }
}

/**
 * Validates whether custom percentage or exact splits equal total required amount.
 */
export function validateSplitInputs(params: {
  amountLocal: number;
  splitMethod: SplitMethod;
  members?: SplitMemberInput[];
}): { isValid: boolean; error?: string } {
  const { amountLocal, splitMethod, members = [] } = params;

  if (amountLocal <= 0) {
    return { isValid: false, error: 'Expense amount must be greater than zero.' };
  }

  if (splitMethod === 'percentage') {
    const totalPercentage = members.reduce((sum, m) => sum + (m.percentage || 0), 0);
    if (Math.abs(totalPercentage - 100) > 0.01) {
      return {
        isValid: false,
        error: `Percentages must add up to 100% (currently ${totalPercentage}%).`,
      };
    }
  }

  if (splitMethod === 'exact') {
    const totalExact = members.reduce((sum, m) => sum + (m.amountLocal || 0), 0);
    if (Math.abs(totalExact - amountLocal) > 0.01) {
      return {
        isValid: false,
        error: `Exact amounts must equal total expense amount (${amountLocal}).`,
      };
    }
  }

  return { isValid: true };
}
