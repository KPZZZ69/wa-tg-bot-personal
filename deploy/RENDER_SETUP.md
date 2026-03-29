# 🚀 Render Deployment Guide

Follow these steps to deploy your WhatsApp-Telegram Bridge to Render.

### 1. Account Setup
* Create a [Render](https://render.com) account.
* Connect your GitHub repository.

### 2. Deploy using Blueprint (Easiest)
1. Go to **Blueprints** → **New Blueprint**.
2. Select this repository.
3. Render will use the `render.yaml` file to configure everything.
4. It will prompt you for your `TELEGRAM_BOT_TOKEN`, `TELEGRAM_GROUP_ID`, and `GEMINI_API_KEY`.
5. **Note:** Persistent disks require a "Starter" plan ($7/mo). If you use the "Free" plan, you may need to re-scan the QR code if the service restarts.

### 3. Manual Web Service Setup (Alternative)
1. Create a **Web Service**.
2. Environment: **Docker**.
3. Add the following Environment Variables in **Advanced**:
   * `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD`: `true`
   * `PUPPETEER_EXECUTABLE_PATH`: `/usr/bin/chromium`
   * `DB_PATH`: `/app/data/bot.db`
   * `HEALTH_PORT`: `3000`
4. Mount a Disk at `/app/data` (Optional but highly recommended for persistent login).

### 4. Verification
Once deployed, check the **Render Logs**. If it's your first time, the QR code will be sent to your Telegram group (and logged in the console). Scan it to activate!
