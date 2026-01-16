'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { UserNav } from '@/components/UserNav';

// Define local types since @aurora/supabase-types is not available
type UserRole = 'Admin' | 'User' | 'Guest';

interface FundFlow {
  id: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  transaction_date: string;
  created_at: string;
  updated_at: string;
  notes?: string;
}

export default function FundFlow() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [fundFlows, setFundFlows] = useState<FundFlow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'deposit' | 'withdrawal'>('all');
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isObserverMode, setIsObserverMode] = useState(false);

  useEffect(() => {
    const fetchFundFlows = async () => {
      try {
        setLoading(true);
        let currentUser = null;
        let profileData = null;
        let fundFlowsData = [];
        
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
              
              // Get user deposit/withdrawal transactions using user_id
              let query = supabase
                .from('deposit_withdrawal')
                .select('*')
                .eq('user_id', profileData.id)
                .order('created_at', { ascending: false });
              
              if (filter !== 'all') {
                query = query.eq('type', filter);
              }
              
              const { data } = await query;
              fundFlowsData = data || [];
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
              
              // Get user deposit/withdrawal transactions
              let query = supabase
                .from('deposit_withdrawal')
                .select('*')
                .eq('user_id', currentUser.id)
                .order('created_at', { ascending: false });
              
              if (filter !== 'all') {
                query = query.eq('type', filter);
              }
              
              const { data } = await query;
              fundFlowsData = data || [];
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
          
          if (fundFlowsData) {
            const formattedFundFlows = fundFlowsData.map((flow: any) => ({
              id: flow.id,
              type: flow.type,
              amount: flow.amount,
              status: flow.status,
              transaction_date: flow.transaction_date,
              created_at: flow.created_at,
              updated_at: flow.updated_at,
              notes: flow.notes
            }));
            
            setFundFlows(formattedFundFlows);
          }
        } else {
          // If no user data, keep the user on the page with a message
          console.log('No user data found, keeping on fund flow page');
        }
      } catch (error) {
        console.error('Error fetching fund flows:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFundFlows();
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
            请登录以查看您的资金流水。如果您已经登录，请刷新页面重试。
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
        <h1 className="text-2xl font-bold text-gray-800">资金流水</h1>
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
              <button
                className={`px-4 py-2 rounded-md ${filter === 'deposit' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
                onClick={() => setFilter('deposit')}
              >
                入金记录
              </button>
              <button
                className={`px-4 py-2 rounded-md ${filter === 'withdrawal' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
                onClick={() => setFilter('withdrawal')}
              >
                出金记录
              </button>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日期</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">类型</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">金额</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">备注</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {fundFlows.length > 0 ? (
                  fundFlows.map((flow) => (
                    <tr key={flow.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(flow.created_at).toLocaleString('zh-CN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${flow.type === 'deposit' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {flow.type === 'deposit' ? '入金记录' : '出金记录'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {flow.amount.toFixed(2)} 元
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${flow.status === 'completed' ? 'bg-green-100 text-green-800' : flow.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                          {flow.status === 'completed' ? '已完成' : flow.status === 'pending' ? '处理中' : '失败'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {flow.notes || '-'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                      暂无资金流水记录
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