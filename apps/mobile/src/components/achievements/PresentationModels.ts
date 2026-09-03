// src/components/achievements/PresentationModels.ts

export type TierType = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

export const TIER_COLORS: Record<TierType, string> = {
  bronze: '#CD7F32',
  silver: '#94A3B8',
  gold: '#F59E0B',
  platinum: '#818CF8',
  diamond: '#38BDF8',
};

export const TIER_GRADIENTS: Record<TierType, [string, string]> = {
  bronze: ['#EA580C', '#B45309'],
  silver: ['#94A3B8', '#64748B'],
  gold: ['#F59E0B', '#D97706'],
  platinum: ['#818CF8', '#4F46E5'],
  diamond: ['#38BDF8', '#0284C7'],
};

export const TIER_EMOJIS: Record<TierType, string> = {
  bronze: '🥉',
  silver: '🥈',
  gold: '🥇',
  platinum: '💎',
  diamond: '👑',
};

export const CATEGORY_ICONS: Record<string, string> = {
  expense_management: 'receipt',
  budget_mastery: 'wallet',
  social: 'users',
  travel: 'plane',
  settlement: 'credit-card',
  streak: 'flame',
  special: 'sparkles',
  other: 'award',
};

export const CATEGORY_EMOJIS: Record<string, string> = {
  expense_management: '📊',
  budget_mastery: '💰',
  social: '🤝',
  travel: '✈️',
  settlement: '💳',
  streak: '🔥',
  special: '🌟',
  other: '🏆',
};

export interface AchievementUI {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: TierType;
  tierColor: string;
  progress: number;
  currentValue: number;
  targetValue: number;
  pointsValue: number;
  isUnlocked: boolean;
  timesEarned: number;
  lastEarnedAt?: string;
  category: string;
}

export interface CategoryStatUI {
  id: string;
  name: string;
  icon: string;
  emoji: string;
  unlocked: number;
  total: number;
  completionPercentage: number;
  subtitle: string;
}

export interface MilestoneUI {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: TierType;
  tierColor: string;
  progress: number;
  currentValue: number;
  targetValue: number;
  pointsValue: number;
  remainingValue: number;
}

export interface AchievementsHeroUI {
  currentTier: TierType;
  tierColor: string;
  tierEmoji: string;
  totalPoints: number;
  totalUnlocked: number;
  totalAvailable: number;
  completionPercentage: number;
  nextTierPoints: number;
  pointsToNextTier: number;
  tierTitle: string;
}

export function mapAchievementsData(
  rawAchievements: any[],
  rawStats: any,
): {
  hero: AchievementsHeroUI;
  categories: CategoryStatUI[];
  recentUnlocks: AchievementUI[];
  nextMilestones: MilestoneUI[];
  allAchievements: AchievementUI[];
} {
  const totalPoints = rawStats?.totalPoints || 0;
  const totalUnlocked = rawStats?.totalUnlocked || 0;
  const totalAvailable = rawStats?.totalAvailable || 0;

  // Calculate Tier
  let currentTier: TierType = 'bronze';
  let nextTierPoints = 100;
  let tierTitle = 'Novice Explorer';
  if (totalPoints >= 1000) {
    currentTier = 'diamond';
    nextTierPoints = 1000;
    tierTitle = 'Grandmaster Voyager';
  } else if (totalPoints >= 500) {
    currentTier = 'platinum';
    nextTierPoints = 1000;
    tierTitle = 'Elite Traveler';
  } else if (totalPoints >= 250) {
    currentTier = 'gold';
    nextTierPoints = 500;
    tierTitle = 'Master Splitter';
  } else if (totalPoints >= 100) {
    currentTier = 'silver';
    nextTierPoints = 250;
    tierTitle = 'Seasoned Adventurer';
  }

  const hero: AchievementsHeroUI = {
    currentTier,
    tierColor: TIER_COLORS[currentTier],
    tierEmoji: TIER_EMOJIS[currentTier],
    totalPoints,
    totalUnlocked,
    totalAvailable,
    completionPercentage:
      totalAvailable > 0 ? (totalUnlocked / totalAvailable) * 100 : 0,
    nextTierPoints,
    pointsToNextTier: Math.max(0, nextTierPoints - totalPoints),
    tierTitle,
  };

  const categories: CategoryStatUI[] = Object.entries(
    rawStats?.byCategory || {},
  ).map(([key, data]: [string, any]) => {
    const unlocked = data.unlocked || 0;
    const total = data.total || 0;

    let subtitle = `${unlocked}/${total} Unlocked`;
    if (unlocked === total && total > 0) subtitle = 'Completed 🏆';
    else if (unlocked === 0) subtitle = `${total} available`;

    return {
      id: key,
      name: key
        .split('_')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' '),
      icon: CATEGORY_ICONS[key] || 'award',
      emoji: CATEGORY_EMOJIS[key] || '🏆',
      unlocked,
      total,
      completionPercentage: total > 0 ? (unlocked / total) * 100 : 0,
      subtitle,
    };
  });

  const mapAch = (a: any): AchievementUI => {
    const rawTier = (a.tier?.toLowerCase() as TierType) || 'bronze';
    const tier = (
      ['bronze', 'silver', 'gold', 'platinum', 'diamond'].includes(rawTier)
        ? rawTier
        : 'bronze'
    ) as TierType;
    return {
      id: a.id || a._id || a.name,
      name: a.name || 'Secret Badge',
      description: a.description || 'Complete trip tasks to unlock this badge.',
      icon: a.icon || '🏆',
      tier,
      tierColor: TIER_COLORS[tier] || TIER_COLORS.bronze,
      progress:
        typeof a.progress === 'number'
          ? Math.min(100, Math.max(0, a.progress))
          : a.isUnlocked
            ? 100
            : 0,
      currentValue: a.currentValue || 0,
      targetValue: a.targetValue || 1,
      pointsValue: a.pointsValue || a.points || 50,
      isUnlocked: Boolean(a.isUnlocked),
      timesEarned: a.timesEarned || (a.isUnlocked ? 1 : 0),
      lastEarnedAt: a.lastEarnedAt || a.unlockedAt,
      category: a.category || 'other',
    };
  };

  const allAchievements = (rawAchievements || []).map(mapAch);

  // Sort recent unlocks by date if available
  const recentUnlocks = (
    rawStats?.recentUnlocks ||
    allAchievements.filter(a => a.isUnlocked).slice(0, 5)
  ).map(mapAch);

  const nextMilestones = (
    rawStats?.nextMilestones ||
    allAchievements.filter(a => !a.isUnlocked && a.progress > 0).slice(0, 3)
  ).map((m: any) => {
    const mapped = mapAch(m);
    return {
      ...mapped,
      remainingValue: Math.max(0, mapped.targetValue - mapped.currentValue),
    };
  });

  return {
    hero,
    categories,
    recentUnlocks,
    nextMilestones,
    allAchievements,
  };
}
