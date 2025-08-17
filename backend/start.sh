#!/bin/bash

echo "🚀 Starting Amrutam Backend..."

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
