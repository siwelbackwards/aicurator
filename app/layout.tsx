import './globals.css';
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import Navbar from '@/components/layout/navbar';
import Footer from '@/components/layout/footer';
import { ErrorBoundary } from "@/components/error-boundary";
import { Toaster } from "@/components/ui/toaster";
import AuthGate from '@/components/auth/auth-gate';
import { DataProvider } from '@/lib/data-context';
import type { Metadata, Viewport } from "next";
import Script from 'next/script';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap', // Ensure text remains visible during font loading
  preload: true,
});

// Define viewport settings
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#ffffff',
};

// Define metadata with performance optimizations
export const metadata: Metadata = {
  title: 'AI Curator - Discover Exclusive Art',
  description: 'AI Curator connects buyers with unique artworks using AI-powered matchmaking. Discover the perfect piece for your collection.',
  manifest: '/manifest.json',
  robots: {
    index: true,
    follow: true,
  },
  authors: [{ name: 'AI Curator Team' }],
  icons: [
    { rel: 'icon', url: '/favicon.ico' },
    { rel: 'apple-touch-icon', url: '/images/icons/icon-192x192.png' }
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Load environment variables before the app mounts */}
        <Script src="/env.js" strategy="beforeInteractive" />
        {/* Preconnect to CDNs and APIs for faster loading */}
        <link rel="preconnect" href="https://cpzzmpgbyzcqbwkaaqdy.supabase.co" />
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://cpzzmpgbyzcqbwkaaqdy.supabase.co" />
        <meta name="turbo-cache-control" content="s-maxage=604800" />
      </head>
      <body className={inter.className}>
        <ErrorBoundary>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <DataProvider>
              <div className="flex min-h-screen flex-col">
                <Navbar />
                <main className="flex-grow container mx-auto">
                  <AuthGate>
                    {children}
                  </AuthGate>
                </main>
                <Footer />
              </div>
              <Toaster />
            </DataProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}