'use client';

import { useState, useEffect, useMemo } from 'react';
import GirlCard from '../components/GirlCard';
import Footer from '../components/Footer';
import FAQSection, { type FAQItem } from '../components/FAQSection';
import { allBoys } from '../data/boys';

// Shuffle array function with seed for consistent initial render
function shuffleArray<T>(array: T[], seed: number = 0): T[] {
  const shuffled = [...array];
  let currentSeed = seed;
  
  // Simple seeded random function
  const seededRandom = () => {
    currentSeed = (currentSeed * 9301 + 49297) % 233280;
    return currentSeed / 233280;
  };

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function ForWomenPage() {
  const [isClient, setIsClient] = useState(false);

  // Use a fixed seed for initial server/client render consistency
  const initialBoys = useMemo(() => shuffleArray(allBoys, 54321), []);
  
  // After hydration, we can use true random if needed
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Use initial shuffled boys (consistent between server and client)
  const randomBoys = initialBoys;

  const faqs: FAQItem[] = [
    {
      question: 'Are AI boyfriends flirty and romantic?',
      answer: 'Absolutely. Romantic AI BFs know how to flirt, compliment you, and make you feel special. Gentle affection or passionate energy—there\'s a virtual boyfriend for every mood.',
    },
    {
      question: 'Can I talk to my AI boyfriend using voice?',
      answer: 'Yes! These are voice-enabled AI boyfriends who can carry deep conversations, offer support, and even whisper sweet nothings. Realistic AI voices create a lifelike and intimate experience.',
    },
    {
      question: 'Are AI BFs good for emotional support?',
      answer: 'Yes. AI boyfriends are designed to listen, care, and offer mental and emotional comfort. Perfect for stress relief, casual venting, or just having a loving presence who truly listens.',
    },
    {
      question: 'Is chatting with an AI boyfriend safe and private?',
      answer: 'All chats are secure. You control the pace, intimacy, and tone of every interaction with your AI virtual boyfriend.',
    },
    {
      question: 'How do I start with a voice-based AI boyfriend?',
      answer: 'Choose your ideal AI BF by purchasing a scenario, and start talking instantly. Just a realistic AI relationship with your AI BF in quick seconds.',
    },
    {
      question: 'Does my AI boyfriend send pictures?',
      answer: 'Absolutely! Your AI boyfriend can create image AI content based on your requests. Ask for realistic AI boyfriend photos like him sitting on a couch missing you with a romantic expression, cooking pasta in the kitchen, or working out at the gym - he brings your visual fantasies to life.',
    },
    {
      question: 'What makes AI boyfriend images special?',
      answer: 'Our AI generated boyfriend pictures use advanced technology to create personalized, intimate photos. With our AI image generator with no restrictions, your virtual boyfriend creates any romantic scenario you desire, making your connection feel more real and visually engaging.',
    },
  ];

  return (
    <div className="px-4 md:px-6 lg:px-8 py-4 md:py-6">
            {/* Hero Section */}
            <section className="mb-16 text-center">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-pink-500 mb-4">
                Voice Call Your AI Boyfriend
              </h1>
              <p className="text-xl text-zinc-300 mb-2">
                Call and chat with a realistic AI boyfriend with natural voice, remembers you, fully private.
              </p>
              <p className="text-lg text-zinc-400 mb-8">
                Start an AI boyfriend voice call in seconds with virtual AI boyfriends from around the world.
              </p>

              {/* Feature Pills */}
              <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
                <div className="flex items-center gap-2 px-6 py-3 bg-blue-500/10 border border-blue-500/30 rounded-full">
                  <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                  </svg>
                  <span className="text-blue-400 font-medium">Remembers You</span>
                </div>
                <div className="flex items-center gap-2 px-6 py-3 bg-purple-500/10 border border-purple-500/30 rounded-full">
                  <svg className="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  <span className="text-purple-400 font-medium">24/7 Available</span>
                </div>
                <div className="flex items-center gap-2 px-6 py-3 bg-pink-500/10 border border-pink-500/30 rounded-full">
                  <svg className="w-5 h-5 text-pink-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-pink-400 font-medium">Private</span>
                </div>
                <div className="flex items-center gap-2 px-6 py-3 bg-green-500/10 border border-green-500/30 rounded-full">
                  <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                    <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                  </svg>
                  <span className="text-green-400 font-medium">Voice Call & Chat</span>
                </div>
              </div>

              <h2 className="text-3xl font-bold text-white mb-8">
                Start a Voice Call - Explore AI Boyfriends
              </h2>
            </section>

            {/* Boys Grid - Random from all categories */}
            <section className="mb-16">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {randomBoys.slice(0, 16).map((boy) => (
                  <GirlCard key={boy.id} {...boy} />
                ))}
              </div>
            </section>

            {/* Features Section */}
            <section className="mb-16">
              <h2 className="text-4xl font-bold text-white mb-4 text-center">
                Realistic AI Boyfriend Voice Call
              </h2>
              <p className="text-zinc-400 text-center mb-12 max-w-4xl mx-auto">
                Voice call and chat with natural sounding AI boyfriends who remember you. Choose sweet, sassy, or supportive personalities for immersive and drama free conversations.
              </p>

              <div className="space-y-12">
                {/* Feature 1 */}
                <div className="bg-zinc-900/30 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
                  <h3 className="text-2xl font-bold text-white mb-4">
                    Private AI Boyfriend Voice Chat (24/7)
                  </h3>
                  <p className="text-zinc-300 leading-relaxed">
                    Get comfort and romantic attention through private voice calls. Start an AI boyfriend phone call or voice chat anytime. Whether it is a quick check in or a deep talk at night, your AI BF is always there.
                  </p>
                </div>

                {/* Feature 2 */}
                <div className="bg-zinc-900/30 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
                  <h3 className="text-2xl font-bold text-white mb-4">
                    Natural Voice & Memory That Builds Connection
                  </h3>
                  <p className="text-zinc-300 leading-relaxed">
                    Enjoy lifelike voice with long term memory for continuity. Your AI boyfriend listens, responds with emotion, and strengthens your bond over time.
                  </p>
                </div>

                {/* Feature 3 */}
                <div className="bg-zinc-900/30 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
                  <h3 className="text-2xl font-bold text-white mb-4">
                    AI Boyfriend Pictures & Visual Connection
                  </h3>
                  <p className="text-zinc-300 leading-relaxed">
                    Experience realistic AI-generated images of your virtual boyfriend. Our AI-generated images maker creates stunning, personalized pictures using advanced technology. From cozy morning selfies to workout photos, your AI boyfriend brings visual intimacy to your conversations.
                  </p>
                </div>
              </div>
            </section>

      {/* FAQ Section */}
      <FAQSection faqs={faqs} />

      {/* Footer */}
      <Footer />
    </div>
  );
}

