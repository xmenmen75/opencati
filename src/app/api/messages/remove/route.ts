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
    
    const { messageId, deleteAll = false } = body;

    const now = new Date();

    if (deleteAll) {
      // Delete all messages for the current user
      // Update all messages where user is receiver and not already deleted
      const receiverUpdateResult = await prisma.message.updateMany({
        where: {
          receiverId: currentUserId,
          receiverDeletedAt: null
        },
        data: {
          receiverDeletedAt: now
        }
      });

      // Update all messages where user is sender and not already deleted
      const senderUpdateResult = await prisma.message.updateMany({
        where: {
          senderId: currentUserId,
          senderDeletedAt: null
        },
        data: {
          senderDeletedAt: now
        }
      });

      const totalDeleted = receiverUpdateResult.count + senderUpdateResult.count;

      return NextResponse.json({
        message: 'All messages deleted successfully',
        deletedAt: now,
        totalDeleted: Number(totalDeleted),
        receivedMessagesDeleted: Number(receiverUpdateResult.count),
        sentMessagesDeleted: Number(senderUpdateResult.count)
      });
    }

    // Individual message deletion
    if (!messageId) {
      return NextResponse.json({ error: 'Message ID is required for individual deletion' }, { status: 400 });
    }

    // Get the message to check permissions
    const message = await prisma.message.findUnique({
      where: { id: BigInt(messageId) },
      select: {
        id: true,
        senderId: true,
        receiverId: true,
        senderDeletedAt: true,
        receiverDeletedAt: true
      }
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Check if current user is either sender or receiver
    const isSender = message.senderId === currentUserId;
    const isReceiver = message.receiverId === currentUserId;

    if (!isSender && !isReceiver) {
      return NextResponse.json({ 
        error: 'You do not have permission to delete this message' 
      }, { status: 403 });
    }

    // Check if message is already deleted by this user
    if (isSender && message.senderDeletedAt) {
      return NextResponse.json({ 
        error: 'Message already deleted by you' 
      }, { status: 400 });
    }

    if (isReceiver && message.receiverDeletedAt) {
      return NextResponse.json({ 
        error: 'Message already deleted by you' 
      }, { status: 400 });
    }

    // Perform soft delete based on user role
    const updateData: any = {};

    if (isSender) {
      updateData.senderDeletedAt = now;
    } else if (isReceiver) {
      updateData.receiverDeletedAt = now;
    }

    // Update the message with deletion timestamp
    await prisma.message.update({
      where: { id: BigInt(messageId) },
      data: updateData
    });

    return NextResponse.json({
      message: 'Message deleted successfully',
      deletedAt: now,
      deletedBy: isSender ? 'sender' : 'receiver'
    });

  } catch (error) {
    console.error('Error deleting message:', error);
    return NextResponse.json(
      { error: 'Failed to delete message' }, 
      { status: 500 }
    );
  }
}
