'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { SearchIcon, UserIcon, CalendarIcon, StarIcon } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function HomePage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const features = [
    {
      icon: SearchIcon,
      title: 'Find Doctors',
      description: 'Discover qualified Ayurvedic doctors by specialization and availability'
    },
    {
      icon: CalendarIcon,
      title: 'Easy Booking',
      description: 'Book appointments with our smart slot management system'
    },
    {
      icon: UserIcon,
      title: 'Manage Appointments',
      description: 'View, reschedule, and cancel your consultations easily'
    },
    {
      icon: StarIcon,
      title: 'Expert Care',
      description: 'Get consultations from experienced Ayurvedic practitioners'
    }
  ];

  const specializations = [
    { name: 'General Ayurveda', icon: '🌿', description: 'General wellness and preventive care' },
    { name: 'Panchakarma', icon: '🧘', description: 'Detoxification and purification therapies' },
    { name: 'Rasayana', icon: '✨', description: 'Rejuvenation and anti-aging treatments' },
    { name: 'Kayachikitsa', icon: '🏥', description: 'Internal medicine and disease treatment' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="text-2xl font-bold text-primary-600">Amrutam</div>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <Link href="/dashboard" className="btn btn-primary">
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link href="/auth/login" className="btn btn-ghost">
                    Login
                  </Link>
                  <Link href="/auth/register" className="btn btn-primary">
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-6">
              Your Journey to
              <span className="text-primary-600"> Wellness </span>
              Starts Here
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Connect with experienced Ayurvedic doctors for personalized consultations, 
              holistic treatments, and a path to natural healing.
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mb-8">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search for doctors, specializations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/doctors" className="btn btn-primary text-lg px-8 py-3">
                Find Doctors
              </Link>
              <Link href="/auth/register" className="btn btn-outline text-lg px-8 py-3">
                Book Consultation
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose Amrutam?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We make Ayurvedic healthcare accessible, convenient, and personalized for everyone.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="h-8 w-8 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Specializations Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Our Specializations
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover the diverse range of Ayurvedic treatments and therapies available.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {specializations.map((spec, index) => (
              <motion.div
                key={spec.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="card hover:shadow-lg transition-shadow cursor-pointer"
              >
                <div className="card-content text-center">
                  <div className="text-4xl mb-3">{spec.icon}</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {spec.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {spec.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-primary-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Start Your Wellness Journey?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Join thousands of patients who have found natural healing through Ayurveda.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register" className="btn bg-white text-primary-600 hover:bg-gray-100">
              Get Started Today
            </Link>
            <Link href="/doctors" className="btn btn-outline border-white text-white hover:bg-white hover:text-primary-600">
              Browse Doctors
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="text-2xl font-bold text-primary-400 mb-4">Amrutam</div>
              <p className="text-gray-400">
                Your trusted partner in Ayurvedic healthcare and wellness.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Services</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Doctor Consultations</li>
                <li>Specialized Treatments</li>
                <li>Wellness Programs</li>
                <li>Health Assessments</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li>About Us</li>
                <li>Our Doctors</li>
                <li>Contact</li>
                <li>Privacy Policy</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Help Center</li>
                <li>FAQs</li>
                <li>Customer Care</li>
                <li>Feedback</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Amrutam. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
