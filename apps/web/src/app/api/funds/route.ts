import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Fund list query API (GET /api/funds)
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
        total: 0,
        categories: []
      }
    });
  } catch (error: any) {
    console.error('Fund list query error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch funds', details: error.message },
      { status: 500 }
    );
  }
}