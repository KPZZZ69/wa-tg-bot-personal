const cron = require('node-cron');
const logger = require('../utils/logger');

function initMoodReport() {
    const reportDay = process.env.MOOD_REPORT_DAY || 'Sunday';
    const numDay = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(reportDay);
    
    cron.schedule(`0 18 * * ${numDay > -1 ? numDay : 0}`, async () => {
        logger.info('Running weekly mood report...');
        const { bot } = require('../telegram/bot');
        const groupId = process.env.TELEGRAM_GROUP_ID;
        
        if (bot && groupId) {
            const report = `📊 *Weekly Mood Summary*\n\n(AI weekly mood analysis here)\n_Data placeholder_`;
            await bot.api.sendMessage(groupId, report, { parse_mode: 'Markdown' }).catch(e => logger.error('Report failed', e.message));
        }
    });
}

module.exports = { initMoodReport };
