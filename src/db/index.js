const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const dbPath = process.env.DB_PATH || path.join(__dirname, '../../data/bot.db');

const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}

const db = new Database(dbPath, { 
    // verbose: console.log
});

db.pragma('journal_mode = WAL');

function initDb() {
    db.prepare(`
        CREATE TABLE IF NOT EXISTS contacts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            wa_id TEXT UNIQUE,
            name TEXT,
            phone TEXT,
            telegram_topic_id INTEGER UNIQUE,
            personality_mode TEXT DEFAULT 'clone',
            relationship_profile TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_message_at DATETIME
        )
    `).run();

    db.prepare(`
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            wa_id TEXT,
            direction TEXT CHECK( direction IN ('in', 'out') ),
            body TEXT,
            media_type TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            replied BOOLEAN DEFAULT 0,
            auto_replied BOOLEAN DEFAULT 0
        )
    `).run();

    db.prepare(`
        CREATE TABLE IF NOT EXISTS ai_style_samples (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            message_body TEXT,
            contact_context TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            used_for_training BOOLEAN DEFAULT 0
        )
    `).run();

    db.prepare(`
        CREATE TABLE IF NOT EXISTS scheduled_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            wa_id TEXT,
            message_body TEXT,
            scheduled_at DATETIME,
            sent BOOLEAN DEFAULT 0
        )
    `).run();

    db.prepare(`
        CREATE TABLE IF NOT EXISTS auto_reply_timers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            wa_id TEXT,
            triggered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            cancelled BOOLEAN DEFAULT 0
        )
    `).run();

    db.prepare(`
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT
        )
    `).run();

    db.prepare(`
        CREATE TABLE IF NOT EXISTS reminders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            contact_wa_id TEXT,
            title TEXT,
            remind_at DATETIME,
            reminded BOOLEAN DEFAULT 0,
            snoozed_until DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `).run();

    db.prepare(`
        CREATE TABLE IF NOT EXISTS contact_mood_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            wa_id TEXT,
            mood TEXT,
            mood_score INTEGER,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `).run();

    db.prepare(`
        CREATE TABLE IF NOT EXISTS commitments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            wa_id TEXT,
            text TEXT,
            made_by TEXT,
            due_at DATETIME,
            resolved BOOLEAN DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `).run();

    db.prepare(`
        CREATE TABLE IF NOT EXISTS privacy_rules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            wa_id TEXT,
            rule_type TEXT,
            rule_params_json TEXT,
            active BOOLEAN DEFAULT 1
        )
    `).run();

    db.prepare(`
        CREATE TABLE IF NOT EXISTS audit_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            action TEXT,
            contact_id TEXT,
            meta_json TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `).run();

    db.prepare(`
        CREATE TABLE IF NOT EXISTS vector_cache (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            wa_id TEXT,
            text TEXT,
            vector_id TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `).run();
}

initDb();

function resetDb() {
    process.stdout.write('Resetting DB... ');
    const tables = [
        'contacts', 'messages', 'ai_style_samples', 'scheduled_messages',
        'auto_reply_timers', 'settings', 'reminders', 'contact_mood_log',
        'commitments', 'privacy_rules', 'audit_log', 'vector_cache'
    ];
    tables.forEach(table => {
        db.prepare(`DROP TABLE IF EXISTS ${table}`).run();
    });
    initDb();
    console.log('Done.');
}

module.exports = {
    db,
    initDb,
    resetDb
};
