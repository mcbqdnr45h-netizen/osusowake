FROM node:24-slim AS base

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    openssl \
    python3 \
    make \
    g++ \
  && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@10.26.1 --activate

WORKDIR /repo

COPY . .

ENV CI=true
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @workspace/api-server build

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

WORKDIR /repo/artifacts/api-server
CMD ["node", "dist/index.cjs"]
