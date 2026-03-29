const fs = require('fs');
const logger = require('../utils/logger');
const FormData = require('form-data');
const axios = require('axios');

async function transcribeAudio(filePath) {
    if (!process.env.GROQ_API_KEY) return '[Transcription unavailable: No GROQ_API_KEY]';
    
    try {
        const form = new FormData();
        form.append('file', fs.createReadStream(filePath));
        form.append('model', 'whisper-large-v3'); // Zero-cost lightning fast transcription

        const response = await axios.post('https://api.groq.com/openai/v1/audio/transcriptions', form, {
            headers: {
                ...form.getHeaders(),
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
            }
        });

        return response.data.text;
    } catch (err) {
        logger.error('Transcription failed', { error: err.message });
        return '[Transcription failed]';
    }
}

module.exports = { transcribeAudio };
