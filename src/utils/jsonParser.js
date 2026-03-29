function safeParseJSON(str) {
    if (!str) return {};
    try {
        let cleanStr = str.trim();
        if (cleanStr.startsWith('```json')) {
            cleanStr = cleanStr.substring(7);
        } else if (cleanStr.startsWith('```')) {
            cleanStr = cleanStr.substring(3);
        }
        if (cleanStr.endsWith('```')) {
            cleanStr = cleanStr.substring(0, cleanStr.length - 3);
        }
        return JSON.parse(cleanStr.trim());
    } catch (e) {
        throw new Error(`Failed to parse JSON: ${e.message}. Raw text: ${str.substring(0, 100)}...`);
    }
}

module.exports = { safeParseJSON };
