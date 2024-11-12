FROM thanhtunguet/node-with-selenium:latest

WORKDIR /app
COPY dist/ ./dist/
COPY package.json yarn.lock ./
RUN yarn install
CMD ["yarn", "start:prod"]
