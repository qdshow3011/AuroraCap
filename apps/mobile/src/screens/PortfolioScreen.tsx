import { useEffect, useState, useRef } from 'react'
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, TouchableOpacity, Image, Platform, StatusBar, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import NavChart from '../components/NavChart'
import { supabase } from '../lib/supabase'
import { getMarketCategories } from '../api/market'

function format(n: number) {
  return Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)
}

// 移除HTML标签的函数
function removeHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()
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
  cover_image?: string
  category_id?: string
}

// 内参分类类型定义
interface InsiderCategory {
  id: string
  name: string
}

// 基金产品类型定义
interface FundProduct {
  id: string
  name: string
  code: string
  returnRate: number
  description: string
}

export default function PortfolioScreen({ lang = 'zh', observerHoldings, demo, userInfo, onInsiderArticlePress, onProductPress, onNavigateTo, onNavigateToSubscriptionApplication, onNavigateToRedemptionApplication, unreadMessages = 0, appVersion = 'standard' }: { lang?: 'zh' | 'en'; observerHoldings?: any[]; demo?: boolean; userInfo?: any; onInsiderArticlePress?: (article: any) => void; onProductPress?: (product?: any) => void; onNavigateTo?: (screen: string) => void; onNavigateToSubscriptionApplication?: (product?: any) => void; onNavigateToRedemptionApplication?: () => void; unreadMessages?: number; appVersion?: 'standard' | 'simple' | 'premium' }) {
  // 获取安全区域信息
  const insets = useSafeAreaInsets()
  
  // 检测平台类型
  const isWeb = Platform.OS === 'web'
  
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
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string>('')
  const refreshInterval = useRef<NodeJS.Timeout | null>(null)
  
  // 内参文章
  const [insiderArticles, setInsiderArticles] = useState<InsiderArticle[]>([])
  
  // 内参分类
  const [insiderCategories, setInsiderCategories] = useState<InsiderCategory[]>([
    {
      id: '1',
      name: '测试分类1'
    },
    {
      id: '2',
      name: '测试分类2'
    },
    {
      id: '3',
      name: '测试分类3'
    }
  ])
  
  // 基金产品
  const [fundProducts, setFundProducts] = useState<FundProduct[]>([])
  
  // 搜索功能
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showSearchResults, setShowSearchResults] = useState(false)

  // 根据版本调整样式
  const getVersionStyles = () => {
    switch (appVersion) {
      case 'simple':
        return {
          fontSize: { base: 18, large: 22, small: 16 },
          fontWeight: { regular: '400', medium: '500', bold: '700' },
          padding: { base: 20, small: 16 },
          borderRadius: 12,
          showSimplified: true
        }
      case 'premium':
        return {
          fontSize: { base: 16, large: 20, small: 14 },
          fontWeight: { regular: '400', medium: '600', bold: '800' },
          padding: { base: 20, small: 16 },
          borderRadius: 16,
          showPremium: true
        }
      default: // standard
        return {
          fontSize: { base: 15, large: 18, small: 13 },
          fontWeight: { regular: '400', medium: '500', bold: '700' },
          padding: { base: 16, small: 12 },
          borderRadius: 8,
          showAll: true
        }
    }
  }

  const versionStyles = getVersionStyles()

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

  // 刷新市场数据的函数
  const refreshMarketData = async () => {
    console.log('=== 开始刷新市场数据 ===');
    setIsLoading(true);
    
    try {
      // 使用新的API获取市场数据
      const categories = await getMarketCategories(lang);
      console.log('获取市场数据结果:', categories);
      
      if (categories && categories.length > 0) {
        setMarketCategories(categories);
        setSelectedCategory(categories[0]?.id || '');
        // 更新最后刷新时间
        const now = new Date();
        setLastUpdated(lang === 'zh' 
          ? `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
          : now.toLocaleTimeString());
      }
    } catch (error) {
      console.error('刷新市场数据失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    ;(async () => {
      console.log('=== 开始执行主useEffect ===');
      console.log('Demo模式:', demo);
      console.log('ObserverHoldings:', observerHoldings);
      console.log('UserInfo:', userInfo);
      console.log('Lang:', lang);
      
      // 初始化基础数据
      setTotalAssets(0)
      setFundHolding(0)
      setHoldingIncome(0)
      setRecentIncome(0)
      setNavSeries([])
      setMarketCategories([])
      setSelectedCategory('')
      
      console.log('Supabase实例:', !!supabase);
      
      // 从Supabase获取内参、产品数据
      if (supabase) {
        console.log('=== 开始获取内参分类数据 ===');
        
        // 1. 获取内参分类
        try {
          console.log('执行Supabase查询获取内参分类...');
          const { data: categoriesData, error: categoriesError } = await supabase
            .from('internal_reference_categories')
            .select('id, name')
          
          console.log('获取内参分类结果:', { categoriesData, categoriesError });
          
          if (!categoriesError && categoriesData && categoriesData.length > 0) {
            console.log('设置内参分类:', categoriesData);
            setInsiderCategories(categoriesData)
          } else {
            console.error('获取内参分类失败，保持默认分类数据:', categoriesError);
            // 保持默认分类数据，不设置为空数组
          }
        } catch (error) {
          console.error('获取内参分类异常，保持默认分类数据:', error);
          // 保持默认分类数据，不设置为空数组
        }
        
        console.log('=== 内参分类数据获取完成 ===');
        
        console.log('开始获取内参文章...');
        
        // 2. 获取内参文章
        try {
          const { data: articlesData, error: articlesError } = await supabase
            .from('internal_references')
            .select('id, title, content, published_at, created_at, cover_image, category_id')
            .eq('status', 'published')
            .order('created_at', { ascending: false })
            .limit(3)
          
          console.log('获取内参文章结果:', { articlesData, articlesError });
          
          if (!articlesError && articlesData) {
            const formattedArticles = articlesData.map((article: any) => ({
              id: article.id,
              title: article.title,
              date: lang === 'zh' ? (article.published_at || article.created_at).split('T')[0] : new Date(article.published_at || article.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              summary: removeHtmlTags(article.content).substring(0, 100) + '...',
              cover_image: article.cover_image,
              category_id: article.category_id
            }))
            console.log('设置内参文章:', formattedArticles);
            setInsiderArticles(formattedArticles)
          } else {
            console.error('获取内参文章失败:', articlesError);
            setInsiderArticles([])
          }
        } catch (error) {
          console.error('获取内参文章异常:', error);
          setInsiderArticles([])
        }
        
        console.log('开始获取基金产品...');
        
        // 3. 获取基金产品
        try {
          const { data: productsData, error: productsError } = await supabase
            .from('products')
            .select(`
              id, product_number, name_cn, name_en, description, type, risk_level, status
            `)
            .order('created_at', { ascending: false })
            .limit(3)
          
          if (!productsError && productsData && Array.isArray(productsData)) {
            const formattedProducts = productsData.map((product: any) => ({
              ...product,
              name: lang === 'zh' ? product.name_cn : product.name_en || product.name_cn,
              code: product.product_number || (lang === 'zh' ? product.name_cn : product.name_en || product.name_cn),
              returnRate: 0,
              description: product.description || ''
            }))
            setFundProducts(formattedProducts)
          } else {
            console.error('获取基金产品失败:', productsError);
            setFundProducts([])
          }
        } catch (error) {
          console.error('获取基金产品异常:', error);
          setFundProducts([])
        }
      } else {
        console.error('Supabase instance not available')
        // 只设置空数据，不重置已有的数据
      }
      
      // 刷新市场数据
      await refreshMarketData();
      
      // 设置定时刷新（30秒一次）
      refreshInterval.current = setInterval(refreshMarketData, 30000);
      
      // 获取持仓数据（如果有observerHoldings或userInfo）
      if ((observerHoldings && observerHoldings.length > 0) || (userInfo && userInfo.id)) {
        try {
          if (observerHoldings && observerHoldings.length > 0) {
            // 使用特约观察员持仓数据
            const total = observerHoldings.reduce((sum, holding) => sum + (holding.current_value || 0), 0)
            setTotalAssets(total)
            
            const totalCost = observerHoldings.reduce((sum, holding) => sum + (holding.avg_cost * holding.shares || 0), 0)
            const income = total - totalCost
            setHoldingIncome(income)
            
            const fundAssets = observerHoldings.reduce((sum, holding) => sum + (holding.current_value || 0), 0)
            setFundHolding(fundAssets)
            setIbCash(0)
            setRecentIncome(0)
          } else if (userInfo && userInfo.id) {
            // 获取登录用户的持仓数据
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
            
            if (!positionsError && positionsData && positionsData.length > 0) {
              const total = positionsData.reduce((sum, position) => sum + (position.current_value || 0), 0)
              setTotalAssets(total)
              
              const totalCost = positionsData.reduce((sum, position) => sum + (position.avg_cost * position.shares || 0), 0)
              const income = total - totalCost
              setHoldingIncome(income)
              
              const fundAssets = positionsData.reduce((sum, position) => sum + (position.current_value || 0), 0)
              setFundHolding(fundAssets)
              setIbCash(0)
              
              // 计算今日收益
              let dailyIncome = 0
              for (const position of positionsData) {
                if (position.fund_id && position.shares && position.latest_nav) {
                  const { data: navHistory } = await supabase
                    .from('fund_nav_history')
                    .select('nav, timestamp')
                    .eq('product_id', position.fund_id)
                    .order('timestamp', { ascending: false })
                    .limit(2)
                  
                  if (navHistory && navHistory.length >= 2) {
                    const yesterdayNav = navHistory[1].nav
                    const todayNav = position.latest_nav
                    const positionDailyIncome = (todayNav - yesterdayNav) * position.shares
                    dailyIncome += positionDailyIncome
                  }
                }
              }
              setRecentIncome(dailyIncome)
            } else {
              console.log('用户暂无持仓数据')
              setTotalAssets(0)
              setFundHolding(0)
              setHoldingIncome(0)
              setRecentIncome(0)
            }
          }
        } catch (error) {
          console.error('Error fetching holdings data:', error)
          // 持仓数据获取失败不影响其他数据
        }
      }
    })()
    
    // 清理函数
    return () => {
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
        refreshInterval.current = null;
      }
    };
  }, [lang, userInfo, observerHoldings, demo])

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

  // 根据分类ID获取分类名称
  const getCategoryName = (categoryId?: string): string => {
    if (!categoryId) return lang === 'zh' ? '其他' : 'Other'
    
    const category = insiderCategories.find(cat => cat.id === categoryId)
    if (category) {
      return category.name
    }
    
    return lang === 'zh' ? '其他' : 'Other'
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
      paddingTop: 0,
    },
    // 渐变背景样式
    gradientBackground: {
      position: 'absolute',
      top: -100, // 向上延伸以覆盖状态栏
      left: 0,
      right: 0,
      height: 400, // 增加高度以确保覆盖状态栏
      zIndex: -1, // 确保在底层
    },
    // 弧形底部样式
    curvedBottom: {
      position: 'absolute',
      bottom: -50,
      left: 0,
      right: 0,
      height: 100,
      backgroundColor: '#f0f2f5',
      borderTopLeftRadius: 100,
      borderTopRightRadius: 100,
    },
    contentScrollView: {
      flex: 1,
      zIndex: 1,
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
      color: '#333',
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    refreshControl: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    lastUpdatedText: {
      fontSize: 12,
      color: '#666',
      marginRight: 8,
    },
    refreshButton: {
      padding: 4,
    },
    loadingContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    loadingText: {
      fontSize: 14,
      color: '#666',
      marginLeft: 8,
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
    categoryTag: {
      backgroundColor: '#e3f2fd',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
    },
    categoryTagText: {
      fontSize: 11,
      color: '#1976d2',
      fontWeight: '500',
    },
    viewDetails: {
      fontSize: 12,
      color: '#1a73e8',
      fontWeight: '500',
    },
    insiderImage: {
      width: '100%',
      height: 160,
      borderRadius: 8,
      marginBottom: 12,
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
    // 左侧菜单按钮
    menuButton: {
      marginRight: 8,
      padding: 6,
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
    // 版本切换按钮样式
    versionButton: {
      marginLeft: 8,
      padding: 8,
    },
    versionIcon: {
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
      padding: 20,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.08,
      shadowRadius: 3,
      elevation: 2,
    },
    buttonRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: 20,
    },
    buttonRowLast: {
      marginBottom: 0,
    },
    functionButton: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#fff',
      borderRadius: 12,
      paddingVertical: 18,
      paddingHorizontal: 8,
      marginHorizontal: 8,
      borderWidth: 0,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    functionButtonIcon: {
      fontSize: 28,
      marginBottom: 6,
    },
    functionButtonText: {
      fontSize: 13,
      color: '#333',
      textAlign: 'center',
      fontWeight: '500',
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
      {/* 沉浸式状态栏 */}
      <StatusBar style="light" translucent={true} backgroundColor="transparent" />
      
      {/* 渐变背景 - 完全覆盖状态栏 */}
      <LinearGradient
        colors={['#1A4EA2', '#2E6CD1']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{
          position: 'absolute',
          top: -200, // 向上延伸更多距离，确保完全覆盖状态栏区域
          left: 0,
          right: 0,
          height: 450, // 增加高度，确保完全覆盖状态栏和顶部区域
          zIndex: 0,
        }}
      />
      
      {/* 弧形底部覆盖 */}
      <View style={{
        position: 'absolute',
        top: 250,
        left: 0,
        right: 0,
        height: 100,
        backgroundColor: '#f0f2f5',
        borderTopLeftRadius: 100,
        borderTopRightRadius: 100,
        zIndex: 0,
      }} />
      
      {/* 固定搜索框区块 */}
      <View style={{ paddingHorizontal: 12, paddingVertical: 16, paddingTop: isWeb ? 20 : 40 + insets.top, zIndex: 2, position: 'relative' }}>
        <View style={styles.searchBoxContainer}>
          {/* 左侧三横杠图标 */}
          <TouchableOpacity style={styles.menuButton} onPress={() => {
            console.log('菜单按钮被点击');
          }}>
            <Ionicons name="menu-outline" size={20} color="#fff" />
          </TouchableOpacity>
          
          {/* 搜索框 */}
          <View style={[styles.searchBox, { backgroundColor: 'rgba(255, 255, 255, 0.9)', paddingVertical: 6, paddingHorizontal: 12 }]}>
            <Ionicons name="search-outline" size={14} color="#666" style={[styles.searchIcon, { marginRight: 6 }]} />
            <TextInput
              style={[styles.searchInput, { fontSize: 12 }]}
              placeholder={lang === 'zh' ? '输入文字进行搜索' : 'Enter the text to search'}
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => setShowSearchResults(true)}
              onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-outline" size={14} color="#666" style={styles.clearIcon} />
              </TouchableOpacity>
            )}
          </View>
          
          {/* 搜索框右侧的客服和消息按钮 */}
          <View style={[styles.searchRightButtons, { marginLeft: 6 }]}>
            {/* 消息中心图标 */}
            <TouchableOpacity style={[styles.serviceButton, { marginLeft: 6, padding: 6 }]} onPress={() => {
              console.log('消息中心按钮被点击，跳转到消息中心页面');
              onNavigateTo && onNavigateTo('message-center');
            }}>
              <View style={styles.notificationContainer}>
                <Ionicons name="notifications-outline" size={20} color="#fff" />
                {/* 只有当有未读消息时才显示通知徽章 */}
                {unreadMessages > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationText}>{unreadMessages}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
            {/* 在线客服图标 */}
            <TouchableOpacity style={[styles.serviceButton, { marginLeft: 6, padding: 6 }]} onPress={() => {
              console.log('客服按钮被点击，跳转到客服页面');
              onNavigateTo && onNavigateTo('customer-service');
            }}>
              <Ionicons name="chatbubble-outline" size={20} color="#fff" />
            </TouchableOpacity>
            {/* 版本切换图标 */}
            <TouchableOpacity style={[styles.serviceButton, { marginLeft: 6, padding: 6 }]} onPress={() => {
              console.log('版本切换按钮被点击，跳转到版本切换页面');
              onNavigateTo && onNavigateTo('version-switch');
            }}>
              <Ionicons name="settings-outline" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
      
      {/* 主内容 - 包含可滚动内容 */}
      <View style={{ flex: 1, zIndex: 1 }}>
      {/* 可滚动内容区 */}
      <ScrollView style={[styles.contentScrollView, { marginTop: 0 }]} showsVerticalScrollIndicator={false}>

      {/* 搜索结果 */}
      {showSearchResults && searchResults.length > 0 && (
        <View style={[styles.searchResultsContainer, { backgroundColor: 'rgba(255, 255, 255, 0.95)', marginHorizontal: 12, marginBottom: 16 }]}>
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

        {/* 常用功能按钮区域 */}
        <View style={{ backgroundColor: 'transparent', paddingHorizontal: 0, paddingBottom: 12 }}>
          <View style={[styles.functionButtonsSection, { backgroundColor: 'rgba(255, 255, 255, 0.15)' }]}>
            {/* 功能按钮行 */}
            <View style={[styles.buttonRow, { marginHorizontal: 0 }]}>
              <Pressable style={[styles.functionButton, { backgroundColor: 'rgba(255, 255, 255, 0.2)', marginHorizontal: 4 }]} onPress={() => {
                console.log('资产状况 - 跳转到资产状况页面');
                // 实际实现：跳转到资产状况页面，展示总资产、基金市值、现金余额、在途资金
                onNavigateTo && onNavigateTo('assetStatus');
              }}>
                <Text style={styles.functionButtonIcon}>🔄</Text>
                <Text style={[styles.functionButtonText, { color: '#fff' }]}>资产状况</Text>
              </Pressable>
              <Pressable style={[styles.functionButton, { backgroundColor: 'rgba(255, 255, 255, 0.2)', marginHorizontal: 4 }]} onPress={() => {
                console.log('持仓状况 - 跳转到持仓状况页面');
                // 实际实现：跳转到持仓状况页面，展示持有基金列表及相关数据
                onNavigateTo && onNavigateTo('holdings');
              }}>
                <Text style={styles.functionButtonIcon}>📊</Text>
                <Text style={[styles.functionButtonText, { color: '#fff' }]}>持仓状况</Text>
              </Pressable>
              <Pressable style={[styles.functionButton, { backgroundColor: 'rgba(255, 255, 255, 0.2)', marginHorizontal: 4 }]} onPress={() => {
                console.log('资金往来 - 跳转到资金往来页面');
                // 实际实现：跳转到资金往来页面，包含申购、赎回、出金申请记录
                onNavigateTo && onNavigateTo('fundTransactions');
              }}>
                <Text style={styles.functionButtonIcon}>↔️</Text>
                <Text style={[styles.functionButtonText, { color: '#fff' }]}>资金往来</Text>
              </Pressable>
              <Pressable style={[styles.functionButton, { backgroundColor: 'rgba(255, 255, 255, 0.2)', marginHorizontal: 4 }]} onPress={() => {
                console.log('交易记录 - 跳转到交易记录页面');
                // 实际实现：跳转到交易记录页面，包含申购和赎回记录
                onNavigateTo && onNavigateTo('subscriptionRedemptionRecords');
              }}>
                <Text style={styles.functionButtonIcon}>📋</Text>
                <Text style={[styles.functionButtonText, { color: '#fff' }]}>交易记录</Text>
              </Pressable>
            </View>
          </View>
        </View>

          {/* 证券市场行情独立板块 */}
          <View style={[styles.section, { backgroundColor: 'rgba(255, 255, 255, 0.95)' }]}>
            {/* 标题和刷新控件 */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{lang === 'zh' ? '证券市场行情' : 'Market Overview'}</Text>
              <View style={styles.refreshControl}>
                {lastUpdated && (
                  <Text style={styles.lastUpdatedText}>
                    {lang === 'zh' ? '最后更新: ' : 'Last updated: '}{lastUpdated}
                  </Text>
                )}
                <TouchableOpacity onPress={refreshMarketData} style={styles.refreshButton}>
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#1a73e8" />
                  ) : (
                    <Ionicons name="refresh-outline" size={20} color="#1a73e8" />
                  )}
                </TouchableOpacity>
              </View>
            </View>
            
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
                {isLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#1a73e8" />
                    <Text style={styles.loadingText}>{lang === 'zh' ? '加载中...' : 'Loading...'}</Text>
                  </View>
                ) : (
                  marketCategories
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
                    ))
                )}
              </View>
            )}
          </View>
          
          {/* 第一栏：客户持仓状况汇总 */}
          <View style={[styles.section, { backgroundColor: 'rgba(255, 255, 255, 0.95)' }]}>
          <Text style={[styles.sectionTitle, { fontSize: versionStyles.fontSize.large }]}>{t.portfolio}</Text>
          <View style={[styles.portfolioCard, {
            padding: versionStyles.padding.base,
            borderRadius: versionStyles.borderRadius,
            backgroundColor: appVersion === 'premium' ? 'rgba(240, 244, 255, 0.95)' : 'rgba(248, 249, 250, 0.95)',
            ...(appVersion === 'premium' ? {
              shadowColor: '#4a90e2',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
              elevation: 8
            } : {})
          }]}>
            <View style={styles.portfolioItem}>
              <Text style={[styles.portfolioLabel, { fontSize: versionStyles.fontSize.base }]}>{t.totalAssets}</Text>
              <Text style={[styles.portfolioValue, { fontSize: versionStyles.fontSize.large, fontWeight: versionStyles.fontWeight.bold }]}>${format(totalAssets)}</Text>
            </View>
            <View style={styles.portfolioItem}>
              <Text style={[styles.portfolioLabel, { fontSize: versionStyles.fontSize.base }]}>{t.fundHolding}</Text>
              <Text style={[styles.portfolioValue, { fontSize: versionStyles.fontSize.large, fontWeight: versionStyles.fontWeight.bold }]}>${format(fundHolding)}</Text>
            </View>
            {appVersion !== 'simple' && (
              <View style={styles.portfolioItem}>
                <Text style={[styles.portfolioLabel, { fontSize: versionStyles.fontSize.base }]}>{t.ibCash}</Text>
                <Text style={[styles.portfolioValue, { fontSize: versionStyles.fontSize.large, fontWeight: versionStyles.fontWeight.bold }]}>${format(ibCash)}</Text>
              </View>
            )}
            <View style={styles.portfolioItem}>
              <Text style={[styles.portfolioLabel, { fontSize: versionStyles.fontSize.base }]}>{t.recentIncome}</Text>
              <Text style={[
                styles.portfolioValue, 
                { fontSize: versionStyles.fontSize.large, fontWeight: versionStyles.fontWeight.bold },
                recentIncome >= 0 ? styles.negativeIncome : styles.positiveIncome
              ]}>
                {recentIncome >= 0 ? '+' : ''}${format(Math.abs(recentIncome))}
              </Text>
            </View>
            {appVersion !== 'simple' && (
              <View style={styles.portfolioItem}>
                <Text style={[styles.portfolioLabel, { fontSize: versionStyles.fontSize.base }]}>{t.holdingIncome}</Text>
                <Text style={[
                  styles.portfolioValue, 
                  { fontSize: versionStyles.fontSize.large, fontWeight: versionStyles.fontWeight.bold },
                  holdingIncome >= 0 ? styles.negativeIncome : styles.positiveIncome
                ]}>
                  {holdingIncome >= 0 ? '+' : ''}${format(Math.abs(holdingIncome))} ({holdingIncome >= 0 ? '+' : ''}{((holdingIncome / (totalAssets - holdingIncome)) * 100).toFixed(2)}%)
                </Text>
              </View>
            )}
          </View>
          {navSeries.length > 0 && appVersion !== 'simple' && (
            <View style={styles.chartContainer}>
              <NavChart data={navSeries} />
            </View>
          )}
        </View>
        
        {/* 第二栏：内参快递 */}
        {appVersion !== 'simple' && (
          <View style={[styles.section, { backgroundColor: 'rgba(255, 255, 255, 0.95)' }]}>
            <Text style={[styles.sectionTitle, { fontSize: versionStyles.fontSize.large }]}>{t.insiderExpress}</Text>
            

            
            <View style={[styles.insiderList, {
              padding: versionStyles.padding.small,
              borderRadius: versionStyles.borderRadius
            }]}>
              {insiderArticles
                .map((article) => (
                <Pressable key={article.id} style={styles.insiderItem} onPress={() => handleInsiderArticlePress(article)}>
                  {/* 封面图片 */}
                  <Image 
                    source={{ uri: article.cover_image || 'https://picsum.photos/600/300' }} 
                    style={styles.insiderImage} 
                    resizeMode="cover"
                  />
                  
                  <View style={styles.insiderHeader}>
                    <Text style={[styles.insiderTitle, { fontSize: versionStyles.fontSize.base, fontWeight: versionStyles.fontWeight.medium, marginBottom: 8 }]} numberOfLines={2}>{removeHtmlTags(article.title)}</Text>
                  </View>
                  <Text style={[styles.insiderSummary, { fontSize: versionStyles.fontSize.small, lineHeight: 18 }]} numberOfLines={3}>{article.summary}</Text>
                  <Text style={[styles.viewDetails, { fontSize: versionStyles.fontSize.small }]}>{t.viewDetails} →</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}
        
        {/* 第三栏：基金产品推介 */}
        {appVersion !== 'simple' && (
          <View style={[styles.section, { backgroundColor: 'rgba(255, 255, 255, 0.95)' }]}>
            <Text style={[styles.sectionTitle, { fontSize: versionStyles.fontSize.large }]}>{lang === 'zh' ? '基金产品推介' : 'Fund Product Recommendation'}</Text>
            <View style={[styles.productList, {
              padding: versionStyles.padding.small,
              borderRadius: versionStyles.borderRadius
            }]}>
              {fundProducts.map((product) => (
                <Pressable 
                  key={product.id} 
                  style={[styles.productCard, {
                    borderRadius: versionStyles.borderRadius,
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    ...(appVersion === 'premium' ? {
                      borderWidth: 1,
                      borderColor: '#4a90e2',
                      shadowColor: '#4a90e2',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.1,
                      shadowRadius: 6,
                      elevation: 6
                    } : {})
                  }]} 
                  onPress={() => onProductPress && onProductPress(product)}
                >
                  <View style={styles.productHeader}>
                    <View>
                      <Text style={[styles.productName, { fontSize: versionStyles.fontSize.base, fontWeight: versionStyles.fontWeight.medium }]}>{product.name}</Text>
                      <Text style={[styles.productCode, { fontSize: versionStyles.fontSize.small }]}>{product.code}</Text>
                    </View>
                    <Text style={[styles.productReturn, { fontSize: versionStyles.fontSize.base, fontWeight: versionStyles.fontWeight.bold }, product.returnRate > 0 ? styles.positiveReturn : styles.negativeReturn]}>
                      {product.returnRate > 0 ? '+' : ''}{product.returnRate}%
                    </Text>
                  </View>
                  <Text style={[styles.productDescription, { fontSize: versionStyles.fontSize.small }]}>{product.description}</Text>
                  <View style={styles.productActions}>
                    <Text style={[styles.productReturnLabel, { fontSize: versionStyles.fontSize.small }]}>{t.yearReturn}</Text>
                    {/* 申购申请按钮 */}
                    <TouchableOpacity 
                      style={[styles.subscribeButton, {
                        ...(appVersion === 'premium' ? {
                          backgroundColor: '#4a90e2',
                          shadowColor: '#4a90e2',
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.3,
                          shadowRadius: 4,
                          elevation: 5
                        } : {})
                      }]} 
                      onPress={() => onNavigateToSubscriptionApplication && onNavigateToSubscriptionApplication(product)}
                    >
                      <Text style={styles.subscribeButtonText}>{lang === 'zh' ? '申购申请' : 'Subscribe'}</Text>
                    </TouchableOpacity>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        )}
        
        {/* 尊享版专属服务入口 */}
        {appVersion === 'premium' && (
          <View style={[styles.section, { backgroundColor: 'rgba(255, 255, 255, 0.95)' }]}>
            <Text style={[styles.sectionTitle, { fontSize: versionStyles.fontSize.large }]}>{lang === 'zh' ? '尊享专属服务' : 'Premium Exclusive Services'}</Text>
            <View style={[styles.premiumServices, {
              padding: versionStyles.padding.base,
              borderRadius: versionStyles.borderRadius,
              backgroundColor: 'rgba(240, 244, 255, 0.95)',
              borderWidth: 1,
              borderColor: '#4a90e2',
              shadowColor: '#4a90e2',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
              elevation: 8
            }]}>
              <View style={styles.premiumServiceItem}>
                <Text style={styles.premiumServiceIcon}>💎</Text>
                <View style={styles.premiumServiceContent}>
                  <Text style={[styles.premiumServiceTitle, { fontSize: versionStyles.fontSize.base, fontWeight: versionStyles.fontWeight.bold }]}>{lang === 'zh' ? '专属投资顾问' : 'Exclusive Investment Advisor'}</Text>
                  <Text style={[styles.premiumServiceDescription, { fontSize: versionStyles.fontSize.small }]}>{lang === 'zh' ? '一对一专业投资建议' : 'One-on-one professional investment advice'}</Text>
                </View>
                <Text style={styles.premiumServiceArrow}>→</Text>
              </View>
              <View style={styles.premiumServiceDivider} />
              <View style={styles.premiumServiceItem}>
                <Text style={styles.premiumServiceIcon}>🏆</Text>
                <View style={styles.premiumServiceContent}>
                  <Text style={[styles.premiumServiceTitle, { fontSize: versionStyles.fontSize.base, fontWeight: versionStyles.fontWeight.bold }]}>{lang === 'zh' ? '高端产品优先购' : 'Priority Access to Premium Products'}</Text>
                  <Text style={[styles.premiumServiceDescription, { fontSize: versionStyles.fontSize.small }]}>{lang === 'zh' ? '尊享高端产品优先购买权' : 'Exclusive priority access to premium products'}</Text>
                </View>
                <Text style={styles.premiumServiceArrow}>→</Text>
              </View>
              <View style={styles.premiumServiceDivider} />
              <View style={styles.premiumServiceItem}>
                <Text style={styles.premiumServiceIcon}>📊</Text>
                <View style={styles.premiumServiceContent}>
                  <Text style={[styles.premiumServiceTitle, { fontSize: versionStyles.fontSize.base, fontWeight: versionStyles.fontWeight.bold }]}>{lang === 'zh' ? '定制化投资报告' : 'Customized Investment Reports'}</Text>
                  <Text style={[styles.premiumServiceDescription, { fontSize: versionStyles.fontSize.small }]}>{lang === 'zh' ? '个性化投资分析报告' : 'Personalized investment analysis reports'}</Text>
                </View>
                <Text style={styles.premiumServiceArrow}>→</Text>
              </View>
            </View>
          </View>
        )}
        
        {/* 底部留白 */}
        <View style={{ height: 80 }} />
        </ScrollView>
      </View>
    </View>
  )
}


