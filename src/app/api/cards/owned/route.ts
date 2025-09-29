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

    // Get user to verify they exist
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get user's owned cards with card details and season card info
    const userCards = await prisma.userCard.findMany({
      where: {
        userId: userId,
      },
      include: {
        card: true,
        season: true,
      },
      orderBy: {
        acquiredAt: 'desc',
      },
    });

    // Get season card info for pool share percentages
    const seasonCardInfo = await prisma.seasonCard.findMany({
      where: {
        seasonId: {
          in: userCards.map(uc => uc.seasonId)
        },
        cardId: {
          in: userCards.map(uc => uc.cardId)
        }
      }
    });

    // Create a lookup map for season card info
    const seasonCardMap = new Map();
    seasonCardInfo.forEach(sc => {
      const key = `${sc.seasonId}-${sc.cardId}`;
      seasonCardMap.set(key, sc);
    });

    // Transform the data to match frontend expectations
    const ownedCards = userCards.map(userCard => {
      const seasonCardKey = `${userCard.seasonId}-${userCard.cardId}`;
      const seasonCard = seasonCardMap.get(seasonCardKey);
      
      return {
        id: userCard.id.toString(),
        cardId: userCard.card.id.toString(),
        rank: userCard.card.rank,
        name: userCard.card.name,
        image: userCard.card.imageUrl,
        poolSharePercentage: seasonCard?.userBidPoolPercentage?.toString() || '0', // Backward compatibility
        userBidPoolPercentage: seasonCard?.userBidPoolPercentage?.toString() || '0',
        sponsorPoolPercentage: seasonCard?.sponsorPoolPercentage?.toString() || '0',
        rarityColor: userCard.card.rarityColor,
        designer: userCard.card.designer,
        catiSpent: userCard.catiSpent.toString(),
        catiReward: userCard.catiReward.toString(),
        acquiredAt: userCard.acquiredAt.toISOString(),
        season: {
          id: userCard.season.id.toString(),
          name: userCard.season.name,
          slogan: userCard.season.slogan,
          status: userCard.season.status,
        },
      };
    });

    return NextResponse.json(ownedCards);
  } catch (error) {
    console.error('Error fetching owned cards:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
