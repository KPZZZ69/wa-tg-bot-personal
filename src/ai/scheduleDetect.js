const { OpenAI } = require('openai');
const db = require('../db/queries');
const logger = require('../utils/logger');
const { safeParseJSON } = require('../utils/jsonParser');

const openai = new OpenAI({ 
    apiKey: process.env.GEMINI_API_KEY,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
});

async function detectSchedule(text, wa_id) {
    if (!text || text.length < 10) return null;

    try {
        const response = await openai.chat.completions.create({
            model: 'gemini-1.5-flash',
            messages: [
                {
                    role: 'system',
                    content: `Extract dates, times, events, deadlines. 
Return JSON: { "hasSchedule": true/false, "events": [{ "what": "meeting", "when_raw": "tomorrow 3pm", "when_iso": "YYYY-MM-DDTHH:mm:ssZ" }] }. Current Time: ${new Date().toISOString()}`
                },
                { role: 'user', content: text }
            ]
        });

        const result = safeParseJSON(response.choices[0].message.content);
        if (result.hasSchedule && result.events && result.events.length > 0) {
            result.events.forEach(ev => {
                if (ev.when_iso) {
                    db.insertReminder(wa_id, ev.what, ev.when_iso);
                }
            });
        }
        return result;
    } catch (err) {
        logger.error('Schedule detection failed', { error: err.message });
        return null;
    }
}

module.exports = { detectSchedule };
