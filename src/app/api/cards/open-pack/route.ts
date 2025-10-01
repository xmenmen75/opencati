import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/auth';
import { selectRandomCard, type SeasonCardWithProbability } from '@/lib/card-selector';

// CATI cost per pack opening (reasonable amount)
const PACK_COST = BigInt('500'); // 500 CATI

function calculateCatiSpent(): bigint {
  // All cards cost the same 500 CATI when opening packs
  return PACK_COST; // 500 CATI for all ranks
}

// Note: CATI reward calculation is now handled by cron jobs every 5 minutes
// This function is no longer needed here

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

    // Get all available cards for the active season
    const seasonCards = await prisma.seasonCard.findMany({
      where: { 
        seasonId: activeSeason.id,
        isActive: true 
      },
      include: {
        card: {
          select: {
            id: true,
            rank: true,
            name: true,
            imageUrl: true,
            rarityColor: true,
            designer: true,
          }
        }
      },
    });

    if (seasonCards.length === 0) {
      return NextResponse.json(
        { error: 'No cards available for current season' },
        { status: 500 }
      );
    }

    // Transform to the format expected by selectRandomCard
    const cardsWithProbability: SeasonCardWithProbability[] = seasonCards.map(sc => ({
      id: sc.card.id,
      rank: sc.card.rank,
      name: sc.card.name,
      imageUrl: sc.card.imageUrl,
      rarityColor: sc.card.rarityColor,
      designer: sc.card.designer,
      poolSharePercentage: sc.userBidPoolPercentage, // Use userBidPoolPercentage for backward compatibility with card selector
      dropProbability: sc.dropProbability,
      seasonCardId: sc.id,
    }));

    // Select a random card based on probabilities (with possible failure)
    const cardResult = selectRandomCard(cardsWithProbability);

    // Start transaction - we always deduct CATI even on pack failure
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

      // Update season bid pool amount (always, regardless of card win/loss)
      await tx.season.update({
        where: { id: activeSeason.id },
        data: {
          bidPoolAmount: {
            increment: PACK_COST,
          },
        },
      });

      // Create transaction record for the pack opening attempt
      const transactionDescription = cardResult.success 
        ? `Opened pack and received ${cardResult.card!.name}`
        : `Opened pack but no card was won - ${cardResult.failureReason}`;

      await tx.catiTransaction.create({
        data: {
          userId: userId,
          type: 'SPEND_DRAW',
          amount: -PACK_COST, // Negative for spending
          description: transactionDescription,
          referenceId: null, // No card reference for failed packs
        },
      });

      if (cardResult.success && cardResult.card) {
        // Pack was successful - create user card entry
        const selectedCard = cardResult.card;
        const catiSpent = calculateCatiSpent();

        const userCard = await tx.userCard.create({
          data: {
            userId: userId,
            cardId: selectedCard.id,
            seasonId: activeSeason.id,
            catiSpent: catiSpent,
            catiReward: BigInt('0'), // Will be calculated in recalculateSeasonRewards
          },
        });

        // Update the transaction with the card reference
        const transactionRecord = await tx.catiTransaction.findFirst({
          where: {
            userId: userId,
            type: 'SPEND_DRAW',
            amount: -PACK_COST,
          },
          orderBy: { createdAt: 'desc' }
        });

        if (transactionRecord) {
          await tx.catiTransaction.update({
            where: { id: transactionRecord.id },
            data: { referenceId: userCard.id },
          });
        }

        // Note: CATI rewards will be calculated by cron jobs every 5 minutes
        // Return the user card with initial 0 reward
        return { success: true, userCard, selectedCard, activeSeason };
      } else {
        // Pack failed - no card won
        return { success: false, failureReason: cardResult.failureReason, activeSeason };
      }
    });

    if (result.success) {
      // Return successful card opening
      return NextResponse.json({
        success: true,
        card: {
          id: result.selectedCard!.id.toString(),
          rank: result.selectedCard!.rank,
          name: result.selectedCard!.name,
          imageUrl: result.selectedCard!.imageUrl,
          rarityColor: result.selectedCard!.rarityColor,
          designer: result.selectedCard!.designer,
          poolSharePercentage: result.selectedCard!.poolSharePercentage.toString(),
          catiSpent: result.userCard!.catiSpent.toString(),
          catiReward: result.userCard!.catiReward.toString(),
          acquiredAt: result.userCard!.acquiredAt.toISOString(),
          season: {
            id: activeSeason.id.toString(),
            name: activeSeason.name,
            slogan: activeSeason.slogan,
          },
        },
        newBalance: (user.catiBalance - PACK_COST).toString(),
      });
    } else {
      // Return pack failure
      return NextResponse.json({
        success: false,
        failureReason: result.failureReason,
        message: "Pack opened but no card was won. Your CATI has been spent but better luck next time!",
        newBalance: (user.catiBalance - PACK_COST).toString(),
        season: {
          id: activeSeason.id.toString(),
          name: activeSeason.name,
          slogan: activeSeason.slogan,
        },
      });
    }

  } catch (error) {
    console.error('Error opening pack:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to get pack opening probabilities
