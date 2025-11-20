'use client';

import { useState } from 'react';
import Footer from '../components/Footer';
import FAQSection, { type FAQItem } from '../components/FAQSection';
import Link from 'next/link';

export default function MonetizePage() {
  const [subscribers, setSubscribers] = useState(100);
  const [price, setPrice] = useState(15);

  const monthlyEarnings = subscribers * price * 0.7;
  const yearlyEarnings = monthlyEarnings * 12;

  const faqs: FAQItem[] = [
    {
      question: 'How much does OnlyFans pay compared to Idyll for AI content?',
      answer: 'Top AI creators on Idyll make thousands a month with a 70% revenue share and subscriptions of $10-$100/month. This is significantly higher than traditional platforms. Your earnings depend on fan interaction and the quality of your AI models female characters or custom personalities.',
    },
    {
      question: 'Do I need technical skills to create AI generated models?',
      answer: 'Not at all. Idyll is creator-friendly with no coding required. Whether you want to create AI models female characters or custom personas, it\'s simple and straightforward with no headaches when setting it up.',
    },
    {
      question: 'Does OnlyFans take PayPal and do you?',
      answer: 'Yes! We accept PayPal for weekly payouts, along with bank transfers. You receive payments weekly with no secrets and clear reporting on all your earnings.',
    },
    {
      question: 'What is the best way to advertise my AI influencer?',
      answer: 'Use platforms like Instagram, Discord, Reddit, or X (Twitter). Target audiences searching for \'AI OnlyFans\' or \'OnlyFans creators near me\' to capture traffic from people looking for AI content creators. Collaborate with other creators and use relevant hashtags to grow your reach.',
    },
    {
      question: 'Is this a full-time opportunity?',
      answer: 'Yes, AI-powered system is working to establish long-term streams of income with many creators.',
    },
    {
      question: 'Can I customize my AI influencer\'s personality and appearance?',
      answer: 'Yes! There is full-fledged customization of your AI models female or custom characters including personality, look, and voice to match your style or brand. The more unique and interesting your AI generated models are, the better they\'ll engage with fans and drive subscriptions.',
    },
    {
      question: 'Can I have a following so big I can begin earning?',
      answer: 'Not at all. Even the creators who have fewer followers can begin to earn. Fans can be attracted by AI influencers, and the more your fans interact with your AI, the more you are going to earn.',
    },
    {
      question: 'What is the fastest time to make money?',
      answer: 'Your AI influencer can be ready to make money immediately after launching and gaining followers or interacting with them. There are creators who make their first income in a few days.',
    },
    {
      question: 'Does it have any secret charges or expenses?',
      answer: 'No hidden fees. All you have to do is have a gadget that will make and control your AI influencer. Revenue share is open, and all the earnings are well-reported.',
    },
    {
      question: 'Is it possible to operate several AI influencers simultaneously?',
      answer: 'Yes! It is possible to build several AI influencers and operate them at the same time. It is possible to have your own personality and subscriptions, and fan base with each, increasing your potential income.',
    },
    {
      question: 'How does Idyll compare to Fanvue and other platforms?',
      answer: 'Based on Fanvue reviews and creator feedback, Idyll offers better revenue share, better AI technology for AI generated models, and more creator-friendly tools. We\'re specifically designed for AI content, while platforms like OnlyFans and Fanvue are adapting. Many creators ask \'what is Fanvue\' or look for alternatives—Idyll is purpose-built for AI creators from day one.',
    },
    {
      question: 'Does OnlyFans allow AI content and can I use your platform instead?',
      answer: 'While OnlyFans\' policy on AI content varies, Idyll is specifically designed for AI generated models and AI creators. You get better tools, higher payouts, and a platform built for AI influencers. Sign up just like an OnlyFans creator sign up process, but with features tailored for AI content creation.',
    },
  ];

  return (
    <div className="px-4 md:px-6 lg:px-8 py-4 md:py-6">
      {/* Hero Section */}
      <section className="mb-16 md:mb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left Content */}
          <div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
              <span className="font-serif italic">Make Money as an</span>
              <br />
              <span className="font-black italic">AI Influencer</span>
            </h1>
            <p className="text-base md:text-lg text-zinc-300 mb-8 leading-relaxed">
              Idyll is the place where AI creators, AI generated models, and AI influencers transform online creativity into actual revenue.
            </p>

            {/* Feature Pills */}
            <div className="grid grid-cols-2 gap-3 mb-8">
              <div className="bg-zinc-900/50 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3 flex items-center gap-2">
                <span className="text-lg">💰</span>
                <span className="text-sm font-semibold text-white">70% Commission</span>
              </div>
              <div className="bg-zinc-900/50 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3 flex items-center gap-2">
                <span className="text-lg">🚀</span>
                <span className="text-sm font-semibold text-white">Instant Launch</span>
              </div>
              <div className="bg-zinc-900/50 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3 flex items-center gap-2">
                <span className="text-lg">🎤</span>
                <span className="text-sm font-semibold text-white">AI Voice Tech</span>
              </div>
              <div className="bg-zinc-900/50 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3 flex items-center gap-2">
                <span className="text-lg">📈</span>
                <span className="text-sm font-semibold text-white">Unlimited Scale</span>
              </div>
            </div>

            <Link
              href="/"
              className="inline-block w-full sm:w-auto px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-full font-semibold text-center transition-all"
            >
              Start Creating Now
            </Link>
          </div>

          {/* Right Content - Phone Mockup */}
          <div className="relative">
            <div className="relative mx-auto max-w-sm">
              {/* Phone Frame */}
              <div className="bg-zinc-900 rounded-[3rem] p-4 border-8 border-zinc-800 shadow-2xl">
                <div className="bg-zinc-950 rounded-[2.5rem] overflow-hidden">
                  {/* Phone Content */}
                  <div className="relative">
                    {/* Header Image */}
                    <div className="h-48 bg-gradient-to-b from-blue-400 to-blue-300 relative">
                      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=400')] bg-cover bg-center opacity-80"></div>
                    </div>

                    {/* Profile Section */}
                    <div className="px-4 pb-4">
                      <div className="flex items-end gap-3 -mt-12 mb-4">
                        <div className="relative">
                          <div className="w-24 h-24 rounded-full border-4 border-zinc-950 overflow-hidden bg-zinc-800">
                            <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200')] bg-cover bg-center"></div>
                          </div>
                          <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-zinc-950"></div>
                        </div>
                        <button className="px-4 py-1.5 bg-white text-black rounded-full text-xs font-semibold flex items-center gap-1.5">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                          </svg>
                          CALL ME NOW
                        </button>
                      </div>

                      <div className="mb-3">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-white font-semibold text-base">Sarah Landers</h3>
                          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <p className="text-zinc-400 text-xs">@sarah_landers</p>
                      </div>

                      <div className="flex gap-4 text-xs text-zinc-300 mb-3">
                        <div className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                          </svg>
                          <span>247</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                          </svg>
                          <span>89</span>
                        </div>
                      </div>

                      <p className="text-zinc-300 text-xs mb-4 leading-relaxed">
                        Your virtual companion with a passion for art, music, and deep conversations. Let's explore the world together! ✨
                      </p>

                      <button className="w-full py-3 bg-purple-600 text-white rounded-xl font-semibold text-sm mb-2">
                        Subscribe for $14.99/month
                      </button>

                      {/* Features Grid */}
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div className="flex items-center gap-1.5 text-zinc-400">
                          <div className="w-1 h-1 bg-purple-500 rounded-full"></div>
                          <span>Unlimited voice talk</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-zinc-400">
                          <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                          <span>24/7 available</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-zinc-400">
                          <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                          <span>Remembers you</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-zinc-400">
                          <div className="w-1 h-1 bg-pink-500 rounded-full"></div>
                          <span>View exclusive content</span>
                        </div>
                      </div>

                      {/* Bottom Nav */}
                      <div className="flex justify-around mt-4 pt-3 border-t border-zinc-800">
                        <div className="text-center">
                          <div className="w-8 h-8 mx-auto mb-1 flex items-center justify-center">
                            <svg className="w-5 h-5 text-zinc-500" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                            </svg>
                          </div>
                          <p className="text-[9px] text-zinc-500">Subscribe<br />to Unlock</p>
                        </div>
                        <div className="text-center">
                          <div className="w-8 h-8 mx-auto mb-1 flex items-center justify-center">
                            <svg className="w-5 h-5 text-zinc-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <p className="text-[9px] text-zinc-500">Subscribe<br />to Unlock</p>
                        </div>
                        <div className="text-center">
                          <div className="w-8 h-8 mx-auto mb-1 flex items-center justify-center">
                            <svg className="w-5 h-5 text-zinc-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <p className="text-[9px] text-zinc-500">Subscribe<br />to Unlock</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Join Creator Economy */}
      <section className="mb-16 md:mb-20 text-center">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
          Join the AI Creator Economy
        </h2>
      </section>

      {/* Feature Pills Row */}
      <section className="mb-16 md:mb-20">
        <div className="flex flex-wrap justify-center gap-3 md:gap-4">
          <span className="px-4 md:px-6 py-2 md:py-3 bg-green-100 text-green-800 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-2">
            <span className="w-2 h-2 bg-green-600 rounded-full"></span>
            Advanced Voice Technology
          </span>
          <span className="px-4 md:px-6 py-2 md:py-3 bg-blue-100 text-blue-800 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
            70% Revenue Share
          </span>
          <span className="px-4 md:px-6 py-2 md:py-3 bg-purple-100 text-purple-800 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-2">
            <span className="w-2 h-2 bg-purple-600 rounded-full"></span>
            Global Reach
          </span>
        </div>
      </section>

      {/* Calculator Section */}
      <section className="mb-16 md:mb-20">
        <div className="bg-zinc-950 rounded-3xl overflow-hidden">
          <div className="bg-linear-to-r from-purple-600 to-pink-600 p-8 md:p-12 text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
              Turn Your AI Vision Into Cash - 70% Revenue Share
            </h2>
            <p className="text-white/90 text-sm md:text-base max-w-2xl mx-auto">
              Calculate your potential monthly earnings based on subscription revenue
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 p-8 md:p-12">
            {/* Left - Phone Preview (hidden on mobile) */}
            <div className="hidden lg:flex items-center justify-center">
              <div className="relative">
                <div className="bg-zinc-900 rounded-[2.5rem] p-3 border-4 border-zinc-800 shadow-2xl max-w-xs">
                  <div className="bg-zinc-950 rounded-[2rem] overflow-hidden">
                    <div className="relative">
                      <div className="h-40 bg-gradient-to-b from-blue-400 to-blue-300 relative">
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=400')] bg-cover bg-center opacity-80"></div>
                      </div>
                      <div className="px-4 pb-4">
                        <div className="flex items-end gap-2 -mt-10 mb-3">
                          <div className="relative">
                            <div className="w-20 h-20 rounded-full border-4 border-zinc-950 overflow-hidden bg-zinc-800">
                              <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200')] bg-cover bg-center"></div>
                            </div>
                            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-zinc-950"></div>
                          </div>
                          <button className="px-3 py-1 bg-white text-black rounded-full text-[10px] font-semibold flex items-center gap-1">
                            <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                            </svg>
                            CALL ME NOW
                          </button>
                        </div>
                        <div className="mb-2">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <h3 className="text-white font-semibold text-sm">Sarah Landers</h3>
                            <svg className="w-3.5 h-3.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <p className="text-zinc-400 text-[10px]">@sarah_landers</p>
                        </div>
                        <div className="flex gap-3 text-[10px] text-zinc-300 mb-2">
                          <span>👥 247</span>
                          <span>❤️ 89</span>
                        </div>
                        <p className="text-zinc-300 text-[10px] mb-3 leading-relaxed">
                          Your virtual companion with a passion for art, music, and deep conversations. Let's explore the world together! ✨
                        </p>
                        <button className="w-full py-2.5 bg-purple-600 text-white rounded-lg font-semibold text-xs">
                          Subscribe for ${price.toFixed(2)}/month
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right - Calculator */}
            <div>
              <div className="bg-green-500 text-black p-4 rounded-xl mb-6 text-center">
                <p className="text-sm md:text-base font-semibold">
                  🎉 Sign up this month to take away 100% earnings for the first month. No commissions! 🎉
                </p>
              </div>

              {/* Monthly Subscribers Slider */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-zinc-300 text-sm font-semibold flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                    </svg>
                    Monthly Subscribers
                  </label>
                  <span className="text-white font-bold text-lg">{subscribers}</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="200"
                  value={subscribers}
                  onChange={(e) => setSubscribers(Number(e.target.value))}
                  className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer slider"
                  style={{
                    background: `linear-gradient(to right, #a855f7 0%, #a855f7 ${((subscribers - 5) / 195) * 100}%, #27272a ${((subscribers - 5) / 195) * 100}%, #27272a 100%)`
                  }}
                />
                <div className="flex justify-between text-xs text-zinc-500 mt-1">
                  <span>5</span>
                  <span>100</span>
                  <span>200+</span>
                </div>
              </div>

              {/* Average Subscription Price Slider */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-zinc-300 text-sm font-semibold flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                    </svg>
                    Average Subscription Price
                  </label>
                  <span className="text-white font-bold text-lg">${price}</span>
                </div>
                <input
                  type="range"
                  min="8"
                  max="100"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer slider"
                  style={{
                    background: `linear-gradient(to right, #ec4899 0%, #ec4899 ${((price - 8) / 92) * 100}%, #27272a ${((price - 8) / 92) * 100}%, #27272a 100%)`
                  }}
                />
                <div className="flex justify-between text-xs text-zinc-500 mt-1">
                  <span>$8</span>
                  <span>$15</span>
                  <span>$100+</span>
                </div>
              </div>

              {/* Earnings Display */}
              <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
                <h3 className="text-xl font-bold text-white mb-6 text-center">Your Potential Earnings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-4 border-b border-zinc-800">
                    <span className="text-zinc-400 font-medium">Monthly</span>
                    <span className="text-2xl md:text-3xl font-bold text-white">
                      ${monthlyEarnings.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-4">
                    <span className="text-zinc-400 font-medium">Yearly</span>
                    <span className="text-2xl md:text-3xl font-bold text-white">
                      ${yearlyEarnings.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>
              </div>

              <button className="w-full mt-6 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-all">
                Start Earning Now
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Our Platform */}
      <section className="mb-16 md:mb-20">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
            Why Choose Our Platform
          </h2>
          <p className="text-zinc-300 text-sm md:text-base max-w-3xl mx-auto">
            Everything you need to build a successful AI influencer business
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1 */}
          <div className="bg-zinc-900/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-pink-500/30 transition-all">
            <h3 className="text-lg font-bold mb-3">
              <span className="text-pink-500">24/7</span>
            </h3>
            <p className="text-zinc-300 text-sm leading-relaxed">
              The AI creators are available 24/7, including fans and followers wherever they are, and multiplying your earning capabilities to the fullest.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-zinc-900/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-purple-500/30 transition-all">
            <h3 className="text-lg font-bold mb-3">
              <span className="text-purple-500">Global Presence</span>
            </h3>
            <p className="text-zinc-300 text-sm leading-relaxed">
              Reach fans everywhere around the world and expand your audience beyond borders. Your AI models female and custom characters are made available to millions of individuals globally.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-zinc-900/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-blue-500/30 transition-all">
            <h3 className="text-lg font-bold mb-3">
              <span className="text-blue-500">AI Companionship</span>
            </h3>
            <p className="text-zinc-300 text-sm leading-relaxed">
              Give incredibly personalized experiences through AI companions with AI companions that are entertaining, engaging, and captivating and it is geared towards building something that the user cannot experience elsewhere.
            </p>
          </div>

          {/* Card 4 */}
          <div className="bg-zinc-900/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-green-500/30 transition-all">
            <h3 className="text-lg font-bold mb-3">
              <span className="text-green-500">Turn Your AI Vision into Cash</span>
            </h3>
            <p className="text-zinc-300 text-sm leading-relaxed">
              Build your AI models without code and monetization. You set your price, sell your AI influencer and receive up to 70 percent of the revenues of your work.
            </p>
          </div>
        </div>
      </section>

      {/* Why Creators Choose Idyll */}
      <section className="mb-16 md:mb-20">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
            Why Creators Choose Idyll
          </h2>
        </div>

        <div className="bg-zinc-900/30 backdrop-blur-sm border border-white/10 rounded-3xl p-8 md:p-12">
          <p className="text-zinc-300 text-sm md:text-base leading-relaxed mb-6">
            With AI Voice & Memory Technology, your AI models female characters feel more human than ever—responding with emotion, memory, and realistic voices that keep fans truly engaged. Your AI influencer never sleeps, connecting with people around the world 24/7 and earning even when you're offline. Thanks to Automated Monetization, every chat, call, or interaction becomes real income. It's like AI OnlyFans but with better creator tools and higher payouts. Experience the next era of digital connection where your AI doesn't just interact, it earns for you effortlessly, day and night.
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="mb-16 md:mb-20">
        <div className="bg-zinc-950 rounded-3xl overflow-hidden">
          <div className="bg-linear-to-r from-purple-600 to-pink-600 p-8 md:p-16 text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Start Your AI Influencer Empire?
            </h2>
            <p className="text-white/90 text-sm md:text-base max-w-2xl mx-auto mb-8">
              Start building your subscription-based AI influencer business today with our advanced voice AI technology and creator-friendly platform.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-4xl mx-auto mb-8">
              <div className="text-center">
                <div className="w-2 h-2 bg-green-400 rounded-full mx-auto mb-2"></div>
                <p className="text-white text-xs md:text-sm">Creator dashboard access</p>
              </div>
              <div className="text-center">
                <div className="w-2 h-2 bg-pink-400 rounded-full mx-auto mb-2"></div>
                <p className="text-white text-xs md:text-sm">24/7 support</p>
              </div>
              <div className="text-center">
                <div className="w-2 h-2 bg-blue-400 rounded-full mx-auto mb-2"></div>
                <p className="text-white text-xs md:text-sm">AI character builder</p>
              </div>
              <div className="text-center">
                <div className="w-2 h-2 bg-purple-400 rounded-full mx-auto mb-2"></div>
                <p className="text-white text-xs md:text-sm">Marketing toolkit</p>
              </div>
              <div className="text-center">
                <div className="w-2 h-2 bg-purple-400 rounded-full mx-auto mb-2"></div>
                <p className="text-white text-xs md:text-sm">Weekly payouts</p>
              </div>
              <div className="text-center">
                <div className="w-2 h-2 bg-cyan-400 rounded-full mx-auto mb-2"></div>
                <p className="text-white text-xs md:text-sm">Performance analytics</p>
              </div>
            </div>

            <button className="px-8 py-4 bg-purple-700 hover:bg-purple-800 text-white rounded-full font-semibold text-base md:text-lg transition-all mb-4">
              Become a Creator
            </button>

            <p className="text-white/70 text-xs md:text-sm">
              Free to join - only pay when you earn. No upfront costs or hidden fees.
            </p>
          </div>
        </div>
      </section>

      {/* Description Section */}
      <section className="mb-16 md:mb-20">
        <div className="max-w-4xl mx-auto space-y-6 text-zinc-300 text-sm md:text-base leading-relaxed">
          <p>
            Start earning on Idyll, the easiest and fastest platform for AI girlfriends and AI generated models. In just a few minutes, you can complete the OnlyFans creator sign up equivalent process, build and customize your own AI influencer, set prices for chats, calls, or exclusive content, and share your link on social media to reach fans across the world.
          </p>

          <p>
            Becoming an AI creator is quick and effortless. Sign up for free (similar to how OnlyFans allows AI content creators) and design your own AI models female or fully custom characters, with no coding or tech skills needed! Choose how you want to earn—set monthly subscriptions or per-chat pricing, then promote your AI influencer online to attract fans. Many search for 'OnlyFans creators near me' or 'AI OnlyFans' alternatives. The best part? You keep up to 70% of your earnings. Plus, we accept PayPal for payouts (many ask 'does OnlyFans take PayPal'—we do!), just like top creators on platforms such as Fanvue or OnlyFans.
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <FAQSection faqs={faqs} />

      {/* Footer */}
      <Footer />
    </div>
  );
}

