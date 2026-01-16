'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import BlurEffect from '@/components/BlurEffect';
import { UserNav } from '@/components/UserNav';

// Define local types since @aurora/supabase-types is not available
type UserRole = 'Admin' | 'User' | 'Guest';
type Profile = {
  id: string;
  email: string;
  role: UserRole;
  [key: string]: any;
};

interface FundPosition {
  id: string;
  fund_id: string;
  fund_name: string;
  fund_code: string;
  units: number;
  purchase_price: number;
  current_nav: number;
  market_value: number;
  total_return: number;
  return_rate: number;
  position_percentage: number;
  nav_history: { date: string; nav: number }[];
}

export default function Positions() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [positions, setPositions] = useState<FundPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalAssets, setTotalAssets] = useState(0);
  const [selectedFund, setSelectedFund] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isObserverMode, setIsObserverMode] = useState(false);

  useEffect(() => {
    const fetchPositions = async () => {
      try {
        setLoading(true);
        
        // Get user data - simplified approach
        let profileData = null;
        
        // 1. Try Supabase Auth first
        try {
          const { data: { user: supabaseUser } } = await supabase.auth.getUser();
          if (supabaseUser) {
            console.log('Found Supabase user:', supabaseUser.email);
            
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
              console.log('Found user profile:', profileData);
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
              console.log('Found mock user:', mockUser.email);
              
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
                console.log('Found mock user profile:', profileData);
              }
            }
          } catch (mockError) {
            console.error('Mock session error:', mockError);
          }
        }
        
        // 3. If we have user profile, fetch positions
        if (profileData) {
          setUser(profileData);
          setProfile(profileData);
          setUserRole(profileData.role as UserRole);
          setIsObserverMode(profileData.role === 'Guest' || profileData.role === 'User');
          
          // Get user positions with fund details from positions table
          console.log('Fetching positions for user_id:', profileData.id);
          const { data: positionsData, error: positionsError } = await supabase
            .from('positions')
            .select('*')
            .eq('user_id', profileData.id);
          
          if (positionsError) {
            console.error('Error fetching positions:', positionsError);
            setPositions([]);
            setTotalAssets(0);
          } else {
            console.log('Found positions data:', positionsData);
            
            if (positionsData && positionsData.length > 0) {
              // Get unique fund IDs from positions
              const fundIds = [...new Set(positionsData.map(p => p.fund_id))];
              console.log('Fund IDs from positions:', fundIds);
              
              // Fetch fund details from products table
              let fundDetails: { [key: string]: any } = {};
              if (fundIds.length > 0) {
                const { data: funds, error: fundsError } = await supabase
                  .from('products')
                  .select('id, name_cn, nav')
                  .in('id', fundIds);
                
                if (fundsError) {
                  console.error('Error fetching fund details:', fundsError);
                } else {
                  console.log('Found fund details:', funds);
                  fundDetails = funds.reduce((acc, fund) => {
                    acc[fund.id] = fund;
                    return acc;
                  }, {} as { [key: string]: any });
                }
              }
              
              // Format positions
            const formattedPositions = positionsData.map((position: any) => {
              console.log('Processing position:', position);
              const fund = fundDetails[position.fund_id] || {};
              console.log('Found fund details for', position.fund_id, ':', fund);
              
              // 直接从数据库字段读取值
              const units = position.units || position.shares || 0;
              const purchasePrice = position.avg_cost || position.purchase_price || position.average_cost || position.cost || 0;
              const currentNav = position.latest_nav || fund.nav || 0;
              const marketValue = position.current_value || (units * currentNav);
              const cost = units * purchasePrice;
              const totalReturn = marketValue - cost;
              const returnRate = cost > 0 ? (totalReturn / cost) * 100 : 0;
              
              console.log('Calculated values for position:', {
                units, purchasePrice, currentNav, marketValue, cost, totalReturn, returnRate
              });
              
              return {
                id: position.id,
                fund_id: position.fund_id,
                fund_name: fund.name_cn || '未知基金',
                fund_code: '', // products表中没有code字段，使用空字符串
                units: units,
                purchase_price: purchasePrice,
                current_nav: currentNav,
                market_value: marketValue,
                total_return: totalReturn,
                return_rate: returnRate,
                position_percentage: 0, // Will be calculated after all positions are formatted
                nav_history: [] // Simplified for now
              };
            });
              
              // Calculate total assets and position percentages
              let total = 0;
              formattedPositions.forEach(pos => {
                total += pos.market_value;
              });
              
              // Update position percentages
              const finalPositions = formattedPositions.map(pos => ({
                ...pos,
                position_percentage: total > 0 ? (pos.market_value / total) * 100 : 0
              }));
              
              console.log('Final positions:', finalPositions);
              setPositions(finalPositions);
              setTotalAssets(total);
              
              // Select first fund by default
              if (finalPositions.length > 0) {
                setSelectedFund(finalPositions[0].fund_id);
              }
            } else {
              console.log('No positions found for user');
              setPositions([]);
              setTotalAssets(0);
            }
          }
        } else {
          // If no user data, keep the user on the page with empty data
          console.log('No user data found, showing empty positions');
          setPositions([]);
          setTotalAssets(0);
        }
      } catch (error) {
        console.error('Error fetching positions:', error);
        setPositions([]);
        setTotalAssets(0);
      } finally {
        setLoading(false);
      }
    };

    fetchPositions();
  }, []);

  if (loading) {
    return <div className="container mx-auto px-4 py-8">加载中...</div>;
  }

  const selectedPosition = positions.find(p => p.fund_id === selectedFund) || null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">持仓明细</h1>
        <BlurEffect isBlurred={isObserverMode}>
          <div className="text-right">
            <p className="text-sm text-gray-500">总资产</p>
            <p className="text-2xl font-bold">¥{totalAssets.toFixed(2)}</p>
          </div>
        </BlurEffect>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left sidebar - UserNav */}
        <div className="lg:col-span-1">
          <UserNav user={user} profile={profile} />
        </div>
        
        {/* Main content area */}
        <div className="lg:col-span-3">
          {/* 持有基金区块 - 放在上面 */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4">持有基金</h3>
            
            <BlurEffect isBlurred={isObserverMode}>
              {positions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {positions.map((position) => (
                    <div 
                      key={position.id}
                      onClick={() => setSelectedFund(position.fund_id)}
                      className={`cursor-pointer p-4 rounded-md transition-all ${selectedFund === position.fund_id ? 'bg-blue-50 border-2 border-blue-200' : 'hover:bg-gray-50'}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-medium">{position.fund_name}</div>
                        <div className={`text-xs font-medium ${position.return_rate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {position.return_rate >= 0 ? '+' : ''}{position.return_rate.toFixed(2)}%
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 mb-3">{position.fund_code}</div>
                      <div className="flex justify-between items-center">
                          <div className="text-sm">
                            <span className="text-gray-500">持有份额: </span>
                            <span className="font-medium">{position.units.toFixed(2)} 份</span>
                          </div>
                          <div className="text-sm font-bold">¥{position.market_value.toFixed(2)}</div>
                        </div>
                    </div>
                  ))}
                </div>
              ) : (
              <div className="text-center py-8 bg-gray-50 rounded-md">
                <p className="text-gray-500">暂无持仓</p>
                <Link href="/funds" className="mt-4 inline-block text-blue-600 hover:text-blue-900">
                  去购买基金
                </Link>
              </div>
            )}
            </BlurEffect>
          </div>
          
          {/* 具体基金的展示区块 - 放在选择基金的下面 */}
          {selectedPosition ? (
            <BlurEffect isBlurred={isObserverMode}>
              <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold">
                    <Link href={`/funds/${selectedPosition.fund_id}`} className="text-blue-600 hover:underline">
                      {selectedPosition.fund_name}
                    </Link>
                  </h2>
                  <p className="text-gray-600 mt-1">{selectedPosition.fund_code}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">持仓比例</div>
                  <div className="text-lg font-semibold">{selectedPosition.position_percentage.toFixed(2)}%</div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-500">持有份额</p>
                  <p className="text-xl font-bold">{selectedPosition.units.toFixed(2)} 份</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">买入成本</p>
                  <p className="text-xl font-bold">¥{selectedPosition.purchase_price.toFixed(4)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">当前净值</p>
                  <p className="text-xl font-bold">¥{selectedPosition.current_nav.toFixed(4)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">持仓市值</p>
                  <p className="text-xl font-bold">¥{selectedPosition.market_value.toFixed(2)}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-500">总收益</p>
                  <p className={`text-2xl font-bold ${selectedPosition.total_return >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ¥{selectedPosition.total_return.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">收益率</p>
                  <p className={`text-2xl font-bold ${selectedPosition.return_rate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedPosition.return_rate >= 0 ? '+' : ''}{selectedPosition.return_rate.toFixed(2)}%
                  </p>
                </div>
              </div>
              
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">净值走势</h3>
                <div className="h-80">
                  {selectedPosition.nav_history.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={selectedPosition.nav_history}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="colorNav" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(date) => new Date(date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                          stroke="#6b7280"
                        />
                        <YAxis 
                          domain={['auto', 'auto']}
                          tickFormatter={(value) => `¥${value.toFixed(4)}`}
                          stroke="#6b7280"
                        />
                        <Tooltip 
                          formatter={(value) => [`¥${Number(value).toFixed(4)}`, '净值']}
                          labelFormatter={(label) => `日期: ${new Date(label).toLocaleDateString()}`}
                          contentStyle={{ 
                            backgroundColor: 'white', 
                            border: '1px solid #e5e7eb', 
                            borderRadius: '0.375rem',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="nav" 
                          stroke="#3b82f6" 
                          strokeWidth={2} 
                          fill="url(#colorNav)" 
                          activeDot={{ r: 6 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-gray-500">暂无净值历史数据</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="border-t pt-6 mt-6">
                <div className="flex space-x-3">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                    追加买入
                  </button>
                  <button className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors">
                    卖出
                  </button>
                </div>
              </div>
            </div>
            </BlurEffect>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-center py-16">
                <p className="text-gray-500">请选择一个基金查看详情</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
