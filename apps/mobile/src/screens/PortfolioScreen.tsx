import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, TouchableOpacity, Image, Dimensions, Platform, StatusBar } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import NavChart from '../components/NavChart'
import { supabase } from '../lib/supabase'

function format(n: number) {
  return n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

// 定义搜索结果类型
interface SearchResult {
  id?: string
  title?: string
  name?: string
  type: 'product' | 'insider' | 'news' | 'other'
}

// 市场指数类型定义
interface MarketIndex {
  code: string
  name: string
  value: string
  change: number
  changeValue: number
}

// 市场分类类型定义
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
  ])
  
  // 产品数据
  const [products, setProducts] = useState<FundProduct[]>([
    {
      id: '1',
      name: '精选股票基金',
      code: 'A12345',
      returnRate: 8.5,
      description: '投资于优质成长股的混合型基金，追求长期资本增值。'
    },
    {
      id: '2',
      name: '稳健债券基金',
      code: 'B67890',
      returnRate: 4.2,
      description: '主要投资于高评级债券，追求稳定收益。'
    },
  ])
  
  // 搜索相关状态
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])

  useEffect(() => {
    // 模拟数据获取
    if (demo) {
      // 模拟持仓数据
      setTotalAssets(1000000)
      setIbCash(500000)
      setFundHolding(500000)
      setHoldingIncome(50000)
      setRecentIncome(10000)
      setNavSeries([100, 105, 102, 108, 110, 105, 115, 120, 118, 125, 130, 135])
    }
  }, [demo])

  useEffect(() => {
    // 模拟获取市场分类和指数数据
    const fetchMarketData = async () => {
      try {
        // 模拟市场分类数据
        const categories: MarketCategory[] = [
          {
            id: 'hk',
            name: '港股',
            indices: [
              { code: 'HSI', name: '恒生指数', value: '18,234.28', change: -188.95, changeValue: -1.03 },
              { code: 'HSCEI', name: '国企指数', value: '6,087.22', change: -77.95, changeValue: -1.26 },
            ]
          },
          {
            id: 'us',
            name: '美股',
            indices: [
              { code: 'DJI', name: '道琼斯', value: '39,412.03', change: 128.41, changeValue: 0.33 },
              { code: 'SPX', name: '标普500', value: '5,218.21', change: 17.25, changeValue: 0.33 },
              { code: 'IXIC', name: '纳斯达克', value: '16,322.76', change: 81.50, changeValue: 0.50 },
            ]
          },
          {
            id: 'cn',
            name: 'A股',
            indices: [
              { code: '000001.SH', name: '上证指数', value: '3,088.37', change: -18.74, changeValue: -0.60 },
              { code: '399001.SZ', name: '深证成指', value: '9,489.66', change: -102.48, changeValue: -1.07 },
              { code: '399006.SZ', name: '创业板指', value: '1,766.21', change: -26.07, changeValue: -1.46 },
            ]
          },
        ]
        
        setMarketCategories(categories)
        // 默认选择第一个分类
        if (categories.length > 0) {
          setSelectedCategory(categories[0].id)
        }
      } catch (error) {
        console.error('获取市场数据失败:', error)
      }
    }
    
    fetchMarketData()
  }, [])

  useEffect(() => {
    // 模拟获取内参文章数据
    const fetchInsiderArticles = async () => {
      try {
        // 模拟内参文章数据
        const articles: InsiderArticle[] = [
          {
            id: '1',
            title: '2024年二季度投资策略报告',
            date: '2024-04-15',
            summary: '展望二季度市场走势，重点关注科技、消费和医药三大板块的投资机会。',
            cover_image: 'https://neeko-copilot.bytedance.net/api/text2image?prompt=investment%20strategy%20report%202024%20quarter%202&size=1024x1024'
          },
          {
            id: '2',
            title: '全球央行货币政策分析',
            date: '2024-04-10',
            summary: '分析美联储、欧央行等主要央行的货币政策走向及其对资产价格的影响。',
          },
          {
            id: '3',
            title: '新能源行业投资机会',
            date: '2024-04-05',
            summary: '探讨光伏、风电、储能等新能源细分领域的投资机会和风险。',
          },
        ]
        
        setInsiderArticles(articles)
      } catch (error) {
        console.error('获取内参文章失败:', error)
      }
    }
    
    fetchInsiderArticles()
  }, [])

  // 处理搜索
  useEffect(() => {
    if (searchQuery.length > 0) {
      // 模拟搜索结果
      const results: SearchResult[] = [
        {
          id: '1',
          title: '精选股票基金',
          type: 'product'
        },
        {
          id: '2',
          title: '2024年二季度投资策略报告',
          type: 'insider'
        },
        {
          id: '3',
          title: '全球央行货币政策分析',
          type: 'insider'
        },
      ].filter(item => 
        (item.title || item.name || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
      setSearchResults(results)
    } else {
      setSearchResults([])
    }
  }, [searchQuery])

  // 版本特定样式
  const versionStyles = {
    fontSize: {
      small: 12,
      base: 14,
      large: 16,
    },
    padding: {
      small: 8,
      base: 16,
      large: 24,
    },
    borderRadius: 8,
    fontWeight: {
      normal: '400' as const,
      medium: '500' as const,
      bold: '700' as const,
    },
  }

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
      marginHorizontal: 12,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.08,
      shadowRadius: 3,
      elevation: 2,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: '#333',
      marginBottom: 16,
    },
    // 搜索相关样式
    searchBoxContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    searchBox: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#f0f2f5',
      borderRadius: 8,
      paddingHorizontal: 12,
      marginRight: 12,
    },
    searchIcon: {
      marginRight: 8,
      color: '#666',
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
      backgroundColor: '#2E6CD1',
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
      color: '#fff',
    },
    functionButtonText: {
      fontSize: 13,
      color: '#fff',
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
          top: isWeb ? 0 : -insets.top,
          left: 0,
          right: 0,
          height: isWeb ? 300 : 300 + insets.top,
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
      
      {/* 主内容 - 包含搜索框和可滚动内容 */}
      <View style={{ flex: 1, zIndex: 1 }}>
        {/* 搜索框独立板块 - 固定在顶部 */}
        <View style={{ paddingHorizontal: 12, paddingVertical: 16, paddingTop: isWeb ? 20 : 20 + insets.top }}>
          <View style={styles.searchBoxContainer}>
            {/* 搜索框 */}
            <View style={[styles.searchBox, { backgroundColor: 'rgba(255, 255, 255, 0.9)' }]}>
              <Ionicons name="search-outline" size={18} color="#666" style={styles.searchIcon} />
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
                  <Ionicons name="close-outline" size={18} color="#666" style={styles.clearIcon} />
                </TouchableOpacity>
              )}
            </View>
            
            {/* 搜索框右侧的客服和消息按钮 */}
            <View style={styles.searchRightButtons}>
              {/* 消息中心图标 */}
              <TouchableOpacity style={styles.serviceButton} onPress={() => {
                console.log('消息中心按钮被点击，跳转到消息中心页面');
                onNavigateTo && onNavigateTo('message-center');
              }}>
                <View style={styles.notificationContainer}>
                  <Ionicons name="notifications-outline" size={24} color="#fff" />
                  {/* 只有当有未读消息时才显示通知徽章 */}
                  {unreadMessages > 0 && (
                    <View style={styles.notificationBadge}>
                      <Text style={styles.notificationText}>{unreadMessages}</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
              {/* 在线客服图标 */}
              <TouchableOpacity style={styles.serviceButton} onPress={() => {
                console.log('客服按钮被点击，跳转到客服页面');
                onNavigateTo && onNavigateTo('customer-service');
              }}>
                <Ionicons name="chatbubble-outline" size={24} color="#fff" />
              </TouchableOpacity>
              {/* 版本切换图标 */}
              <TouchableOpacity style={styles.serviceButton} onPress={() => {
                console.log('版本切换按钮被点击，跳转到版本切换页面');
                onNavigateTo && onNavigateTo('version-switch');
              }}>
                <Ionicons name="settings-outline" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 搜索结果 */}
        {showSearchResults && searchResults.length > 0 && (
          <View style={[styles.searchResultsContainer, { backgroundColor: 'rgba(255, 255, 255, 0.95)' }]}>
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
            <View style={[styles.functionButtonsSection, { backgroundColor: '#1A4EA2' }]}>
              {/* 第一行按钮 */}
              <View style={styles.buttonRow}>
                <Pressable style={styles.functionButton} onPress={() => {
                  console.log('账户 - 跳转到账户页面');
                  // 实际实现：跳转到账户页面
                  onNavigateTo && onNavigateTo('assetStatus');
                }}>
                  <Text style={styles.functionButtonIcon}>👤</Text>
                  <Text style={styles.functionButtonText}>账户</Text>
                </Pressable>
                <Pressable style={styles.functionButton} onPress={() => {
                  console.log('转账 - 跳转到转账页面');
                  // 实际实现：跳转到转账页面
                  onNavigateTo && onNavigateTo('deposit-consultation');
                }}>
                  <Text style={styles.functionButtonIcon}>💸</Text>
                  <Text style={styles.functionButtonText}>转账</Text>
                </Pressable>
                <Pressable style={styles.functionButton} onPress={() => {
                  console.log('交易记录 - 跳转到交易记录页面');
                  // 实际实现：跳转到交易记录页面
                  onNavigateTo && onNavigateTo('subscriptionRedemptionRecords');
                }}>
                  <Text style={styles.functionButtonIcon}>📋</Text>
                  <Text style={styles.functionButtonText}>交易记录</Text>
                </Pressable>
                <Pressable style={styles.functionButton} onPress={() => {
                  console.log('港美A股 - 跳转到港美A股页面');
                  // 实际实现：跳转到港美A股页面
                  onNavigateTo && onNavigateTo('assetStatus');
                }}>
                  <Text style={styles.functionButtonIcon}>📈</Text>
                  <Text style={styles.functionButtonText}>港美A股</Text>
                </Pressable>
              </View>
              {/* 第二行按钮 */}
              <View style={[styles.buttonRow, styles.buttonRowLast]}>
                <Pressable style={styles.functionButton} onPress={() => {
                  console.log('热门活动 - 跳转到热门活动页面');
                  // 实际实现：跳转到热门活动页面
                  onNavigateTo && onNavigateTo('assetStatus');
                }}>
                  <Text style={styles.functionButtonIcon}>🎁</Text>
                  <Text style={styles.functionButtonText}>热门活动</Text>
                </Pressable>
                <Pressable style={styles.functionButton} onPress={() => {
                  console.log('定期存款 - 跳转到定期存款页面');
                  // 实际实现：跳转到定期存款页面
                  onNavigateTo && onNavigateTo('assetStatus');
                }}>
                  <Text style={styles.functionButtonIcon}>💵</Text>
                  <Text style={styles.functionButtonText}>定期存款</Text>
                </Pressable>
                <Pressable style={styles.functionButton} onPress={() => {
                  console.log('基金 - 跳转到基金页面');
                  // 实际实现：跳转到基金页面
                  onNavigateTo && onNavigateTo('assetStatus');
                }}>
                  <Text style={styles.functionButtonIcon}>📊</Text>
                  <Text style={styles.functionButtonText}>基金</Text>
                </Pressable>
                <Pressable style={styles.functionButton} onPress={() => {
                  console.log('外汇 - 跳转到外汇页面');
                  // 实际实现：跳转到外汇页面
                  onNavigateTo && onNavigateTo('assetStatus');
                }}>
                  <Text style={styles.functionButtonIcon}>💱</Text>
                  <Text style={styles.functionButtonText}>外汇</Text>
                </Pressable>
              </View>
            </View>
          </View>

          {/* 证券市场行情独立板块 */}
          <View style={[styles.section, { backgroundColor: 'rgba(255, 255, 255, 0.95)' }]}>
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
              <View style={styles.indicesContainer}>
                {marketCategories.find(cat => cat.id === selectedCategory)?.indices.map(index => (
                  <View key={index.code} style={styles.indexItem}>
                    <View style={styles.indexInfo}>
                      <Text style={styles.indexName}>{index.name}</Text>
                      <Text style={styles.indexCode}>{index.code}</Text>
                    </View>
                    <View style={styles.indexValueContainer}>
                      <Text style={styles.indexValue}>{index.value}</Text>
                      <View style={styles.changeContainer}>
                        <Text style={[
                          styles.indexChange,
                          index.change > 0 ? styles.changePositive : styles.changeNegative
                        ]}>
                          {index.change > 0 ? '+' : ''}{index.change}
                        </Text>
                        <Text style={[
                          styles.indexChangeValue,
                          index.change > 0 ? styles.changePositive : styles.changeNegative
                        ]}>
                          ({index.changeValue > 0 ? '+' : ''}{index.changeValue}%)
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* 内参精选独立板块 */}
          <View style={[styles.section, { backgroundColor: 'rgba(255, 255, 255, 0.95)' }]}>
            <Text style={styles.sectionTitle}>{lang === 'zh' ? '内参精选' : 'Insider Articles'}</Text>
            
            {/* 内参文章列表 */}
            {insiderArticles.map((article, index) => (
              <Pressable
                key={index}
                style={styles.insiderArticleItem}
                onPress={() => onInsiderArticlePress && onInsiderArticlePress(article)}
              >
                <View style={styles.insiderArticleContent}>
                  <Text style={styles.insiderArticleTitle}>{article.title}</Text>
                  <Text style={styles.insiderArticleSummary}>{article.summary}</Text>
                  <Text style={styles.insiderArticleDate}>{article.date}</Text>
                </View>
                {article.cover_image && (
                  <Image
                    source={{ uri: article.cover_image }}
                    style={styles.insiderArticleImage}
                    resizeMode="cover"
                  />
                )}
              </Pressable>
            ))}
            
            {/* 查看更多按钮 */}
            <Pressable style={styles.viewMoreButton}>
              <Text style={styles.viewMoreText}>{lang === 'zh' ? '查看更多' : 'View More'}</Text>
              <Ionicons name="chevron-forward" size={16} color="#1a73e8" />
            </Pressable>
          </View>

          {/* 资管产品独立板块 */}
          <View style={[styles.section, { backgroundColor: 'rgba(255, 255, 255, 0.95)' }]}>
            <Text style={styles.sectionTitle}>{lang === 'zh' ? '资管产品' : 'Products'}</Text>
            
            {/* 产品列表 */}
            <View style={styles.productList}>
              {/* 展示第一个产品的详细信息 */}
              {products.length > 0 && (
                <View style={styles.productCard}>
                  <View style={styles.productHeader}>
                    <Text style={styles.productName}>{products[0].name}</Text>
                    <View style={styles.productCategoryTag}>
                      <Text style={styles.categoryTagText}>{lang === 'zh' ? '资管计划' : 'Product'}</Text>
                    </View>
                  </View>
                  <Text style={styles.productCode}>代码: {products[0].code}</Text>
                  <Text style={styles.productDescription}>{products[0].description}</Text>
                  <View style={styles.productActions}>
                    <Text style={styles.returnRateText}>
                      {lang === 'zh' ? '年化收益率: ' : 'Annual Return: '}
                      <Text style={styles.returnRateValue}>{products[0].returnRate}%</Text>
                    </Text>
                    <TouchableOpacity style={styles.subscribeButton}>
                      <Text style={styles.subscribeButtonText}>{lang === 'zh' ? '申购申请' : 'Subscribe'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
            
            {/* 查看更多按钮 */}
            <Pressable style={styles.viewMoreButton}>
              <Text style={styles.viewMoreText}>{lang === 'zh' ? '查看更多' : 'View More'}</Text>
              <Ionicons name="chevron-forward" size={16} color="#1a73e8" />
            </Pressable>
          </View>

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
