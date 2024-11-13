FROM node:18-alpine

# Install dependencies
RUN apk update && apk add --no-cache \
    chromium \
    harfbuzz \
    freetype \
    freetype-dev \
    ttf-freefont \
    font-noto \
    nss \
    udev \
    curl

# Set environment variables to use Chrome with Selenium
ENV CHROME_BIN=/usr/bin/chromium-browser
ENV CHROME_PATH=/usr/lib/chromium/
ENV PATH="/usr/lib/chromium/:${PATH}"
