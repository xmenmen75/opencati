const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function resetDatabase() {
  console.log('🔄 Starting database reset...');
  
  try {
    // Start a transaction to ensure atomicity
    await prisma.$transaction(async (tx) => {
      
      // 1. Delete all user cards
      console.log('🗑️  Deleting all user cards...');
      const deletedUserCards = await tx.userCard.deleteMany({});
      console.log(`   ✅ Deleted ${deletedUserCards.count} user cards`);
      
      // 2. Delete all CATI transactions
      console.log('🗑️  Deleting all CATI transactions...');
      const deletedTransactions = await tx.catiTransaction.deleteMany({});
      console.log(`   ✅ Deleted ${deletedTransactions.count} transactions`);
      
      // 3. Delete all withdrawals
      console.log('🗑️  Deleting all withdrawals...');
      const deletedWithdrawals = await tx.withdrawal.deleteMany({});
      console.log(`   ✅ Deleted ${deletedWithdrawals.count} withdrawals`);
      
      // 4. Delete all deposits
      console.log('🗑️  Deleting all deposits...');
      const deletedDeposits = await tx.deposit.deleteMany({});
      console.log(`   ✅ Deleted ${deletedDeposits.count} deposits`);
      
      // 5. Delete all season rewards
      console.log('🗑️  Deleting all season rewards...');
      const deletedSeasonRewards = await tx.seasonReward.deleteMany({});
      console.log(`   ✅ Deleted ${deletedSeasonRewards.count} season rewards`);
      
      // 6. Reset all users' CATI balance to 10,000
      console.log('💰 Resetting user CATI balances to 10,000...');
      const updatedUsers = await tx.user.updateMany({
        data: {
          catiBalance: BigInt(10000),
        },
      });
      console.log(`   ✅ Reset CATI balance for ${updatedUsers.count} users`);
      
      // 7. Delete all existing seasons
      console.log('🗑️  Deleting all seasons...');
      const deletedSeasons = await tx.season.deleteMany({});
      console.log(`   ✅ Deleted ${deletedSeasons.count} seasons`);
      
      // 8. Create a new active season
      console.log('🆕 Creating new active season...');
      const newSeason = await tx.season.create({
        data: {
          name: 'Season 1 - Fresh Start',
          slogan: 'New Beginning Season',
          bidPoolAmount: BigInt(0), // No bids yet
          additionalTotalPool: BigInt(100000), // 100,000 CATI sponsor award
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          status: 'ACTIVE',
        },
      });
      console.log(`   ✅ Created new season: ${newSeason.name} (ID: ${newSeason.id})`);
      
    });
    
    // 9. Display summary
    console.log('\n📊 Reset Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Count remaining data
    const userCount = await prisma.user.count();
    const cardCount = await prisma.card.count();
    const seasonCount = await prisma.season.count();
    
    console.log(`👥 Users preserved: ${userCount}`);
    console.log(`🎴 Cards preserved: ${cardCount}`);
    console.log(`🏆 Active seasons: ${seasonCount}`);
    console.log(`💰 Each user's CATI balance: 10,000`);
    console.log(`🎁 Sponsor pool: 100,000 CATI`);
    console.log(`📅 Season duration: 30 days`);
    
    // Get a sample user to verify
    const sampleUser = await prisma.user.findFirst({
      select: {
        id: true,
        userNickname: true,
        catiBalance: true,
      },
    });
    
    if (sampleUser) {
      console.log(`\n✅ Verification - Sample user "${sampleUser.userNickname}" has balance: ${sampleUser.catiBalance.toString()} CATI`);
    }
    
    console.log('\n🎉 Database reset completed successfully!');
    console.log('🚀 Ready for fresh gameplay!');
    
  } catch (error) {
    console.error('❌ Error during database reset:', error);
    throw error;
  }
}

// Run the reset function
resetDatabase()
  .catch((error) => {
    console.error('💥 Database reset failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('🔌 Database connection closed');
  });
