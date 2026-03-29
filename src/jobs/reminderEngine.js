const cron = require('node-cron');
const db = require('../db/queries');
const logger = require('../utils/logger');

function initReminderEngine() {
    cron.schedule('* * * * *', async () => {
        try {
            const dueReminders = db.getDueReminders();
            if (dueReminders.length === 0) return;

            const { bot } = require('../telegram/bot');
            
            for (const rem of dueReminders) {
                 const contact = db.getContactByWaId(rem.contact_wa_id);
                 if (bot && contact && contact.telegram_topic_id) {
                     await bot.api.sendMessage(
                         contact.telegram_topic_id, 
                         `🔔 *REMINDER:* ${rem.title}`,
                         { parse_mode: 'Markdown' }
                     ).catch(e => logger.error('Failed to send reminder', { error: e.message }));
                     db.markReminderDone(rem.id);
                 }
            }
        } catch(e) {
            logger.error('Reminder Engine error', { error: e.message });
        }
    });
}

module.exports = { initReminderEngine };
