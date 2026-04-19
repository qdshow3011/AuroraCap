import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Transaction history query API (GET /api/transactions)
export async function GET(request: NextRequest) {
  try {
    // Get the user ID from the request headers
    const userId = request.headers.get('X-User-ID') || '1'; // Mock user ID

    // Get query parameters for filtering and pagination
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const transactionType = searchParams.get('type');
    const fundId = searchParams.get('fund_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const status = searchParams.get('status');

    // Mock funds data
    const mockFunds = [
      { id: '1', name: '全球股票基金', symbol: 'GSF', category: '股票' },
      { id: '2', name: '债券基金', symbol: 'BF', category: '债券' },
      { id: '3', name: '货币市场基金', symbol: 'MMF', category: '货币' },
      { id: '4', name: '混合基金', symbol: 'HF', category: '混合' }
    ];

    // Mock transactions data
    const mockTransactions = [
      {
        id: '1',
        user_id: userId,
        fund_id: '1',
        transaction_type: 'SUBSCRIBE',
        amount: 10000,
        shares: 952.38,
        nav: 10.5,
        payment_method: 'bank_transfer',
        status: 'COMPLETED',
        transaction_date: '2024-01-15T10:00:00Z',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
        funds: mockFunds[0]
      },
      {
        id: '2',
        user_id: userId,
        fund_id: '2',
        transaction_type: 'SUBSCRIBE',
        amount: 5000,
        shares: 476.19,
        nav: 10.5,
        payment_method: 'bank_transfer',
        status: 'COMPLETED',
        transaction_date: '2024-01-10T14:30:00Z',
        created_at: '2024-01-10T14:30:00Z',
        updated_at: '2024-01-10T14:30:00Z',
        funds: mockFunds[1]
      },
      {
        id: '3',
        user_id: userId,
        fund_id: '1',
        transaction_type: 'REDEEM',
        amount: 2000,
        shares: 190.48,
        nav: 10.5,
        payment_method: 'bank_transfer',
        status: 'COMPLETED',
        transaction_date: '2024-01-05T09:15:00Z',
        created_at: '2024-01-05T09:15:00Z',
        updated_at: '2024-01-05T09:15:00Z',
        funds: mockFunds[0]
      }
    ];

    // Apply filters
    let filteredTransactions = [...mockTransactions];
    
    if (transactionType) {
      filteredTransactions = filteredTransactions.filter(t => t.transaction_type === transactionType);
    }
    
    if (fundId) {
      filteredTransactions = filteredTransactions.filter(t => t.fund_id === fundId);
    }
    
    if (startDate) {
      filteredTransactions = filteredTransactions.filter(t => t.transaction_date >= startDate);
    }
    
    if (endDate) {
      filteredTransactions = filteredTransactions.filter(t => t.transaction_date <= endDate);
    }
    
    if (status) {
      filteredTransactions = filteredTransactions.filter(t => t.status === status);
    }

    // Apply pagination
    const paginatedTransactions = filteredTransactions.slice(offset, offset + limit);

    // Calculate statistics
    const statistics = getTransactionStatistics(mockTransactions);

    return NextResponse.json({
      data: paginatedTransactions,
      meta: {
        limit,
        offset,
        total: filteredTransactions.length,
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
function getTransactionStatistics(transactions: any[]) {
  // Initialize statistics
  const stats = {
    total_subscribe_amount: 0,
    total_redeem_amount: 0,
    net_investment: 0,
    type_counts: [] as Array<{ transaction_type: string; status: string; count: number }>
  };

  if (!transactions.length) {
    return stats;
  }

  // Calculate total amounts
  transactions.forEach(transaction => {
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
  
  transactions.forEach(transaction => {
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