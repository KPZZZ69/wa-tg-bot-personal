const { OpenAI } = require('openai');
const db = require('../db/queries');
const logger = require('../utils/logger');
const { safeParseJSON } = require('../utils/jsonParser');

const openai = new OpenAI({ 
    apiKey: process.env.GEMINI_API_KEY,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
});

async function rebuildStyleProfile() {
    try {
        const samples = db.getUntrainedStyleSamples(100);
        if (samples.length < 10) {
            logger.info(`Not enough new samples to rebuild style profile (${samples.length}/10).`);
            return;
        }

        const sampleTexts = samples.map(s => `Context: ${s.contact_context}\nReply: ${s.message_body}`).join('\n\n');

        const response = await openai.chat.completions.create({
            model: 'gemini-1.5-flash',
            messages: [
                {
                    role: 'system',
                    content: `You are an expert linguist. Analyze these message samples from a user and generate a JSON style profile.
Include: tone, avg_message_length, emoji_usage, punctuation_style, opener_patterns, closer_patterns, language_mix, capitalization, filler_words, response_tendencies, sentiment_default.
Return ONLY valid JSON.`
                },
                {
                    role: 'user',
                    content: sampleTexts
                }
            ]
        });

        const styleProfileRaw = response.choices[0].message.content;
        const profileObj = safeParseJSON(styleProfileRaw);
        const newProfile = JSON.stringify(profileObj);
        db.setSetting('ai_style_profile', newProfile);
        db.markSamplesAsTrained(samples.map(s => s.id));
        
        logger.info('Successfully rebuilt AI style profile', { newSamplesTrained: samples.length });
        return newProfile;
    } catch (err) {
        logger.error('Failed to rebuild style profile', { error: err.message });
    }
}

module.exports = { rebuildStyleProfile };
