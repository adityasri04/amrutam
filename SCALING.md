# 🚀 **SCALING AMRUTAM TO 5,000+ APPOINTMENTS/DAY**

## **Current Architecture Assessment**

Our current MVP handles the core functionality with a solid foundation:
- **Monorepo structure** with clear separation of concerns
- **PostgreSQL** with Prisma ORM for data consistency
- **Redis** for caching and rate limiting
- **JWT authentication** with refresh tokens
- **RESTful API** with comprehensive documentation

## **Scaling Challenges & Solutions**

### **1. Database Scaling (Critical Path)**

#### **Current State:**
- Single PostgreSQL instance
- Basic connection pooling
- No read replicas

#### **Target State (5,000 appointments/day):**
```
Database Load Calculation:
- 5,000 appointments ÷ 24 hours = ~208 appointments/hour
- Peak hours (9 AM - 5 PM): ~625 appointments/hour
- Concurrent users: ~200-300 simultaneous
- Database queries: ~2,000-3,000 QPS during peak
```

#### **Implementation Strategy:**

**Phase 1: Read Replicas & Connection Pooling**
```yaml
# docker-compose.production.yml
services:
  postgres-primary:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: amrutam_db
      POSTGRES_USER: amrutam_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_primary_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  postgres-replica-1:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: amrutam_db
      POSTGRES_USER: amrutam_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_replica_1_data:/var/lib/postgresql/data
    ports:
      - "5433:5432"
    command: >
      postgres
      -c hot_standby=on
      -c primary_conninfo='host=postgres-primary port=5432 user=amrutam_user password=${DB_PASSWORD}'

  postgres-replica-2:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: amrutam_db
      POSTGRES_USER: amrutam_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_replica_2_data:/var/lib/postgresql/data
    ports:
      - "5434:5432"
    command: >
      postgres
      -c hot_standby=on
      -c primary_conninfo='host=postgres-primary port=5432 user=amrutam_user password=${DB_PASSWORD}'
```

**Phase 2: Database Sharding by Specialization**
```typescript
// src/config/database.ts
export class DatabaseManager {
  private primaryClient: PrismaClient;
  private replicaClients: PrismaClient[];
  private specializationShards: Map<string, PrismaClient>;

  async getClientForSpecialization(specialization: string): Promise<PrismaClient> {
    // Route to appropriate shard based on specialization
    const shardKey = this.getShardKey(specialization);
    return this.specializationShards.get(shardKey) || this.primaryClient;
  }

  async getReadClient(): Promise<PrismaClient> {
    // Round-robin load balancing across replicas
    const replicaIndex = Math.floor(Math.random() * this.replicaClients.length);
    return this.replicaClients[replicaIndex];
  }
}
```

**Phase 3: Advanced Connection Pooling**
```typescript
// src/config/pool.ts
import { Pool } from 'pg';

export const createConnectionPool = (config: PoolConfig) => {
  return new Pool({
    ...config,
    max: 100, // Maximum connections per pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    maxUses: 7500, // Recycle connections after 7500 queries
  });
};

// Separate pools for different query types
export const readPool = createConnectionPool({ max: 80 });
export const writePool = createConnectionPool({ max: 20 });
export const adminPool = createConnectionPool({ max: 10 });
```

### **2. Caching Strategy (Redis Optimization)**

#### **Current State:**
- Basic Redis for rate limiting
- Simple key-value caching

#### **Target State:**
```typescript
// src/services/cache.ts
export class CacheService {
  private redis: Redis;
  private localCache: Map<string, { data: any; expiry: number }>;

  async getCachedDoctors(specialization: string, filters: any): Promise<Doctor[]> {
    const cacheKey = `doctors:${specialization}:${JSON.stringify(filters)}`;
    
    // L1: Local memory cache (fastest)
    const localData = this.localCache.get(cacheKey);
    if (localData && localData.expiry > Date.now()) {
      return localData.data;
    }

    // L2: Redis cache
    const redisData = await this.redis.get(cacheKey);
    if (redisData) {
      const parsed = JSON.parse(redisData);
      this.localCache.set(cacheKey, { data: parsed, expiry: Date.now() + 30000 });
      return parsed;
    }

    // L3: Database query
    const doctors = await this.fetchDoctorsFromDB(specialization, filters);
    
    // Cache with appropriate TTL
    await this.redis.setex(cacheKey, 300, JSON.stringify(doctors));
    this.localCache.set(cacheKey, { data: doctors, expiry: Date.now() + 30000 });
    
    return doctors;
  }

  async invalidateDoctorCache(doctorId: string): Promise<void> {
    const pattern = `doctors:*:*`;
    const keys = await this.redis.keys(pattern);
    
    for (const key of keys) {
      if (key.includes(doctorId)) {
        await this.redis.del(key);
      }
    }
    
    // Clear local cache
    this.localCache.clear();
  }
}
```

**Redis Cluster Configuration:**
```yaml
# docker-compose.production.yml
services:
  redis-master:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_master_data:/data

  redis-slave-1:
    image: redis:7-alpine
    ports:
      - "6380:6379"
    command: redis-server --slaveof redis-master 6379
    volumes:
      - redis_slave_1_data:/data

  redis-slave-2:
    image: redis:7-alpine
    ports:
      - "6381:6379"
    command: redis-server --slaveof redis-master 6379
    volumes:
      - redis_slave_2_data:/data

  redis-sentinel-1:
    image: redis:7-alpine
    command: redis-sentinel /usr/local/etc/redis/sentinel.conf
    volumes:
      - ./redis/sentinel.conf:/usr/local/etc/redis/sentinel.conf
```

### **3. Load Balancing & API Gateway**

#### **Nginx Configuration:**
```nginx
# nginx.conf
upstream backend_servers {
    least_conn;
    server backend-1:8000 max_fails=3 fail_timeout=30s;
    server backend-2:8000 max_fails=3 fail_timeout=30s;
    server backend-3:8000 max_fails=3 fail_timeout=30s;
    server backend-4:8000 max_fails=3 fail_timeout=30s;
}

upstream frontend_servers {
    least_conn;
    server frontend-1:3000 max_fails=3 fail_timeout=30s;
    server frontend-2:3000 max_fails=3 fail_timeout=30s;
}

server {
    listen 80;
    server_name api.amrutam.com;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=100r/m;
    limit_req zone=api burst=20 nodelay;

    # Health checks
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    # API routing
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        
        proxy_pass http://backend_servers;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 5s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Circuit breaker
        proxy_next_upstream error timeout invalid_header http_500 http_502 http_503 http_504;
        proxy_next_upstream_tries 3;
        proxy_next_upstream_timeout 10s;
    }
}
```

### **4. Queue System for Background Jobs**

#### **Bull.js Implementation:**
```typescript
// src/services/queue.ts
import Queue from 'bull';
import { prisma } from '../config/database';
import { sendOTP, sendAppointmentReminder } from '../services/notifications';

export class QueueService {
  private otpQueue: Queue;
  private reminderQueue: Queue;
  private slotCleanupQueue: Queue;

  constructor() {
    this.otpQueue = new Queue('OTP Processing', {
      redis: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    });

    this.reminderQueue = new Queue('Appointment Reminders', {
      redis: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
    });

    this.slotCleanupQueue = new Queue('Slot Cleanup', {
      redis: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
      repeat: {
        cron: '*/5 * * * *', // Every 5 minutes
      },
    });

    this.setupQueueProcessors();
  }

  private setupQueueProcessors() {
    // OTP Processing
    this.otpQueue.process(async (job) => {
      const { userId, phone, otp } = job.data;
      
      try {
        await sendOTP(phone, otp);
        
        // Schedule OTP expiration
        setTimeout(async () => {
          await prisma.slotLock.deleteMany({
            where: {
              patientId: userId,
              expiresAt: { lt: new Date() },
            },
          });
        }, 5 * 60 * 1000); // 5 minutes
        
      } catch (error) {
        console.error('OTP sending failed:', error);
        throw error;
      }
    });

    // Appointment Reminders
    this.reminderQueue.process(async (job) => {
      const { appointmentId } = job.data;
      
      try {
        const appointment = await prisma.appointment.findUnique({
          where: { id: appointmentId },
          include: { patient: true, doctor: true, slot: true },
        });

        if (appointment) {
          await sendAppointmentReminder(appointment);
        }
      } catch (error) {
        console.error('Reminder sending failed:', error);
        throw error;
      }
    });

    // Slot Cleanup
    this.slotCleanupQueue.process(async () => {
      try {
        // Clean up expired slot locks
        await prisma.slotLock.deleteMany({
          where: {
            expiresAt: { lt: new Date() },
          },
        });

        // Release expired slots
        await prisma.timeSlot.updateMany({
          where: {
            status: 'LOCKED',
            updatedAt: { lt: new Date(Date.now() - 5 * 60 * 1000) },
          },
          data: {
            status: 'AVAILABLE',
          },
        });
      } catch (error) {
        console.error('Slot cleanup failed:', error);
      }
    });
  }

  async addOTPJob(userId: string, phone: string, otp: string): Promise<void> {
    await this.otpQueue.add('send-otp', { userId, phone, otp }, {
      priority: 1,
      delay: 0,
    });
  }

  async addReminderJob(appointmentId: string, reminderTime: Date): Promise<void> {
    const delay = reminderTime.getTime() - Date.now();
    
    if (delay > 0) {
      await this.reminderQueue.add('send-reminder', { appointmentId }, {
        delay,
        priority: 2,
      });
    }
  }
}
```

### **5. Monitoring & Observability**

#### **Prometheus + Grafana Setup:**
```yaml
# docker-compose.monitoring.yml
services:
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus

  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana

  node-exporter:
    image: prom/node-exporter
    ports:
      - "9100:9100"

  redis-exporter:
    image: oliver006/redis_exporter
    ports:
      - "9121:9121"
    environment:
      - REDIS_ADDR=redis://redis-master:6379
```

#### **Application Metrics:**
```typescript
// src/middleware/metrics.ts
import { Request, Response, NextFunction } from 'express';
import { register, Counter, Histogram } from 'prom-client';

const httpRequestDurationMicroseconds = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5],
});

const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    httpRequestDurationMicroseconds
      .labels(req.method, req.route?.path || req.path, res.statusCode.toString())
      .observe(duration / 1000);
    
    httpRequestsTotal
      .labels(req.method, req.route?.path || req.path, res.statusCode.toString())
      .inc();
  });
  
  next();
};

export const metricsEndpoint = async (req: Request, res: Response) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
};
```

### **6. Auto-scaling Strategy**

#### **Kubernetes HPA Configuration:**
```yaml
# k8s/hpa.yaml
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
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
      - type: Percent
        value: 100
        periodSeconds: 15
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 10
        periodSeconds: 60
```

#### **Cloud Auto-scaling (AWS Example):**
```typescript
// src/services/autoscaling.ts
import AWS from 'aws-sdk';

export class AutoScalingService {
  private autoscaling: AWS.AutoScaling;
  private ec2: AWS.EC2;

  constructor() {
    this.autoscaling = new AWS.AutoScaling();
    this.ec2 = new AWS.EC2();
  }

  async scaleBasedOnMetrics(): Promise<void> {
    const metrics = await this.getCurrentMetrics();
    
    if (metrics.cpuUtilization > 80 || metrics.memoryUtilization > 85) {
      await this.scaleUp();
    } else if (metrics.cpuUtilization < 30 && metrics.memoryUtilization < 40) {
      await this.scaleDown();
    }
  }

  private async scaleUp(): Promise<void> {
    const params = {
      AutoScalingGroupName: 'amrutam-backend-asg',
      MinSize: 3,
      MaxSize: 20,
      DesiredCapacity: 5, // Increase by 2
    };

    await this.autoscaling.updateAutoScalingGroup(params).promise();
  }

  private async scaleDown(): Promise<void> {
    const params = {
      AutoScalingGroupName: 'amrutam-backend-asg',
      MinSize: 3,
      MaxSize: 20,
      DesiredCapacity: 3, // Decrease to minimum
    };

    await this.autoscaling.updateAutoScalingGroup(params).promise();
  }
}
```

### **7. Performance Optimization**

#### **Database Indexing Strategy:**
```sql
-- Critical indexes for 5,000 appointments/day
CREATE INDEX CONCURRENTLY idx_appointments_date_status 
ON appointments(date, status);

CREATE INDEX CONCURRENTLY idx_appointments_doctor_date 
ON appointments(doctor_id, date);

CREATE INDEX CONCURRENTLY idx_timeslots_doctor_date_status 
ON time_slots(doctor_id, date, status);

CREATE INDEX CONCURRENTLY idx_users_role_available 
ON users(role, is_available);

CREATE INDEX CONCURRENTLY idx_slotlocks_expires 
ON slot_locks(expires_at);

-- Composite indexes for complex queries
CREATE INDEX CONCURRENTLY idx_doctors_specialization_rating 
ON users(specialization, rating DESC) 
WHERE role = 'DOCTOR';

CREATE INDEX CONCURRENTLY idx_appointments_patient_status_date 
ON appointments(patient_id, status, date DESC);
```

#### **Query Optimization:**
```typescript
// src/services/doctorService.ts
export class DoctorService {
  async getAvailableDoctors(filters: DoctorFilters): Promise<Doctor[]> {
    // Use read replica for search queries
    const client = await this.dbManager.getReadClient();
    
    // Optimized query with proper joins
    const doctors = await client.user.findMany({
      where: {
        role: 'DOCTOR',
        isAvailable: true,
        ...(filters.specialization && { specialization: filters.specialization }),
        ...(filters.consultationMode && { 
          // Join with time slots to check availability
          timeSlots: {
            some: {
              status: 'AVAILABLE',
              date: { gte: new Date() },
            }
          }
        }),
      },
      include: {
        timeSlots: {
          where: {
            status: 'AVAILABLE',
            date: { gte: new Date() },
          },
          orderBy: { date: 'asc' },
          take: 10, // Limit slots per doctor
        },
        _count: {
          select: {
            appointments: true,
            timeSlots: true,
          }
        }
      },
      orderBy: [
        { rating: 'desc' },
        { experience: 'desc' },
        { totalConsultations: 'desc' },
      ],
      take: filters.limit || 20,
      skip: (filters.page - 1) * (filters.limit || 20),
    });

    return doctors;
  }
}
```

### **8. Security & Rate Limiting**

#### **Advanced Rate Limiting:**
```typescript
// src/middleware/rateLimit.ts
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || '6379'),
});

export const createRateLimiter = (options: {
  windowMs: number;
  max: number;
  message?: string;
  keyGenerator?: (req: any) => string;
}) => {
  return rateLimit({
    store: new RedisStore({
      client: redis,
      prefix: 'rate_limit:',
    }),
    windowMs: options.windowMs,
    max: options.max,
    message: options.message || 'Too many requests from this IP',
    keyGenerator: options.keyGenerator || ((req) => req.ip),
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil(options.windowMs / 1000),
      });
    },
  });
};

// Different limits for different endpoints
export const authRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per 15 minutes
  message: 'Too many authentication attempts',
});

export const apiRateLimit = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
});

export const bookingRateLimit = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 booking attempts per minute
  message: 'Too many booking attempts',
});
```

## **Implementation Timeline**

### **Phase 1 (Week 1-2): Foundation**
- [ ] Database read replicas
- [ ] Redis clustering
- [ ] Basic load balancing
- [ ] Connection pooling

### **Phase 2 (Week 3-4): Performance**
- [ ] Queue system implementation
- [ ] Advanced caching
- [ ] Database indexing
- [ ] Query optimization

### **Phase 3 (Week 5-6): Scalability**
- [ ] Auto-scaling setup
- [ ] Monitoring & alerting
- [ ] Security hardening
- [ ] Performance testing

### **Phase 4 (Week 7-8): Production Ready**
- [ ] Load testing
- [ ] Disaster recovery
- [ ] Documentation
- [ ] Deployment automation

## **Expected Performance Metrics**

After implementation, we expect:
- **Response Time**: < 200ms (95th percentile)
- **Throughput**: 5,000+ appointments/day
- **Concurrent Users**: 1,000+ simultaneous
- **Database QPS**: 3,000+ during peak
- **Uptime**: 99.9%+
- **Error Rate**: < 0.1%

## **Cost Estimation (Monthly)**

- **Database**: $500-800 (managed PostgreSQL)
- **Compute**: $300-500 (auto-scaling instances)
- **Caching**: $100-200 (Redis cluster)
- **Load Balancer**: $50-100
- **Monitoring**: $100-200
- **Total**: $1,050-1,800/month

This architecture ensures Amrutam can scale from our current MVP to handling enterprise-level load while maintaining performance, reliability, and cost-effectiveness.
