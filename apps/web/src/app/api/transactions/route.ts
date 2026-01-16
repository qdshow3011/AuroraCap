import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { authMiddleware } from '@/lib/auth-middleware';
import type { NextRequest } from 'next/server';

// Transaction history query API (GET /api/transactions)
export async function GET(request: NextRequest) {
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

    // Get query parameters for filtering and pagination
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const transactionType = searchParams.get('type');
    const fundId = searchParams.get('fund_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const status = searchParams.get('status');

    // Build the query with joins for fund information
    let query = supabase
      .from('transactions')
      .select(`
        *, 
        funds (id, name, symbol, category)
      `, { count: 'exact' })
      .eq('user_id', userId);

    // Apply filters if provided
    if (transactionType) {
      query = query.eq('transaction_type', transactionType);
    }

    if (fundId) {
      query = query.eq('fund_id', fundId);
    }

    if (startDate) {
      query = query.gte('transaction_date', startDate);
    }

    if (endDate) {
      query = query.lte('transaction_date', endDate);
    }

    if (status) {
      query = query.eq('status', status);
    }

    // Apply sorting and pagination
    query = query
      .order('transaction_date', { ascending: false })
      .range(offset, offset + limit - 1);

    // Execute the query
    const { data: transactions, error, count } = await query;

    if (error) {
      throw error;
    }

    // Calculate statistics if needed
    const statistics = await getTransactionStatistics(userId);

    return NextResponse.json({
      data: transactions || [],
      meta: {
        limit,
        offset,
        total: count || 0,
        statistics
      }
    });
  } catch (error: any) {
    console.error('Transaction history query error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transaction history', details: error.message },
      { status: 500 }
    );
  }
}

// Helper function to get transaction statistics
async function getTransactionStatistics(userId: string) {
  // Get all transactions for the user
  const { data: allTransactions } = await supabase
    .from('transactions')
    .select('transaction_type, status, amount')
    .eq('user_id', userId);

  // Initialize statistics
  const stats = {
    total_subscribe_amount: 0,
    total_redeem_amount: 0,
    net_investment: 0,
    type_counts: [] as Array<{ transaction_type: string; status: string; count: number }>
  };

  if (!allTransactions) {
    return stats;
  }

  // Calculate total amounts
  allTransactions.forEach(transaction => {
    if (transaction.status === 'COMPLETED') {
      if (transaction.transaction_type === 'SUBSCRIBE') {
        stats.total_subscribe_amount += transaction.amount;
      } else if (transaction.transaction_type === 'REDEEM') {
        stats.total_redeem_amount += transaction.amount;
      }
    }
  });

  // Calculate net investment
  stats.net_investment = stats.total_subscribe_amount - stats.total_redeem_amount;

  // Calculate counts by type and status using JavaScript
  const typeStatusMap = new Map<string, number>();
  
  allTransactions.forEach(transaction => {
    const key = `${transaction.transaction_type}-${transaction.status}`;
    const currentCount = typeStatusMap.get(key) || 0;
    typeStatusMap.set(key, currentCount + 1);
  });

  // Format the type counts
  typeStatusMap.forEach((count, key) => {
    const [transaction_type, status] = key.split('-');
    stats.type_counts.push({
      transaction_type,
      status,
      count
    });
  });

  return stats;
}