'use client';

import { useState, Suspense } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

function SidebarWrapper({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <Suspense fallback={<div className="w-[200px] bg-zinc-900/50 animate-pulse" />}>
      <Sidebar isOpen={isOpen} onClose={onClose} />
    </Suspense>
  );
}

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden relative">
      {/* Global Background Image */}
      <div 
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: 'url(/bg.svg)',
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover',
          backgroundColor: '#0a0a0a',
          backgroundPosition: 'center',
        }}
      />

      {/* Desktop Sidebar - Only renders above 768px */}
      <div className="hidden md:block">
        <SidebarWrapper isOpen={true} onClose={() => {}} />
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        {/* Mobile Sidebar - Only renders below 768px as overlay */}
        {isSidebarOpen && (
          <div className="md:hidden fixed inset-0 z-50">
            <SidebarWrapper isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
          </div>
        )}
        {/* Header */}
        <Header onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}


