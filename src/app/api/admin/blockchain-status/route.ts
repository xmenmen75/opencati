import { NextRequest, NextResponse } from 'next/server';
import { getCatiBlockchainService } from '@/lib/blockchain';

export async function GET(request: NextRequest) {
  try {
    // Simple auth check (you should implement proper admin authentication)
    const authHeader = request.headers.get('authorization');
    const adminKey = process.env.ADMIN_API_KEY;
    
    if (!adminKey || authHeader !== `Bearer ${adminKey}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const blockchainService = getCatiBlockchainService();
    
    // Check platform wallet balance
    const balanceInfo = await blockchainService.checkPlatformBalance();
    
    return NextResponse.json({
      success: true,
      platformWallet: {
        balance: balanceInfo.balance,
        isLowBalance: balanceInfo.isLowBalance,
        threshold: balanceInfo.threshold,
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error checking platform status:', error);
    return NextResponse.json(
      { error: 'Failed to check platform status' },
      { status: 500 }
    );
  }
}
