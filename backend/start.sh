#!/bin/bash

echo "🚀 Starting Amrutam Backend..."

# Debug: Show environment variables
echo "🔍 Environment variables:"
env | grep -E "(DATABASE|REDIS|NODE)" | sort

# Wait for environment variables to be available
echo "⏳ Waiting for DATABASE_URL to be available..."
while [ -z "$DATABASE_URL" ]; do
  echo "⏳ DATABASE_URL not set, waiting 5 seconds..."
  sleep 5
  # Re-export environment variables
  export $(env | grep -E "(DATABASE|REDIS|NODE)" | xargs)
done

echo "✅ DATABASE_URL is available: ${DATABASE_URL:0:50}..."

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
until npx prisma db execute --stdin <<< "SELECT 1" > /dev/null 2>&1; do
  echo "⏳ Database not ready, waiting 5 seconds..."
  sleep 5
done

echo "✅ Database is ready!"

# Start the application
echo "🚀 Starting application..."
exec npm start
