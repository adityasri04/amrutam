# Amrutam Platform Deployment Guide

## 🚀 Production Deployment

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 14+
- Redis 6+
- Docker and Docker Compose
- Domain name and SSL certificates

### Environment Variables

#### Backend (.env)
```bash
# Database
DATABASE_URL="postgresql://username:password@host:5432/amrutam_db"

# JWT
JWT_SECRET="your-super-secret-jwt-key-here"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-here"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Server
PORT=8000
NODE_ENV="production"
FRONTEND_URL="https://yourdomain.com"

# Redis
REDIS_URL="redis://host:6379"

# File Upload
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE=5242880

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

#### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### Deployment Options

#### Option 1: Docker Compose (Recommended for small-medium scale)
```bash
# Build and start services
docker-compose -f docker-compose.prod.yml up -d

# Scale backend for load balancing
docker-compose -f docker-compose.prod.yml up -d --scale backend=3
```

#### Option 2: Kubernetes (Recommended for large scale)
```bash
# Apply Kubernetes manifests
kubectl apply -f k8s/

# Scale deployments
kubectl scale deployment amrutam-backend --replicas=5
kubectl scale deployment amrutam-frontend --replicas=3
```

#### Option 3: Cloud Platforms

##### Vercel (Frontend)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

##### Render (Backend)
```bash
# Connect GitHub repository
# Set environment variables in Render dashboard
# Deploy automatically on push to main branch
```

##### DigitalOcean App Platform
```bash
# Use DigitalOcean CLI or dashboard
# Connect GitHub repository
# Configure environment variables
# Deploy with auto-scaling
```

## 📊 Scalability Considerations for 5,000+ Appointments/Day

### Database Scaling

#### 1. Read Replicas
```sql
-- Primary database for writes
-- Read replicas for queries
-- Use connection pooling (PgBouncer)

-- Example connection string with load balancing
DATABASE_URL="postgresql://user:pass@primary:5432,replica1:5432,replica2:5432/amrutam_db?target_session_attrs=read-only"
```

#### 2. Database Optimization
```sql
-- Add indexes for common queries
CREATE INDEX CONCURRENTLY idx_appointments_date_status ON appointments(date, status);
CREATE INDEX CONCURRENTLY idx_timeslots_doctor_date ON time_slots(doctor_id, date, status);
CREATE INDEX CONCURRENTLY idx_users_role_specialization ON users(role, specialization);

-- Partition large tables by date
CREATE TABLE appointments_2024 PARTITION OF appointments
FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
```

### Caching Strategy

#### 1. Redis Clustering
```bash
# Redis Cluster for high availability
redis-cli --cluster create 127.0.0.1:7000 127.0.0.1:7001 127.0.0.1:7002 \
  127.0.0.1:7003 127.0.0.1:7004 127.0.0.1:7005 --cluster-replicas 1
```

#### 2. Cache Patterns
```typescript
// Cache doctor listings with TTL
await setCache(`doctors:${filters}`, doctors, 300); // 5 minutes

// Cache user sessions
await setCache(`session:${userId}`, userData, 3600); // 1 hour

// Cache specializations
await setCache('specializations', specs, 86400); // 24 hours
```

### Load Balancing

#### 1. Nginx Configuration
```nginx
upstream backend {
    least_conn;
    server backend1:8000;
    server backend2:8000;
    server backend3:8000;
}

upstream frontend {
    server frontend1:3000;
    server frontend2:3000;
}

server {
    listen 80;
    server_name yourdomain.com;
    
    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /api {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

#### 2. Health Checks
```typescript
// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    // Check Redis connection
    await redis.ping();
    
    res.json({ 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'unhealthy',
      error: error.message 
    });
  }
});
```

### Queue System

#### 1. Bull.js for Background Jobs
```typescript
import Queue from 'bull';

// Email queue
const emailQueue = new Queue('emails', {
  redis: process.env.REDIS_URL,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    }
  }
});

// Process email jobs
emailQueue.process(async (job) => {
  const { to, subject, body } = job.data;
  await sendEmail(to, subject, body);
});

// Add email to queue
await emailQueue.add({
  to: user.email,
  subject: 'Appointment Confirmation',
  body: 'Your appointment has been confirmed...'
});
```

#### 2. Job Types
```typescript
// Appointment reminders
const reminderQueue = new Queue('reminders');

// Slot cleanup (release expired locks)
const cleanupQueue = new Queue('cleanup');

// Analytics processing
const analyticsQueue = new Queue('analytics');
```

### Monitoring and Observability

#### 1. Application Metrics
```typescript
import prometheus from 'prom-client';

// Metrics
const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code']
});

const activeConnections = new prometheus.Gauge({
  name: 'websocket_active_connections',
  help: 'Number of active WebSocket connections'
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', prometheus.register.contentType);
  res.end(await prometheus.register.metrics());
});
```

#### 2. Logging
```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Structured logging
logger.info('Appointment booked', {
  appointmentId: appointment.id,
  doctorId: appointment.doctorId,
  patientId: appointment.patientId,
  timestamp: new Date().toISOString()
});
```

### Auto-scaling Configuration

#### 1. Horizontal Pod Autoscaler (Kubernetes)
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: amrutam-backend-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: amrutam-backend
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

#### 2. Cloud Auto-scaling
```bash
# AWS Auto Scaling Group
aws autoscaling create-auto-scaling-group \
  --auto-scaling-group-name amrutam-backend \
  --min-size 3 \
  --max-size 20 \
  --desired-capacity 5 \
  --target-group-arns arn:aws:elasticloadbalancing:...

# Google Cloud Autoscaler
gcloud compute instance-groups managed set-autoscaling amrutam-backend \
  --min-num-replicas 3 \
  --max-num-replicas 20 \
  --target-cpu-utilization 0.7
```

### Performance Optimization

#### 1. Database Connection Pooling
```typescript
// Prisma with connection pooling
export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Connection pool settings
  __internal: {
    engine: {
      connectionLimit: 20,
      pool: {
        min: 2,
        max: 20,
        acquireTimeoutMillis: 30000,
        createTimeoutMillis: 30000,
        destroyTimeoutMillis: 5000,
        idleTimeoutMillis: 30000,
        reapIntervalMillis: 1000,
        createRetryIntervalMillis: 200,
      },
    },
  },
});
```

#### 2. API Response Caching
```typescript
// Cache frequently accessed data
app.get('/api/doctors', async (req, res) => {
  const cacheKey = `doctors:${JSON.stringify(req.query)}`;
  
  // Try cache first
  const cached = await getCache(cacheKey);
  if (cached) {
    return res.json(cached);
  }
  
  // Fetch from database
  const doctors = await getDoctors(req.query);
  
  // Cache for 5 minutes
  await setCache(cacheKey, doctors, 300);
  
  res.json(doctors);
});
```

### Security Considerations

#### 1. Rate Limiting
```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);
```

#### 2. CORS Configuration
```typescript
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

## 🚀 Deployment Commands

### Quick Start
```bash
# Clone repository
git clone <repository-url>
cd amrutam-platform

# Install dependencies
npm install

# Set up environment variables
cp backend/env.example backend/.env
cp frontend/.env.example frontend/.env.local

# Start with Docker
docker-compose up -d

# Or start locally
npm run dev
```

### Production Deployment
```bash
# Build all packages
npm run build

# Start production servers
npm run start

# Or use Docker Compose
docker-compose -f docker-compose.prod.yml up -d
```

## 📈 Performance Benchmarks

### Expected Performance at Scale
- **API Response Time**: < 200ms (95th percentile)
- **Database Queries**: < 50ms (95th percentile)
- **Concurrent Users**: 10,000+
- **Appointments/Day**: 5,000+
- **Uptime**: 99.9%

### Monitoring Dashboard
- Grafana for metrics visualization
- Prometheus for metrics collection
- ELK Stack for log analysis
- New Relic for APM

This deployment guide provides a comprehensive approach to scaling the Amrutam platform to handle 5,000+ appointments per day while maintaining performance and reliability.
