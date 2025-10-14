import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/auth';

export async function GET(request: NextRequest) {
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

    // Get messageId from URL parameters
    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get('messageId');

    if (!messageId) {
      return NextResponse.json({ error: 'Message ID is required' }, { status: 400 });
    }

    // Get the message with all related data
    const message = await prisma.message.findUnique({
      where: { id: BigInt(messageId) },
      include: {
        sender: {
          select: {
            id: true,
            userNickname: true,
            walletAddress: true,
            profilePictureUrl: true
          }
        },
        receiver: {
          select: {
            id: true,
            userNickname: true,
            walletAddress: true,
            profilePictureUrl: true
          }
        },
        broadcast: {
          include: {
            userCard: {
              include: {
                card: true,
                user: true
              }
            }
          }
        },
        messageReply: {
          include: {
            sender: {
              select: {
                id: true,
                userNickname: true,
                walletAddress: true,
                profilePictureUrl: true
              }
            }
          }
        }
      }
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Check if current user has permission to view this message
    // User can view if they are either sender or receiver
    if (message.senderId !== currentUserId && message.receiverId !== currentUserId) {
      return NextResponse.json({ 
        error: 'You do not have permission to view this message' 
      }, { status: 403 });
    }

    // Check if message is deleted by the current user
    const isReceiver = message.receiverId === currentUserId;
    const isSender = message.senderId === currentUserId;

    if (isReceiver && message.receiverDeletedAt) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    if (isSender && message.senderDeletedAt) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Transform message for frontend consumption
    const transformedMessage = {
      id: message.id.toString(),
      content: message.content,
      hasReply: message.hasReply,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
      seenAt: message.seenAt,
      reaction: message.reaction,
      sender: {
        id: message.sender.id.toString(),
        nickname: message.sender.userNickname,
        walletAddress: message.sender.walletAddress,
        profilePictureUrl: message.sender.profilePictureUrl,
      },
      receiver: {
        id: message.receiver.id.toString(),
        nickname: message.receiver.userNickname,
        walletAddress: message.receiver.walletAddress,
        profilePictureUrl: message.receiver.profilePictureUrl,
      },
      broadcast: {
        id: message.broadcast.id.toString(),
        content: message.broadcast.content,
        tipCati: message.broadcast.tip_cati,
        onlyCelebrate: message.broadcast.only_celebrate,
        createdAt: message.broadcast.createdAt,
        userCard: {
          card: {
            name: message.broadcast.userCard.card.name,
            rank: message.broadcast.userCard.card.rank,
            rarityColor: message.broadcast.userCard.card.rarityColor,
          },
          user: {
            nickname: message.broadcast.userCard.user.userNickname,
            walletAddress: message.broadcast.userCard.user.walletAddress,
          },
        },
      },
      reply: message.messageReply ? {
        id: message.messageReply.id.toString(),
        content: message.messageReply.content,
        createdAt: message.messageReply.createdAt,
        updatedAt: message.messageReply.updatedAt,
        sender: {
          id: message.messageReply.sender.id.toString(),
          nickname: message.messageReply.sender.userNickname,
          walletAddress: message.messageReply.sender.walletAddress,
          profilePictureUrl: message.messageReply.sender.profilePictureUrl,
        }
      } : null,
      // Helper flags for the frontend
      isCurrentUserSender: isSender,
      isCurrentUserReceiver: isReceiver,
      canReply: isReceiver && !message.messageReply, // Only receiver can reply and only if no reply exists
    };

    return NextResponse.json({
      message: transformedMessage
    });

  } catch (error) {
    console.error('Error fetching message:', error);
    return NextResponse.json(
      { error: 'Failed to fetch message' },
      { status: 500 }
    );
  }
}
