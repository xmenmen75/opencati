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

    // Get threads where user is sender or receiver
    const threads = await prisma.thread.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId }
        ]
      },
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
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            content: true,
            createdAt: true,
            senderId: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc',
      },
      skip,
      take: limit,
    });

    // Get total count for pagination
    const totalCount = await prisma.thread.count({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId }
        ]
      }
    });

    // Transform threads for frontend consumption
    const transformedThreads = threads.map((thread: any) => {
      const latestMessage = thread.messages[0];
      const isCurrentUserSender = thread.senderId === userId;
      const isCurrentUserReceiver = thread.receiverId === userId;
      return {
        id: thread.id.toString(),
        sender: {
          nickname: thread.sender.userNickname,
          walletAddress: thread.sender.walletAddress,
          profilePictureUrl: thread.sender.profilePictureUrl
        },
        receiver: {
          nickname: thread.receiver.userNickname,
          walletAddress: thread.receiver.walletAddress,
          profilePictureUrl: thread.receiver.profilePictureUrl
        },
        latestMessage: latestMessage ? {
          id: latestMessage.id.toString(),
          content: latestMessage.content,
          createdAt: latestMessage.createdAt,
          senderId: latestMessage.senderId.toString()
        } : null,
        isCurrentUserSender,
        isCurrentUserReceiver,
        displayName: isCurrentUserSender ? thread.receiver.userNickname : thread.sender.userNickname,
        displayWalletAddress: isCurrentUserSender ? thread.receiver.walletAddress : thread.sender.walletAddress,
        senderSeenAt: thread.senderSeenAt,
        receiverSeenAt: thread.receiverSeenAt,
      };
    });

    return NextResponse.json({
      threads: transformedThreads,
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
    console.error('Error fetching threads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch threads' },
      { status: 500 }
    );
  }
}
