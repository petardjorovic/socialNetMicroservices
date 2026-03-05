# BUILD STAGE
FROM node:22-bookworm-slim AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build
RUN npm prune --omit=dev

# PRODUCTION STAGE
FROM node:22-bookworm-slim AS production

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

EXPOSE 3003

CMD [ "node", "dist/server.js" ]