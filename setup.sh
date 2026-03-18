#!/bin/bash

# setup.sh - Initial database setup script for the Docker deployment

echo "🚀 Starting database setup for OOPS Tracker..."

# 1. Ensure the database schema is created
echo "📦 Creating database tables..."
docker compose exec app npx prisma db push

# 2. Seed the database with initial accounts and data
echo "🌱 Seeding initial admin and reporter accounts..."
docker compose exec app npm run db:seed

echo ""
echo "✨ Setup complete! You can now log in at http://localhost:3000"
echo "--------------------------------------------------------"
echo "🔐 Default Credentials:"
echo "   Admin:    admin@oops.local    / admin123"
echo "   Reporter: reporter@oops.local / reporter123"
echo "--------------------------------------------------------"
