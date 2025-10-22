import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { addComputedStatus } from '@/lib/season-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ seasonId: string }> }
) {
  try {
    const { seasonId: seasonIdParam } = await params;
    const seasonId = BigInt(seasonIdParam);

    const season = await prisma.season.findUnique({
      where: {
        id: seasonId,
      },
      include: {
        seasonCards: {
          include: {
            card: true,
          },
        },
      },
    });

    if (!season) {
      return NextResponse.json(
        { error: 'Season not found' },
        { status: 404 }
      );
    }

    // Add computed status
    const seasonWithComputedStatus = addComputedStatus({
      id: season.id.toString(),
      name: season.name,
      slogan: season.slogan,
      bidPoolAmount: season.bidPoolAmount.toString(),
      additionalTotalPool: season.additionalTotalPool.toString(),
      startDate: season.startDate.toISOString(),
      endDate: season.endDate.toISOString(),
      status: season.status,
      createdAt: season.createdAt.toISOString(),
    });

    const response = {
      ...seasonWithComputedStatus,
      cards: season.seasonCards.map(sc => ({
        id: sc.id.toString(),
        cardId: sc.cardId.toString(),
        userBidPoolPercentage: sc.userBidPoolPercentage.toString(),
        sponsorPoolPercentage: sc.sponsorPoolPercentage.toString(),
        dropProbability: sc.dropProbability.toString(),
        isActive: sc.isActive,
        card: {
          id: sc.card.id.toString(),
          rank: sc.card.rank,
          name: sc.card.name,
          imageUrl: sc.card.imageUrl,
          rarityColor: sc.card.rarityColor,
          designer: sc.card.designer,
        },
      })),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching season:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
