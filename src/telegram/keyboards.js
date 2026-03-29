const { InlineKeyboard } = require('grammy');

function buildUndoKeyboard(contactWaId) {
    return new InlineKeyboard()
        .text('✏️ Edit Reply', `edit_${contactWaId}`)
        .text('↩️ Send Correction', `correct_${contactWaId}`)
        .text('🗑️ Undo (30s)', `undo_${contactWaId}`);
}

function buildQuickReplyKeyboard(contactWaId, suggestions) {
    if (!suggestions || suggestions.length === 0) return new InlineKeyboard();
    
    const kb = new InlineKeyboard();
    suggestions.forEach((s, idx) => {
        const shortText = s.substring(0, 30);
        kb.text(`💬 ${shortText}...`, `qr_${contactWaId}_${idx}`).row();
    });
    return kb;
}

function buildSentimentAlertKeyboard(contactWaId, sentiment) {
    const kb = new InlineKeyboard();
    if (sentiment === 'ANGRY') {
        kb.text('Suggest Calming Reply', `template_calm_${contactWaId}`);
    } else if (sentiment === 'SAD') {
        kb.text('Suggest Empathetic Reply', `template_empathy_${contactWaId}`);
    } else if (sentiment === 'URGENT') {
        kb.text('🚨 ACK URGENT', `qr_urgent_${contactWaId}`);
    }
    return kb;
}

module.exports = {
    buildUndoKeyboard,
    buildQuickReplyKeyboard,
    buildSentimentAlertKeyboard
};
