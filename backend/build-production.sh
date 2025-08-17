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

echo "🏗️ Building TypeScript..."
npm run build
echo "✅ TypeScript build completed"

echo "🎉 Backend build completed successfully!"
