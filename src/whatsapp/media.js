const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
let transcribeAudio = null; // Lazy load to avoid circular dependency

async function downloadMedia(waMessage) {
    if (!waMessage.hasMedia) return null;

    try {
        const media = await waMessage.downloadMedia();
        if (!media) return null;

        let transcript = null;
        if (media.mimetype.includes('audio') || media.mimetype.includes('ogg')) {
            if (!transcribeAudio) {
                transcribeAudio = require('../ai/transcribe').transcribeAudio;
            }
            const tempFilePath = path.join(require('os').tmpdir(), `${uuidv4()}.${media.mimetype.split('/')[1].split(';')[0]}`);
            fs.writeFileSync(tempFilePath, media.data, { encoding: 'base64' });
            
            transcript = await transcribeAudio(tempFilePath);
            
            try { fs.unlinkSync(tempFilePath); } catch (e) { }
        }

        return {
            mimetype: media.mimetype,
            data: Buffer.from(media.data, 'base64'),
            filename: media.filename || `${uuidv4()}.${media.mimetype.split('/')[1].split(';')[0]}`,
            transcript
        };
    } catch (err) {
        logger.error('Failed to download WA media', { error: err.message, messageId: waMessage.id._serialized });
        return null;
    }
}

module.exports = { downloadMedia };
