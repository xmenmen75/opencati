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
    const { threadId, content, catiAmount, reaction } = body;

    // Validate required fields
    if (!threadId) {
      return NextResponse.json({ error: 'Thread ID is required' }, { status: 400 });
    }
    if ((!content || content.trim().length === 0) && !catiAmount && !reaction) {
      return NextResponse.json({ error: 'Message must have content, CATI tip, or reaction' }, { status: 400 });
    }
    if (content && content.length > 255) {
      return NextResponse.json({ error: 'Message content too long (max 255 characters)' }, { status: 400 });
    }
    if (catiAmount && (isNaN(Number(catiAmount)) || Number(catiAmount) < 0)) {
      return NextResponse.json({ error: 'Invalid CATI amount' }, { status: 400 });
    }

    // Get thread and check existence
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
        }
      }
    });
    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    // Create the message in the thread
    const message = await prisma.message.create({
      data: {
        threadId: BigInt(threadId),
        senderId: currentUserId,
        content: content ? content.trim() : ''
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

    // Convert BigInt to string for JSON serialization
    const response = {
      id: message.id.toString(),
      threadId: threadId,
      content: message.content,
      createdAt: message.createdAt,
      sender: {
        nickname: message.sender.userNickname,
        walletAddress: message.sender.walletAddress,
        profilePictureUrl: message.sender.profilePictureUrl
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
