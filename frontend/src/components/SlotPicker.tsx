'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Video, User, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  status: 'AVAILABLE' | 'BOOKED' | 'LOCKED';
  isRecurring: boolean;
}

interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  specialization: string;
  rating: number;
  experience: number;
  consultationFee: number;
  profileImage?: string;
}

interface SlotPickerProps {
  doctor: Doctor;
  onSlotSelect: (slot: TimeSlot, date: Date) => void;
}

const timeSlots = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30'
];

export default function SlotPicker({ doctor, onSlotSelect }: SlotPickerProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [consultationMode, setConsultationMode] = useState<'ONLINE' | 'IN_PERSON'>('ONLINE');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAvailableSlots();
  }, [selectedDate, consultationMode]);

  const fetchAvailableSlots = async () => {
    setLoading(true);
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const response = await fetch(
        `/api/doctors/${doctor.id}/slots?date=${dateStr}&status=AVAILABLE&consultationMode=${consultationMode}`
      );
      const data = await response.json();
      if (data.success) {
        setAvailableSlots(data.data);
      }
    } catch (error) {
      console.error('Error fetching slots:', error);
    } finally {
      setLoading(false);
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

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date) => {
    return date.toDateString() === selectedDate.toDateString();
  };

  const isPast = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const getAvailableSlotsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return availableSlots.filter(slot => slot.date === dateStr).length;
  };

  const handleDateSelect = (date: Date) => {
    if (!isPast(date)) {
      setSelectedDate(date);
    }
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    onSlotSelect(slot, selectedDate);
  };

  const nextMonth = () => {
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1));
  };

  const prevMonth = () => {
    const newDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1);
    if (newDate >= new Date()) {
      setSelectedDate(newDate);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {/* Doctor Info */}
      <div className="flex items-center space-x-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
          {doctor.profileImage ? (
            <img 
              src={doctor.profileImage} 
              alt={`Dr. ${doctor.firstName}`}
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <User className="h-8 w-8 text-primary-600" />
          )}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">
            Dr. {doctor.firstName} {doctor.lastName}
          </h3>
          <p className="text-sm text-gray-600">{doctor.specialization}</p>
          <div className="flex items-center space-x-4 mt-2">
            <div className="flex items-center space-x-1">
              <Star className="h-4 w-4 text-yellow-500" />
              <span className="text-sm text-gray-700">{doctor.rating}</span>
            </div>
            <span className="text-sm text-gray-600">{doctor.experience} years exp.</span>
            <span className="text-sm font-medium text-primary-600">₹{doctor.consultationFee}</span>
          </div>
        </div>
      </div>

      {/* Consultation Mode Toggle */}
      <div className="flex items-center space-x-4 mb-6">
        <span className="text-sm font-medium text-gray-700">Consultation Mode:</span>
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setConsultationMode('ONLINE')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              consultationMode === 'ONLINE'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Video className="h-4 w-4 inline mr-2" />
            Online
          </button>
          <button
            onClick={() => setConsultationMode('IN_PERSON')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              consultationMode === 'IN_PERSON'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <MapPin className="h-4 w-4 inline mr-2" />
            In-Person
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Calendar */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Select Date</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={prevMonth}
                disabled={selectedDate.getMonth() === new Date().getMonth() && selectedDate.getFullYear() === new Date().getFullYear()}
                className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ←
              </button>
              <span className="text-sm font-medium text-gray-700 min-w-[120px] text-center">
                {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
              <button
                onClick={nextMonth}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                →
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                {day}
              </div>
            ))}
            
            {generateCalendarDays().map((date, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: date && !isPast(date) ? 1.05 : 1 }}
                className={`p-2 min-h-[60px] border border-gray-200 cursor-pointer ${
                  !date ? 'bg-gray-50' : 
                  isPast(date) ? 'bg-gray-100 cursor-not-allowed' :
                  'bg-white hover:bg-gray-50'
                } ${isToday(date!) ? 'ring-2 ring-primary-500' : ''} ${
                  isSelected(date!) ? 'bg-primary-50 border-primary-300' : ''
                }`}
                onClick={() => date && !isPast(date) && handleDateSelect(date)}
              >
                {date && (
                  <>
                    <div className={`text-sm font-medium mb-1 ${
                      isPast(date) ? 'text-gray-400' : 'text-gray-900'
                    }`}>
                      {date.getDate()}
                    </div>
                    {!isPast(date) && getAvailableSlotsForDate(date) > 0 && (
                      <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        {getAvailableSlotsForDate(date)} slots
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Time Slots */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Available Slots - {selectedDate.toLocaleDateString()}
            </h3>
            <Clock className="h-5 w-5 text-gray-400" />
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : availableSlots.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No available slots for this date</p>
              <p className="text-sm text-gray-400">Try selecting a different date</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
              <AnimatePresence>
                {availableSlots.map((slot, index) => (
                  <motion.button
                    key={slot.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleSlotSelect(slot)}
                    className="p-3 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors text-left"
                  >
                    <div className="font-medium text-gray-900">
                      {slot.startTime} - {slot.endTime}
                    </div>
                    <div className="text-sm text-gray-600">
                      {slot.isRecurring ? 'Recurring' : 'One-time'}
                    </div>
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Quick Tips */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Booking Tips</h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Slots are available for the next 30 days</li>
              <li>• Online consultations require stable internet</li>
              <li>• In-person consultations at clinic location</li>
              <li>• You can cancel up to 24 hours before</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
