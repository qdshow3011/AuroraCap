'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { UserNav } from '@/components/UserNav';

// Define local types since @aurora/supabase-types is not available
type UserRole = 'Admin' | 'User' | 'Guest';

interface Fund {
  id: string;
  name: string;
  name_cn: string;
  nav: number;
  description: string;
  status: 'active' | 'closed';
}

export default function SubscribeApply() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [funds, setFunds] = useState<Fund[]>([]);
  const [selectedFund, setSelectedFund] = useState<Fund | null>(null);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isObserverMode, setIsObserverMode] = useState(false);

  // Fetch user data and funds
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        let currentUser = null;
        let profileData = null;
        let fundsData = [];
        
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
            }
          } catch (authError) {
            console.error('Supabase Auth error:', authError);
          }
        }
        
        // 3. Get user positions first
        let userPositionFundIds: string[] = [];
        if (profileData || currentUser) {
          const userId = profileData?.id || currentUser?.id;
          if (userId) {
            const { data: positionsData } = await supabase
              .from('positions')
              .select('fund_id')
              .eq('user_id', userId);
            
            if (positionsData && positionsData.length > 0) {
              userPositionFundIds = [...new Set(positionsData.map(p => p.fund_id))];
              console.log('User position fund ids:', userPositionFundIds);
            }
          }
        }
        
        // 4. Get funds list based on user positions
        if (userPositionFundIds.length > 0) {
          try {
            const { data } = await supabase
              .from('products')
              .select('*')
              .eq('status', 'active')
              .in('id', userPositionFundIds)
              .order('created_at', { ascending: false });
            fundsData = data || [];
            console.log('Found funds for user positions:', fundsData);
          } catch (fundsError) {
            console.error('Error fetching funds:', fundsError);
          }
        }
        
        // 5. If we have user data, update state
        if (currentUser) {
          setUser(currentUser);
          
          // Use profileData if available, otherwise use default values
          if (profileData) {
            setProfile(profileData);
            setUserRole(profileData.role as UserRole);
            setIsObserverMode(profileData.role === 'Guest' || profileData.role === 'User');
          } else {
            // If no profileData, still allow access with default role
            setUserRole('User');
            setIsObserverMode(false);
          }
        }
        
        // Set funds
        setFunds(fundsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFund || !amount || parseFloat(amount) <= 0) {
      alert('请选择基金并输入有效的申购金额');
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Get current user
      const userId = profile?.id || user?.id;
      
      if (!userId) {
        alert('用户信息错误，请重新登录');
        return;
      }
      
      // Create subscription record
      const { data, error } = await supabase
        .from('subscription_redemption')
        .insert({
          user_id: userId,
          fund_id: selectedFund.id,
          type: 'subscription',
          amount: parseFloat(amount),
          status: 'pending',
          shares: parseFloat(amount) / selectedFund.nav,
          nav: selectedFund.nav,
          transaction_date: new Date().toISOString(),
          notes: `申购${selectedFund.name_cn}`
        })
        .select('*');
      
      if (error) {
        throw error;
      }
      
      setSuccess(true);
      // Reset form after success
      setTimeout(() => {
        setSuccess(false);
        setSelectedFund(null);
        setAmount('');
      }, 3000);
    } catch (error) {
      console.error('Subscription error:', error);
      alert('申购申请提交失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

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
            请登录以提交申购申请。如果您已经登录，请刷新页面重试。
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
        <h1 className="text-2xl font-bold text-gray-800">申购申请</h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left sidebar with account management menu */}
        <div className="lg:col-span-1">
          <UserNav user={user} profile={profile} />
        </div>
        
        {/* Main content */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow-md p-8">
            {success ? (
              <div className="text-center py-8">
                <div className="text-green-500 text-4xl mb-4">✓</div>
                <h2 className="text-xl font-bold mb-2">申购申请提交成功</h2>
                <p className="text-gray-600">您的申购申请已提交，正在处理中。</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <h2 className="text-xl font-bold mb-6">基金申购</h2>
                
                {/* Fund Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">选择基金</label>
                  <select 
                    className="w-full p-2 border border-gray-300 rounded-md" 
                    value={selectedFund?.id || ''}
                    onChange={(e) => {
                      const fund = funds.find(f => f.id === e.target.value);
                      setSelectedFund(fund || null);
                    }}
                  >
                    <option value="">请选择基金</option>
                    {funds.map(fund => (
                      <option key={fund.id} value={fund.id}>
                        {fund.name_cn} - ¥{(fund.nav || 0).toFixed(4)}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Fund Details */}
                {selectedFund && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-md">
                    <h3 className="font-semibold mb-2">{selectedFund.name_cn}</h3>
                    <p className="text-sm text-gray-600 mb-2">{selectedFund.description}</p>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">最新净值:</span>
                      <span className="font-medium">¥{(selectedFund.nav || 0).toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">状态:</span>
                      <span className={`font-medium ${selectedFund.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                        {selectedFund.status === 'active' ? '开放申购' : '已关闭'}
                      </span>
                    </div>
                  </div>
                )}
                
                {/* Amount Input */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">申购金额 (元)</label>
                  <input 
                    type="number" 
                    className="w-full p-2 border border-gray-300 rounded-md" 
                    placeholder="请输入申购金额" 
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min="1"
                    step="0.01"
                    disabled={!selectedFund}
                  />
                  {selectedFund && amount && parseFloat(amount) > 0 && selectedFund.nav && (
                    <div className="mt-2 text-sm text-gray-500">
                      预计申购份额: {(parseFloat(amount) / selectedFund.nav).toFixed(4)}
                    </div>
                  )}
                </div>
                
                {/* Risk Warning */}
                <div className="mb-6 p-4 bg-yellow-50 rounded-md">
                  <h3 className="font-semibold text-yellow-800 mb-1">风险提示</h3>
                  <p className="text-sm text-yellow-700">
                    基金投资有风险，申购需谨慎。请确保您已充分了解该基金的风险收益特征，并根据自身风险承受能力做出投资决策。
                  </p>
                </div>
                
                {/* Submit Button */}
                <div className="flex justify-end">
                  <button 
                    type="submit" 
                    className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors" 
                    disabled={!selectedFund || !amount || submitting}
                  >
                    {submitting ? '提交中...' : '提交申购申请'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}