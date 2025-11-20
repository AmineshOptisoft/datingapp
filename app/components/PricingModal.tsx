'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';

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

  const formatTime = (num: number) => String(num).padStart(2, '0');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-5xl max-w-[95vw] p-0 overflow-hidden max-h-[90vh]">
        <div className="grid grid-cols-1 md:grid-cols-2 max-h-[90vh] overflow-y-auto">
          {/* Left Side - Image */}
          <div className="relative h-64 md:h-auto md:min-h-[600px] bg-linear-to-br from-pink-200 to-purple-200">
            <img
              src={profileImage || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&h=800&fit=crop'}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Right Side - Pricing */}
          <div className="p-6 md:p-8 flex flex-col">
            {/* Header */}
            <div className="mb-4">
              <DialogTitle className="text-2xl md:text-3xl font-bold text-purple-600 mb-2">
                Limited Time Offer
              </DialogTitle>
            </div>

            {/* Timer */}
            <div className="flex items-start justify-center gap-2 mb-6">
              {/* Hours */}
              <div className="flex flex-col items-center">
                <div className="bg-linear-to-br from-yellow-300 to-yellow-400 rounded-2xl px-3 py-2 min-w-[60px] shadow-lg">
                  <div className="text-3xl font-bold text-black text-center leading-tight">
                    {formatTime(timeLeft.hours)}
                  </div>
                </div>
                <div className="text-[10px] font-semibold text-gray-600 mt-1.5">HOURS</div>
              </div>

              <div className="text-2xl font-bold text-gray-400 mt-1">:</div>

              {/* Minutes */}
              <div className="flex flex-col items-center">
                <div className="bg-linear-to-br from-yellow-300 to-yellow-400 rounded-2xl px-3 py-2 min-w-[60px] shadow-lg">
                  <div className="text-3xl font-bold text-black text-center leading-tight">
                    {formatTime(timeLeft.minutes)}
                  </div>
                </div>
                <div className="text-[10px] font-semibold text-gray-600 mt-1.5">MINUTES</div>
              </div>

              <div className="text-2xl font-bold text-gray-400 mt-1">:</div>

              {/* Seconds */}
              <div className="flex flex-col items-center">
                <div className="bg-linear-to-br from-yellow-300 to-yellow-400 rounded-2xl px-3 py-2 min-w-[60px] shadow-lg">
                  <div className="text-3xl font-bold text-black text-center leading-tight">
                    {formatTime(timeLeft.seconds)}
                  </div>
                </div>
                <div className="text-[10px] font-semibold text-gray-600 mt-1.5">SECONDS</div>
              </div>
            </div>

            {/* Annual Deal */}
            <button className="w-full bg-linear-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 rounded-2xl p-5 mb-3 transition-all transform hover:scale-[1.02] shadow-xl">
              <div className="text-white text-center">
                <div className="text-base font-bold mb-1">ANNUAL DEAL</div>
                <div className="text-3xl font-bold mb-1">
                  $14.99 <span className="text-base font-normal">/yr</span>
                </div>
                <div className="text-xs opacity-90 leading-tight">
                  Save big with yearly access! Best value for long-term connections.
                </div>
              </div>
            </button>

            {/* Lifetime Deal */}
            <button className="w-full bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-2xl p-5 mb-3 transition-all transform hover:scale-[1.02] shadow-xl">
              <div className="text-white text-center">
                <div className="text-base font-bold mb-1">LIFETIME</div>
                <div className="text-3xl font-bold mb-1">
                  $24.99 <span className="text-base font-normal">/lifetime</span>
                </div>
                <div className="text-xs opacity-90 leading-tight">
                  Pay once, own forever! No recurring fees, unlimited access.
                </div>
              </div>
            </button>

            {/* Monthly Option */}
            <button className="w-full bg-gray-200 hover:bg-gray-300 rounded-2xl p-4 transition-all">
              <div className="text-gray-700 text-center font-semibold text-sm">
                Continue at 3.99/month
              </div>
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

