const axios = require('axios');
const { franc } = require('franc');

const DEEPL_API_KEY = process.env.DEEPL_API_KEY;
const USER_LANGUAGE = process.env.USER_LANGUAGE || 'EN'; // DeepL uses EN, DE, FR etc

function detectLanguage(text) {
    if (!text) return 'und';
    return franc(text, { minLength: 3 });
}

async function translateText(text, targetLang = USER_LANGUAGE) {
    if (!DEEPL_API_KEY) return text;
    if (!text || text.length < 2) return text;

    try {
        const url = DEEPL_API_KEY.includes(':fx') ? 
            'https://api-free.deepl.com/v2/translate' : 
            'https://api.deepl.com/v2/translate';
            
        const response = await axios.post(url, {
            text: [text],
            target_lang: targetLang.toUpperCase()
        }, {
            headers: {
                'Authorization': `DeepL-Auth-Key ${DEEPL_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.data && response.data.translations && response.data.translations.length > 0) {
            return response.data.translations[0].text;
        }
        return text;
    } catch (error) {
        require('./logger').error('Translation failed', { error: error.message });
        return text;
    }
}

module.exports = { detectLanguage, translateText };
