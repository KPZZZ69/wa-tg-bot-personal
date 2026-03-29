const logger = require('../utils/logger');
let timers = new Map();

function startTimer(wa_id) {
    if (timers.has(wa_id)) {
        clearTimeout(timers.get(wa_id));
        timers.delete(wa_id);
    }
    
    const db = require('../db/queries');
    if (db.getSetting('GLOBAL_AUTOREPLY') === 'false') return;

    const delay = parseInt(process.env.AUTO_REPLY_DELAY_MS || '20000', 10);
    logger.info(`Starting auto-reply timer for ${wa_id} (${delay}ms)`);

    const timerId = setTimeout(async () => {
        timers.delete(wa_id);
        logger.info(`Timer fired for ${wa_id}. Triggering AI auto-reply.`);
        
        try {
            const { generateAutoReply } = require('../ai/autoReply');
            const replyText = await generateAutoReply(wa_id);
            
            const { waClient } = require('../whatsapp/client');
            if (waClient && replyText) {
                await waClient.sendMessage(wa_id, replyText);
                db.insertMessage(wa_id, 'out', replyText, 'chat', true);
                
                const { bot } = require('../telegram/bot');
                const contact = db.getContactByWaId(wa_id);
                if (bot && contact && contact.telegram_topic_id) {
                    bot.api.sendMessage(
                        contact.telegram_topic_id, 
                        `🤖 *Auto-replied:*\n${replyText}`, 
                        { parse_mode: 'Markdown' }
                    ).catch(e => logger.error('Failed to send auto-reply notice to TG', { error: e.message }));
                }
            }
        } catch (e) {
            logger.error('Auto-reply execution failed', { error: e.message });
        }
    }, delay);

    timers.set(wa_id, timerId);
}

function cancelTimer(wa_id) {
    if (timers.has(wa_id)) {
        clearTimeout(timers.get(wa_id));
        timers.delete(wa_id);
        logger.info(`Cancelled auto-reply timer for ${wa_id}`);
    }
}

module.exports = { startTimer, cancelTimer };
