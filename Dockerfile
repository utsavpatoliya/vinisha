# ============================================================
# Order Management System - Dockerfile
# Includes all Chromium/Puppeteer dependencies needed to
# generate PDF invoices correctly on Render (or any Linux host).
# ============================================================

FROM node:20-slim

# Install Chromium and all libraries Puppeteer's bundled Chromium needs
# to run headless on a minimal Debian/Ubuntu Linux image.
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    fonts-liberation \
    fonts-noto \
    fonts-noto-color-emoji \
    ca-certificates \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Tell Puppeteer to use the system-installed Chromium instead of
# downloading its own copy (faster, smaller image, avoids network
# restrictions during `npm install` on some hosts).
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# Install dependencies first (better Docker layer caching)
COPY package*.json ./
RUN npm install --omit=dev

# Copy the rest of the application
COPY . .

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "app.js"]
