'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, ArrowLeft, Stethoscope, User } from 'lucide-react';
import Link from 'next/link';

export default function DoctorLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const success = await login(email, password);
      if (success) {
        // Get user data from context to determine redirect
        const user = JSON.parse(localStorage.getItem('auth_tokens') || '{}');
        if (user.user?.role === 'DOCTOR') {
          router.push('/doctor/dashboard');
        } else if (user.user?.role === 'PATIENT') {
          router.push('/dashboard');
        } else if (user.user?.role === 'ADMIN') {
          router.push('/dashboard');
        } else {
          router.push('/dashboard');
        }
      } else {
        setError('Invalid email or password');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <Link href="/" className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
          
          <div className="text-3xl font-bold text-primary-600 mb-2">Amrutam</div>
          <div className="flex items-center justify-center mb-4">
            <Stethoscope className="h-8 w-8 text-primary-600 mr-3" />
            <h2 className="text-3xl font-bold text-gray-900">Doctor Portal</h2>
          </div>
          <p className="text-sm text-gray-600">
            Access your medical dashboard and manage patient consultations
          </p>
        </motion.div>

        {/* Login Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-lg shadow-lg p-8"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Professional Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter your professional email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn btn-primary py-3 text-lg font-medium disabled:opacity-50"
            >
              {loading ? 'Accessing Portal...' : 'Access Doctor Portal'}
            </button>

            {/* Links */}
            <div className="text-center space-y-2">
              <Link href="/auth/forgot-password" className="text-sm text-primary-600 hover:text-primary-700">
                Forgot your password?
              </Link>
              <div className="text-sm text-gray-600">
                Don't have a doctor account?{' '}
                <Link href="/auth/register" className="text-primary-600 hover:text-primary-700 font-medium">
                  Register here
                </Link>
              </div>
            </div>
          </form>
        </motion.div>

        {/* Demo Credentials */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-blue-50 border border-blue-200 rounded-lg p-4"
        >
          <h3 className="text-sm font-medium text-blue-900 mb-2">Demo Doctor Credentials:</h3>
          <div className="text-xs text-blue-800 space-y-1">
            <div><strong>Dr. Sharma:</strong> dr.sharma@amrutam.com / doctor123</div>
            <div><strong>Dr. Patel:</strong> dr.patel@amrutam.com / doctor123</div>
            <div><strong>Dr. Kumar:</strong> dr.kumar@amrutam.com / doctor123</div>
            <div><strong>Dr. Reddy:</strong> dr.reddy@amrutam.com / doctor123</div>
          </div>
        </motion.div>

        {/* Role Selection */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-center"
        >
          <p className="text-sm text-gray-600 mb-2">Are you a patient?</p>
          <Link href="/auth/patient-login" className="text-primary-600 hover:text-primary-700 font-medium">
            Access Patient Portal
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
