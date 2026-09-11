FROM node:20-slim AS base
RUN apk add --no-cache openssl libc6-compat
RUN npm install -g turbo pnpm 

FROM base AS pruner
WORKDIR /app
COPY . .
RUN turbo prune @notify/demo --docker

FROM base AS installer
WORKDIR /app
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile

FROM installer AS builder
WORKDIR /app
COPY --from=pruner /app/out/full/ .
RUN pnpm turbo build --filter=@notify/demo

FROM base AS runner 
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/demo ./apps/demo

EXPOSE 4000
CMD ["node", "apps/demo/dist/index.js"]
