#!/bin/bash

echo "🚀 Amrutam Backend Deployment Script"
echo "====================================="

# Check if we're in the right directory
if [ ! -f "render.yaml" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo "✅ Project structure verified"
echo ""

# Check if backend builds successfully
echo "🔨 Building backend..."
cd backend
if npm run build; then
    echo "✅ Backend builds successfully"
else
    echo "❌ Backend build failed. Please fix the issues first."
    exit 1
fi
cd ..

echo ""
echo "📋 Next Steps for Live Deployment:"
echo "=================================="
echo ""
echo "1. 🌐 Go to Render Dashboard: https://dashboard.render.com/"
echo "2. ➕ Click 'New +' → 'Web Service'"
echo "3. 🔗 Connect your GitHub account"
echo "4. 📁 Select the 'amrutam' repository"
echo "5. ⚙️  Configure the service:"
echo "   - Name: amrutam-backend"
echo "   - Root Directory: backend"
echo "   - Runtime: Node"
echo "   - Build Command: npm install && npm run build"
echo "   - Start Command: npm start"
echo ""
echo "6. 🔑 Environment variables will be auto-configured from render.yaml"
echo "7. 🗄️  PostgreSQL and Redis will be auto-created"
echo "8. 🚀 Deploy!"
echo ""
echo "📱 Your frontend is already live at:"
echo "   https://frontend-f87t6piba-adityasri04s-projects.vercel.app"
echo ""
echo "🔗 Once backend is deployed, your API will be available at:"
echo "   https://amrutam-backend.onrender.com"
echo ""
echo "📚 Full deployment guide: DEPLOYMENT_SETUP.md"
