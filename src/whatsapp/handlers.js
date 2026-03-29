const logger = require('../utils/logger');
const { downloadMedia } = require('./media');
const { incrementMessages } = require('../utils/healthCheck');
const { isSpam } = require('../utils/spam');
const db = require('../db/queries');

let routeToTelegram = null;

function setTelegramRouter(routerFn) {
    routeToTelegram = routerFn;
}

async function handleMessage(msg, client) {
    incrementMessages();
    try {
        const contact = await msg.getContact();
        const chat = await msg.getChat();
        
        // Strictly ignore group chats
        if (chat.isGroup) {
             logger.debug(`Ignoring message from group: ${chat.id._serialized}`);
             return;
        }

        db.upsertContact(contact.id._serialized, contact.name || contact.pushname, contact.number);

        if (!msg.fromMe && isSpam(msg.body)) {
            logger.warn('Spam detected and dropped', { body: msg.body });
            return;
        }

        let mediaPackage = null;
        if (msg.hasMedia) {
            mediaPackage = await downloadMedia(msg);
        }

        let location = null;
        if (msg.type === 'location') {
            location = msg.location;
        }

        db.insertMessage(
            chat.id._serialized, 
            msg.fromMe ? 'out' : 'in', 
            msg.body || (mediaPackage ? `[Media: ${mediaPackage.mimetype}]` : ''),
            msg.type
        );

        if (routeToTelegram) {
            await routeToTelegram({
                msg,
                contact,
                chat,
                mediaPackage,
                location
            });
        }
    } catch (err) {
        logger.error('Error handling WhatsApp message', { error: err.message, stack: err.stack });
    }
}

async function handleReaction(reaction, client) {
    if (reaction.id.fromMe) return;

    // Strictly ignore group chat reactions
    if (reaction.id.remote && reaction.id.remote.endsWith('@g.us')) {
        return;
    }

    try {
        if (routeToTelegram) {
            await routeToTelegram({
                type: 'reaction',
                reaction
            });
        }
    } catch (e) {
        logger.error('Error handling reaction', { error: e.message });
    }
}

async function handleCall(call, client) {
    // Strictly ignore group calls (if any)
    if (call.from && call.from.endsWith('@g.us')) {
        return;
    }

    if (routeToTelegram) {
        await routeToTelegram({
            type: 'call',
            call
        });
    }
}

module.exports = {
    handleMessage,
    handleReaction,
    handleCall,
    setTelegramRouter
};
