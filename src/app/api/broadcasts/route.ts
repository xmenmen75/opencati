import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');
    const offset = (page - 1) * limit;

    // Fetch broadcasts with user and card information
    const broadcasts = await prisma.cardBroadcast.findMany({
      include: {
        userCard: {
          include: {
            user: {
              select: {
                userNickname: true,
                profilePictureUrl: true,
                walletAddress: true,
              },
            },
            card: {
              select: {
                name: true,
                rank: true,
                rarityColor: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: offset,
      take: limit,
    });

    // Get total count for pagination
    const totalCount = await prisma.cardBroadcast.count();
    const hasNextPage = offset + limit < totalCount;
    const hasPreviousPage = page > 1;

    // Transform data to match frontend interface
    const transformedBroadcasts = broadcasts.map(broadcast => ({
      id: broadcast.id.toString(),
      userCardId: broadcast.user_card_id.toString(),
      content: broadcast.content,
      tipCati: broadcast.tip_cati,
      onlyCelebrate: broadcast.only_celebrate,
      createdAt: broadcast.createdAt.toISOString(),
      userCard: {
        user: {
          userNickname: broadcast.userCard.user.userNickname,
          profilePictureUrl: broadcast.userCard.user.profilePictureUrl,
          walletAddress: broadcast.userCard.user.walletAddress,
        },
        card: {
          name: broadcast.userCard.card.name,
          rank: broadcast.userCard.card.rank,
          rarityColor: broadcast.userCard.card.rarityColor,
        },
      },
    }));

    return NextResponse.json({
      broadcasts: transformedBroadcasts,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNextPage,
        hasPreviousPage,
        limit,
      },
    });
  } catch (error) {
    console.error('Error fetching broadcasts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch broadcasts' },
      { status: 500 }
    );
  }
}