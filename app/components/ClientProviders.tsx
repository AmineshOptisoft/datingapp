'use client';

import { AuthProvider } from "@/app/contexts/AuthContext";
import { SocketProvider } from "@/lib/socket";
import { ThemeProvider } from "@/app/contexts/ThemeContext";
import { ReactNode } from "react";

export default function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          {children}
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

