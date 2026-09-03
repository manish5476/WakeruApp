import {
  LeaderboardHeroUI,
  PlayerCardUI,
  AchievementUI,
} from './PresentationModels';

// Format large numbers safely
const safeFormatNumber = (value: number): string => {
  if (!value || isNaN(value) || !isFinite(value)) return '0';
  return value.toLocaleString();
};

export const mapLeaderboardHeroUI = (
  trip: any,
  leaderboard: any[],
): LeaderboardHeroUI => {
  const totalPoints = leaderboard.reduce(
    (sum, member) => sum + (member.score || 0),
    0,
  );
  const leader = leaderboard.length > 0 ? leaderboard[0] : null;

  return {
    tripName: trip?.name || 'Trip Leaderboard',
    subtitle: 'Who’s leading the pack?',
    currentLeaderName: leader?.displayName || null,
    totalParticipants: leaderboard.length,
    combinedPointsFormatted: safeFormatNumber(totalPoints),
  };
};

export const mapPlayerCardUI = (
  member: any,
  index: number,
  leaderScore: number,
): PlayerCardUI => {
  const score = member.score || 0;

  // Determine tier from member data or fallback
  let topAchievement: AchievementUI | null = null;
  if (member.topAchievement) {
    topAchievement = {
      id: member.topAchievement.id || 'unknown',
      icon: member.topAchievement.icon || '🏆',
      tier: member.topAchievement.tier || 'None',
      name: member.topAchievement.name || 'Achievement',
      points: member.topAchievement.points || 0,
    };
  } else if (score > 1000) {
    topAchievement = {
      id: 'fallback',
      icon: '🔥',
      tier: 'Gold',
      name: 'High Roller',
      points: 0,
    };
  } else if (score > 500) {
    topAchievement = {
      id: 'fallback',
      icon: '✨',
      tier: 'Silver',
      name: 'Active Spender',
      points: 0,
    };
  }

  return {
    userId: member.userId || `user_${index}`,
    rank: index + 1,
    avatarUrl:
      member.avatarUrl ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(member.displayName || 'U')}&background=random`,
    displayName: member.displayName || 'Unknown User',
    points: score,
    pointsFormatted: safeFormatNumber(score),
    pointsBehindLeader: index === 0 ? 0 : Math.max(0, leaderScore - score),
    progressPercentage:
      member.progress || Math.min(100, (score / (leaderScore || 1)) * 100),
    achievementsCount: member.achievementsCount || Math.floor(score / 200),
    topAchievement,
    recentUnlock: member.recentUnlock || null,
  };
};

export const mapLeaderboardData = (leaderboard: any[]): PlayerCardUI[] => {
  if (!leaderboard || leaderboard.length === 0) return [];

  // Assume sorted descending by score in API, but sort just in case
  const sorted = [...leaderboard].sort(
    (a, b) => (b.score || 0) - (a.score || 0),
  );
  const leaderScore = sorted[0]?.score || 0;

  return sorted.map((member, index) =>
    mapPlayerCardUI(member, index, leaderScore),
  );
};
