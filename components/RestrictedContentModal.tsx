'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Lock, Sparkles, MessageCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface RestrictedContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  profileId: string;
  characterName: string;
  price: number;
  avatar?: string;
}

export default function RestrictedContentModal({
  isOpen,
  onClose,
  profileId,
  characterName,
  price,
  avatar
}: RestrictedContentModalProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      // Create checkout session for monthly plan
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          aiProfileId: profileId,
          planType: 'monthly', // Default to monthly for restricted content unlock
        }),
      });

      const data = await response.json();

      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        console.error('Failed to create checkout session:', data.message);
        alert(data.message || 'Failed to initiate checkout. Please try again.');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error handling subscription:', error);
      alert('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden border-none bg-black text-white h-[600px] flex flex-col">
        {/* Background Image */}
        {avatar && (
            <div className="absolute inset-0 z-0">
            <img 
                src={avatar} 
                alt={characterName} 
                className="w-full h-full object-cover"
            />
            {/* Gradient Overlay - Mainly at the bottom */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent via-50%" />
            </div>
        )}

        {/* Close Button styling if needed, usually handled by Dialog primitive but we can ensure z-index */}
        
        <div className="relative z-10 flex flex-col justify-end h-full p-6 pb-8">
            
            <div className="flex flex-col items-center text-center space-y-4 animate-in slide-in-from-bottom-10 duration-500">
                <div className="mb-2 p-3 rounded-full bg-pink-500/20 text-pink-500 ring-1 ring-pink-500/40 backdrop-blur-sm shadow-[0_0_15px_rgba(236,72,153,0.3)]">
                    <Lock className="w-6 h-6" />
                </div>

                <div>
                    <DialogTitle className="text-2xl font-bold mb-2 drop-shadow-md">
                        Restricted Content Detected
                    </DialogTitle>
                    
                    <DialogDescription className="text-gray-200 font-medium drop-shadow-sm leading-relaxed max-w-xs mx-auto">
                        To continue intimate conversations with <span className="text-white font-bold">{characterName}</span>, subscribe to their plan.
                    </DialogDescription>
                </div>

                <div className="w-full bg-gray-900/40 backdrop-blur-md p-4 rounded-xl border border-white/10 shadow-xl">
                    <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold text-white/90">{characterName}'s Plan</span>
                        <span className="text-xl font-bold text-pink-400">${price.toFixed(2)}<span className="text-xs text-gray-400 font-normal">/mo</span></span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-300/90 font-medium">
                        <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                        <span>Unlocks NSFW & Unfiltered Chat</span>
                    </div>
                </div>

                <div className="w-full mt-2">
                    <button
                        onClick={handleSubscribe}
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-pink-500/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <MessageCircle className="w-5 h-5 fill-current" />
                        {loading ? 'Processing...' : 'Unlock Full Chat Access'}
                    </button>
                </div>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
