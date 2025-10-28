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

    // Get threadId from URL parameters
    const { searchParams } = new URL(request.url);
    const threadId = searchParams.get('threadId');

    if (!threadId) {
      return NextResponse.json({ error: 'Thread ID is required' }, { status: 400 });
    }

    // Get the thread with all messages
    const thread = await prisma.thread.findUnique({
      where: { id: BigInt(threadId) },
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
          orderBy: { createdAt: 'asc' },
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

    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    // Check if current user has permission to view this thread
    if (thread.senderId !== currentUserId && thread.receiverId !== currentUserId) {
      return NextResponse.json({ 
        error: 'You do not have permission to view this thread' 
      }, { status: 403 });
    }

    // Transform thread and messages for frontend consumption
    const transformedThread = {
      id: thread.id.toString(),
      sender: {
        id: thread.sender.id.toString(),
        nickname: thread.sender.userNickname,
        walletAddress: thread.sender.walletAddress,
        profilePictureUrl: thread.sender.profilePictureUrl,
      },
      receiver: {
        id: thread.receiver.id.toString(),
        nickname: thread.receiver.userNickname,
        walletAddress: thread.receiver.walletAddress,
        profilePictureUrl: thread.receiver.profilePictureUrl,
      },
      messages: thread.messages.map((msg: any) => ({
        id: msg.id.toString(),
        content: msg.content,
        createdAt: msg.createdAt,
        updatedAt: msg.updatedAt,
        sender: {
          id: msg.sender.id.toString(),
          nickname: msg.sender.userNickname,
          walletAddress: msg.sender.walletAddress,
          profilePictureUrl: msg.sender.profilePictureUrl,
        }
      })),
      reaction: thread.reaction,
      isCurrentUserSender: thread.senderId === currentUserId,
      isCurrentUserReceiver: thread.receiverId === currentUserId,
      displayName: thread.senderId === currentUserId ? thread.receiver.userNickname : thread.sender.userNickname,
      displayWalletAddress: thread.senderId === currentUserId ? thread.receiver.walletAddress : thread.sender.walletAddress,
    };

    return NextResponse.json({
      thread: transformedThread
    });

  } catch (error) {
    console.error('Error fetching thread:', error);
    return NextResponse.json(
      { error: 'Failed to fetch thread' },
      { status: 500 }
    );
  }
}
