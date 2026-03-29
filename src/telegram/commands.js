const logger = require('../utils/logger');
const db = require('../db/queries');

function registerCommands(bot) {
    if (!bot) return;

    bot.command('start', (ctx) => {
        ctx.reply('👋 Welcome to WA ↔ TG Mirror Bot!\nUse /help to see all commands.');
    });

    bot.command('status', (ctx) => {
        // Safe check without crashing
        let uptime = 0, waConnected = false, messagesToday = 0;
        try {
            const check = require('../utils/healthCheck');
            if(check && check.healthState) {
                uptime = Math.floor((Date.now() - check.healthState.started_at)/1000);
                waConnected = check.healthState.wa_connected;
                messagesToday = check.healthState.messages_today;
            }
        } catch(e) {}
        ctx.reply(`📊 Bot Status:\n- Uptime: ${uptime}s\n- WA Connected: ${waConnected}\n- Messages Processed Today: ${messagesToday}`);
    });

    bot.command('autoreply', (ctx) => {
        const text = ctx.message.text.split(' ');
        if (text[1] === 'on') {
            db.setSetting('GLOBAL_AUTOREPLY', 'true');
            ctx.reply('✅ Global auto-reply ENABLED.');
        } else if (text[1] === 'off') {
            db.setSetting('GLOBAL_AUTOREPLY', 'false');
            ctx.reply('❌ Global auto-reply DISABLED.');
        } else {
            ctx.reply('Usage: /autoreply on|off');
        }
    });

    bot.command('style', (ctx) => {
        const profile = db.getSetting('ai_style_profile');
        if (profile) {
            ctx.reply(`🎨 Current AI Style Profile:\n\`\`\`json\n${profile}\n\`\`\``, { parse_mode: 'Markdown' });
        } else {
            ctx.reply('No style profile generated yet. Keep sending manual replies to harvest data.');
        }
    });

    bot.command('help', (ctx) => {
        ctx.reply(`
📚 *Available Commands:*
/start - Welcome
/status - System status
/autoreply on|off - Toggle auto-reply
/style - View learned AI profile
/stats - View messages stats
/dnd start HH:MM end HH:MM - Set do not disturb mode
/schedule [contact] [time] [msg] - Schedule message
        `, { parse_mode: 'Markdown' });
    });

    bot.command('reconnect', async (ctx) => {
        ctx.reply('Forcing WhatsApp reconnection...');
        try {
            const { waClient } = require('../whatsapp/client');
            await waClient.destroy();
            await waClient.initialize();
        } catch (e) {
            ctx.reply(`Error reconnecting: ${e.message}`);
        }
    });
}

module.exports = { registerCommands };
