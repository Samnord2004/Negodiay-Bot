# ─── Stage 1: сборка ────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Копируем только манифесты — слой кешируется если они не менялись
COPY package*.json ./

# Устанавливаем ВСЕ зависимости (нужны devDeps: vite, esbuild, typescript)
RUN npm ci

# Копируем исходники
COPY . .

# Собираем: vite build (фронт) + esbuild (сервер) → dist/
RUN npm run build

# ─── Stage 2: рантайм ────────────────────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV DATA_DIR=/app/data

RUN mkdir -p /app/data && chmod 777 /app/data

COPY package*.json ./

# Только продакшн-зависимости (express, @google/genai, dotenv, …)
RUN npm ci --omit=dev

# Копируем собранный dist/ из builder-стейджа
COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/server.cjs"]
