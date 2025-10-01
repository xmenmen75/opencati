import { NextRequest, NextResponse } from 'next/server';
import { cronManager } from '@/lib/cron-manager';

export async function POST(request: NextRequest) {
  try {
    // Verify this is an internal request (you might want to add authentication)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Initialize cron jobs
    await cronManager.initialize();

    return NextResponse.json({
      success: true,
      message: 'Cron jobs initialized successfully',
      jobs: cronManager.getStatus(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[CRON INIT] Error initializing cron jobs:', error);
    return NextResponse.json(
      { 
        error: 'Failed to initialize cron jobs', 
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check cron status
export async function GET() {
  try {
    return NextResponse.json({
      status: 'active',
      jobs: cronManager.getStatus(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[CRON INIT] Error getting cron status:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get cron status', 
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
