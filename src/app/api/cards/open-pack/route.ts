import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/auth';
import { CardRank } from '@/types/card';
import { Decimal } from '@prisma/client/runtime/library';

// CATI cost per pack opening (reasonable amount)
const PACK_COST = BigInt('500'); // 500 CATI

interface CardWithProbability {
  id: number;
  rank: string;
  poolSharePercentage: Decimal;
  name: string;
  imageUrl: string;
  rarityColor: string;
  designer: string;
}

function selectRandomCard(cards: CardWithProbability[]): CardWithProbability {
  // Define winning probabilities based on rank
  const winningProbabilities = {
    'A': 0.30000,   // 30%
    'AA': 0.06000,  // 6%
    'S': 0.02000,   // 2%
    'SS': 0.00100   // 0.1%
  };
  
  // Group cards by rank
  const cardsByRank = cards.reduce((acc, card) => {
    if (!acc[card.rank]) {
      acc[card.rank] = [];
    }
    acc[card.rank].push(card);
    return acc;
  }, {} as Record<string, CardWithProbability[]>);
  
  // Calculate cumulative probabilities
  const random = Math.random();
  let cumulativeProbability = 0;
  
  for (const [rank, probability] of Object.entries(winningProbabilities)) {
    cumulativeProbability += probability;
    if (random <= cumulativeProbability && cardsByRank[rank] && cardsByRank[rank].length > 0) {
      // Randomly select a card from this rank
      const cardsInRank = cardsByRank[rank];
      const randomCardIndex = Math.floor(Math.random() * cardsInRank.length);
      return cardsInRank[randomCardIndex];
    }
  }
  
  // Fallback to most common rank (A) if something goes wrong
  return cardsByRank['A']?.[0] || cards[0];
}

function calculateCatiSpent(rank: string): bigint {
  // All cards cost the same 500 CATI when opening packs
  return PACK_COST; // 500 CATI for all ranks
}

async function recalculateSeasonRewards(seasonId: bigint, tx: any) {
  // Get current season
  const season = await tx.season.findUnique({
    where: { id: seasonId },
  });

  if (!season) return;

  // Get all user cards for this season
  const userCards = await tx.userCard.findMany({
    where: { seasonId },
    include: {
      card: true,
      user: true,
    },
  });

  // Calculate total pool amount (total spent + sponsor award)
  const totalSpent = userCards.reduce((sum: bigint, userCard: any) => sum + userCard.catiSpent, BigInt(0));
  const totalPool = totalSpent + season.additionalTotalPool;

  // Update season bid pool amount
  await tx.season.update({
    where: { id: seasonId },
    data: {
      bidPoolAmount: totalSpent,
    },
  });

  // Group cards by rank and calculate pools
  const rankPools = {
    'A': (totalPool * BigInt(4)) / BigInt(100),   // 4%
    'AA': (totalPool * BigInt(10)) / BigInt(100), // 10%
    'S': (totalPool * BigInt(12)) / BigInt(100),  // 12%
    'SS': (totalPool * BigInt(70)) / BigInt(100), // 70%
  };

  // Count cards by rank
  const rankCounts = userCards.reduce((counts: Record<string, number>, userCard: any) => {
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

  // Update all user cards with new rewards
  for (const userCard of userCards) {
    const rank = userCard.card.rank;
    const newReward = rewardPerCard[rank] || BigInt(0);
    
    await tx.userCard.update({
      where: { id: userCard.id },
      data: {
        catiReward: newReward,
      },
    });
  }

  // Re-fetch user cards with updated rewards to calculate accurate user totals
  const updatedUserCards = await tx.userCard.findMany({
    where: { seasonId },
    select: {
      userId: true,
      catiReward: true,
    },
  });

  // Calculate and update season rewards for each user
  const userRewards: Record<string, { userId: bigint; totalReward: bigint; poolShare: number }> = {};
  
  for (const userCard of updatedUserCards) {
    const userId = userCard.userId;
    const userIdStr = userId.toString();
    
    if (!userRewards[userIdStr]) {
      userRewards[userIdStr] = {
        userId,
        totalReward: BigInt(0),
        poolShare: 0,
      };
    }
    userRewards[userIdStr].totalReward += userCard.catiReward;
  }

  // Update or create season rewards
  for (const userReward of Object.values(userRewards)) {
    const poolSharePercentage = totalPool > 0 ? 
      Number(userReward.totalReward * BigInt(100000)) / Number(totalPool) / 1000 : 0;

    // Check if season reward already exists
    const existingReward = await tx.seasonReward.findFirst({
      where: {
        seasonId,
        userId: userReward.userId,
      },
    });

    if (existingReward) {
      await tx.seasonReward.update({
        where: { id: existingReward.id },
        data: {
          totalPoolShare: poolSharePercentage,
          rewardAmount: userReward.totalReward,
        },
      });
    } else {
      await tx.seasonReward.create({
        data: {
          seasonId,
          userId: userReward.userId,
          totalPoolShare: poolSharePercentage,
          rewardAmount: userReward.totalReward,
        },
      });
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No authorization token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = verifyJWT(token);
    
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const userId = BigInt(decoded.sub);

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user has enough CATI balance
    if (user.catiBalance < PACK_COST) {
      return NextResponse.json(
        { error: 'Insufficient CATI balance' },
        { status: 400 }
      );
    }

    // Get all available cards
    const cards = await prisma.card.findMany({
      select: {
        id: true,
        rank: true,
        poolSharePercentage: true,
        name: true,
        imageUrl: true,
        rarityColor: true,
        designer: true,
      },
    });

    if (cards.length === 0) {
      return NextResponse.json(
        { error: 'No cards available' },
        { status: 500 }
      );
    }

    // Get active season
    const activeSeason = await prisma.season.findFirst({
      where: { status: 'ACTIVE' },
    });

    if (!activeSeason) {
      return NextResponse.json(
        { error: 'No active season found' },
        { status: 500 }
      );
    }

    // Select a random card based on probabilities
    const selectedCard = selectRandomCard(cards);
    const catiSpent = calculateCatiSpent(selectedCard.rank);

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Deduct CATI from user balance
      await tx.user.update({
        where: { id: userId },
        data: {
          catiBalance: {
            decrement: PACK_COST,
          },
        },
      });

      // Create user card entry
      const userCard = await tx.userCard.create({
        data: {
          userId: userId,
          cardId: selectedCard.id,
          seasonId: activeSeason.id,
          catiSpent: catiSpent,
          catiReward: BigInt('0'), // Will be calculated in recalculateSeasonRewards
        },
      });

      // Create transaction record
      await tx.catiTransaction.create({
        data: {
          userId: userId,
          type: 'SPEND_DRAW',
          amount: -PACK_COST, // Negative for spending
          description: `Opened pack and received ${selectedCard.name}`,
          referenceId: userCard.id,
        },
      });

      // Recalculate all season rewards after this new card
      await recalculateSeasonRewards(activeSeason.id, tx);

      // Get updated user card with new reward
      const updatedUserCard = await tx.userCard.findUnique({
        where: { id: userCard.id },
      });

      return { userCard: updatedUserCard!, selectedCard, activeSeason };
    });

    // Return the opened card
    return NextResponse.json({
      success: true,
      card: {
        id: selectedCard.id.toString(),
        rank: selectedCard.rank,
        name: selectedCard.name,
        imageUrl: selectedCard.imageUrl,
        rarityColor: selectedCard.rarityColor,
        designer: selectedCard.designer,
        poolSharePercentage: selectedCard.poolSharePercentage.toString(),
        catiSpent: result.userCard.catiSpent.toString(),
        catiReward: result.userCard.catiReward.toString(),
        acquiredAt: result.userCard.acquiredAt.toISOString(),
        season: {
          id: activeSeason.id.toString(),
          name: activeSeason.name,
          slogan: activeSeason.slogan,
        },
      },
      newBalance: (user.catiBalance - PACK_COST).toString(),
    });

  } catch (error) {
    console.error('Error opening pack:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to get pack opening probabilities
export async function GET() {
  try {
    // Define winning probabilities based on rank
    const winningProbabilities = {
      'A': 30.0,   // 30%
      'AA': 6.0,   // 6%
      'S': 2.0,    // 2%
      'SS': 0.1    // 0.1%
    };

    // Get all cards with their pool share percentages from database
    const cards = await prisma.card.findMany({
      select: {
        id: true,
        rank: true,
        poolSharePercentage: true,
        name: true,
        rarityColor: true,
      },
      orderBy: {
        poolSharePercentage: 'desc',
      },
    });

    // Group by rank and show both winning probability and pool share
    const probabilitiesByRank = cards.reduce((acc, card) => {
      const rank = card.rank;
      const winningProb = winningProbabilities[rank as keyof typeof winningProbabilities] || 0;
      const poolShare = Number(card.poolSharePercentage);
      
      if (!acc[rank]) {
        acc[rank] = {
          rank,
          winningProbability: winningProb,
          poolSharePercentage: poolShare,
          cards: [],
          color: getColorByRank(rank),
          glowColor: getGlowColorByRank(rank),
        };
      }
      
      acc[rank].cards.push({
        id: card.id,
        name: card.name,
        poolSharePercentage: poolShare,
      });
      
      return acc;
    }, {} as Record<string, any>);

    // Get current season info
    const activeSeason = await prisma.season.findFirst({
      where: { status: 'ACTIVE' },
    });

    let poolInfo = null;
    if (activeSeason) {
      // Calculate current pool information
      const userCards = await prisma.userCard.findMany({
        where: { seasonId: activeSeason.id },
      });

      const totalSpent = userCards.reduce((sum, userCard) => sum + userCard.catiSpent, BigInt(0));
      const totalPool = totalSpent + activeSeason.additionalTotalPool;

      const rankPools = {
        'A': (totalPool * BigInt(4)) / BigInt(100),   // 4%
        'AA': (totalPool * BigInt(10)) / BigInt(100), // 10%
        'S': (totalPool * BigInt(12)) / BigInt(100),  // 12%
        'SS': (totalPool * BigInt(70)) / BigInt(100), // 70%
      };

      poolInfo = {
        totalPool: totalPool.toString(),
        totalSpent: totalSpent.toString(),
        sponsorAmount: activeSeason.additionalTotalPool.toString(),
        rankPools: Object.entries(rankPools).reduce((acc, [rank, amount]) => {
          acc[rank] = amount.toString();
          return acc;
        }, {} as Record<string, string>),
      };
    }

    return NextResponse.json({
      probabilities: Object.values(probabilitiesByRank),
      packCost: PACK_COST.toString(),
      poolInfo,
      individualCards: cards.map(card => ({
        id: card.id,
        rank: card.rank,
        name: card.name,
        winningProbability: winningProbabilities[card.rank as keyof typeof winningProbabilities] || 0,
        poolSharePercentage: Number(card.poolSharePercentage),
        rarityColor: card.rarityColor,
      })),
    });
  } catch (error) {
    console.error('Error getting pack info:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function getColorByRank(rank: string): string {
  switch (rank) {
    case CardRank.A:
      return 'bg-blue-500';
    case CardRank.AA:
      return 'bg-purple-500';
    case CardRank.S:
      return 'bg-yellow-500';
    case CardRank.SS:
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
}

function getGlowColorByRank(rank: string): string {
  switch (rank) {
    case CardRank.A:
      return 'shadow-blue-500/50';
    case CardRank.AA:
      return 'shadow-purple-500/50';
    case CardRank.S:
      return 'shadow-yellow-500/50';
    case CardRank.SS:
      return 'shadow-red-500/50';
    default:
      return 'shadow-gray-500/50';
  }
}
