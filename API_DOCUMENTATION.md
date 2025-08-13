# 📚 **AMRUTAM API DOCUMENTATION**

## **Base URL**
```
Development: http://localhost:8000
Production: https://api.amrutam.com
```

## **Authentication**

All protected endpoints require a valid JWT token in the Authorization header:

```http
Authorization: Bearer <your_jwt_token>
```

### **Token Types**
- **Access Token**: Short-lived (15 minutes), used for API requests
- **Refresh Token**: Long-lived (7 days), used to get new access tokens

## **API Endpoints**

### **1. Authentication Endpoints**

#### **POST /api/auth/register**
Register a new user (Patient or Doctor)

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "PATIENT",
  "phone": "+1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "PATIENT"
    },
    "tokens": {
      "accessToken": "jwt_access_token",
      "refreshToken": "jwt_refresh_token",
      "expiresIn": "15m"
    }
  }
}
```

#### **POST /api/auth/login**
Authenticate user and get tokens

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "PATIENT"
    },
    "tokens": {
      "accessToken": "jwt_access_token",
      "refreshToken": "jwt_refresh_token",
      "expiresIn": "15m"
    }
  }
}
```

#### **POST /api/auth/refresh**
Get new access token using refresh token

**Request Body:**
```json
{
  "refreshToken": "jwt_refresh_token"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "new_jwt_access_token",
    "expiresIn": "15m"
  }
}
```

#### **POST /api/auth/logout**
Logout user and invalidate tokens

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

#### **GET /api/auth/me**
Get current user profile

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "PATIENT",
    "phone": "+1234567890",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### **2. Doctor Management Endpoints**

#### **GET /api/doctors**
Get list of available doctors with filtering and pagination

**Query Parameters:**
- `specialization` (string): Filter by specialization
- `consultationMode` (string): Filter by mode (ONLINE/IN_PERSON)
- `rating` (number): Minimum rating filter
- `experience` (number): Minimum experience years
- `sortBy` (string): Sort field (rating, experience, consultationFee, createdAt)
- `sortOrder` (string): Sort direction (asc, desc)
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20, max: 100)

**Example Request:**
```http
GET /api/doctors?specialization=General Ayurveda&rating=4.5&sortBy=rating&sortOrder=desc&page=1&limit=10
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "doctor_id",
      "firstName": "Dr. Priya",
      "lastName": "Patel",
      "specialization": "General Ayurveda",
      "experience": 12,
      "rating": 4.9,
      "totalConsultations": 980,
      "consultationFee": 2000,
      "bio": "Specialized in Panchakarma therapies...",
      "isAvailable": true,
      "availableSlots": [
        {
          "id": "slot_id",
          "date": "2024-01-15",
          "startTime": "09:00",
          "endTime": "10:00",
          "status": "AVAILABLE"
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

#### **GET /api/doctors/:id**
Get detailed information about a specific doctor

**Path Parameters:**
- `id` (string): Doctor's user ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "doctor_id",
    "firstName": "Dr. Priya",
    "lastName": "Patel",
    "specialization": "General Ayurveda",
    "experience": 12,
    "rating": 4.9,
    "totalConsultations": 980,
    "consultationFee": 2000,
    "bio": "Specialized in Panchakarma therapies...",
    "profileImage": "https://example.com/image.jpg",
    "isAvailable": true,
    "timeSlots": [
      {
        "id": "slot_id",
        "date": "2024-01-15",
        "startTime": "09:00",
        "endTime": "10:00",
        "status": "AVAILABLE"
      }
    ],
    "reviews": [
      {
        "id": "review_id",
        "rating": 5,
        "comment": "Excellent consultation",
        "patientName": "John Doe",
        "createdAt": "2024-01-10T00:00:00.000Z"
      }
    ]
  }
}
```

#### **PUT /api/doctors/:id/schedule**
Update doctor's availability schedule (Doctor only)

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "schedule": [
    {
      "date": "2024-01-15",
      "slots": [
        {
          "startTime": "09:00",
          "endTime": "10:00",
          "status": "AVAILABLE"
        },
        {
          "startTime": "10:00",
          "endTime": "11:00",
          "status": "AVAILABLE"
        }
      ]
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Schedule updated successfully",
  "data": {
    "updatedSlots": 16
  }
}
```

### **3. Appointment Management Endpoints**

#### **GET /api/appointments**
Get user's appointments with filtering

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `status` (string): Filter by status (PENDING, CONFIRMED, COMPLETED, CANCELLED, RESCHEDULED)
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20, max: 100)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "appointment_id",
      "patient": {
        "id": "patient_id",
        "firstName": "John",
        "lastName": "Doe"
      },
      "doctor": {
        "id": "doctor_id",
        "firstName": "Dr. Priya",
        "lastName": "Patel"
      },
      "slot": {
        "id": "slot_id",
        "date": "2024-01-15",
        "startTime": "09:00",
        "endTime": "10:00"
      },
      "status": "CONFIRMED",
      "consultationMode": "ONLINE",
      "symptoms": "Fatigue and low energy",
      "notes": "Patient reports feeling tired...",
      "createdAt": "2024-01-10T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1
  }
}
```

#### **POST /api/appointments/slots/:slotId/lock**
Lock a time slot for 5 minutes (Patient only)

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "consultationMode": "ONLINE",
  "symptoms": "Fatigue and low energy",
  "notes": "Patient reports feeling tired for the past few weeks"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Slot locked successfully",
  "data": {
    "slotLockId": "lock_id",
    "expiresAt": "2024-01-10T10:05:00.000Z",
    "otp": "123456",
    "appointment": {
      "id": "appointment_id",
      "status": "PENDING"
    }
  }
}
```

#### **POST /api/appointments/slots/:slotId/confirm**
Confirm appointment with OTP (Patient only)

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Appointment confirmed successfully",
  "data": {
    "appointment": {
      "id": "appointment_id",
      "status": "CONFIRMED"
    },
    "slot": {
      "id": "slot_id",
      "status": "BOOKED"
    }
  }
}
```

#### **POST /api/appointments/:id/cancel**
Cancel an appointment (if >24h before)

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "reason": "Schedule conflict"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Appointment cancelled successfully",
  "data": {
    "appointment": {
      "id": "appointment_id",
      "status": "CANCELLED"
    },
    "slot": {
      "id": "slot_id",
      "status": "AVAILABLE"
    }
  }
}
```

#### **POST /api/appointments/:id/complete**
Mark appointment as completed (Doctor only)

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "prescription": "Take Ashwagandha 500mg twice daily",
  "followUpDate": "2024-02-15"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Appointment marked as completed",
  "data": {
    "appointment": {
      "id": "appointment_id",
      "status": "COMPLETED",
      "prescription": "Take Ashwagandha 500mg twice daily",
      "followUpDate": "2024-02-15"
    }
  }
}
```

### **4. Specialization Management Endpoints**

#### **GET /api/specializations**
Get all available specializations

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "spec_id",
      "name": "General Ayurveda",
      "description": "General Ayurvedic consultation and treatment",
      "icon": "🌿",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### **POST /api/specializations**
Create new specialization (Admin only)

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "name": "New Specialization",
  "description": "Description of the new specialization",
  "icon": "🏥"
}
```

#### **PUT /api/specializations/:id**
Update specialization (Admin only)

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "name": "Updated Specialization",
  "description": "Updated description",
  "isActive": true
}
```

#### **DELETE /api/specializations/:id**
Delete specialization (Admin only, soft delete if doctors are using it)

**Headers:**
```http
Authorization: Bearer <access_token>
```

### **5. User Management Endpoints**

#### **PUT /api/users/profile**
Update user profile

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "firstName": "Updated First Name",
  "lastName": "Updated Last Name",
  "phone": "+1987654321",
  "bio": "Updated bio information"
}
```

#### **PUT /api/users/password**
Change user password

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword123"
}
```

#### **GET /api/users**
Get all users (Admin only)

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `role` (string): Filter by role (PATIENT, DOCTOR, ADMIN)
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20, max: 100)

#### **DELETE /api/users/:id**
Delete user (Admin only)

**Headers:**
```http
Authorization: Bearer <access_token>
```

### **6. Health & Monitoring Endpoints**

#### **GET /health**
Health check endpoint

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-10T10:00:00.000Z"
}
```

#### **GET /metrics**
Prometheus metrics endpoint (if monitoring is enabled)

**Response:**
```
# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",route="/api/doctors",status_code="200"} 150
```

## **Error Responses**

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message description",
  "details": "Additional error details if available"
}
```

### **Common HTTP Status Codes**

- **200**: Success
- **201**: Created
- **400**: Bad Request (validation errors)
- **401**: Unauthorized (invalid/missing token)
- **403**: Forbidden (insufficient permissions)
- **404**: Not Found
- **429**: Too Many Requests (rate limited)
- **500**: Internal Server Error

## **Rate Limiting**

API endpoints are protected by rate limiting:

- **Authentication endpoints**: 5 requests per 15 minutes
- **General API**: 100 requests per minute
- **Booking endpoints**: 10 requests per minute

Rate limit headers are included in responses:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642348800
```

## **WebSocket Events (Real-time Updates)**

Connect to `/socket.io` for real-time updates:

### **Events Emitted by Server:**

#### **slotUpdated**
```json
{
  "slotId": "slot_id",
  "status": "BOOKED",
  "doctorId": "doctor_id",
  "date": "2024-01-15"
}
```

#### **appointmentCreated**
```json
{
  "appointmentId": "appointment_id",
  "patientId": "patient_id",
  "doctorId": "doctor_id",
  "status": "CONFIRMED"
}
```

#### **appointmentCancelled**
```json
{
  "appointmentId": "appointment_id",
  "slotId": "slot_id",
  "status": "CANCELLED"
}
```

### **Events Client Can Emit:**

#### **joinDoctorRoom**
```json
{
  "doctorId": "doctor_id"
}
```

#### **joinPatientRoom**
```json
{
  "patientId": "patient_id"
}
```

## **Data Models**

### **User Model**
```typescript
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'PATIENT' | 'DOCTOR' | 'ADMIN';
  phone?: string;
  dateOfBirth?: Date;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  bio?: string;
  profileImage?: string;
  isAvailable: boolean;
  specialization?: string;
  experience?: number;
  rating?: number;
  totalConsultations?: number;
  consultationFee?: number;
  medicalHistory?: string[];
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

### **Appointment Model**
```typescript
interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  slotId: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED';
  consultationMode: 'ONLINE' | 'IN_PERSON';
  symptoms?: string;
  notes?: string;
  prescription?: string;
  followUpDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### **TimeSlot Model**
```typescript
interface TimeSlot {
  id: string;
  doctorId: string;
  date: Date;
  startTime: string;
  endTime: string;
  status: 'AVAILABLE' | 'BOOKED' | 'LOCKED' | 'CANCELLED';
  appointmentId?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## **Testing the API**

### **Using cURL Examples:**

#### **Register a new patient:**
```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User",
    "role": "PATIENT",
    "phone": "+1234567890"
  }'
```

#### **Login and get token:**
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

#### **Get doctors with authentication:**
```bash
curl -X GET http://localhost:8000/api/doctors \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### **Using Postman:**

1. Import the collection from the project's `postman` folder
2. Set the base URL to `http://localhost:8000`
3. Use the "Login" request to get a token
4. Set the token in the collection variables
5. Test other endpoints

## **Development vs Production**

### **Development Environment:**
- Base URL: `http://localhost:8000`
- CORS enabled for all origins
- Detailed error messages
- No rate limiting (or very high limits)

### **Production Environment:**
- Base URL: `https://api.amrutam.com`
- CORS restricted to frontend domain
- Sanitized error messages
- Strict rate limiting
- HTTPS only
- Request logging and monitoring

## **Support & Documentation**

- **Interactive API Docs**: Visit `/api-docs` for Swagger UI
- **GitHub Repository**: [Link to your repo]
- **Issues**: Report bugs and feature requests on GitHub
- **Email**: [Your contact email]

---

*This documentation is generated from the OpenAPI specification and covers all available endpoints in the Amrutam API.*
