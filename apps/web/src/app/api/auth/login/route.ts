import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// User login API (POST /api/auth/login)
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { loginId, password } = body;

    // Validate required fields
    if (!loginId || !password) {
      return NextResponse.json(
        { error: 'ID/Passport/Phone and password are required' },
        { status: 400 }
      );
    }

    // Return mock data for build process
    const mockSessionData = {
      user: {
        id: 'mock-user-id',
        email: 'mock@example.com',
        first_name: 'Mock',
        last_name: 'User',
        role: 'USER',
        created_at: new Date().toISOString()
      },
      session: {
        access_token: 'temp_' + Math.random().toString(36).substr(2),
        refresh_token: 'temp_refresh_' + Math.random().toString(36).substr(2),
        expires_at: Date.now() + 3600000 // 1 hour from now
      }
    };

    // Return a success response with mock data
    return NextResponse.json({
      message: 'Login successful',
      data: mockSessionData,
      mockSession: true
    });

  } catch (error: any) {
    console.error('User login error:', error);
    
    // Return detailed error information for debugging
    return NextResponse.json(
      {
        error: 'Login failed',
        details: error.message
      },
      { status: 500 }
    );
  }
}