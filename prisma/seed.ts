import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CARDS_DATA = [
  // A Rank Cards (2 cards)
  {
    rank: 'A',
    name: 'Fire Dragon',
    imageUrl: '/images/cards/fire-dragon.png',
    rarityColor: '#3B82F6',
    designer: 'OpenCATI Studio',
  },
  {
    rank: 'A',
    name: 'Water Spirit',
    imageUrl: '/images/cards/water-spirit.png',
    rarityColor: '#3B82F6',
    designer: 'OpenCATI Studio',
  },
  // AA Rank Cards (2 cards)
  {
    rank: 'AA',
    name: 'Lightning Phoenix',
    imageUrl: '/images/cards/lightning-phoenix.png',
    rarityColor: '#8B5CF6',
    designer: 'OpenCATI Studio',
  },
  {
    rank: 'AA',
    name: 'Ice Queen',
    imageUrl: '/images/cards/ice-queen.png',
    rarityColor: '#8B5CF6',
    designer: 'OpenCATI Studio',
  },
  // S Rank Cards (1 card)
  {
    rank: 'S',
    name: 'Ancient Titan',
    imageUrl: '/images/cards/ancient-titan.png',
    rarityColor: '#EAB308',
    designer: 'OpenCATI Studio',
  },
  // SS Rank Cards (1 card)
  {
    rank: 'SS',
    name: 'Legendary Beast',
    imageUrl: '/images/cards/legendary-beast.png',
    rarityColor: '#EF4444',
    designer: 'OpenCATI Studio',
  },
];

// Season card configuration with dual percentages and drop probabilities
const SEASON_CARD_CONFIG = [
  // A Rank Cards - Common rewards, higher drop probability
  {
    rank: 'A',
    userBidPoolPercentage: 3.0,    // 3% of user bid pool per A card (2 cards = 6% total)
    sponsorPoolPercentage: 2.5,    // 2.5% of sponsor pool per A card (2 cards = 5% total)
    dropProbability: 30.0,         // 30% drop chance for each A card
  },
  // AA Rank Cards - Uncommon rewards, moderate drop probability
  {
    rank: 'AA',
    userBidPoolPercentage: 8.0,    // 8% of user bid pool per AA card (2 cards = 16% total)
    sponsorPoolPercentage: 5.0,    // 5% of sponsor pool per AA card (2 cards = 10% total)
    dropProbability: 12.5,         // 12.5% drop chance for each AA card
  },
  // S Rank Cards - Rare rewards, low drop probability
  {
    rank: 'S',
    userBidPoolPercentage: 15.0,   // 15% of user bid pool per S card (1 card = 15% total)
    sponsorPoolPercentage: 12.0,   // 12% of sponsor pool per S card (1 card = 12% total)
    dropProbability: 13.0,         // 13% drop chance
  },
  // SS Rank Cards - Ultra rare rewards, very low drop probability
  {
    rank: 'SS',
    userBidPoolPercentage: 45.0,   // 45% of user bid pool per SS card (1 card = 45% total)
    sponsorPoolPercentage: 40.0,   // 40% of sponsor pool per SS card (1 card = 40% total)
    dropProbability: 2.0,          // 2% drop chance
  },
];

async function main() {
  try {
    console.log('🌱 Starting database seeding...');

    // Clean up existing data
    console.log('🧹 Cleaning up existing data...');
    await prisma.userCard.deleteMany();
    await prisma.seasonReward.deleteMany();
    await prisma.seasonCard.deleteMany();
    await prisma.card.deleteMany();
    await prisma.season.deleteMany();

    // Seed cards
    console.log('🃏 Seeding cards...');
    const createdCards: any[] = [];
    for (const cardData of CARDS_DATA) {
      const card = await prisma.card.create({
        data: cardData,
      });
      createdCards.push(card);
    }
    console.log(`✅ Created ${CARDS_DATA.length} cards:`);
    createdCards.forEach(card => {
      console.log(`   ${card.rank} - ${card.name}`);
    });

    // Seed season
    console.log('🏆 Seeding season...');
    const season = await prisma.season.create({
      data: {
        name: 'Season 1',
        slogan: 'Big Summer Event Season 1',
        bidPoolAmount: BigInt('0'), // Will be calculated from user spending
        additionalTotalPool: BigInt('100000'), // 100,000 CATI sponsor pool
        startDate: new Date('2024-09-01'),
        endDate: new Date('2024-12-31'),
        status: 'ACTIVE',
      },
    });
    console.log(`✅ Created season: ${season.name}`);

    // Seed season cards with dual percentages
    console.log('🎯 Seeding season cards with reward configurations...');
    for (const card of createdCards) {
      const config = SEASON_CARD_CONFIG.find(c => c.rank === card.rank);
      if (config) {
        await prisma.seasonCard.create({
          data: {
            seasonId: season.id,
            cardId: card.id,
            userBidPoolPercentage: config.userBidPoolPercentage,
            sponsorPoolPercentage: config.sponsorPoolPercentage,
            dropProbability: config.dropProbability / 100, // Convert percentage to decimal
            isActive: true,
          },
        });
      }
    }
    console.log(`✅ Created season cards with reward percentages:`);
    SEASON_CARD_CONFIG.forEach(config => {
      const cardsOfRank = createdCards.filter(c => c.rank === config.rank);
      console.log(`   ${config.rank} Rank (${cardsOfRank.length} cards):`);
      console.log(`     - User Bid Pool: ${config.userBidPoolPercentage}% each`);
      console.log(`     - Sponsor Pool: ${config.sponsorPoolPercentage}% each`);
      console.log(`     - Drop Probability: ${config.dropProbability}% each`);
    });

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
    console.log('📊 Drop probability distribution:');
    const totalDropProb = SEASON_CARD_CONFIG.reduce((sum, config) => {
      const cardsOfRank = createdCards.filter(c => c.rank === config.rank);
      return sum + (config.dropProbability * cardsOfRank.length);
    }, 0);
    console.log(`   Total drop probability: ${totalDropProb}%`);
    console.log('💰 Reward distribution per season:');
    console.log(`   Sponsor Pool: ${season.additionalTotalPool} CATI`);
    const totalSponsorAllocation = SEASON_CARD_CONFIG.reduce((sum, config) => {
      const cardsOfRank = createdCards.filter(c => c.rank === config.rank);
      return sum + (config.sponsorPoolPercentage * cardsOfRank.length);
    }, 0);
    console.log(`   Total sponsor allocation: ${totalSponsorAllocation}%`);
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
