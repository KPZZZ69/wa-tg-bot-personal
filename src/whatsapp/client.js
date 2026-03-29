const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const qrcodeImg = require('qrcode');
const logger = require('../utils/logger');
const { updateHealth } = require('../utils/healthCheck');
const { handleMessage, handleReaction, handleCall } = require('./handlers');

const puppeteerOptions = {
    args: ['--no-sandbox', '--disable-setuid-sandbox']
};
if (process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD === 'true') {
    puppeteerOptions.executablePath = '/usr/bin/chromium';
}

const waClient = new Client({
    authStrategy: new LocalAuth({ dataPath: process.env.DATA_PATH || './data' }),
    puppeteer: puppeteerOptions
});

let sendQrToTelegramCallback = null;
let reconnectAttempts = 0;
const MAX_RECONNECTS = 5;

function setQrCallback(cb) {
    sendQrToTelegramCallback = cb;
}

waClient.on('qr', (qr) => {
    logger.info('QR Code received. Scan to log in.');
    qrcode.generate(qr, { small: true });
    qrcodeImg.toFile('./qr.png', qr, (err) => {
        if (err) {
            logger.error('Failed to save QR code image', { error: err.message });
        } else {
            if (sendQrToTelegramCallback) {
                 sendQrToTelegramCallback(qr);
            }
        }
    });
});

waClient.on('ready', () => {
    logger.info('WhatsApp Client is ready!');
    updateHealth('wa_connected', true);
    reconnectAttempts = 0;
});

waClient.on('authenticated', () => {
    logger.info('WhatsApp Authenticated successfully');
});

waClient.on('auth_failure', msg => {
    logger.error('WhatsApp Authentication failure', { msg });
    updateHealth('wa_connected', false);
});

waClient.on('disconnected', (reason) => {
    logger.warn('WhatsApp Client was disconnected', { reason });
    updateHealth('wa_connected', false);
    attemptReconnect();
});

function attemptReconnect() {
    if (reconnectAttempts >= MAX_RECONNECTS) {
        logger.error('Max WhatsApp reconnect attempts reached. Needs manual intervention.');
        return;
    }
    reconnectAttempts++;
    const backoff = Math.pow(2, reconnectAttempts) * 1000;
    logger.info(`Attempting to reconnect WhatsApp in ${backoff/1000}s... (Attempt ${reconnectAttempts}/${MAX_RECONNECTS})`);
    
    setTimeout(async () => {
        try {
            await waClient.initialize();
        } catch (err) {
            logger.error('Reconnect failed', { error: err.message });
        }
    }, backoff);
}

waClient.on('message', async msg => await handleMessage(msg, waClient));
waClient.on('message_create', async msg => {
    if (msg.fromMe) await handleMessage(msg, waClient);
});
waClient.on('message_reaction', async reaction => await handleReaction(reaction, waClient));
waClient.on('call', async call => await handleCall(call, waClient));

module.exports = {
    waClient,
    setQrCallback,
    startClient: async () => {
        try {
            logger.info('Initializing WhatsApp client...');
            await waClient.initialize();
        } catch (err) {
            logger.error('CRITICAL: WhatsApp client initialization failed.', { error: err.message });
            process.exit(1);
        }
    }
};
