'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Clock, MapPin, Phone, Video, MessageCircle, Calendar, User, Award, BookOpen, LogOut } from 'lucide-react';
import Link from 'next/link';

interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  specialization: string;
  experience: number;
  education: string[];
  certifications: string[];
  rating: number;
  totalConsultations: number;
  consultationFee: number;
  bio: string;
  isAvailable: boolean;
  profileImage?: string;
}

interface TimeSlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'AVAILABLE' | 'BOOKED' | 'LOCKED';
}

export default function DoctorDetailPage({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const router = useRouter();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [consultationMode, setConsultationMode] = useState<'ONLINE' | 'IN_PERSON'>('ONLINE');

  useEffect(() => {
    fetchDoctorDetails();
    fetchTimeSlots();
  }, [params.id]);

  const fetchDoctorDetails = async () => {
    try {
      // Mock data - in real app, fetch from API
      const mockDoctor: Doctor = {
        id: params.id,
        firstName: 'Dr. Rajesh',
        lastName: 'Sharma',
        specialization: 'General Ayurveda',
        experience: 15,
        education: ['BAMS', 'MD Ayurveda'],
        certifications: ['Ayurvedic Practitioner', 'Panchakarma Specialist'],
        rating: 4.8,
        totalConsultations: 1250,
        consultationFee: 1500,
        bio: 'Experienced Ayurvedic physician with expertise in general wellness and preventive care. Specializes in personalized treatment plans and holistic healing approaches.',
        isAvailable: true
      };
      
      setDoctor(mockDoctor);
    } catch (error) {
      console.error('Error fetching doctor details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTimeSlots = async () => {
    try {
      // Mock data - in real app, fetch from API
      const mockSlots: TimeSlot[] = [
        { id: '1', date: '2025-08-15', startTime: '09:00', endTime: '09:30', status: 'AVAILABLE' },
        { id: '2', date: '2025-08-15', startTime: '09:30', endTime: '10:00', status: 'AVAILABLE' },
        { id: '3', date: '2025-08-15', startTime: '10:00', endTime: '10:30', status: 'BOOKED' },
        { id: '4', date: '2025-08-15', startTime: '10:30', endTime: '11:00', status: 'AVAILABLE' },
        { id: '5', date: '2025-08-16', startTime: '14:00', endTime: '14:30', status: 'AVAILABLE' },
        { id: '6', date: '2025-08-16', startTime: '14:30', endTime: '15:00', status: 'AVAILABLE' },
        { id: '7', date: '2025-08-16', startTime: '15:00', endTime: '15:30', status: 'AVAILABLE' },
        { id: '8', date: '2025-08-16', startTime: '15:30', endTime: '16:00', status: 'AVAILABLE' }
      ];
      
      setTimeSlots(mockSlots);
    } catch (error) {
      console.error('Error fetching time slots:', error);
    }
  };

  const handleBookAppointment = () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    
    if (!selectedDate || !selectedSlot) {
      alert('Please select a date and time slot');
      return;
    }

    // In real app, navigate to booking confirmation page
    router.push(`/doctors/${params.id}/book?date=${selectedDate}&slot=${selectedSlot}&mode=${consultationMode}`);
  };

  const getAvailableSlotsForDate = (date: string) => {
    return timeSlots.filter(slot => 
      slot.date === date && slot.status === 'AVAILABLE'
    );
  };

  const getNextAvailableDates = () => {
    const dates = [...new Set(timeSlots.map(slot => slot.date))];
    return dates.slice(0, 7); // Next 7 days
  };

  if (loading || !doctor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-primary-600 mr-8">Amrutam</Link>
              <Link href="/doctors" className="text-gray-600 hover:text-gray-900 mr-4">
                ← Back to Doctors
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">Doctor Profile</h1>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <Link href="/dashboard" className="btn btn-outline">
                  Dashboard
                </Link>
              ) : (
                <Link href="/auth/login" className="btn btn-primary">
                  Login to Book
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Doctor Information */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-lg shadow-sm p-8 mb-8"
            >
              {/* Doctor Header */}
              <div className="flex items-start space-x-6 mb-8">
                <div className="w-32 h-32 bg-primary-100 rounded-full flex items-center justify-center">
                  {doctor.profileImage ? (
                    <img 
                      src={doctor.profileImage} 
                      alt={`Dr. ${doctor.firstName}`}
                      className="w-32 h-32 rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-16 w-16 text-primary-600" />
                  )}
                </div>
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Dr. {doctor.firstName} {doctor.lastName}
                  </h1>
                  <p className="text-xl text-primary-600 mb-3">{doctor.specialization}</p>
                  
                  <div className="flex items-center space-x-6 mb-4">
                    <div className="flex items-center">
                      <Star className="h-5 w-5 text-yellow-500 fill-current mr-2" />
                      <span className="font-semibold">{doctor.rating}</span>
                      <span className="text-gray-500 ml-1">({doctor.totalConsultations} consultations)</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-5 w-5 text-gray-400 mr-2" />
                      <span>{doctor.experience} years experience</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <span className="text-2xl font-bold text-primary-600">
                      ₹{doctor.consultationFee}
                    </span>
                    <span className="text-gray-500">per consultation</span>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      doctor.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {doctor.isAvailable ? 'Available' : 'Not Available'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bio */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">About Dr. {doctor.firstName}</h3>
                <p className="text-gray-600 leading-relaxed">{doctor.bio}</p>
              </div>

              {/* Education & Certifications */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <Award className="h-5 w-5 mr-2 text-primary-600" />
                    Education
                  </h3>
                  <ul className="space-y-2">
                    {doctor.education.map((edu, index) => (
                      <li key={index} className="flex items-center text-gray-600">
                        <div className="w-2 h-2 bg-primary-600 rounded-full mr-3"></div>
                        {edu}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <Award className="h-5 w-5 mr-2 text-primary-600" />
                    Certifications
                  </h3>
                  <ul className="space-y-2">
                    {doctor.certifications.map((cert, index) => (
                      <li key={index} className="flex items-center text-gray-600">
                        <div className="w-2 h-2 bg-primary-600 rounded-full mr-3"></div>
                        {cert}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Booking Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-1"
          >
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <BookOpen className="h-5 w-5 mr-2 text-primary-600" />
                Book Appointment
              </h3>

              {/* Consultation Mode */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">Consultation Mode</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setConsultationMode('ONLINE')}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      consultationMode === 'ONLINE'
                        ? 'border-primary-600 bg-primary-50 text-primary-600'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Video className="h-5 w-5 mx-auto mb-2" />
                    <span className="text-sm font-medium">Online</span>
                  </button>
                  <button
                    onClick={() => setConsultationMode('IN_PERSON')}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      consultationMode === 'IN_PERSON'
                        ? 'border-primary-600 bg-primary-50 text-primary-600'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <MapPin className="h-5 w-5 mx-auto mb-2" />
                    <span className="text-sm font-medium">In-Person</span>
                  </button>
                </div>
              </div>

              {/* Date Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">Select Date</label>
                <div className="grid grid-cols-7 gap-2">
                  {getNextAvailableDates().map((date, index) => {
                    const availableSlots = getAvailableSlotsForDate(date);
                    const isSelected = selectedDate === date;
                    const hasSlots = availableSlots.length > 0;
                    
                    return (
                      <button
                        key={index}
                        onClick={() => setSelectedDate(date)}
                        disabled={!hasSlots}
                        className={`p-3 rounded-lg text-center transition-colors ${
                          isSelected
                            ? 'bg-primary-600 text-white'
                            : hasSlots
                            ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                            : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <div className="text-xs font-medium">
                          {new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}
                        </div>
                        <div className="text-sm font-bold">
                          {new Date(date).getDate()}
                        </div>
                        {hasSlots && (
                          <div className="text-xs text-gray-500">
                            {availableSlots.length} slots
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Slot Selection */}
              {selectedDate && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">Select Time</label>
                  <div className="grid grid-cols-2 gap-2">
                    {getAvailableSlotsForDate(selectedDate).map((slot) => (
                      <button
                        key={slot.id}
                        onClick={() => setSelectedSlot(slot.id)}
                        className={`p-3 rounded-lg border-2 transition-colors ${
                          selectedSlot === slot.id
                            ? 'border-primary-600 bg-primary-50 text-primary-600'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {slot.startTime} - {slot.endTime}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Book Button */}
              <button
                onClick={handleBookAppointment}
                disabled={!selectedDate || !selectedSlot}
                className="w-full btn btn-primary py-3 text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Book Appointment
              </button>

              {/* Additional Info */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">What to expect:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 30-minute consultation</li>
                  <li>• Personalized treatment plan</li>
                  <li>• Follow-up recommendations</li>
                  <li>• Digital prescription</li>
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
