const { Bot } = require('grammy');
const logger = require('../utils/logger');
const db = require('../db/queries');

const token = process.env.TELEGRAM_BOT_TOKEN;
const groupId = parseInt(process.env.TELEGRAM_GROUP_ID, 10);

if (!token || !groupId) {
    logger.warn('TELEGRAM_BOT_TOKEN or TELEGRAM_GROUP_ID is missing. Telegram bot will not start.');
}

const bot = token && groupId ? new Bot(token) : null;

if (bot) {
    bot.use(async (ctx, next) => {
        if (ctx.chat && ctx.chat.id !== groupId) {
            return;
        }
        await next();
    });

    bot.on('message', async (ctx) => {
        if (ctx.message.text && ctx.message.text.startsWith('/')) return;

        const topicId = ctx.message.message_thread_id;
        let waId = null;

        if (topicId) {
            const contact = db.getContactByTopicId(topicId);
            if (contact) waId = contact.wa_id;
        } else {
            const { db: sqliteObj } = require('../db/index');
            try {
                 const lastMsg = sqliteObj.prepare('SELECT contact_wa_id FROM messages WHERE direction = "in" ORDER BY timestamp DESC LIMIT 1').get();
                 if (lastMsg) waId = lastMsg.contact_wa_id;
            } catch(e) {}
        }

        if (!waId) {
            return ctx.reply('❌ No active WhatsApp chat mapped to this thread. Wait for an incoming message first.');
        }

        // Strictly prevent sending to group chats
        if (waId.endsWith('@g.us')) {
             return ctx.reply('❌ Cannot send messages to WhatsApp groups. This bot is restricted to private chats only.');
        }

        try {
            
            let textToSend = ctx.message.text;
            
            if (ctx.message.photo) {
                textToSend = ctx.message.caption || '[Photo from Telegram]';
            }

            if (textToSend) {
                const { waClient } = require('../whatsapp/client');
                if (waClient) {
                    await waClient.sendMessage(waId, textToSend);
                    db.insertMessage(waId, 'out', textToSend, 'chat');
                    db.insertStyleSample(textToSend, "Sample Context");
                    
                    try {
                        const { cancelTimer } = require('../jobs/timerEngine');
                        cancelTimer(waId);
                    } catch (e) { }
                }
            }
        } catch (err) {
            logger.error('Failed to send message from Telegram to WhatsApp', { error: err.message });
            ctx.reply(`❌ Failed to send message to WhatsApp: ${err.message}`, { message_thread_id: topicId });
        }
    });
}

async function startTelegramBot() {
    if (bot) {
        bot.catch((err) => {
            if (err.message.includes('409') || err.message.includes('Conflict')) {
                logger.error('CRITICAL ERROR: Telegram Bot Conflict. Another instance of this bot is likely running with the same token.');
            } else {
                logger.error('Telegram Bot Error:', { error: err.message });
            }
        });
        
        bot.start({
            allowed_updates: ['message', 'callback_query']
        });
        logger.info('Telegram Bot started');
    }
}

module.exports = {
    bot,
    startTelegramBot
};
