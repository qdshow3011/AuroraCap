import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, TouchableOpacity } from 'react-native'
import NavChart from '../components/NavChart'
import { supabase } from '../lib/supabase'

function format(n: number) {
  return Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)
}

// 证券市场行情数据结构
interface MarketIndex {
  id: string
  name: string
  code: string
  value: number
  change: number
  changePercent: number
}

interface MarketCategory {
  id: string
  name: string
  indices: MarketIndex[]
}

// 内参文章类型定义
interface InsiderArticle {
  id: string
  title: string
  date: string
  summary: string
}

// 基金产品类型定义
interface FundProduct {
  id: string
  name: string
  code: string
  returnRate: number
  description: string
}

export default function PortfolioScreen({ lang = 'zh', observerHoldings, demo, userInfo, onInsiderArticlePress, onProductPress, onNavigateTo, onNavigateToSubscriptionApplication, onNavigateToRedemptionApplication, unreadMessages = 0 }: { lang?: 'zh' | 'en'; observerHoldings?: any[]; demo?: boolean; userInfo?: any; onInsiderArticlePress?: (article: any) => void; onProductPress?: (product: any) => void; onNavigateTo?: (screen: string) => void; onNavigateToSubscriptionApplication?: (product?: any) => void; onNavigateToRedemptionApplication?: () => void; unreadMessages?: number }) {
  // 持仓状态
  const [totalAssets, setTotalAssets] = useState(0)
  const [ibCash, setIbCash] = useState(0)
  const [fundHolding, setFundHolding] = useState(0)
  const [holdingIncome, setHoldingIncome] = useState(0)
  const [recentIncome, setRecentIncome] = useState(0)
  const [navSeries, setNavSeries] = useState<number[]>([])
  
  // 证券市场行情
  const [marketCategories, setMarketCategories] = useState<MarketCategory[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  
  // 内参文章
  const [insiderArticles, setInsiderArticles] = useState<InsiderArticle[]>([])
  
  // 基金产品
  const [fundProducts, setFundProducts] = useState<FundProduct[]>([])
  
  // 搜索功能
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showSearchResults, setShowSearchResults] = useState(false)

  // 处理内参文章点击，获取完整内容
  const handleInsiderArticlePress = async (article: any) => {
    try {
      if (!supabase || !article.id) {
        onInsiderArticlePress && onInsiderArticlePress(article)
        return
      }

      // 从数据库获取完整的文章内容
      const { data: fullArticle, error } = await supabase
        .from('internal_references')
        .select('*')
        .eq('id', article.id)
        .single()

      if (error) {
        console.error('获取完整文章内容失败:', error)
        onInsiderArticlePress && onInsiderArticlePress(article)
        return
      }

      // 传递完整的文章对象
      onInsiderArticlePress && onInsiderArticlePress(fullArticle || article)
    } catch (error) {
      console.error('处理内参文章点击失败:', error)
      onInsiderArticlePress && onInsiderArticlePress(article)
    }
  }

  useEffect(() => {
    ;(async () => {
      // 首先检查是否有特约观察员持仓数据
      if (observerHoldings && observerHoldings.length > 0) {
        // 使用特约观察员持仓数据（从positions表获取）
        // 计算总资产和各部分资产
        const total = observerHoldings.reduce((sum, holding) => sum + (holding.current_value || 0), 0)
        setTotalAssets(total)
        
        // 计算持有收益（当前价值 - 成本基础）
        const totalCost = observerHoldings.reduce((sum, holding) => sum + (holding.avg_cost * holding.shares || 0), 0)
        const income = total - totalCost
        setHoldingIncome(income)
        
        // 基金持仓 = 所有基金类资产（positions表中的所有持仓都是基金）
        const fundAssets = observerHoldings.reduce((sum, holding) => sum + (holding.current_value || 0), 0)
        setFundHolding(fundAssets)
        setIbCash(0) // positions表中没有现金资产，设为0
        setRecentIncome(0) // 特约观察员数据中没有最近收益，暂设为0
        
        // 初始化空数据，等待真实数据加载
        setNavSeries([])
        setMarketCategories([])
        setSelectedCategory('')
        
        // 从Supabase获取真实的内参和产品数据
        if (supabase) {
          try {
            // 1. 获取内参文章
            const { data: articlesData, error: articlesError } = await supabase
              .from('internal_references')
              .select('id, title, content, published_at, created_at')
              .eq('status', 'published')
              .order('created_at', { ascending: false })
              .limit(3)
            
            if (!articlesError && articlesData) {
              const formattedArticles = articlesData.map((article: any) => ({
                id: article.id,
                title: article.title,
                date: lang === 'zh' ? (article.published_at || article.created_at).split('T')[0] : new Date(article.published_at || article.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                summary: article.content.substring(0, 100) + '...'
              }))
              setInsiderArticles(formattedArticles)
            }
            
            // 2. 获取基金产品 - 先获取基本产品数据，使用正确的字段名
            console.log('开始获取基金产品数据...');
            const { data: productsData, error: productsError } = await supabase
              .from('products')
              .select(`
                id, product_number, name_cn, name_en, description, type, risk_level, status
              `)
              .order('created_at', { ascending: false })
              .limit(3)
            
            if (productsError) {
              console.error('获取基金产品错误:', productsError);
            } else {
              console.log('获取到基金产品数据:', productsData);
            }
            
            if (!productsError && productsData && Array.isArray(productsData)) {
              console.log('productsData数组长度:', productsData.length);
              if (productsData.length > 0) {
                // 使用正确的字段名和结构，保存完整的产品对象
                const formattedProducts = productsData.map((product: any) => ({
                  ...product, // 保存完整的产品对象，包括所有字段
                  name: lang === 'zh' ? product.name_cn : product.name_en || product.name_cn,
                  code: product.product_number || (lang === 'zh' ? product.name_cn : product.name_en || product.name_cn),
                  returnRate: 0, // 暂设为0，等数据库添加return_rate字段后再使用
                  description: product.description || ''
                }))
                console.log('格式化后的基金产品数据:', formattedProducts);
                setFundProducts(formattedProducts)
              } else {
            console.log('productsData为空数组，使用空数组');
            setFundProducts([]);
          }
            } else {
              console.log('获取基金产品失败或数据格式错误');
              console.error('productsError:', productsError);
              console.error('productsData:', productsData);
              setFundProducts([]);
            }
          } catch (error) {
            console.error('Error fetching observer data:', error)
            // 使用模拟数据作为fallback，确保页面不空白
            setInsiderArticles([])
            setFundProducts([]);
          }
        } else {
          // 如果没有supabase实例，使用空数据
          console.error('Supabase instance not available')
          setInsiderArticles([])
          setFundProducts([])
        }
        return
      }
      
      // 如果没有特约观察员数据，从positions表获取登录用户的持仓数据
      if (!supabase) {
        console.error('Supabase instance not available')
        return
      }
      
      // 检查是否有登录用户信息
      if (!userInfo || !userInfo.id) {
        console.log('没有登录用户信息，无法获取持仓数据')
        return
      }
      
      // 真实数据获取逻辑 - 从Supabase获取数据
      try {
        // 1. 获取登录用户的持仓数据（从positions表）
        const { data: positionsData, error: positionsError } = await supabase
          .from('positions')
          .select(`
            *,
            products (
              id,
              product_number,
              name_cn,
              name_en,
              type
            )
          `)
          .eq('user_id', userInfo.id)
        
        if (positionsError) {
          console.error('获取用户持仓数据失败:', positionsError)
          return
        }
        
        if (positionsData && positionsData.length > 0) {
          console.log('登录用户ID:', userInfo.id)
          console.log('获取到用户持仓数据:', positionsData.length, '条')
          console.log('持仓详情:', JSON.stringify(positionsData, null, 2))
          
          // 计算总资产和各部分资产
          const total = positionsData.reduce((sum, position) => sum + (position.current_value || 0), 0)
          console.log('总资产计算: 各持仓current_value累加 =', total)
          setTotalAssets(total)
          
          // 计算持有收益（当前价值 - 成本基础）
          const totalCost = positionsData.reduce((sum, position) => sum + (position.avg_cost * position.shares || 0), 0)
          const income = total - totalCost
          console.log('持有收益: 总资产', total, '- 成本', totalCost, '=', income)
          setHoldingIncome(income)
          
          // 计算基金持仓价值
          const fundAssets = positionsData.reduce((sum, position) => sum + (position.current_value || 0), 0)
          setFundHolding(fundAssets)
          setIbCash(0) // positions表中没有现金数据，设为0
          
          // 计算今日收益
          let dailyIncome = 0
          for (const position of positionsData) {
            console.log('处理持仓:', position.fund_id, '份额:', position.shares, '最新净值:', position.latest_nav)
            if (position.fund_id && position.shares && position.latest_nav) {
              // 获取该产品昨日的净值
              const { data: navHistory } = await supabase
                .from('fund_nav_history')
                .select('nav, timestamp')
                .eq('product_id', position.fund_id)
                .order('timestamp', { ascending: false })
                .limit(2)
              
              console.log('产品', position.fund_id, '的净值历史:', navHistory)
              
              if (navHistory && navHistory.length >= 2) {
                const yesterdayNav = navHistory[1].nav
                const todayNav = position.latest_nav
                const positionDailyIncome = (todayNav - yesterdayNav) * position.shares
                console.log('持仓今日收益: (', todayNav, '-', yesterdayNav, ') ×', position.shares, '=', positionDailyIncome)
                dailyIncome += positionDailyIncome
              } else {
                console.log('产品', position.fund_id, '净值历史数据不足，跳过')
              }
            }
          }
          console.log('今日收益总计:', dailyIncome)
          setRecentIncome(dailyIncome)
          
          // 初始化空的净值曲线数据，等待真实数据加载
          setNavSeries([])
        } else {
          console.log('用户暂无持仓数据')
          setTotalAssets(0)
          setFundHolding(0)
          setHoldingIncome(0)
          setRecentIncome(0)
        }
        
        // 2. 获取内参文章
        const { data: articlesData, error: articlesError } = await supabase
          .from('internal_references')
          .select('id, title, content, published_at, created_at')
          .eq('status', 'published')
          .order('created_at', { ascending: false })
          .limit(3)
        
        if (!articlesError && articlesData) {
          const formattedArticles = articlesData.map((article: any) => ({
            id: article.id,
            title: article.title,
            date: lang === 'zh' ? (article.published_at || article.created_at).split('T')[0] : new Date(article.published_at || article.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            summary: article.content.substring(0, 100) + '...'
          }))
          setInsiderArticles(formattedArticles)
        }
        
        // 3. 获取基金产品
        console.log('开始获取基金产品数据...');
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select(`
            id, product_number, name_cn, name_en, description, type, risk_level, status
          `)
          .order('created_at', { ascending: false })
          .limit(3)
        
        if (productsError) {
          console.error('获取基金产品错误:', productsError);
        } else {
          console.log('获取到基金产品数据:', productsData);
        }
        
        if (!productsError && productsData && Array.isArray(productsData)) {
          console.log('productsData数组长度:', productsData.length);
          if (productsData.length > 0) {
            // 使用正确的字段名和结构，保存完整的产品对象
            const formattedProducts = productsData.map((product: any) => ({
              ...product, // 保存完整的产品对象，包括所有字段
              name: lang === 'zh' ? product.name_cn : product.name_en || product.name_cn,
              code: product.product_number || (lang === 'zh' ? product.name_cn : product.name_en || product.name_cn),
              returnRate: 0, // 暂设为0，等数据库添加return_rate字段后再使用
              description: product.description || ''
            }))
            console.log('格式化后的基金产品数据:', formattedProducts);
            setFundProducts(formattedProducts)
          } else {
                console.log('productsData为空数组，使用空数组');
                setFundProducts([]);
              }
            } else {
              console.log('获取基金产品失败或数据格式错误');
              console.error('productsError:', productsError);
              console.error('productsData:', productsData);
              setFundProducts([]);
            }
        
        // 4. 获取市场指数数据（从Supabase yahoo_indices表）
        const { data: indicesData, error: indicesError } = await supabase
          .from('yahoo_indices')
          .select('symbol, name, price, change, change_percent, market_type')
          
        if (!indicesError && indicesData) {
          // 定义分类名称映射
          const categoryNames: Record<string, string> = {
            'us': lang === 'zh' ? '美股' : 'US Stocks',
            'cn': lang === 'zh' ? 'A股' : 'A-Shares',
            'hk': lang === 'zh' ? '港股' : 'HK Stocks',
            'crypto': lang === 'zh' ? '数字货币' : 'Crypto',
            'commodity': lang === 'zh' ? '商品' : 'Commodities',
            'other': lang === 'zh' ? '其他' : 'Others'
          }
          
          // 将索引数据按market_type分组
          const groupedData = new Map<string, any[]>()
          indicesData.forEach(item => {
            const type = item.market_type || 'other'
            if (!groupedData.has(type)) {
              groupedData.set(type, [])
            }
            groupedData.get(type)?.push(item)
          })
          
          // 创建市场分类数据，每类最多4个
          const categories = Array.from(groupedData.entries()).map(([type, indices]) => ({
            id: type,
            name: categoryNames[type] || type,
            indices: indices.slice(0, 4).map((item, index) => ({
              id: `${type}${index + 1}`,
              name: item.name || item.symbol,
              code: item.symbol,
              value: item.price || 0,
              change: item.change || 0,
              changePercent: item.change_percent || 0
            }))
          }))
        
          setMarketCategories(categories)
          setSelectedCategory(categories[0]?.id || '')
        } else {
          // 如果获取失败，设置空分类
          setMarketCategories([])
          setSelectedCategory('')
        }
        
      } catch (error) {
        console.error('Error fetching portfolio data:', error)
        // 发生错误时设置空数据
        setTotalAssets(0)
        setIbCash(0)
        setFundHolding(0)
        setHoldingIncome(0)
        setRecentIncome(0)
        setNavSeries([])
        setMarketCategories([])
        setSelectedCategory('')
        setInsiderArticles([])
        setFundProducts([])
      }
    })()
  }, [lang, userInfo, observerHoldings])

  // 获取指数的中文名称
  const getIndexName = (code: string): string => {
    const indexNames: Record<string, string> = {
      'DJIA': '道琼斯',
      'NASDAQ': '纳斯达克',
      'SPX': '标普500',
      '000001.SH': '上证指数',
      '399001.SZ': '深证成指',
      '399006.SZ': '创业板指',
      'HSI': '恒生指数',
      'HSTECH': '恒生科技',
      'HSCEI': '国企指数',
      'GC': 'COMEX黄金',
      'XAUUSD': '伦敦金'
    }
    return indexNames[code] || code
  }

  // 搜索功能实现
  useEffect(() => {
    const searchData = async () => {
      if (!searchQuery.trim() || !supabase) {
        setSearchResults([])
        return
      }

      try {
        // 搜索内参文章
        const { data: articlesData, error: articlesError } = await supabase
          .from('internal_references')
          .select('id, title, content, published_at')
          .or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`)
          .limit(10)

        // 搜索基金产品
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('id, name_cn, name_en, fund_number, description_cn, description_en')
          .or(`name_cn.ilike.%${searchQuery}%,name_en.ilike.%${searchQuery}%,fund_number.ilike.%${searchQuery}%,description_cn.ilike.%${searchQuery}%,description_en.ilike.%${searchQuery}%`)
          .limit(10)

        // 搜索市场指数
        const { data: indicesData, error: indicesError } = await supabase
          .from('yahoo_indices')
          .select('symbol, name, price')
          .or(`name.ilike.%${searchQuery}%,symbol.ilike.%${searchQuery}%`)
          .limit(10)

        // 整合搜索结果
        const results = []

        // 添加内参文章结果
        if (!articlesError && articlesData) {
          results.push(...articlesData.map((article: any) => ({
            id: article.id,
            title: article.title,
            type: 'insider',
            date: article.published_at,
            content: article.content
          })))
        }

        // 添加基金产品结果
        if (!productsError && productsData) {
          results.push(...productsData.map((product: any) => ({
            id: product.id,
            title: lang === 'zh' ? product.name_cn : (product.name_en || product.name_cn),
            type: 'product',
            code: product.fund_number,
            description: lang === 'zh' ? product.description_cn : (product.description_en || product.description_cn)
          })))
        }

        // 添加市场指数结果
        if (!indicesError && indicesData) {
          results.push(...indicesData.map((index: any) => ({
            id: index.symbol,
            title: index.name,
            type: 'news',
            code: index.symbol,
            value: index.price
          })))
        }

        setSearchResults(results)
      } catch (error) {
        console.error('Search error:', error)
        setSearchResults([])
      }
    }

    // 使用防抖函数，避免频繁搜索
    const debounceTimer = setTimeout(() => {
      searchData()
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [searchQuery, lang, supabase])

  // 语言翻译
  const t = lang === 'zh' ? {
    portfolio: '客户持仓状况',
    totalAssets: '总资产',
    ibCash: '盈透现金',
    fundHolding: '基金持仓',
    holdingIncome: '持有收益',
    recentIncome: '今日收益',
    insiderExpress: '内参快递',
    productRecommendation: '产品推介',
    viewDetails: '查看详情',
    yearReturn: '年收益率'
  } : {
    portfolio: 'Portfolio Status',
    totalAssets: 'Total Assets',
    ibCash: 'IB Cash',
    fundHolding: 'Fund Holdings',
    holdingIncome: 'Holding Income',
    recentIncome: 'Daily Income',
    insiderExpress: 'Insider Express',
    productRecommendation: 'Product Recommendations',
    viewDetails: 'View Details',
    yearReturn: 'Annual Return'
  }
  
  // 添加搜索相关的样式
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#f0f2f5', // 淡浅灰色
    },
    contentScrollView: {
      flex: 1,
    },
    section: {
      backgroundColor: '#fff', // 板块底色白色
      borderRadius: 12,
      padding: 16,
      marginHorizontal: 12, // 缩小左右缝隙
      marginVertical: 8,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 5,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 16,
      color: '#333',
    },
    tabScrollView: {
      marginBottom: 16,
    },
    tabItem: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      marginRight: 8,
      backgroundColor: '#f0f0f0',
    },
    tabItemSelected: {
      backgroundColor: '#1a73e8',
    },
    tabText: {
      fontSize: 14,
      color: '#666',
    },
    tabTextSelected: {
      color: '#fff',
      fontWeight: 'bold',
    },
    selectedIndicesContainer: {
      backgroundColor: '#f8f9fa',
      borderRadius: 8,
      padding: 12,
    },
    indexRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: '#e9ecef',
    },
    indexRowLast: {
      borderBottomWidth: 0,
    },
    indexInfo: {
      flex: 1,
    },
    indexName: {
      fontSize: 14,
      fontWeight: '500',
      color: '#333',
    },
    indexCode: {
      fontSize: 12,
      color: '#666',
      marginTop: 2,
    },
    indexValueContainer: {
      alignItems: 'flex-end',
    },
    indexValue: {
      fontSize: 14,
      fontWeight: '500',
      color: '#333',
    },
    changeContainer: {
      flexDirection: 'row',
      marginTop: 2,
    },
    indexChange: {
      fontSize: 12,
      marginRight: 8,
    },
    indexChangeValue: {
      fontSize: 12,
    },
    changePositive: {
      color: '#d93025',
    },
    changeNegative: {
      color: '#188038',
    },
    portfolioCard: {
      backgroundColor: '#f8f9fa',
      borderRadius: 8,
      padding: 16,
    },
    portfolioItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    portfolioItemLast: {
      marginBottom: 0,
    },
    portfolioLabel: {
      fontSize: 14,
      color: '#666',
    },
    portfolioValue: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#333',
    },
    positiveIncome: {
      color: '#d93025',
    },
    negativeIncome: {
      color: '#188038',
    },
    chartContainer: {
      height: 200,
      marginTop: 16,
    },
    insiderList: {
      backgroundColor: '#f8f9fa',
      borderRadius: 8,
      padding: 12,
    },
    insiderItem: {
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#e9ecef',
    },
    insiderItemLast: {
      borderBottomWidth: 0,
    },
    insiderHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    insiderTitle: {
      fontSize: 14,
      fontWeight: '500',
      color: '#333',
      flex: 1,
      marginRight: 8,
    },
    insiderDate: {
      fontSize: 12,
      color: '#666',
    },
    insiderSummary: {
      fontSize: 12,
      color: '#666',
      lineHeight: 16,
      marginBottom: 8,
    },
    viewDetails: {
      fontSize: 12,
      color: '#1a73e8',
      fontWeight: '500',
    },
    productList: {
      backgroundColor: '#f8f9fa',
      borderRadius: 8,
      padding: 12,
    },
    productCard: {
      backgroundColor: '#fff',
      borderRadius: 8,
      padding: 12,
      marginBottom: 12,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    productHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    productName: {
      fontSize: 14,
      fontWeight: '500',
      color: '#333',
    },
    productCode: {
      fontSize: 12,
      color: '#666',
      marginTop: 2,
    },
    productReturn: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#188038',
    },
    positiveReturn: {
      color: '#188038',
    },
    negativeReturn: {
      color: '#d93025',
    },
    productDescription: {
      fontSize: 12,
      color: '#666',
      lineHeight: 16,
    },
    productReturnLabel: {
      fontSize: 12,
      color: '#666',
      marginTop: 4,
    },
    // 搜索相关样式
    searchContainer: {
      marginBottom: 16,
    },
    // 搜索框和右侧按钮的容器
    searchBoxContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
    },
    // 搜索框右侧的按钮容器
    searchRightButtons: {
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: 8,
    },
    searchBox: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#fafafa',
      borderRadius: 24,
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    searchIcon: {
      fontSize: 16,
      color: '#666',
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      color: '#333',
      paddingVertical: 8,
    },
    clearIcon: {
      fontSize: 16,
      color: '#666',
      padding: 4,
    },
    // 客服和信息按钮样式
    serviceButton: {
      marginLeft: 8,
      padding: 8,
    },
    serviceIcon: {
      fontSize: 18,
    },
    infoButton: {
      marginLeft: 8,
      padding: 8,
    },
    infoIcon: {
      fontSize: 18,
    },
    // 通知标记样式
    notificationContainer: {
      position: 'relative',
    },
    notificationBadge: {
      position: 'absolute',
      top: -4,
      right: -4,
      backgroundColor: '#d93025',
      borderRadius: 10,
      minWidth: 18,
      height: 18,
      justifyContent: 'center',
      alignItems: 'center',
    },
    notificationText: {
      color: '#fff',
      fontSize: 10,
      fontWeight: 'bold',
      textAlign: 'center',
      paddingHorizontal: 3,
    },
    searchResultsContainer: {
      backgroundColor: '#fff',
      borderRadius: 8,
      padding: 8,
      marginTop: 8,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 5,
    },
    searchResultItem: {
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#f0f0f0',
    },
    searchResultTitle: {
      fontSize: 14,
      fontWeight: '500',
      color: '#333',
      marginBottom: 4,
    },
    searchResultType: {
      fontSize: 12,
      color: '#666',
    },
    // 功能按钮相关样式
    functionButtonsContainer: {
      backgroundColor: '#f0f2f5',
      paddingHorizontal: 12,
      paddingBottom: 12,
    },
    functionButtonsSection: {
      backgroundColor: '#fff',
      borderRadius: 12,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 5,
    },
    buttonRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    buttonRowLast: {
      marginBottom: 0,
    },
    functionButton: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#fff',
      borderRadius: 10,
      paddingVertical: 16,
      paddingHorizontal: 8,
      marginHorizontal: 4,
      borderWidth: 1,
      borderColor: '#e0e0e0',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    functionButtonIcon: {
      fontSize: 24,
      marginBottom: 8,
    },
    functionButtonText: {
      fontSize: 12,
      color: '#333',
      textAlign: 'center',
    },
    // 产品卡片相关样式
    productActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 12,
    },
    subscribeButton: {
      backgroundColor: '#188038',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
    },
    subscribeButtonText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '600',
    },
  })
  
  return (
      <View style={styles.container}>
        {/* 搜索框独立板块 - 固定在顶部 */}
        <View style={[styles.searchContainer, { backgroundColor: '#f0f2f5', paddingHorizontal: 12, paddingVertical: 12 }]}>
          <View style={styles.searchBoxContainer}>
            {/* 搜索框 */}
            <View style={styles.searchBox}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder={lang === 'zh' ? '搜索资管产品、内参、快讯、常用功能等' : 'Search products, articles, news, etc.'}
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onFocus={() => setShowSearchResults(true)}
                onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Text style={styles.clearIcon}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
            
            {/* 搜索框右侧的客服和消息按钮 */}
            <View style={styles.searchRightButtons}>
              {/* 客服按钮 - 耳机图标 */}
              <TouchableOpacity style={styles.serviceButton} onPress={() => {
                console.log('客服按钮被点击，跳转到客服页面');
                onNavigateTo && onNavigateTo('customer-service');
              }}>
                <Text style={styles.serviceIcon}>🎧</Text>
              </TouchableOpacity>
              {/* 信息按钮 - 消息图标带通知标记 */}
              <TouchableOpacity style={styles.infoButton} onPress={() => {
                console.log('消息按钮被点击，跳转到消息中心页面');
                onNavigateTo && onNavigateTo('message-center');
              }}>
                <View style={styles.notificationContainer}>
                  <Text style={styles.infoIcon}>📨</Text>
                  {/* 只有当有未读消息时才显示通知徽章 */}
                  {unreadMessages > 0 && (
                    <View style={styles.notificationBadge}>
                      <Text style={styles.notificationText}>{unreadMessages}</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 搜索结果 */}
        {showSearchResults && searchResults.length > 0 && (
          <View style={styles.searchResultsContainer}>
            {searchResults.map((result, index) => (
              <TouchableOpacity key={index} style={styles.searchResultItem}>
                <Text style={styles.searchResultTitle}>{result.title || result.name}</Text>
                <Text style={styles.searchResultType}>
                  {result.type === 'product' ? (lang === 'zh' ? '资管产品' : 'Product') :
                   result.type === 'insider' ? (lang === 'zh' ? '内参' : 'Insider') :
                   result.type === 'news' ? (lang === 'zh' ? '快讯' : 'News') :
                   lang === 'zh' ? '其他' : 'Other'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* 可滚动内容区 */}
        <ScrollView style={styles.contentScrollView} showsVerticalScrollIndicator={false}>
          {/* 常用功能按钮区域 */}
          <View style={styles.functionButtonsContainer}>
            <View style={styles.functionButtonsSection}>
              {/* 第一行按钮 */}
              <View style={styles.buttonRow}>
                <Pressable style={styles.functionButton} onPress={() => {
                  console.log('申购申请 - 跳转到申购申请页面');
                  // 实际实现：直接跳转到申购申请页面
                  // 这里需要实现跳转逻辑，假设通过props传入
                  onNavigateToSubscriptionApplication && onNavigateToSubscriptionApplication();
                }}>
                  <Text style={styles.functionButtonIcon}>📥</Text>
                  <Text style={styles.functionButtonText}>申购申请</Text>
                </Pressable>
                <Pressable style={styles.functionButton} onPress={() => {
                  console.log('赎回申请 - 跳转到赎回申请页面');
                  // 实际实现：直接跳转到赎回申请页面
                  onNavigateToRedemptionApplication && onNavigateToRedemptionApplication();
                }}>
                  <Text style={styles.functionButtonIcon}>📤</Text>
                  <Text style={styles.functionButtonText}>赎回申请</Text>
                </Pressable>
                <Pressable style={styles.functionButton} onPress={() => {
                  console.log('入金咨询 - 跳转客服模块');
                  // 实际实现：跳转客服模块，使用入金咨询类型
                  onNavigateTo && onNavigateTo('deposit-consultation');
                }}>
                  <Text style={styles.functionButtonIcon}>💰</Text>
                  <Text style={styles.functionButtonText}>入金咨询</Text>
                </Pressable>
                <Pressable style={styles.functionButton} onPress={() => {
                  console.log('出金申请 - 跳转出金申请页面');
                  // 实际实现：跳转出金申请页面
                  onNavigateTo && onNavigateTo('withdrawal-application');
                }}>
                  <Text style={styles.functionButtonIcon}>🏦</Text>
                  <Text style={styles.functionButtonText}>出金申请</Text>
                </Pressable>
              </View>
              {/* 第二行按钮 */}
              <View style={[styles.buttonRow, styles.buttonRowLast]}>
                <Pressable style={styles.functionButton} onPress={() => {
                  console.log('资产状况 - 跳转到资产状况页面');
                  // 实际实现：跳转到资产状况页面，展示总资产、基金市值、现金余额、在途资金
                  onNavigateTo && onNavigateTo('assetStatus');
                }}>
                  <Text style={styles.functionButtonIcon}>📊</Text>
                  <Text style={styles.functionButtonText}>资产状况</Text>
                </Pressable>
                <Pressable style={styles.functionButton} onPress={() => {
                  console.log('持仓状况 - 跳转到持仓状况页面');
                  // 实际实现：跳转到持仓状况页面，展示持有基金列表及相关数据
                  onNavigateTo && onNavigateTo('holdings');
                }}>
                  <Text style={styles.functionButtonIcon}>📈</Text>
                  <Text style={styles.functionButtonText}>持仓状况</Text>
                </Pressable>
                <Pressable style={styles.functionButton} onPress={() => {
                  console.log('资金往来 - 跳转到资金往来页面');
                  // 实际实现：跳转到资金往来页面，包含申购、赎回、出金申请记录
                  onNavigateTo && onNavigateTo('fundTransactions');
                }}>
                  <Text style={styles.functionButtonIcon}>💰</Text>
                  <Text style={styles.functionButtonText}>资金往来</Text>
                </Pressable>
                <Pressable style={styles.functionButton} onPress={() => {
                  console.log('交易记录 - 跳转到交易记录页面');
              // 实际实现：跳转到交易记录页面，包含申购和赎回记录
              onNavigateTo && onNavigateTo('subscriptionRedemptionRecords');
            }}>
              <Text style={styles.functionButtonIcon}>📋</Text>
              <Text style={styles.functionButtonText}>交易记录</Text>
                </Pressable>
              </View>
            </View>
          </View>

          {/* 证券市场行情独立板块 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{lang === 'zh' ? '证券市场行情' : 'Market Overview'}</Text>
            
            {/* 分类Tab栏 */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScrollView}>
              {marketCategories.map(category => (
                <Pressable
                  key={category.id}
                  style={[
                    styles.tabItem,
                    selectedCategory === category.id && styles.tabItemSelected
                  ]}
                  onPress={() => setSelectedCategory(category.id)}
                >
                  <Text
                    style={[
                      styles.tabText,
                      selectedCategory === category.id && styles.tabTextSelected
                    ]}
                  >
                    {category.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            
            {/* 选中分类的指数列表 */}
            {selectedCategory && (
              <View style={styles.selectedIndicesContainer}>
                {marketCategories
                  .find(category => category.id === selectedCategory)
                  ?.indices.map(index => (
                    <View key={index.id} style={styles.indexRow}>
                      <View style={styles.indexInfo}>
                        <Text style={styles.indexName}>{index.name}</Text>
                        <Text style={styles.indexCode}>{index.code}</Text>
                      </View>
                      <View style={styles.indexValueContainer}>
                        <Text style={styles.indexValue}>{index.value.toFixed(2)}</Text>
                        <View style={styles.changeContainer}>
                          <Text 
                            style={[
                              styles.indexChange, 
                              index.changePercent >= 0 ? styles.changeNegative : styles.changePositive
                            ]}
                          >
                            {index.changePercent >= 0 ? '+' : ''}{index.changePercent.toFixed(2)}%
                          </Text>
                          <Text 
                            style={[
                              styles.indexChangeValue, 
                              index.changePercent >= 0 ? styles.changeNegative : styles.changePositive
                            ]}
                          >
                            {index.changePercent >= 0 ? '+' : ''}{index.change.toFixed(2)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
              </View>
            )}
          </View>
          
          {/* 第一栏：客户持仓状况汇总 */}
          <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.portfolio}</Text>
          <View style={styles.portfolioCard}>
            <View style={styles.portfolioItem}>
              <Text style={styles.portfolioLabel}>{t.totalAssets}</Text>
              <Text style={styles.portfolioValue}>${format(totalAssets)}</Text>
            </View>
            <View style={styles.portfolioItem}>
              <Text style={styles.portfolioLabel}>{t.ibCash}</Text>
              <Text style={styles.portfolioValue}>${format(ibCash)}</Text>
            </View>
            <View style={styles.portfolioItem}>
              <Text style={styles.portfolioLabel}>{t.fundHolding}</Text>
              <Text style={styles.portfolioValue}>${format(fundHolding)}</Text>
            </View>
            <View style={styles.portfolioItem}>
              <Text style={styles.portfolioLabel}>{t.recentIncome}</Text>
              <Text style={[styles.portfolioValue, recentIncome >= 0 ? styles.negativeIncome : styles.positiveIncome]}>
                {recentIncome >= 0 ? '+' : ''}${format(Math.abs(recentIncome))}
              </Text>
            </View>
            <View style={styles.portfolioItem}>
              <Text style={styles.portfolioLabel}>{t.holdingIncome}</Text>
              <Text style={[styles.portfolioValue, holdingIncome >= 0 ? styles.negativeIncome : styles.positiveIncome]}>
                {holdingIncome >= 0 ? '+' : ''}${format(Math.abs(holdingIncome))} ({holdingIncome >= 0 ? '+' : ''}{((holdingIncome / (totalAssets - holdingIncome)) * 100).toFixed(2)}%)
              </Text>
            </View>
          </View>
          {navSeries.length > 0 && (
            <View style={styles.chartContainer}>
              <NavChart data={navSeries} />
            </View>
          )}
        </View>
        
        {/* 第二栏：内参快递 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.insiderExpress}</Text>
          <View style={styles.insiderList}>
            {insiderArticles.map((article) => (
              <Pressable key={article.id} style={styles.insiderItem} onPress={() => handleInsiderArticlePress(article)}>
                <View style={styles.insiderHeader}>
                  <Text style={styles.insiderTitle}>{article.title}</Text>
                  <Text style={styles.insiderDate}>{article.date}</Text>
                </View>
                <Text style={styles.insiderSummary} numberOfLines={2}>{article.summary}</Text>
                <Text style={styles.viewDetails}>{t.viewDetails} →</Text>
              </Pressable>
            ))}
          </View>
        </View>
        
        {/* 第三栏：基金产品推介 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{lang === 'zh' ? '基金产品推介' : 'Fund Product Recommendation'}</Text>
          <View style={styles.productList}>
            {fundProducts.map((product) => (
              <Pressable 
                key={product.id} 
                style={styles.productCard}
                onPress={() => onProductPress && onProductPress(product)}
              >
                <View style={styles.productHeader}>
                  <View>
                    <Text style={styles.productName}>{product.name}</Text>
                    <Text style={styles.productCode}>{product.code}</Text>
                  </View>
                  <Text style={[styles.productReturn, product.returnRate > 0 ? styles.positiveReturn : styles.negativeReturn]}>
                    {product.returnRate > 0 ? '+' : ''}{product.returnRate}%
                  </Text>
                </View>
                <Text style={styles.productDescription}>{product.description}</Text>
                <View style={styles.productActions}>
                  <Text style={styles.productReturnLabel}>{t.yearReturn}</Text>
                  {/* 申购申请按钮 */}
                  <TouchableOpacity 
                    style={styles.subscribeButton}
                    onPress={() => onNavigateToSubscriptionApplication && onNavigateToSubscriptionApplication(product)}
                  >
                    <Text style={styles.subscribeButtonText}>{lang === 'zh' ? '申购申请' : 'Subscribe'}</Text>
                  </TouchableOpacity>
                </View>
              </Pressable>
            ))}
          </View>
        </View>
        
        {/* 底部留白 */}
        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  )
}


