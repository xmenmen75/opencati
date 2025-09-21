import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Get active season
    const activeSeason = await prisma.season.findFirst({
      where: { status: 'ACTIVE' },
    });

    if (!activeSeason) {
      return NextResponse.json(
        { error: 'No active season found' },
        { status: 404 }
      );
    }

    // Get all user cards for this season with card and user details
    const userCards = await prisma.userCard.findMany({
      where: { seasonId: activeSeason.id },
      include: {
        card: true,
        user: {
          select: {
            id: true,
            userNickname: true,
          },
        },
      },
      orderBy: {
        acquiredAt: 'asc',
      },
    });

    // Get season rewards
    const seasonRewards = await prisma.seasonReward.findMany({
      where: { seasonId: activeSeason.id },
      include: {
        user: {
          select: {
            id: true,
            userNickname: true,
          },
        },
      },
      orderBy: {
        rewardAmount: 'desc',
      },
    });

    // Calculate pool information
    const totalSpent = userCards.reduce((sum, userCard) => sum + userCard.catiSpent, BigInt(0));
    const totalPool = totalSpent + activeSeason.additionalTotalPool;

    const rankPools = {
      'A': (totalPool * BigInt(4)) / BigInt(100),   // 4%
      'AA': (totalPool * BigInt(10)) / BigInt(100), // 10%
      'S': (totalPool * BigInt(12)) / BigInt(100),  // 12%
      'SS': (totalPool * BigInt(70)) / BigInt(100), // 70%
    };

    // Count cards by rank
    const rankCounts = userCards.reduce((counts, userCard) => {
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

    // Group user cards by user
    const userCardsByUser = userCards.reduce((groups, userCard) => {
      const userId = userCard.userId.toString();
      if (!groups[userId]) {
        groups[userId] = {
          user: userCard.user,
          cards: [],
          totalSpent: BigInt(0),
          totalReward: BigInt(0),
          cardCounts: { A: 0, AA: 0, S: 0, SS: 0 },
        };
      }
      groups[userId].cards.push(userCard);
      groups[userId].totalSpent += userCard.catiSpent;
      groups[userId].totalReward += userCard.catiReward;
      const rank = userCard.card.rank as 'A' | 'AA' | 'S' | 'SS';
      groups[userId].cardCounts[rank]++;
      return groups;
    }, {} as Record<string, any>);

    const response = {
      season: {
        id: activeSeason.id.toString(),
        name: activeSeason.name,
        slogan: activeSeason.slogan,
        sponsorAmount: activeSeason.additionalTotalPool.toString(),
      },
      poolInfo: {
        totalPool: totalPool.toString(),
        totalSpent: totalSpent.toString(),
        sponsorAmount: activeSeason.additionalTotalPool.toString(),
        rankPools: Object.entries(rankPools).reduce((acc, [rank, amount]) => {
          acc[rank] = amount.toString();
          return acc;
        }, {} as Record<string, string>),
        rankCounts,
        rewardPerCard: Object.entries(rewardPerCard).reduce((acc, [rank, amount]) => {
          acc[rank] = amount.toString();
          return acc;
        }, {} as Record<string, string>),
      },
      userSummary: Object.values(userCardsByUser).map((userData: any) => ({
        user: {
          id: userData.user.id.toString(),
          userNickname: userData.user.userNickname,
        },
        totalSpent: userData.totalSpent.toString(),
        totalReward: userData.totalReward.toString(),
        cardCounts: userData.cardCounts,
        cardDetails: userData.cards.map((card: any) => ({
          id: card.id.toString(),
          cardName: card.card.name,
          rank: card.card.rank,
          catiSpent: card.catiSpent.toString(),
          catiReward: card.catiReward.toString(),
          acquiredAt: card.acquiredAt.toISOString(),
        })),
        roi: userData.totalSpent > 0 ? 
          Number((userData.totalReward * BigInt(10000)) / userData.totalSpent) / 100 : 0,
      })),
      seasonRewards: seasonRewards.map(reward => ({
        user: {
          id: reward.user.id.toString(),
          userNickname: reward.user.userNickname,
        },
        totalPoolShare: Number(reward.totalPoolShare),
        rewardAmount: reward.rewardAmount.toString(),
        status: reward.status,
      })),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error getting season rewards:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
