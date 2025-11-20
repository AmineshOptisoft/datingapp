'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup' | 'forgot';
}

export default function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { login } = useAuth();
  const router = useRouter();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    if (!email) {
      setError('Email is required');
      setIsLoading(false);
      return;
    }

    if (mode !== 'forgot' && !password) {
      setError('Password is required');
      setIsLoading(false);
      return;
    }

    if (mode === 'signup') {
      if (!name) {
        setError('Name is required');
        setIsLoading(false);
        return;
      }

      if (!phoneNumber) {
        setError('Phone number is required');
        setIsLoading(false);
        return;
      }

      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        setIsLoading(false);
        return;
      }
    }

    // Real login using backend API so AuthContext + SocketProvider get updated
    if (mode === 'login') {
      try {
        await login(email, password);
        setSuccess('Login successful!');
        setIsLoading(false);
        setTimeout(() => {
          onClose();
        }, 500);
      } catch (err: any) {
        setError(err.message || 'Login failed');
        setIsLoading(false);
      }
      return;
    }

    if (mode === 'signup') {
      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            email,
            phoneNumber,
            password,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          setSuccess(data.message || 'Account created successfully! Please verify your account.');
          setIsLoading(false);

          const userId = data.data?.userId;
          const query = new URLSearchParams({
            email,
            phone: phoneNumber,
            ...(userId ? { userId } : {}),
          }).toString();

          router.push(`/verify?${query}`);
          onClose();
        } else {
          setError(data.message || 'Registration failed');
          setIsLoading(false);
        }
      } catch (err: any) {
        setError(err.message || 'Registration failed');
        setIsLoading(false);
      }
      return;
    }

    // Keep signup / forgot as simple client-side flows for now
    if (mode === 'forgot') {
      setTimeout(() => {
        setSuccess('Password reset link sent to your email!');
        setIsLoading(false);
        setTimeout(() => {
          setMode('login');
          setSuccess('');
        }, 2000);
      }, 1500);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setName('');
    setPhoneNumber('');
    setError('');
    setSuccess('');
  };

  const switchMode = (newMode: 'login' | 'signup' | 'forgot') => {
    resetForm();
    setMode(newMode);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-800">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Modal Content */}
        <div className="p-8">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-10 h-10 bg-white rounded flex items-center justify-center">
              <span className="text-black font-bold text-lg">🖼️</span>
            </div>
            <span className="text-white font-bold text-2xl">IDYLL</span>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-white text-center mb-2">
            {mode === 'login' && 'Welcome Back'}
            {mode === 'signup' && 'Create Account'}
            {mode === 'forgot' && 'Reset Password'}
          </h2>
          <p className="text-zinc-400 text-center mb-6">
            {mode === 'login' && 'Login to access your AI companions'}
            {mode === 'signup' && 'Join thousands of satisfied users'}
            {mode === 'forgot' && 'Enter your email to reset password'}
          </p>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-4 p-3 bg-green-500/10 border border-green-500/50 rounded-lg text-green-400 text-sm">
              {success}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Field (Signup only) */}
            {mode === 'signup' && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-zinc-300 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                  placeholder="John Doe"
                  disabled={isLoading}
                />
              </div>
            )}

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                placeholder="you@example.com"
                disabled={isLoading}
              />
            </div>

            {/* Phone Number Field (Signup only) */}
            {mode === 'signup' && (
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-zinc-300 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                  placeholder="+1234567890"
                  disabled={isLoading}
                />
                <p className="text-xs text-zinc-500 mt-1">Include country code (e.g., +1 for US)</p>
              </div>
            )}

            {/* Password Field (Login & Signup) */}
            {mode !== 'forgot' && (
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-zinc-300 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                  disabled={isLoading}
                />
              </div>
            )}

            {/* Forgot Password Link (Login only) */}
            {mode === 'login' && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => switchMode('forgot')}
                  className="text-sm text-pink-400 hover:text-pink-300 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-pink-600 hover:bg-pink-700 disabled:bg-pink-800 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  {mode === 'login' && 'Login'}
                  {mode === 'signup' && 'Create Account'}
                  {mode === 'forgot' && 'Send Reset Link'}
                </>
              )}
            </button>
          </form>

          {/* Switch Mode Links */}
          <div className="mt-6 text-center">
            {mode === 'login' && (
              <p className="text-zinc-400 text-sm">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('signup')}
                  className="text-pink-400 hover:text-pink-300 font-medium transition-colors"
                >
                  Sign up
                </button>
              </p>
            )}
            {mode === 'signup' && (
              <p className="text-zinc-400 text-sm">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="text-pink-400 hover:text-pink-300 font-medium transition-colors"
                >
                  Login
                </button>
              </p>
            )}
            {mode === 'forgot' && (
              <p className="text-zinc-400 text-sm">
                Remember your password?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="text-pink-400 hover:text-pink-300 font-medium transition-colors"
                >
                  Back to login
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
