import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { broadcastToAll } from "@/lib/sse-manager";
import { verifyJWT } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    // Authenticate the user
    const authHeader = req.headers.get('authorization');
    
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

    const authenticatedUserId = BigInt(decoded.sub);

    const { user_card_id, content, only_celebrate, tip_cati } = await req.json();

    // Validate required fields
    if (!user_card_id || !content) {
      return NextResponse.json(
        { error: "user_card_id and content are required" },
        { status: 400 }
      );
    }

    // Validate content length (max 255 characters as per schema)
    if (content.length > 255) {
      return NextResponse.json(
        { error: "Content must be 255 characters or less" },
        { status: 400 }
      );
    }

    // Verify that the user_card exists and belongs to the authenticated user
    const userCard = await prisma.userCard.findUnique({
      where: { id: BigInt(user_card_id) },
      include: {
        user: true,
        card: true,
        season: true
      }
    });

    if (!userCard) {
      return NextResponse.json(
        { error: "User card not found" },
        { status: 404 }
      );
    }

    // Verify the card belongs to the authenticated user
    if (userCard.userId !== authenticatedUserId) {
      return NextResponse.json(
        { error: "Unauthorized to broadcast this card" },
        { status: 403 }
      );
    }

    // Create the card broadcast
    const cardBroadcast = await prisma.cardBroadcast.create({
      data: {
        user_card_id: BigInt(user_card_id),
        content: content.trim(),
        tip_cati: tip_cati || 0,
        only_celebrate: only_celebrate || false
      },
      include: {
        userCard: {
          include: {
            user: true,
            card: true,
            season: true
          }
        }
      }
    });

    // Distribute tip_cati to eligible users if only_celebrate is false and tip_cati > 0
    if (!only_celebrate && tip_cati && tip_cati > 0) {
      // Find users who have opened cards at least twice (have 2 or more UserCard records)
      const eligibleUsers = await prisma.user.findMany({
        where: {
          id: {
            not: userCard.userId // Exclude the broadcaster themselves
          }
        }
      });

      // Filter users who have opened cards at least twice
      const usersWithCardOpening = eligibleUsers.filter(user => user.cardOpenCount >= 2);
      
      if (usersWithCardOpening.length > 0) {
      // eighth digit after decimal
      const distributionAmount = Math.floor((tip_cati / usersWithCardOpening.length) * 1e8) / 1e8;
        
        if (distributionAmount > 0) {
          // Create a transaction to update all eligible users' balances and record transactions
          await prisma.$transaction(async (tx) => {
            for (const user of usersWithCardOpening) {
              // Update user's CATI balance
              await tx.user.update({
                where: { id: user.id },
                data: {
                  catiBalance: {
                    increment: BigInt(distributionAmount)
                  }
                }
              });

              // Record the transaction
              await tx.catiTransaction.create({
                data: {
                  userId: user.id,
                  type: 'TIP_RECEIVED',
                  amount: BigInt(distributionAmount),
                  description: `Received ${distributionAmount} CATI from broadcast tip distribution`,
                  referenceId: cardBroadcast.id
                }
              });
            }
          });

          console.log(`Distributed ${distributionAmount} CATI to ${usersWithCardOpening.length} eligible users`);
        }
      }
    }

    // Convert BigInt to string for JSON serialization
    const response = {
      id: cardBroadcast.id.toString(),
      user_card_id: cardBroadcast.user_card_id.toString(),
      content: cardBroadcast.content,
      createdAt: cardBroadcast.createdAt.toISOString(),
      userCard: {
        id: cardBroadcast.userCard.id.toString(),
        userId: cardBroadcast.userCard.userId.toString(),
        cardId: cardBroadcast.userCard.cardId,
        seasonId: cardBroadcast.userCard.seasonId.toString(),
        catiSpent: cardBroadcast.userCard.catiSpent.toString(),
        catiReward: cardBroadcast.userCard.catiReward.toString(),
        acquiredAt: cardBroadcast.userCard.acquiredAt.toISOString(),
        user: {
          id: cardBroadcast.userCard.user.id.toString(),
          walletAddress: cardBroadcast.userCard.user.walletAddress,
          userNickname: cardBroadcast.userCard.user.userNickname,
          profilePictureUrl: cardBroadcast.userCard.user.profilePictureUrl,
          language: cardBroadcast.userCard.user.language,
          timezone: cardBroadcast.userCard.user.timezone,
          catiBalance: cardBroadcast.userCard.user.catiBalance.toString(),
          createdAt: cardBroadcast.userCard.user.createdAt.toISOString()
        },
        card: {
          id: cardBroadcast.userCard.card.id,
          rank: cardBroadcast.userCard.card.rank,
          name: cardBroadcast.userCard.card.name,
          imageUrl: cardBroadcast.userCard.card.imageUrl,
          rarityColor: cardBroadcast.userCard.card.rarityColor,
          designer: cardBroadcast.userCard.card.designer,
          createdAt: cardBroadcast.userCard.card.createdAt.toISOString()
        },
        season: {
          id: cardBroadcast.userCard.season.id.toString(),
          name: cardBroadcast.userCard.season.name,
          slogan: cardBroadcast.userCard.season.slogan,
          bidPoolAmount: cardBroadcast.userCard.season.bidPoolAmount.toString(),
          additionalTotalPool: cardBroadcast.userCard.season.additionalTotalPool.toString(),
          startDate: cardBroadcast.userCard.season.startDate.toISOString(),
          endDate: cardBroadcast.userCard.season.endDate.toISOString(),
          status: cardBroadcast.userCard.season.status,
          createdAt: cardBroadcast.userCard.season.createdAt.toISOString()
        }
      }
    };

    // Broadcast the new message to all connected clients via SSE
    const broadcastData = {
      type: 'new_broadcast',
      broadcast: {
        id: cardBroadcast.id.toString(),
        userCardId: cardBroadcast.user_card_id.toString(),
        content: cardBroadcast.content,
        tipCati: cardBroadcast.tip_cati,
        onlyCelebrate: cardBroadcast.only_celebrate,
        createdAt: cardBroadcast.createdAt.toISOString(),
        userCard: {
          user: {
            userNickname: cardBroadcast.userCard.user.userNickname,
            profilePictureUrl: cardBroadcast.userCard.user.profilePictureUrl,
            walletAddress: cardBroadcast.userCard.user.walletAddress
          },
          card: {
            name: cardBroadcast.userCard.card.name,
            rank: cardBroadcast.userCard.card.rank,
            rarityColor: cardBroadcast.userCard.card.rarityColor
          }
        }
      }
    };

    // Send to all connected SSE clients
    console.log('Broadcasting new message to SSE clients:', broadcastData);
    broadcastToAll('new_broadcast', broadcastData.broadcast);

    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    console.error("Error creating card broadcast:", error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: "Failed to create card broadcast", details: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
