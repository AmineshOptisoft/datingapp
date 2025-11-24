'use client';

import Footer from '../components/Footer';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen px-4 md:px-6 lg:px-8 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
            Privacy Policy
          </h1>
          <p className="text-zinc-400">
            <strong>Effective Date:</strong> November 21, 2025
          </p>
        </div>

        {/* Content */}
        <div className="space-y-12 mb-16">
          {/* Section 1 */}
          <section className="bg-zinc-900/30 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8">
            <h2 className="text-2xl font-bold text-white mb-4">1. Introduction</h2>
            <div className="text-zinc-300 leading-relaxed space-y-4">
              <p>
                Welcome to Idyll ("we," "our," or "us"). Idyll is an AI Virtual Girlfriend & Boyfriend platform that provides real-time voice conversations with AI companions. We are committed to protecting your privacy and ensuring the security of your personal information.
              </p>
              <p>
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website, mobile application, and services (collectively, the "Service").
              </p>
            </div>
          </section>

          {/* Section 2 */}
          <section className="bg-zinc-900/30 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8">
            <h2 className="text-2xl font-bold text-white mb-4">2. Information We Collect</h2>
            
            <h3 className="text-xl font-semibold text-white mb-3 mt-6">2.1 Personal Information</h3>
            <ul className="space-y-2 text-zinc-300 ml-6">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span><strong className="text-white">Account Information:</strong> Email address, name, username, and authentication data</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span><strong className="text-white">Profile Information:</strong> User preferences, settings, and profile customizations</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span><strong className="text-white">Payment Information:</strong> Billing details processed securely through our payment processors (Stripe)</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span><strong className="text-white">Communication Data:</strong> Messages, voice interactions, and conversation history with AI companions</span>
              </li>
            </ul>

            <h3 className="text-xl font-semibold text-white mb-3 mt-6">2.2 Custom Character Data</h3>
            <ul className="space-y-2 text-zinc-300 ml-6">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Character names and personality descriptions you create</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Custom prompts and AI instructions</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Character appearance and voice preferences</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Purchase history for custom characters and scenarios</span>
              </li>
            </ul>

            <h3 className="text-xl font-semibold text-white mb-3 mt-6">2.3 Technical Information</h3>
            <ul className="space-y-2 text-zinc-300 ml-6">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Device information, IP address, and browser type</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Usage analytics and interaction patterns</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Cookies and similar tracking technologies</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Performance and error logs</span>
              </li>
            </ul>

            <h3 className="text-xl font-semibold text-white mb-3 mt-6">2.4 Memory and Conversation Data</h3>
            <ul className="space-y-2 text-zinc-300 ml-6">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Conversation history and context for personalized experiences</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>User preferences and behavioral patterns</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Memory data to maintain continuity in AI interactions</span>
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="bg-zinc-900/30 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8">
            <h2 className="text-2xl font-bold text-white mb-4">3. How We Use Your Information</h2>
            <ul className="space-y-2 text-zinc-300 ml-6">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Provide and maintain our AI companion services</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Process payments and manage subscriptions</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Personalize your experience with AI companions</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Maintain conversation memory and context</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Improve our AI models and service quality</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Send important service updates and notifications</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Provide customer support and technical assistance</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Ensure platform security and prevent fraud</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Comply with legal obligations and enforce our terms</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Conduct analytics to improve our services</span>
              </li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="bg-zinc-900/30 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8">
            <h2 className="text-2xl font-bold text-white mb-4">4. Information Sharing and Disclosure</h2>
            
            <h3 className="text-xl font-semibold text-white mb-3 mt-6">4.1 Third-Party Service Providers</h3>
            <p className="text-zinc-300 mb-4">We share information with trusted third parties who assist us in operating our service:</p>
            <ul className="space-y-2 text-zinc-300 ml-6">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span><strong className="text-white">Authentication:</strong> Clerk (user authentication and management)</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span><strong className="text-white">Payment Processing:</strong> Stripe and ToughTongue API (secure payment processing)</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span><strong className="text-white">AI Services:</strong> AI model providers for conversation processing</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span><strong className="text-white">Analytics:</strong> Google Analytics, Google Ads, Meta Pixel, Yandex Metrika</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span><strong className="text-white">Cloud Services:</strong> Hosting and database providers</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span><strong className="text-white">Customer Support:</strong> Crisp Chat for customer service</span>
              </li>
            </ul>

            <h3 className="text-xl font-semibold text-white mb-3 mt-6">4.2 Legal Requirements</h3>
            <p className="text-zinc-300">
              We may disclose your information when required by law, court order, or government request, or to protect our rights, property, or safety, or that of our users or others.
            </p>

            <h3 className="text-xl font-semibold text-white mb-3 mt-6">4.3 Business Transfers</h3>
            <p className="text-zinc-300">
              In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction.
            </p>
          </section>

          {/* Section 5 */}
          <section className="bg-zinc-900/30 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8">
            <h2 className="text-2xl font-bold text-white mb-4">5. Data Security</h2>
            <p className="text-zinc-300 mb-4">
              We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These measures include:
            </p>
            <ul className="space-y-2 text-zinc-300 ml-6">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Encryption of data in transit and at rest</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Regular security assessments and updates</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Access controls and authentication requirements</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Secure payment processing through certified providers</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Regular backup and disaster recovery procedures</span>
              </li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="bg-zinc-900/30 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8">
            <h2 className="text-2xl font-bold text-white mb-4">6. Data Retention</h2>
            <p className="text-zinc-300 mb-4">
              We retain your information for as long as necessary to provide our services and fulfill the purposes outlined in this policy:
            </p>
            <ul className="space-y-2 text-zinc-300 ml-6">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span><strong className="text-white">Account Information:</strong> Until you delete your account or request deletion</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span><strong className="text-white">Conversation Data:</strong> Retained to maintain memory and personalization features</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span><strong className="text-white">Payment Information:</strong> Retained as required for accounting and legal purposes</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span><strong className="text-white">Analytics Data:</strong> Aggregated and anonymized data may be retained indefinitely</span>
              </li>
            </ul>
          </section>

          {/* Section 7 */}
          <section className="bg-zinc-900/30 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8">
            <h2 className="text-2xl font-bold text-white mb-4">7. Your Rights and Choices</h2>
            <p className="text-zinc-300 mb-4">Depending on your location, you may have the following rights:</p>
            <ul className="space-y-2 text-zinc-300 ml-6">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span><strong className="text-white">Access:</strong> Request access to your personal information</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span><strong className="text-white">Rectification:</strong> Request correction of inaccurate information</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span><strong className="text-white">Deletion:</strong> Request deletion of your personal information</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span><strong className="text-white">Portability:</strong> Request a copy of your data in a portable format</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span><strong className="text-white">Restriction:</strong> Request limitation of processing under certain circumstances</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span><strong className="text-white">Objection:</strong> Object to processing based on legitimate interests</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span><strong className="text-white">Withdraw Consent:</strong> Withdraw consent for data processing where applicable</span>
              </li>
            </ul>
            <p className="text-zinc-300 mt-4">
              To exercise these rights, please contact us at <a href="mailto:info@getidyll.in" className="text-purple-400 hover:text-purple-300">info@getidyll.in</a>
            </p>
          </section>

          {/* Section 8 */}
          <section className="bg-zinc-900/30 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8">
            <h2 className="text-2xl font-bold text-white mb-4">8. Cookies and Tracking Technologies</h2>
            <p className="text-zinc-300 mb-4">
              We use cookies and similar tracking technologies to enhance your experience and analyze usage patterns:
            </p>
            <ul className="space-y-2 text-zinc-300 ml-6">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span><strong className="text-white">Essential Cookies:</strong> Required for basic site functionality</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span><strong className="text-white">Analytics Cookies:</strong> Help us understand how you use our service</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span><strong className="text-white">Advertising Cookies:</strong> Used for targeted advertising and conversion tracking</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span><strong className="text-white">Preference Cookies:</strong> Remember your settings and preferences</span>
              </li>
            </ul>
            <p className="text-zinc-300 mt-4">
              You can control cookies through your browser settings, but this may affect site functionality.
            </p>
          </section>

          {/* Section 9 */}
          <section className="bg-zinc-900/30 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8">
            <h2 className="text-2xl font-bold text-white mb-4">9. International Data Transfers</h2>
            <p className="text-zinc-300">
              Your information may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards are in place to protect your information in accordance with applicable data protection laws.
            </p>
          </section>

          {/* Section 10 */}
          <section className="bg-zinc-900/30 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8">
            <h2 className="text-2xl font-bold text-white mb-4">10. Children's Privacy</h2>
            <p className="text-zinc-300">
              Our service is not intended for individuals under the age of 18. We do not knowingly collect personal information from children under 18. If you become aware that a child has provided us with personal information, please contact us immediately.
            </p>
          </section>

          {/* Section 11 */}
          <section className="bg-zinc-900/30 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8">
            <h2 className="text-2xl font-bold text-white mb-4">11. Changes to This Privacy Policy</h2>
            <p className="text-zinc-300">
              We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the "Effective Date" above. We encourage you to review this Privacy Policy periodically for any changes.
            </p>
          </section>

          {/* Section 12 - Contact */}
          <section className="bg-zinc-900/30 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8">
            <h2 className="text-2xl font-bold text-white mb-4">12. Contact Us</h2>
            <p className="text-zinc-300 mb-4">
              If you have any questions about this Privacy Policy or our privacy practices, please contact us:
            </p>
            <div className="space-y-2 text-zinc-300">
              <p>
                <strong className="text-white">Privacy Email:</strong>{' '}
                <a href="mailto:info@getidyll.in" className="text-purple-400 hover:text-purple-300">
                  info@getidyll.in
                </a>
              </p>
              <p>
                <strong className="text-white">General Contact:</strong>{' '}
                <a href="mailto:info@getidyll.in" className="text-purple-400 hover:text-purple-300">
                  info@getidyll.in
                </a>
              </p>
              <p>
                <strong className="text-white">Website:</strong>{' '}
                <a href="https://getidyll.in" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300">
                  https://getidyll.in
                </a>
              </p>
            </div>
          </section>
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}

