# Fly.io Deployment Guide

1. Install `flyctl` and run `fly auth login`.
2. In the root directory, run `fly launch` but **do not** let it deploy yet.
3. It will generate a `fly.toml` (which we provided).
4. Create a volume for SQLite and session data:
   `fly volumes create wa_session_data --region sin --size 1`
5. Set your secrets:
   `fly secrets set TELEGRAM_BOT_TOKEN="x" TELEGRAM_GROUP_ID="y" ...`
6. Deploy the app:
   `fly deploy`
