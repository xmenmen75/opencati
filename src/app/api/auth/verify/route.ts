import { NextRequest, NextResponse } from 'next/server';
import { SiweMessage } from 'siwe';
import { ethers } from 'ethers';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { message, signature } = await request.json();

    if (!message || !signature) {
      return NextResponse.json(
        { error: 'Message and signature are required' },
        { status: 400 }
      );
    }

    console.log('Verifying SIWE message:', message);
    console.log('With signature:', signature);

    // Parse and validate the SIWE message
    let siweMessage: SiweMessage;
    try {
      siweMessage = new SiweMessage(message);
    } catch (error) {
      console.error('Failed to parse SIWE message:', error);
      return NextResponse.json(
        { error: 'Invalid SIWE message format' },
        { status: 400 }
      );
    }

    // Verify the signature and extract address
    let verificationResult;
    try {
      verificationResult = await siweMessage.verify({ signature });
    } catch (error) {
      console.error('Signature verification failed:', error);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    if (!verificationResult.success) {
      console.error('SIWE verification failed:', verificationResult.error);
      return NextResponse.json(
        { error: 'Signature verification failed' },
        { status: 401 }
      );
    }

    // Extract and checksum the address
    const checksummedAddress = ethers.getAddress(siweMessage.address);
    console.log('Verified address:', checksummedAddress);

    // Verify domain matches
    const expectedDomain = process.env.NEXT_PUBLIC_DOMAIN || 'localhost';
    const messageDomain = siweMessage.domain;
    
    // Remove port from expected domain for comparison since SIWE uses hostname
    const domainToCheck = expectedDomain.replace(/:\d+$/, '');
    
    if (messageDomain !== domainToCheck) {
      console.error('Domain mismatch:', messageDomain, 'vs', domainToCheck);
      return NextResponse.json(
        { error: 'Domain mismatch - possible phishing attempt' },
        { status: 401 }
      );
    }

    // Verify and consume the nonce
    const nonceRecord = await prisma.authNonce.findFirst({
      where: {
        nonce: siweMessage.nonce,
        address: checksummedAddress,
        used: false,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!nonceRecord) {
      console.error('Invalid or expired nonce:', siweMessage.nonce);
      return NextResponse.json(
        { error: 'Invalid or expired nonce' },
        { status: 401 }
      );
    }

    // Mark nonce as used
    await prisma.authNonce.update({
      where: { id: nonceRecord.id },
      data: { used: true },
    });

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { walletAddress: checksummedAddress },
    });

    if (!user) {
      console.log('Creating new user for address:', checksummedAddress);
      
      // Use default nickname "Opencatier"
      const nickname = 'Opencatier';

      user = await prisma.user.create({
        data: {
          walletAddress: checksummedAddress,
          userNickname: nickname,
          catiBalance: BigInt(10000), // Welcome bonus: 10,000 CATI tokens
        },
      });

      console.log('Created new user:', user);
    }

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    const tokenPayload = {
      sub: user.id.toString(),
      address: checksummedAddress,
      jti: crypto.randomUUID(),
    };

    const token = jwt.sign(tokenPayload, jwtSecret, {
      expiresIn: '2h',
    });

    // Create session record
    await prisma.authSession.create({
      data: {
        userId: user.id,
        jti: tokenPayload.jti,
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
      },
    });

    console.log('Authentication successful for user:', user.id);

    return NextResponse.json({
      token,
      user: {
        id: user.id.toString(),
        walletAddress: user.walletAddress,
        userNickname: user.userNickname,
        profilePictureUrl: user.profilePictureUrl,
        language: user.language,
        timezone: user.timezone,
        catiBalance: user.catiBalance.toString(),
        createdAt: user.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Authentication verification failed:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
