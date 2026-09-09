import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { NextRequest, NextResponse } from 'next/server';

export default function middleware(request: NextRequest) {
  // Handle root URL explicitly
  if (request.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/en', request.url));
  }
  
  return createMiddleware(routing)(request);
}

export const config = {
  // Match all paths except API, Next internals, and static files
  matcher: [
    // Skip API routes
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};