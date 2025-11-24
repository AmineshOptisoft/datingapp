'use client';

import { useState } from 'react';
import Footer from '../components/Footer';

interface FAQItem {
  id: number;
  question: string;
  answer: string;
}

export default function FAQPage() {
  const [openId, setOpenId] = useState<number | null>(1);

  const faqs: FAQItem[] = [
    {
      id: 1,
      question: 'What is an AI Virtual Girlfriend or Boyfriend?',
      answer: 'An AI virtual girlfriend or boyfriend is an advanced AI-powered voicebot that simulates real-time conversations, emotional connections, and personalized interactions. Unlike traditional chatbots, it offers voice-based communication, making interactions more immersive and realistic.',
    },
    {
      id: 2,
      question: 'Can I customize my AI Girlfriend or Boyfriend?',
      answer: 'No, you cannot edit the AI, but we have a combined and dynamic collection of avatars. Whether you want a caring or adventurous— Idyll AI virtual partner adapts to your preferences.',
    },
    {
      id: 3,
      question: 'Is my AI relationship private and secure?',
      answer: 'Absolutely! Privacy is a top priority. All conversations with your AI partner are safe and remain confidential. We do not sell your data or record your conversations, ensuring a secure and safe interaction.',
    },
    {
      id: 4,
      question: 'Can I explore fantasies and role-play with my AI partner?',
      answer: 'Yes! Our AI virtual partner allows you to explore different romantic, emotional, and fantasy-based scenarios, including roleplay and personalized experiences that match your desires.',
    },
    {
      id: 5,
      question: "Can I change my AI's nationality and language?",
      answer: 'Of course! You can choose from a created collection of multiple nationalities, accents, and languages to make your AI companion more relatable and immersive. Whether you prefer an American, British, French, Japanese, or any other accent, your AI adapts to suit your preference.',
    },
    {
      id: 6,
      question: 'What makes this the best AI Virtual Girlfriend/Boyfriend app?',
      answer: 'Our platform stands out with real-time voice interactions, multiple customizable avatars, diverse languages, and advanced emotional intelligence, providing the most realistic AI relationship experience available.',
    },
    {
      id: 7,
      question: 'What happens if my AI says weird things to me?',
      answer: 'AI responses are generated based on machine learning and user interactions. While we continuously improve accuracy, occasional unexpected or "weird" responses may occur. If this happens, you can report the response by mailing us at info@getidyll.in, or reset the conversation to realign interactions with your preferences.',
    },
    {
      id: 8,
      question: 'How much free chat time do I get with my AI virtual partner?',
      answer: 'Free users receive around 1 minute of free chatting to explore the AI experience. After that, you need to purchase to continue conversations and unlock advanced features like deeper personalization, premium avatars, and extended interactions.',
    },
    {
      id: 9,
      question: 'What purchase plans are available for AI conversations?',
      answer: 'We offer flexible pricing options to suit your needs: Monthly plans starting at just $1.99/month for ongoing access, Annual plans for better value with yearly billing, and Lifetime plans for a one-time payment that gives you unlimited access forever. Choose the plan that works best for you!',
    },
    {
      id: 10,
      question: 'Can I return to my previous conversations with my AI?',
      answer: 'Yes! Our platform allows users to resume past conversations with their AI virtual partner. You can choose to restore or start a new session. Your AI remembers previous interactions, ensuring a seamless and personalized experience every time you return.',
    },
    {
      id: 11,
      question: 'How much talk time will I get after purchasing a plan?',
      answer: 'Our platform uses complex tech to surface our offerings that enable users to experience a seamless and engaging conversation. These conversations can go up to 10 to 15 minutes. If a user wants to continue to talk to the AI girlfriend/boyfriend, they can either restore their previous conversation or start a new one.',
    },
    {
      id: 12,
      question: 'How does AI girlfriend photo generation work?',
      answer: 'Your AI girlfriend creates realistic images from voice commands. Simply tell your AI GF what image you would like to see, and she will generate high-quality photos of herself instantly using our advanced AI image generation technology.',
    },
    {
      id: 13,
      question: 'What kind of images can my AI girlfriend create?',
      answer: 'Your AI GF can create images with AI based on any scenario you describe! Ask her for photos like sitting on a couch dreaming of you with a sad face, cooking pasta in the kitchen, working out at the gym, or any other situation you imagine. She brings your imaginations to life with realistic AI-generated images.',
    },
  ];

  const toggleFAQ = (id: number) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <div className="min-h-screen px-4 md:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-12">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
          Frequently Asked Questions
        </h1>
        <p className="text-zinc-400 text-lg">
          Find answers to common questions about our AI Virtual Girlfriend & Boyfriend platform.
        </p>
      </div>

      {/* FAQ Accordion */}
      <div className="max-w-4xl mx-auto mb-16">
        <div className="space-y-4">
          {faqs.map((faq) => (
            <div
              key={faq.id}
              className="bg-zinc-900/30 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden transition-all"
            >
              <button
                onClick={() => toggleFAQ(faq.id)}
                className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
              >
                <h3 className="text-lg font-semibold text-white pr-4">
                  {faq.id}. {faq.question}
                </h3>
                <svg
                  className={`w-6 h-6 text-white transition-transform shrink-0 ${
                    openId === faq.id ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              
              {openId === faq.id && (
                <div className="px-6 pb-5 pt-0">
                  <p className="text-zinc-300 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}

