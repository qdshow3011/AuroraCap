import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { authMiddleware } from '@/lib/auth-middleware';
import type { NextRequest } from 'next/server';

// Fund subscription API (POST /api/transactions/subscribe)
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

    // Fetch the fund details to calculate the number of shares
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

    // Calculate the number of shares
    const shares = amount / fund.nav;

    // Check if the user has sufficient balance
    const { data: userAccount, error: accountError } = await supabase
      .from('user_accounts')
      .select('id, available_balance')
      .eq('user_id', userId)
      .single();

    if (accountError || !userAccount) {
      return NextResponse.json(
        { error: 'User account not found' },
        { status: 404 }
      );
    }

    if (userAccount.available_balance < amount) {
      return NextResponse.json(
        { error: 'Insufficient balance' },
        { status: 400 }
      );
    }

    // Create the transaction record
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        fund_id: fund_id,
        transaction_type: 'SUBSCRIBE',
        amount: amount,
        shares: shares,
        nav: fund.nav,
        payment_method: payment_method,
        status: 'COMPLETED',
        transaction_date: new Date().toISOString()
      })
      .select('*')
      .single();

    if (transactionError) {
      throw transactionError;
    }

    // Update the user's available balance
    await supabase
      .from('user_accounts')
      .update({
        available_balance: userAccount.available_balance - amount,
        updated_at: new Date().toISOString()
      })
      .eq('id', userAccount.id);

    // Update or create the user's holdings
    const { data: existingHolding } = await supabase
      .from('user_holdings')
      .select('id, shares')
      .eq('user_id', userId)
      .eq('fund_id', fund_id)
      .single();

    if (existingHolding) {
      // Update existing holding
      await supabase
        .from('user_holdings')
        .update({
          shares: existingHolding.shares + shares,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingHolding.id);
    } else {
      // Create new holding
      await supabase
        .from('user_holdings')
        .insert({
          user_id: userId,
          fund_id: fund_id,
          shares: shares,
          purchased_nav: fund.nav,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
    }

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