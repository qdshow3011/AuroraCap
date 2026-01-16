import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { authMiddleware } from '@/lib/auth-middleware';
import type { NextRequest } from 'next/server';

// Fund redemption API (POST /api/transactions/redeem)
export async function POST(request: NextRequest) {
  try {
    // Apply authentication middleware
    const authResponse = await authMiddleware(request);
    if (authResponse instanceof NextResponse && authResponse.status !== 200) {
      return authResponse;
    }

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

    // Fetch the fund details to calculate the redemption value
    const { data: fund, error: fundError } = await supabase
      .from('funds')
      .select('id, nav')
      .eq('id', fund_id)
      .single();

    if (fundError || !fund) {
      return NextResponse.json(
        { error: 'Fund not found' },
        { status: 404 }
      );
    }

    // Fetch the user's holdings in this fund
    const { data: holding, error: holdingError } = await supabase
      .from('user_holdings')
      .select('id, shares')
      .eq('user_id', userId)
      .eq('fund_id', fund_id)
      .single();

    if (holdingError || !holding) {
      return NextResponse.json(
        { error: 'You do not hold shares of this fund' },
        { status: 400 }
      );
    }

    // Determine the number of shares to redeem
    let sharesToRedeem;
    if (shares) {
      sharesToRedeem = shares;
    } else {
      // Calculate shares from amount
      sharesToRedeem = amount! / fund.nav;
    }

    // Check if the user has sufficient shares
    if (sharesToRedeem > holding.shares) {
      return NextResponse.json(
        { error: 'Insufficient shares' },
        { status: 400 }
      );
    }

    // Calculate the redemption amount
    const redemptionAmount = sharesToRedeem * fund.nav;

    // Create the transaction record
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        fund_id: fund_id,
        transaction_type: 'REDEEM',
        amount: redemptionAmount,
        shares: sharesToRedeem,
        nav: fund.nav,
        status: 'COMPLETED',
        transaction_date: new Date().toISOString()
      })
      .select('*')
      .single();

    if (transactionError) {
      throw transactionError;
    }

    // Update the user's holdings
    const newShares = holding.shares - sharesToRedeem;
    if (newShares <= 0) {
      // If no shares remain, delete the holding record
      await supabase
        .from('user_holdings')
        .delete()
        .eq('id', holding.id);
    } else {
      // Otherwise, update the holding with the new share count
      await supabase
        .from('user_holdings')
        .update({
          shares: newShares,
          updated_at: new Date().toISOString()
        })
        .eq('id', holding.id);
    }

    // Update the user's available balance
    const { data: userAccount } = await supabase
      .from('user_accounts')
      .select('id, available_balance')
      .eq('user_id', userId)
      .single();

    if (userAccount) {
      await supabase
        .from('user_accounts')
        .update({
          available_balance: userAccount.available_balance + redemptionAmount,
          updated_at: new Date().toISOString()
        })
        .eq('id', userAccount.id);
    }

    return NextResponse.json({
      data: transaction,
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