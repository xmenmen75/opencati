import { Decimal } from '@prisma/client/runtime/library';

export interface CardData {
  id: number;
  rank: string;
  poolSharePercentage: Decimal;
  name: string;
  imageUrl: string;
  rarityColor: string;
  designer: string;
}

export interface UserCardData {
  id: number;
  userId: bigint;
  cardId: number;
  seasonId: bigint;
  catiSpent: bigint;
  catiReward: bigint;
  card: CardData;
}

export interface SeasonData {
  id: bigint;
  name: string;
  slogan: string;
  additionalTotalPool: bigint;
  bidPoolAmount: bigint;
  status: string;
}

export interface RewardCalculationResult {
  userCards: Array<{
    id: number;
    userId: bigint;
    catiReward: bigint;
  }>;
  seasonRewards: Array<{
    userId: bigint;
    totalReward: bigint;
    poolSharePercentage: number;
  }>;
  poolInfo: {
    totalSpent: bigint;
    totalPool: bigint;
    rankPools: Record<string, bigint>;
    rankCounts: Record<string, number>;
    rewardPerCard: Record<string, bigint>;
  };
}

/**
 * Pure function to calculate season rewards based on user cards and season data
 * This function can be tested independently without database dependencies
 */
export function calculateSeasonRewards(
  userCards: UserCardData[],
  season: SeasonData
): RewardCalculationResult {
  // Calculate total pool amount (total spent + sponsor award)
  const totalSpent = userCards.reduce((sum: bigint, userCard: UserCardData) => sum + userCard.catiSpent, BigInt(0));
  const totalPool = totalSpent + season.additionalTotalPool;

  // Define rank pool percentages
  const rankPoolPercentages = {
    'A': 4,   // 4%
    'AA': 10, // 10%
    'S': 12,  // 12%
    'SS': 70, // 70%
  };

  // Calculate pools by rank
  const rankPools = Object.entries(rankPoolPercentages).reduce((pools, [rank, percentage]) => {
    pools[rank] = (totalPool * BigInt(percentage)) / BigInt(100);
    return pools;
  }, {} as Record<string, bigint>);

  // Count cards by rank
  const rankCounts = userCards.reduce((counts: Record<string, number>, userCard: UserCardData) => {
    const rank = userCard.card.rank;
    counts[rank] = (counts[rank] || 0) + 1;
    return counts;
  }, {} as Record<string, number>);

  // Calculate reward per card for each rank
  const rewardPerCard = Object.entries(rankPools).reduce((rewards, [rank, pool]) => {
    const count = rankCounts[rank] || 0;
    rewards[rank] = count > 0 ? pool / BigInt(count) : BigInt(0);
    return rewards;
  }, {} as Record<string, bigint>);

  // Calculate new rewards for each user card
  const updatedUserCards = userCards.map(userCard => ({
    id: userCard.id,
    userId: userCard.userId,
    catiReward: rewardPerCard[userCard.card.rank] || BigInt(0),
  }));

  // Calculate season rewards for each user
  const userRewards: Record<string, { userId: bigint; totalReward: bigint; poolShare: number }> = {};
  
  for (const userCard of updatedUserCards) {
    const userId = userCard.userId;
    const userIdStr = userId.toString();
    
    if (!userRewards[userIdStr]) {
      userRewards[userIdStr] = {
        userId,
        totalReward: BigInt(0),
        poolShare: 0,
      };
    }
    userRewards[userIdStr].totalReward += userCard.catiReward;
  }

  // Calculate pool share percentages
  const seasonRewards = Object.values(userRewards).map(userReward => ({
    userId: userReward.userId,
    totalReward: userReward.totalReward,
    poolSharePercentage: totalPool > 0 ? 
      Number(userReward.totalReward * BigInt(100000)) / Number(totalPool) / 1000 : 0,
  }));

  return {
    userCards: updatedUserCards,
    seasonRewards,
    poolInfo: {
      totalSpent,
      totalPool,
      rankPools,
      rankCounts,
      rewardPerCard,
    },
  };
}

/**
 * Helper function to create mock data for testing
 */
export function createMockSeasonData(overrides: Partial<SeasonData> = {}): SeasonData {
  return {
    id: BigInt(1),
    name: 'Test Season',
    slogan: 'Test Season Slogan',
    additionalTotalPool: BigInt('10000'), // 10,000 CATI sponsor amount
    bidPoolAmount: BigInt(0),
    status: 'ACTIVE',
    ...overrides,
  };
}

/**
 * Helper function to create mock card data for testing
 */
export function createMockCardData(overrides: Partial<CardData> = {}): CardData {
  return {
    id: 1,
    rank: 'A',
    poolSharePercentage: new Decimal('2.5'),
    name: 'Test Card',
    imageUrl: '/test-card.jpg',
    rarityColor: '#0066cc',
    designer: 'Test Designer',
    ...overrides,
  };
}

/**
 * Helper function to create mock user card data for testing
 */
export function createMockUserCardData(
  userId: bigint,
  card: CardData,
  seasonId: bigint,
  catiSpent: bigint,
  overrides: Partial<UserCardData> = {}
): UserCardData {
  return {
    id: Math.floor(Math.random() * 10000),
    userId,
    cardId: card.id,
    seasonId,
    catiSpent,
    catiReward: BigInt(0),
    card,
    ...overrides,
  };
}
