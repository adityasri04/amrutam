'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, CalendarDays, Clock, Users, Star, Settings, Plus, Edit, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface TimeSlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'AVAILABLE' | 'BOOKED' | 'LOCKED' | 'CANCELLED';
  appointment?: {
    id: string;
    patient: {
      firstName: string;
      lastName: string;
    };
    symptoms: string;
    consultationMode: 'ONLINE' | 'IN_PERSON';
  };
}

interface RecurringRule {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
  startDate: string;
  endDate?: string;
}

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [recurringRules, setRecurringRules] = useState<RecurringRule[]>([]);
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [stats, setStats] = useState({
    totalAppointments: 0,
    todayAppointments: 0,
    averageRating: 0,
    totalPatients: 0,
  });

  useEffect(() => {
    if (user?.role === 'DOCTOR') {
      fetchTimeSlots();
      fetchRecurringRules();
      fetchStats();
    }
  }, [user, selectedDate]);

  const fetchTimeSlots = async () => {
    try {
      const response = await fetch(`/api/doctors/${user?.id}/slots?date=${selectedDate.toISOString().split('T')[0]}`);
      const data = await response.json();
      if (data.success) {
        setTimeSlots(data.data);
      }
    } catch (error) {
      console.error('Error fetching time slots:', error);
    }
  };

  const fetchRecurringRules = async () => {
    try {
      const response = await fetch(`/api/doctors/${user?.id}/recurring-rules`);
      const data = await response.json();
      if (data.success) {
        setRecurringRules(data.data);
      }
    } catch (error) {
      console.error('Error fetching recurring rules:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/doctors/${user?.id}/stats`);
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const generateCalendarDays = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const getAppointmentsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return timeSlots.filter(slot => 
      slot.date === dateStr && slot.status === 'BOOKED'
    ).length;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date) => {
    return date.toDateString() === selectedDate.toDateString();
  };

  if (user?.role !== 'DOCTOR') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">This page is only available for doctors.</p>
        </div>
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
              <Calendar className="h-8 w-8 text-primary-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Doctor Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">Welcome, Dr. {user.firstName}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Patients</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalPatients}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Today's Appointments</p>
                <p className="text-2xl font-bold text-gray-900">{stats.todayAppointments}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Star className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Average Rating</p>
                <p className="text-2xl font-bold text-gray-900">{stats.averageRating.toFixed(1)}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Appointments</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalAppointments}</p>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar View */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Calendar View</h2>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1))}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    ←
                  </button>
                  <span className="text-sm font-medium text-gray-700">
                    {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </span>
                  <button
                    onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1))}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    →
                  </button>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {dayNames.map(day => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                    {day.slice(0, 3)}
                  </div>
                ))}
                
                {generateCalendarDays().map((date, index) => (
                  <div
                    key={index}
                    className={`p-2 min-h-[80px] border border-gray-200 ${
                      !date ? 'bg-gray-50' : 'bg-white hover:bg-gray-50 cursor-pointer'
                    } ${isToday(date!) ? 'ring-2 ring-primary-500' : ''} ${
                      isSelected(date!) ? 'bg-primary-50 border-primary-300' : ''
                    }`}
                    onClick={() => date && setSelectedDate(date)}
                  >
                    {date && (
                      <>
                        <div className="text-sm font-medium text-gray-900 mb-1">
                          {date.getDate()}
                        </div>
                        {getAppointmentsForDate(date) > 0 && (
                          <div className="text-xs bg-primary-100 text-primary-800 px-2 py-1 rounded-full">
                            {getAppointmentsForDate(date)} appointment{getAppointmentsForDate(date) !== 1 ? 's' : ''}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Time Slots for Selected Date */}
            <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Time Slots - {selectedDate.toLocaleDateString()}
                </h3>
                <button className="btn btn-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Slots
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {timeSlots.map(slot => (
                  <div
                    key={slot.id}
                    className={`p-4 rounded-lg border ${
                      slot.status === 'BOOKED' ? 'bg-green-50 border-green-200' :
                      slot.status === 'LOCKED' ? 'bg-yellow-50 border-yellow-200' :
                      slot.status === 'CANCELLED' ? 'bg-red-50 border-red-200' :
                      'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900">
                        {slot.startTime} - {slot.endTime}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        slot.status === 'BOOKED' ? 'bg-green-100 text-green-800' :
                        slot.status === 'LOCKED' ? 'bg-yellow-100 text-yellow-800' :
                        slot.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {slot.status}
                      </span>
                    </div>
                    
                    {slot.appointment && (
                      <div className="text-sm text-gray-600">
                        <p><strong>Patient:</strong> {slot.appointment.patient.firstName} {slot.appointment.patient.lastName}</p>
                        <p><strong>Mode:</strong> {slot.appointment.consultationMode}</p>
                        {slot.appointment.symptoms && (
                          <p><strong>Symptoms:</strong> {slot.appointment.symptoms}</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recurring Availability Rules */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Recurring Rules</h3>
                <button
                  onClick={() => setShowRecurringModal(true)}
                  className="btn btn-primary"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Rule
                </button>
              </div>

              <div className="space-y-3">
                {recurringRules.map(rule => (
                  <div key={rule.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {dayNames[rule.dayOfWeek]}
                        </p>
                        <p className="text-xs text-gray-600">
                          {rule.startTime} - {rule.endTime}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button className="p-1 hover:bg-gray-200 rounded">
                          <Edit className="h-3 w-3 text-gray-600" />
                        </button>
                        <button className="p-1 hover:bg-gray-200 rounded">
                          <Trash2 className="h-3 w-3 text-red-600" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center mt-2">
                      <div className={`w-2 h-2 rounded-full mr-2 ${
                        rule.isActive ? 'bg-green-500' : 'bg-gray-400'
                      }`} />
                      <span className="text-xs text-gray-500">
                        {rule.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full btn btn-outline">
                  <CalendarDays className="h-4 w-4 mr-2" />
                  View Schedule
                </button>
                <button className="w-full btn btn-outline">
                  <Users className="h-4 w-4 mr-2" />
                  Patient List
                </button>
                <button className="w-full btn btn-outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
