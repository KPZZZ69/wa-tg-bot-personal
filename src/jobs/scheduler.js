const cron = require('node-cron');
const logger = require('../utils/logger');
const db = require('../db/queries');

async function insertScheduledMessage(wa_id, messageText, sendAtDate) {
    try {
        const { db: sqliteObj } = require('../db/index');
        const stmt = sqliteObj.prepare(`
            INSERT INTO scheduled_messages (wa_id, message_body, scheduled_at)
            VALUES (?, ?, ?)
        `);
        const { encrypt } = require('../db/encryption');
        stmt.run(wa_id, encrypt(messageText), sendAtDate.toISOString());
        return true;
    } catch (e) {
        logger.error('Failed to insert scheduled msg', { error: e.message });
        return false;
    }
}

function processScheduledMessages() {
    try {
        const { db: sqliteObj } = require('../db/index');
        const { decrypt } = require('../db/encryption');
        
        const now = new Date().toISOString();
        const pending = sqliteObj.prepare(`
            SELECT * FROM scheduled_messages 
            WHERE sent = 0 AND scheduled_at <= ?
        `).all(now);

        if (pending.length === 0) return;

        const { waClient } = require('../whatsapp/client');
        if (!waClient) return;

        for (const msg of pending) {
            const body = decrypt(msg.message_body);
            waClient.sendMessage(msg.wa_id, body).then(() => {
                sqliteObj.prepare('UPDATE scheduled_messages SET sent = 1 WHERE id = ?').run(msg.id);
                db.insertMessage(msg.wa_id, 'out', body, 'chat');
                logger.info(`Sent scheduled message to ${msg.wa_id}`);
            }).catch(e => {
                logger.error('Failed sending scheduled msg', { error: e.message });
            });
        }
    } catch (e) {
        logger.error('Error processing scheduled msgs', { error: e.message });
    }
}

// Polling every minute instead of using Redis
cron.schedule('* * * * *', () => {
    processScheduledMessages();
});

module.exports = { insertScheduledMessage };
