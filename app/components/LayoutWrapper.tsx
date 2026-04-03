'use client';

import { useState, Suspense, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import Header from './Header';
import { useTheme } from '@/app/contexts/ThemeContext';
import { useAuth } from '@/app/contexts/AuthContext';

function SidebarWrapper({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <Suspense fallback={<div className="w-[200px] bg-zinc-900/50 animate-pulse" />}>
      <Sidebar isOpen={isOpen} onClose={onClose} />
    </Suspense>
  );
}

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { theme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const { isAdmin } = useAuth();

  const isMessagesPage = pathname === '/messages';
  const isAdminPage = pathname.startsWith('/admin');

  useEffect(() => {
    if (isAdmin && !isAdminPage) {
      router.push('/admin');
    }
  }, [isAdmin, isAdminPage, router]);

  return (
    <div className="flex h-screen-dvh overflow-hidden relative">
      {/* Global Background */}
      <div 
        className="fixed inset-0 z-0"
        style={{
          backgroundColor: theme === 'light' ? '#f2f2f2' : '#0a0a0a',
          backgroundPosition: 'center',
        }}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        {/* Header - hide on admin pages */}
        {!isAdminPage && <Header />}

        {/* Page Content */}
        <main className={`flex-1 min-h-0 ${
          isAdminPage 
            ? 'flex flex-col overflow-hidden pb-0' 
            : isMessagesPage 
              ? 'flex flex-col overflow-hidden pb-0' 
              : 'overflow-y-auto pb-20 md:pb-0'
        }`}>
          {children}
        </main>
      </div>
    </div>
  );
}
