import { Suspense } from 'react';
import MessagesClient from './MessagesClient';

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div className="h-[calc(100vh-80px)] flex items-center justify-center bg-white dark:bg-[#0c0c0f]">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-zinc-200 dark:border-white/10 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-zinc-900 dark:border-t-white rounded-full animate-spin"></div>
          </div>
          <p className="text-zinc-500 font-medium">Loading Messages...</p>
        </div>
      </div>
    }>
      <MessagesClient />
    </Suspense>
  );
}

