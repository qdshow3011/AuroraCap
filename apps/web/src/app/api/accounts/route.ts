import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Accounts list query API (GET /api/accounts)
export async function GET(request: NextRequest) {
  try {
    // Get query parameters for filtering and pagination
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // Return mock data for build process
    return NextResponse.json({
      data: [],
      meta: {
        limit,
        offset,
        total: 0
      }
    });
  } catch (error: any) {
    console.error('Accounts list query error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch accounts', details: error.message },
      { status: 500 }
    );
  }
}

// Create account API (POST /api/accounts)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, avatar, user_id } = body;

    if (!name || !user_id) {
      return NextResponse.json(
        { error: 'Name and user_id are required' },
        { status: 400 }
      );
    }

    // Return mock data for build process
    return NextResponse.json({ 
      data: {
        id: 'mock-id',
        name,
        description,
        avatar,
        user_id,
        created_at: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('Create account error:', error);
    return NextResponse.json(
      { error: 'Failed to create account', details: error.message },
      { status: 500 }
    );
  }
}
