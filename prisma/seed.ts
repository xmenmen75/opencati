import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CARDS_DATA = [
  // A Rank Cards (2 cards) - 60% total probability, 30% each
  {
    rank: 'A',
    poolSharePercentage: 30.0, // 30% probability
    name: 'Fire Dragon',
    imageUrl: '/images/cards/fire-dragon.png',
    rarityColor: '#3B82F6',
    designer: 'OpenCATI Studio',
  },
  {
    rank: 'A',
    poolSharePercentage: 30.0, // 30% probability
    name: 'Water Spirit',
    imageUrl: '/images/cards/water-spirit.png',
    rarityColor: '#3B82F6',
    designer: 'OpenCATI Studio',
  },
  // AA Rank Cards (2 cards) - 25% total probability, 12.5% each
  {
    rank: 'AA',
    poolSharePercentage: 12.5, // 12.5% probability
    name: 'Lightning Phoenix',
    imageUrl: '/images/cards/lightning-phoenix.png',
    rarityColor: '#8B5CF6',
    designer: 'OpenCATI Studio',
  },
  {
    rank: 'AA',
    poolSharePercentage: 12.5, // 12.5% probability
    name: 'Ice Queen',
    imageUrl: '/images/cards/ice-queen.png',
    rarityColor: '#8B5CF6',
    designer: 'OpenCATI Studio',
  },
  // S Rank Cards (1 card) - 13% probability
  {
    rank: 'S',
    poolSharePercentage: 13.0, // 13% probability
    name: 'Ancient Titan',
    imageUrl: '/images/cards/ancient-titan.png',
    rarityColor: '#EAB308',
    designer: 'OpenCATI Studio',
  },
  // SS Rank Cards (1 card) - 2% probability
  {
    rank: 'SS',
    poolSharePercentage: 2.0, // 2% probability
    name: 'Legendary Beast',
    imageUrl: '/images/cards/legendary-beast.png',
    rarityColor: '#EF4444',
    designer: 'OpenCATI Studio',
  },
];

async function main() {
  try {
    console.log('🌱 Starting database seeding...');

    // Clean up existing data
    console.log('🧹 Cleaning up existing data...');
    await prisma.userCard.deleteMany();
    await prisma.seasonReward.deleteMany();
    await prisma.card.deleteMany();
    await prisma.season.deleteMany();

    // Seed cards
    console.log('🃏 Seeding cards...');
    for (const cardData of CARDS_DATA) {
      await prisma.card.create({
        data: cardData,
      });
    }
    console.log(`✅ Created ${CARDS_DATA.length} cards with proper probabilities:`);
    CARDS_DATA.forEach(card => {
      console.log(`   ${card.rank} - ${card.name}: ${card.poolSharePercentage}%`);
    });

    // Seed season
    console.log('🏆 Seeding season...');
    const season = await prisma.season.create({
      data: {
        name: 'Season 1',
        slogan: 'Big Summer Event Season 1',
        bidPoolAmount: BigInt('5000'), // 5000 CATI
        additionalTotalPool: BigInt('2500'), // 2500 CATI
        startDate: new Date('2024-09-01'),
        endDate: new Date('2024-12-31'),
        status: 'ACTIVE',
      },
    });
    console.log(`✅ Created season: ${season.name}`);

    // Update existing users with initial CATI balance if any exist
    const existingUsers = await prisma.user.findMany();
    if (existingUsers.length > 0) {
      console.log('💰 Updating existing users with CATI balance...');
      for (const user of existingUsers) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            catiBalance: BigInt('1000'), // 1000 CATI for testing
          },
        });
      }
      console.log(`✅ Updated ${existingUsers.length} users with 1000 CATI each`);
    }

    console.log('🎉 Database seeding completed successfully!');
    console.log('📊 Total probability distribution:');
    const totalProb = CARDS_DATA.reduce((sum, card) => sum + card.poolSharePercentage, 0);
    console.log(`   Total: ${totalProb}% (should be 100%)`);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

export { main as seedDatabase };
