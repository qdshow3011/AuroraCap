import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Fund subscription API (POST /api/transactions/subscribe)
export async function POST(request: NextRequest) {
  try {
    // Get the user ID from the request headers
    const userId = request.headers.get('X-User-ID') || '1'; // Mock user ID

    // Get the subscription data from the request body
    const { fund_id, amount, payment_method } = await request.json();

    // Validate the request data
    if (!fund_id || !amount || !payment_method) {
      return NextResponse.json(
        { error: 'Fund ID, amount, and payment method are required' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Mock fund data
    const fund = {
      id: fund_id,
      nav: 10.5 // Mock NAV value
    };

    // Calculate the number of shares
    const shares = amount / fund.nav;

    // Mock user account data
    const userAccount = {
      id: '1',
      available_balance: 10000, // Mock balance
      user_id: userId
    };

    if (userAccount.available_balance < amount) {
      return NextResponse.json(
        { error: 'Insufficient balance' },
        { status: 400 }
      );
    }

    // Mock transaction data
    const transaction = {
      id: 'mock-transaction-' + Date.now(),
      user_id: userId,
      fund_id: fund_id,
      transaction_type: 'SUBSCRIBE',
      amount: amount,
      shares: shares,
      nav: fund.nav,
      payment_method: payment_method,
      status: 'COMPLETED',
      transaction_date: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return NextResponse.json({
      data: transaction,
      message: 'Fund subscription successful'
    });
  } catch (error: any) {
    console.error('Fund subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to subscribe to fund', details: error.message },
      { status: 500 }
    );
  }
}