'use client';

export default function ProfileCardSkeleton() {
    return (
        <div className="group relative bg-zinc-800 rounded-2xl overflow-hidden animate-pulse">
            <div className="relative aspect-3/4 overflow-hidden bg-zinc-700">
                {/* Shimmer effect */}
                <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-zinc-600/50 to-transparent" />

                {/* Badge placeholders */}
                <div className="absolute top-3 left-3">
                    <div className="w-12 h-6 bg-zinc-600 rounded-full" />
                </div>

                <div className="absolute top-3 right-3">
                    <div className="w-12 h-6 bg-zinc-600 rounded-full" />
                </div>

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent" />

                {/* Content placeholders */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                    {/* Name placeholder */}
                    <div className="h-6 bg-zinc-600 rounded w-3/4 mb-2" />

                    {/* Title placeholder */}
                    <div className="h-4 bg-zinc-600 rounded w-full mb-3" />

                    {/* Price and button row */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-baseline gap-1">
                            <div className="h-6 bg-zinc-600 rounded w-16" />
                            <div className="h-3 bg-zinc-600 rounded w-12" />
                        </div>

                        <div className="h-9 bg-zinc-600 rounded-full w-20" />
                    </div>
                </div>
            </div>
        </div>
    );
}
