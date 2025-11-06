import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
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

    // Parse form data
    const formData = await request.formData();
    const userNickname = formData.get('userNickname') as string | null;
    const language = formData.get('language') as string | null;
    const timezone = formData.get('timezone') as string | null;
    const profilePictureFile = formData.get('profilePictureFile') as File | null;

    // Validate input
    if (userNickname !== null && (typeof userNickname !== 'string' || userNickname.length > 100)) {
      return NextResponse.json(
        { error: 'Invalid nickname' },
        { status: 400 }
      );
    }

    if (language !== null && (typeof language !== 'string' || language.length > 10)) {
      return NextResponse.json(
        { error: 'Invalid language' },
        { status: 400 }
      );
    }

    if (timezone !== null && (typeof timezone !== 'string' || timezone.length > 50)) {
      return NextResponse.json(
        { error: 'Invalid timezone' },
        { status: 400 }
      );
    }

    // Handle file upload
    let profilePictureUrl: string | undefined;
    
    if (profilePictureFile && profilePictureFile.size > 0) {
      // Validate file size (2MB max)
      if (profilePictureFile.size > 2 * 1024 * 1024) {
        return NextResponse.json(
          { error: 'File size exceeds 2MB limit' },
          { status: 400 }
        );
      }

      // Validate file type
      if (!profilePictureFile.type.startsWith('image/')) {
        return NextResponse.json(
          { error: 'Invalid file type. Only images are allowed.' },
          { status: 400 }
        );
      }

      // Create uploads directory if it doesn't exist
      const uploadsDir = join(process.cwd(), 'public', 'uploads', 'avatars');
      try {
        await mkdir(uploadsDir, { recursive: true });
      } catch (error) {
        console.log('Upload directory already exists or created successfully');
      }

      // Generate unique filename
      const fileExtension = profilePictureFile.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExtension}`;
      const filePath = join(uploadsDir, fileName);

      // Convert file to buffer and save
      const bytes = await profilePictureFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      await writeFile(filePath, buffer);
      
      // Set the URL for database storage
      profilePictureUrl = `/uploads/avatars/${fileName}`;
      
      console.log('File uploaded successfully:', profilePictureUrl);
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

    // Prepare update data
    const updateData: any = {};
    if (userNickname !== null) updateData.userNickname = userNickname;
    if (language !== null) updateData.language = language;
    if (timezone !== null) updateData.timezone = timezone;
    if (profilePictureUrl !== undefined) updateData.profilePictureUrl = profilePictureUrl;

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: BigInt(userId) },
      data: updateData,
    });

    return NextResponse.json({
      id: updatedUser.id.toString(),
      walletAddress: updatedUser.walletAddress,
      userNickname: updatedUser.userNickname,
      profilePictureUrl: updatedUser.profilePictureUrl,
      language: updatedUser.language,
      timezone: updatedUser.timezone,
      catiBalance: updatedUser.catiBalance.toString(),
      usdBalance: updatedUser.usdBalance.toString(),
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
