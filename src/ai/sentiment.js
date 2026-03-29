const { OpenAI } = require('openai');
const logger = require('../utils/logger');
const { safeParseJSON } = require('../utils/jsonParser');

const openai = new OpenAI({ 
    apiKey: process.env.GEMINI_API_KEY,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
});

async function analyzeSentiment(text) {
    if (!text || text.length < 3) return { category: 'NEUTRAL', flags: [] };

    try {
        const response = await openai.chat.completions.create({
            model: 'gemini-1.5-flash',
            messages: [
                {
                    role: 'system',
                    content: `You are an AI that classifies WhatsApp messages. 
Return ONLY a JSON object: {"category": "URGENT|ANGRY|SAD|POSITIVE|NEUTRAL", "flags": ["QUESTION", "MONEY", "INVITE", "NONE"]}`
                },
                {
                    role: 'user',
                    content: text
                }
            ]
        });

        const result = safeParseJSON(response.choices[0].message.content);
        return {
            category: result.category || 'NEUTRAL',
            flags: result.flags || []
        };
    } catch (err) {
        logger.error('Sentiment analysis failed', { error: err.message });
        return { category: 'NEUTRAL', flags: [] };
    }
}

module.exports = { analyzeSentiment };
