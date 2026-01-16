'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import BlurEffect from '@/components/BlurEffect';
import { UserNav } from '@/components/UserNav';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

// 我的资产类型定义
interface MyAssets {
  totalAssets: number;
  fundValue: number;
  cashBalance: number;
  pendingFunds: number;
}

// 资金状况类型定义
interface FundStatus {
  availableBalance: number;
  totalDeposit: number;
  totalWithdrawal: number;
  pendingAmount: number;
}

export default function UserCenter() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [assets, setAssets] = useState<MyAssets | null>(null);
  const [fundStatus, setFundStatus] = useState<FundStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [isObserverMode, setIsObserverMode] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        console.log('Starting to fetch user data...');
        
        // Try to get current user - first check mock session, then Supabase Auth
        let currentUser = null;
        let profileData = null;
        
        // 1. First check for mock session in localStorage
        try {
          const mockSession = localStorage.getItem('mock_session');
          console.log('Mock session exists:', !!mockSession);
          if (mockSession) {
            const sessionData = JSON.parse(mockSession);
            currentUser = sessionData.user;
            console.log('Current user from mock session:', currentUser);
            
            // Get user profile from users table
            if (currentUser?.email) {
              const { data: userData, error: userDataError } = await supabase
                .from('users')
                .select('*')
                .eq('email', currentUser.email)
                .single();
              profileData = userData;
              console.log('User profile from users table:', userData, 'Error:', userDataError);
            }
          }
        } catch (mockError) {
          console.error('Mock session error:', mockError);
        }
        
        console.log('After mock session check - currentUser:', !!currentUser, 'profileData:', !!profileData);
        
        // 2. If no mock session, try Supabase Auth
        if (!currentUser) {
          try {
            const { data: authData, error: authError } = await supabase.auth.getUser();
            currentUser = authData?.user;
            console.log('Current user from Supabase Auth:', currentUser, 'Error:', authError);
            
            // Get user profile from users table
            if (currentUser?.email) {
              const { data: userData, error: userDataError } = await supabase
                .from('users')
                .select('*')
                .eq('email', currentUser.email)
                .single();
              profileData = userData;
              console.log('User profile from users table:', userData, 'Error:', userDataError);
            }
          } catch (authError) {
            console.error('Supabase Auth error:', authError);
            // Don't redirect immediately, keep the user on the page
          }
        }
        
        console.log('Final user data - currentUser:', !!currentUser, 'profileData:', !!profileData);
        
        // 3. If we have user data, update state
        console.log('Detailed currentUser:', JSON.stringify(currentUser));
        console.log('Detailed profileData:', JSON.stringify(profileData));
        
        if (currentUser && profileData) {
          console.log('Entering user data branch');
          
          // Also try to get user by ID directly
          if (currentUser.id) {
            const { data: userByIdData, error: userByIdError } = await supabase
              .from('users')
              .select('*')
              .eq('id', currentUser.id)
              .single();
            console.log('User by ID data:', userByIdData, 'Error:', userByIdError);
          }
          setUser(currentUser);
          setProfile(profileData);
          setIsObserverMode(profileData?.role === 'Guest' || profileData?.role === 'USER');
          
          // Try to fetch real data from Supabase
            try {
              // Get user profile ID for queries
              const userIdForQueries = profileData.id || currentUser.id;
              console.log('Using userIdForQueries:', userIdForQueries);
              
              // Get cash balance and fund data from cash_balances table
              const { data: cashBalanceData, error: cashBalanceError } = await supabase
                .from('cash_balances')
                .select('cash_balance, fund_value, available_cash, total_withdrawals, pending_cash')
                .eq('user_id', userIdForQueries)
                .single();
              
              console.log('Cash balance data:', cashBalanceData, 'Error:', cashBalanceError);
              
              // Extract values from cash_balances table with defaults
              const fundValue = cashBalanceData?.fund_value || 0;
              const cashBalance = cashBalanceData?.cash_balance || 0;
              const availableCash = cashBalanceData?.available_cash || 0;
              const totalWithdrawals = cashBalanceData?.total_withdrawals || 0;
              const pendingCash = cashBalanceData?.pending_cash || 0;
              
              // Get total deposit from deposit_withdrawal table (still need to calculate this)
              const { data: depositData } = await supabase
                .from('deposit_withdrawal')
                .select('amount')
                .eq('user_id', userIdForQueries)
                .eq('type', 'deposit')
                .eq('status', 'completed');
              const totalDeposit = depositData?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;
              
              // Calculate total assets
              const totalAssets = fundValue + cashBalance + pendingCash;
              
              const realAssets: MyAssets = {
                totalAssets: totalAssets,
                fundValue: fundValue,
                cashBalance: cashBalance,
                pendingFunds: pendingCash
              };
              
              const realFundStatus: FundStatus = {
                availableBalance: availableCash,
                totalDeposit: totalDeposit,
                totalWithdrawal: totalWithdrawals,
                pendingAmount: pendingCash
              };
              
              console.log('Setting real assets:', realAssets);
              console.log('Setting real fund status:', realFundStatus);
              
              setAssets(realAssets);
              setFundStatus(realFundStatus);
            } catch (dataError) {
              console.error('Error fetching real data:', dataError);
              // Use default data on error
              const defaultAssets: MyAssets = {
                totalAssets: 0,
                fundValue: 0,
                cashBalance: 0,
                pendingFunds: 0
              };
              
              const defaultFundStatus: FundStatus = {
                availableBalance: 0,
                totalDeposit: 0,
                totalWithdrawal: 0,
                pendingAmount: 0
              };
              
              setAssets(defaultAssets);
              setFundStatus(defaultFundStatus);
            }
        } else {
          // If no user data, keep the user on the page with default data
          console.log('No user data found, showing default asset data');
          
          // Use default mock data for guest users
          const defaultAssets: MyAssets = {
            totalAssets: 0,
            fundValue: 0,
            cashBalance: 0,
            pendingFunds: 0
          };
          
          const defaultFundStatus: FundStatus = {
            availableBalance: 0,
            totalDeposit: 0,
            totalWithdrawal: 0,
            pendingAmount: 0
          };
          
          setAssets(defaultAssets);
          setFundStatus(defaultFundStatus);
        }
      } catch (error) {
        console.error('Error fetching asset data:', error);
        // Use default empty data on error
        setAssets({ totalAssets: 0, fundValue: 0, cashBalance: 0, pendingFunds: 0 });
        setFundStatus({ availableBalance: 0, totalDeposit: 0, totalWithdrawal: 0, pendingAmount: 0 });
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  if (loading) {
    return <div className="container mx-auto px-4 py-8">加载中...</div>;
  }

  // Prepare data for charts
  const pieData = [
    { name: '基金市值', value: assets?.fundValue || 0, color: '#3b82f6' },
    { name: '现金余额', value: assets?.cashBalance || 0, color: '#10b981' },
    { name: '在途资金', value: assets?.pendingFunds || 0, color: '#f59e0b' },
  ];

  const barData = [
    { name: '可用余额', value: fundStatus?.availableBalance || 0, color: '#3b82f6' },
    { name: '总入金', value: fundStatus?.totalDeposit || 0, color: '#10b981' },
    { name: '总出金', value: fundStatus?.totalWithdrawal || 0, color: '#ef4444' },
    { name: '在途金额', value: fundStatus?.pendingAmount || 0, color: '#f59e0b' },
  ];



  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">资产状态</h1>
        <button 
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
          onClick={() => {
            // Handle logout
            localStorage.removeItem('mock_session');
            supabase.auth.signOut();
            window.location.href = '/login';
          }}
        >
          退出登录
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left sidebar */}
        <div className="lg:col-span-1">
          <UserNav user={user} profile={profile} />
        </div>
        
        {/* Main content */}
        <div className="lg:col-span-3">
          {/* Total Assets Overview */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">总资产概览</h2>
            <BlurEffect isBlurred={isObserverMode}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={60}
                          fill="#8884d8"
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `¥${Number(value).toFixed(2)}`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4 rounded-md">
                      <p className="text-sm text-gray-500">总资产</p>
                      <p className="text-sm font-bold">¥{(assets?.totalAssets || 0).toFixed(2)}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-md">
                      <p className="text-sm text-gray-500">基金市值</p>
                      <p className="text-sm font-bold">¥{(assets?.fundValue || 0).toFixed(2)}</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-md">
                      <p className="text-sm text-gray-500">现金余额</p>
                      <p className="text-sm font-bold">¥{(assets?.cashBalance || 0).toFixed(2)}</p>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-md">
                      <p className="text-sm text-gray-500">可用余额</p>
                      <p className="text-sm font-bold">¥{(fundStatus?.availableBalance || 0).toFixed(2)}</p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-md">
                      <p className="text-sm text-gray-500">总出金</p>
                      <p className="text-sm font-bold">¥{(fundStatus?.totalWithdrawal || 0).toFixed(2)}</p>
                    </div>
                    <div className="bg-indigo-50 p-4 rounded-md">
                      <p className="text-sm text-gray-500">在途金额</p>
                      <p className="text-sm font-bold">¥{(fundStatus?.pendingAmount || 0).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </BlurEffect>
          </div>
          
          {/* Fund Status Chart */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">资金状况</h2>
            <BlurEffect isBlurred={isObserverMode}>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={barData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => `¥${Number(value).toFixed(2)}`} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {barData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </BlurEffect>
          </div>
          

        </div>
      </div>
    </div>
  );
}
