import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/app/contexts/AuthContext";
import { SocketProvider } from "@/lib/socket";
import SmoothScrolling from "./components/SmoothScrolling";
import LayoutWrapper from "./components/LayoutWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "IDYLL - AI Girlfriends",
  description:
    "AI Girlfriends starting at just $1.99/month - Affordable AI companionship",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark lenis">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <SmoothScrolling />
        <AuthProvider>
          <SocketProvider>
            <LayoutWrapper>{children}</LayoutWrapper>
          </SocketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
