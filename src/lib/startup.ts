// This file runs when the Next.js application starts up
// It initializes the cron jobs automatically

let cronInitialized = false;

export async function initializeCronJobs() {
  if (cronInitialized) {
    console.log('[STARTUP] Cron jobs already initialized, skipping...');
    return;
  }

  try {
    console.log('[STARTUP] Initializing cron jobs...');
    
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      console.warn('[STARTUP] CRON_SECRET not set, skipping cron initialization');
      return;
    }

    // Import and initialize the cron manager
    const { cronManager } = await import('@/lib/cron-manager');
    await cronManager.initialize();
    
    cronInitialized = true;
    console.log('[STARTUP] Cron jobs initialized successfully');
  } catch (error) {
    console.error('[STARTUP] Failed to initialize cron jobs:', error);
  }
}

// Auto-initialize in development and production
if (typeof window === 'undefined') {
  // Server-side only
  initializeCronJobs();
}
