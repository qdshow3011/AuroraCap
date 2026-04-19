'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

// Mock funds data
const mockFunds = [
  {
    id: '1',
    name_cn: '全球股票基金',
    name: 'Global Equity Fund',
    description: '投资于全球股票市场的多元化基金，追求长期资本增值',
    risk_level: 'high',
    type: 'fund',
    status: 'active',
    nav: 10.5,
    changeRate: 2.5,
    created_at: '2023-01-15T00:00:00Z',
    product_number: 'GF001',
    manager: '张三',
    launch_date: '2023-01-15',
    min_investment: 1000,
    management_fee: 1.5,
    performance_1y: 15.2,
    performance_3y: 45.7,
    performance_5y: 89.3
  },
  {
    id: '2',
    name_cn: '债券基金',
    name: 'Bond Fund',
    description: '投资于固定收益证券的低风险基金，追求稳定收益',
    risk_level: 'low',
    type: 'bond',
    status: 'active',
    nav: 5.2,
    changeRate: 0.8,
    created_at: '2023-02-20T00:00:00Z',
    product_number: 'BF001',
    manager: '李四',
    launch_date: '2023-02-20',
    min_investment: 500,
    management_fee: 0.8,
    performance_1y: 5.3,
    performance_3y: 15.8,
    performance_5y: 28.4
  },
  {
    id: '3',
    name_cn: '混合基金',
    name: 'Balanced Fund',
    description: '平衡配置股票和债券的混合型基金，兼顾收益和风险',
    risk_level: 'medium',
    type: 'fund',
    status: 'active',
    nav: 8.7,
    changeRate: 1.2,
    created_at: '2023-03-10T00:00:00Z',
    product_number: 'HF001',
    manager: '王五',
    launch_date: '2023-03-10',
    min_investment: 1000,
    management_fee: 1.2,
    performance_1y: 8.5,
    performance_3y: 25.6,
    performance_5y: 45.2
  },
  {
    id: '4',
    name_cn: '货币市场基金',
    name: 'Money Market Fund',
    description: '投资于短期货币市场工具的超低风险基金，追求本金安全',
    risk_level: 'low',
    type: 'fund',
    status: 'active',
    nav: 1.0001,
    changeRate: 0.1,
    created_at: '2023-04-05T00:00:00Z',
    product_number: 'MMF001',
    manager: '赵六',
    launch_date: '2023-04-05',
    min_investment: 100,
    management_fee: 0.3,
    performance_1y: 2.1,
    performance_3y: 6.5,
    performance_5y: 11.2
  },
  {
    id: '5',
    name_cn: '科技股票基金',
    name: 'Technology Equity Fund',
    description: '投资于科技行业股票的高成长基金，追求高回报',
    risk_level: 'high',
    type: 'fund',
    status: 'active',
    nav: 15.8,
    changeRate: 3.2,
    created_at: '2023-05-18T00:00:00Z',
    product_number: 'TEF001',
    manager: '孙七',
    launch_date: '2023-05-18',
    min_investment: 1000,
    management_fee: 1.8,
    performance_1y: 22.5,
    performance_3y: 65.3,
    performance_5y: 120.8
  },
  {
    id: '6',
    name_cn: '能源股票',
    name: 'Energy Stock',
    description: '投资于能源行业的股票，受能源价格影响较大',
    risk_level: 'medium',
    type: 'stock',
    status: 'active',
    nav: 25.6,
    changeRate: -1.5,
    created_at: '2023-06-22T00:00:00Z',
    product_number: 'ES001',
    manager: '周八',
    launch_date: '2023-06-22',
    min_investment: 5000,
    management_fee: 0.5,
    performance_1y: -5.2,
    performance_3y: 12.8,
    performance_5y: 35.6
  },
  {
    id: '7',
    name_cn: '房地产基金',
    name: 'Real Estate Fund',
    description: '投资于房地产相关资产的基金，追求稳定收益和资本增值',
    risk_level: 'medium',
    type: 'fund',
    status: 'inactive',
    nav: 7.3,
    changeRate: 0.5,
    created_at: '2023-07-30T00:00:00Z',
    product_number: 'REF001',
    manager: '吴九',
    launch_date: '2023-07-30',
    min_investment: 2000,
    management_fee: 1.0,
    performance_1y: 6.8,
    performance_3y: 18.5,
    performance_5y: 32.1
  },
  {
    id: '8',
    name_cn: '黄金ETF',
    name: 'Gold ETF',
    description: '追踪黄金价格的交易所交易基金，作为避险资产',
    risk_level: 'medium',
    type: 'fund',
    status: 'active',
    nav: 3.2,
    changeRate: 1.8,
    created_at: '2023-08-15T00:00:00Z',
    product_number: 'GETF001',
    manager: '郑十',
    launch_date: '2023-08-15',
    min_investment: 500,
    management_fee: 0.6,
    performance_1y: 10.2,
    performance_3y: 25.7,
    performance_5y: 48.3
  },
  {
    id: '9',
    name_cn: '新兴市场基金',
    name: 'Emerging Markets Fund',
    description: '投资于新兴市场的股票和债券，追求高成长潜力',
    risk_level: 'high',
    type: 'fund',
    status: 'active',
    nav: 9.8,
    changeRate: 2.1,
    created_at: '2023-09-28T00:00:00Z',
    product_number: 'EMF001',
    manager: '王十一',
    launch_date: '2023-09-28',
    min_investment: 1000,
    management_fee: 1.6,
    performance_1y: 18.5,
    performance_3y: 52.3,
    performance_5y: 95.7
  },
  {
    id: '10',
    name_cn: '政府债券',
    name: 'Government Bond',
    description: '投资于政府发行的债券，风险极低，收益稳定',
    risk_level: 'low',
    type: 'bond',
    status: 'active',
    nav: 4.5,
    changeRate: 0.3,
    created_at: '2023-10-12T00:00:00Z',
    product_number: 'GB001',
    manager: '李十二',
    launch_date: '2023-10-12',
    min_investment: 1000,
    management_fee: 0.4,
    performance_1y: 3.5,
    performance_3y: 10.2,
    performance_5y: 18.7
  },
  {
    id: '11',
    name_cn: '医疗健康基金',
    name: 'Healthcare Fund',
    description: '投资于医疗健康行业的股票，追求长期成长',
    risk_level: 'medium',
    type: 'fund',
    status: 'active',
    nav: 12.4,
    changeRate: 1.5,
    created_at: '2023-11-05T00:00:00Z',
    product_number: 'HF002',
    manager: '张十三',
    launch_date: '2023-11-05',
    min_investment: 1000,
    management_fee: 1.4,
    performance_1y: 12.8,
    performance_3y: 38.5,
    performance_5y: 72.3
  },
  {
    id: '12',
    name_cn: '消费行业基金',
    name: 'Consumer Fund',
    description: '投资于消费行业的股票，受益于消费升级',
    risk_level: 'medium',
    type: 'fund',
    status: 'active',
    nav: 8.9,
    changeRate: 0.9,
    created_at: '2023-12-20T00:00:00Z',
    product_number: 'CF001',
    manager: '刘十四',
    launch_date: '2023-12-20',
    min_investment: 1000,
    management_fee: 1.2,
    performance_1y: 9.5,
    performance_3y: 28.7,
    performance_5y: 56.2
  }
];

export default function FundsList() {
  const [funds, setFunds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [riskLevel, setRiskLevel] = useState('all');
  const [fundType, setFundType] = useState('all');
  const [status, setStatus] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [manager, setManager] = useState('all');
  const [minInvestment, setMinInvestment] = useState('all');
  const pageSize = 12;
  const { t } = useTranslation('common');

  useEffect(() => {
    const fetchFunds = async () => {
      try {
        setLoading(true);
        
        // Filter funds based on search term and filters
        let filteredFunds = [...mockFunds];
        
        // Apply search term filter
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase();
          filteredFunds = filteredFunds.filter(fund => 
            fund.name_cn.toLowerCase().includes(searchLower) || 
            fund.name.toLowerCase().includes(searchLower) || 
            fund.description.toLowerCase().includes(searchLower)
          );
        }
        
        // Apply risk level filter
        if (riskLevel !== 'all') {
          filteredFunds = filteredFunds.filter(fund => fund.risk_level === riskLevel);
        }
        
        // Apply fund type filter
        if (fundType !== 'all') {
          filteredFunds = filteredFunds.filter(fund => fund.type === fundType);
        }
        
        // Apply status filter
        if (status !== 'all') {
          filteredFunds = filteredFunds.filter(fund => fund.status === status);
        }
        
        // Apply manager filter
        if (manager !== 'all') {
          filteredFunds = filteredFunds.filter(fund => fund.manager === manager);
        }
        
        // Apply minimum investment filter
        if (minInvestment !== 'all') {
          const minInvestmentValue = parseInt(minInvestment);
          filteredFunds = filteredFunds.filter(fund => fund.min_investment <= minInvestmentValue);
        }
        
        // Apply sorting
        filteredFunds.sort((a, b) => {
          let aValue: any;
          let bValue: any;
          
          // Safe property access with type assertion
          aValue = (a as any)[sortBy];
          bValue = (b as any)[sortBy];
          
          // Handle date sorting
          if (sortBy === 'created_at' || sortBy === 'launch_date') {
            aValue = new Date(aValue).getTime();
            bValue = new Date(bValue).getTime();
          }
          
          if (aValue < bValue) {
            return sortOrder === 'asc' ? -1 : 1;
          }
          if (aValue > bValue) {
            return sortOrder === 'asc' ? 1 : -1;
          }
          return 0;
        });
        
        // Calculate total pages
        const total = filteredFunds.length;
        setTotalPages(Math.ceil(total / pageSize));
        
        // Apply pagination
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedFunds = filteredFunds.slice(startIndex, endIndex);
        
        setFunds(paginatedFunds);
      } catch (error) {
        console.error('Error fetching funds:', error);
        setFunds([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFunds();
  }, [searchTerm, riskLevel, fundType, status, sortBy, sortOrder, page, manager, minInvestment]);

  const handleSort = (newSortBy: string) => {
    if (newSortBy === sortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setRiskLevel('all');
    setFundType('all');
    setStatus('all');
    setSortBy('created_at');
    setSortOrder('desc');
    setPage(1);
    setManager('all');
    setMinInvestment('all');
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 bg-[var(--background)] min-h-screen">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="bg-[var(--surface)] rounded-xl p-6 animate-pulse">
              <div className="h-6 bg-gray-300 rounded mb-4 w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded mb-6 w-1/2"></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-16 bg-[var(--background)] min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-3xl md:text-4xl font-semibold text-[var(--text-primary)]">{t('fundList')}</h1>
        <div className="w-full md:w-64">
          <input
            type="text"
            placeholder={t('searchFunds')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[var(--surface)] rounded-xl p-6 mb-8 shadow-md">
        <div className="flex flex-wrap gap-6">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">风险等级</label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={riskLevel}
              onChange={(e) => setRiskLevel(e.target.value)}
            >
              <option value="all">全部</option>
              <option value="low">低风险</option>
              <option value="medium">中风险</option>
              <option value="high">高风险</option>
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">产品类型</label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={fundType}
              onChange={(e) => setFundType(e.target.value)}
            >
              <option value="all">全部</option>
              <option value="fund">基金</option>
              <option value="stock">股票</option>
              <option value="bond">债券</option>
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">状态</label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="all">全部</option>
              <option value="active">运行中</option>
              <option value="inactive">已暂停</option>
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">基金经理</label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={manager}
              onChange={(e) => setManager(e.target.value)}
            >
              <option value="all">全部</option>
              <option value="张三">张三</option>
              <option value="李四">李四</option>
              <option value="王五">王五</option>
              <option value="赵六">赵六</option>
              <option value="孙七">孙七</option>
              <option value="周八">周八</option>
              <option value="吴九">吴九</option>
              <option value="郑十">郑十</option>
              <option value="王十一">王十一</option>
              <option value="李十二">李十二</option>
              <option value="张十三">张十三</option>
              <option value="刘十四">刘十四</option>
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">最低投资金额</label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={minInvestment}
              onChange={(e) => setMinInvestment(e.target.value)}
            >
              <option value="all">全部</option>
              <option value="100">100元以下</option>
              <option value="500">500元以下</option>
              <option value="1000">1000元以下</option>
              <option value="2000">2000元以下</option>
              <option value="5000">5000元以下</option>
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">排序方式</label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={sortBy}
              onChange={(e) => handleSort(e.target.value)}
            >
              <option value="created_at">成立日期</option>
              <option value="nav">最新净值</option>
              <option value="changeRate">涨跌幅</option>
              <option value="performance_1y">近1年收益</option>
              <option value="performance_3y">近3年收益</option>
              <option value="performance_5y">近5年收益</option>
              <option value="min_investment">最低投资金额</option>
              <option value="management_fee">管理费率</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-300"
              onClick={resetFilters}
            >
              重置筛选
            </button>
          </div>
        </div>
      </div>

      {/* Fund List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {funds.map((fund) => (
          <Link
            key={fund.id}
            href={`/funds/${fund.id}`}
            className="block bg-[var(--surface)] rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group"
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-semibold text-[var(--text-primary)] group-hover:text-blue-600 transition-colors duration-300">
                  {fund.name_cn || fund.name}
                </h2>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${fund.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                  {fund.status === 'active' ? '运行中' : '已暂停'}
                </span>
              </div>
              
              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {fund.risk_level && (
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${fund.risk_level === 'low' ? 'bg-green-100 text-green-700' : fund.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                    {fund.risk_level === 'low' ? '低风险' : fund.risk_level === 'medium' ? '中风险' : '高风险'}
                  </span>
                )}
                {fund.type && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                    {fund.type === 'fund' ? '基金' : fund.type === 'stock' ? '股票' : fund.type === 'bond' ? '债券' : '其他'}
                  </span>
                )}
                {fund.product_number && (
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                    {fund.product_number}
                  </span>
                )}
              </div>
              
              <p className="text-[var(--text-secondary)] mb-4 line-clamp-2">
                {fund.description || '暂无描述'}
              </p>
              
              {/* Fund Manager */}
              <div className="mb-4">
                <p className="text-sm text-[var(--text-tertiary)]">基金经理</p>
                <p className="text-sm font-medium text-[var(--text-primary)]">{fund.manager || '未知'}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-[var(--text-tertiary)]">最新净值</p>
                  <p className="text-lg font-medium text-[var(--text-primary)]">¥{fund.nav?.toFixed(4) || '0.0000'}</p>
                </div>
                <div>
                  <p className="text-sm text-[var(--text-tertiary)]">涨跌幅</p>
                  <p className={`text-lg font-medium ${fund.changeRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {fund.changeRate >= 0 ? '+' : ''}{fund.changeRate?.toFixed(2) || '0.00'}%
                  </p>
                </div>
              </div>
              
              {/* Performance */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div>
                  <p className="text-xs text-[var(--text-tertiary)]">近1年</p>
                  <p className={`text-sm font-medium ${fund.performance_1y >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {fund.performance_1y >= 0 ? '+' : ''}{fund.performance_1y?.toFixed(1) || '0.0'}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[var(--text-tertiary)]">近3年</p>
                  <p className={`text-sm font-medium ${fund.performance_3y >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {fund.performance_3y >= 0 ? '+' : ''}{fund.performance_3y?.toFixed(1) || '0.0'}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[var(--text-tertiary)]">近5年</p>
                  <p className={`text-sm font-medium ${fund.performance_5y >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {fund.performance_5y >= 0 ? '+' : ''}{fund.performance_5y?.toFixed(1) || '0.0'}%
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-[var(--text-tertiary)]">最低投资</p>
                  <p className="text-sm font-medium text-[var(--text-primary)]">¥{fund.min_investment || '0'}</p>
                </div>
                <div>
                  <p className="text-sm text-[var(--text-tertiary)]">管理费率</p>
                  <p className="text-sm font-medium text-[var(--text-primary)]">{fund.management_fee || '0'}%</p>
                </div>
              </div>
              
              <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                <span className="text-sm text-[var(--text-tertiary)]">
                  成立日期: {new Date(fund.created_at).toLocaleDateString()}
                </span>
                <button className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center gap-1 group-hover:translate-x-1 transition-transform duration-300">
                  查看详情
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-12 flex justify-center">
          <nav className="flex items-center gap-2">
            <button
              className={`px-4 py-2 rounded-lg border ${page === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
              onClick={() => setPage(prev => Math.max(prev - 1, 1))}
              disabled={page === 1}
            >
              上一页
            </button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum = i + 1;
              if (totalPages > 5) {
                if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
              }
              return pageNum;
            }).map((num) => (
              <button
                key={num}
                className={`px-4 py-2 rounded-lg ${page === num ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                onClick={() => setPage(num)}
              >
                {num}
              </button>
            ))}
            
            <button
              className={`px-4 py-2 rounded-lg border ${page === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
              onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
              disabled={page === totalPages}
            >
              下一页
            </button>
          </nav>
        </div>
      )}

      {funds.length === 0 && (
        <div className="text-center py-16">
          <svg className="w-24 h-24 text-gray-300 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-gray-500 text-lg">暂无基金产品</p>
          <button
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-300"
            onClick={resetFilters}
          >
            重置筛选条件
          </button>
        </div>
      )}
    </div>
  );
}
