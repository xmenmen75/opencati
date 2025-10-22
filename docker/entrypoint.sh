#!/usr/bin/env sh
set -e

echo "→ Prisma migrate deploy"
npx prisma migrate deploy

if [ "$RUN_SEED" = "true" ]; then
  echo "→ Prisma seed (npm run db:seed)"
  npm run db:seed
else
  echo "→ Skipping seed (set RUN_SEED=true to enable)"
fi

echo "→ Starting app: $@"
exec "$@"
