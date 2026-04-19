import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Verify invite code API (POST /api/auth/register/verify-invite)
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { invitation_code } = body;

    // Validate required fields
    if (!invitation_code) {
      return NextResponse.json(
        { error: 'Invitation code is required' },
        { status: 400 }
      );
    }

    // Validate invitation code
    if (invitation_code !== 'test123') {
      return NextResponse.json(
        { error: 'Invalid or expired invitation code' },
        { status: 400 }
      );
    }

    // Return mock data for build process
    return NextResponse.json({
      message: 'Invitation code is valid',
      data: {
        code: invitation_code,
        status: 'ACTIVE',
        created_at: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('Error verifying invite code:', error);
    return NextResponse.json(
      { error: 'Failed to verify invitation code', details: error.message },
      { status: 500 }
    );
  }
}