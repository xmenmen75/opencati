import * as cron from 'node-cron';

class CronManager {
  private jobs: Map<string, cron.ScheduledTask> = new Map();

  // Initialize all cron jobs
  public async initialize() {
    console.log('[CRON MANAGER] Initializing cron jobs...');
    
    // Initialize reward calculation job (every 5 minutes)
    this.scheduleRewardCalculation();
    
    console.log('[CRON MANAGER] All cron jobs initialized successfully');
  }

  // Schedule reward calculation to run every 5 minutes
  private scheduleRewardCalculation() {
    // Stop existing job if it exists
    const existingJob = this.jobs.get('reward-calculation');
    if (existingJob) {
      existingJob.stop();
    }

    // Schedule new job - every 1 minute
    const job = cron.schedule('*/1 * * * *', async () => {
      try {
        console.log('[CRON] Running reward calculation job...');
        
        const cronSecret = process.env.CRON_SECRET;
        if (!cronSecret) {
          console.error('[CRON] CRON_SECRET not set, skipping reward calculation');
          return;
        }

        // Call the internal API endpoint
        const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/cron/rewards`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${cronSecret}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.text();
          console.error('[CRON] Reward calculation failed:', response.status, errorData);
          return;
        }

        const result = await response.json();
        console.log('[CRON] Reward calculation completed:', result);
      } catch (error) {
        console.error('[CRON] Error in reward calculation job:', error);
      }
    }, {
      timezone: 'UTC'
    });

    this.jobs.set('reward-calculation', job);
    console.log('[CRON MANAGER] Reward calculation job scheduled to run every 5 minutes');
  }

  // Stop all cron jobs
  public stopAll() {
    console.log('[CRON MANAGER] Stopping all cron jobs...');
    this.jobs.forEach((job, name) => {
      job.stop();
      console.log(`[CRON MANAGER] Stopped job: ${name}`);
    });
    this.jobs.clear();
  }

  // Get status of all jobs
  public getStatus() {
    const status: Record<string, { active: boolean, nextRun: string | null }> = {};
    this.jobs.forEach((job, name) => {
      status[name] = { 
        active: true, // Job exists and is scheduled
        nextRun: name === 'reward-calculation' ? 'Every 5 minutes' : null
      };
    });
    return status;
  }

  // Manually trigger reward calculation
  public async triggerRewardCalculation() {
    try {
      console.log('[CRON MANAGER] Manually triggering reward calculation...');
      
      const cronSecret = process.env.CRON_SECRET;
      if (!cronSecret) {
        throw new Error('CRON_SECRET not set');
      }

      const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/cron/rewards`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cronSecret}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Reward calculation failed: ${response.status} ${errorData}`);
      }

      const result = await response.json();
      console.log('[CRON MANAGER] Manual reward calculation completed:', result);
      return result;
    } catch (error) {
      console.error('[CRON MANAGER] Error in manual reward calculation:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const cronManager = new CronManager();
