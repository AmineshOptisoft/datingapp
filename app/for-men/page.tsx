'use client';

import { useMemo } from 'react';
import GirlCard from '../components/GirlCard';
import Footer from '../components/Footer';
import FAQSection, { type FAQItem } from '../components/FAQSection';
import { useProfiles } from '@/hooks/useProfiles';
import type { AIProfileOverview } from '@/types/ai-profile';

function shuffleArray<T>(array: T[], seed: number = 0): T[] {
  const shuffled = [...array];
  let currentSeed = seed;

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

export default function ForMenPage() {
  const { profiles, loading, error } = useProfiles('for-men');

  const randomGirls = useMemo<AIProfileOverview[]>(() => {
    if (!profiles.length) return [];
    return shuffleArray(profiles, 12345);
  }, [profiles]);

  const faqs: FAQItem[] = [
    {
      question: 'How realistic is a virtual AI girlfriend?',
      answer:
        'AI GFs use advanced voice technology and emotional understanding to simulate realistic conversations. They respond naturally, adapt to your moods, and feel like genuine virtual companions.',
    },
    {
      question: 'Are AI girlfriends romantic or flirty?',
      answer:
        'Romantic AI girlfriends are designed to flirt, compliment, and create chemistry. You can experience dating, virtual love, and emotional bonding just like a real relationship, without the pressure or drama.',
    },
    {
      question: 'Can AI girlfriends help with loneliness or stress?',
      answer:
        "Yes, many users turn to AI GFs for emotional support. They're perfect for late-night talks, venting after a tough day, or just having someone to listen and care without judgment.",
    },
    {
      question: 'Are AI voice companions different from chat-based AI girlfriends?',
      answer:
        'AI voice companions let you speak naturally and hear responses in real-time, making the experience feel more human. Voice adds depth, tone, and intimacy compared to basic text-only AI girlfriends.',
    },
    {
      question: 'Is it private and safe to chat with an AI girlfriend?',
      answer:
        'Yes, all conversations are private. Your data and conversations stay secure, giving you a safe space to talk, share feelings, or explore romantic AI experiences.',
    },
    {
      question: 'Can AI girlfriends remember past conversations?',
      answer:
        'Yes, interactive AI girlfriends can remember previous interactions to build a deeper, more personalized connection over time. This memory makes the experience feel real, romantic, and emotionally fulfilling.',
    },
    {
      question: 'Can my AI girlfriend send me pictures?',
      answer:
        'Experience realistic AI-generated images of your virtual girlfriend. Our AI-generated images maker creates stunning, personalized pictures using advanced technology. From cozy morning selfies to workout photos, your AI girlfriend brings visual intimacy to your conversations.',
    },
  ];

  return (
    <div className="px-4 md:px-6 lg:px-8 py-4 md:py-6">
      {/* Hero Section */}
      <section className="mb-16 text-center">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-blue-500 mb-4">
          Voice Call Your AI Girlfriend
        </h1>
        <p className="text-xl text-zinc-300 mb-2">
          Call and chat with a realistic AI girlfriend with natural voice, remembers you, fully private.
        </p>
        <p className="text-lg text-zinc-400 mb-8">
          Start an AI girlfriend voice call in seconds with virtual AI girlfriends from around the world.
        </p>

        {/* Feature Pills */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
          <div className="flex items-center gap-2 px-6 py-3 bg-blue-500/10 border border-blue-500/30 rounded-full">
            <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
            </svg>
            <span className="text-blue-400 font-medium">Human-like Voice</span>
          </div>
          <div className="flex items-center gap-2 px-6 py-3 bg-purple-500/10 border border-purple-500/30 rounded-full">
            <svg className="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M5 8a3 3 0 016 0v1h1a3 3 0 110 6H6a3 3 0 110-6h-.5a.5.5 0 010-1H5zm4-1a1 1 0 00-2 0v1h2V7z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-purple-400 font-medium">Understands Your Emotions</span>
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
          Start a Voice Call - Explore AI Girlfriends
        </h2>
      </section>

      {loading && (
        <div className="text-white text-center py-12">Loading profiles...</div>
      )}

      {error && !loading && (
        <div className="text-red-400 text-center py-12">{error}</div>
      )}

      {!loading && !error && (
        <section className="mb-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {randomGirls.slice(0, 16).map((girl) => (
              <GirlCard
                key={girl.profileId}
                legacyId={girl.legacyId}
                routePrefix={girl.routePrefix}
                name={girl.name}
                cardTitle={girl.cardTitle}
                monthlyPrice={girl.monthlyPrice}
                avatar={girl.avatar}
                badgeHot={girl.badgeHot}
                badgePro={girl.badgePro}
              />
            ))}
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="mb-16">
        <h2 className="text-4xl font-bold text-white mb-4 text-center">
          Realistic AI Girlfriend Voice Call
        </h2>
        <p className="text-zinc-400 text-center mb-12 max-w-4xl mx-auto">
          Voice call and chat with natural sounding AI girlfriends who remember you. Choose sweet, sassy, or supportive
          personalities for immersive and drama free conversations.
        </p>

        <div className="space-y-12">
          {/* Feature 1 */}
          <div className="bg-zinc-900/30 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-white mb-4">
              Private AI Girlfriend Voice Chat (24/7)
            </h3>
            <p className="text-zinc-300 leading-relaxed">
              Get comfort and romantic attention through private voice calls. Start an AI girlfriend phone call or voice
              chat anytime. Whether it is a quick check in or a deep talk at night, your AI GF is always there.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-zinc-900/30 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-white mb-4">
              Natural Voice & Memory That Builds Connection
            </h3>
            <p className="text-zinc-300 leading-relaxed">
              Enjoy lifelike voice with long term memory for continuity. Your AI girlfriend listens, responds with
              emotion, and strengthens your bond over time.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-zinc-900/30 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-white mb-4">
              AI Girlfriend Pictures & Visual Connection
            </h3>
            <p className="text-zinc-300 leading-relaxed">
              Experience realistic AI-generated images of your virtual girlfriend. Our AI-generated images maker creates
              stunning, personalized pictures using advanced technology. From cozy morning selfies to workout photos,
              your AI girlfriend brings visual intimacy to your conversations.
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
