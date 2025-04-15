import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Global singleton for middleware client
const middlewareClientSingleton = {
  instance: null as ReturnType<typeof createMiddlewareClient> | null,
  isInitializing: false
};

export async function middleware(req: NextRequest) {
  // We need to create a response and hand it to the supabase client to be able to modify the response headers.
  const res = NextResponse.next();
  
  let supabase;
  
  // Ensure we don't have concurrent initialization
  if (middlewareClientSingleton.isInitializing) {
    // Wait briefly for initialization to complete
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  
  // Create a Supabase client configured to use cookies
  if (!middlewareClientSingleton.instance) {
    try {
      middlewareClientSingleton.isInitializing = true;
      console.debug('[Middleware] Creating new middleware client');
      // Create with minimal configuration
      middlewareClientSingleton.instance = createMiddlewareClient({ req, res });
    } finally {
      middlewareClientSingleton.isInitializing = false;
    }
  } else {
    console.debug('[Middleware] Reusing existing middleware client');
  }
  
  supabase = middlewareClientSingleton.instance;

  // Refresh session if expired - required for Server Components
  await supabase.auth.getSession();

  // Protected routes
  const protectedRoutes = ['/dashboard', '/upload', '/profile'];
  const isProtectedRoute = protectedRoutes.some(route => req.nextUrl.pathname.startsWith(route));

  // Auth routes
  const authRoutes = ['/sign-in', '/sign-up'];
  const isAuthRoute = authRoutes.some(route => req.nextUrl.pathname.startsWith(route));

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (isProtectedRoute && !session) {
    const redirectUrl = new URL('/sign-in', req.url);
    redirectUrl.searchParams.set('redirectedFrom', req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ]
}; 