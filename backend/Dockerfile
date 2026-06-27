FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .
RUN npm run build
RUN mkdir -p dist/db && cp src/db/schema.sql dist/db/schema.sql
RUN npm prune --production

EXPOSE 3001

CMD ["node", "dist/index.js"]
