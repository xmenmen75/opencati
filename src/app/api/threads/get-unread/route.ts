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

    // Count unread threads for current user
    const unreadThreadCount = await prisma.thread.count({
      where: {
        OR: [
          {
            senderId: currentUserId,
            senderSeenAt: null
          },
          {
            receiverId: currentUserId,
            receiverSeenAt: null
          }
        ]
      }
    });
    console.log("UNREAD THREAD COUNT: " + unreadThreadCount);
    return NextResponse.json({
      unreadThreadCount: Number(unreadThreadCount)
    });

  } catch (error) {
    console.error('Error fetching unread message count:', error);
    return NextResponse.json(
      { error: 'Failed to fetch unread message count' },
      { status: 500 }
    );
  }
}
