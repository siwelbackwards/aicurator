import './globals.css';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import Navbar from '@/components/layout/navbar';
import Footer from '@/components/layout/footer';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from "@/components/ui/toaster";
import { SupabaseDebug } from '@/components/debug/supabase-debug';
import { SupabaseInitializer } from '@/components/supabase-initializer';
import type { Metadata } from "next";
import Script from 'next/script';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AI Curator - Luxury Marketplace',
  description: 'AI-powered marketplace for luxury collectibles',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Pre-initialization script - must load absolutely first */}
        <Script src="/pre-init.js" strategy="beforeInteractive" />
        
        {/* GoTrueClient patch - must load before modules */}
        <Script src="/gotrue-patch.js" strategy="beforeInteractive" />
        
        {/* Load environment variables before the app mounts */}
        <Script src="/env.js" strategy="beforeInteractive" />
        
        {/* Cleanup script to ensure consistent client initialization */}
        <Script id="supabase-cleanup" strategy="beforeInteractive">
          {`
            (function() {
              try {
                // This script runs before any React components
                // Force consistent client state by cleaning up any existing instances
                if (typeof window !== 'undefined') {
                  // If we have a reset function from pre-init, use it
                  if (window.__RESET_SUPABASE) {
                    console.debug('[Supabase Cleanup] Using pre-init reset function');
                    window.__RESET_SUPABASE();
                  } else {
                    // Otherwise do a basic reset
                    window.__SUPABASE_CLIENT__ = undefined;
                    window.__SUPABASE_ADMIN__ = undefined;
                    window.__SHARED_GOTRUE__ = undefined;
                    window.__GO_TRUE_CLIENT__ = undefined;
                    console.debug('[Supabase Cleanup] Reset global client instances for clean initialization');
                  }
                }
              } catch (err) {
                console.error('[Supabase Cleanup] Error:', err);
              }
            })();
          `}
        </Script>
      </head>
      <body className={inter.className}>
        <ErrorBoundary>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {/* Add initializer to ensure clean Supabase initialization */}
            <SupabaseInitializer />
            
            <div className="flex min-h-screen flex-col">
              <Navbar />
              <main className="flex-grow container mx-auto">{children}</main>
              <Footer />
            </div>
            <Toaster />
            {/* Debug component only appears in development */}
            <SupabaseDebug />
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}