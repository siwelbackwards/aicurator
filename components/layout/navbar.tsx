"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu as MenuIcon, X, UserIcon, Settings, LogOut, ShoppingBag, ShieldAlert } from 'lucide-react';
import { Menu } from '@headlessui/react';
import { Button } from '@/components/ui/button';
import AuthDialog from '@/components/auth/auth-dialog';
import { useDataContext } from '@/lib/data-context';
import { useAuth } from '@/hooks/use-auth';
import { ErrorBoundary } from '@/components/error-boundary';
import { AuthChangeEvent, Session } from '@supabase/supabase-js';

const navigation = [
  { name: 'Home', href: '/' },
  { name: 'Categories', href: '/categories' },
  { name: 'Future Masters', href: '/future-masters' },
  { name: 'Best Matches', href: '/best-matches' },
  { name: 'Auction', href: '/auction' },
  { name: 'Blog', href: '/blog' },
];

export default function Navbar() {
  const router = useRouter();
  const { clearCache } = useDataContext();
  const { user, signOut, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Check admin status when user changes
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (user) {
        try {
          // Import supabase dynamically to avoid issues
          const { supabase } = await import('@/lib/supabase-client');
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
          
          setIsAdmin(profile?.role === 'admin');
        } catch (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
        // Clear data cache when user signs out
        clearCache();
      }
    };

    checkAdminStatus();
  }, [user, clearCache]);

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      
      // Clear cache before signing out
      clearCache();
      
      // Use the signOut function from useAuth hook
      await signOut();
      
      // Force a hard refresh to clear any cached state
      window.location.href = '/';
    } catch (error) {
      console.error('Exception during sign out:', error instanceof Error ? error.message : JSON.stringify(error));
    } finally {
      setIsSigningOut(false);
      setMobileMenuOpen(false);
    }
  };

  const handleNavigation = (href: string) => {
    // Close mobile menu
    setMobileMenuOpen(false);
    
    // For client-side navigation, we don't need to clear cache
    // The DataProvider will handle cache invalidation appropriately
    router.push(href);
  };

  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm">
      <nav className="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8" aria-label="Global">
        <div className="flex lg:flex-1">
          <Link href="/" className="-m-1.5 p-1.5">
            <span className="text-2xl font-bold">AI Curator</span>
          </Link>
        </div>
        
        <div className="flex lg:hidden">
          <button
            type="button"
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5"
            onClick={() => setMobileMenuOpen(true)}
          >
            <MenuIcon className="h-6 w-6" />
          </button>
        </div>
        
        <div className="hidden lg:flex lg:gap-x-12">
          {navigation.map((item) => (
            <button
              key={item.name}
              onClick={() => handleNavigation(item.href)}
              className="text-sm font-semibold leading-6 hover:text-primary transition-colors cursor-pointer"
            >
              {item.name}
            </button>
          ))}
        </div>
        
        <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:gap-4">
          {user ? (
            <Menu as="div" className="relative z-50">
              <Menu.Button className="flex items-center gap-2 p-2 rounded-full hover:bg-gray-100">
                <UserIcon className="h-5 w-5" />
              </Menu.Button>
              <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div className="py-1">
                  <Menu.Item>
                    {({ active }) => (
                      <Link
                        href="/profile"
                        className={`${
                          active ? 'bg-gray-100' : ''
                        } flex items-center px-4 py-2 text-sm`}
                      >
                        <UserIcon className="h-4 w-4 mr-2" />
                        Profile
                      </Link>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <Link
                        href="/settings"
                        className={`${
                          active ? 'bg-gray-100' : ''
                        } flex items-center px-4 py-2 text-sm`}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                      </Link>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <Link
                        href="/sell"
                        className={`${
                          active ? 'bg-gray-100' : ''
                        } flex items-center px-4 py-2 text-sm`}
                      >
                        <ShoppingBag className="h-4 w-4 mr-2" />
                        Sell
                      </Link>
                    )}
                  </Menu.Item>
                  {isAdmin && (
                    <Menu.Item>
                      {({ active }) => (
                        <Link
                          href="/admin/artworks"
                          className={`${
                            active ? 'bg-gray-100' : ''
                          } flex items-center px-4 py-2 text-sm`}
                        >
                          <ShieldAlert className="h-4 w-4 mr-2" />
                          Admin
                        </Link>
                      )}
                    </Menu.Item>
                  )}
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={handleSignOut}
                        disabled={isSigningOut}
                        className={`${
                          active ? 'bg-gray-100' : ''
                        } flex items-center w-full px-4 py-2 text-sm`}
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        {isSigningOut ? 'Signing out...' : 'Sign out'}
                      </button>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Menu>
          ) : (
            <Button onClick={() => setAuthDialogOpen(true)}>
              Get Started
            </Button>
          )}
        </div>
      </nav>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden">
          <div className="fixed inset-0 z-50">
            <div className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white dark:bg-gray-900 px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
              <div className="flex items-center justify-between">
                <Link href="/" className="-m-1.5 p-1.5">
                  <span className="text-2xl font-bold">AI Curator</span>
                </Link>
                <button
                  type="button"
                  className="-m-2.5 rounded-md p-2.5"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="mt-6 flow-root">
                <div className="-my-6 divide-y divide-gray-500/10">
                  <div className="space-y-2 py-6">
                    {navigation.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 hover:bg-gray-50 dark:hover:bg-gray-800"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                  <div className="py-6">
                    {user ? (
                      <div className="space-y-2">
                        <Link
                          href="/profile"
                          className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 hover:bg-gray-50 dark:hover:bg-gray-800"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          Profile
                        </Link>
                        <Link
                          href="/settings"
                          className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 hover:bg-gray-50 dark:hover:bg-gray-800"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          Settings
                        </Link>
                        <Link
                          href="/sell"
                          className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 hover:bg-gray-50 dark:hover:bg-gray-800"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          Sell
                        </Link>
                        {isAdmin && (
                          <Link
                            href="/admin/artworks"
                            className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 hover:bg-gray-50 dark:hover:bg-gray-800"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            Admin
                          </Link>
                        )}
                        <button
                          onClick={handleSignOut}
                          disabled={isSigningOut}
                          className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 hover:bg-gray-50 dark:hover:bg-gray-800 w-full text-left"
                        >
                          {isSigningOut ? 'Signing out...' : 'Sign out'}
                        </button>
                      </div>
                    ) : (
                      <Button 
                        className="w-full" 
                        onClick={() => {
                          setMobileMenuOpen(false);
                          setAuthDialogOpen(true);
                        }}
                      >
                        Get Started
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <ErrorBoundary>
        <AuthDialog
          open={authDialogOpen}
          onOpenChange={setAuthDialogOpen}
          initialMode="signIn"
        />
      </ErrorBoundary>
    </header>
  );
}