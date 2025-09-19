import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/auth';

export async function PUT(request: NextRequest) {
  try {
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

    // The JWT contains user ID in 'sub'
    const userId = decoded.sub;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Invalid token payload' },
        { status: 401 }
      );
    }
    
    console.log('Updating profile for user ID:', userId);

    // Parse request body
    const body = await request.json();
    const { userNickname, profilePictureUrl, language, timezone } = body;

    // Validate input
    if (userNickname !== undefined && (typeof userNickname !== 'string' || userNickname.length > 100)) {
      return NextResponse.json(
        { error: 'Invalid nickname' },
        { status: 400 }
      );
    }

    if (profilePictureUrl !== undefined && (typeof profilePictureUrl !== 'string' || profilePictureUrl.length > 500)) {
      return NextResponse.json(
        { error: 'Invalid profile picture URL' },
        { status: 400 }
      );
    }

    if (language !== undefined && (typeof language !== 'string' || language.length > 10)) {
      return NextResponse.json(
        { error: 'Invalid language' },
        { status: 400 }
      );
    }

    if (timezone !== undefined && (typeof timezone !== 'string' || timezone.length > 50)) {
      return NextResponse.json(
        { error: 'Invalid timezone' },
        { status: 400 }
      );
    }

    // First, check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: BigInt(userId) },
    });

    console.log('Existing user found:', !!existingUser);

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: BigInt(userId) },
      data: {
        ...(userNickname !== undefined && { userNickname }),
        ...(profilePictureUrl !== undefined && { profilePictureUrl }),
        ...(language !== undefined && { language }),
        ...(timezone !== undefined && { timezone }),
      },
    });

    return NextResponse.json({
      id: updatedUser.id.toString(),
      walletAddress: updatedUser.walletAddress,
      userNickname: updatedUser.userNickname,
      profilePictureUrl: updatedUser.profilePictureUrl,
      language: updatedUser.language,
      timezone: updatedUser.timezone,
      catiBalance: updatedUser.catiBalance.toString(),
      createdAt: updatedUser.createdAt,
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
