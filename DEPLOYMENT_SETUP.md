# 🚀 Live Deployment Setup Guide

## ✅ Current Status

### Frontend (Vercel)
- **URL**: https://frontend-f87t6piba-adityasri04s-projects.vercel.app
- **Status**: ✅ Deployed and Live
- **Platform**: Vercel

### Backend (Render)
- **Status**: ⏳ Ready for Deployment
- **Platform**: Render
- **Repository**: https://github.com/adityasri04/amrutam

## 🔧 Backend Deployment on Render

### Step 1: Connect GitHub Repository
1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" → "Web Service"
3. Connect your GitHub account
4. Select the `amrutam` repository

### Step 2: Configure Web Service
- **Name**: `amrutam-backend`
- **Root Directory**: `backend`
- **Runtime**: `Node`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

### Step 3: Environment Variables
The following environment variables will be automatically configured:
- `NODE_ENV`: production
- `PORT`: 8000
- `DATABASE_URL`: Auto-configured from PostgreSQL service
- `REDIS_URL`: Auto-configured from Redis service
- `JWT_SECRET`: Auto-generated
- `JWT_REFRESH_SECRET`: Auto-generated
- `FRONTEND_URL`: https://frontend-f87t6piba-adityasri04s-projects.vercel.app

### Step 4: Database Setup
- **PostgreSQL**: Auto-created with `amrutam-postgres` name
- **Redis**: Auto-created with `amrutam-redis` name

## 🌐 Final Live URLs

Once backend is deployed:
- **Frontend**: https://frontend-f87t6piba-adityasri04s-projects.vercel.app
- **Backend API**: https://amrutam-backend.onrender.com
- **API Documentation**: https://amrutam-backend.onrender.com/api-docs

## 🔄 Auto-Deployment
Both services are configured for auto-deployment:
- Push to `main` branch triggers automatic deployment
- Health checks ensure service availability
- Rollback available if needed

## 📱 Features Available in Live Deployment

### User Management
- ✅ User registration and login
- ✅ Patient and doctor authentication
- ✅ Profile management

### Doctor Management
- ✅ Doctor listings and profiles
- ✅ Specialization filtering
- ✅ Availability management

### Appointment System
- ✅ Slot booking and management
- ✅ Real-time availability
- ✅ Appointment history

### Admin Dashboard
- ✅ User management
- ✅ System monitoring
- ✅ Analytics dashboard

## 🚨 Important Notes
1. **Database**: PostgreSQL with Prisma ORM
2. **Caching**: Redis for rate limiting and sessions
3. **Authentication**: JWT-based with refresh tokens
4. **File Uploads**: Local storage (configurable for cloud storage)
5. **Rate Limiting**: Redis-based rate limiting enabled

## 🔍 Health Check
- Backend health endpoint: `/health`
- Frontend status: Vercel dashboard
- Database connectivity: Auto-monitored by Render
