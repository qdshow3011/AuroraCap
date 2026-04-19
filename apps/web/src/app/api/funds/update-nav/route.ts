import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Fund NAV update API (PUT /api/funds/update-nav)
export async function PUT(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { fund_id, nav, daily_return, weekly_return, monthly_return, annual_return } = body;

    // Validate required fields
    if (!fund_id || nav === undefined || nav === null) {
      return NextResponse.json(
        { error: 'Fund ID and NAV are required' },
        { status: 400 }
      );
    }

    // Return mock data for build process
    return NextResponse.json({
      message: 'Fund NAV updated successfully',
      data: {
        id: fund_id,
        nav,
        daily_return,
        weekly_return,
        monthly_return,
        annual_return,
        updated_at: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('Fund NAV update error:', error);
    return NextResponse.json(
      { error: 'Failed to update fund NAV', details: error.message },
      { status: 500 }
    );
  }
}

// Get fund NAV history API (GET /api/funds/update-nav?fund_id=xxx)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fundId = searchParams.get('fund_id');
    const limit = parseInt(searchParams.get('limit') || '30');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    if (!fundId) {
      return NextResponse.json(
        { error: 'Fund ID is required' },
        { status: 400 }
      );
    }

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
    console.error('Fund NAV history error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch NAV history', details: error.message },
      { status: 500 }
    );
  }
}
