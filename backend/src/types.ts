export enum UserRole {
  PATIENT = 'PATIENT',
  DOCTOR = 'DOCTOR',
  ADMIN = 'ADMIN'
}

export enum AppointmentStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  RESCHEDULED = 'RESCHEDULED'
}

export enum ConsultationMode {
  ONLINE = 'ONLINE',
  IN_PERSON = 'IN_PERSON'
}

export enum SlotStatus {
  AVAILABLE = 'AVAILABLE',
  BOOKED = 'BOOKED',
  LOCKED = 'LOCKED',
  UNAVAILABLE = 'UNAVAILABLE'
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface Doctor extends User {
  role: UserRole.DOCTOR;
  specialization: string;
  experience: number;
  education: string[];
  certifications: string[];
  rating: number;
  totalConsultations: number;
  consultationFee: number;
  bio: string;
  profileImage?: string;
  isAvailable: boolean;
}

export interface Patient extends User {
  role: UserRole.PATIENT;
  dateOfBirth?: Date;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  medicalHistory?: string[];
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
}

export interface Specialization {
  id: string;
  name: string;
  description: string;
  icon?: string;
  isActive: boolean;
}

export interface TimeSlot {
  id: string;
  doctorId: string;
  date: Date;
  startTime: string;
  endTime: string;
  status: SlotStatus;
  appointmentId?: string;
  lockedUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  slotId: string;
  status: AppointmentStatus;
  consultationMode: ConsultationMode;
  symptoms?: string;
  notes?: string;
  prescription?: string;
  followUpDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  cancelledAt?: Date;
  cancelledBy?: string;
  cancellationReason?: string;
}

export interface BookingRequest {
  doctorId: string;
  slotId: string;
  consultationMode: ConsultationMode;
  symptoms?: string;
  notes?: string;
}

export interface SlotLock {
  slotId: string;
  patientId: string;
  lockedUntil: Date;
  otp: string;
  otpExpiresAt: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DoctorSearchFilters {
  specialization?: string;
  consultationMode?: ConsultationMode;
  date?: Date;
  minRating?: number;
  maxFee?: number;
  isAvailable?: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message: string;
}
