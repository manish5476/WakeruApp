import { storage } from './storage';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  emoji: string;
  unlockedAt?: string;
}

export const ACHIEVEMENTS: Record<string, Achievement> = {
  first_trip: {
    id: 'first_trip',
    title: 'First Adventure',
    description: 'Create your first trip',
    emoji: '🌍',
  },
  big_spender: {
    id: 'big_spender',
    title: 'Big Spender',
    description: 'Spend over ₹1,00,000 across trips',
    emoji: '💎',
  },
  globetrotter: {
    id: 'globetrotter',
    title: 'Globetrotter',
    description: 'Visit 5+ different countries',
    emoji: '🌏',
  },
  settler: {
    id: 'settler',
    title: 'Peacekeeper',
    description: 'Settle all debts within 24 hours for 5 trips',
    emoji: '☮️',
  },
  foodie: {
    id: 'foodie',
    title: 'Foodie',
    description: 'Spend ₹50,000+ on food',
    emoji: '🍽️',
  },
  photographer: {
    id: 'photographer',
    title: 'Receipt Collector',
    description: 'Upload 50 receipts',
    emoji: '📸',
  },
  social: {
    id: 'social',
    title: 'Social Butterfly',
    description: 'Travel with 10+ different people',
    emoji: '🦋',
  },
  budget_master: {
    id: 'budget_master',
    title: 'Budget Master',
    description: 'Stay under budget for 3 trips in a row',
    emoji: '🎯',
  },
};

export const achievements = {
  getAll(): Record<string, Achievement> {
    const stored = storage.getString('achievements');
    if (!stored) return ACHIEVEMENTS;
    const unlocked = JSON.parse(stored);
    return Object.keys(ACHIEVEMENTS).reduce(
      (acc, key) => {
        acc[key] = { ...ACHIEVEMENTS[key], ...unlocked[key] };
        return acc;
      },
      {} as Record<string, Achievement>,
    );
  },

  unlock(achievementId: string): Achievement | null {
    const achievement = ACHIEVEMENTS[achievementId];
    if (!achievement) return null;

    const stored = storage.getString('achievements');
    const unlocked = stored ? JSON.parse(stored) : {};

    if (unlocked[achievementId]) return null; // Already unlocked

    unlocked[achievementId] = { unlockedAt: new Date().toISOString() };
    storage.setString('achievements', JSON.stringify(unlocked));

    return { ...achievement, unlockedAt: new Date().toISOString() };
  },

  getUnlockedCount(): number {
    const stored = storage.getString('achievements');
    if (!stored) return 0;
    return Object.keys(JSON.parse(stored)).length;
  },
};
