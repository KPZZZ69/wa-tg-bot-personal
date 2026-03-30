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
RUN useradd -m -u 1001 botuser
WORKDIR /home/botuser/app

# Set application paths
ENV HOME=/home/botuser \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    PORT=3000

# Copy package files first for caching
COPY --chown=botuser package*.json ./
RUN npm ci --only=production

# Copy application source
COPY --chown=botuser . .

# Create persistent directories with correct permissions
RUN mkdir -p /home/botuser/app/data /home/botuser/app/logs && \
    chown -R botuser:botuser /home/botuser/app

USER botuser

EXPOSE 3000

# Use the PORT environment variable for the health check/server
CMD ["npm", "start"]
