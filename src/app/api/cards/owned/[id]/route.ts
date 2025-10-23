import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate the user
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

    // Get the user card ID from params
    const { id } = await params;
    const userCardId = BigInt(id);

    // Fetch the user card with related data
    const userCard = await prisma.userCard.findUnique({
      where: {
        id: userCardId,
      },
      include: {
        user: {
          select: {
            id: true,
            walletAddress: true,
            userNickname: true,
            profilePictureUrl: true,
          },
        },
        card: {
          select: {
            id: true,
            name: true,
            rank: true,
            imageUrl: true,
            rarityColor: true,
            designer: true,
          },
        },
        season: {
          select: {
            id: true,
            name: true,
            slogan: true,
            startDate: true,
            endDate: true,
            bidPoolAmount: true,
            additionalTotalPool: true,
            status: true,
          },
        },
      },
    });

    if (!userCard) {
      return NextResponse.json(
        { error: 'User card not found' },
        { status: 404 }
      );
    }

    // Verify that the user owns this card or is authorized to view it
    if (userCard.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized to view this card' },
        { status: 403 }
      );
    }

    // Transform BigInt values to strings for JSON serialization
    const responseData = {
      id: userCard.id.toString(),
      userId: userCard.userId.toString(),
      cardId: userCard.cardId,
      seasonId: userCard.seasonId.toString(),
      catiSpent: userCard.catiSpent.toString(),
      catiReward: userCard.catiReward?.toString() || null,
      acquiredAt: userCard.acquiredAt.toISOString(),
      user: {
        id: userCard.user.id.toString(),
        walletAddress: userCard.user.walletAddress,
        userNickname: userCard.user.userNickname,
        profilePictureUrl: userCard.user.profilePictureUrl,
      },
      card: {
        id: userCard.card.id,
        name: userCard.card.name,
        rank: userCard.card.rank,
        imageUrl: userCard.card.imageUrl,
        rarityColor: userCard.card.rarityColor,
        designer: userCard.card.designer,
      },
      season: {
        id: userCard.season.id.toString(),
        name: userCard.season.name,
        slogan: userCard.season.slogan,
        startDate: userCard.season.startDate.toISOString(),
        endDate: userCard.season.endDate.toISOString(),
        bidPoolAmount: userCard.season.bidPoolAmount.toString(),
        additionalTotalPool: userCard.season.additionalTotalPool.toString(),
        status: userCard.season.status,
      },
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error fetching user card details:', error);
    
    // Handle BigInt conversion errors specifically
    if (error instanceof TypeError && error.message.includes('BigInt')) {
      return NextResponse.json(
        { error: 'Invalid user card ID format' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}