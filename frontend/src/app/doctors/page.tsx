'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Star, MapPin, Clock, User, Calendar } from 'lucide-react';
import Link from 'next/link';

interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  specialization: string;
  rating: number;
  experience: number;
  consultationFee: number;
  isAvailable: boolean;
  profileImage?: string;
}

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('');
  const [sortBy, setSortBy] = useState('rating');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const specializations = [
    'General Ayurveda',
    'Panchakarma',
    'Rasayana',
    'Kayachikitsa',
    'Shalya Tantra'
  ];

  useEffect(() => {
    fetchDoctors();
  }, [searchQuery, selectedSpecialization, sortBy, sortOrder]);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        search: searchQuery,
        specialization: selectedSpecialization,
        sortBy,
        sortOrder
      });

      const response = await fetch(`/api/doctors?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setDoctors(data.data);
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDoctors = doctors.filter(doctor => {
    const matchesSearch = doctor.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doctor.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doctor.specialization.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSpecialization = !selectedSpecialization || doctor.specialization === selectedSpecialization;
    
    return matchesSearch && matchesSpecialization;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-primary-600 mr-8">Amrutam</Link>
              <h1 className="text-xl font-semibold text-gray-900">Find Doctors</h1>
            </div>
            <Link href="/dashboard" className="btn btn-primary">
              Dashboard
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Doctors</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search by name, specialization..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Specialization Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Specialization</label>
              <select
                value={selectedSpecialization}
                onChange={(e) => setSelectedSpecialization(e.target.value)}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">All Specializations</option>
                {specializations.map(spec => (
                  <option key={spec} value={spec}>{spec}</option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="rating">Rating</option>
                <option value="experience">Experience</option>
                <option value="consultationFee">Fee</option>
                <option value="createdAt">Newest</option>
              </select>
            </div>
          </div>

          {/* Sort Order Toggle */}
          <div className="mt-4 flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">Sort Order:</span>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setSortOrder('desc')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  sortOrder === 'desc' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-600'
                }`}
              >
                High to Low
              </button>
              <button
                onClick={() => setSortOrder('asc')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  sortOrder === 'asc' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-600'
                }`}
              >
                Low to High
              </button>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            Found <span className="font-semibold text-gray-900">{filteredDoctors.length}</span> doctors
            {selectedSpecialization && ` in ${selectedSpecialization}`}
          </p>
        </div>

        {/* Doctors Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : filteredDoctors.length === 0 ? (
          <div className="text-center py-12">
            <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No doctors found</h3>
            <p className="text-gray-600">Try adjusting your search criteria or filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDoctors.map((doctor, index) => (
              <motion.div
                key={doctor.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  {/* Doctor Header */}
                  <div className="flex items-start space-x-4 mb-4">
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
                      <div className="flex items-center space-x-1 mt-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span className="text-sm text-gray-700">{doctor.rating}</span>
                        <span className="text-sm text-gray-500">({doctor.experience} years)</span>
                      </div>
                    </div>
                  </div>

                  {/* Doctor Details */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="h-4 w-4 mr-2" />
                      <span>Experience: {doctor.experience} years</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span>Available: {doctor.isAvailable ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="text-lg font-semibold text-primary-600">
                      ₹{doctor.consultationFee} per consultation
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3">
                    <Link
                      href={`/doctors/${doctor.id}`}
                      className="flex-1 btn btn-outline text-center"
                    >
                      View Profile
                    </Link>
                    <Link
                      href={`/doctors/${doctor.id}/book`}
                      className="flex-1 btn btn-primary text-center"
                    >
                      Book Appointment
                    </Link>
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
