import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { name, email, phone, role } = body;

    // Validate required fields
    if (!name || !email || !phone || !role) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Return success response with mock data
    return NextResponse.json({
      message: 'Application submitted successfully',
      data: {
        name,
        email,
        phone,
        role,
        submittedAt: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('Error submitting application:', error);
    return NextResponse.json(
      { error: 'Failed to submit application', details: error.message },
      { status: 500 }
    );
  }
}
