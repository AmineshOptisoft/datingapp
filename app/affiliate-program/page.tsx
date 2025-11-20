'use client';

import Footer from '../components/Footer';
import Link from 'next/link';

export default function AffiliateProgramPage() {
  return (
    <div className="px-4 md:px-6 lg:px-8 py-4 md:py-6">
      {/* Hero Section */}
      <section className="mb-12 md:mb-16 text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 md:mb-8 bg-linear-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
          Become an Affiliate Partner
        </h1>
      </section>

      {/* Earn Commission Section */}
      <section className="mb-12 md:mb-16">
        <div className="bg-orange-50/5 backdrop-blur-sm border border-orange-500/20 rounded-3xl p-6 md:p-8 lg:p-10">
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-orange-600">
              Earn Up To 30% Commission
            </h2>
            <span className="px-4 md:px-6 py-2 md:py-3 bg-orange-500 text-white rounded-full text-sm font-semibold">
              High Commission
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
            {/* Commission Structure */}
            <div>
              <h3 className="text-xl md:text-2xl font-bold text-orange-600 mb-6">
                Commission Structure
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 shrink-0"></div>
                  <p className="text-zinc-300 text-sm md:text-base">
                    Up to 30% on premium subscriptions
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 shrink-0"></div>
                  <p className="text-zinc-300 text-sm md:text-base">
                    Commission on every sale
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 shrink-0"></div>
                  <p className="text-zinc-300 text-sm md:text-base">
                    No cap on earnings
                  </p>
                </div>
              </div>
            </div>

            {/* How It Works */}
            <div>
              <h3 className="text-xl md:text-2xl font-bold text-orange-600 mb-6">
                How It Works
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 shrink-0"></div>
                  <p className="text-zinc-300 text-sm md:text-base">
                    Get your unique coupon code
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 shrink-0"></div>
                  <p className="text-zinc-300 text-sm md:text-base">
                    Share with your audience
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 shrink-0"></div>
                  <p className="text-zinc-300 text-sm md:text-base">
                    Earn on every purchase
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Partner With Us Section */}
      <section className="mb-12 md:mb-16">
        <div className="bg-orange-50/5 backdrop-blur-sm border border-orange-500/20 rounded-3xl p-6 md:p-8 lg:p-10">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-orange-600 mb-8">
            Why Partner With Us?
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
            {/* Growing Market */}
            <div>
              <h3 className="text-xl md:text-2xl font-bold text-orange-600 mb-6">
                Growing Market
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 shrink-0"></div>
                  <p className="text-zinc-300 text-sm md:text-base">
                    Rapidly expanding AI companionship industry
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 shrink-0"></div>
                  <p className="text-zinc-300 text-sm md:text-base">
                    Increasing user demand
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 shrink-0"></div>
                  <p className="text-zinc-300 text-sm md:text-base">
                    High-value premium products
                  </p>
                </div>
              </div>
            </div>

            {/* Easy Tracking */}
            <div>
              <h3 className="text-xl md:text-2xl font-bold text-orange-600 mb-6">
                Easy Tracking
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 shrink-0"></div>
                  <p className="text-zinc-300 text-sm md:text-base">
                    Unique coupon codes
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 shrink-0"></div>
                  <p className="text-zinc-300 text-sm md:text-base">
                    Real-time sales tracking
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 shrink-0"></div>
                  <p className="text-zinc-300 text-sm md:text-base">
                    Monthly commission reports
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="mb-12 md:mb-16">
        <div className="bg-linear-to-r from-orange-600 to-orange-500 rounded-3xl p-8 md:p-12 lg:p-16 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 md:mb-6">
            Ready to Start Earning?
          </h2>
          <p className="text-white/90 text-base md:text-lg mb-6 md:mb-8 max-w-3xl mx-auto leading-relaxed">
            Email us at info@getidyll.in to get your unique coupon code and start earning commissions today.
          </p>
          <Link 
            href="/"
            className="inline-flex items-center gap-2 px-6 md:px-8 py-3 md:py-4 bg-white text-orange-600 rounded-full font-semibold text-sm md:text-base hover:bg-zinc-100 transition-all"
          >
            Return to Home
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}

