FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .
RUN npm run build && cp src/db/schema.sql dist/db/schema.sql && npm prune --production

EXPOSE 3001

CMD ["node", "dist/index.js"]
