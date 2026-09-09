import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Match all paths except API, Next internals, and static files
  matcher: [
    // Skip API routes
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};