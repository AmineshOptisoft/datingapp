'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { RoutePrefix } from '@/types/ai-profile';

interface ProfileModalContextType {
  isOpen: boolean;
  routePrefix: RoutePrefix | null;
  legacyId: string | number | null;
  openProfile: (routePrefix: RoutePrefix, legacyId: string | number) => void;
  closeProfile: () => void;
}

const ProfileModalContext = createContext<ProfileModalContextType | undefined>(undefined);

export function ProfileModalProvider({ children }: { children: ReactNode }) {
  const [routePrefix, setRoutePrefix] = useState<RoutePrefix | null>(null);
  const [legacyId, setLegacyId] = useState<string | number | null>(null);

  const openProfile = (prefix: RoutePrefix, id: string | number) => {
    setRoutePrefix(prefix);
    setLegacyId(id);
  };

  const closeProfile = () => {
    setRoutePrefix(null);
    setLegacyId(null);
  };

  const isOpen = routePrefix !== null && legacyId !== null;

  return (
    <ProfileModalContext.Provider
      value={{
        isOpen,
        routePrefix,
        legacyId: legacyId ?? null,
        openProfile,
        closeProfile,
      }}
    >
      {children}
    </ProfileModalContext.Provider>
  );
}

export function useProfileModal() {
  const context = useContext(ProfileModalContext);
  if (!context) {
    throw new Error('useProfileModal must be used within a ProfileModalProvider');
  }
  return context;
}
