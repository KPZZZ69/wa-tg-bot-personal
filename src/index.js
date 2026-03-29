require('dotenv').config();
const logger = require('./utils/logger');
const { startHealthServer } = require('./utils/healthCheck');
const { initDb } = require('./db/index');
const { startClient, setQrCallback } = require('./whatsapp/client');
const { setTelegramRouter } = require('./whatsapp/handlers');
const { InputFile } = require('grammy');
const { startTelegramBot, bot } = require('./telegram/bot');
const { registerCommands } = require('./telegram/commands');
const { initDigestJob } = require('./jobs/digest');
const { initReminderEngine } = require('./jobs/reminderEngine');
const { initWeeklyReport } = require('./jobs/weeklyReport');
const { initMoodReport } = require('./jobs/moodReport');
const { initCleanupJobs } = require('./jobs/cleanup');
const { initVectorDB } = require('./ai/vectorMemory');
const { startTimer, cancelTimer } = require('./jobs/timerEngine');
const { analyzeSentiment } = require('./ai/sentiment');
const { analyzeMood } = require('./ai/moodTracker');
const { detectSchedule } = require('./ai/scheduleDetect');
const { extractCommitments } = require('./ai/commitmentTracker');
const { generateQuickReplies } = require('./telegram/quickReplies');
const { buildQuickReplyKeyboard } = require('./telegram/keyboards');
const db = require('./db/queries');

async function main() {
    logger.info('Starting WA-TG Mirror Bot...');
    
    logger.info('Initializing SQLite...');
    initDb();

    startHealthServer();

    try { await initVectorDB(); } catch(e) { logger.warn('Vector DB init failed', { error: e.message }) }

    if (bot) {
        registerCommands(bot);
        await startTelegramBot();
    } else {
        logger.error('No Telegram bot instance created. Check tokens.');
    }

    setTelegramRouter(async ({ msg, contact, chat, mediaPackage, location, type, reaction, call }) => {
        if (!bot) return;
        const groupId = parseInt(process.env.TELEGRAM_GROUP_ID, 10);
        
        let telegramTopicId = contact ? contact.telegram_topic_id : null;
        let waId = chat ? chat.id._serialized : (contact ? contact.id._serialized : null);

        if (contact && !telegramTopicId && groupId) {
            try {
                const topicName = `${contact.name || contact.pushname || contact.number}`;
                const topic = await bot.api.createForumTopic(groupId, topicName);
                telegramTopicId = topic.message_thread_id;
                db.updateContactTopic(waId, telegramTopicId);
            } catch (err) { }
        }

        if (type === 'reaction' && reaction) {
            const opts = { parse_mode: 'Markdown' };
            if (telegramTopicId) opts.message_thread_id = telegramTopicId;
            bot.api.sendMessage(groupId, `*Reaction:* ${reaction.reaction}`, opts).catch(e => logger.error('Reaction forward fail', { error: e.message }));
            return;
        }

        if (type === 'call' && call) {
             const opts = { parse_mode: 'Markdown' };
             if (telegramTopicId) opts.message_thread_id = telegramTopicId;
             bot.api.sendMessage(groupId, `📞 *Missed WA Call from ${call.from}*`, opts).catch(e => logger.error('Call forward fail', { error: e.message }));
             return;
        }

        if (msg) {
            const senderName = contact ? (contact.name || contact.pushname || contact.number) : 'Unknown WhatsApp Contact';
            let tgMsgText = `👤 *${senderName}*\n\n${msg.body}`;
            let sentiment = { category: 'NEUTRAL', flags: [] };
            
            if (!msg.fromMe && msg.body) {
                 const [sent] = await Promise.all([
                     analyzeSentiment(msg.body),
                     detectSchedule(msg.body, waId),
                     extractCommitments(msg.body, 'in', waId),
                     analyzeMood(waId)
                 ]);
                 sentiment = sent;
                 startTimer(waId);
            } else if (msg.fromMe && waId) {
                 cancelTimer(waId);
            }

            const kb = await buildQuickReplyKeyboard(waId, await generateQuickReplies(contact, msg.body, sentiment.category));

            if (mediaPackage) {
                tgMsgText += `\n[Media attached: ${mediaPackage.mimetype}]`;
                if (mediaPackage.transcript) {
                    tgMsgText += `\n*Audio Transcript:* ${mediaPackage.transcript}`;
                }
            }

            if (sentiment.category === 'URGENT') tgMsgText = `🚨 *[URGENT]*\n${tgMsgText}`;
            if (sentiment.category === 'ANGRY') tgMsgText = `⚠️ *[ANGRY]*\n${tgMsgText}`;

            try {
                const tgOpts = { parse_mode: 'Markdown', reply_markup: kb };
                if (telegramTopicId) tgOpts.message_thread_id = telegramTopicId;
                await bot.api.sendMessage(groupId, tgMsgText, tgOpts);
            } catch(e) {
                logger.error('Message forward failed', { error: e.message });
            }
        }
    });

    setQrCallback((qr) => {
        const groupId = parseInt(process.env.TELEGRAM_GROUP_ID, 10);
        if (bot && groupId) {
             bot.api.sendPhoto(groupId, new InputFile('./qr.png'), { 
                 caption: `📱 *WhatsApp QR Code generated.*\nScan this immediately! (It refreshes every 20s)`, 
                 parse_mode: 'Markdown' 
             }).catch(e => logger.error('Failed sending QR to TG', { error: e.message }));
        }
    });

    logger.info('Client initialization starting...');
    await startClient();

    initDigestJob();
    initReminderEngine();
    initWeeklyReport();
    initMoodReport();
    initCleanupJobs();
}

main().catch(err => {
    logger.error('Startup failed', { error: err.message });
    process.exit(1);
});
