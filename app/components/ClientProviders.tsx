'use client';

import { AuthProvider } from "@/app/contexts/AuthContext";
import { SocketProvider } from "@/lib/socket";
import { ThemeProvider } from "@/app/contexts/ThemeContext";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ReactNode } from "react";
import { ProfileModalProvider } from "@/app/contexts/ProfileModalContext";

export default function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>
        <AuthProvider>
          <SocketProvider>
            <ProfileModalProvider>
              {children}
            </ProfileModalProvider>
          </SocketProvider>
        </AuthProvider>
      </GoogleOAuthProvider>
    </ThemeProvider>
  );
}

