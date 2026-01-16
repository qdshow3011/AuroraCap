'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

export default function Home() {
  const router = useRouter();
  const { t } = useTranslation('common');

  // Fund data from database
  interface Fund {
    id?: string;
    fund_id?: string;
    name?: string;
    fund_name?: string;
    code?: string;
    nav: number;
    change?: number;
    changeRate?: number;
  }
  
  const [funds, setFunds] = useState<Fund[]>([]);
  const [fundsLoading, setFundsLoading] = useState(true);

  // US stock indices
  const [indices, setIndices] = useState([
    { name: '道琼斯工业平均指数', value: 37891.33, change: 125.67, changeRate: 0.33 },
    { name: '纳斯达克综合指数', value: 15109.02, change: 215.89, changeRate: 1.45 },
    { name: '标普500指数', value: 4860.42, change: 32.17, changeRate: 0.67 },
    { name: '罗素2000指数', value: 2025.78, change: -15.43, changeRate: -0.76 },
  ]);

  // Mock user assets (for logged in users)
  const [userAssets, setUserAssets] = useState({
    total: 150000,
    fundValue: 120000,
    cashBalance: 30000,
  });

  // Check if user is logged in
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // Insights/articles from database
  interface Insight {
    id: string;
    title?: string;
    summary?: string;
    content?: string;
    created_at: string;
  }
  
  const [insights, setInsights] = useState<Insight[]>([]);
  const [insightsLoading, setInsightsLoading] = useState(true);

  useEffect(() => {
    // In a real app, check user authentication status
    // const { data: { user } } = await supabase.auth.getUser();
    // setIsLoggedIn(!!user);
    setIsLoggedIn(false); // Mock for now
    
    // Fetch real funds from database products table
    const fetchFunds = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(3);
        
        if (error) {
          console.error('Error fetching funds:', error);
          return;
        }
        
        console.log('Fetched products data:', data);
        
        if (data) {
          // Use database values if available, otherwise calculate
          const fundsWithCalculations = data.map((fund: any) => {
            // Only calculate if change or changeRate is not available
            if (fund.change === undefined || fund.changeRate === undefined) {
              const change = (Math.random() - 0.5) * 0.1;
              const changeRate = (change / (fund.nav || 1)) * 100;
              
              return {
                ...fund,
                nav: fund.nav || 10,
                change: parseFloat(change.toFixed(4)),
                changeRate: parseFloat(changeRate.toFixed(2))
              };
            }
            
            return fund;
          });
          
          setFunds(fundsWithCalculations);
        }
      } catch (error) {
        console.error('Error fetching funds:', error);
      } finally {
        setFundsLoading(false);
      }
    };
    
    fetchFunds();
    
    // Fetch insights/articles from database internal_references table
    const fetchInsights = async () => {
      try {
        const { data, error } = await supabase
          .from('internal_references')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(3);
        
        if (error) {
          console.error('Error fetching internal references:', error);
          return;
        }
        
        if (data) {
          setInsights(data);
        }
      } catch (error) {
        console.error('Error fetching internal references:', error);
      } finally {
        setInsightsLoading(false);
      }
    };
    
    fetchInsights();
  }, []);

  const handleObserverLogin = async () => {
    try {
      // 直接跳转到基金列表页，模拟观察员体验
      router.push('/funds');
    } catch (error) {
      console.error('Observer login error:', error);
      alert('观察员登录失败，请稍后重试');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Hero Section - Value Proposition */}
      <section className="bg-gradient-to-b from-[var(--surface)] to-[var(--background)] text-[var(--text-primary)] py-24 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden opacity-30">
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-[var(--primary-light)]/10 rounded-full blur-3xl animate-pulse-slow"></div>
          <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-[var(--secondary)]/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1.5s' }}></div>
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-[var(--accent)]/10 rounded-full blur-2xl animate-pulse-slow" style={{ animationDelay: '3s' }}></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            {/* Main Heading */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-8 leading-tight tracking-tight animate-fade-in-up bg-clip-text text-transparent bg-gradient-to-r from-[var(--primary)] to-[var(--accent)]">
              聚焦AI趋势，成就财富未来
            </h1>
            
            {/* Value Proposition */}
            <p className="text-xl md:text-2xl text-[var(--text-secondary)] mb-12 max-w-2xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              成长性投资理念、华尔街精英操盘，为您提供专业价值投资分析操盘策略，前瞻布局人工智能未来红利
            </p>
            
            {/* Membership Information */}
            <div className="mb-12 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              <div className="bg-white/10 backdrop-blur-md inline-block px-8 py-4 rounded-full text-sm font-semibold shadow-lg">
                <span className="mr-2">🔒</span>
                会员制入口：网站大部分深度内容设为“仅限受邀投资者可见”
              </div>
            </div>
            
              {/* CTA Buttons */}
            <div className="flex flex-wrap justify-center gap-8 animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
              <Link
                href="/about"
                className="btn btn-primary btn-lg relative group shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-500"
              >
                <span className="relative z-10 font-bold">了解我们</span>
                <span className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500"></span>
                <span className="absolute -bottom-1 left-0 w-full h-1 bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] opacity-70"></span>
              </Link>
              <Link
                href="/contact"
                className="btn btn-secondary btn-lg relative overflow-hidden group shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-500"
              >
                <span className="relative z-10">申请邀请码</span>
                <span className="absolute inset-0 bg-gradient-to-r from-transparent to-white/10 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500"></span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Market Overview Section */}
      <section className="py-16 bg-[var(--surface)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl font-bold text-[var(--text-primary)]">
              {t('marketOverview')}
            </h2>
            <span className="text-sm text-[var(--text-tertiary)">实时行情</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {indices.map((index, i) => (
              <div 
                key={i} 
                className="card bg-[var(--background)] p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-medium text-[var(--text-primary)] text-lg">{index.name}</h3>
                  <span className={`text-sm font-semibold px-3 py-1 rounded-full ${index.change >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {index.change >= 0 ? '+' : ''}{index.changeRate.toFixed(2)}%
                  </span>
                </div>
                <div className="text-3xl font-bold text-[var(--text-primary)] mb-3">
                  {index.value.toFixed(2)}
                </div>
                <div className={`text-sm font-medium ${index.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {index.change >= 0 ? '↑' : '↓'} {Math.abs(index.change).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Funds Section */}
      <section className="py-24 bg-[var(--background)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl font-bold text-[var(--text-primary)]">
              {t('featuredFunds')}
            </h2>
            <Link 
              href="/funds" 
              className="text-blue-600 hover:text-blue-800 font-medium text-lg flex items-center gap-2 group"
            >
              <span>{t('viewAll')}</span>
              <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {fundsLoading ? (
              // Loading skeletons
              Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="card bg-[var(--surface)] p-8 animate-pulse rounded-2xl">
                  <div className="h-6 bg-gray-300 rounded mb-4 w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded mb-6 w-1/2"></div>
                  <div className="h-10 bg-gray-300 rounded mb-4"></div>
                  <div className="h-5 bg-gray-200 rounded mb-6 w-1/3"></div>
                  <div className="flex justify-between items-center">
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                    <div className="h-8 bg-gray-300 rounded-full w-20"></div>
                  </div>
                </div>
              ))) : funds.length > 0 ? (
              // Real fund data
              funds.map((fund: any, index: number) => (
                <Link 
                  key={fund.id || fund.fund_id} 
                  href={`/funds/${fund.id || fund.fund_id}`}
                  className="block relative group"
                >
                  <div className="card bg-[var(--surface)] p-10 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 rounded-2xl">
                    {/* Limited Offer Badge */}
                    {index < 2 && (
                      <div className="absolute -top-4 -right-4 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg transform rotate-12 animate-bounce-slow">
                        限量发售
                      </div>
                    )}
                    <div className="mb-6">
                      <h3 className="font-medium text-[var(--text-primary)] text-lg line-clamp-2 group-hover:text-[var(--primary)] transition-colors">
                        {fund.name_cn || fund.name || fund.fund_name || '未知基金'}
                      </h3>
                      {fund.product_number && (
                        <p className="text-xs text-[var(--text-tertiary)] mt-2">产品编号: {fund.product_number}</p>
                      )}
                      {fund.code && (
                        <p className="text-xs text-[var(--text-tertiary)] mt-1">{fund.code}</p>
                      )}
                    </div>
                    
                    {/* 产品类型和风险等级标签 */}
                    <div className="mb-6 flex flex-wrap gap-2">
                      {fund.type && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                          {fund.type === 'fund' ? '基金' : fund.type === 'stock' ? '股票' : fund.type === 'bond' ? '债券' : '其他'}
                        </span>
                      )}
                      {fund.risk_level && (
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${fund.risk_level === 'low' ? 'bg-green-100 text-green-700' : fund.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                          {fund.risk_level === 'low' ? '低风险' : fund.risk_level === 'medium' ? '中风险' : '高风险'}
                        </span>
                      )}
                      {fund.status && (
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${fund.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                          {fund.status === 'active' ? '运行中' : '已暂停'}
                        </span>
                      )}
                    </div>
                    
                    <div className="text-3xl font-bold text-[var(--text-primary)] mb-3">
                      ¥{parseFloat(fund.nav || 0).toFixed(4)}
                    </div>
                    <div className={`text-sm font-semibold mb-6 ${fund.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {fund.change >= 0 ? '+' : ''}{parseFloat(fund.changeRate || 0).toFixed(2)}%
                    </div>
                    <div className="flex justify-between items-center mb-6">
                      <span className="text-xs text-[var(--text-tertiary)]">
                        {fund.change >= 0 ? '↑' : '↓'} {Math.abs(parseFloat(fund.change || 0)).toFixed(4)}
                      </span>
                    </div>
                    
                    {/* 核心资产和核心策略 */}
                    {fund.core_assets && fund.core_assets !== '' && (
                      <div className="mb-4">
                        <h4 className="text-xs font-medium text-[var(--text-tertiary)] mb-2">核心资产</h4>
                        <p className="text-sm text-[var(--text-primary)] line-clamp-2">{fund.core_assets}</p>
                      </div>
                    )}
                    {fund.core_strategy && fund.core_strategy !== '' && (
                      <div className="mb-6">
                        <h4 className="text-xs font-medium text-[var(--text-tertiary)] mb-2">核心策略</h4>
                        <p className="text-sm text-[var(--text-primary)] line-clamp-2">{fund.core_strategy}</p>
                      </div>
                    )}
                    
                    <div className="flex justify-center">
                      <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-medium rounded-full hover:shadow-md transform hover:scale-105 transition-all duration-200">
                        立即抢购
                      </button>
                    </div>
                    {/* Progress Bar for limited funds */}
                    {index < 2 && (
                      <div className="mt-6">
                        <div className="flex justify-between text-xs text-[var(--text-tertiary)] mb-2">
                          <span>仅剩 {Math.floor(Math.random() * 50) + 10} 个名额</span>
                          <span>已售 {Math.floor(Math.random() * 70) + 30}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-green-400 to-blue-500 h-full rounded-full transition-all duration-1000 ease-out" 
                            style={{ width: `${Math.floor(Math.random() * 70) + 30}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                </Link>
              ))
            ) : (
              // No funds found
              <div className="col-span-full text-center py-24">
                <svg className="w-24 h-24 text-[var(--text-tertiary)] mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="text-xl text-[var(--text-secondary)]">暂无基金产品</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Investment Features Section */}
      <section className="py-24 bg-[var(--surface)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-3xl font-bold mb-6 text-[var(--text-primary)]">
              {t('investmentFeatures')}
            </h2>
            <p className="text-xl text-[var(--text-secondary)] max-w-3xl mx-auto">
              {t('professionalInvestmentTools')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Feature 1 */}
            <div className="card bg-[var(--background)] p-10 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 rounded-2xl group">
              <div className="text-[var(--primary)] mb-8 transform group-hover:scale-110 transition-transform duration-300">
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20ZM13 7H11V11H7V13H11V17H13V13H17V11H13V7Z" fill="currentColor"/>
                </svg>
              </div>
              <h3 className="text-2xl font-semibold mb-5 text-[var(--text-primary)]">{t('aiInvestmentStrategy')}</h3>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                {t('dataDrivenInvestment')}
              </p>
            </div>
            
            {/* Feature 2 */}
            <div className="card bg-[var(--background)] p-10 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 rounded-2xl group">
              <div className="text-[var(--primary)] mb-8 transform group-hover:scale-110 transition-transform duration-300">
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20ZM13 7H11V11H7V13H11V17H13V13H17V11H13V7Z" fill="currentColor"/>
                </svg>
              </div>
              <h3 className="text-2xl font-semibold mb-5 text-[var(--text-primary)]">{t('diversifiedPortfolio')}</h3>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                {t('spreadInvestmentRisk')}
              </p>
            </div>
            
            {/* Feature 3 */}
            <div className="card bg-[var(--background)] p-10 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 rounded-2xl group">
              <div className="text-[var(--primary)] mb-8 transform group-hover:scale-110 transition-transform duration-300">
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20ZM13 7H11V11H7V13H11V17H13V13H17V11H13V7Z" fill="currentColor"/>
                </svg>
              </div>
              <h3 className="text-2xl font-semibold mb-5 text-[var(--text-primary)]">{t('realTimeMonitoring')}</h3>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                {t('trackInvestmentPerformance')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions Section */}
      <section className="py-24 bg-[var(--background)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="card bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] text-white p-16 rounded-2xl shadow-2xl overflow-hidden relative">
            {/* Background pattern */}
            <div className="absolute top-0 right-0 w-1/3 h-full opacity-10">
              <svg width="100%" height="100%" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                    <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5"/>
                  </pattern>
                </defs>
                <rect width="100" height="100" fill="url(#grid)"/>
              </svg>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 items-center relative z-10">
              <div>
                <h2 className="text-3xl font-bold mb-6">
                  {t('quickActions')}
                </h2>
                <p className="text-white/80 text-lg">
                  {t('fastTrackToInvestment')}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-6 md:col-span-2">
                <Link 
                  href="/funds" 
                  className="bg-white/20 backdrop-blur-md text-white py-6 px-8 rounded-xl hover:bg-white/30 transition-all duration-300 transform hover:-translate-y-1 shadow-lg group"
                >
                  <div className="text-2xl font-medium mb-2 group-hover:text-opacity-100 transition-opacity">{t('browseFunds')}</div>
                  <div className="text-sm opacity-80">{t('exploreInvestmentOptions')}</div>
                </Link>
                <Link 
                  href="/user/deposit" 
                  className="bg-white/20 backdrop-blur-md text-white py-6 px-8 rounded-xl hover:bg-white/30 transition-all duration-300 transform hover:-translate-y-1 shadow-lg group"
                >
                  <div className="text-2xl font-medium mb-2 group-hover:text-opacity-100 transition-opacity">{t('depositFunds')}</div>
                  <div className="text-sm opacity-80">{t('addFundsToAccount')}</div>
                </Link>
                <Link 
                  href="/user/assets" 
                  className="bg-white/20 backdrop-blur-md text-white py-6 px-8 rounded-xl hover:bg-white/30 transition-all duration-300 transform hover:-translate-y-1 shadow-lg group"
                >
                  <div className="text-2xl font-medium mb-2 group-hover:text-opacity-100 transition-opacity">{t('checkAssets')}</div>
                  <div className="text-sm opacity-80">{t('viewYourPortfolio')}</div>
                </Link>
                <Link 
                  href="/insights" 
                  className="bg-white/20 backdrop-blur-md text-white py-6 px-8 rounded-xl hover:bg-white/30 transition-all duration-300 transform hover:-translate-y-1 shadow-lg group"
                >
                  <div className="text-2xl font-medium mb-2 group-hover:text-opacity-100 transition-opacity">{t('marketInsights')}</div>
                  <div className="text-sm opacity-80">{t('stayInformed')}</div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Insights Section - Exclusive Reports */}
      <section className="py-24 bg-[var(--surface)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl font-bold text-[var(--text-primary)]">
              内参文章
            </h2>
            <Link 
              href="/insights" 
              className="text-blue-600 hover:text-blue-800 font-medium text-lg flex items-center gap-2 group"
            >
              <span>查看全部</span>
              <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {insightsLoading ? (
              // Loading skeletons
              Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="card bg-[var(--background)] p-8 animate-pulse rounded-2xl">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
                  <div className="h-7 bg-gray-300 rounded mb-6"></div>
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                  <div className="h-5 bg-gray-200 rounded w-20 mt-6"></div>
                </div>
              ))
            ) : insights.length > 0 ? (
              // Real insights data
              insights.map((insight: any) => (
                <div key={insight.id} className="card bg-[var(--background)] p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 rounded-2xl group">
                  <div className="text-sm text-gray-500 mb-4 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {new Date(insight.created_at).toLocaleDateString()}
                  </div>
                  <h3 className="text-2xl font-semibold mb-5 text-[var(--text-primary)] line-clamp-2 group-hover:text-[var(--primary)] transition-colors">
                    {insight.title || '无标题'}
                  </h3>
                  <p className="text-[var(--text-secondary)] mb-6 line-clamp-4 leading-relaxed">
                    {insight.summary || insight.content || '暂无摘要'}
                  </p>
                  <button 
                    onClick={() => {
                      if (isLoggedIn) {
                        router.push(`/insights/${insight.id}`);
                      } else {
                        router.push(`/login?redirect=/insights/${insight.id}`);
                      }
                    }}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium group"
                  >
                    <span>阅读全文</span>
                    <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                </div>
              ))
            ) : (
              // No insights found
              <div className="col-span-full text-center py-24">
                <svg className="w-24 h-24 text-[var(--text-tertiary)] mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
                <p className="text-xl text-[var(--text-secondary)]">暂无内参文章</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}