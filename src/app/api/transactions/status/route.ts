import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/auth';

export async function GET(request: NextRequest) {
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

    const userId = BigInt(decoded.sub);

    // Get query parameters
    const url = new URL(request.url);
    const limitParam = url.searchParams.get('limit');
    const typeParam = url.searchParams.get('type'); // 'withdrawals' or 'deposits'
    
    const limit = limitParam ? parseInt(limitParam) : 10;

    if (typeParam === 'withdrawals') {
      // Get user's withdrawals
      const withdrawals = await prisma.withdrawal.findMany({
        where: { userId },
        orderBy: { requestedAt: 'desc' },
        take: limit,
      });

      return NextResponse.json({
        withdrawals: withdrawals.map(w => ({
          id: w.id.toString(),
          amount: w.amount.toString(),
          status: w.status,
          requestedAt: w.requestedAt,
          completedAt: w.completedAt,
          txHash: w.txHash,
        })),
      });
    }

    if (typeParam === 'deposits') {
      // Get user's deposits
      const deposits = await prisma.deposit.findMany({
        where: { userId },
        orderBy: { requestedAt: 'desc' },
        take: limit,
      });

      return NextResponse.json({
        deposits: deposits.map(d => ({
          id: d.id.toString(),
          amount: d.amount.toString(),
          status: d.status,
          requestedAt: d.requestedAt,
          completedAt: d.completedAt,
          txHash: d.txHash,
        })),
      });
    }

    // Get both withdrawals and deposits
    const [withdrawals, deposits] = await Promise.all([
      prisma.withdrawal.findMany({
        where: { userId },
        orderBy: { requestedAt: 'desc' },
        take: Math.ceil(limit / 2),
      }),
      prisma.deposit.findMany({
        where: { userId },
        orderBy: { requestedAt: 'desc' },
        take: Math.ceil(limit / 2),
      }),
    ]);

    return NextResponse.json({
      withdrawals: withdrawals.map(w => ({
        id: w.id.toString(),
        amount: w.amount.toString(),
        status: w.status,
        requestedAt: w.requestedAt,
        completedAt: w.completedAt,
        txHash: w.txHash,
      })),
      deposits: deposits.map(d => ({
        id: d.id.toString(),
        amount: d.amount.toString(),
        status: d.status,
        requestedAt: d.requestedAt,
        completedAt: d.completedAt,
        txHash: d.txHash,
      })),
    });

  } catch (error) {
    console.error('Error fetching user transactions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
