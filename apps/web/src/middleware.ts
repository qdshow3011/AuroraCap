import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const pathname = request.nextUrl.pathname;
  
  // Check if the request is for an API route
  const isApiRoute = pathname.startsWith('/api/');

  if (isApiRoute) {
    // CORS configuration for API routes
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-ID');
    response.headers.set('Access-Control-Max-Age', '86400');

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { status: 204, headers: response.headers });
    }

    // API Key validation for public endpoints (excluding auth endpoints)
    const publicEndpoints = ['/api/auth/register', '/api/auth/login', '/api/auth/logout', '/api/auth/reset-password'];
    const isPublicEndpoint = publicEndpoints.some(endpoint => pathname.startsWith(endpoint));
    
    if (!isPublicEndpoint) {
      // Check for API key in header or query parameter
      const apiKey = request.headers.get('X-API-Key') || request.nextUrl.searchParams.get('api_key');
      
      // In production, you'd validate this against a database or environment variable
      const validApiKey = process.env.API_KEY || 'development-api-key';
      
      if (!apiKey || apiKey !== validApiKey) {
        return new NextResponse(
          JSON.stringify({ error: 'Invalid API key' }),
          { status: 401, headers: response.headers }
        );
      }
    }

    return response;
  }

  // Regular web app routing middleware
  // Get auth token from cookies
  const authToken = request.cookies.get('sb-access-token')?.value;
  
  // Check for mock session in cookies (if set by login form)
  const mockSessionCookie = request.cookies.get('mock_session')?.value;

  // For now, we'll use a simple check without Supabase client initialization
  // In a production app, you'd properly validate the token
  const isAuthenticated = !!authToken || !!mockSessionCookie;

  // Define protected routes that require strict authentication checking
  // Note: We're removing /user and /user/* from strict middleware protection
  // because they handle their own authentication internally and support mock sessions
  const protectedRoutes = [
    // Insights detail pages (full article reading) - require login
    '/insights/[insightId]'
  ];
  
  const isProtectedRoute = protectedRoutes.some(route => {
    // Handle wildcard routes
    if (route.endsWith('/*')) {
      const baseRoute = route.slice(0, -2);
      return request.nextUrl.pathname.startsWith(baseRoute);
    }
    // Handle dynamic routes like /insights/[insightId]
    if (route.includes('[insightId]')) {
      const baseRoute = route.split('[')[0];
      return request.nextUrl.pathname.startsWith(baseRoute) && 
             request.nextUrl.pathname !== '/insights'; // Exclude insights list page
    }
    // Handle exact routes
    return request.nextUrl.pathname === route;
  });

  // Redirect to login if user is not authenticated and trying to access protected route
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // For fund subscription and redemption pages, we'll let the pages handle their own authentication
  // This allows mock sessions to work properly

  // Redirect to user dashboard if user is authenticated and trying to access auth pages
  const authPages = ['/login', '/register'];
  const isAuthPage = authPages.some(page => request.nextUrl.pathname === page);

  if (isAuthPage && isAuthenticated) {
    return NextResponse.redirect(new URL('/user', request.url));
  }

  return response;
}

// See "Matching Paths" below to learn more
// https://nextjs.org/docs/app/building-your-application/routing/middleware#matching-paths
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};