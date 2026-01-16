import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { NextRequest } from 'next/server';

// User registration API (POST /api/auth/register)
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { password, name, phone, id_number, invitation_code } = body;

    // Validate required fields
    if (!password || !name || !phone || !id_number || !invitation_code) {
      return NextResponse.json(
        { error: 'All required fields must be provided, including invitation code' },
        { status: 400 }
      );
    }

    // Validate password strength (at least 6 characters)
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Validate invitation code
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

    // Generate email from phone number for Supabase Auth (since Supabase requires email)
    const email = `${phone}@auroracm.net`; // This matches the existing email format in the database

    // TODO: Update invitation code status after successful registration
    await supabase
      .from('invitation_codes')
      .update({ status: 'USED', used_at: new Date().toISOString() })
      .eq('code', invitation_code);

    // Create user with Supabase Auth
    const { data: authResponse, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          phone,
          id_number,
          role: 'USER', // Default role
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      }
    });

    if (authError) {
      throw authError;
    }

    if (!authResponse.user) {
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 500 }
      );
    }

    // Split name into first and last name (simplified approach)
    const nameParts = name.split(' ');
    const first_name = nameParts[0] || '';
    const last_name = nameParts.slice(1).join(' ') || '';

    // Create user profile in the database
    const { error: profileError } = await supabase
      .from('users')
      .upsert({
        id: authResponse.user.id,
        email: authResponse.user.email,
        name,
        first_name,
        last_name,
        phone,
        id_number,
        role: 'USER',
        invitation_code,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      });

    if (profileError) {
      console.error('Error creating user profile:', profileError);
      // Continue with response even if profile creation fails
    }

    // Return success response
    return NextResponse.json({
      message: 'User registered successfully',
      data: {
        user_id: authResponse.user.id,
        email: authResponse.user.email,
        first_name,
        last_name,
        role: 'USER'
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error('User registration error:', error);
    
    // Handle specific error cases
    if (error.message.includes('User already registered')) {
      return NextResponse.json(
        { error: 'Email is already registered' },
        { status: 400 }
      );
    }

    if (error.message.includes('Password')) {
      return NextResponse.json(
        { error: 'Password requirements not met' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to register user', details: error.message },
      { status: 500 }
    );
  }
}
