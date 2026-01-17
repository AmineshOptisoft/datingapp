'use client';

import { useEffect } from 'react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-white p-4">
            <h2 className="text-3xl font-bold mb-4">Something went wrong!</h2>
            <button
                onClick={
                    // Attempt to recover by trying to re-render the segment
                    () => reset()
                }
                className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-full font-medium transition-colors"
            >
                Try again
            </button>
        </div>
    );
}
