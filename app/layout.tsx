import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ClientProviders from "./components/ClientProviders";
import LayoutWrapper from "./components/LayoutWrapper";
import { Toaster } from "sonner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lily - AI Girlfriends",
  description:
    "AI Girlfriends starting at just $1.99/month - Affordable AI companionship",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover" as const,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased`}>
        <ClientProviders>
          <LayoutWrapper>{children}</LayoutWrapper>
          <Toaster position="top-right" richColors />
        </ClientProviders>
      </body>
    </html>
  );
}
