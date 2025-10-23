import { cronManager } from '../src/lib/cron-manager';

(async () => {
  try {
    console.log('[cron] started', new Date().toISOString());
    await cronManager.initialize();
  } catch (err) {
    console.error('[cron] error', err);
  }
})();
