FROM node:20-slim

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Install dependencies
RUN apt-get update && apt-get install -y \
    chromium \
    ffmpeg \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Create a non-root user
RUN useradd -m -u 1000 botuser
WORKDIR /home/botuser/app

# Set env for Hugging Face
ENV HOME=/home/botuser \
    PATH=/home/botuser/.local/bin:$PATH \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    PORT=7860

# Copy package files first for caching
COPY --chown=botuser package*.json ./
RUN npm ci --only=production

# Copy application source
COPY --chown=botuser . .

# Create persistent directories with correct permissions
RUN mkdir -p /home/botuser/app/data /home/botuser/app/logs && \
    chown -R botuser:botuser /home/botuser/app

USER botuser

EXPOSE 7860

# Use the PORT environment variable for the health check/server
CMD ["npm", "start"]
