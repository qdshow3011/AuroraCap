'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

export default function FundDetail() {
  const params = useParams();
  const router = useRouter();
  const fundId = params.fundId as string;
  
  const [fund, setFund] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [navHistory, setNavHistory] = useState<any[]>([]);

  useEffect(() => {
    const fetchFundDetails = async () => {
      try {
        setLoading(true);
        
        // Fetch fund details
        const { data: fundData } = await supabase.from('products').select('*').eq('id', fundId).single();
        
        if (!fundData) {
          router.push('/funds');
          return;
        }
        
        setFund(fundData);
        
        // Fetch NAV history
        const { data: navData } = await supabase
          .from('fund_nav_history')
          .select('*')
          .eq('fund_id', fundId)
          .order('date', { ascending: true });
        
        setNavHistory(navData || []);
      } catch (error) {
        console.error('Error fetching fund details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFundDetails();
  }, [fundId, router]);

  if (loading) {
    return <div className="container mx-auto px-4 py-8">加载中...</div>;
  }

  if (!fund) {
    return <div className="container mx-auto px-4 py-8">基金不存在</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/funds" className="inline-flex items-center text-blue-600 hover:underline mb-4">
        ← 返回基金列表
      </Link>
      
      <div className="grid grid-cols-1 gap-8">
        {/* Fund Basic Info */}
        <div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
              <div className="mb-4 md:mb-0">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">{fund.name_cn}</h1>
                <p className="text-gray-600 mt-2 max-w-2xl">{fund.description}</p>
              </div>
              <div className="flex items-center space-x-4">
                <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${fund.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {fund.status === 'active' ? '运行中' : '已关闭'}
                </span>
                <span className="px-4 py-1.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  {fund.type || 'N/A'}
                </span>
              </div>
            </div>
            
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
                <p className="text-xs text-blue-600 font-medium">最新净值</p>
                <p className="text-2xl font-bold text-blue-900">¥{fund.nav?.toFixed(4) || '0.0000'}</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
                <p className="text-xs text-green-600 font-medium">累计净值</p>
                <p className="text-2xl font-bold text-green-900">¥{fund.cumulative_nav?.toFixed(4) || '0.0000'}</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
                <p className="text-xs text-purple-600 font-medium">成立日期</p>
                <p className="text-lg font-semibold text-purple-900">{new Date(fund.created_at).toLocaleDateString()}</p>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-lg">
                <p className="text-xs text-amber-600 font-medium">基金规模</p>
                <p className="text-lg font-semibold text-amber-900">¥{fund.size?.toLocaleString() || '0'}</p>
              </div>
              <div className="bg-gradient-to-br from-pink-50 to-pink-100 p-4 rounded-lg">
                <p className="text-xs text-pink-600 font-medium">风险等级</p>
                <p className="text-lg font-semibold text-pink-900">{fund.risk_level || '中风险'}</p>
              </div>
            </div>
            
            {/* Performance Section */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">净值走势</h2>
                <div className="flex space-x-2">
                  <button className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors">
                    近1月
                  </button>
                  <button className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors">
                    近3月
                  </button>
                  <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md">
                    近1年
                  </button>
                  <button className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors">
                    近3年
                  </button>
                  <button className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors">
                    成立以来
                  </button>
                </div>
              </div>
              <div className="h-80 bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                {navHistory.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={navHistory}
                      margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
                    >
                      <defs>
                        <linearGradient id="colorNav" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(date) => new Date(date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                        stroke="#9ca3af"
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis 
                        domain={['auto', 'auto']}
                        tickFormatter={(value) => `¥${value.toFixed(2)}`}
                        stroke="#9ca3af"
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip 
                        formatter={(value) => [`¥${Number(value).toFixed(4)}`, '净值']}
                        labelFormatter={(label) => `日期: ${new Date(label).toLocaleDateString()}`}
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #e5e7eb', 
                          borderRadius: '0.5rem',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                          padding: '0.75rem',
                          fontSize: '0.875rem'
                        }}
                        cursor={{ stroke: '#e5e7eb', strokeWidth: 1 }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="nav" 
                        stroke="#3b82f6" 
                        strokeWidth={2.5} 
                        fill="url(#colorNav)" 
                        activeDot={{ r: 8, strokeWidth: 0 }} 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center">
                    <div className="text-gray-400 mb-4">📊</div>
                    <p className="text-gray-500 font-medium">暂无净值历史数据</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Fund Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Fund Info */}
          <div className="lg:col-span-2">
            {/* Fund Information */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">基金信息</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 font-medium">基金代码</p>
                  <p className="text-gray-900">{fund.code || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">基金管理人</p>
                  <p className="text-gray-900">{fund.manager || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">管理费率</p>
                  <p className="text-gray-900">{fund.management_fee?.toFixed(2)}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">托管费率</p>
                  <p className="text-gray-900">{fund.custodian_fee?.toFixed(2)}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">业绩基准</p>
                  <p className="text-gray-900">{fund.benchmark || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">风险等级</p>
                  <p className="text-gray-900">{fund.risk_level || '中风险'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">投资策略</p>
                  <p className="text-gray-900">{fund.investment_strategy || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">最低申购金额</p>
                  <p className="text-gray-900">¥{fund.min_subscription || '1000'}</p>
                </div>
              </div>
            </div>
            
            {/* Performance Analysis */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">业绩分析</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 font-medium mb-2">近一年收益率</p>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: '75%' }}></div>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-sm text-gray-500">-10%</span>
                    <span className="text-sm font-medium text-green-600">+15.2%</span>
                    <span className="text-sm text-gray-500">+30%</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">近1个月</p>
                    <p className="text-lg font-bold text-green-600">+2.3%</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">近3个月</p>
                    <p className="text-lg font-bold text-green-600">+8.7%</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">近1年</p>
                    <p className="text-lg font-bold text-green-600">+15.2%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Column: Actions */}
          <div>
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">操作</h2>
              <div className="space-y-3">
                <Link 
                  href={`/funds/${fundId}/subscribe`}
                  className="w-full block px-5 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all transform hover:-translate-y-0.5 shadow-md hover:shadow-lg text-center"
                >
                  立即申购
                </Link>
                <Link 
                  href={`/funds/${fundId}/redeem`}
                  className="w-full block px-5 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-medium rounded-lg hover:from-green-700 hover:to-green-800 transition-all transform hover:-translate-y-0.5 shadow-md hover:shadow-lg text-center"
                >
                  立即赎回
                </Link>
                <button className="w-full px-5 py-3 bg-gray-100 text-gray-800 font-medium rounded-lg hover:bg-gray-200 transition-colors shadow-sm text-center">
                  设置定投
                </button>
              </div>
            </div>
            
            {/* Risk Warning */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-3 text-amber-800">风险提示</h3>
              <ul className="space-y-2 text-sm text-amber-700">
                <li className="flex items-start">
                  <span className="text-amber-500 mr-2">⚠️</span>
                  <span>基金投资有风险，过往业绩不代表未来表现</span>
                </li>
                <li className="flex items-start">
                  <span className="text-amber-500 mr-2">⚠️</span>
                  <span>请根据自身风险承受能力选择合适的基金</span>
                </li>
                <li className="flex items-start">
                  <span className="text-amber-500 mr-2">⚠️</span>
                  <span>投资前请仔细阅读基金合同和招募说明书</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
