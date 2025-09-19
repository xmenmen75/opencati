import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 });
    }

    // Validate and checksum the address
    let checksummedAddress: string;
    try {
      checksummedAddress = ethers.getAddress(address.toLowerCase());
    } catch (error) {
      return NextResponse.json({ error: 'Invalid Ethereum address' }, { status: 400 });
    }

    // Clean up expired nonces for this address
    await prisma.authNonce.deleteMany({
      where: {
        address: checksummedAddress,
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    // Generate a cryptographically secure alphanumeric nonce (SIWE requirement)
    const nonce = generateAlphanumericNonce(32);
    
    // Create nonce record with 10-minute expiration
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    
    const nonceRecord = await prisma.authNonce.create({
      data: {
        nonce,
        address: checksummedAddress,
        used: false,
        expiresAt,
      },
    });

    console.log('Generated nonce for address:', checksummedAddress, 'nonce:', nonce);

    return NextResponse.json({ 
      nonce: nonceRecord.nonce,
      expiresAt: nonceRecord.expiresAt.toISOString()
    });
  } catch (error) {
    console.error('Nonce generation failed:', error);
    return NextResponse.json(
      { error: 'Failed to generate nonce' },
      { status: 500 }
    );
  }
}

// Generate alphanumeric nonce (letters and numbers only) as required by SIWE
function generateAlphanumericNonce(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  // Use crypto.getRandomValues for cryptographically secure randomness
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  
  for (let i = 0; i < length; i++) {
    result += chars[array[i] % chars.length];
  }
  
  return result;
}
