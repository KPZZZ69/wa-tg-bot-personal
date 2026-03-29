const logger = require('../utils/logger');

async function generateQuickReplies(contact, messageText, sentiment) {
    try {
        if (sentiment === 'QUESTION') {
            return ["Yes, absolutely.", "Let me check and get back to you.", "Can you clarify?"];
        }
        if (sentiment === 'ANGRY') {
            return ["I understand your frustration.", "Let me look into this right away.", "I am sorry for the inconvenience."];
        }
        if (sentiment === 'URGENT') {
            return ["On it!", "Checking now.", "Call me."];
        }
        
        return ["Ok.", "Sounds good!", "I'll revert soon."];
    } catch (err) {
        logger.error('Failed to generate quick replies', { error: err.message });
        return [];
    }
}

module.exports = { generateQuickReplies };
