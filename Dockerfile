FROM node:20-alpine AS builder

RUN apk add --no-cache python3 make g++

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine

WORKDIR /usr/src/app

ENV NODE_ENV=production
ENV DATA_DIR=/app/data

RUN mkdir -p /app/data && chmod 777 /app/data

COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/server.cjs"]
