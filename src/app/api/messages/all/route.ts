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

    const userId = BigInt(decoded.sub);

    // Get URL parameters for pagination
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50); // Max 50 per page
    const skip = (page - 1) * limit;

    // Get messages where user is involved (either sender or receiver) and not deleted by them
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          {
            // Messages received by user and not deleted by receiver
            receiverId: userId,
            receiverDeletedAt: null,
          },
          {
            // Messages sent by user and not deleted by sender
            senderId: userId,
            senderDeletedAt: null,
          }
        ]
      },
      include: {
        sender: {
          select: {
            userNickname: true,
            walletAddress: true,
            profilePictureUrl: true,
          }
        },
        receiver: {
          select: {
            userNickname: true,
            walletAddress: true,
            profilePictureUrl: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    });

    // Get total count for pagination
    const totalCount = await prisma.message.count({
      where: {
        OR: [
          {
            receiverId: userId,
            receiverDeletedAt: null,
          },
          {
            senderId: userId,
            senderDeletedAt: null,
          }
        ]
      },
    });

    // Transform messages for frontend consumption - minimal data only
    const transformedMessages = messages.map((message: any) => {
      const isCurrentUserSender = message.senderId === userId;
      const isCurrentUserReceiver = message.receiverId === userId;
      
      return {
        id: message.id.toString(),
        content: message.content,
        createdAt: message.createdAt,
        seenAt: message.seenAt,
        // For display purposes, show the "other" person in the conversation
        sender: {
          nickname: message.sender.userNickname,
          walletAddress: message.sender.walletAddress,
          profilePictureUrl: message.sender.profilePictureUrl,
        },
        receiver: {
          nickname: message.receiver.userNickname,
          walletAddress: message.receiver.walletAddress,
          profilePictureUrl: message.receiver.profilePictureUrl,
        },
        // Helper flags for frontend
        isCurrentUserSender,
        isCurrentUserReceiver,
        // Display name should be the "other" person
        displayName: isCurrentUserSender ? message.receiver.userNickname : message.sender.userNickname,
        displayWalletAddress: isCurrentUserSender ? message.receiver.walletAddress : message.sender.walletAddress,
      };
    });

    return NextResponse.json({
      messages: transformedMessages,
      pagination: {
        page,
        limit,
        total: Number(totalCount),
        pages: Math.ceil(Number(totalCount) / limit),
        hasNext: skip + limit < Number(totalCount),
        hasPrev: page > 1,
      },
    });

  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}
