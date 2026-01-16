'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { UserNav } from '@/components/UserNav';

// Define local types since @aurora/supabase-types is not available
type UserRole = 'Admin' | 'User' | 'Guest';

interface Transaction {
  id: string;
  type: 'subscription' | 'redemption';
  shares: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  transaction_date: string;
  created_at: string;
  updated_at: string;
  fund_id: string;
  fund_name?: string;
  nav?: number;
  total_amount?: number;
}

export default function Transactions() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'subscription' | 'redemption'>('all');
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isObserverMode, setIsObserverMode] = useState(false);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        let currentUser = null;
        let profileData = null;
        let transactionsData = [];
        
        // 1. First check for mock session in localStorage
        try {
          const mockSession = localStorage.getItem('mock_session');
          if (mockSession) {
            const sessionData = JSON.parse(mockSession);
            currentUser = sessionData.user;
            
            // Get user profile from users table
            if (currentUser?.email) {
              const { data: userData } = await supabase
                .from('users')
                .select('*')
                .eq('email', currentUser.email)
                .single();
              profileData = userData;
              
              if (profileData) {
                // Get user subscription/redemption transactions using user_id
                let query = supabase
                  .from('subscription_redemption')
                  .select('*')
                  .eq('user_id', profileData.id)
                  .order('created_at', { ascending: false });
                
                if (filter !== 'all') {
                  query = query.eq('type', filter);
                }
                
                const { data, error } = await query;
                if (error) {
                  console.error('Error fetching transactions:', error);
                }
                transactionsData = data || [];
              }
            }
          }
        } catch (mockError) {
          console.error('Mock session error:', mockError);
        }
        
        // 2. If no mock session, try Supabase Auth
        if (!currentUser) {
          try {
            const { data: { user: supabaseUser } } = await supabase.auth.getUser();
            currentUser = supabaseUser;
            
            // Get user profile from users table
            if (currentUser?.email) {
              const { data: userData } = await supabase
                .from('users')
                .select('*')
                .eq('email', currentUser.email)
                .single();
              profileData = userData;
              
              if (profileData) {
                // Get user subscription/redemption transactions
                let query = supabase
                  .from('subscription_redemption')
                  .select('*')
                  .eq('user_id', profileData.id)
                  .order('created_at', { ascending: false });
                
                if (filter !== 'all') {
                  query = query.eq('type', filter);
                }
                
                const { data, error } = await query;
                if (error) {
                  console.error('Error fetching transactions:', error);
                }
                transactionsData = data || [];
              }
            }
          } catch (authError) {
            console.error('Supabase Auth error:', authError);
          }
        }
        
        // 3. If we have user data, update state
        if (currentUser && profileData) {
          setUser(currentUser);
          setProfile(profileData);
          setUserRole(profileData.role as UserRole);
          setIsObserverMode(profileData.role === 'Guest' || profileData.role === 'User');
          
          if (transactionsData && transactionsData.length > 0) {
            // Get unique fund IDs from transactions
            const fundIds = [...new Set(transactionsData.map(t => t.fund_id))];
            
            // Fetch fund names from products table
            let fundNames: { [key: string]: string } = {};
            if (fundIds.length > 0) {
              const { data: funds } = await supabase
                .from('products')
                .select('id, name_cn')
                .in('id', fundIds);
              
              if (funds) {
                fundNames = funds.reduce((acc, fund) => {
                  acc[fund.id] = fund.name_cn;
                  return acc;
                }, {} as { [key: string]: string });
              }
            }
            
            const formattedTransactions = transactionsData.map((transaction: any) => ({
              id: transaction.id,
              type: transaction.type,
              shares: transaction.shares,
              status: transaction.status,
              transaction_date: transaction.transaction_date || transaction.created_at,
              created_at: transaction.created_at,
              updated_at: transaction.updated_at,
              fund_id: transaction.fund_id,
              fund_name: fundNames[transaction.fund_id] || transaction.fund_id,
              nav: transaction.nav,
              total_amount: transaction.total_amount || (transaction.shares * (transaction.nav || 0))
            }));
            
            setTransactions(formattedTransactions);
          } else {
            setTransactions([]);
          }
        } else {
          // If no user data, keep the user on the page with a message
          console.log('No user data found, keeping on transactions page');
        }
      } catch (error) {
        console.error('Error fetching transactions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [filter]);

  if (loading) {
    return <div className="container mx-auto px-4 py-8">加载中...</div>;
  }

  // If no user data found, show a message instead of redirecting
  if (!userRole) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-2xl mx-auto text-center">
          <h1 className="text-2xl md:text-3xl font-bold mb-4">需要登录</h1>
          <p className="text-gray-600 mb-8">
            请登录以查看您的交易记录。如果您已经登录，请刷新页面重试。
          </p>
          <Link 
            href="/login" 
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            去登录
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">交易记录</h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left sidebar with account management menu */}
        <div className="lg:col-span-1">
          <UserNav user={user} profile={profile} />
        </div>
        
        {/* Main content */}
        <div className="lg:col-span-3">
          <div className="flex justify-between items-center mb-8">
            <div className="flex space-x-2">
              <button
                className={`px-4 py-2 rounded-md ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
                onClick={() => setFilter('all')}
              >
                全部
              </button>
              <div>
                <button
                  className={`px-4 py-2 rounded-md ${filter === 'subscription' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
                  onClick={() => setFilter('subscription')}
                >
                  申购申请
                </button>
              </div>
              <div>
                <button
                  className={`px-4 py-2 rounded-md ${filter === 'redemption' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
                  onClick={() => setFilter('redemption')}
                >
                  赎回申请
                </button>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日期</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">类型</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">基金名称</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">份额</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">金额</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.length > 0 ? (
                  transactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(transaction.created_at).toLocaleString('zh-CN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link 
                          href={transaction.type === 'subscription' ? '/user/subscribe-apply' : '/user/redeem-apply'}
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full hover:underline ${transaction.type === 'subscription' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                        >
                          {transaction.type === 'subscription' ? '申购申请' : '赎回申请'}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transaction.fund_name || '未知基金'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transaction.shares ? transaction.shares.toFixed(4) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {transaction.total_amount ? transaction.total_amount.toFixed(2) : (transaction.shares * (transaction.nav || 0)).toFixed(2)} 元
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${transaction.status === 'completed' ? 'bg-green-100 text-green-800' : transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                          {transaction.status === 'completed' ? '已完成' : transaction.status === 'pending' ? '处理中' : '失败'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                      暂无交易记录
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}