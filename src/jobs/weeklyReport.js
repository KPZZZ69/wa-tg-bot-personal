const cron = require('node-cron');
const logger = require('../utils/logger');

function initWeeklyReport() {
    const reportDay = process.env.WEEKLY_REPORT_DAY || 'Monday';
    const numDay = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(reportDay);
    
    cron.schedule(`0 9 * * ${numDay > -1 ? numDay : 1}`, async () => {
        logger.info('Running weekly productivity report...');
        const { bot } = require('../telegram/bot');
        const groupId = process.env.TELEGRAM_GROUP_ID;
        
        if (bot && groupId) {
            const report = `📊 *YOUR WEEK IN MESSAGES*\n\n(AI weekly insights generated here)\n_Data placeholder_`;
            await bot.api.sendMessage(groupId, report, { parse_mode: 'Markdown' }).catch(e => logger.error('Report failed', e.message));
        }
    });
}

module.exports = { initWeeklyReport };
