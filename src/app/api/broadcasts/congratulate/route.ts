import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
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

    const currentUserId = BigInt(decoded.sub);
    const body = await request.json();
    const { broadcastId, content, catiAmount, reaction } = body;

    // Validate required fields
    if (!broadcastId) {
      return NextResponse.json({ error: 'Broadcast ID is required' }, { status: 400 });
    }
    if ((!content || content.trim().length === 0) && !catiAmount && !reaction) {
      return NextResponse.json({ error: 'Message must have content, CATI tip, or reaction' }, { status: 400 });
    }
    if (content && content.length > 255) {
      return NextResponse.json({ error: 'Message content too long (max 255 characters)' }, { status: 400 });
    }
    if (catiAmount && (isNaN(Number(catiAmount)) || Number(catiAmount) < 0)) {
      return NextResponse.json({ error: 'Invalid CATI amount' }, { status: 400 });
    }

    // Get the broadcast to find the recipient
    const broadcast = await prisma.cardBroadcast.findUnique({
      where: { id: BigInt(broadcastId) },
      include: {
        userCard: {
          include: {
            user: {
              select: {
                id: true,
                userNickname: true,
                walletAddress: true,
                profilePictureUrl: true,
                userTeam: true
              }
            }
          }
        }
      }
    });

    if (!broadcast) {
      return NextResponse.json({ error: 'Broadcast not found' }, { status: 404 });
    }

    const recipientId = broadcast.userCard.user.id;

    // Don't allow users to send messages to themselves
    if (currentUserId === recipientId) {
      return NextResponse.json({ error: 'Cannot send message to yourself' }, { status: 400 });
    }

    // Get current user info
    const currentUser = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: {
        userNickname: true,
        walletAddress: true,
        profilePictureUrl: true,
        catiBalance: true
      }
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has enough CATI balance for tip
    const tipAmount = catiAmount ? Number(catiAmount) : 0;
    if (tipAmount > 0 && currentUser.catiBalance < BigInt(tipAmount)) {
      return NextResponse.json({ error: 'Insufficient CATI balance' }, { status: 400 });
    }

    // Always create a new thread for each celebration
    // This allows multiple celebrations per user per broadcast
    const thread = await prisma.thread.create({
      data: {
        senderId: currentUserId,
        receiverId: recipientId,
        broadcastId: BigInt(broadcastId),
        reaction: reaction ? reaction.toUpperCase() as any : null
      }
    });

    // Create the message as the first message in the thread
    const message = await prisma.message.create({
      data: {
        threadId: thread.id,
        senderId: currentUserId,
        content: content ? content.trim() : ''
      },
      include: {
        sender: {
          select: {
            userNickname: true,
            walletAddress: true,
            profilePictureUrl: true
          }
        }
      }
    });

    // Handle CATI tip transfer if amount > 0
    if (tipAmount > 0) {
      await prisma.$transaction(async (tx) => {
        // Deduct from sender
        await tx.user.update({
          where: { id: currentUserId },
          data: {
            catiBalance: {
              decrement: BigInt(tipAmount)
            }
          }
        });

        // Add to recipient
        await tx.user.update({
          where: { id: recipientId },
          data: {
            catiBalance: {
              increment: BigInt(tipAmount)
            }
          }
        });

        // Create transaction records
        await tx.catiTransaction.createMany({
          data: [
            {
              userId: currentUserId,
              amount: BigInt(-tipAmount),
              type: 'CELEBRATION_TIP',
              description: `Tip sent to ${broadcast.userCard.user.userNickname}`,
              referenceId: message.id
            },
            {
              userId: recipientId,
              amount: BigInt(tipAmount),
              type: 'CELEBRATION_TIP',
              description: `Tip received from ${currentUser.userNickname}`,
              referenceId: message.id
            }
          ]
        });
      });
    }

    // Update thread seen status - receiver hasn't seen the new message
    await prisma.thread.update({
      where: { id: thread.id },
      data: {
        receiverSeenAt: null,
        updatedAt: new Date()
      }
    });

    // Convert BigInt to string for JSON serialization
    const response = {
      id: message.id.toString(),
      threadId: thread.id.toString(),
      content: message.content,
      reaction: thread.reaction,
      catiTip: tipAmount > 0 ? tipAmount.toString() : null,
      createdAt: message.createdAt,
      sender: {
        nickname: message.sender.userNickname,
        walletAddress: message.sender.walletAddress,
        profilePictureUrl: message.sender.profilePictureUrl
      },
      recipient: {
        nickname: broadcast.userCard.user.userNickname,
        walletAddress: broadcast.userCard.user.walletAddress,
        profilePictureUrl: broadcast.userCard.user.profilePictureUrl,
        userTeam: broadcast.userCard.user.userTeam
      }
    };

    return NextResponse.json({
      message: 'Congratulatory message sent successfully',
      data: response
    }, { status: 201 });

  } catch (error) {
    console.error('Error sending congratulatory message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' }, 
      { status: 500 }
    );
  }
}