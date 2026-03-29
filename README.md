# WhatsApp ↔ Telegram AI Mirror Bot

A production-ready Node.js application that bridges WhatsApp Web and Telegram, allowing you to manage all WhatsApp conversations through a Telegram Forum Supergroup. Includes powerful generative AI auto-responses, deep conversation memory, schedule tracking, and productivity digests.

## Features
- **Forum-Based Routing**: Each WhatsApp contact gets a dedicated Telegram Topic.
- **AI Auto-Replies**: Learns your writing style and responds dynamically.
- **Vector Memory**: Context-aware AI responses based on historical chats via local Vectra DB.
- **Smart Reminders**: Extracts dates/times from messages and sends schedule alerts.
- **AES-256 Encryption**: Encrypts message bodies in local SQLite storage.
- **Mood Detection**: Tracks contact frustration and flags urgent messages.

## Quick-Start Checklist

1. **Clone & Install**: Run `npm install`
2. **Environment Variables**: Copy `.env.example` to `.env`. Add your API keys, `DB_ENCRYPTION_KEY` (must be 32 chars), and set up an empty Telegram group (enable Topics).
3. **Start Redis**: Essential for timer engine and scheduling. Run `docker-compose up -d redis`.
4. **Boot**: Run `node src/index.js`
5. **Connect**: Check the console or your Telegram DM to scan the WhatsApp QR code. Once scanned, you're live!

## Build/Test Order Recommendation

1. Send a regular test message from an alt WhatsApp number. Verify it appears in a new Telegram Topic.
2. Reply from that Telegram Topic. Verify it reaches the WhatsApp chat.
3. Wait 60 seconds without replying to trigger the Auto-Reply.
4. Test the slash commands (e.g., `/status`, `/help`, `/style`) inside Telegram.

## Known Limitations & Risks

> **⚠️ WARNING:** Using `whatsapp-web.js` mimics a physical WhatsApp Web session. Aggressive use or massive broadcasting can result in WhatsApp banning the linked number. It is highly recommended to use a secondary phone number, NOT your primary personal number.

- Multi-device support can occasionally desync. If the bot stops forwarding, use `/reconnect` in Telegram or restart the server.
- Media handling over 16MB may timeout via Puppeteer.

## V3 Roadmap
- Multi-user dashboard: Allowing multiple phone numbers linked to different Telegram groups.
- End-to-end Whisper voice note sending from Telegram.
- Advanced Contact grouping and priority tiers.
