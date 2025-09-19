import jwt from 'jsonwebtoken';
import { prisma } from './prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

interface JWTPayload {
  sub: string; // wallet address
  jti: string; // unique token ID
  iat: number;
  exp: number;
}

export function verifyJWT(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

export async function validateSession(token: string): Promise<{ isValid: boolean; userId?: bigint }> {
  try {
    const decoded = verifyJWT(token);
    
    if (!decoded) {
      return { isValid: false };
    }

    // Check if session exists and is not revoked
    const session = await prisma.authSession.findUnique({
      where: { jti: decoded.jti },
      include: { user: true },
    });

    if (!session || session.isRevoked || session.expiresAt < new Date()) {
      return { isValid: false };
    }

    // Verify wallet address matches
    if (session.user.walletAddress !== decoded.sub) {
      return { isValid: false };
    }

    return { isValid: true, userId: session.userId };
  } catch (error) {
    console.error('Session validation failed:', error);
    return { isValid: false };
  }
}

export async function requireAuth(request: Request): Promise<{ userId: bigint } | Response> {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(
      JSON.stringify({ error: 'No authorization token provided' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const token = authHeader.substring(7);
  const validation = await validateSession(token);
  
  if (!validation.isValid || !validation.userId) {
    return new Response(
      JSON.stringify({ error: 'Invalid or expired token' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return { userId: validation.userId };
}
