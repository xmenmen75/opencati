# -------- Build stage --------
FROM node:20-alpine AS builder
WORKDIR /app

# Recommended for Prisma on Alpine
RUN apk add --no-cache libc6-compat openssl

# Install deps with your lockfile
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN \
  if [ -f pnpm-lock.yaml ]; then npm i -g pnpm && pnpm i --frozen-lockfile; \
  elif [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  else npm ci; \
  fi

# Copy prisma first (better cache) then generate client
COPY prisma ./prisma
RUN npx prisma generate

# Copy the rest and build Next.js
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# -------- Runtime stage --------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Prisma engines + openssl
RUN apk add --no-cache libc6-compat openssl

# We’ll use tsx at runtime for seed/cron (since your scripts use tsx)
RUN npm i -g tsx

# Copy Next standalone server and assets
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/static ./.next/static

# Prisma engines produced by generate
COPY --from=builder /app/node_modules/.prisma /app/node_modules/.prisma

# Prisma schema & migrations for migrate deploy
COPY --from=builder /app/prisma ./prisma

# Copy your scripts folder so cron.ts is available in runtime
COPY --from=builder /app/scripts ./scripts

# Entrypoint runs migrate (and optional seed) then starts server
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["/entrypoint.sh"]
CMD ["node", "server.js"]
