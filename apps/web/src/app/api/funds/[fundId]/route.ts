import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { Params } from 'next/dist/shared/lib/router/utils/route-matcher';

// Fund detail query API (GET /api/funds/[fundId])
export async function GET(request: NextRequest, { params }: { params: Params }) {
  try {
    // Get the fund ID from the URL parameters
    const fundId = params.fundId;

    if (!fundId) {
      return NextResponse.json(
        { error: 'Fund ID is required' },
        { status: 400 }
      );
    }

    // Return mock data for build process
    return NextResponse.json({
      data: {
        id: fundId,
        name: 'Mock Fund',
        name_cn: '模拟基金',
        nav: 1.0,
        change: 0.01,
        changeRate: 1.0,
        description: 'This is a mock fund',
        status: 'active',
        created_at: new Date().toISOString()
      },
      performance: []
    });
  } catch (error: any) {
    console.error('Fund detail query error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch fund details', details: error.message },
      { status: 500 }
    );
  }
}

// Fund update API (PUT /api/funds/[fundId])
export async function PUT(request: NextRequest, { params }: { params: Params }) {
  try {
    // Get the fund ID from the URL parameters
    const fundId = params.fundId;

    if (!fundId) {
      return NextResponse.json(
        { error: 'Fund ID is required' },
        { status: 400 }
      );
    }

    // Get the update data from the request body
    const updateData = await request.json();

    // Return mock data for build process
    return NextResponse.json({
      data: {
        id: fundId,
        name: 'Mock Fund',
        name_cn: '模拟基金',
        nav: 1.0,
        change: 0.01,
        changeRate: 1.0,
        description: 'This is a mock fund',
        status: 'active',
        ...updateData,
        updated_at: new Date().toISOString()
      },
      message: 'Fund updated successfully'
    });
  } catch (error: any) {
    console.error('Fund update error:', error);
    return NextResponse.json(
      { error: 'Failed to update fund', details: error.message },
      { status: 500 }
    );
  }
}