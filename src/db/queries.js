const { db } = require('./index');
const { encrypt, decrypt, encryptJSON } = require('./encryption');

// --- Contacts Mapping ---
function upsertContact(wa_id, name, phone) {
    const stmt = db.prepare(`
        INSERT INTO contacts (wa_id, name, phone, last_message_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(wa_id) DO UPDATE SET 
            name = excluded.name,
            phone = excluded.phone,
            last_message_at = CURRENT_TIMESTAMP
    `);
    stmt.run(wa_id, name, phone);
}

function getContactByWaId(wa_id) {
    return db.prepare('SELECT * FROM contacts WHERE wa_id = ?').get(wa_id);
}

function getContactByTopicId(topic_id) {
    return db.prepare('SELECT * FROM contacts WHERE telegram_topic_id = ?').get(topic_id);
}

function updateContactTopic(wa_id, topic_id) {
    db.prepare('UPDATE contacts SET telegram_topic_id = ? WHERE wa_id = ?').run(topic_id, wa_id);
}

function updateContactPersonality(wa_id, mode) {
    db.prepare('UPDATE contacts SET personality_mode = ? WHERE wa_id = ?').run(mode, wa_id);
}

function updateContactRelationship(wa_id, profileObj) {
    db.prepare('UPDATE contacts SET relationship_profile = ? WHERE wa_id = ?').run(JSON.stringify(profileObj), wa_id);
}

function getAllContacts() {
    return db.prepare('SELECT * FROM contacts').all();
}

// --- Messages ---
function insertMessage(wa_id, direction, bodyText, media_type, auto_replied = false) {
    const encryptedBody = encrypt(bodyText);
    const stmt = db.prepare(`
        INSERT INTO messages (wa_id, direction, body, media_type, auto_replied)
        VALUES (?, ?, ?, ?, ?)
    `);
    return stmt.run(wa_id, direction, encryptedBody, media_type, auto_replied ? 1 : 0);
}

function getRecentMessages(wa_id, limit = 20) {
    const msgs = db.prepare(`
        SELECT * FROM messages WHERE wa_id = ? ORDER BY timestamp DESC LIMIT ?
    `).all(wa_id, limit);
    return msgs.map(m => ({
        ...m,
        body: decrypt(m.body)
    })).reverse();
}

function flagMessageReplied(id) {
    db.prepare('UPDATE messages SET replied = 1 WHERE id = ?').run(id);
}

// --- AI Style Profiles ---
function insertStyleSample(message_body, contact_context) {
    const stmt = db.prepare(`
        INSERT INTO ai_style_samples (message_body, contact_context)
        VALUES (?, ?)
    `);
    stmt.run(encrypt(message_body), encrypt(contact_context));
}

function getUntrainedStyleSamples(limit = 50) {
    const samples = db.prepare(`
        SELECT * FROM ai_style_samples WHERE used_for_training = 0 LIMIT ?
    `).all(limit);
    return samples.map(s => ({
        ...s,
        message_body: decrypt(s.message_body),
        contact_context: decrypt(s.contact_context)
    }));
}

function markSamplesAsTrained(ids) {
    if(!ids || ids.length === 0) return;
    const stmt = db.prepare(`UPDATE ai_style_samples SET used_for_training = 1 WHERE id IN (${ids.map(() => '?').join(',')})`);
    stmt.run(...ids);
}

// --- Settings ---
function setSetting(key, value) {
    db.prepare(`
        INSERT INTO settings (key, value) VALUES (?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).run(key, value);
}

function getSetting(key) {
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
    return row ? row.value : null;
}

// --- Specific Entities (Reminders, Commitments, Mood) ---
function insertReminder(wa_id, title, remind_at) {
    db.prepare('INSERT INTO reminders (contact_wa_id, title, remind_at) VALUES (?, ?, ?)')
      .run(wa_id, encrypt(title), remind_at);
}

function getDueReminders() {
    const now = new Date().toISOString();
    const reminders = db.prepare(`SELECT * FROM reminders WHERE reminded = 0 AND (remind_at <= ? OR snoozed_until <= ?)`)
      .all(now, now);
    return reminders.map(r => ({ ...r, title: decrypt(r.title) }));
}

function markReminderDone(id) {
    db.prepare('UPDATE reminders SET reminded = 1 WHERE id = ?').run(id);
}

function insertMoodLog(wa_id, mood, score) {
    db.prepare('INSERT INTO contact_mood_log (wa_id, mood, mood_score) VALUES (?, ?, ?)')
      .run(wa_id, mood, score);
}

function insertCommitment(wa_id, text, made_by, due_at) {
    db.prepare('INSERT INTO commitments (wa_id, text, made_by, due_at) VALUES (?, ?, ?, ?)')
      .run(wa_id, encrypt(text), made_by, due_at);
}

// --- Audit ---
function logAudit(action, contact_id, meta) {
    db.prepare('INSERT INTO audit_log (action, contact_id, meta_json) VALUES (?, ?, ?)')
      .run(action, contact_id, encryptJSON(meta));
}

module.exports = {
    upsertContact, getContactByWaId, getContactByTopicId, updateContactTopic,
    updateContactPersonality, updateContactRelationship, getAllContacts,
    insertMessage, getRecentMessages, flagMessageReplied,
    insertStyleSample, getUntrainedStyleSamples, markSamplesAsTrained,
    setSetting, getSetting,
    insertReminder, getDueReminders, markReminderDone,
    insertMoodLog, insertCommitment,
    logAudit
};
