FROM node:18-alpine AS production

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

# Install ChromeDriver
RUN curl -Lo /usr/local/bin/chromedriver "https://edgedl.me.gvt1.com/edgedl/chrome/chrome-for-testing/115.0.5790.170/linux64/chromedriver-linux64.zip" && \
    unzip /usr/local/bin/chromedriver && \
    chmod +x /usr/local/bin/chromedriver
