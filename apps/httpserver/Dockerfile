FROM node:20-alpine AS base
RUN apk add --no-cache openssl libc6-compat
RUN npm install -g turbo pnpm 

FROM base AS pruner
WORKDIR /app
COPY . .
RUN turbo prune @notify/httpserver --docker

FROM base AS installer
WORKDIR /app
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile

FROM installer AS builder
WORKDIR /app
COPY --from=pruner /app/out/full/ .
RUN pnpm --filter @notify/db exec prisma generate
RUN pnpm turbo build --filter=@notify/httpserver

FROM base AS runner 
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/httpserver ./apps/httpserver

EXPOSE 3001
CMD ["node", "apps/httpserver/dist/index.js"]