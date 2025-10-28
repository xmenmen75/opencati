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

    const senderId = BigInt(decoded.sub);
    const body = await request.json();
    
    const { broadcastId, content, catiAmount = 0, reaction } = body;

    // Validate required fields
    if (!broadcastId) {
      return NextResponse.json({ error: 'Broadcast ID is required' }, { status: 400 });
    }

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    // Validate reaction if provided
    if (reaction && !['HEART', 'CONFETTI', 'THUMBSUP'].includes(reaction)) {
      return NextResponse.json({ error: 'Invalid reaction type' }, { status: 400 });
    }

    if (content.length > 1000) {
      return NextResponse.json({ error: 'Message content too long (max 1000 characters)' }, { status: 400 });
    }

    if (catiAmount < 0) {
      return NextResponse.json({ error: 'CATI amount cannot be negative' }, { status: 400 });
    }

    // Get the broadcast and its owner
    const broadcast = await prisma.cardBroadcast.findUnique({
      where: { id: BigInt(broadcastId) },
      include: {
        userCard: {
          include: {
            user: true
          }
        }
      }
    });

    if (!broadcast) {
      return NextResponse.json({ error: 'Broadcast not found' }, { status: 404 });
    }

    const receiverId = broadcast.userCard.user.id;

    // Check if sender is trying to send message to themselves
    if (senderId === receiverId) {
      return NextResponse.json({ error: 'Cannot send message to yourself' }, { status: 400 });
    }

    // If CATI amount is specified, check sender's balance
    if (catiAmount > 0) {
      const sender = await prisma.user.findUnique({
        where: { id: senderId },
        select: { catiBalance: true }
      });

      if (!sender) {
        return NextResponse.json({ error: 'Sender not found' }, { status: 404 });
      }

      if (sender.catiBalance < BigInt(catiAmount)) {
        return NextResponse.json({ error: 'Insufficient CATI balance' }, { status: 400 });
      }
    }

    // Always create a new thread and message
    const result = await prisma.$transaction(async (tx) => {
      // Create the thread
      const thread = await tx.thread.create({
        data: {
          senderId,
          receiverId,
          broadcastId: BigInt(broadcastId),
          reaction: reaction,
          senderSeenAt: null,
          receiverSeenAt: null
        }
      });

      // Create the message in the new thread
      const message = await tx.message.create({
        data: {
          threadId: thread.id,
          senderId,
          content: content.trim()
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

      // Handle CATI transfer if amount > 0
      if (catiAmount > 0) {
        await tx.user.update({
          where: { id: senderId },
          data: {
            catiBalance: {
              decrement: BigInt(catiAmount)
            }
          }
        });

        await tx.user.update({
          where: { id: receiverId },
          data: {
            catiBalance: {
              increment: BigInt(catiAmount)
            }
          }
        });

        await tx.catiTransaction.create({
          data: {
            userId: senderId,
            type: 'MESSAGE_TIP',
            amount: -BigInt(catiAmount),
            description: `Sent ${catiAmount} CATI as message tip to ${broadcast.userCard.user.userNickname}`,
            referenceId: message.id
          }
        });

        await tx.catiTransaction.create({
          data: {
            userId: receiverId,
            type: 'MESSAGE_TIP_RECEIVED',
            amount: BigInt(catiAmount),
            description: `Received ${catiAmount} CATI as message tip from ${message.sender.userNickname}`,
            referenceId: message.id
          }
        });
      }

      return { thread, message };
    });

    // Convert BigInt to string for JSON serialization
    const response = {
      threadId: result.thread.id.toString(),
      messageId: result.message.id.toString(),
      content: result.message.content,
      catiAmount,
      createdAt: result.message.createdAt,
      sender: {
        nickname: result.message.sender.userNickname,
        walletAddress: result.message.sender.walletAddress,
        profilePictureUrl: result.message.sender.profilePictureUrl
      }
    };

    return NextResponse.json({
      message: 'Message sent successfully',
      data: response
    }, { status: 201 });

  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' }, 
      { status: 500 }
    );
  }
}
