const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testRewardCalculation() {
  try {
    console.log('=== Testing Reward Calculation with Real Data ===\n');
    
    // Get season data
    const season = await prisma.season.findFirst();
    console.log('Season:', {
      bidPoolAmount: season.bidPoolAmount.toString(),
      additionalTotalPool: season.additionalTotalPool.toString()
    });
    
    // Get A rank cards (should have 3% user bid and 2.5% sponsor)
    const aCards = await prisma.seasonCard.findMany({
      where: { card: { rank: 'A' } },
      include: { card: true }
    });
    
    console.log('\nA Rank Cards:');
    aCards.forEach(card => {
      console.log(`- ${card.card.name}: ${card.userBidPoolPercentage}% user bid, ${card.sponsorPoolPercentage}% sponsor`);
    });
    
    // Test calculation manually
    const testPool = 50000; // 50k CATI user bid pool
    const sponsorPool = 100000; // 100k CATI sponsor pool
    
    const aCard = aCards[0];
    const userBidPercentage = Number(aCard.userBidPoolPercentage) / 100;
    const sponsorPercentage = Number(aCard.sponsorPoolPercentage) / 100;
    
    const userBidReward = Math.floor(testPool * userBidPercentage);
    const sponsorReward = Math.floor(sponsorPool * sponsorPercentage);
    const totalReward = userBidReward + sponsorReward;
    
    console.log('\nManual Calculation for A Card:');
    console.log(`User bid percentage: ${aCard.userBidPoolPercentage} / 100 = ${userBidPercentage}`);
    console.log(`Sponsor percentage: ${aCard.sponsorPoolPercentage} / 100 = ${sponsorPercentage}`);
    console.log(`User bid reward: ${testPool} * ${userBidPercentage} = ${userBidReward} CATI`);
    console.log(`Sponsor reward: ${sponsorPool} * ${sponsorPercentage} = ${sponsorReward} CATI`);
    console.log(`Total reward for A card type: ${totalReward} CATI`);
    
    console.log('\nExpected vs Actual:');
    console.log(`Expected user bid (3%): ${testPool * 0.03} CATI`);
    console.log(`Actual user bid: ${userBidReward} CATI`);
    console.log(`Expected sponsor (2.5%): ${sponsorPool * 0.025} CATI`);
    console.log(`Actual sponsor: ${sponsorReward} CATI`);
    console.log(`✅ Conversion is ${userBidReward === testPool * 0.03 && sponsorReward === sponsorPool * 0.025 ? 'CORRECT' : 'INCORRECT'}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testRewardCalculation();
