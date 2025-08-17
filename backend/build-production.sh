#!/bin/bash

echo "🚀 Starting Amrutam Backend Production Build Process..."

# Exit on any error
set -e

echo "📦 Building shared package..."
cd ../shared
npm install
npm run build
echo "✅ Shared package built successfully"

echo "🔧 Building backend..."
cd ../backend
npm install
echo "✅ Dependencies installed"

echo "🗄️ Generating Prisma client..."
npx prisma generate
echo "✅ Prisma client generated"

echo "🔗 Linking shared package..."
# Ensure the shared package is properly linked
if [ -d "../shared/dist" ]; then
    echo "✅ Shared package dist found"
    # Copy the shared package directly to ensure it's accessible
    echo "📋 Copying shared package to backend node_modules..."
    mkdir -p node_modules/@amrutam
    cp -r ../shared node_modules/@amrutam/shared
    echo "✅ Shared package copied successfully"
else
    echo "❌ Shared package dist not found"
    exit 1
fi

echo "🏗️ Building TypeScript..."
npm run build
echo "✅ TypeScript build completed"

echo "🎉 Backend build completed successfully!"
