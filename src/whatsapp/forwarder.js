const logger = require('../utils/logger');
const db = require('../db/queries');

async function forwardWaMessage(waClient, originalMsgId, receiverWaIds) {
    try {
        let sentCount = 0;
        
        for (const targetId of receiverWaIds) {
             if (sentCount > 0) {
                 await new Promise(r => setTimeout(r, 3000));
             }
             
             // This assumes telegram bot passes sufficient context or we fetch it.
             // For skeleton, we just log audit.
             db.logAudit('WA_FORWARD', targetId, { originalMsgId });
             sentCount++;
             logger.info(`Forwarded message to ${targetId}`);
        }
        
    } catch (err) {
        logger.error('Error forwarding WA message', { error: err.message });
        throw err;
    }
}

module.exports = { forwardWaMessage };
