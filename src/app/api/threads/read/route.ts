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
    
    const { threadId } = body;

    // Validate required fields
    if (!threadId) {
      return NextResponse.json({ error: 'Thread ID is required' }, { status: 400 });
    }

    // Get the thread to verify permissions
    const thread = await prisma.thread.findUnique({
      where: { id: BigInt(threadId) },
      select: {
        id: true,
        senderId: true,
        receiverId: true,
        senderSeenAt: true,
        receiverSeenAt: true
      }
    });

    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    // Determine if current user is sender or receiver
    let updateData: any = {};
    let alreadyRead = false;
    let seenAtValue = null;
    const now = new Date();
    if (thread.senderId === currentUserId) {
      // Sender reading
      if (thread.senderSeenAt) {
        alreadyRead = true;
        seenAtValue = thread.senderSeenAt;
      } else {
        updateData.senderSeenAt = now;
        seenAtValue = now;
      }
    } else if (thread.receiverId === currentUserId) {
      // Receiver reading
      if (thread.receiverSeenAt) {
        alreadyRead = true;
        seenAtValue = thread.receiverSeenAt;
      } else {
        updateData.receiverSeenAt = now;
        seenAtValue = now;
      }
    } else {
      return NextResponse.json({ error: 'You are not a participant in this thread' }, { status: 403 });
    }

    if (alreadyRead) {
      return NextResponse.json({
        message: 'Thread was already read',
        threadId: thread.id.toString(),
        seenAt: seenAtValue
      });
    }

    // Mark thread as read
    const updatedThread = await prisma.thread.update({
      where: { id: BigInt(threadId) },
      data: updateData,
      select: {
        id: true,
        senderSeenAt: true,
        receiverSeenAt: true
      }
    });

    return NextResponse.json({
      message: 'Thread marked as read successfully',
      threadId: updatedThread.id.toString(),
      senderSeenAt: updatedThread.senderSeenAt,
      receiverSeenAt: updatedThread.receiverSeenAt
    });

  } catch (error) {
    console.error('Error marking message as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark message as read' }, 
      { status: 500 }
    );
  }
}
