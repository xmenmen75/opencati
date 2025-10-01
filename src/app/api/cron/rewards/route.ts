import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateSeasonRewardsWithSeasonCards } from '@/lib/reward-calculator';

export async function POST(request: NextRequest) {
  try {
    // Verify this is an internal cron request
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[CRON] Starting reward calculation...');

    // Get all active seasons
    const activeSeasons = await prisma.season.findMany({
      where: { status: 'ACTIVE' },
    });

    let totalUpdatedSeasons = 0;
    let totalUpdatedUserCards = 0;
    let totalUpdatedSeasonRewards = 0;

    for (const season of activeSeasons) {
      console.log(`[CRON] Processing season: ${season.name} (ID: ${season.id})`);

      // Get all user cards for this season
      const userCards = await prisma.userCard.findMany({
        where: { seasonId: season.id },
        include: {
          card: true,
          user: true,
        },
      });

      if (userCards.length === 0) {
        console.log(`[CRON] No user cards found for season ${season.id}, skipping...`);
        continue;
      }

      // Calculate rewards using transaction for consistency
      await prisma.$transaction(async (tx) => {
        // Use the reward calculator
        const calculationResult = await calculateSeasonRewardsWithSeasonCards(userCards, season, tx);

        // Update all user cards with new rewards
        for (const userCardUpdate of calculationResult.userCards) {
          await tx.userCard.update({
            where: { id: userCardUpdate.id },
            data: {
              catiReward: userCardUpdate.catiReward,
            },
          });
        }

        // Update or create season rewards
        for (const seasonReward of calculationResult.seasonRewards) {
          // Check if season reward already exists
          const existingReward = await tx.seasonReward.findFirst({
            where: {
              seasonId: season.id,
              userId: seasonReward.userId,
            },
          });

          if (existingReward) {
            await tx.seasonReward.update({
              where: { id: existingReward.id },
              data: {
                totalPoolShare: seasonReward.poolSharePercentage,
                rewardAmount: seasonReward.totalReward,
              },
            });
          } else {
            await tx.seasonReward.create({
              data: {
                seasonId: season.id,
                userId: seasonReward.userId,
                totalPoolShare: seasonReward.poolSharePercentage,
                rewardAmount: seasonReward.totalReward,
              },
            });
          }
        }

        totalUpdatedUserCards += calculationResult.userCards.length;
        totalUpdatedSeasonRewards += calculationResult.seasonRewards.length;
        totalUpdatedSeasons++;

        console.log(`[CRON] Updated ${calculationResult.userCards.length} user cards and ${calculationResult.seasonRewards.length} season rewards for season ${season.id}`);
      });
    }

    const result = {
      success: true,
      message: 'Reward calculation completed',
      stats: {
        seasonsProcessed: totalUpdatedSeasons,
        userCardsUpdated: totalUpdatedUserCards,
        seasonRewardsUpdated: totalUpdatedSeasonRewards,
      },
      timestamp: new Date().toISOString(),
    };

    console.log('[CRON] Reward calculation completed:', result.stats);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[CRON] Error calculating rewards:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// GET endpoint for health check
export async function GET() {
  return NextResponse.json({ 
    status: 'healthy', 
    message: 'Reward calculation cron endpoint is active',
    timestamp: new Date().toISOString(),
  });
}
