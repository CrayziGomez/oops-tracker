#!/bin/sh
set -e

# docker-entrypoint.sh - Runs as root to fix volume permissions, then drops to nextjs user

echo "🚀 Booting OOPS Tracker..."

# Fix ownership of mounted volumes (Docker named volumes are owned by root on first mount)
mkdir -p /app/data /app/public/uploads
chown -R nextjs:nodejs /app/data /app/public/uploads

# 1. Ensure the database schema is up to date (run as nextjs user)
echo "📦 Running Prisma DB Push..."
if [ "${PRISMA_ACCEPT_DATA_LOSS}" = "true" ]; then
  su-exec nextjs sh -c 'DATABASE_URL=file:/app/data/dev.db npx prisma db push --accept-data-loss'
else
  su-exec nextjs sh -c 'DATABASE_URL=file:/app/data/dev.db npx prisma db push'
fi

# 2. Seed the database (upsert-safe, run as nextjs user)
echo "🌱 Seeding initial data..."
su-exec nextjs sh -c 'DATABASE_URL=file:/app/data/dev.db npm run db:seed'

# 3. Start the application as nextjs user
echo "✨ Starting the application..."
exec su-exec nextjs "$@"
