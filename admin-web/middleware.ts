// /admin-web/middleware.ts
// Auth guard — verifies JWT signature before allowing access to protected routes.

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const PUBLIC_PATHS = ['/login'];
const TOKEN_KEY = 'ceisd_admin_token';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = request.cookies.get(TOKEN_KEY)?.value;

  if (!token) {
    return redirectToLogin(request, pathname);
  }

  // Verify the JWT signature — a cookie with a garbage value will fail here
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    // JWT_SECRET not configured — fail closed, never open
    return redirectToLogin(request, pathname);
  }

  try {
    await jwtVerify(token, new TextEncoder().encode(secret));
    return NextResponse.next();
  } catch {
    // Expired, tampered, or invalid token
    const response = redirectToLogin(request, pathname);
    response.cookies.delete(TOKEN_KEY);
    return response;
  }
}

function redirectToLogin(request: NextRequest, pathname: string): NextResponse {
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('redirect', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};
