FROM node:18-alpine

WORKDIR /app
COPY dist/ dvhc/ ./
COPY package.json yarn.lock ./
RUN yarn install
RUN npx webdriver-manager update --chrome
CMD ["yarn", "start:prod"]
