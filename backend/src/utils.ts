import { PaginationParams, PaginatedResponse } from './types';

export function generateOTP(length: number = 6): string {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)];
  }
  return otp;
}

export function calculatePagination(
  total: number,
  page: number,
  limit: number
): PaginatedResponse<any>['pagination'] {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
  };
}

export function validatePaginationParams(params: Partial<PaginationParams>): PaginationParams {
  return {
    page: Math.max(1, params.page || 1),
    limit: Math.min(100, Math.max(1, params.limit || 10)),
    sortBy: params.sortBy || 'createdAt',
    sortOrder: params.sortOrder === 'asc' ? 'asc' : 'desc',
  };
}

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function formatTime(time: string): string {
  return time.substring(0, 5); // HH:MM format
}

export function isSlotAvailable(slotDate: Date, slotTime: string): boolean {
  const now = new Date();
  const slotDateTime = new Date(slotDate);
  const [hours, minutes] = slotTime.split(':').map(Number);
  slotDateTime.setHours(hours, minutes, 0, 0);
  
  return slotDateTime > now;
}

export function canCancelOrReschedule(appointmentDate: Date): boolean {
  const now = new Date();
  const appointmentDateTime = new Date(appointmentDate);
  const hoursDifference = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  return hoursDifference > 24;
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function sanitizePhoneNumber(phone: string): string {
  return phone.replace(/\D/g, '');
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePhoneNumber(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone);
}

export function calculateAge(dateOfBirth: Date): number {
  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = today.getMonth() - dateOfBirth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
    age--;
  }
  
  return age;
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
