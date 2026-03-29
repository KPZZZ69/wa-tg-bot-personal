const cron = require('node-cron');
const logger = require('../utils/logger');
let rebuildStyleProfile = null;

function initCleanupJobs() {
    cron.schedule('0 3 * * *', async () => {
        try {
            logger.info('Running nightly cleanup & maintenance jobs...');
            
            const retentionDays = parseInt(process.env.DATA_RETENTION_DAYS || '90', 10);
            const { db: sqliteObj } = require('../db/index');
            
            sqliteObj.prepare(`DELETE FROM messages WHERE timestamp <= datetime('now', '-${retentionDays} days')`).run();
            // Keep style samples permanently unless explicitly asked to purge
            
            if (!rebuildStyleProfile) {
                rebuildStyleProfile = require('../ai/styleProfile').rebuildStyleProfile;
            }
            if (rebuildStyleProfile) await rebuildStyleProfile();

        } catch (e) {
            logger.error('Nightly cleanup failed', { error: e.message });
        }
    });
}

module.exports = { initCleanupJobs };
