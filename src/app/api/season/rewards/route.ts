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

    // Calculate pool information using new dual-percentage system
    const totalSpent = userCards.reduce((sum, userCard) => sum + userCard.catiSpent, BigInt(0));
    const totalSponsorPool = activeSeason.additionalTotalPool;
    const totalPool = totalSpent + totalSponsorPool;

    // Get season card data to understand reward distribution
    const seasonCards = await prisma.seasonCard.findMany({
      where: {
        seasonId: activeSeason.id,
        isActive: true,
      },
      include: {
        card: true,
      },
    });

    // Create a map for quick lookups
    const seasonCardMap = new Map();
    seasonCards.forEach(sc => {
      seasonCardMap.set(sc.cardId, sc);
    });

    // Calculate card rewards based on new system
    const cardRewardInfo: Array<{
      cardId: number;
      rank: string;
      userBidReward: bigint;
      sponsorReward: bigint;
      totalReward: bigint;
      count: number;
    }> = [];

    // Group cards by type and calculate their rewards
    const cardGroups = userCards.reduce((groups, userCard) => {
      const cardId = userCard.cardId;
      if (!groups[cardId]) {
        const seasonCard = seasonCardMap.get(cardId);
        if (seasonCard) {
          const userBidPercentage = Number(seasonCard.userBidPoolPercentage) / 100;
          const sponsorPercentage = Number(seasonCard.sponsorPoolPercentage) / 100;
          const userBidReward = BigInt(Math.floor(Number(totalSpent) * userBidPercentage));
          const sponsorReward = BigInt(Math.floor(Number(totalSponsorPool) * sponsorPercentage));
          
          groups[cardId] = {
            cardId,
            rank: userCard.card.rank,
            userBidReward,
            sponsorReward,
            totalReward: userBidReward + sponsorReward,
            count: 0,
          };
        }
      }
      if (groups[cardId]) {
        groups[cardId].count++;
      }
      return groups;
    }, {} as Record<number, any>);

    Object.values(cardGroups).forEach((group: any) => {
      cardRewardInfo.push(group);
    });

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
        sponsorAmount: totalSponsorPool.toString(),
      },
      poolInfo: {
        totalPool: totalPool.toString(),
        totalSpent: totalSpent.toString(),
        totalSponsorPool: totalSponsorPool.toString(),
        userBidRewards: cardRewardInfo.reduce((sum, card) => sum + card.userBidReward, BigInt(0)).toString(),
        sponsorRewards: cardRewardInfo.reduce((sum, card) => sum + card.sponsorReward, BigInt(0)).toString(),
        cardRewards: cardRewardInfo.map(card => ({
          cardId: card.cardId.toString(),
          rank: card.rank,
          userBidReward: card.userBidReward.toString(),
          sponsorReward: card.sponsorReward.toString(),
          totalReward: card.totalReward.toString(),
          count: card.count,
        })),
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
