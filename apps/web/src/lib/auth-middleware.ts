import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create a server-side Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

// API authentication middleware
export async function authMiddleware(request: NextRequest) {
  // Get the auth token from the headers
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    return NextResponse.json(
      { error: 'Authentication token missing' },
      { status: 401 }
    );
  }

  try {
    // Verify the JWT token using Supabase Auth
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Add the user ID to the request headers for use in API routes
    const headers = new Headers(request.headers);
    headers.set('X-User-ID', user.id);

    return NextResponse.next({ request: { headers } });
  } catch (error) {
    console.error('Auth middleware error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

// Role-based authorization middleware
export function hasRole(requiredRoles: string | string[]) {
  return async (request: NextRequest) => {
    const userId = request.headers.get('X-User-ID');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID not found in request' },
        { status: 401 }
      );
    }

    try {
      // Get user role from the database
      const { data: user, error } = await supabase
        .from('profiles') // 使用profiles表而不是users表
        .select('role')
        .eq('id', userId)
        .single();

      if (error || !user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      // 检查角色是否在允许的角色列表中
      const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
      if (!roles.includes(user.role)) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }

      return NextResponse.next();
    } catch (error) {
      console.error('Role check error:', error);
      return NextResponse.json(
        { error: 'Authorization failed' },
        { status: 500 }
      );
    }
  };
}