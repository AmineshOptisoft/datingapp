'use client';

import { useState, Suspense } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Header from './Header';
import { useTheme } from '@/app/contexts/ThemeContext';

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
  const isMessagesPage = pathname === '/messages';

  return (
    <div className="flex h-screen-dvh overflow-hidden relative">
      {/* Global Background Image */}
      <div 
        className="fixed inset-0 z-0"
        style={{
          // backgroundImage: `url(/${theme === 'light' ? 'light_bg.svg' : 'bg.svg'})`,
          // backgroundRepeat: 'no-repeat',
          // backgroundSize: 'cover',
          backgroundColor: theme === 'light' ? '#f2f2f2' : '#0a0a0a',
          backgroundPosition: 'center',
        }}
      />

      {/* Desktop Sidebar - Only renders above 768px */}
      {/* <div className="hidden md:block">
        <SidebarWrapper isOpen={true} onClose={() => {}} />
      </div> */}
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        {/* Mobile Sidebar - Only renders below 768px as overlay */}
        {/* {isSidebarOpen && (
          <div className="md:hidden fixed inset-0 z-50">
            <SidebarWrapper isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
          </div>
        )} */}
        {/* Header */}
        <Header />

        {/* Page Content - flex for messages so chat area gets proper height for scroll */}
        <main className={`flex-1 min-h-0 ${isMessagesPage ? 'flex flex-col overflow-hidden pb-0' : 'overflow-y-auto pb-20 md:pb-0'}`}>
          {children}
        </main>
      </div>
    </div>
  );
}


