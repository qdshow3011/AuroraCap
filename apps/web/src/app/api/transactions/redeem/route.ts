import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Fund redemption API (POST /api/transactions/redeem)
export async function POST(request: NextRequest) {
  try {
    // Get the user ID from the request headers
    const userId = request.headers.get('X-User-ID');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID not found in request' },
        { status: 401 }
      );
    }

    // Get the redemption data from the request body
    const { fund_id, shares, amount } = await request.json();

    // Validate the request data
    if (!fund_id || (!shares && !amount)) {
      return NextResponse.json(
        { error: 'Fund ID and either shares or amount are required' },
        { status: 400 }
      );
    }

    if ((shares && shares <= 0) || (amount && amount <= 0)) {
      return NextResponse.json(
        { error: 'Shares or amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Return mock data for build process
    const nav = 1.0;
    const sharesToRedeem = shares || (amount! / nav);
    const redemptionAmount = sharesToRedeem * nav;

    return NextResponse.json({
      data: {
        id: 'mock-transaction-id',
        user_id: userId,
        fund_id,
        transaction_type: 'REDEEM',
        amount: redemptionAmount,
        shares: sharesToRedeem,
        nav,
        status: 'COMPLETED',
        transaction_date: new Date().toISOString()
      },
      message: 'Fund redemption successful'
    });
  } catch (error: any) {
    console.error('Fund redemption error:', error);
    return NextResponse.json(
      { error: 'Failed to redeem fund shares', details: error.message },
      { status: 500 }
    );
  }
}