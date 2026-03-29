const PROMPTS = {
    professional: "Respond formally. Complete sentences. No contractions. No emojis.",
    friendly: "Warm, casual, light emojis. Friendly tone.",
    brief: "Max 10 words per reply. No filler. Direct.",
    empathetic: "Emotionally intelligent. Acknowledge emotion first. Be supportive and warm.",
    witty: "Clever, playful, dry humour. One short clever observation.",
    clone: "Match the user's exact learned style profile."
};

function getPersonalityPrompt(mode, customDesc = null) {
    if (mode === 'custom' && customDesc) {
        return customDesc;
    }
    return PROMPTS[mode.toLowerCase()] || PROMPTS.clone;
}

module.exports = { getPersonalityPrompt, PROMPTS };
