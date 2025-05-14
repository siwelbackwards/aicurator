import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Protected routes
  const protectedRoutes = ['/dashboard', '/upload', '/profile'];
  const isProtectedRoute = protectedRoutes.some(route => req.nextUrl.pathname.startsWith(route));

  // Auth routes
  const authRoutes = ['/sign-in', '/sign-up'];
  const isAuthRoute = authRoutes.some(route => req.nextUrl.pathname.startsWith(route));

  // For static exports, we'll handle auth client-side
  // This middleware just sets up the response
  return res;
}

export const config = {
  matcher: ['/dashboard/:path*', '/upload/:path*', '/profile/:path*', '/sign-in', '/sign-up'],
}; 