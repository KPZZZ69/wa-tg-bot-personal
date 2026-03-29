const { OpenAI } = require('openai');
const db = require('../db/queries');
const logger = require('../utils/logger');
const { safeParseJSON } = require('../utils/jsonParser');

const openai = new OpenAI({ 
    apiKey: process.env.GEMINI_API_KEY,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
});

async function analyzeMood(wa_id) {
    try {
        const msgs = db.getRecentMessages(wa_id, 20);
        if (msgs.length < 5) return null;

        const textLogs = msgs.map(m => `[${m.direction === 'in' ? 'Contact' : 'User'}]: ${m.body}`).join('\n');

        const response = await openai.chat.completions.create({
            model: 'gemini-1.5-flash',
            messages: [
                {
                    role: 'system',
                    content: `Analyze the Contact's mood from these recent messages. 
Return JSON: {"current_mood": "happy|neutral|stressed|angry|sad", "mood_score": 0-100, "stress_indicators": ["..."]}`
                },
                {
                    role: 'user',
                    content: textLogs
                }
            ]
        });

        const result = safeParseJSON(response.choices[0].message.content);
        db.insertMoodLog(wa_id, result.current_mood, result.mood_score || 50);
        return result;
    } catch (err) {
        logger.error('Mood analysis failed', { error: err.message });
        return null;
    }
}

module.exports = { analyzeMood };
