#!/bin/bash

echo "🚀 Starting Amrutam Backend..."

# Debug: Show environment variables
echo "🔍 Environment variables:"
env | grep -E "(DATABASE|REDIS|NODE|RENDER)" | sort

# Quick check for database variables
echo "🔍 Quick database check..."
if [ -n "$DATABASE_URL" ]; then
  echo "✅ DATABASE_URL found: ${DATABASE_URL:0:50}..."
elif [ -n "$DATABASE_HOST" ] && [ -n "$DATABASE_PASSWORD" ]; then
  export DATABASE_URL="postgresql://${DATABASE_USER}:${DATABASE_PASSWORD}@${DATABASE_HOST}:${DATABASE_PORT}/${DATABASE_NAME}"
  echo "🔧 Constructed DATABASE_URL from components"
else
  echo "⚠️  No database connection info found"
fi

# Start the application immediately
echo "🚀 Starting application immediately..."
echo "🔍 The app will handle database connection internally..."
exec node dist/index.js
