'use client';

import { useState, Suspense, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import Header from './Header';
import BackgroundAnimation from './BackgroundAnimation';
import { useAuth } from '@/app/contexts/AuthContext';

function SidebarWrapper({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const openAuth = (mode: 'login' | 'signup') => {
    window.dispatchEvent(new CustomEvent('lily:auth', { detail: { mode } }));
  };

  const openUpgrade = () => {
    window.dispatchEvent(new CustomEvent('lily:upgrade'));
  };

  return (
    <Suspense
      fallback={
        <div className="w-[220px] shrink-0 animate-pulse bg-white dark:bg-[#0a0a0a]" />
      }
    >
      <Sidebar
        isOpen={isOpen}
        onClose={onClose}
        onLoginClick={() => openAuth('login')}
        onSignUpClick={() => openAuth('signup')}
        onUpgradeClick={openUpgrade}
      />
    </Suspense>
  );
}

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { isAdmin } = useAuth();

  const isHome = pathname === '/';
  const [homeLoaderDone, setHomeLoaderDone] = useState(() => !isHome);

  const isMessagesPage = pathname === '/messages';
  const isAdminPage = pathname.startsWith('/admin');
  const showAppChrome = !isAdminPage;
  const hideForHomeLoader = isHome && !homeLoaderDone;

  useEffect(() => {
    if (isAdmin && !isAdminPage) {
      router.push('/admin');
    }
  }, [isAdmin, isAdminPage, router]);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isHome) {
      setHomeLoaderDone(true);
      return;
    }
    setHomeLoaderDone(false);

    const onLoaderDone = () => {
      setHomeLoaderDone(true);
      document.documentElement.style.backgroundColor = '';
      document.body.style.backgroundColor = '';
      document.body.style.overflow = '';
    };

    window.addEventListener('lily:loader-done', onLoaderDone);
    return () => window.removeEventListener('lily:loader-done', onLoaderDone);
  }, [isHome]);

  return (
    <div
      className={`flex h-screen-dvh overflow-hidden relative ${
        hideForHomeLoader ? 'bg-black' : ''
      }`}
    >
      {showAppChrome && !hideForHomeLoader && <BackgroundAnimation />}

      {showAppChrome && !hideForHomeLoader && (
        <SidebarWrapper
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
      )}

      <div
        className={`flex-1 flex flex-col overflow-hidden relative min-w-0 ${
          hideForHomeLoader ? 'invisible h-0 overflow-hidden' : 'z-10'
        }`}
      >
        {showAppChrome && !hideForHomeLoader && (
          <Header onMenuToggle={() => setIsSidebarOpen((open) => !open)} />
        )}

        <main
          className={`flex-1 min-h-0 ${
            isAdminPage
              ? 'flex flex-col overflow-hidden pb-0'
              : isMessagesPage
                ? 'flex flex-col overflow-hidden pb-0'
                : 'overflow-y-auto pb-20 md:pb-0'
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
