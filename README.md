# Amrutam Ayurvedic Doctor Consultation Platform

A full-stack platform for booking Ayurvedic doctor consultations with advanced features for scalability.

## 🚀 Features

- **Doctor Discovery**: Search by specialization, mode (online/in-person), availability
- **Smart Booking**: 5-minute slot locking with OTP confirmation
- **Appointment Management**: View, reschedule, and cancel appointments
- **Admin Dashboard**: Doctor and admin management interfaces
- **Scalable Architecture**: Built for 5,000+ appointments/day

## 🏗️ Architecture

- **Frontend**: Next.js 14 with TypeScript, Tailwind CSS
- **Backend**: Node.js with Express, TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with refresh tokens
- **Real-time**: WebSocket for slot updates
- **Rate Limiting**: Redis-based rate limiting
- **Deployment**: Docker + GitHub Actions CI/CD

## 📁 Project Structure

```
amrutam-platform/
├── frontend/          # Next.js frontend
├── backend/           # Express backend
├── shared/            # Shared types and utilities
├── docker-compose.yml # Development environment
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis (optional, for rate limiting)

### Development Setup

1. **Clone and install dependencies**
   ```bash
   git clone <repository>
   cd amrutam-platform
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   # Edit .env files with your database credentials
   ```

3. **Database Setup**
   ```bash
   npm run db:generate
   npm run db:migrate
   npm run db:seed
   ```

4. **Start Development Servers**
   ```bash
   npm run dev
   ```

- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/api-docs

## 🔧 Available Scripts

- `npm run dev` - Start both frontend and backend
- `npm run build` - Build all workspaces
- `npm run test` - Run tests across all workspaces
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with sample data

## 🗄️ Database Schema

### Core Entities
- **Users**: Patients and doctors
- **Doctors**: Specializations, availability, ratings
- **Appointments**: Booking details, status, slots
- **Specializations**: Ayurvedic specialties
- **Slots**: Time availability management

## 🔐 Authentication

- JWT-based authentication
- Role-based access control (Patient, Doctor, Admin)
- Refresh token rotation
- Secure password hashing

## 📱 API Endpoints

### Public
- `GET /api/doctors` - Discover doctors
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Protected
- `GET /api/appointments` - User appointments
- `POST /api/appointments` - Book appointment
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Cancel appointment

## 🚀 Deployment

### Production
- Frontend: Vercel/Netlify
- Backend: Render/DigitalOcean
- Database: Managed PostgreSQL
- Redis: Managed Redis service

### CI/CD
- GitHub Actions for automated testing
- Docker containerization
- Environment-specific deployments

## 📊 Scalability Considerations

### For 5,000+ appointments/day:
- **Database**: Read replicas, connection pooling
- **Caching**: Redis for session and slot data
- **Load Balancing**: Multiple backend instances
- **Queue System**: Bull.js for background jobs
- **Monitoring**: Health checks and metrics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details
