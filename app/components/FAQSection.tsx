'use client';

import { useState } from 'react';

export interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSectionProps {
  faqs: FAQItem[];
  title?: string;
}

export default function FAQSection({ faqs, title = 'Frequently Asked Questions' }: FAQSectionProps) {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  return (
    <section className="mb-8">
      <h2 className="text-4xl font-bold text-zinc-900 dark:text-white mb-8 text-center">
        {title}
      </h2>
      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className="bg-white/60 dark:bg-zinc-900/30 backdrop-blur-xl border border-zinc-200 dark:border-white/10 rounded-xl overflow-hidden transition-all duration-300"
          >
            <button
              onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
            >
              <span className="text-lg font-semibold text-zinc-900 dark:text-white pr-4">
                {index + 1}. {faq.question}
              </span>
              <svg
                className={`w-6 h-6 text-zinc-600 dark:text-zinc-400 shrink-0 transition-transform duration-300 ${
                  expandedFaq === index ? 'rotate-180' : ''
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
            <div
              className={`transition-all duration-300 ease-in-out ${
                expandedFaq === index
                  ? 'max-h-96 opacity-100'
                  : 'max-h-0 opacity-0'
              } overflow-hidden`}
            >
              <div className="px-6 pb-6">
                <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">{faq.answer}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
