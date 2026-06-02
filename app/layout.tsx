import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import ClientProviders from "./components/ClientProviders";
import LayoutWrapper from "./components/LayoutWrapper";
import { Toaster } from "sonner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme'),d=document.documentElement;if(t==='light')d.classList.remove('dark');else d.classList.add('dark');var p=location.pathname;if(p==='/'||p===''){d.style.backgroundColor='#000';document.body&&(document.body.style.backgroundColor='#000',document.body.style.overflow='hidden');}}catch(e){}})();`,
          }}
        />
      </head>
      <body className={`${inter.variable} ${outfit.variable} antialiased`}>
        <ClientProviders>
          <LayoutWrapper>{children}</LayoutWrapper>
          <Toaster position="top-right" richColors />
        </ClientProviders>
      </body>
    </html>
  );
}
