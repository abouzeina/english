import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Protected and Auth-only routes
const protectedRoutes = ['/dashboard', '/review', '/favorites', '/settings'];
const authRoutes = ['/login', '/signup'];

export function middleware(request: NextRequest) {
  const token = request.cookies.get('wafi_token')?.value;
  const { pathname } = request.nextUrl;

  // 1. Allow guest access to all pages
  // (Previously redirected to login here)

  // 2. Redirect to dashboard if accessing auth route with token
  if (token && authRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/review/:path*',
    '/favorites/:path*',
    '/settings/:path*',
    '/login',
    '/signup'
  ],
};
