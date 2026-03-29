const { OpenAI } = require('openai');
const db = require('../db/queries');
const logger = require('../utils/logger');
const { safeParseJSON } = require('../utils/jsonParser');

const openai = new OpenAI({ 
    apiKey: process.env.GEMINI_API_KEY,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
});

async function extractCommitments(text, direction, wa_id) {
    if (!text || text.length < 5) return null;

    try {
        const response = await openai.chat.completions.create({
            model: 'gemini-1.5-flash',
            messages: [
                {
                    role: 'system',
                    content: `Extract commitments from the message (e.g. "I will send it tonight").
Direction provided is ${direction === 'in' ? 'from contact' : 'from user'}.
Return JSON: { "commitments": [{ "text": "send file", "due_at": "YYYY-MM-DDTHH:mm:ssZ or null" }] }`
                },
                { role: 'user', content: text }
            ]
        });

        const result = safeParseJSON(response.choices[0].message.content);
        if (result.commitments && result.commitments.length > 0) {
            result.commitments.forEach(c => {
                db.insertCommitment(wa_id, c.text, direction === 'in' ? 'contact' : 'user', c.due_at || null);
            });
        }
        return result;
    } catch (err) {
        logger.error('Commitment extraction failed', { error: err.message });
        return null;
    }
}

module.exports = { extractCommitments };
