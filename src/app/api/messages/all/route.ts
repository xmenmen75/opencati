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

    // Get messages where user is the receiver and not deleted by receiver
    const messages = await prisma.message.findMany({
      where: {
        receiverId: userId,
        receiverDeletedAt: null, // Exclude messages deleted by receiver
      },
      include: {
        sender: {
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
        receiverId: userId,
        receiverDeletedAt: null,
      },
    });

    // Transform messages for frontend consumption - minimal data only
    const transformedMessages = messages.map((message: any) => ({
      id: message.id.toString(),
      content: message.content,
      createdAt: message.createdAt,
      sender: {
        nickname: message.sender.userNickname,
        walletAddress: message.sender.walletAddress,
        profilePictureUrl: message.sender.profilePictureUrl,
      }
    }));

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
