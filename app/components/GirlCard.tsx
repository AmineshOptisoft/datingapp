'use client';

import Link from 'next/link';
import { RoutePrefix } from '@/types/ai-profile';
import { getProfileRoute } from '@/lib/url-helpers';

interface GirlCardProps {
  legacyId: number;
  routePrefix: RoutePrefix;
  name: string;
  cardTitle: string;
  monthlyPrice: number;
  avatar: string;
  badgeHot?: boolean;
  badgePro?: boolean;
}

export default function GirlCard({
  legacyId,
  routePrefix,
  name,
  cardTitle,
  monthlyPrice,
  avatar,
  badgeHot = false,
  badgePro = false,
}: GirlCardProps) {
  const priceLabel = `$${monthlyPrice.toFixed(2)}`;

  return (
    <Link
      href={getProfileRoute(routePrefix, name, cardTitle, legacyId)}
      className="group relative bg-zinc-800 rounded-2xl overflow-hidden hover:ring-2 hover:ring-pink-500 transition-all duration-300 cursor-pointer block"
    >
      <div className="relative aspect-1/2 overflow-hidden">
        <img
          src={avatar}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        <div className="absolute top-3 left-3 flex gap-2">
          {badgeHot && (
            <span className="flex items-center gap-1 px-2 py-1 bg-black/70 backdrop-blur-sm rounded-full text-white text-xs font-medium">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z"
                  clipRule="evenodd"
                />
              </svg>
              HOT
            </span>
          )}
        </div>

        {badgePro && (
          <span className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-black/70 backdrop-blur-sm rounded-full text-white text-xs font-medium">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            PRO
          </span>
        )}

        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-white font-semibold text-lg mb-1">{name}</h3>
          <p className="text-zinc-300 text-sm mb-3">{cardTitle}</p>

          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-1">
              <span className="text-white font-bold text-xl">{priceLabel}</span>
              <span className="text-zinc-400 text-xs">/month</span>
            </div>

            <button className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white rounded-full text-sm font-medium transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              View
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
