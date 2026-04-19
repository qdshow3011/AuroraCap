import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Insight detail query API (GET /api/insights/[insightId])
export async function GET(request: NextRequest, { params }: { params: { insightId: string } }) {
  try {

    const { insightId } = params;

    // Return mock data for build process
    return NextResponse.json({ 
      data: {
        id: insightId,
        title: 'Mock Insight',
        content: 'This is a mock insight content',
        summary: 'This is a mock insight summary',
        account: {
          id: 'mock-account-id',
          name: 'Mock Account',
          avatar: null
        },
        created_at: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('Insight detail query error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch insight', details: error.message },
      { status: 500 }
    );
  }
}
