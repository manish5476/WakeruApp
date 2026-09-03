export interface AchievementUI {
  id: string;
  icon: string;
  tier: 'Gold' | 'Silver' | 'Bronze' | 'None';
  name: string;
  points: number;
}

export interface PlayerCardUI {
  userId: string;
  rank: number;
  avatarUrl: string;
  displayName: string;
  points: number;
  pointsFormatted: string;
  pointsBehindLeader: number;
  progressPercentage: number;
  achievementsCount: number;
  topAchievement: AchievementUI | null;
  recentUnlock: string | null; // e.g. "Unlocked 'Big Spender' 2 days ago"
}

export interface LeaderboardHeroUI {
  tripName: string;
  subtitle: string;
  currentLeaderName: string | null;
  totalParticipants: number;
  combinedPointsFormatted: string;
}
