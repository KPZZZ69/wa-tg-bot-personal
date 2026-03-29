# 🚀 Deploying to Hugging Face Spaces (16GB RAM)

Since Render's free tier has too little RAM for a WhatsApp bot, we are moving to **Hugging Face Spaces**, which provides **16GB of RAM** for free.

### 1. Create a New Space
1. Login to [huggingface.co](https://huggingface.co).
2. Click **New** > **Space**.
3. **Space Name**: `wa-tg-bot` (or any name you like).
4. **SDK**: Select **Docker**.
5. **Docker Template**: Select **Blank**.
6. **Visibility**: Select **Public** (or Private if you prefer, but Public is easier to test).
7. Click **Create Space**.

### 2. Connect Your GitHub Repository
1. In your new Space, go to **Settings**.
2. Scroll down to **Connected Repository**.
3. Link your GitHub repo: `KPZZZ69/wa-tg-bot-personal`.
4. Hugging Face will automatically start building the Docker image.

### 3. Add Environment Variables (Secrets)
1. In your Space, go to **Settings** > **Variables and secrets**.
2. Click **New secret** for each of these:
   - `TELEGRAM_BOT_TOKEN`: Your bot token.
   - `TELEGRAM_GROUP_ID`: Your group ID.
   - `GEMINI_API_KEY`: Your Gemini API key.
   - `PUPPETEER_EXECUTABLE_PATH`: `/usr/bin/chromium`
   - `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD`: `true`

### 4. Monitor Logs & Scan QR
1. Click the **Logs** tab in your Space.
2. Wait for the build to finish (it might take 2-3 minutes).
3. Once the bot starts, the **WhatsApp QR Code** will appear in the logs.
4. Scan it with your phone!

---
**Note:** Hugging Face Spaces will "sleep" after 48 hours of inactivity. To wake it up, just visit the Space URL.
