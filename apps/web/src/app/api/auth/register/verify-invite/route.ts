import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
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

    // Check if invite code exists and is active
    const { data: invite, error: inviteError } = await supabase
      .from('invitation_codes')
      .select('*')
      .eq('code', invitation_code)
      .eq('status', 'ACTIVE')
      .single();

    if (inviteError || !invite) {
      return NextResponse.json(
        { error: 'Invalid or expired invitation code' },
        { status: 400 }
      );
    }

    // Return success response
    return NextResponse.json({
      message: 'Invitation code is valid',
      data: {
        code: invite.code,
        status: invite.status,
        created_at: invite.created_at
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