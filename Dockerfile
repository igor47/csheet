# syntax=docker/dockerfile:1.7

ARG BUN_VERSION=1.3.0

FROM oven/bun:${BUN_VERSION} AS deps
WORKDIR /app

COPY bun.lock package.json tsconfig.json ./
RUN bun install --ci --production

FROM oven/bun:${BUN_VERSION} AS runtime
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000

COPY --from=deps /app/node_modules ./node_modules
COPY . .

EXPOSE 3000

CMD ["bun", "run", "main.ts"]
