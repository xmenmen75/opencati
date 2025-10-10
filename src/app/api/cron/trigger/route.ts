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

    const { job } = await request.json().catch(() => ({}));
    
    if (job === 'celebration-tips') {
      // Manually trigger celebration tip distribution
      console.log("TRIGGERING CELEBRATION TIP")
      const result = await cronManager.triggerCelebrationTipDistribution();

      return NextResponse.json({
        success: true,
        message: 'Celebration tip distribution triggered manually',
        result,
        timestamp: new Date().toISOString(),
      });
    } else {
      // Default to reward calculation for backward compatibility
      const result = await cronManager.triggerRewardCalculation();

      return NextResponse.json({
        success: true,
        message: 'Reward calculation triggered manually',
        result,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('[MANUAL TRIGGER] Error triggering cron job:', error);
    return NextResponse.json(
      { 
        error: 'Failed to trigger cron job', 
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET endpoint for status
export async function GET() {
  try {
    const status = cronManager.getStatus();
    
    return NextResponse.json({
      message: 'Manual cron job trigger endpoint',
      usage: 'POST with Authorization: Bearer <CRON_SECRET> and optional {"job": "celebration-tips"}',
      availableJobs: ['rewards', 'celebration-tips'],
      currentStatus: status,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({
      message: 'Manual cron job trigger endpoint',
      usage: 'POST with Authorization: Bearer <CRON_SECRET> and optional {"job": "celebration-tips"}',
      availableJobs: ['rewards', 'celebration-tips'],  
      error: 'Could not get status',
      timestamp: new Date().toISOString(),
    });
  }
}
