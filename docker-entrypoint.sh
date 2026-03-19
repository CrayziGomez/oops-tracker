#!/bin/sh

# docker-entrypoint.sh - Automated database initialization

echo "🚀 Booting OOPS Tracker..."

# Ensure data directory exists
mkdir -p /app/data

# 1. Ensure the database schema is up to date
echo "📦 Running Prisma DB Push..."
DATABASE_URL=file:/app/data/dev.db npx prisma db push --accept-data-loss

# 2. Seed the database (Our seed script uses upsert so it's safe to run multiple times)
echo "🌱 Seeding initial data..."
DATABASE_URL=file:/app/data/dev.db npm run db:seed

# 3. Start the application
echo "✨ Starting the application..."
exec "$@"
