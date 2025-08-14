export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'PATIENT' | 'DOCTOR' | 'ADMIN';
  createdAt: string;
  updatedAt: string;
  
  // Patient specific fields
  dateOfBirth?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  medicalHistory?: string[];
  emergencyContact?: any;
  
  // Doctor specific fields
  specialization?: string;
  experience?: number;
  education?: string[];
  certifications?: string[];
  rating?: number;
  totalConsultations?: number;
  consultationFee?: number;
  bio?: string;
  profileImage?: string;
  isAvailable?: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  specialization: string;
  rating: number;
  experience: number;
  consultationFee: number;
  profileImage?: string;
  isAvailable: boolean;
}

export interface TimeSlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'AVAILABLE' | 'BOOKED' | 'LOCKED' | 'CANCELLED';
  isRecurring: boolean;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  slotId: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED';
  consultationMode: 'ONLINE' | 'IN_PERSON';
  symptoms?: string;
  notes?: string;
  prescription?: string;
  followUpDate?: string;
  createdAt: string;
  updatedAt: string;
  cancelledAt?: string;
  cancelledBy?: string;
  cancellationReason?: string;
}

export interface Specialization {
  id: string;
  name: string;
  description: string;
  icon?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
