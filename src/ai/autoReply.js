const { OpenAI } = require('openai');
const db = require('../db/queries');
const logger = require('../utils/logger');
const { getPersonalityPrompt } = require('./personality');
const { retrieveMemories } = require('./vectorMemory');

const openai = new OpenAI({ 
    apiKey: process.env.GEMINI_API_KEY,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
});

async function generateAutoReply(wa_id) {
    try {
        const contact = db.getContactByWaId(wa_id) || {};
        const msgs = db.getRecentMessages(wa_id, 20);
        const styleProfileRaw = db.getSetting('ai_style_profile');
        const styleProfile = styleProfileRaw ? JSON.parse(styleProfileRaw) : {};
        
        let contextText = msgs.map(m => `[${m.direction === 'in' ? contact.name || 'Contact' : 'Me'}]: ${m.body}`).join('\n');
        
        const lastInMsgs = msgs.filter(m => m.direction === 'in');
        const queryStr = lastInMsgs.length > 0 ? lastInMsgs[lastInMsgs.length-1].body : 'conversation';
        const memories = await retrieveMemories(wa_id, queryStr, 3);
        const memoryContext = memories.length ? `Relevant Past Facts:\n${memories.join('\n')}` : '';

        const personalityMode = contact.personality_mode || 'clone';
        const instruction = getPersonalityPrompt(personalityMode);

        const response = await openai.chat.completions.create({
            model: 'gemini-2.5-flash',
            messages: [
                {
                    role: 'system',
                    content: `You are simulating the user in a WhatsApp conversation. 
Write EXACTLY in their style. Do not break character.
${instruction}

Learned Style Profile:
${JSON.stringify(styleProfile || {})}

${memoryContext}

Context — Recent conversation:
${contextText}

Rules:
- The contact is waiting for a response, and you (the user you are simulating) have been busy.
- Analyze the topic currently being discussed.
- Generate a reply that continues the conversation naturally and keeps it going.
- Never say you are an AI.
- Output ONLY the reply text, nothing else.`
                },
                {
                    role: 'user',
                    content: `Write the reply to continue the conversation:`
                }
            ],
            temperature: 0.7
        });

        return response.choices[0].message.content.trim();
    } catch (err) {
        logger.error('Auto-reply generation failed', { error: err.message });
        return 'I am busy right now, I will get back to you later.'; // Fallback
    }
}

module.exports = { generateAutoReply };
