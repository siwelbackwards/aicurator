import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This is a simplified version of middleware for static export
export async function middleware(req: NextRequest) {
  // For static exports on Netlify, we don't need complex middleware
  // Just return the next response
  return NextResponse.next();
}

// Match the same routes as the normal middleware
export const config = {
  matcher: ['/dashboard/:path*', '/upload/:path*', '/profile/:path*', '/sign-in', '/sign-up'],
}; 