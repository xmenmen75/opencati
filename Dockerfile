# -------- Build stage --------
FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache libc6-compat openssl

# Install deps
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN \
  if [ -f pnpm-lock.yaml ]; then npm i -g pnpm && pnpm i --frozen-lockfile; \
  elif [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  else npm ci; \
  fi

# Prisma generate
COPY prisma ./prisma
RUN npx prisma generate

# Copy the rest
COPY . .

# Build Next.js app
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Compile cron to JS
RUN npm run build:cron

# -------- Runtime stage --------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN apk add --no-cache libc6-compat openssl

# Install only production deps for runtime (cron + web need node_modules)
COPY --from=builder /app/package.json /app/package-lock.json* /app/pnpm-lock.yaml* /app/yarn.lock* ./
RUN \
  if [ -f pnpm-lock.yaml ]; then npm i -g pnpm && pnpm i --frozen-lockfile --prod; \
  elif [ -f yarn.lock ]; then yarn --frozen-lockfile --production; \
  else npm ci --omit=dev; \
  fi

# Prisma artifacts needed by @prisma/client
COPY --from=builder /app/node_modules/@prisma /app/node_modules/@prisma
COPY --from=builder /app/node_modules/.prisma /app/node_modules/.prisma

# Next standalone server and assets
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/static ./.next/static

# Compiled cron JS
COPY --from=builder /app/dist ./dist

# Prisma schema & migrations for migrate deploy (if you run them in entrypoint)
COPY --from=builder /app/prisma ./prisma

# Entrypoint (runs migrations/seed then starts web server)
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["/entrypoint.sh"]
CMD ["node", "server.js"]