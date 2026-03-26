import cron from 'node-cron';
import { config } from './config';

type SyncFn = () => Promise<void>;

export function startScheduler(syncFn: SyncFn): void {
    const minutes = config.sync.intervalMinutes;

    // Chuyển phút sang cron expression
    // Ví dụ: 30 phút → "*/30 * * * *"
    const cronExpr = `*/${minutes} * * * *`;

    console.log(`⏰ Scheduler started — sync every ${minutes} minutes`);
    console.log(`   Next run: ${getNextRunTime(minutes)}\n`);

    cron.schedule(cronExpr, async () => {
        console.log(`\n⏰ [${new Date().toLocaleString('vi-VN')}] Scheduled sync starting...`);
        try {
            await syncFn();
        } catch (err: any) {
            console.error('❌ Scheduled sync failed:', err.message);
        }
        console.log(`   Next run: ${getNextRunTime(minutes)}`);
    });
}

function getNextRunTime(intervalMinutes: number): string {
    const next = new Date();
    next.setMinutes(next.getMinutes() + intervalMinutes);
    return next.toLocaleString('vi-VN');
}