#!/bin/bash

echo "🚀 Starting Amrutam Backend..."

# Debug: Show environment variables
echo "🔍 Environment variables:"
env | grep -E "(DATABASE|REDIS|NODE)" | sort

# Wait for environment variables to be available
echo "⏳ Waiting for DATABASE_URL to be available..."
max_wait=300  # 5 minutes max wait
wait_time=0

while [ -z "$DATABASE_URL" ] && [ $wait_time -lt $max_wait ]; do
  echo "⏳ DATABASE_URL not set, waiting 10 seconds... (${wait_time}s/${max_wait}s)"
  sleep 10
  wait_time=$((wait_time + 10))
  
  # Check if we're on Render and try to get environment variables
  if [ -n "$RENDER" ]; then
    echo "🔍 Running on Render, checking for database service..."
    # Try to get database connection info from Render
    if [ -n "$DATABASE_HOST" ] && [ -n "$DATABASE_PASSWORD" ]; then
      export DATABASE_URL="postgresql://${DATABASE_USER}:${DATABASE_PASSWORD}@${DATABASE_HOST}:${DATABASE_PORT}/${DATABASE_NAME}"
      echo "🔧 Constructed DATABASE_URL from individual components"
      break
    fi
  fi
done

if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL still not available after ${max_wait} seconds"
  echo "🔍 Final environment check:"
  env | grep -E "(DATABASE|REDIS|NODE|RENDER)" | sort
  exit 1
fi

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
exec node dist/index.js
