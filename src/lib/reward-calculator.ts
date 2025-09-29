export interface CardData {
  id: number;
  rank: string;
  name: string;
  imageUrl: string;
  rarityColor: string;
  designer: string;
}

export interface SeasonCardData {
  id: bigint;
  seasonId: bigint;
  cardId: number;
  userBidPoolPercentage: number;  // Percentage for user bid amount
  sponsorPoolPercentage: number;  // Percentage for sponsor amount
  dropProbability: number;
  isActive: boolean;
  card: CardData;
}

export interface UserCardData {
  id: bigint;
  userId: bigint;
  cardId: number;
  seasonId: bigint;
  catiSpent: bigint;
  catiReward: bigint;
  card: CardData;
  seasonCard?: SeasonCardData; // Optional - will be included when needed for calculations
}

export interface SeasonData {
  id: bigint;
  name: string;
  slogan: string;
  additionalTotalPool: bigint; // Total sponsor CATI in season pool
  bidPoolAmount: bigint;       // Total bid CATI in season pool (calculated from user spending)
  status: string;
}

export interface RewardCalculationResult {
  userCards: Array<{
    id: bigint;
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
    totalSponsorPool: bigint;
    totalPool: bigint;
    userBidRewards: bigint;   // Total rewards from user bid pool
    sponsorRewards: bigint;   // Total rewards from sponsor pool
    cardRewards: Array<{
      cardId: number;
      rank: string;
      userBidReward: bigint;      // Total pool allocated to this card type from user bids
      sponsorReward: bigint;      // Total pool allocated to this card type from sponsor
      totalReward: bigint;        // Total pool allocated to this card type
      perCardReward: bigint;      // Reward per individual card of this type
      totalCards: number;         // Number of cards of this type in circulation
    }>;
  };
}

/**
 * Calculate rewards using the new dual-percentage system
 * catiReward = (userBidAmount * userBidPoolPercentage) + (sponsorAmount * sponsorPoolPercentage)
 */
export function calculateSeasonRewards(
  userCards: UserCardData[],
  seasonCards: SeasonCardData[],
  season: SeasonData
): RewardCalculationResult {
  // Calculate total amounts
  const totalUserBidAmount = season.bidPoolAmount; // Total user spending in the season
  const totalSponsorAmount = season.additionalTotalPool; // Total sponsor contribution
  const totalPool = totalUserBidAmount + totalSponsorAmount;

  // Create a map of cardId -> SeasonCard for easy lookup
  const seasonCardMap = new Map<number, SeasonCardData>();
  seasonCards.forEach(sc => seasonCardMap.set(sc.cardId, sc));

  // First, count how many cards of each type exist
  const cardCounts = new Map<number, number>();
  userCards.forEach(userCard => {
    const count = cardCounts.get(userCard.cardId) || 0;
    cardCounts.set(userCard.cardId, count + 1);
  });

  // Calculate total reward pools ONLY for card types that actually exist in user cards
  const cardTypeRewards = new Map<number, { userBidReward: bigint; sponsorReward: bigint; totalReward: bigint }>();
  
  // Only process season cards that have actual user cards in circulation
  seasonCards.forEach(seasonCard => {
    const cardCount = cardCounts.get(seasonCard.cardId);
    
    // Skip if no cards of this type exist in user collections
    if (!cardCount || cardCount === 0) {
      return;
    }
    
    const userBidPercentage = Number(seasonCard.userBidPoolPercentage) / 100; // Convert to decimal
    const sponsorPercentage = Number(seasonCard.sponsorPoolPercentage) / 100; // Convert to decimal
    
    const totalUserBidRewardForCardType = BigInt(Math.floor(Number(totalUserBidAmount) * userBidPercentage));
    const totalSponsorRewardForCardType = BigInt(Math.floor(Number(totalSponsorAmount) * sponsorPercentage));
    const totalRewardForCardType = totalUserBidRewardForCardType + totalSponsorRewardForCardType;
    
    cardTypeRewards.set(seasonCard.cardId, {
      userBidReward: totalUserBidRewardForCardType,
      sponsorReward: totalSponsorRewardForCardType,
      totalReward: totalRewardForCardType,
    });
  });

  // Calculate rewards for each user card (split equally among cards of same type)
  const updatedUserCards: Array<{
    id: bigint;
    userId: bigint;
    catiReward: bigint;
  }> = [];

  const cardRewards: Array<{
    cardId: number;
    rank: string;
    userBidReward: bigint;
    sponsorReward: bigint;
    totalReward: bigint;
    perCardReward: bigint; // Reward per individual card
    totalCards: number;    // Total cards of this type
  }> = [];

  let totalUserBidRewards = BigInt(0);
  let totalSponsorRewards = BigInt(0);

  // Track which card types we've already processed for cardRewards array
  const processedCardTypes = new Set<number>();

  for (const userCard of userCards) {
    const seasonCard = seasonCardMap.get(userCard.cardId);
    const cardTypeReward = cardTypeRewards.get(userCard.cardId);
    const cardCount = cardCounts.get(userCard.cardId) || 0;
    
    if (!seasonCard || !cardTypeReward || cardCount === 0) {
      // If no SeasonCard found, no reward
      updatedUserCards.push({
        id: userCard.id,
        userId: userCard.userId,
        catiReward: BigInt(0),
      });
      continue;
    }

    // Calculate reward per individual card (total pool for card type / number of cards)
    const userBidRewardPerCard = cardTypeReward.userBidReward / BigInt(cardCount);
    const sponsorRewardPerCard = cardTypeReward.sponsorReward / BigInt(cardCount);
    const totalCardReward = userBidRewardPerCard + sponsorRewardPerCard;

    // Track totals (only count once per card, not once per card type)
    totalUserBidRewards += userBidRewardPerCard;
    totalSponsorRewards += sponsorRewardPerCard;

    updatedUserCards.push({
      id: userCard.id,
      userId: userCard.userId,
      catiReward: totalCardReward,
    });

    // Add to cardRewards array only once per card type
    if (!processedCardTypes.has(userCard.cardId)) {
      cardRewards.push({
        cardId: userCard.cardId,
        rank: userCard.card.rank,
        userBidReward: cardTypeReward.userBidReward,
        sponsorReward: cardTypeReward.sponsorReward,
        totalReward: cardTypeReward.totalReward,
        perCardReward: totalCardReward,
        totalCards: cardCount,
      });
      processedCardTypes.add(userCard.cardId);
    }
  }

  // Calculate season rewards for each user (sum of all their card rewards)
  const userRewards: Record<string, { userId: bigint; totalReward: bigint }> = {};
  
  for (const userCard of updatedUserCards) {
    const userId = userCard.userId;
    const userIdStr = userId.toString();
    
    if (!userRewards[userIdStr]) {
      userRewards[userIdStr] = {
        userId,
        totalReward: BigInt(0),
      };
    }
    userRewards[userIdStr].totalReward += userCard.catiReward;
  }

  // Calculate pool share percentages for each user
  const seasonRewards = Object.values(userRewards).map(userReward => ({
    userId: userReward.userId,
    totalReward: userReward.totalReward,
    poolSharePercentage: totalPool > BigInt(0) ? 
      Number(userReward.totalReward * BigInt(100000)) / Number(totalPool) / 1000 : 0,
  }));

  return {
    userCards: updatedUserCards,
    seasonRewards,
    poolInfo: {
      totalSpent: totalUserBidAmount,
      totalSponsorPool: totalSponsorAmount,
      totalPool,
      userBidRewards: totalUserBidRewards,
      sponsorRewards: totalSponsorRewards,
      cardRewards,
    },
  };
}

/**
 * Enhanced function that retrieves SeasonCard data and calculates rewards
 * This function should be used when you have access to the database
 */
export async function calculateSeasonRewardsWithSeasonCards(
  userCards: UserCardData[],
  season: SeasonData,
  prismaClient: any // Type this properly in your implementation
): Promise<RewardCalculationResult> {
  // Get all unique card IDs from user cards
  const cardIds = [...new Set(userCards.map(uc => uc.cardId))];
  
  // Fetch SeasonCard data for the current season and cards
  const seasonCards = await prismaClient.seasonCard.findMany({
    where: {
      seasonId: season.id,
      cardId: { in: cardIds },
      isActive: true,
    },
    include: {
      card: true,
    },
  });

  // Transform to our interface
  const seasonCardData: SeasonCardData[] = seasonCards.map((sc: any) => ({
    id: sc.id,
    seasonId: sc.seasonId,
    cardId: sc.cardId,
    userBidPoolPercentage: Number(sc.userBidPoolPercentage),
    sponsorPoolPercentage: Number(sc.sponsorPoolPercentage),
    dropProbability: Number(sc.dropProbability),
    isActive: sc.isActive,
    card: sc.card,
  }));

  return calculateSeasonRewards(userCards, seasonCardData, season);
}

/**
 * Helper function to create mock season data for testing
 */
export function createMockSeasonData(overrides: Partial<SeasonData> = {}): SeasonData {
  return {
    id: BigInt(1),
    name: 'Test Season',
    slogan: 'Test Season Slogan',
    additionalTotalPool: BigInt('10000'), // 10,000 CATI sponsor amount
    bidPoolAmount: BigInt('5000'),        // 5,000 CATI user bid amount (default)
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
    name: 'Test Card',
    imageUrl: '/test-card.jpg',
    rarityColor: '#0066cc',
    designer: 'Test Designer',
    ...overrides,
  };
}

/**
 * Helper function to create mock season card data for testing
 */
export function createMockSeasonCardData(overrides: Partial<SeasonCardData> = {}): SeasonCardData {
  const defaultCard = createMockCardData();
  return {
    id: BigInt(1),
    seasonId: BigInt(1),
    cardId: 1,
    userBidPoolPercentage: 4.0,  // 4% of user bid pool
    sponsorPoolPercentage: 2.5,  // 2.5% of sponsor pool
    dropProbability: 0.1,        // 10% drop chance
    isActive: true,
    card: defaultCard,
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
    id: BigInt(Math.floor(Math.random() * 10000)),
    userId,
    cardId: card.id,
    seasonId,
    catiSpent,
    catiReward: BigInt(0),
    card,
    ...overrides,
  };
}

/**
 * Legacy reward calculation function for backward compatibility
 * This maintains the old rank-based percentage system (A: 4%, AA: 10%, S: 12%, SS: 70%)
 * Use this for migration purposes or comparison with old system
 */
export function calculateSeasonRewardsLegacy(
  userCards: UserCardData[],
  season: SeasonData
): RewardCalculationResult {
  // Calculate total pool amount (total spent + sponsor award)
  const totalSpent = userCards.reduce((sum: bigint, userCard: UserCardData) => sum + userCard.catiSpent, BigInt(0));
  const totalPool = totalSpent + season.additionalTotalPool;

  // Define rank pool percentages (legacy system)
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

  // Convert legacy data to new format
  const cardTypeMap = new Map<number, { reward: bigint; count: number; rank: string }>();
  
  userCards.forEach(userCard => {
    const reward = rewardPerCard[userCard.card.rank] || BigInt(0);
    const existing = cardTypeMap.get(userCard.cardId);
    if (existing) {
      cardTypeMap.set(userCard.cardId, { ...existing, count: existing.count + 1 });
    } else {
      cardTypeMap.set(userCard.cardId, { reward, count: 1, rank: userCard.card.rank });
    }
  });

  const cardRewards = Array.from(cardTypeMap.entries()).map(([cardId, data]) => {
    const totalPoolForCardType = rankPools[data.rank] || BigInt(0);
    return {
      cardId,
      rank: data.rank,
      userBidReward: totalPoolForCardType, // In legacy system, all reward comes from combined pool
      sponsorReward: BigInt(0),
      totalReward: totalPoolForCardType,
      perCardReward: data.reward,
      totalCards: data.count,
    };
  });

  // Calculate season rewards for each user
  const userRewards: Record<string, { userId: bigint; totalReward: bigint }> = {};
  
  for (const userCard of updatedUserCards) {
    const userId = userCard.userId;
    const userIdStr = userId.toString();
    
    if (!userRewards[userIdStr]) {
      userRewards[userIdStr] = {
        userId,
        totalReward: BigInt(0),
      };
    }
    userRewards[userIdStr].totalReward += userCard.catiReward;
  }

  // Calculate pool share percentages
  const seasonRewards = Object.values(userRewards).map(userReward => ({
    userId: userReward.userId,
    totalReward: userReward.totalReward,
    poolSharePercentage: totalPool > BigInt(0) ? 
      Number(userReward.totalReward * BigInt(100000)) / Number(totalPool) / 1000 : 0,
  }));

  const totalUserBidRewards = cardRewards.reduce((sum, card) => sum + card.userBidReward, BigInt(0));

  return {
    userCards: updatedUserCards,
    seasonRewards,
    poolInfo: {
      totalSpent,
      totalSponsorPool: season.additionalTotalPool,
      totalPool,
      userBidRewards: totalUserBidRewards,
      sponsorRewards: BigInt(0), // Legacy system doesn't separate sponsor rewards
      cardRewards,
    },
  };
}

/**
 * Example function demonstrating the new dual-percentage reward system
 */
export function demonstrateNewRewardSystem(): void {
  console.log('=== New Dual-Percentage Reward System Demo ===\n');

  // Create test season with bid pool and sponsor pool
  const season = createMockSeasonData({
    bidPoolAmount: BigInt('50000'),      // 50,000 CATI from user spending
    additionalTotalPool: BigInt('100000'), // 100,000 CATI sponsor pool
  });

  console.log('Season Setup:');
  console.log(`- User Bid Pool: ${season.bidPoolAmount} CATI`);
  console.log(`- Sponsor Pool: ${season.additionalTotalPool} CATI`);
  console.log(`- Total Pool: ${season.bidPoolAmount + season.additionalTotalPool} CATI\n`);

  // Create different card types with different percentages
  const cards = [
    createMockCardData({ id: 1, rank: 'A', name: 'Common Card' }),
    createMockCardData({ id: 2, rank: 'AA', name: 'Uncommon Card' }),
    createMockCardData({ id: 3, rank: 'S', name: 'Rare Card' }),
    createMockCardData({ id: 4, rank: 'SS', name: 'Ultra Rare Card' }),
  ];

  // Create season cards with different reward percentages
  const seasonCards = [
    createMockSeasonCardData({ 
      cardId: 1, 
      userBidPoolPercentage: 2.0,   // 2% of user bid pool
      sponsorPoolPercentage: 1.0,   // 1% of sponsor pool
      card: cards[0] 
    }),
    createMockSeasonCardData({ 
      cardId: 2, 
      userBidPoolPercentage: 5.0,   // 5% of user bid pool
      sponsorPoolPercentage: 3.0,   // 3% of sponsor pool
      card: cards[1] 
    }),
    createMockSeasonCardData({ 
      cardId: 3, 
      userBidPoolPercentage: 8.0,   // 8% of user bid pool
      sponsorPoolPercentage: 5.0,   // 5% of sponsor pool
      card: cards[2] 
    }),
    createMockSeasonCardData({ 
      cardId: 4, 
      userBidPoolPercentage: 15.0,  // 15% of user bid pool
      sponsorPoolPercentage: 25.0,  // 25% of sponsor pool
      card: cards[3] 
    }),
  ];

  // Create user cards (simulate users owning different cards)
  const userCards = [
    createMockUserCardData(BigInt(1), cards[0], season.id, BigInt('500')), // User 1: A card
    createMockUserCardData(BigInt(1), cards[1], season.id, BigInt('500')), // User 1: AA card  
    createMockUserCardData(BigInt(2), cards[2], season.id, BigInt('500')), // User 2: S card
    createMockUserCardData(BigInt(3), cards[3], season.id, BigInt('500')), // User 3: SS card
  ];

  // Calculate rewards using new system
  const result = calculateSeasonRewards(userCards, seasonCards, season);

  console.log('Card Reward Breakdown:');
  result.poolInfo.cardRewards.forEach(cardReward => {
    const card = cards.find(c => c.id === cardReward.cardId);
    const seasonCard = seasonCards.find(sc => sc.cardId === cardReward.cardId);
    console.log(`${card?.name} (${card?.rank}):`);
    console.log(`  - User Bid Reward: ${cardReward.userBidReward} CATI (${seasonCard?.userBidPoolPercentage}% of ${season.bidPoolAmount})`);
    console.log(`  - Sponsor Reward: ${cardReward.sponsorReward} CATI (${seasonCard?.sponsorPoolPercentage}% of ${season.additionalTotalPool})`);
    console.log(`  - Total Card Reward: ${cardReward.totalReward} CATI\n`);
  });

  console.log('User Rewards:');
  result.seasonRewards.forEach(userReward => {
    const userCardDetails = userCards.filter(uc => uc.userId === userReward.userId);
    const cardNames = userCardDetails.map(uc => uc.card.name).join(', ');
    console.log(`User ${userReward.userId}: ${userReward.totalReward} CATI (${userReward.poolSharePercentage.toFixed(2)}% of total pool)`);
    console.log(`  - Cards: ${cardNames}\n`);
  });

  console.log('Pool Summary:');
  console.log(`- Total User Bid Rewards: ${result.poolInfo.userBidRewards} CATI`);
  console.log(`- Total Sponsor Rewards: ${result.poolInfo.sponsorRewards} CATI`);
  console.log(`- Total Distributed: ${result.poolInfo.userBidRewards + result.poolInfo.sponsorRewards} CATI`);
  console.log(`- Total Pool: ${result.poolInfo.totalPool} CATI`);
}

/**
 * Test function to demonstrate correct reward splitting when multiple users have the same card type
 */
export function demonstrateRewardSplitting(): void {
  console.log('=== Reward Splitting Test ===\n');
  
  // Create test season
  const season = createMockSeasonData({
    bidPoolAmount: BigInt('30000'),      // 30,000 CATI user pool
    additionalTotalPool: BigInt('60000'), // 60,000 CATI sponsor pool
  });

  console.log('Season Setup:');
  console.log(`- User Bid Pool: ${season.bidPoolAmount} CATI`);
  console.log(`- Sponsor Pool: ${season.additionalTotalPool} CATI`);
  console.log(`- Total Pool: ${season.bidPoolAmount + season.additionalTotalPool} CATI\n`);

  // Create A rank card
  const cardA = createMockCardData({ id: 1, rank: 'A', name: 'Common Card' });

  // Create season card with 20% user bid pool and 10% sponsor pool
  const seasonCardA = createMockSeasonCardData({
    cardId: 1,
    userBidPoolPercentage: 20.0,  // 20% of user bid pool = 6,000 CATI
    sponsorPoolPercentage: 10.0,  // 10% of sponsor pool = 6,000 CATI
    card: cardA
  });

  console.log('Card Configuration:');
  console.log(`${cardA.name} (${cardA.rank}):`);
  console.log(`- User Bid Pool Allocation: ${seasonCardA.userBidPoolPercentage}% = ${Number(season.bidPoolAmount) * seasonCardA.userBidPoolPercentage / 100} CATI`);
  console.log(`- Sponsor Pool Allocation: ${seasonCardA.sponsorPoolPercentage}% = ${Number(season.additionalTotalPool) * seasonCardA.sponsorPoolPercentage / 100} CATI`);
  console.log(`- Total Pool for Card Type: ${(Number(season.bidPoolAmount) * seasonCardA.userBidPoolPercentage / 100) + (Number(season.additionalTotalPool) * seasonCardA.sponsorPoolPercentage / 100)} CATI\n`);

  // Create 3 users each with 1 A card (your test scenario)
  const userCards = [
    createMockUserCardData(BigInt(1), cardA, season.id, BigInt('500')), // User 1: A card
    createMockUserCardData(BigInt(2), cardA, season.id, BigInt('500')), // User 2: A card  
    createMockUserCardData(BigInt(3), cardA, season.id, BigInt('500')), // User 3: A card
  ];

  console.log('Test Scenario:');
  console.log('- 3 users each own 1 A card');
  console.log('- Expected: Total reward of 12,000 CATI split equally = 4,000 CATI each\n');

  // Calculate rewards
  const result = calculateSeasonRewards(userCards, [seasonCardA], season);

  console.log('Results:');
  console.log('Card Type Summary:');
  result.poolInfo.cardRewards.forEach(cardReward => {
    console.log(`${cardA.name} (${cardA.rank}):`);
    console.log(`  - Total User Bid Reward Pool: ${cardReward.userBidReward} CATI`);
    console.log(`  - Total Sponsor Reward Pool: ${cardReward.sponsorReward} CATI`);
    console.log(`  - Total Reward Pool for Card Type: ${cardReward.totalReward} CATI`);
    console.log(`  - Number of Cards: ${cardReward.totalCards}`);
    console.log(`  - Reward Per Individual Card: ${cardReward.perCardReward} CATI\n`);
  });

  console.log('Individual User Rewards:');
  result.seasonRewards.forEach((userReward, index) => {
    console.log(`User ${userReward.userId}: ${userReward.totalReward} CATI (${userReward.poolSharePercentage.toFixed(2)}% of total pool)`);
  });

  // Verify the math
  const expectedTotalPool = 6000 + 6000; // 20% of 30k + 10% of 60k
  const expectedPerCard = expectedTotalPool / 3; // Split among 3 cards
  const actualPerCard = Number(result.seasonRewards[0]?.totalReward || 0);

  console.log('\nVerification:');
  console.log(`Expected total pool for A cards: ${expectedTotalPool} CATI`);
  console.log(`Expected reward per A card: ${expectedPerCard} CATI`);
  console.log(`Actual reward per A card: ${actualPerCard} CATI`);
  console.log(`✅ Math is correct: ${expectedPerCard === actualPerCard ? 'YES' : 'NO'}`);

  console.log('\n' + '='.repeat(50) + '\n');
}

/**
 * Test function to demonstrate that rewards are only allocated for card types that actually exist
 */
export function demonstrateRewardAllocationForExistingCards(): void {
  console.log('=== Reward Allocation Test (Only Existing Cards) ===\n');
  
  // Create test season
  const season = createMockSeasonData({
    bidPoolAmount: BigInt('50000'),      // 50,000 CATI user pool
    additionalTotalPool: BigInt('100000'), // 100,000 CATI sponsor pool
  });

  console.log('Season Setup:');
  console.log(`- User Bid Pool: ${season.bidPoolAmount} CATI`);
  console.log(`- Sponsor Pool: ${season.additionalTotalPool} CATI`);
  console.log(`- Total Pool: ${season.bidPoolAmount + season.additionalTotalPool} CATI\n`);

  // Create all 4 card types
  const cards = [
    createMockCardData({ id: 1, rank: 'A', name: 'Common Card' }),
    createMockCardData({ id: 2, rank: 'AA', name: 'Uncommon Card' }),
    createMockCardData({ id: 3, rank: 'S', name: 'Rare Card' }),
    createMockCardData({ id: 4, rank: 'SS', name: 'Ultra Rare Card' }),
  ];

  // Create season cards for all types (but users will only own some)
  const seasonCards = [
    createMockSeasonCardData({ 
      cardId: 1, 
      userBidPoolPercentage: 5.0,   // 5% of user bid pool
      sponsorPoolPercentage: 3.0,   // 3% of sponsor pool
      card: cards[0] 
    }),
    createMockSeasonCardData({ 
      cardId: 2, 
      userBidPoolPercentage: 8.0,   // 8% of user bid pool
      sponsorPoolPercentage: 5.0,   // 5% of sponsor pool
      card: cards[1] 
    }),
    createMockSeasonCardData({ 
      cardId: 3, 
      userBidPoolPercentage: 15.0,  // 15% of user bid pool
      sponsorPoolPercentage: 10.0,  // 10% of sponsor pool
      card: cards[2] 
    }),
    createMockSeasonCardData({ 
      cardId: 4, 
      userBidPoolPercentage: 30.0,  // 30% of user bid pool
      sponsorPoolPercentage: 25.0,  // 25% of sponsor pool
      card: cards[3] 
    }),
  ];

  console.log('All Available Card Configurations:');
  seasonCards.forEach(sc => {
    const card = cards.find(c => c.id === sc.cardId);
    const userBidAllocation = Number(season.bidPoolAmount) * sc.userBidPoolPercentage / 100;
    const sponsorAllocation = Number(season.additionalTotalPool) * sc.sponsorPoolPercentage / 100;
    console.log(`${card?.name} (${card?.rank}): ${userBidAllocation + sponsorAllocation} CATI potential (${sc.userBidPoolPercentage}% bid + ${sc.sponsorPoolPercentage}% sponsor)`);
  });

  const totalPotentialUserBid = seasonCards.reduce((sum, sc) => sum + (Number(season.bidPoolAmount) * sc.userBidPoolPercentage / 100), 0);
  const totalPotentialSponsor = seasonCards.reduce((sum, sc) => sum + (Number(season.additionalTotalPool) * sc.sponsorPoolPercentage / 100), 0);
  console.log(`\nTotal Potential Allocation: ${totalPotentialUserBid + totalPotentialSponsor} CATI\n`);

  // Users only own A and S cards (AA and SS cards were never opened)
  const userCards = [
    createMockUserCardData(BigInt(1), cards[0], season.id, BigInt('500')), // User 1: A card
    createMockUserCardData(BigInt(2), cards[0], season.id, BigInt('500')), // User 2: A card
    createMockUserCardData(BigInt(3), cards[2], season.id, BigInt('500')), // User 3: S card
  ];

  console.log('Actual User Cards in Circulation:');
  const cardTypeCounts: Record<string, number> = {};
  userCards.forEach(uc => {
    cardTypeCounts[uc.card.name] = (cardTypeCounts[uc.card.name] || 0) + 1;
  });
  Object.entries(cardTypeCounts).forEach(([name, count]) => {
    console.log(`- ${name}: ${count} cards`);
  });
  console.log('- Uncommon Card: 0 cards (never opened)');
  console.log('- Ultra Rare Card: 0 cards (never opened)\n');

  // Calculate rewards
  const result = calculateSeasonRewards(userCards, seasonCards, season);

  console.log('RESULT - Only Existing Cards Get Rewards:');
  console.log('Actual Reward Distribution:');
  result.poolInfo.cardRewards.forEach(cardReward => {
    const card = cards.find(c => c.id === cardReward.cardId);
    console.log(`${card?.name} (${cardReward.totalCards} cards): ${cardReward.totalReward} CATI total, ${cardReward.perCardReward} CATI each`);
  });

  const totalActualDistribution = result.poolInfo.userBidRewards + result.poolInfo.sponsorRewards;
  console.log(`\nTotal Actually Distributed: ${totalActualDistribution} CATI`);
  console.log(`Potential vs Actual: ${totalPotentialUserBid + totalPotentialSponsor} vs ${totalActualDistribution}`);
  console.log(`Saved (not wasted): ${(totalPotentialUserBid + totalPotentialSponsor) - Number(totalActualDistribution)} CATI`);
  
  console.log(`\n✅ Cards that don't exist don't waste reward allocation!`);
  console.log('\n' + '='.repeat(60) + '\n');
}

// Uncomment to run the demonstration
// demonstrateNewRewardSystem();

// Uncomment to run the test
// demonstrateRewardSplitting();

// Uncomment to run the reward allocation test
// demonstrateRewardAllocationForExistingCards();
