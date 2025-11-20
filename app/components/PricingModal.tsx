'use client';

import { useState, useEffect } from 'react';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  profileImage?: string;
}

export default function PricingModal({ isOpen, onClose, profileImage }: PricingModalProps) {
  const [timeLeft, setTimeLeft] = useState({
    hours: 4,
    minutes: 59,
    seconds: 38,
  });

  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        let { hours, minutes, seconds } = prevTime;

        if (seconds > 0) {
          seconds--;
        } else if (minutes > 0) {
          minutes--;
          seconds = 59;
        } else if (hours > 0) {
          hours--;
          minutes = 59;
          seconds = 59;
        } else {
          // Reset timer when it reaches 0
          hours = 4;
          minutes = 59;
          seconds = 38;
        }

        return { hours, minutes, seconds };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const formatTime = (num: number) => String(num).padStart(2, '0');

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      style={{ animation: 'fadeIn 0.2s ease-out' }}
    >
      <div 
        className="relative w-full max-w-4xl bg-white rounded-3xl overflow-hidden shadow-2xl"
        style={{ animation: 'scaleIn 0.3s ease-out' }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center bg-purple-600 hover:bg-purple-700 text-white rounded-full transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Left Side - Image */}
          <div className="relative h-64 md:h-auto bg-gradient-to-br from-pink-200 to-purple-200">
            <img
              src={profileImage || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&h=800&fit=crop'}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Right Side - Pricing */}
          <div className="p-6 md:p-8">
            {/* Header */}
            <div className="mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-purple-600 mb-2">
                Limited Time Offer
              </h2>
            </div>

            {/* Timer */}
            <div className="flex items-center justify-center gap-3 mb-8">
              {/* Hours */}
              <div className="flex flex-col items-center">
                <div className="bg-gradient-to-br from-yellow-300 to-yellow-400 rounded-2xl px-4 py-3 min-w-[70px] shadow-lg">
                  <div className="text-3xl md:text-4xl font-bold text-black text-center">
                    {formatTime(timeLeft.hours)}
                  </div>
                </div>
                <div className="text-xs font-semibold text-gray-600 mt-2">HOURS</div>
              </div>

              <div className="text-3xl font-bold text-gray-400 mb-6">:</div>

              {/* Minutes */}
              <div className="flex flex-col items-center">
                <div className="bg-gradient-to-br from-yellow-300 to-yellow-400 rounded-2xl px-4 py-3 min-w-[70px] shadow-lg">
                  <div className="text-3xl md:text-4xl font-bold text-black text-center">
                    {formatTime(timeLeft.minutes)}
                  </div>
                </div>
                <div className="text-xs font-semibold text-gray-600 mt-2">MINUTES</div>
              </div>

              <div className="text-3xl font-bold text-gray-400 mb-6">:</div>

              {/* Seconds */}
              <div className="flex flex-col items-center">
                <div className="bg-gradient-to-br from-yellow-300 to-yellow-400 rounded-2xl px-4 py-3 min-w-[70px] shadow-lg">
                  <div className="text-3xl md:text-4xl font-bold text-black text-center">
                    {formatTime(timeLeft.seconds)}
                  </div>
                </div>
                <div className="text-xs font-semibold text-gray-600 mt-2">SECONDS</div>
              </div>
            </div>

            {/* Annual Deal */}
            <button className="w-full bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 rounded-2xl p-6 mb-4 transition-all transform hover:scale-105 shadow-xl">
              <div className="text-white text-center">
                <div className="text-lg font-bold mb-2">ANNUAL DEAL</div>
                <div className="text-4xl font-bold mb-2">
                  $14.99 <span className="text-lg font-normal">/yr</span>
                </div>
                <div className="text-sm opacity-90">
                  Save big with yearly access! Best value for long-term connections.
                </div>
              </div>
            </button>

            {/* Lifetime Deal */}
            <button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-2xl p-6 mb-4 transition-all transform hover:scale-105 shadow-xl">
              <div className="text-white text-center">
                <div className="text-lg font-bold mb-2">LIFETIME</div>
                <div className="text-4xl font-bold mb-2">
                  $24.99 <span className="text-lg font-normal">/lifetime</span>
                </div>
                <div className="text-sm opacity-90">
                  Pay once, own forever! No recurring fees, unlimited access.
                </div>
              </div>
            </button>

            {/* Monthly Option */}
            <button className="w-full bg-gray-200 hover:bg-gray-300 rounded-2xl p-4 transition-all">
              <div className="text-gray-700 text-center font-semibold">
                Continue at 3.99/month
              </div>
            </button>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

