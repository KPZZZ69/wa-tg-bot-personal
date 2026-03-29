const db = require('../db/queries');

function shouldForwardMessage(wa_id, messageBody, isMedia) {
    // In a real implementation this hooks to privacy_rules table
    return true; 
}

module.exports = { shouldForwardMessage };
