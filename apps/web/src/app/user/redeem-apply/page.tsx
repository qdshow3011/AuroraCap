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

interface Position {
  id: string;
  fund_id: string;
  units: number;
  purchase_price: number;
  funds: Fund;
}

export default function RedeemApply() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isObserverMode, setIsObserverMode] = useState(false);
  const [redeemType, setRedeemType] = useState<'amount' | 'units'>('amount');

  // Fetch user data and positions
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get user data - same approach as positions page
        let profileData = null;
        
        // 1. Try Supabase Auth first
        try {
          const { data: { user: supabaseUser } } = await supabase.auth.getUser();
          if (supabaseUser) {
            // Get user profile from users table
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('*')
              .eq('email', supabaseUser.email)
              .single();
            
            if (userError) {
              console.error('Error fetching user profile:', userError);
            } else {
              profileData = userData;
            }
          }
        } catch (authError) {
          console.error('Supabase Auth error:', authError);
        }
        
        // 2. If no Supabase user, try mock session
        if (!profileData) {
          try {
            const mockSession = localStorage.getItem('mock_session');
            if (mockSession) {
              const sessionData = JSON.parse(mockSession);
              const mockUser = sessionData.user;
              
              // Get user profile from users table
              const { data: userData, error: userError } = await supabase
                .from('users')
                .select('*')
                .eq('email', mockUser.email)
                .single();
              
              if (userError) {
                console.error('Error fetching mock user profile:', userError);
              } else {
                profileData = userData;
              }
            }
          } catch (mockError) {
            console.error('Mock session error:', mockError);
          }
        }
        
        // If we have user profile, fetch positions - same as positions page
        if (profileData || currentUser) {
          // Use profileData if available, otherwise use currentUser
          const userToUse = profileData || currentUser;
          setUser(userToUse);
          setProfile(profileData || userToUse);
          
          // Set role - use profileData.role if available, otherwise default to User
          const userRoleToUse = profileData?.role || 'User';
          setUserRole(userRoleToUse as UserRole);
          setIsObserverMode(userRoleToUse === 'Guest' || userRoleToUse === 'User');
          
          // Get user positions from positions table
          const { data: positionsData, error: positionsError } = await supabase
            .from('positions')
            .select('*')
            .eq('user_id', profileData.id);
          
          if (positionsError) {
            console.error('Error fetching positions:', positionsError);
            setPositions([]);
          } else {
            if (positionsData && positionsData.length > 0) {
              // Get unique fund IDs from positions
              const fundIds = [...new Set(positionsData.map(p => p.fund_id))];
              
              // Fetch fund details from products table - same fields as positions page
              let fundDetails: { [key: string]: any } = {};
              if (fundIds.length > 0) {
                const { data: funds, error: fundsError } = await supabase
                  .from('products')
                  .select('id, name_cn, nav, description, status')
                  .in('id', fundIds);
                
                if (fundsError) {
                  console.error('Error fetching fund details:', fundsError);
                } else {
                  // Create fund map for quick lookup
                  fundDetails = funds.reduce((acc, fund) => {
                    acc[fund.id] = fund;
                    return acc;
                  }, {} as { [key: string]: any });
                }
              }
              
              // Merge positions with fund details
              const formattedPositions = positionsData.map((position: any) => ({
                ...position,
                funds: fundDetails[position.fund_id] || {}
              }));
              
              setPositions(formattedPositions);
            } else {
              setPositions([]);
            }
          }
        } else {
          // If no user data, set empty positions
          setPositions([]);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setPositions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPosition || !amount || parseFloat(amount) <= 0) {
      alert('请选择基金并输入有效的赎回金额或份额');
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
      
      // Calculate redeem amount and shares
      let redeemAmount = 0;
      let redeemShares = 0;
      
      if (redeemType === 'amount') {
        redeemAmount = parseFloat(amount);
        redeemShares = redeemAmount / selectedPosition.funds.nav;
      } else {
        redeemShares = parseFloat(amount);
        redeemAmount = redeemShares * selectedPosition.funds.nav;
      }
      
      // Check if user has enough shares
      if (redeemShares > selectedPosition.units) {
        alert('赎回份额不能超过持有份额');
        return;
      }
      
      // Create redemption record
      const { data, error } = await supabase
        .from('subscription_redemption')
        .insert({
          user_id: userId,
          fund_id: selectedPosition.fund_id,
          type: 'redemption',
          amount: redeemAmount,
          status: 'pending',
          shares: redeemShares,
          nav: selectedPosition.funds.nav,
          transaction_date: new Date().toISOString(),
          notes: `赎回${selectedPosition.funds.name_cn}`
        })
        .select('*');
      
      if (error) {
        throw error;
      }
      
      setSuccess(true);
      // Reset form after success
      setTimeout(() => {
        setSuccess(false);
        setSelectedPosition(null);
        setAmount('');
        setRedeemType('amount');
      }, 3000);
    } catch (error) {
      console.error('Redemption error:', error);
      alert('赎回申请提交失败，请稍后重试');
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
            请登录以提交赎回申请。如果您已经登录，请刷新页面重试。
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
        <h1 className="text-2xl font-bold text-gray-800">赎回申请</h1>
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
                <h2 className="text-xl font-bold mb-2">赎回申请提交成功</h2>
                <p className="text-gray-600">您的赎回申请已提交，正在处理中。</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <h2 className="text-xl font-bold mb-6">基金赎回</h2>
                
                {/* Position Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">选择持有基金</label>
                  <select 
                    className="w-full p-2 border border-gray-300 rounded-md" 
                    value={selectedPosition?.id || ''}
                    onChange={(e) => {
                      const position = positions.find(p => p.id === e.target.value);
                      setSelectedPosition(position || null);
                      setAmount('');
                    }}
                  >
                    <option value="">请选择持有基金</option>
                    {positions.map(position => (
                      <option key={position.id} value={position.id}>
                        {position.funds?.name_cn || '未知基金'} - 持有份额: {(position.units || 0).toFixed(4)} - 当前净值: ¥{(position.funds?.nav || 0).toFixed(4)}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Position Details */}
                {selectedPosition && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-md">
                    <h3 className="font-semibold mb-2">{selectedPosition.funds?.name_cn || '未知基金'}</h3>
                    <p className="text-sm text-gray-600 mb-2">{selectedPosition.funds?.description || ''}</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">持有份额:</span>
                          <span className="font-medium">{(selectedPosition.units || 0).toFixed(4)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">当前净值:</span>
                          <span className="font-medium">¥{(selectedPosition.funds?.nav || 0).toFixed(4)}</span>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">持仓市值:</span>
                          <span className="font-medium">¥{((selectedPosition.units || 0) * (selectedPosition.funds?.nav || 0)).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">申购价格:</span>
                          <span className="font-medium">¥{(selectedPosition.purchase_price || 0).toFixed(4)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Redeem Type Selection */}
                {selectedPosition && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">赎回方式</label>
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input 
                          type="radio" 
                          name="redeemType" 
                          value="amount" 
                          checked={redeemType === 'amount'}
                          onChange={() => setRedeemType('amount')}
                          className="mr-2"
                        />
                        <span>按金额赎回</span>
                      </label>
                      <label className="flex items-center">
                        <input 
                          type="radio" 
                          name="redeemType" 
                          value="units" 
                          checked={redeemType === 'units'}
                          onChange={() => setRedeemType('units')}
                          className="mr-2"
                        />
                        <span>按份额赎回</span>
                      </label>
                    </div>
                  </div>
                )}
                
                {/* Amount Input */}
                {selectedPosition && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {redeemType === 'amount' ? '赎回金额 (元)' : '赎回份额'}
                    </label>
                    <input 
                      type="number" 
                      className="w-full p-2 border border-gray-300 rounded-md" 
                      placeholder={`请输入${redeemType === 'amount' ? '赎回金额' : '赎回份额'}`} 
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      min="1"
                      step={redeemType === 'amount' ? '0.01' : '0.0001'}
                    />
                    <div className="mt-2 text-sm text-gray-500">
                      {redeemType === 'amount' ? (
                        <>预计赎回份额: {amount ? (parseFloat(amount) / (selectedPosition.funds?.nav || 1)).toFixed(4) : '0.0000'}</>
                      ) : (
                        <>预计赎回金额: {amount ? (parseFloat(amount) * (selectedPosition.funds?.nav || 0)).toFixed(2) : '0.00'} 元</>
                      )}
                    </div>
                    <div className="mt-1 text-sm text-gray-500">
                      可用{redeemType === 'amount' ? '金额' : '份额'}: {redeemType === 'amount' ? ((selectedPosition.units || 0) * (selectedPosition.funds?.nav || 0)).toFixed(2) : (selectedPosition.units || 0).toFixed(4)}
                    </div>
                  </div>
                )}
                
                {/* Risk Warning */}
                <div className="mb-6 p-4 bg-yellow-50 rounded-md">
                  <h3 className="font-semibold text-yellow-800 mb-1">风险提示</h3>
                  <p className="text-sm text-yellow-700">
                    基金赎回可能会产生赎回费用，具体费用请参考基金合同。请确保您已充分了解该基金的赎回规则，并根据自身情况做出决策。
                  </p>
                </div>
                
                {/* Submit Button */}
                <div className="flex justify-end">
                  <button 
                    type="submit" 
                    className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors" 
                    disabled={!selectedPosition || !amount || submitting}
                  >
                    {submitting ? '提交中...' : '提交赎回申请'}
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