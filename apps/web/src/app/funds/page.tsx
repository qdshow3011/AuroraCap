'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

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
  const pageSize = 12;
  const { t } = useTranslation('common');

  useEffect(() => {
    const fetchFunds = async () => {
      try {
        setLoading(true);
        console.log('Fetching funds from Supabase...');
        
        let query = supabase.from('products').select('*', { count: 'exact' });
        
        // Apply filters
        if (searchTerm) {
          const searchPattern = `%${searchTerm}%`;
          query = query.ilike('name_cn', searchPattern).or(`ilike(description, "${searchPattern}")`);
        }
        
        if (riskLevel !== 'all') {
          query = query.eq('risk_level', riskLevel);
        }
        
        if (fundType !== 'all') {
          query = query.eq('type', fundType);
        }
        
        if (status !== 'all') {
          query = query.eq('status', status);
        }
        
        // Apply sorting
        query = query.order(sortBy, { ascending: sortOrder === 'asc' });
        
        // Apply pagination
        const { data, error, count } = await query.range((page - 1) * pageSize, page * pageSize - 1);
        
        if (error) {
          console.error('Supabase error fetching funds:', error);
          setFunds([]);
          return;
        }
        
        console.log('Successfully fetched funds:', data?.length || 0, 'funds found');
        setFunds(data || []);
        setTotalPages(Math.ceil((count || 0) / pageSize));
      } catch (error) {
        console.error('Unexpected error fetching funds:', error);
        setFunds([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFunds();
  }, [searchTerm, riskLevel, fundType, status, sortBy, sortOrder, page]);

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
            <label className="block text-sm font-medium text-gray-700 mb-2">排序方式</label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={sortBy}
              onChange={(e) => handleSort(e.target.value)}
            >
              <option value="created_at">成立日期</option>
              <option value="nav">最新净值</option>
              <option value="changeRate">涨跌幅</option>
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
              
              <p className="text-[var(--text-secondary)] mb-6 line-clamp-2">
                {fund.description || '暂无描述'}
              </p>
              
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
