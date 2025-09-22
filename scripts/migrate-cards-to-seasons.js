const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrateCardsToSeasons() {
  try {
    console.log('Starting migration of cards to seasons...');

    // Get the active season
    const activeSeason = await prisma.season.findFirst({
      where: { status: 'ACTIVE' }
    });

    if (!activeSeason) {
      console.log('No active season found. Creating one...');
      const newSeason = await prisma.season.create({
        data: {
          name: 'Season 1',
          slogan: 'The Beginning of CATI Trading',
          bidPoolAmount: BigInt(0),
          additionalTotalPool: BigInt(50000), // 50,000 CATI sponsor pool
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31'),
          status: 'ACTIVE'
        }
      });
      console.log(`Created new season: ${newSeason.name}`);
    }

    const season = activeSeason || await prisma.season.findFirst({
      where: { status: 'ACTIVE' }
    });

    // Get all existing cards
    const cards = await prisma.card.findMany();
    console.log(`Found ${cards.length} cards to migrate`);

    // Define probabilities for each rank
    const rankProbabilities = {
      'A': 0.30,   // 30% - Common
      'AA': 0.06,  // 6% - Uncommon  
      'S': 0.02,   // 2% - Rare
      'SS': 0.001  // 0.1% - Ultra Rare
    };

    // Define pool share percentages for each rank
    const rankPoolShares = {
      'A': 4,   // 4%
      'AA': 10,  // 10%
      'S': 12,  // 12%
      'SS': 70  // 70%
    };

    // Create SeasonCard entries for each card
    for (const card of cards) {
      const dropProbability = rankProbabilities[card.rank] || 0.01;
      const poolSharePercentage = rankPoolShares[card.rank] || 2.5;

      // Check if SeasonCard already exists
      const existingSeasonCard = await prisma.seasonCard.findFirst({
        where: {
          seasonId: season.id,
          cardId: card.id
        }
      });

      if (!existingSeasonCard) {
        await prisma.seasonCard.create({
          data: {
            seasonId: season.id,
            cardId: card.id,
            poolSharePercentage: poolSharePercentage,
            dropProbability: dropProbability,
            isActive: true
          }
        });
        console.log(`Created SeasonCard for ${card.name} (${card.rank}) - ${(dropProbability * 100).toFixed(2)}% drop rate`);
      } else {
        console.log(`SeasonCard already exists for ${card.name}`);
      }
    }

    console.log('Migration completed successfully!');

    // Display summary
    const seasonCardCount = await prisma.seasonCard.count({
      where: { seasonId: season.id }
    });
    console.log(`Total SeasonCards for ${season.name}: ${seasonCardCount}`);

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateCardsToSeasons();
