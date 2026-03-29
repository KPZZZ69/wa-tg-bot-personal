const express = require('express');
const logger = require('./logger');

const app = express();
const PORT = process.env.PORT || process.env.HEALTH_PORT || 7860;

let healthState = {
    status: 'starting',
    wa_connected: false,
    started_at: Date.now(),
    messages_today: 0
};

app.get('/health', (req, res) => {
    res.json({
        ...healthState,
        uptime_seconds: Math.floor((Date.now() - healthState.started_at) / 1000)
    });
});

function updateHealth(key, value) {
    healthState[key] = value;
}

function incrementMessages() {
    healthState.messages_today++;
}

function startHealthServer() {
    app.listen(PORT, () => {
        logger.info(`Health check server listening on port ${PORT}`);
        healthState.status = 'running';
    });
}

module.exports = { startHealthServer, updateHealth, incrementMessages };
