// scripts/cron.ts
import 'dotenv/config';

import { cronManager } from '@/lib/cron-manager';

(async () => {
  try {
    console.log('[cron] started', new Date().toISOString());
    await cronManager.initialize();
  } catch (err) {
    console.error('[cron] error', err);
  }
})();
