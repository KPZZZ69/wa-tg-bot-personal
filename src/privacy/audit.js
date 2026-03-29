function displayAuditLogs() {
    const { db: sqliteObj } = require('../db/index');
    const logs = sqliteObj.prepare('SELECT * FROM audit_log ORDER BY timestamp DESC LIMIT 50').all();
    const { decryptJSON } = require('../db/encryption');
    return logs.map(l => ({
        ...l,
        meta: decryptJSON(l.meta_json)
    }));
}

module.exports = { displayAuditLogs };
