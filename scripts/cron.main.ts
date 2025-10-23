import { cronManager } from '../src/lib/cron-manager';

(async () => {
  try {
    console.log('[cron] started', new Date().toISOString());
    await cronManager.initialize();
    await new Promise(() => {});
  } catch (err) {
    console.error('[cron] error', err);
  }
})();
