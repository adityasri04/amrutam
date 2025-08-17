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
    # Create a symlink to ensure the shared package is accessible
    if [ ! -L "node_modules/@amrutam/shared" ]; then
        echo "🔗 Creating symlink to shared package..."
        mkdir -p node_modules/@amrutam
        ln -sf ../../shared node_modules/@amrutam/shared
    fi
else
    echo "❌ Shared package dist not found"
    exit 1
fi

echo "🏗️ Building TypeScript..."
npm run build
echo "✅ TypeScript build completed"

echo "🎉 Backend build completed successfully!"
