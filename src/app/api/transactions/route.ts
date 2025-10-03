import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/auth';

export async function GET(request: NextRequest) {
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

    // Get query parameters
    const url = new URL(request.url);
    const limitParam = url.searchParams.get('limit');
    const offsetParam = url.searchParams.get('offset');
    
    const limit = limitParam ? parseInt(limitParam) : 50;
    const offset = offsetParam ? parseInt(offsetParam) : 0;

    // Get transactions with related data
    const transactions = await prisma.catiTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
      include: {
        user: {
          select: {
            userNickname: true,
          },
        },
      },
    });

    // Get total count for pagination
    const totalCount = await prisma.catiTransaction.count({
      where: { userId }
    });

    // Calculate summary statistics
    const summaryStats = await prisma.catiTransaction.aggregate({
      where: { userId },
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    });

    // Get pack opening specific stats
    const packStats = await prisma.catiTransaction.aggregate({
      where: { 
        userId,
        type: 'SPEND_DRAW'
      },
      _sum: {
        amount: true, // This will be negative for spending
      },
      _count: {
        id: true,
      },
    });

    // Get reward stats
    const rewardStats = await prisma.catiTransaction.aggregate({
      where: { 
        userId,
        type: 'SEASON_REWARD'
      },
      _sum: {
        amount: true, // This will be positive for rewards
      },
    });

    // Count successful pack openings (those with referenceId pointing to userCards)
    const successfulPacks = await prisma.catiTransaction.count({
      where: { 
        userId,
        type: 'SPEND_DRAW',
        referenceId: { not: null } // referenceId exists means a card was won
      },
    });

    const totalPackOpenings = packStats._count?.id || 0;
    const winRate = totalPackOpenings > 0 ? (successfulPacks / totalPackOpenings) * 100 : 0;

    // Get additional details for transactions with referenceIds (successful pack openings)
    const transactionsWithCards = await Promise.all(
      transactions.map(async (tx) => {
        let cardDetails = null;
        
        // If this is a successful pack opening (has referenceId), get card details
        if (tx.type === 'SPEND_DRAW' && tx.referenceId) {
          try {
            const userCard = await prisma.userCard.findUnique({
              where: { id: tx.referenceId },
              include: {
                card: {
                  select: {
                    name: true,
                    rank: true,
                    rarityColor: true,
                  },
                },
              },
            });
            
            if (userCard) {
              cardDetails = {
                cardName: userCard.card.name,
                cardRank: userCard.card.rank,
                rarityColor: userCard.card.rarityColor,
                catiReward: userCard.catiReward.toString(),
              };
            }
          } catch (error) {
            console.error('Error fetching card details for transaction:', tx.id, error);
          }
        }

        return {
          id: tx.id.toString(),
          type: tx.type,
          amount: tx.amount.toString(),
          description: tx.description,
          referenceId: tx.referenceId?.toString() || null,
          createdAt: tx.createdAt.toISOString(),
          source: tx.source,
          cardDetails,
        };
      })
    );

    // Calculate total earnings from card rewards for successful pack openings
    const cardRewardsSum = await prisma.userCard.aggregate({
      where: { userId },
      _sum: {
        catiReward: true,
      },
    });

    const totalCardRewards = Number(cardRewardsSum._sum?.catiReward || 0);
    const totalDirectRewards = Number(rewardStats._sum?.amount || 0);
    const totalEarned = totalCardRewards + totalDirectRewards;

    // Calculate summary
    const summary = {
      totalTransactions: summaryStats._count?.id || 0,
      totalPackOpenings,
      amountSpent: Math.abs(Number(packStats._sum?.amount || 0)), // Convert to positive number
      amountEarned: totalEarned,
      winRate: parseFloat(winRate.toFixed(1)),
    };

    return NextResponse.json({
      transactions: transactionsWithCards,
      summary,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
    });

  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
