#!/bin/bash

echo "🚀 Starting Amrutam Backend..."

# Debug: Show environment variables
echo "🔍 Environment variables:"
env | grep -E "(DATABASE|REDIS|NODE|RENDER)" | sort

# Wait for environment variables to be available
echo "⏳ Waiting for DATABASE_URL to be available..."
max_wait=600  # 10 minutes max wait
wait_time=0

while [ -z "$DATABASE_URL" ] && [ $wait_time -lt $max_wait ]; do
  echo "⏳ DATABASE_URL not set, waiting 15 seconds... (${wait_time}s/${max_wait}s)"
  sleep 15
  wait_time=$((wait_time + 15))
  
  # Check if we're on Render and try to get environment variables
  if [ -n "$RENDER" ]; then
    echo "🔍 Running on Render, checking for database service..."
    echo "🔍 Available database-related variables:"
    env | grep -E "(DATABASE|RENDER)" | sort
    
    # Try to get database connection info from Render
    if [ -n "$DATABASE_HOST" ] && [ -n "$DATABASE_PASSWORD" ]; then
      export DATABASE_URL="postgresql://${DATABASE_USER}:${DATABASE_PASSWORD}@${DATABASE_HOST}:${DATABASE_PORT}/${DATABASE_NAME}"
      echo "🔧 Constructed DATABASE_URL from individual components"
      break
    fi
    
    # Check if we have the database name from environment
    if [ -n "$RENDER_DATABASE_NAME" ]; then
      echo "🔍 Database service name: $RENDER_DATABASE_NAME"
    fi
  fi
done

if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL still not available after ${max_wait} seconds"
  echo "🔍 Final environment check:"
  env | grep -E "(DATABASE|REDIS|NODE|RENDER)" | sort
  echo "🔍 Attempting to start anyway to see what happens..."
  # Don't exit, try to start the application
fi

if [ -n "$DATABASE_URL" ]; then
  echo "✅ DATABASE_URL is available: ${DATABASE_URL:0:50}..."

  # Wait for database to be ready
  echo "⏳ Waiting for database to be ready..."
  until npx prisma db execute --stdin <<< "SELECT 1" > /dev/null 2>&1; do
    echo "⏳ Database not ready, waiting 5 seconds..."
    sleep 5
  done

  echo "✅ Database is ready!"
else
  echo "⚠️  No DATABASE_URL available, attempting to start without database connection..."
fi

# Start the application
echo "🚀 Starting application..."
exec node dist/index.js
