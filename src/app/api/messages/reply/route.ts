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
    
    const { messageId, content, catiAmount = 0 } = body;

    // Validate required fields
    if (!messageId) {
      return NextResponse.json({ error: 'Message ID is required' }, { status: 400 });
    }

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Reply content is required' }, { status: 400 });
    }

    if (content.length > 255) {
      return NextResponse.json({ error: 'Reply content too long (max 255 characters)' }, { status: 400 });
    }

    if (catiAmount < 0) {
      return NextResponse.json({ error: 'CATI amount cannot be negative' }, { status: 400 });
    }

    // Get the original message and verify permissions
    const originalMessage = await prisma.message.findUnique({
      where: { id: BigInt(messageId) },
      include: {
        sender: {
          select: {
            id: true,
            userNickname: true,
            walletAddress: true,
            catiBalance: true
          }
        },
        receiver: {
          select: {
            id: true,
            userNickname: true,
            walletAddress: true
          }
        }
      }
    });

    if (!originalMessage) {
      return NextResponse.json({ error: 'Original message not found' }, { status: 404 });
    }

    // Check if current user is the receiver of the original message
    if (originalMessage.receiverId !== currentUserId) {
      return NextResponse.json({ 
        error: 'You can only reply to messages sent to you' 
      }, { status: 403 });
    }

    // Check if reply already exists
    const existingReply = await prisma.messageReply.findUnique({
      where: { messageId: BigInt(messageId) }
    });

    if (existingReply) {
      return NextResponse.json({ 
        error: 'Reply already exists for this message' 
      }, { status: 400 });
    }

    // If CATI amount is specified, check current user's balance
    if (catiAmount > 0) {
      const currentUser = await prisma.user.findUnique({
        where: { id: currentUserId },
        select: { catiBalance: true }
      });

      if (!currentUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      if (currentUser.catiBalance < BigInt(catiAmount)) {
        return NextResponse.json({ error: 'Insufficient CATI balance' }, { status: 400 });
      }
    }

    // Start a transaction to handle reply creation and CATI transfer
    const result = await prisma.$transaction(async (tx) => {
      // Create the reply
      const reply = await tx.messageReply.create({
        data: {
          messageId: BigInt(messageId),
          senderId: currentUserId,
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

      // Update original message to mark it has a reply
      await tx.message.update({
        where: { id: BigInt(messageId) },
        data: { hasReply: true }
      });

      // Handle CATI transfer if amount > 0
      if (catiAmount > 0) {
        const originalSenderId = originalMessage.sender.id;

        // Deduct from current user (reply sender)
        await tx.user.update({
          where: { id: currentUserId },
          data: {
            catiBalance: {
              decrement: BigInt(catiAmount)
            }
          }
        });

        // Add to original message sender
        await tx.user.update({
          where: { id: originalSenderId },
          data: {
            catiBalance: {
              increment: BigInt(catiAmount)
            }
          }
        });

        // Record transaction for reply sender (debit)
        await tx.catiTransaction.create({
          data: {
            userId: currentUserId,
            type: 'MESSAGE_REPLY_TIP',
            amount: -BigInt(catiAmount),
            description: `Sent ${catiAmount} CATI as reply tip to ${originalMessage.sender.userNickname}`,
            referenceId: reply.id
          }
        });

        // Record transaction for original sender (credit)
        await tx.catiTransaction.create({
          data: {
            userId: originalSenderId,
            type: 'MESSAGE_REPLY_TIP_RECEIVED',
            amount: BigInt(catiAmount),
            description: `Received ${catiAmount} CATI as reply tip from ${reply.sender.userNickname}`,
            referenceId: reply.id
          }
        });
      }

      return reply;
    });

    // Convert BigInt to string for JSON serialization
    const response = {
      id: result.id.toString(),
      messageId: messageId,
      content: result.content,
      catiAmount,
      createdAt: result.createdAt,
      sender: {
        nickname: result.sender.userNickname,
        walletAddress: result.sender.walletAddress,
        profilePictureUrl: result.sender.profilePictureUrl
      },
      originalMessage: {
        sender: {
          nickname: originalMessage.sender.userNickname,
          walletAddress: originalMessage.sender.walletAddress
        },
        receiver: {
          nickname: originalMessage.receiver.userNickname,
          walletAddress: originalMessage.receiver.walletAddress
        }
      }
    };

    return NextResponse.json({
      message: 'Reply sent successfully',
      data: response
    }, { status: 201 });

  } catch (error) {
    console.error('Error sending reply:', error);
    return NextResponse.json(
      { error: 'Failed to send reply' }, 
      { status: 500 }
    );
  }
}
