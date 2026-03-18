#!/bin/sh

# docker-entrypoint.sh - Automated database initialization

echo "🚀 Booting OOPS Tracker..."

# 1. Ensure the database schema is up to date
echo "📦 Running Prisma DB Push..."
npx prisma db push --accept-data-loss

# 2. Seed the database (Our seed script uses upsert so it's safe to run multiple times)
echo "🌱 Seeding initial data..."
npm run db:seed

# 3. Start the application
echo "✨ Starting the application..."
exec "$@"
