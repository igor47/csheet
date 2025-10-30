# syntax=docker/dockerfile:1.7

ARG BUN_VERSION=1.3.1
ARG DBMATE_VERSION=2.28.0

FROM ghcr.io/amacneil/dbmate:${DBMATE_VERSION} AS dbmate


FROM oven/bun:${BUN_VERSION} AS deps
WORKDIR /app

COPY bun.lock package.json tsconfig.json ./
RUN bun install --ci --production

FROM oven/bun:${BUN_VERSION} AS runtime
WORKDIR /app

# Install jq for config parsing
RUN apt-get update && apt-get install -y jq && rm -rf /var/lib/apt/lists/*

# Pull in just the dbmate binary (multi-arch friendly)
COPY --from=dbmate /usr/local/bin/dbmate /usr/local/bin/dbmate

# Copy migration runner script
COPY bin/run-migrations.sh /usr/local/bin/run-migrations.sh
RUN chmod +x /usr/local/bin/run-migrations.sh

# pull node modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application files first
COPY . .

# Then overlay the generated htmx files from deps stage (after postinstall)
COPY --from=deps /app/static/htmx.min.js /app/static/htmx-ext-sse.js ./static/

ENV NODE_ENV=production \
    PORT=3000

EXPOSE 3000

CMD ["bun", "run", "main.ts"]
