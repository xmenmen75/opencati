import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Fetch broadcasts with pagination, ordered by most recent first
    const broadcasts = await prisma.cardBroadcast.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      skip: offset,
      take: limit,
      include: {
        userCard: {
          include: {
            user: {
              select: {
                id: true,
                userNickname: true,
                profilePictureUrl: true,
                walletAddress: true
              }
            },
            card: {
              select: {
                id: true,
                name: true,
                rank: true,
                rarityColor: true
              }
            }
          }
        }
      }
    });

    // Transform BigInt values to strings for JSON serialization
    const serializedBroadcasts = broadcasts.map(broadcast => ({
      id: broadcast.id.toString(),
      userCardId: broadcast.user_card_id.toString(),
      content: broadcast.content,
      tipCati: broadcast.tip_cati, // tip_cati is Int, not BigInt
      onlyCelebrate: broadcast.only_celebrate,
      createdAt: broadcast.createdAt.toISOString(),
      userCard: {
        id: broadcast.userCard.id.toString(),
        userId: broadcast.userCard.userId.toString(),
        cardId: broadcast.userCard.cardId.toString(),
        user: {
          id: broadcast.userCard.user.id.toString(),
          userNickname: broadcast.userCard.user.userNickname,
          profilePictureUrl: broadcast.userCard.user.profilePictureUrl,
          walletAddress: broadcast.userCard.user.walletAddress
        },
        card: {
          id: broadcast.userCard.card.id.toString(),
          name: broadcast.userCard.card.name,
          rank: broadcast.userCard.card.rank,
          rarityColor: broadcast.userCard.card.rarityColor
        }
      }
    }));

    // Get total count for pagination metadata
    const totalCount = await prisma.cardBroadcast.count();
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return NextResponse.json({
      broadcasts: serializedBroadcasts,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage,
        hasPreviousPage,
        limit
      }
    });

  } catch (error) {
    console.error('Error fetching broadcasts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch broadcasts' },
      { status: 500 }
    );
  }
}
