const cron = require('node-cron');
const logger = require('../utils/logger');
const db = require('../db/queries');

function initDigestJob() {
    const digestTime = process.env.DIGEST_TIME || '08:00';
    const [hour, minute] = digestTime.split(':');
    const timezone = process.env.TIMEZONE || 'Asia/Kolkata';

    cron.schedule(`${minute} ${hour} * * *`, async () => {
        logger.info('Running daily digest job...');
        await sendDailyDigest();
    }, {
        scheduled: true,
        timezone
    });
}

async function sendDailyDigest() {
    try {
        const { healthState } = require('../utils/healthCheck');
        const count = healthState.messages_today || 0;
        
        const summary = `🌅 *Daily Digest*\n\nTotal messages processed today: ${count}\nBot is running normally.`;
        
        const { bot } = require('../telegram/bot');
        const groupId = process.env.TELEGRAM_GROUP_ID;
        
        if (bot && groupId) {
            await bot.api.sendMessage(groupId, summary, { parse_mode: 'Markdown' });
            healthState.messages_today = 0;
        }
    } catch (e) {
        logger.error('Failed to send daily digest', { error: e.message });
    }
}

module.exports = { initDigestJob, sendDailyDigest };
