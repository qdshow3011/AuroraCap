'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';

// 时间范围类型定义
type TimeRange = '1m' | '3m' | '1y' | '3y' | 'all';

// 模拟基金数据
const mockFunds = [
  {
    id: '1',
    name_cn: '全球股票基金',
    name: 'Global Equity Fund',
    code: 'GF001',
    description: '投资于全球股票市场的多元化基金，追求长期资本增值',
    risk_level: '高风险',
    type: 'fund',
    status: 'active',
    nav: 10.5,
    cumulative_nav: 12.8,
    size: 1000000000,
    manager: '张三',
    management_fee: 1.5,
    custodian_fee: 0.25,
    benchmark: 'MSCI World Index',
    investment_strategy: '投资于全球范围内具有良好成长性的上市公司股票',
    min_subscription: 1000,
    created_at: '2023-01-15T00:00:00Z',
    performance_1m: 2.3,
    performance_3m: 8.7,
    performance_1y: 15.2,
    performance_3y: 45.7,
    performance_5y: 89.3,
    Sharpe_ratio: 1.2,
    max_drawdown: -25.3,
    alpha: 3.5,
    beta: 1.1
  },
  {
    id: '2',
    name_cn: '债券基金',
    name: 'Bond Fund',
    code: 'BF001',
    description: '投资于固定收益证券的低风险基金，追求稳定收益',
    risk_level: '低风险',
    type: 'bond',
    status: 'active',
    nav: 5.2,
    cumulative_nav: 5.8,
    size: 500000000,
    manager: '李四',
    management_fee: 0.8,
    custodian_fee: 0.2,
    benchmark: 'China Bond Index',
    investment_strategy: '投资于高质量债券，追求稳定的固定收益',
    min_subscription: 500,
    created_at: '2023-02-20T00:00:00Z',
    performance_1m: 0.5,
    performance_3m: 1.8,
    performance_1y: 5.3,
    performance_3y: 15.8,
    performance_5y: 28.4,
    Sharpe_ratio: 0.8,
    max_drawdown: -5.2,
    alpha: 0.5,
    beta: 0.3
  },
  {
    id: '3',
    name_cn: '混合基金',
    name: 'Balanced Fund',
    code: 'HF001',
    description: '平衡配置股票和债券的混合型基金，兼顾收益和风险',
    risk_level: '中风险',
    type: 'fund',
    status: 'active',
    nav: 8.7,
    cumulative_nav: 10.2,
    size: 750000000,
    manager: '王五',
    management_fee: 1.2,
    custodian_fee: 0.22,
    benchmark: 'CSI 300 Index',
    investment_strategy: '平衡配置股票和债券，根据市场情况动态调整资产配置',
    min_subscription: 1000,
    created_at: '2023-03-10T00:00:00Z',
    performance_1m: 1.2,
    performance_3m: 4.5,
    performance_1y: 8.5,
    performance_3y: 25.6,
    performance_5y: 45.2,
    Sharpe_ratio: 0.9,
    max_drawdown: -15.8,
    alpha: 2.1,
    beta: 0.7
  }
];

// 生成模拟净值历史数据
const generateNavHistory = (fundId: string, startDate: Date, endDate: Date) => {
  const history = [];
  const currentDate = new Date(startDate);
  let nav = 10.0;
  
  while (currentDate <= endDate) {
    // 随机波动，范围在 -0.1 到 +0.1 之间
    const change = (Math.random() * 0.2) - 0.1;
    nav = Math.max(8.0, nav + change); // 确保净值不会低于 8.0
    
    history.push({
      date: currentDate.toISOString().split('T')[0],
      nav: parseFloat(nav.toFixed(4))
    });
    
    // 增加一天
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return history;
};

// 生成模拟风险分析数据
const generateRiskAnalysisData = () => {
  return [
    { name: '波动率', value: 15.2 },
    { name: '最大回撤', value: 25.3 },
    { name: 'Sharpe比率', value: 1.2 },
    { name: 'Alpha', value: 3.5 },
    { name: 'Beta', value: 1.1 }
  ];
};

export default function FundDetail() {
  const params = useParams();
  const router = useRouter();
  const fundId = params.fundId as string;
  
  const [fund, setFund] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [navHistory, setNavHistory] = useState<any[]>([]);
  const [filteredNavHistory, setFilteredNavHistory] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>('1y');
  const [isFavorite, setIsFavorite] = useState(false);
  const [relatedFunds, setRelatedFunds] = useState<any[]>([]);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [riskAnalysisData, setRiskAnalysisData] = useState<any[]>([]);

  // 获取时间范围内的数据
  const filterNavHistoryByTimeRange = (data: any[], range: TimeRange) => {
    if (!data || data.length === 0) return [];
    
    const now = new Date();
    let startDate: Date;
    
    switch (range) {
      case '1m':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case '3m':
        startDate = new Date(now.setMonth(now.getMonth() - 3));
        break;
      case '1y':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      case '3y':
        startDate = new Date(now.setFullYear(now.getFullYear() - 3));
        break;
      case 'all':
      default:
        return data;
    }
    
    return data.filter(item => new Date(item.date) >= startDate);
  };

  // 时间范围改变时过滤数据
  useEffect(() => {
    const filtered = filterNavHistoryByTimeRange([...navHistory], timeRange);
    setFilteredNavHistory(filtered);
  }, [navHistory, timeRange]);

  useEffect(() => {
    const fetchFundDetails = async () => {
      try {
        setLoading(true);
        
        // 查找模拟基金数据
        const fundData = mockFunds.find(f => f.id === fundId);
        
        if (!fundData) {
          router.push('/funds');
          return;
        }
        
        setFund(fundData);
        
        // 生成模拟净值历史数据
        const startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 3); // 生成3年的数据
        const endDate = new Date();
        const generatedNavHistory = generateNavHistory(fundId, startDate, endDate);
        setNavHistory(generatedNavHistory);
        
        // 生成模拟风险分析数据
        const generatedRiskData = generateRiskAnalysisData();
        setRiskAnalysisData(generatedRiskData);
        
        // 查找相关基金
        const relatedData = mockFunds.filter(f => f.type === fundData.type && f.id !== fundId);
        setRelatedFunds(relatedData);
        
      } catch (error) {
        console.error('Error fetching fund details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFundDetails();
  }, [fundId, router]);

  // 处理收藏按钮点击
  const handleFavoriteToggle = () => {
    setIsFavorite(!isFavorite);
  };

  // 处理分享
  const handleShare = () => {
    setShowShareDialog(true);
  };

  // 处理分享确认
  const confirmShare = () => {
    // 实际项目中可以调用分享API
    alert('分享功能开发中');
    setShowShareDialog(false);
  };

  // 复制分享链接
  const copyShareLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      alert('链接已复制到剪贴板');
    }).catch(err => {
      console.error('复制失败:', err);
    });
  };

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
                <button 
                  onClick={handleFavoriteToggle}
                  className={`p-2 rounded-full transition-colors ${isFavorite ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {isFavorite ? '❤️' : '🤍'}
                </button>
                <button 
                  onClick={handleShare}
                  className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  📤
                </button>
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
                  {(['1m', '3m', '1y', '3y', 'all'] as TimeRange[]).map((range) => (
                    <button
                      key={range}
                      onClick={() => setTimeRange(range)}
                      className={`px-3 py-1 text-sm rounded-md transition-colors ${
                        timeRange === range ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {range === '1m' ? '近1月' : 
                       range === '3m' ? '近3月' : 
                       range === '1y' ? '近1年' : 
                       range === '3y' ? '近3年' : '成立以来'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-80 bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                {filteredNavHistory.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={filteredNavHistory}
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
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">业绩分析</h2>
              <div className="space-y-6">
                <div>
                  <p className="text-sm text-gray-500 font-medium mb-2">近一年收益率</p>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: `${Math.min(100, (fund?.performance_1y || 0) * 2)}%` }}></div>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-sm text-gray-500">-10%</span>
                    <span className={`text-sm font-medium ${(fund?.performance_1y || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {(fund?.performance_1y || 0) >= 0 ? '+' : ''}{fund?.performance_1y || 0}%
                    </span>
                    <span className="text-sm text-gray-500">+30%</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">近1个月</p>
                    <p className={`text-lg font-bold ${(fund?.performance_1m || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {(fund?.performance_1m || 0) >= 0 ? '+' : ''}{fund?.performance_1m || 0}%
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">近3个月</p>
                    <p className={`text-lg font-bold ${(fund?.performance_3m || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {(fund?.performance_3m || 0) >= 0 ? '+' : ''}{fund?.performance_3m || 0}%
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">近1年</p>
                    <p className={`text-lg font-bold ${(fund?.performance_1y || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {(fund?.performance_1y || 0) >= 0 ? '+' : ''}{fund?.performance_1y || 0}%
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">近3年</p>
                    <p className={`text-lg font-bold ${(fund?.performance_3y || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {(fund?.performance_3y || 0) >= 0 ? '+' : ''}{fund?.performance_3y || 0}%
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">近5年</p>
                    <p className={`text-lg font-bold ${(fund?.performance_5y || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {(fund?.performance_5y || 0) >= 0 ? '+' : ''}{fund?.performance_5y || 0}%
                    </p>
                  </div>
                </div>
                
                <div className="h-64 bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: '近1月', value: fund?.performance_1m || 0 },
                        { name: '近3月', value: fund?.performance_3m || 0 },
                        { name: '近1年', value: fund?.performance_1y || 0 },
                        { name: '近3年', value: fund?.performance_3y || 0 },
                        { name: '近5年', value: fund?.performance_5y || 0 }
                      ]}
                      margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis dataKey="name" stroke="#9ca3af" tick={{ fontSize: 12 }} />
                      <YAxis tickFormatter={(value) => `${value}%`} stroke="#9ca3af" tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(value) => [`${value}%`, '收益率']} />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {[
                          { name: '近1月', value: fund?.performance_1m || 0 },
                          { name: '近3月', value: fund?.performance_3m || 0 },
                          { name: '近1年', value: fund?.performance_1y || 0 },
                          { name: '近3年', value: fund?.performance_3y || 0 },
                          { name: '近5年', value: fund?.performance_5y || 0 }
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.value >= 0 ? '#10b981' : '#ef4444'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            
            {/* Risk Analysis */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">风险分析</h2>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">波动率</p>
                    <p className="text-lg font-bold text-gray-900">{fund?.volatility || fund?.risk_level === '高风险' ? '15.2%' : fund?.risk_level === '中风险' ? '8.5%' : '3.2%'}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">最大回撤</p>
                    <p className="text-lg font-bold text-red-600">{fund?.max_drawdown || fund?.risk_level === '高风险' ? '-25.3%' : fund?.risk_level === '中风险' ? '-15.8%' : '-5.2%'}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Sharpe比率</p>
                    <p className="text-lg font-bold text-gray-900">{fund?.Sharpe_ratio || fund?.risk_level === '高风险' ? '1.2' : fund?.risk_level === '中风险' ? '0.9' : '0.8'}</p>
                  </div>
                </div>
                
                <div className="h-64 bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={riskAnalysisData}
                      margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis type="number" stroke="#9ca3af" tick={{ fontSize: 12 }} />
                      <YAxis dataKey="name" type="category" stroke="#9ca3af" tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]} fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h3 className="font-medium text-amber-800 mb-2">风险评估</h3>
                  <p className="text-sm text-amber-700">
                    该基金的风险等级为 <strong>{fund?.risk_level || '中风险'}</strong>，适合风险承受能力为
                    <strong> {fund?.risk_level === '高风险' ? 'C4-C5' : fund?.risk_level === '中风险' ? 'C3' : 'C1-C2'}</strong> 的投资者。
                  </p>
                </div>
              </div>
            </div>
            
            {/* Portfolio Holdings */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">投资组合</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 font-medium mb-2">行业分布</p>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">金融</span>
                        <span className="text-sm font-semibold text-gray-900">35%</span>
                      </div>
                      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: '35%' }}></div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">科技</span>
                        <span className="text-sm font-semibold text-gray-900">25%</span>
                      </div>
                      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full" style={{ width: '25%' }}></div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">消费</span>
                        <span className="text-sm font-semibold text-gray-900">20%</span>
                      </div>
                      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 rounded-full" style={{ width: '20%' }}></div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">医药</span>
                        <span className="text-sm font-semibold text-gray-900">12%</span>
                      </div>
                      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full" style={{ width: '12%' }}></div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">其他</span>
                        <span className="text-sm font-semibold text-gray-900">8%</span>
                      </div>
                      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-gray-400 rounded-full" style={{ width: '8%' }}></div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 font-medium mb-2">资产配置</p>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">股票</span>
                        <span className="text-sm font-semibold text-gray-900">70%</span>
                      </div>
                      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-pink-500 rounded-full" style={{ width: '70%' }}></div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">债券</span>
                        <span className="text-sm font-semibold text-gray-900">20%</span>
                      </div>
                      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-teal-500 rounded-full" style={{ width: '20%' }}></div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">现金</span>
                        <span className="text-sm font-semibold text-gray-900">10%</span>
                      </div>
                      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-orange-500 rounded-full" style={{ width: '10%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="border-t border-gray-200 pt-4">
                  <p className="text-sm text-gray-500 font-medium mb-3">前十大重仓股</p>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {['贵州茅台', '招商银行', '宁德时代', '比亚迪', '美的集团', '海康威视', '隆基绿能', '中免集团', '药明康德', '迈瑞医疗'].map((stock, index) => (
                      <div key={index} className="bg-gray-50 p-3 rounded-lg text-center">
                        <p className="text-xs text-gray-500 mb-1">#{index + 1}</p>
                        <p className="text-sm font-semibold text-gray-900">{stock}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Related Funds */}
            {relatedFunds.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">相关推荐</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {relatedFunds.map((relatedFund) => (
                    <Link 
                      key={relatedFund.id}
                      href={`/funds/${relatedFund.id}`}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <p className="font-semibold text-gray-900 mb-1">{relatedFund.name_cn}</p>
                      <p className="text-sm text-gray-500 mb-2">{relatedFund.code}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">最新净值</span>
                        <span className="text-sm font-bold text-blue-600">¥{relatedFund.nav?.toFixed(4) || '0.0000'}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
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
      
      {/* Share Dialog */}
      {showShareDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">分享基金</h3>
              <button 
                onClick={() => setShowShareDialog(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <p className="text-gray-600 mb-4">分享这个基金给你的朋友</p>
            <div className="space-y-3">
              <button
                onClick={copyShareLink}
                className="w-full px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors"
              >
                复制链接
              </button>
              <button
                onClick={confirmShare}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                分享到微信
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
