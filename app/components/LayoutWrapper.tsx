'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

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
        <Sidebar isOpen={true} onClose={() => {}} />
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        {/* Mobile Sidebar - Only renders below 768px as overlay */}
        {isSidebarOpen && (
          <div className="md:hidden fixed inset-0 z-50">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
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

