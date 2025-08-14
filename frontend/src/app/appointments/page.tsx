'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, User, MapPin, Phone, Video, MessageCircle, Plus, Filter, Search, LogOut } from 'lucide-react';
import Link from 'next/link';

interface Appointment {
  id: string;
  doctorName: string;
  doctorSpecialization: string;
  date: string;
  time: string;
  status: 'BOOKED' | 'COMPLETED' | 'CANCELLED' | 'PENDING';
  consultationMode: 'ONLINE' | 'IN_PERSON';
  consultationFee: number;
  symptoms?: string;
  notes?: string;
}

export default function AppointmentsPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    fetchAppointments();
  }, [user, router]);

  const fetchAppointments = async () => {
    try {
      // Mock data - in real app, fetch from API
      const mockAppointments: Appointment[] = [
        {
          id: '1',
          doctorName: 'Dr. Rajesh Sharma',
          doctorSpecialization: 'General Ayurveda',
          date: '2025-08-15',
          time: '10:00 AM',
          status: 'BOOKED',
          consultationMode: 'ONLINE',
          consultationFee: 1500,
          symptoms: 'Fatigue, digestive issues'
        },
        {
          id: '2',
          doctorName: 'Dr. Priya Patel',
          doctorSpecialization: 'Panchakarma',
          date: '2025-08-10',
          time: '2:00 PM',
          status: 'COMPLETED',
          consultationMode: 'IN_PERSON',
          consultationFee: 2000,
          notes: 'Prescribed detoxification therapy'
        },
        {
          id: '3',
          doctorName: 'Dr. Amit Kumar',
          doctorSpecialization: 'Rasayana',
          date: '2025-08-20',
          time: '11:30 AM',
          status: 'PENDING',
          consultationMode: 'ONLINE',
          consultationFee: 2500
        }
      ];
      
      setAppointments(mockAppointments);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const filteredAppointments = appointments.filter(appointment => {
    const matchesStatus = filterStatus === 'ALL' || appointment.status === filterStatus;
    const matchesSearch = appointment.doctorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         appointment.doctorSpecialization.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'BOOKED': return 'bg-blue-100 text-blue-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'BOOKED': return '📅';
      case 'COMPLETED': return '✅';
      case 'CANCELLED': return '❌';
      case 'PENDING': return '⏳';
      default: return '📋';
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-primary-600 mr-8">Amrutam</Link>
              <h1 className="text-xl font-semibold text-gray-900">My Appointments</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="btn btn-outline">
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="btn btn-outline flex items-center"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-r from-green-600 to-emerald-700 rounded-lg text-white p-8 mb-8"
        >
          <h2 className="text-3xl font-bold mb-2">
            Manage Your Health Journey 📅
          </h2>
          <p className="text-green-100 text-lg">
            View, schedule, and manage your Ayurvedic consultations
          </p>
        </motion.div>

        {/* Quick Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <Link href="/doctors" className="btn btn-primary flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            Book New Appointment
          </Link>
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search appointments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-wrap gap-3">
            <span className="text-sm font-medium text-gray-700">Filter by status:</span>
            {['ALL', 'BOOKED', 'PENDING', 'COMPLETED', 'CANCELLED'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === status
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Appointments List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments found</h3>
            <p className="text-gray-600 mb-6">
              {filterStatus === 'ALL' 
                ? "You don't have any appointments yet."
                : `No ${filterStatus.toLowerCase()} appointments found.`
              }
            </p>
            <Link href="/doctors" className="btn btn-primary">
              Book Your First Appointment
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredAppointments.map((appointment, index) => (
              <motion.div
                key={appointment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  {/* Appointment Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {appointment.doctorName}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {appointment.doctorSpecialization}
                        </p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {new Date(appointment.date).toLocaleDateString()}
                          </span>
                          <span className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {appointment.time}
                          </span>
                          <span className="flex items-center">
                            {appointment.consultationMode === 'ONLINE' ? (
                              <Video className="h-4 w-4 mr-1" />
                            ) : (
                              <MapPin className="h-4 w-4 mr-1" />
                            )}
                            {appointment.consultationMode === 'ONLINE' ? 'Online' : 'In-Person'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                          <span className="mr-1">{getStatusIcon(appointment.status)}</span>
                          {appointment.status}
                        </div>
                        <p className="text-lg font-semibold text-primary-600 mt-2">
                          ₹{appointment.consultationFee}
                        </p>
                      </div>
                    </div>

                    {/* Additional Details */}
                    {appointment.symptoms && (
                      <div className="mb-3">
                        <p className="text-sm text-gray-600">
                          <strong>Symptoms:</strong> {appointment.symptoms}
                        </p>
                      </div>
                    )}
                    {appointment.notes && (
                      <div className="mb-3">
                        <p className="text-sm text-gray-600">
                          <strong>Notes:</strong> {appointment.notes}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 mt-4 lg:mt-0 lg:ml-6">
                    {appointment.status === 'BOOKED' && (
                      <>
                        <button className="btn btn-outline text-sm">
                          Reschedule
                        </button>
                        <button className="btn btn-outline text-sm text-red-600 hover:bg-red-50">
                          Cancel
                        </button>
                      </>
                    )}
                    {appointment.status === 'PENDING' && (
                      <button className="btn btn-primary text-sm">
                        Confirm
                      </button>
                    )}
                    {appointment.status === 'COMPLETED' && (
                      <button className="btn btn-outline text-sm">
                        Book Follow-up
                      </button>
                    )}
                    <button className="btn btn-outline text-sm">
                      View Details
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
