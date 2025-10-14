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
    
    const { messageId } = body;

    // Validate required fields
    if (!messageId) {
      return NextResponse.json({ error: 'Message ID is required' }, { status: 400 });
    }

    // Get the message to verify permissions
    const message = await prisma.message.findUnique({
      where: { id: BigInt(messageId) },
      select: {
        id: true,
        receiverId: true,
        seenAt: true,
        receiverDeletedAt: true
      }
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Check if current user is the receiver
    if (message.receiverId !== currentUserId) {
      return NextResponse.json({ 
        error: 'You can only mark messages as read that were sent to you' 
      }, { status: 403 });
    }

    // Check if message was deleted by receiver
    if (message.receiverDeletedAt) {
      return NextResponse.json({ 
        error: 'Cannot mark deleted message as read' 
      }, { status: 400 });
    }

    // Check if message is already read
    if (message.seenAt) {
      return NextResponse.json({ 
        message: 'Message was already read',
        seenAt: message.seenAt
      });
    }

    // Mark message as read
    const now = new Date();
    const updatedMessage = await prisma.message.update({
      where: { id: BigInt(messageId) },
      data: { seenAt: now },
      select: {
        id: true,
        seenAt: true
      }
    });

    return NextResponse.json({
      message: 'Message marked as read successfully',
      messageId: updatedMessage.id.toString(),
      seenAt: updatedMessage.seenAt
    });

  } catch (error) {
    console.error('Error marking message as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark message as read' }, 
      { status: 500 }
    );
  }
}
