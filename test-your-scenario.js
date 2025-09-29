const { 
  calculateSeasonRewards, 
  createMockSeasonData, 
  createMockCardData, 
  createMockSeasonCardData, 
  createMockUserCardData 
} = require('./src/lib/reward-calculator.ts');

function testYourScenario() {
  console.log('=== Testing Your Exact Scenario ===\n');
  
  // Your test parameters:
  // Total user bid amount: 2000, Sponsor amount: 1000
  // A: 10 cards, SS: 2 cards, AA: 0 cards, S: 0 cards
  // A card: 10% user bid, 10% sponsor
  // SS card: 70% user bid, 90% sponsor
  
  const season = createMockSeasonData({
    bidPoolAmount: BigInt('2000'),    // 2000 CATI user bid pool
    additionalTotalPool: BigInt('1000'), // 1000 CATI sponsor pool
  });

  console.log('Season Setup:');
  console.log(`- User Bid Pool: ${season.bidPoolAmount} CATI`);
  console.log(`- Sponsor Pool: ${season.additionalTotalPool} CATI`);
  console.log(`- Total Pool: ${season.bidPoolAmount + season.additionalTotalPool} CATI\n`);

  // Create card types
  const cardA = createMockCardData({ id: 1, rank: 'A', name: 'A Card' });
  const cardSS = createMockCardData({ id: 4, rank: 'SS', name: 'SS Card' });

  // Create season cards with your percentages
  const seasonCards = [
    createMockSeasonCardData({
      cardId: 1,
      userBidPoolPercentage: 10.0,  // 10% of user bid pool
      sponsorPoolPercentage: 10.0,  // 10% of sponsor pool
      card: cardA
    }),
    createMockSeasonCardData({
      cardId: 4,
      userBidPoolPercentage: 70.0,  // 70% of user bid pool  
      sponsorPoolPercentage: 90.0,  // 90% of sponsor pool
      card: cardSS
    }),
  ];

  // Create user cards: 10 A cards, 2 SS cards, 0 AA cards, 0 S cards
  const userCards = [];
  
  // 10 A cards (different users)
  for (let i = 1; i <= 10; i++) {
    userCards.push(createMockUserCardData(BigInt(i), cardA, season.id, BigInt('100')));
  }
  
  // 2 SS cards (different users)  
  for (let i = 11; i <= 12; i++) {
    userCards.push(createMockUserCardData(BigInt(i), cardSS, season.id, BigInt('100')));
  }

  console.log('Card Configuration:');
  console.log('A Cards:');
  console.log(`  - Count: 10 cards`);
  console.log(`  - User Bid %: 10%`);  
  console.log(`  - Sponsor %: 10%`);
  console.log('SS Cards:');
  console.log(`  - Count: 2 cards`);
  console.log(`  - User Bid %: 70%`);
  console.log(`  - Sponsor %: 90%`);
  console.log('AA Cards: 0 cards (skipped)');
  console.log('S Cards: 0 cards (skipped)\n');

  // Calculate rewards
  const result = calculateSeasonRewards(userCards, seasonCards, season);

  console.log('Expected Calculations:');
  console.log('For A Cards:');
  console.log(`  - Total User Bid Pool for A: 2000 * 10% = ${2000 * 0.10} CATI`);
  console.log(`  - Total Sponsor Pool for A: 1000 * 10% = ${1000 * 0.10} CATI`);
  console.log(`  - Total Pool for A Cards: ${2000 * 0.10 + 1000 * 0.10} CATI`);
  console.log(`  - Per A Card: (2000*10%)/10 + (1000*10%)/10 = ${(2000*0.10)/10} + ${(1000*0.10)/10} = ${(2000*0.10)/10 + (1000*0.10)/10} CATI`);
  
  console.log('\nFor SS Cards:');
  console.log(`  - Total User Bid Pool for SS: 2000 * 70% = ${2000 * 0.70} CATI`);
  console.log(`  - Total Sponsor Pool for SS: 1000 * 90% = ${1000 * 0.90} CATI`);
  console.log(`  - Total Pool for SS Cards: ${2000 * 0.70 + 1000 * 0.90} CATI`);
  console.log(`  - Per SS Card: (2000*70%)/2 + (1000*90%)/2 = ${(2000*0.70)/2} + ${(1000*0.90)/2} = ${(2000*0.70)/2 + (1000*0.90)/2} CATI`);

  console.log('\n=== ACTUAL RESULTS ===');
  console.log('Card Type Breakdown:');
  result.poolInfo.cardRewards.forEach(cardReward => {
    const isACard = cardReward.cardId === 1;
    const cardName = isACard ? 'A Card' : 'SS Card';
    
    console.log(`${cardName}:`);
    console.log(`  - Total User Bid Reward Pool: ${cardReward.userBidReward} CATI`);
    console.log(`  - Total Sponsor Reward Pool: ${cardReward.sponsorReward} CATI`);
    console.log(`  - Total Reward Pool for Card Type: ${cardReward.totalReward} CATI`);
    console.log(`  - Number of Cards: ${cardReward.totalCards}`);
    console.log(`  - Reward Per Individual Card: ${cardReward.perCardReward} CATI`);
    
    if (isACard) {
      const expected = (2000*0.10)/10 + (1000*0.10)/10;
      console.log(`  - Expected Per Card: ${expected} CATI`);
      console.log(`  - ✅ Matches: ${Number(cardReward.perCardReward) === expected ? 'YES' : 'NO'}`);
    } else {
      const expected = (2000*0.70)/2 + (1000*0.90)/2;
      console.log(`  - Expected Per Card: ${expected} CATI`);
      console.log(`  - ✅ Matches: ${Number(cardReward.perCardReward) === expected ? 'YES' : 'NO'}`);
    }
    console.log();
  });

  console.log('Summary:');
  const aCardReward = result.poolInfo.cardRewards.find(cr => cr.cardId === 1);
  const ssCardReward = result.poolInfo.cardRewards.find(cr => cr.cardId === 4);
  
  console.log(`Each A Card gets: ${aCardReward?.perCardReward || 0} CATI`);
  console.log(`Each SS Card gets: ${ssCardReward?.perCardReward || 0} CATI`);
  
  const expectedACard = (2000*0.10)/10 + (1000*0.10)/10;
  const expectedSSCard = (2000*0.70)/2 + (1000*0.90)/2;
  
  console.log(`\n✅ Formula Verification:`);
  console.log(`A Card: Expected ${expectedACard} = Actual ${Number(aCardReward?.perCardReward || 0)} = ${expectedACard === Number(aCardReward?.perCardReward || 0) ? 'MATCH' : 'MISMATCH'}`);
  console.log(`SS Card: Expected ${expectedSSCard} = Actual ${Number(ssCardReward?.perCardReward || 0)} = ${expectedSSCard === Number(ssCardReward?.perCardReward || 0) ? 'MATCH' : 'MISMATCH'}`);
}

testYourScenario();
