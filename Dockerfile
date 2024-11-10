FROM node:18-alpine AS production
WORKDIR /app
COPY dist/ ./dist/
COPY package.json yarn.lock ./
RUN yarn install
CMD ["yarn", "start:prod"]
