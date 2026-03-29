const { LocalIndex } = require('vectra');
const { OpenAI } = require('openai');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

const openai = new OpenAI({ 
    apiKey: process.env.GEMINI_API_KEY,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
});

const indexFolder = path.join(__dirname, '../../data/vector_index');
if (!fs.existsSync(indexFolder)) {
    fs.mkdirSync(indexFolder, { recursive: true });
}

const index = new LocalIndex(indexFolder);
let isInitialized = false;

async function initVectorDB() {
    if (!await index.isIndexCreated()) {
        await index.createIndex();
    }
    isInitialized = true;
}

async function embedText(text) {
    const response = await openai.embeddings.create({
        model: "models/gemini-embedding-001", // Corrected model name
        input: text,
    });
    return response.data[0].embedding;
}

async function addMemory(wa_id, text) {
    if (!isInitialized) await initVectorDB();
    try {
        const vector = await embedText(text);
        await index.insertItem({
            vector,
            metadata: { wa_id, text, timestamp: Date.now() }
        });
    } catch(err) {
        logger.error('Failed to add vector memory', { error: err.message });
    }
}

async function retrieveMemories(wa_id, query, limit=5) {
    if (!isInitialized) await initVectorDB();
    try {
        const vector = await embedText(query);
        const results = await index.queryItems(vector, limit * 2);
        return results
            .filter(r => r.item.metadata.wa_id === wa_id)
            .slice(0, limit)
            .map(r => r.item.metadata.text);
    } catch(err) {
        logger.error('Failed to retrieve vector memory', { error: err.message });
        return [];
    }
}

module.exports = { addMemory, retrieveMemories, initVectorDB };
