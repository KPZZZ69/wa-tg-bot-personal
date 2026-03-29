# Railway Deployment Guide

1. Fork or push this repository to your GitHub.
2. Sign in to [Railway](https://railway.app/).
3. Click **New Project** → **Deploy from GitHub repo**.
4. Select your repository.
5. In the **Variables** tab of the newly created service, add all environment variables from `.env.example`.
6. Add a Redis database plugin to the project, and ensure the `REDIS_URL` variable connects your app to it.
7. Railway will automatically build the `Dockerfile` and start the bot.
8. Check the logs to scan the WhatsApp QR code.
