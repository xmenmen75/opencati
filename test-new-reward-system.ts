#!/usr/bin/env tsx

import { 
  calculateSeasonRewards,
  calculateSeasonRewardsLegacy,
  demonstrateNewRewardSystem,
  createMockSeasonData,
  createMockCardData,
  createMockSeasonCardData,
  createMockUserCardData 
} from './src/lib/reward-calculator';

console.log('🧪 Testing New Dual-Percentage Reward System\n');

// Run the demonstration
demonstrateNewRewardSystem();

console.log('\n' + '='.repeat(80) + '\n');

// Compare old vs new system
console.log('🔄 Comparing Legacy vs New System\n');

// Create test data
const season = createMockSeasonData({
  bidPoolAmount: BigInt('30000'),      // 30,000 CATI from user spending
  additionalTotalPool: BigInt('70000'), // 70,000 CATI sponsor pool
});

const cards = [
  createMockCardData({ id: 1, rank: 'A', name: 'Common Card' }),
  createMockCardData({ id: 2, rank: 'S', name: 'Rare Card' }),
  createMockCardData({ id: 3, rank: 'SS', name: 'Ultra Rare Card' }),
];

// Create season cards with reasonable percentages
const seasonCards = [
  createMockSeasonCardData({ 
    cardId: 1, 
    userBidPoolPercentage: 4.0,   // 4% of user bid pool
    sponsorPoolPercentage: 2.0,   // 2% of sponsor pool
    card: cards[0] 
  }),
  createMockSeasonCardData({ 
    cardId: 2, 
    userBidPoolPercentage: 12.0,  // 12% of user bid pool
    sponsorPoolPercentage: 8.0,   // 8% of sponsor pool
    card: cards[1] 
  }),
  createMockSeasonCardData({ 
    cardId: 3, 
    userBidPoolPercentage: 35.0,  // 35% of user bid pool
    sponsorPoolPercentage: 35.0,  // 35% of sponsor pool
    card: cards[2] 
  }),
];

// Create user cards - same data for both systems
const userCards = [
  createMockUserCardData(BigInt(1), cards[0], season.id, BigInt('500')), // User 1: A card
  createMockUserCardData(BigInt(1), cards[1], season.id, BigInt('500')), // User 1: S card  
  createMockUserCardData(BigInt(2), cards[2], season.id, BigInt('500')), // User 2: SS card
  createMockUserCardData(BigInt(3), cards[0], season.id, BigInt('500')), // User 3: A card
];

console.log('Test Scenario:');
console.log(`- User Bid Pool: ${season.bidPoolAmount} CATI`);
console.log(`- Sponsor Pool: ${season.additionalTotalPool} CATI`);
console.log(`- Total Pool: ${season.bidPoolAmount + season.additionalTotalPool} CATI`);
console.log('- User Cards: 2 A cards, 1 S card, 1 SS card\n');

// Test legacy system
console.log('Legacy System (Rank-based percentages):');
const legacyResult = calculateSeasonRewardsLegacy(userCards, season);
console.log('User Rewards:');
legacyResult.seasonRewards.forEach(reward => {
  console.log(`  User ${reward.userId}: ${reward.totalReward} CATI (${reward.poolSharePercentage.toFixed(2)}%)`);
});
console.log(`Total Distributed: ${legacyResult.poolInfo.userBidRewards} CATI\n`);

// Test new system
console.log('New System (Dual-percentage):');
const newResult = calculateSeasonRewards(userCards, seasonCards, season);
console.log('Card Rewards:');
newResult.poolInfo.cardRewards.forEach(cardReward => {
  const card = cards.find(c => c.id === cardReward.cardId);
  const seasonCard = seasonCards.find(sc => sc.cardId === cardReward.cardId);
  console.log(`  ${card?.name}: ${cardReward.totalReward} CATI (${seasonCard?.userBidPoolPercentage}% bid + ${seasonCard?.sponsorPoolPercentage}% sponsor)`);
});

console.log('\nUser Rewards:');
newResult.seasonRewards.forEach(reward => {
  console.log(`  User ${reward.userId}: ${reward.totalReward} CATI (${reward.poolSharePercentage.toFixed(2)}%)`);
});

console.log(`\nNew System Summary:`);
console.log(`- User Bid Rewards: ${newResult.poolInfo.userBidRewards} CATI`);
console.log(`- Sponsor Rewards: ${newResult.poolInfo.sponsorRewards} CATI`);
console.log(`- Total Distributed: ${newResult.poolInfo.userBidRewards + newResult.poolInfo.sponsorRewards} CATI`);

console.log('\n✅ Test completed successfully!');
