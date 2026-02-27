import { useEffect, useState, useRef } from 'react'
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, TouchableOpacity, Image, Platform, ActivityIndicator, Modal, Dimensions } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BlurView } from 'expo-blur'
import NavChart from '../components/NavChart'
import { supabase } from '../lib/supabase'
import { getMarketCategories } from '../api/market'

// 主题色配置
const THEME = {
  primary: '#1A4EA2',
  primaryLight: '#2E6CD1',
  primaryDark: '#0F3A7A',
  secondary: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  background: '#F5F7FA',
  cardBg: '#FFFFFF',
  textPrimary: '#1A1A2E',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  border: '#E5E7EB',
  success: '#10B981',
  danger: '#EF4444',
  // 圆角规范
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999
  },
  // 阴影规范
  shadow: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
      elevation: 8
    }
  }
}

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

  // 菜单显示状态
  const [showMenu, setShowMenu] = useState(false)

  // 屏幕宽度
  const screenWidth = Dimensions.get('window').width
  const menuWidth = screenWidth * 0.7

  // 菜单项配置 - 链接到我的模块中的对应页面
  const menuItems = [
    { key: 'versionSwitch', icon: 'layers-outline', labelZh: '版本切换', labelEn: 'Version Switch', screen: 'version-switch' },
    { key: 'userInfo', icon: 'person-outline', labelZh: '用户信息', labelEn: 'User Info', screen: 'account-info' },
    { key: 'languageSwitch', icon: 'language-outline', labelZh: '语言切换', labelEn: 'Language', screen: 'interface-settings' },
    { key: 'helpCenter', icon: 'help-circle-outline', labelZh: '帮助中心', labelEn: 'Help Center', screen: 'help' },
    { key: 'aboutUs', icon: 'information-circle-outline', labelZh: '关于我们', labelEn: 'About Us', screen: 'about' },
    { key: 'feedback', icon: 'chatbubble-outline', labelZh: '意见反馈', labelEn: 'Feedback', screen: 'feedback' },
  ]

  // 菜单项点击处理
  const handleMenuItemPress = (screen: string) => {
    setShowMenu(false)
    onNavigateTo && onNavigateTo(screen)
  }

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
          borderRadius: 12,
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
      backgroundColor: THEME.background,
      paddingTop: 0,
    },
    // 渐变背景样式 - 延伸到状态栏上方
    gradientBackground: {
      position: 'absolute',
      top: -200,
      left: 0,
      right: 0,
      height: 520,
      zIndex: 0,
    },
    // 弧形底部样式
    curvedBottom: {
      position: 'absolute',
      top: 320,
      left: 0,
      right: 0,
      height: 100,
      backgroundColor: THEME.background,
      borderTopLeftRadius: 30,
      borderTopRightRadius: 30,
      zIndex: 0,
    },
    contentScrollView: {
      flex: 1,
      zIndex: 1,
    },
    section: {
      backgroundColor: THEME.cardBg,
      borderRadius: THEME.radius.lg,
      padding: 20,
      marginHorizontal: 16,
      marginVertical: 8,
      ...THEME.shadow.md,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: THEME.textPrimary,
      marginBottom: 4,
    },
    sectionSubtitle: {
      fontSize: 13,
      color: THEME.textMuted,
      marginBottom: 16,
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
      color: THEME.textMuted,
      marginRight: 8,
    },
    refreshButton: {
      padding: 6,
      backgroundColor: 'rgba(26, 78, 162, 0.1)',
      borderRadius: THEME.radius.md,
    },
    loadingContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    loadingText: {
      fontSize: 14,
      color: THEME.textSecondary,
      marginLeft: 8,
    },
    tabScrollView: {
      marginBottom: 16,
    },
    tabItem: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: THEME.radius.full,
      marginRight: 10,
      backgroundColor: '#F3F4F6',
    },
    tabItemSelected: {
      backgroundColor: THEME.primary,
      ...THEME.shadow.sm,
    },
    tabText: {
      fontSize: 14,
      color: THEME.textSecondary,
      fontWeight: '500',
    },
    tabTextSelected: {
      color: '#fff',
      fontWeight: '600',
    },
    selectedIndicesContainer: {
      backgroundColor: '#F9FAFB',
      borderRadius: THEME.radius.md,
      padding: 16,
    },
    indexRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#F3F4F6',
    },
    indexRowLast: {
      borderBottomWidth: 0,
    },
    indexInfo: {
      flex: 1,
    },
    indexName: {
      fontSize: 15,
      fontWeight: '600',
      color: THEME.textPrimary,
    },
    indexCode: {
      fontSize: 12,
      color: THEME.textMuted,
      marginTop: 2,
    },
    indexValueContainer: {
      alignItems: 'flex-end',
    },
    indexValue: {
      fontSize: 16,
      fontWeight: '700',
      color: THEME.textPrimary,
    },
    changeContainer: {
      flexDirection: 'row',
      marginTop: 4,
      gap: 8,
    },
    indexChange: {
      fontSize: 13,
      fontWeight: '600',
    },
    indexChangeValue: {
      fontSize: 13,
      fontWeight: '600',
    },
    changePositive: {
      color: THEME.danger,
    },
    changeNegative: {
      color: THEME.success,
    },
    portfolioCard: {
      backgroundColor: '#F9FAFB',
      borderRadius: THEME.radius.md,
      padding: 20,
    },
    portfolioItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    portfolioItemLast: {
      marginBottom: 0,
    },
    portfolioLabel: {
      fontSize: 14,
      color: THEME.textSecondary,
      fontWeight: '500',
    },
    portfolioValue: {
      fontSize: 18,
      fontWeight: '700',
      color: THEME.textPrimary,
    },
    positiveIncome: {
      color: THEME.danger,
    },
    negativeIncome: {
      color: THEME.success,
    },
    chartContainer: {
      height: 200,
      marginTop: 16,
    },
    insiderList: {
      gap: 16,
    },
    insiderItem: {
      backgroundColor: '#F9FAFB',
      borderRadius: THEME.radius.md,
      overflow: 'hidden',
      ...THEME.shadow.sm,
    },
    insiderImage: {
      width: '100%',
      height: 140,
    },
    insiderContent: {
      padding: 16,
    },
    insiderHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    insiderTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: THEME.textPrimary,
      flex: 1,
      marginRight: 8,
      lineHeight: 22,
    },
    insiderDate: {
      fontSize: 12,
      color: THEME.textMuted,
    },
    insiderSummary: {
      fontSize: 13,
      color: THEME.textSecondary,
      lineHeight: 20,
      marginBottom: 12,
    },
    categoryTag: {
      backgroundColor: 'rgba(26, 78, 162, 0.1)',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: THEME.radius.sm,
      alignSelf: 'flex-start',
    },
    categoryTagText: {
      fontSize: 11,
      color: THEME.primary,
      fontWeight: '600',
    },
    viewDetails: {
      fontSize: 13,
      color: THEME.primary,
      fontWeight: '600',
      marginTop: 12,
    },
    productList: {
      gap: 16,
    },
    productCard: {
      backgroundColor: THEME.cardBg,
      borderRadius: THEME.radius.lg,
      padding: 20,
      ...THEME.shadow.md,
      borderWidth: 1,
      borderColor: '#F3F4F6',
    },
    productHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    productName: {
      fontSize: 16,
      fontWeight: '700',
      color: THEME.textPrimary,
      marginBottom: 4,
    },
    productCode: {
      fontSize: 13,
      color: THEME.textMuted,
    },
    productReturn: {
      fontSize: 20,
      fontWeight: '800',
    },
    positiveReturn: {
      color: THEME.success,
    },
    negativeReturn: {
      color: THEME.danger,
    },
    productDescription: {
      fontSize: 13,
      color: THEME.textSecondary,
      lineHeight: 20,
      marginBottom: 16,
    },
    productActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: '#F3F4F6',
    },
    productReturnLabel: {
      fontSize: 12,
      color: THEME.textMuted,
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
      paddingHorizontal: 16,
    },
    // 左侧菜单按钮
    menuButton: {
      width: 40,
      height: 40,
      borderRadius: THEME.radius.md,
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
      ...THEME.shadow.sm,
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
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderRadius: THEME.radius.xl,
      paddingHorizontal: 16,
      paddingVertical: 10,
      ...THEME.shadow.md,
    },
    searchIcon: {
      fontSize: 16,
      color: THEME.textMuted,
      marginRight: 10,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      color: THEME.textPrimary,
      paddingVertical: 4,
    },
    clearIcon: {
      fontSize: 16,
      color: THEME.textMuted,
      padding: 4,
    },
    // 客服和信息按钮样式
    iconButton: {
      width: 40,
      height: 40,
      borderRadius: THEME.radius.md,
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 8,
      ...THEME.shadow.sm,
    },
    // 通知标记样式
    notificationContainer: {
      position: 'relative',
    },
    notificationBadge: {
      position: 'absolute',
      top: -6,
      right: -6,
      backgroundColor: THEME.error,
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: THEME.primary,
      ...THEME.shadow.sm,
    },
    notificationText: {
      color: '#fff',
      fontSize: 10,
      fontWeight: 'bold',
      textAlign: 'center',
      paddingHorizontal: 4,
    },
    searchResultsContainer: {
      backgroundColor: THEME.cardBg,
      borderRadius: THEME.radius.lg,
      padding: 12,
      marginTop: 12,
      marginHorizontal: 16,
      ...THEME.shadow.lg,
    },
    searchResultItem: {
      padding: 14,
      borderBottomWidth: 1,
      borderBottomColor: '#F3F4F6',
    },
    searchResultTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: THEME.textPrimary,
      marginBottom: 4,
    },
    searchResultType: {
      fontSize: 12,
      color: THEME.textMuted,
    },
    // 功能按钮相关样式
    functionButtonsContainer: {
      paddingHorizontal: 16,
      paddingBottom: 16,
    },
    functionButtonsSection: {
      backgroundColor: 'rgba(255, 255, 255, 0.12)',
      borderRadius: THEME.radius.lg,
      padding: 20,
      ...THEME.shadow.md,
    },
    buttonRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
    },
    functionButton: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: THEME.radius.md,
      paddingVertical: 16,
      paddingHorizontal: 8,
      ...THEME.shadow.sm,
    },
    functionButtonIcon: {
      width: 44,
      height: 44,
      borderRadius: THEME.radius.md,
      backgroundColor: 'rgba(255, 255, 255, 0.25)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
    },
    functionButtonIconText: {
      fontSize: 22,
    },
    functionButtonText: {
      fontSize: 13,
      color: '#fff',
      textAlign: 'center',
      fontWeight: '600',
    },
    // 产品卡片相关样式
    subscribeButton: {
      backgroundColor: THEME.primary,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: THEME.radius.md,
      ...THEME.shadow.sm,
    },
    subscribeButtonText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '700',
    },
    // 菜单相关样式
    menuOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      flexDirection: 'row',
    },
    menuContainer: {
      backgroundColor: THEME.cardBg,
      height: '100%',
      ...THEME.shadow.lg,
    },
    menuHeader: {
      backgroundColor: THEME.primary,
      paddingTop: isWeb ? 20 : 48 + insets.top,
      paddingHorizontal: 24,
      paddingBottom: 24,
    },
    menuHeaderText: {
      fontSize: 24,
      fontWeight: '800',
      color: '#fff',
    },
    menuHeaderSubtext: {
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.7)',
      marginTop: 4,
    },
    menuContent: {
      flex: 1,
      paddingTop: 8,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#F3F4F6',
    },
    menuItemIcon: {
      width: 40,
      height: 40,
      borderRadius: THEME.radius.md,
      backgroundColor: 'rgba(26, 78, 162, 0.1)',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    menuItemText: {
      fontSize: 16,
      color: THEME.textPrimary,
      fontWeight: '500',
    },
    menuCloseArea: {
      flex: 1,
    },
    // 尊享版专属服务样式
    premiumServices: {
      backgroundColor: 'rgba(26, 78, 162, 0.05)',
      borderRadius: THEME.radius.lg,
      padding: 20,
      borderWidth: 1,
      borderColor: 'rgba(26, 78, 162, 0.1)',
    },
    premiumServiceItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
    },
    premiumServiceIcon: {
      fontSize: 28,
      marginRight: 16,
    },
    premiumServiceContent: {
      flex: 1,
    },
    premiumServiceTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: THEME.textPrimary,
      marginBottom: 2,
    },
    premiumServiceDescription: {
      fontSize: 13,
      color: THEME.textSecondary,
    },
    premiumServiceArrow: {
      fontSize: 20,
      color: THEME.primary,
      fontWeight: '600',
    },
    premiumServiceDivider: {
      height: 1,
      backgroundColor: 'rgba(26, 78, 162, 0.1)',
    },
  })
  
  return (
    <View style={styles.container}>
      {/* 沉浸式状态栏 */}
      <StatusBar style="light" />

      {/* 配置菜单 Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showMenu}
        onRequestClose={() => setShowMenu(false)}
      >
        <View style={styles.menuOverlay}>
          <View style={[styles.menuContainer, { width: menuWidth }]}>
            {/* 菜单头部 */}
            <LinearGradient
              colors={[THEME.primary, THEME.primaryLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.menuHeader}
            >
              <Text style={styles.menuHeaderText}>
                {lang === 'zh' ? '配置' : 'Settings'}
              </Text>
              <Text style={styles.menuHeaderSubtext}>
                {userInfo?.nickname || (lang === 'zh' ? '欢迎回来' : 'Welcome Back')}
              </Text>
            </LinearGradient>
            {/* 菜单内容 */}
            <View style={styles.menuContent}>
              {menuItems.map((item, index) => (
                <TouchableOpacity
                  key={item.key}
                  style={[
                    styles.menuItem,
                    index === menuItems.length - 1 && { borderBottomWidth: 0 }
                  ]}
                  onPress={() => handleMenuItemPress(item.screen)}
                >
                  <View style={styles.menuItemIcon}>
                    <Ionicons
                      name={item.icon as any}
                      size={22}
                      color={THEME.primary}
                    />
                  </View>
                  <Text style={styles.menuItemText}>
                    {lang === 'zh' ? item.labelZh : item.labelEn}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          {/* 点击关闭区域 */}
          <TouchableOpacity
            style={styles.menuCloseArea}
            onPress={() => setShowMenu(false)}
          />
        </View>
      </Modal>
      
      {/* 渐变背景 - 完全覆盖状态栏 */}
      <LinearGradient
        colors={[THEME.primary, THEME.primaryLight]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradientBackground}
      />
      
      {/* 弧形底部覆盖 */}
      <View style={styles.curvedBottom} />
      
      {/* 固定搜索框区块 */}
      <View style={{ paddingTop: isWeb ? 20 : 48 + insets.top, zIndex: 2, position: 'relative' }}>
        <View style={styles.searchBoxContainer}>
          {/* 左侧菜单按钮 */}
          <TouchableOpacity style={styles.menuButton} onPress={() => setShowMenu(true)}>
            <Ionicons name="menu-outline" size={22} color="#fff" />
          </TouchableOpacity>
          
          {/* 搜索框 */}
          <BlurView intensity={20} tint="light" style={{ flex: 1, borderRadius: THEME.radius.xl, overflow: 'hidden' }}>
            <View style={styles.searchBox}>
              <Ionicons name="search-outline" size={18} color={THEME.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder={lang === 'zh' ? '搜索产品、内参、资讯...' : 'Search products, insights...'}
                placeholderTextColor={THEME.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onFocus={() => setShowSearchResults(true)}
                onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color={THEME.textMuted} />
                </TouchableOpacity>
              )}
            </View>
          </BlurView>
          
          {/* 搜索框右侧按钮 */}
          <View style={styles.searchRightButtons}>
            {/* 消息中心 */}
            <TouchableOpacity style={styles.iconButton} onPress={() => onNavigateTo && onNavigateTo('message-center')}>
              <View style={styles.notificationContainer}>
                <Ionicons name="notifications-outline" size={20} color="#fff" />
                {unreadMessages > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationText}>{unreadMessages > 99 ? '99+' : unreadMessages}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
            {/* 在线客服 */}
            <TouchableOpacity style={styles.iconButton} onPress={() => onNavigateTo && onNavigateTo('customer-service')}>
              <Ionicons name="chatbubble-ellipses-outline" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
      
      {/* 主内容 - 包含可滚动内容 */}
      <View style={{ flex: 1, zIndex: 1 }}>
        {/* 可滚动内容区 */}
        <ScrollView style={styles.contentScrollView} showsVerticalScrollIndicator={false}>

          {/* 搜索结果 */}
          {showSearchResults && searchResults.length > 0 && (
            <View style={styles.searchResultsContainer}>
              {searchResults.map((result, index) => (
                <TouchableOpacity key={index} style={[
                  styles.searchResultItem,
                  index === searchResults.length - 1 && { borderBottomWidth: 0 }
                ]}>
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
          <View style={styles.functionButtonsContainer}>
            <View style={styles.functionButtonsSection}>
              <View style={styles.buttonRow}>
                <Pressable style={styles.functionButton} onPress={() => onNavigateTo && onNavigateTo('assetStatus')}>
                  <View style={styles.functionButtonIcon}>
                    <Ionicons name="wallet-outline" size={24} color="#fff" />
                  </View>
                  <Text style={styles.functionButtonText}>资产状况</Text>
                </Pressable>
                <Pressable style={styles.functionButton} onPress={() => onNavigateTo && onNavigateTo('holdings')}>
                  <View style={styles.functionButtonIcon}>
                    <Ionicons name="pie-chart-outline" size={24} color="#fff" />
                  </View>
                  <Text style={styles.functionButtonText}>持仓状况</Text>
                </Pressable>
                <Pressable style={styles.functionButton} onPress={() => onNavigateTo && onNavigateTo('fundTransactions')}>
                  <View style={styles.functionButtonIcon}>
                    <Ionicons name="swap-vertical-outline" size={24} color="#fff" />
                  </View>
                  <Text style={styles.functionButtonText}>资金往来</Text>
                </Pressable>
                <Pressable style={styles.functionButton} onPress={() => onNavigateTo && onNavigateTo('subscriptionRedemptionRecords')}>
                  <View style={styles.functionButtonIcon}>
                    <Ionicons name="document-text-outline" size={24} color="#fff" />
                  </View>
                  <Text style={styles.functionButtonText}>交易记录</Text>
                </Pressable>
              </View>
            </View>
          </View>

          {/* 证券市场行情独立板块 */}
          <View style={styles.section}>
            {/* 标题和刷新控件 */}
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>{lang === 'zh' ? '证券市场行情' : 'Market Overview'}</Text>
                <Text style={styles.sectionSubtitle}>{lang === 'zh' ? '实时追踪全球主要指数' : 'Track global indices in real-time'}</Text>
              </View>
              <View style={styles.refreshControl}>
                {lastUpdated && (
                  <Text style={styles.lastUpdatedText}>
                    {lastUpdated}
                  </Text>
                )}
                <TouchableOpacity onPress={refreshMarketData} style={styles.refreshButton}>
                  {isLoading ? (
                    <ActivityIndicator size="small" color={THEME.primary} />
                  ) : (
                    <Ionicons name="refresh" size={18} color={THEME.primary} />
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
                    <ActivityIndicator size="small" color={THEME.primary} />
                    <Text style={styles.loadingText}>{lang === 'zh' ? '加载中...' : 'Loading...'}</Text>
                  </View>
                ) : (
                  marketCategories
                    .find(category => category.id === selectedCategory)
                    ?.indices.map((index, idx, arr) => (
                      <View key={index.id} style={[styles.indexRow, idx === arr.length - 1 && styles.indexRowLast]}>
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
                                index.changePercent >= 0 ? styles.changePositive : styles.changeNegative
                              ]}
                            >
                              {index.changePercent >= 0 ? '+' : ''}{index.changePercent.toFixed(2)}%
                            </Text>
                            <Text 
                              style={[
                                styles.indexChangeValue, 
                                index.changePercent >= 0 ? styles.changePositive : styles.changeNegative
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
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>{t.portfolio}</Text>
                <Text style={styles.sectionSubtitle}>{lang === 'zh' ? '实时查看您的资产状况' : 'View your assets in real-time'}</Text>
              </View>
            </View>
            <View style={[styles.portfolioCard, {
              backgroundColor: appVersion === 'premium' ? 'rgba(26, 78, 162, 0.05)' : '#F9FAFB',
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
                  recentIncome >= 0 ? styles.positiveIncome : styles.negativeIncome
                ]}>
                  {recentIncome >= 0 ? '+' : ''}${format(Math.abs(recentIncome))}
                </Text>
              </View>
              {appVersion !== 'simple' && (
                <View style={[styles.portfolioItem, styles.portfolioItemLast]}>
                  <Text style={[styles.portfolioLabel, { fontSize: versionStyles.fontSize.base }]}>{t.holdingIncome}</Text>
                  <Text style={[
                    styles.portfolioValue, 
                    { fontSize: versionStyles.fontSize.large, fontWeight: versionStyles.fontWeight.bold },
                    holdingIncome >= 0 ? styles.positiveIncome : styles.negativeIncome
                  ]}>
                    {holdingIncome >= 0 ? '+' : ''}${format(Math.abs(holdingIncome))}
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
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionTitle}>{t.insiderExpress}</Text>
                  <Text style={styles.sectionSubtitle}>{lang === 'zh' ? '专业投资内参，把握市场脉搏' : 'Professional investment insights'}</Text>
                </View>
              </View>
              
              <View style={styles.insiderList}>
                {insiderArticles.map((article, index) => (
                  <Pressable 
                    key={article.id} 
                    style={[styles.insiderItem, index === insiderArticles.length - 1 && { marginBottom: 0 }]}
                    onPress={() => handleInsiderArticlePress(article)}
                  >
                    {/* 封面图片 */}
                    <Image 
                      source={{ uri: article.cover_image || 'https://picsum.photos/600/300' }} 
                      style={styles.insiderImage} 
                      resizeMode="cover"
                    />
                    
                    <View style={styles.insiderContent}>
                      <View style={styles.insiderHeader}>
                        <Text style={[styles.insiderTitle, { fontSize: versionStyles.fontSize.base }]} numberOfLines={2}>
                          {removeHtmlTags(article.title)}
                        </Text>
                      </View>
                      <Text style={[styles.insiderSummary, { fontSize: versionStyles.fontSize.small }]} numberOfLines={2}>
                        {article.summary}
                      </Text>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View style={styles.categoryTag}>
                          <Text style={styles.categoryTagText}>{getCategoryName(article.category_id)}</Text>
                        </View>
                        <Text style={styles.insiderDate}>{article.date}</Text>
                      </View>
                      <Text style={styles.viewDetails}>{t.viewDetails} →</Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
          
          {/* 第三栏：基金产品推介 */}
          {appVersion !== 'simple' && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionTitle}>{lang === 'zh' ? '基金产品推介' : 'Fund Product Recommendation'}</Text>
                  <Text style={styles.sectionSubtitle}>{lang === 'zh' ? '精选优质基金，助力财富增值' : 'Curated funds for wealth growth'}</Text>
                </View>
              </View>
              <View style={styles.productList}>
                {fundProducts.map((product, index) => (
                  <Pressable 
                    key={product.id} 
                    style={[styles.productCard, index === fundProducts.length - 1 && { marginBottom: 0 }]}
                    onPress={() => onProductPress && onProductPress(product)}
                  >
                    <View style={styles.productHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.productName, { fontSize: versionStyles.fontSize.base }]}>{product.name}</Text>
                        <Text style={[styles.productCode, { fontSize: versionStyles.fontSize.small }]}>{product.code}</Text>
                      </View>
                      <Text style={[
                        styles.productReturn, 
                        product.returnRate > 0 ? styles.positiveReturn : styles.negativeReturn
                      ]}>
                        {product.returnRate > 0 ? '+' : ''}{product.returnRate}%
                      </Text>
                    </View>
                    <Text style={[styles.productDescription, { fontSize: versionStyles.fontSize.small }]} numberOfLines={2}>
                      {product.description}
                    </Text>
                    <View style={styles.productActions}>
                      <Text style={styles.productReturnLabel}>{t.yearReturn}</Text>
                      <TouchableOpacity 
                        style={styles.subscribeButton}
                        onPress={() => onNavigateToSubscriptionApplication && onNavigateToSubscriptionApplication(product)}
                      >
                        <Text style={styles.subscribeButtonText}>{lang === 'zh' ? '申购' : 'Subscribe'}</Text>
                      </TouchableOpacity>
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
          
          {/* 尊享版专属服务入口 */}
          {appVersion === 'premium' && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionTitle}>{lang === 'zh' ? '尊享专属服务' : 'Premium Exclusive Services'}</Text>
                  <Text style={styles.sectionSubtitle}>{lang === 'zh' ? '一对一专属投资顾问服务' : 'One-on-one exclusive advisor service'}</Text>
                </View>
              </View>
              <View style={styles.premiumServices}>
                <View style={styles.premiumServiceItem}>
                  <Text style={styles.premiumServiceIcon}>💎</Text>
                  <View style={styles.premiumServiceContent}>
                    <Text style={styles.premiumServiceTitle}>{lang === 'zh' ? '专属投资顾问' : 'Exclusive Investment Advisor'}</Text>
                    <Text style={styles.premiumServiceDescription}>{lang === 'zh' ? '一对一专业投资建议' : 'One-on-one professional investment advice'}</Text>
                  </View>
                  <Text style={styles.premiumServiceArrow}>→</Text>
                </View>
                <View style={styles.premiumServiceDivider} />
                <View style={styles.premiumServiceItem}>
                  <Text style={styles.premiumServiceIcon}>🏆</Text>
                  <View style={styles.premiumServiceContent}>
                    <Text style={styles.premiumServiceTitle}>{lang === 'zh' ? '高端产品优先购' : 'Priority Access to Premium Products'}</Text>
                    <Text style={styles.premiumServiceDescription}>{lang === 'zh' ? '尊享高端产品优先购买权' : 'Exclusive priority access to premium products'}</Text>
                  </View>
                  <Text style={styles.premiumServiceArrow}>→</Text>
                </View>
                <View style={styles.premiumServiceDivider} />
                <View style={styles.premiumServiceItem}>
                  <Text style={styles.premiumServiceIcon}>📊</Text>
                  <View style={styles.premiumServiceContent}>
                    <Text style={styles.premiumServiceTitle}>{lang === 'zh' ? '定制化投资报告' : 'Customized Investment Reports'}</Text>
                    <Text style={styles.premiumServiceDescription}>{lang === 'zh' ? '个性化投资分析报告' : 'Personalized investment analysis reports'}</Text>
                  </View>
                  <Text style={styles.premiumServiceArrow}>→</Text>
                </View>
              </View>
            </View>
          )}
          
          {/* 底部留白 */}
          <View style={{ height: 100 }} />
        </ScrollView>
      </View>
    </View>
  )
}
