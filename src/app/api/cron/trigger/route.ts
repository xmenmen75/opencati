import { NextRequest, NextResponse } from 'next/server';
import { cronManager } from '@/lib/cron-manager';

export async function POST(request: NextRequest) {
  try {
    // Verify this is an authorized request (you might want to add proper authentication)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Manually trigger reward calculation
    const result = await cronManager.triggerRewardCalculation();

    return NextResponse.json({
      success: true,
      message: 'Reward calculation triggered manually',
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[MANUAL TRIGGER] Error triggering reward calculation:', error);
    return NextResponse.json(
      { 
        error: 'Failed to trigger reward calculation', 
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET endpoint for status
export async function GET() {
  return NextResponse.json({
    message: 'Manual reward calculation trigger endpoint',
    usage: 'POST with Authorization: Bearer <CRON_SECRET>',
    timestamp: new Date().toISOString(),
  });
}
