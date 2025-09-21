import { 
  calculateSeasonRewards, 
  createMockSeasonData, 
  createMockCardData, 
  createMockUserCardData,
  type UserCardData,
  type SeasonData,
  type CardData 
} from '../reward-calculator';
import { Decimal } from '@prisma/client/runtime/library';

// Test scenario 1: Single user with multiple cards of different ranks
export function testSingleUserMultipleCards() {
  console.log('=== Test: Single User Multiple Cards ===');
  
  // Create mock season with 10,000 CATI sponsor amount
  const season = createMockSeasonData({
    additionalTotalPool: BigInt('10000'),
  });

  // Create mock cards of different ranks
  const cardA = createMockCardData({ 
    id: 1, 
    rank: 'A', 
    name: 'Common Card',
    poolSharePercentage: new Decimal('2.5') 
  });
  
  const cardAA = createMockCardData({ 
    id: 2, 
    rank: 'AA', 
    name: 'Uncommon Card',
    poolSharePercentage: new Decimal('5.0') 
  });
  
  const cardS = createMockCardData({ 
    id: 3, 
    rank: 'S', 
    name: 'Rare Card',
    poolSharePercentage: new Decimal('10.0') 
  });

  // Create user cards (user spent 500 CATI per card)
  const userId = BigInt(1);
  const userCards: UserCardData[] = [
    createMockUserCardData(userId, cardA, season.id, BigInt('500')),
    createMockUserCardData(userId, cardAA, season.id, BigInt('500')),
    createMockUserCardData(userId, cardS, season.id, BigInt('500')),
  ];

  // Calculate rewards
  const result = calculateSeasonRewards(userCards, season);

  console.log('Season:', { 
    name: season.name, 
    sponsorAmount: season.additionalTotalPool.toString() 
  });
  
  console.log('Pool Info:', {
    totalSpent: result.poolInfo.totalSpent.toString(),
    totalPool: result.poolInfo.totalPool.toString(),
    rankPools: Object.entries(result.poolInfo.rankPools).reduce((acc: Record<string, string>, [rank, amount]) => {
      acc[rank] = (amount as bigint).toString();
      return acc;
    }, {}),
    rankCounts: result.poolInfo.rankCounts,
    rewardPerCard: Object.entries(result.poolInfo.rewardPerCard).reduce((acc: Record<string, string>, [rank, amount]) => {
      acc[rank] = (amount as bigint).toString();
      return acc;
    }, {}),
  });

  console.log('User Rewards:', result.seasonRewards.map((reward: any) => ({
    userId: reward.userId.toString(),
    totalReward: reward.totalReward.toString(),
    poolSharePercentage: reward.poolSharePercentage,
  })));

  console.log('Individual Card Rewards:', result.userCards.map((card: any) => ({
    cardId: card.id,
    userId: card.userId.toString(),
    reward: card.catiReward.toString(),
  })));

  console.log('\n');
  return result;
}

// Test scenario 2: Multiple users competing for same rank rewards
export function testMultipleUsersCompeting() {
  console.log('=== Test: Multiple Users Competing ===');
  
  const season = createMockSeasonData({
    additionalTotalPool: BigInt('20000'), // Higher sponsor amount
  });

  // Create cards
  const cardA1 = createMockCardData({ id: 1, rank: 'A', name: 'Common Card 1' });
  const cardA2 = createMockCardData({ id: 2, rank: 'A', name: 'Common Card 2' });
  const cardAA = createMockCardData({ id: 3, rank: 'AA', name: 'Uncommon Card' });
  const cardSS = createMockCardData({ id: 4, rank: 'SS', name: 'Ultra Rare Card' });

  // Create multiple users with different card combinations
  const user1 = BigInt(1);
  const user2 = BigInt(2);
  const user3 = BigInt(3);

  const userCards: UserCardData[] = [
    // User 1: Has 2 A rank cards
    createMockUserCardData(user1, cardA1, season.id, BigInt('500')),
    createMockUserCardData(user1, cardA2, season.id, BigInt('500')),
    
    // User 2: Has 1 A rank and 1 AA rank
    createMockUserCardData(user2, cardA1, season.id, BigInt('500')),
    createMockUserCardData(user2, cardAA, season.id, BigInt('500')),
    
    // User 3: Has the ultra rare SS card
    createMockUserCardData(user3, cardSS, season.id, BigInt('500')),
  ];

  const result = calculateSeasonRewards(userCards, season);

  console.log('Multiple Users Competition Results:');
  console.log('Total Pool:', result.poolInfo.totalPool.toString());
  console.log('Rank Distributions:', {
    A: `${result.poolInfo.rankCounts['A'] || 0} cards, ${result.poolInfo.rankPools['A']?.toString()} CATI pool`,
    AA: `${result.poolInfo.rankCounts['AA'] || 0} cards, ${result.poolInfo.rankPools['AA']?.toString()} CATI pool`,
    S: `${result.poolInfo.rankCounts['S'] || 0} cards, ${result.poolInfo.rankPools['S']?.toString()} CATI pool`,
    SS: `${result.poolInfo.rankCounts['SS'] || 0} cards, ${result.poolInfo.rankPools['SS']?.toString()} CATI pool`,
  });

  console.log('User Final Rewards:');
  result.seasonRewards.forEach((reward: any) => {
    const userCardCount = userCards.filter(uc => uc.userId === reward.userId).length;
    console.log(`User ${reward.userId.toString()}: ${reward.totalReward.toString()} CATI (${reward.poolSharePercentage.toFixed(3)}% of pool) with ${userCardCount} cards`);
  });

  console.log('\n');
  return result;
}

// Test scenario 3: Edge case - No sponsor amount, only user spending
export function testNoSponsorAmount() {
  console.log('=== Test: No Sponsor Amount ===');
  
  const season = createMockSeasonData({
    additionalTotalPool: BigInt('0'), // No sponsor amount
  });

  const cardA = createMockCardData({ id: 1, rank: 'A', name: 'Only Card' });
  const user1 = BigInt(1);
  
  const userCards: UserCardData[] = [
    createMockUserCardData(user1, cardA, season.id, BigInt('1000')),
  ];

  const result = calculateSeasonRewards(userCards, season);

  console.log('No Sponsor Test Results:');
  console.log('Total Pool (should equal total spent):', result.poolInfo.totalPool.toString());
  console.log('User Reward:', result.seasonRewards[0]?.totalReward.toString());
  console.log('Pool Share (should be 4% for A rank):', result.seasonRewards[0]?.poolSharePercentage);

  console.log('\n');
  return result;
}

// Test scenario 4: Large scale test with many users and cards
export function testLargeScale() {
  console.log('=== Test: Large Scale ===');
  
  const season = createMockSeasonData({
    additionalTotalPool: BigInt('100000'), // Large sponsor amount
  });

  // Create various cards
  const cards: CardData[] = [
    createMockCardData({ id: 1, rank: 'A', name: 'Common 1' }),
    createMockCardData({ id: 2, rank: 'A', name: 'Common 2' }),
    createMockCardData({ id: 3, rank: 'A', name: 'Common 3' }),
    createMockCardData({ id: 4, rank: 'AA', name: 'Uncommon 1' }),
    createMockCardData({ id: 5, rank: 'AA', name: 'Uncommon 2' }),
    createMockCardData({ id: 6, rank: 'S', name: 'Rare 1' }),
    createMockCardData({ id: 7, rank: 'SS', name: 'Ultra Rare 1' }),
  ];

  // Simulate 10 users with random card distributions
  const userCards: UserCardData[] = [];
  
  for (let userId = 1; userId <= 10; userId++) {
    const userBigInt = BigInt(userId);
    const cardCount = Math.floor(Math.random() * 5) + 1; // 1-5 cards per user
    
    for (let cardIndex = 0; cardIndex < cardCount; cardIndex++) {
      const randomCard = cards[Math.floor(Math.random() * cards.length)];
      userCards.push(createMockUserCardData(userBigInt, randomCard, season.id, BigInt('500')));
    }
  }

  const result = calculateSeasonRewards(userCards, season);

  console.log('Large Scale Test Results:');
  console.log(`Total Users: ${result.seasonRewards.length}`);
  console.log(`Total Cards: ${userCards.length}`);
  console.log(`Total Pool: ${result.poolInfo.totalPool.toString()} CATI`);
  
  console.log('Rank Distribution:');
  Object.entries(result.poolInfo.rankCounts).forEach(([rank, count]) => {
    const pool = result.poolInfo.rankPools[rank]?.toString() || '0';
    const rewardPerCard = result.poolInfo.rewardPerCard[rank]?.toString() || '0';
    console.log(`  ${rank}: ${count} cards, ${pool} CATI pool, ${rewardPerCard} CATI per card`);
  });

  console.log('Top 3 Earners:');
  const topEarners = result.seasonRewards
    .sort((a: any, b: any) => Number(b.totalReward - a.totalReward))
    .slice(0, 3);
    
  topEarners.forEach((earner: any, index: number) => {
    const userCardCount = userCards.filter(uc => uc.userId === earner.userId).length;
    console.log(`  ${index + 1}. User ${earner.userId.toString()}: ${earner.totalReward.toString()} CATI (${earner.poolSharePercentage.toFixed(3)}%) with ${userCardCount} cards`);
  });

  console.log('\n');
  return result;
}

// Test scenario 5: Specific business scenario with detailed user data
export function testSpecificBusinessScenario() {
  console.log('=== Test: Specific Business Scenario ===');
  
  const season = createMockSeasonData({
    additionalTotalPool: BigInt('100000'), // 100,000 CATI sponsor award
  });

  // Create cards for each rank
  const cardA = createMockCardData({ id: 1, rank: 'A', name: 'Common Card' });
  const cardAA = createMockCardData({ id: 2, rank: 'AA', name: 'Uncommon Card' });
  const cardS = createMockCardData({ id: 3, rank: 'S', name: 'Rare Card' });
  const cardSS = createMockCardData({ id: 4, rank: 'SS', name: 'Ultra Rare Card' });

  // Create user cards based on the specified scenario
  const userCards: UserCardData[] = [
    // User 1: 3 opens, 15,000 spent, 2 A cards
    createMockUserCardData(BigInt(1), cardA, season.id, BigInt('7500')), // 15000 / 2 = 7500 per card
    createMockUserCardData(BigInt(1), cardA, season.id, BigInt('7500')),
    
    // User 2: 2 opens, 10,000 spent, 1 AA card  
    createMockUserCardData(BigInt(2), cardAA, season.id, BigInt('10000')),
    
    // User 3: 5 opens, 25,000 spent, 1 A + 1 AA card
    createMockUserCardData(BigInt(3), cardA, season.id, BigInt('12500')), // 25000 / 2 = 12500 per card
    createMockUserCardData(BigInt(3), cardAA, season.id, BigInt('12500')),
    
    // User 4: 4 opens, 20,000 spent, 1 A + 1 S card
    createMockUserCardData(BigInt(4), cardA, season.id, BigInt('10000')), // 20000 / 2 = 10000 per card
    createMockUserCardData(BigInt(4), cardS, season.id, BigInt('10000')),
    
    // User 5: 1 open, 5,000 spent, 1 SS card
    createMockUserCardData(BigInt(5), cardSS, season.id, BigInt('5000')),
  ];

  const result = calculateSeasonRewards(userCards, season);

  console.log('Business Scenario Results:');
  console.log(`Sponsor Award: ${season.additionalTotalPool.toString()} CATI`);
  console.log(`Total User Spending: ${result.poolInfo.totalSpent.toString()} CATI`);
  console.log(`Total Pool: ${result.poolInfo.totalPool.toString()} CATI`);
  
  console.log('\nCard Distribution:');
  console.log(`A cards: ${result.poolInfo.rankCounts['A'] || 0} (Pool: ${result.poolInfo.rankPools['A']?.toString()} CATI, Reward per card: ${result.poolInfo.rewardPerCard['A']?.toString()} CATI)`);
  console.log(`AA cards: ${result.poolInfo.rankCounts['AA'] || 0} (Pool: ${result.poolInfo.rankPools['AA']?.toString()} CATI, Reward per card: ${result.poolInfo.rewardPerCard['AA']?.toString()} CATI)`);
  console.log(`S cards: ${result.poolInfo.rankCounts['S'] || 0} (Pool: ${result.poolInfo.rankPools['S']?.toString()} CATI, Reward per card: ${result.poolInfo.rewardPerCard['S']?.toString()} CATI)`);
  console.log(`SS cards: ${result.poolInfo.rankCounts['SS'] || 0} (Pool: ${result.poolInfo.rankPools['SS']?.toString()} CATI, Reward per card: ${result.poolInfo.rewardPerCard['SS']?.toString()} CATI)`);

  console.log('\nUser Results:');
  console.log('User\tOpens\tSpent\tA\tAA\tS\tSS\tEarned\tExpected');
  
  // Expected earnings from your table
  const expectedEarnings = {
    1: 3500,
    2: 8750,
    3: 10500,
    4: 22750,
    5: 122500,
  };

  result.seasonRewards.forEach((reward: any) => {
    const userId = Number(reward.userId.toString());
    const userCardDetails = userCards.filter(uc => uc.userId === reward.userId);
    const totalSpent = userCardDetails.reduce((sum, card) => sum + card.catiSpent, BigInt(0));
    const openCount = userCardDetails.length; // Since some users had failed opens, this might not match exactly
    
    // Count cards by rank for this user
    const cardCounts = { A: 0, AA: 0, S: 0, SS: 0 };
    userCardDetails.forEach(card => {
      const rank = card.card.rank as keyof typeof cardCounts;
      cardCounts[rank]++;
    });
    
    const actualEarned = Number(reward.totalReward.toString());
    const expected = expectedEarnings[userId as keyof typeof expectedEarnings] || 0;
    const match = Math.abs(actualEarned - expected) < 100 ? '✅' : '❌'; // Allow small rounding differences
    
    console.log(`User${userId}\t${openCount}\t${totalSpent.toString()}\t${cardCounts.A}\t${cardCounts.AA}\t${cardCounts.S}\t${cardCounts.SS}\t${actualEarned}\t${expected} ${match}`);
  });

  // Verify total earnings match total pool
  const totalEarned = result.seasonRewards.reduce((sum: number, reward: any) => sum + Number(reward.totalReward.toString()), 0);
  const totalPool = Number(result.poolInfo.totalPool.toString());
  console.log(`\nTotal Distributed: ${totalEarned} CATI`);
  console.log(`Total Pool: ${totalPool} CATI`);
  console.log(`Match: ${Math.abs(totalEarned - totalPool) < 100 ? '✅' : '❌'}`);

  console.log('\n');
  return result;
}

// Run all tests
export function runAllRewardTests() {
  console.log('🧪 Running Reward Calculation Tests\n');
  
  const results = {
    // singleUser: testSingleUserMultipleCards(),
    // multipleUsers: testMultipleUsersCompeting(),
    // noSponsor: testNoSponsorAmount(),
    // largeScale: testLargeScale(),
    businessScenario: testSpecificBusinessScenario(),
  };

  console.log('✅ All reward calculation tests completed!');
  return results;
}

// Export for use in other test files or direct execution
if (require.main === module) {
  runAllRewardTests();
}
