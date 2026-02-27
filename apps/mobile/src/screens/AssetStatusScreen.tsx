import { useState, useEffect, useRef } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { supabase } from '../lib/supabase'
import { PieChart } from 'react-native-chart-kit'

// 我的资产类型定义
interface MyAssets {
  totalAssets: number
  fundValue: number
  cashBalance: number
  pendingFunds: number
  todayReturn: number
  returnRate: number
}

// 交易记录类型定义
interface Transaction {
  id: string
  productName: string
  transactionType: 'subscription' | 'redemption'
  settlementValue: number
  shares: number
  date: string
}

// 资金状况类型定义
interface FundStatus {
  availableBalance: number
  totalDeposit: number
  totalWithdrawal: number
  pendingAmount: number
}

// 入金出金记录类型定义
interface DepositWithdrawal {
  id: string
  type: 'deposit' | 'withdrawal'
  amount: number
  status: 'pending' | 'completed' | 'failed'
  created_at: string
  updated_at: string
  description?: string
}

// 颜色常量
const COLORS = {
  primary: '#1A4EA2',
  primaryDark: '#0D3A8A',
  primaryLight: '#3B6CB8',
  background: '#F5F7FA',
  cardBg: '#FFFFFF',
  fundGreen: '#4CAF50',
  cashBlue: '#2196F3',
  pendingOrange: '#FF9800',
  textPrimary: '#1A1A1A',
  textSecondary: '#666666',
  textMuted: '#999999',
  positive: '#4CAF50',
  negative: '#F44336',
}

export default function AssetStatusScreen({ 
  lang = 'zh', 
  demo = false, 
  userInfo, 
  onClose, 
  onNavigateToCustomerService, 
  onNavigateToWithdrawalApplication, 
  onNavigateToFundTransactions 
}: { 
  lang?: 'zh' | 'en'
  demo?: boolean
  userInfo?: any
  onClose?: () => void
  onNavigateToCustomerService?: () => void
  onNavigateToWithdrawalApplication?: () => void
  onNavigateToFundTransactions?: () => void 
}) {
  const [assets, setAssets] = useState<MyAssets | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  
  const insets = useSafeAreaInsets()
  const scrollViewRef = useRef<ScrollView>(null)

  // 数据加载函数
  const loadData = async (isRefresh: boolean = false) => {
    setLoading(isRefresh ? false : true)
    setRefreshing(isRefresh)
    try {
      if (!userInfo || !userInfo.id) {
        // 如果没有用户信息，显示默认数据
        setAssets({
          totalAssets: 0,
          fundValue: 0,
          cashBalance: 0,
          pendingFunds: 0,
          todayReturn: 0,
          returnRate: 0
        })
        setLoading(false)
        return
      }
      
      // 从positions表读取登录用户的持仓数据
      const { data: positionsData, error: positionsError } = await supabase
        .from('positions')
        .select('*')
        .eq('user_id', userInfo.id)
      
      if (positionsError) {
        console.error('获取用户持仓数据失败:', positionsError)
      }
      
      // 计算基金价值（来自持仓数据）
      const fundValue = positionsData && positionsData.length > 0 
        ? positionsData.reduce((sum, position) => sum + (position.current_value || 0), 0)
        : 0
      
      // 计算今日收益（模拟数据，实际应从每日收益表获取）
      const todayReturn = positionsData && positionsData.length > 0
        ? positionsData.reduce((sum, position) => sum + (position.daily_return || 0), 0)
        : 0
      
      // 从cash_balances表获取现金余额数据
      let cashBalance = 0
      let availableBalance = 0
      let pendingAmount = 0
      
      const { data: cashBalanceData, error: cashBalanceError } = await supabase
        .from('cash_balances')
        .select('*')
        .eq('user_id', userInfo.id)
      
      if (cashBalanceData && cashBalanceData.length > 0) {
        cashBalance = cashBalanceData[0].cash_balance
        availableBalance = cashBalanceData[0].cash_balance
        pendingAmount = cashBalanceData[0].pending_funds
      } else {
        console.log('未找到现金余额记录，使用默认值:', cashBalanceError)
        cashBalance = 100000.00
        availableBalance = 100000.00
        pendingAmount = 0.00
      }
      
      // 总资产 = 基金价值 + 现金余额
      const totalAssets = fundValue + cashBalance
      
      // 计算收益率
      const returnRate = totalAssets > 0 ? (todayReturn / totalAssets) * 100 : 0
      
      setAssets({
        totalAssets,
        fundValue,
        cashBalance,
        pendingFunds: pendingAmount,
        todayReturn,
        returnRate
      })
      
    } catch (error) {
      console.error('Error loading data:', error)
      setError('无法加载数据，请检查网络连接或稍后重试')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [lang, userInfo?.id])

  // 语言翻译
  const t = lang === 'zh' ? {
    assetsCenter: '资管',
    myAssets: '我的资产状况',
    totalAssets: '总资产',
    todayReturn: '今日收益',
    returnRate: '收益率',
    investmentReview: '投资回顾',
    fundProducts: '基金产品',
    historicalTransactions: '我的交易记录',
    depositService: '入金咨询',
    withdrawalApplication: '出金申请',
    assetStatus: '资产状况',
    transactionStatus: '资金往来',
    fundValue: '基金价值',
    cashBalance: '现金余额',
    pendingFunds: '在途资金',
    assetDistribution: '资产分布'
  } : {
    assetsCenter: 'Asset Management',
    myAssets: 'My Asset Status',
    totalAssets: 'Total Assets',
    todayReturn: "Today's Return",
    returnRate: 'Return Rate',
    investmentReview: 'Investment Review',
    fundProducts: 'Fund Products',
    historicalTransactions: 'My Transactions',
    depositService: 'Deposit Consultation',
    withdrawalApplication: 'Withdrawal Application',
    assetStatus: 'Asset Status',
    transactionStatus: 'Fund Transactions',
    fundValue: 'Fund Value',
    cashBalance: 'Cash Balance',
    pendingFunds: 'Pending Funds',
    assetDistribution: 'Asset Distribution'
  }

  // 下拉刷新
  const handleRefresh = () => {
    loadData(true)
  }

  // 饼状图数据
  const getPieChartData = () => {
    if (!assets) return []
    
    const data = [
      {
        name: t.fundValue,
        population: assets.fundValue || 0,
        color: COLORS.fundGreen,
        legendFontColor: COLORS.textSecondary,
        legendFontSize: 12
      },
      {
        name: t.cashBalance,
        population: assets.cashBalance || 0,
        color: COLORS.cashBlue,
        legendFontColor: COLORS.textSecondary,
        legendFontSize: 12
      },
      {
        name: t.pendingFunds,
        population: assets.pendingFunds || 0,
        color: COLORS.pendingOrange,
        legendFontColor: COLORS.textSecondary,
        legendFontSize: 12
      }
    ]
    
    return data
  }

  // 计算占比
  const calculatePercentage = (value: number) => {
    if (!assets || !assets.totalAssets || assets.totalAssets === 0) return '0%'
    const percentage = (value / assets.totalAssets) * 100
    return `${percentage.toFixed(1)}%`
  }

  // 格式化金额
  const formatAmount = (amount: number) => {
    return `¥${amount ? amount.toFixed(2) : '0.00'}`
  }

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="refresh" size={40} color={COLORS.primary} />
        <Text style={styles.loadingText}>{lang === 'zh' ? '加载中...' : 'Loading...'}</Text>
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color={COLORS.negative} />
        <Text style={styles.errorText}>
          {lang === 'zh' ? `错误: ${error}` : `Error: ${error}`}
        </Text>
      </View>
    )
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* 渐变头部背景 */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.headerGradient}
      >
        {/* 头部导航 */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {onClose && (
              <TouchableOpacity style={styles.backButton} onPress={onClose}>
                <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
              </TouchableOpacity>
            )}
            <Text style={styles.title}>{t.myAssets}</Text>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.iconButton} onPress={() => console.log('搜索')}>
              <View style={styles.iconButtonBg}>
                <Ionicons name="search" size={20} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={() => console.log('客服')}>
              <View style={styles.iconButtonBg}>
                <Ionicons name="headset" size={20} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* 总资产展示区域 */}
        {assets && (
          <View style={styles.totalAssetsContainer}>
            <Text style={styles.totalAssetsLabel}>{t.totalAssets}</Text>
            <Text style={styles.totalAssetsValue}>{formatAmount(assets.totalAssets)}</Text>
            <View style={styles.returnContainer}>
              <View style={styles.returnItem}>
                <Text style={styles.returnLabel}>{t.todayReturn}</Text>
                <Text style={[
                  styles.returnValue, 
                  assets.todayReturn >= 0 ? styles.positiveText : styles.negativeText
                ]}>
                  {assets.todayReturn >= 0 ? '+' : ''}{formatAmount(assets.todayReturn)}
                </Text>
              </View>
              <View style={styles.returnDivider} />
              <View style={styles.returnItem}>
                <Text style={styles.returnLabel}>{t.returnRate}</Text>
                <Text style={[
                  styles.returnValue,
                  assets.returnRate >= 0 ? styles.positiveText : styles.negativeText
                ]}>
                  {assets.returnRate >= 0 ? '+' : ''}{assets.returnRate.toFixed(2)}%
                </Text>
              </View>
            </View>
          </View>
        )}
      </LinearGradient>

      {/* 内容滚动区域 */}
      <ScrollView 
        ref={scrollViewRef} 
        style={styles.contentScrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 资管功能按钮区域 */}
        <View style={styles.assetManagementCard}>
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={styles.functionButton} 
              onPress={() => onNavigateToCustomerService?.()}
              activeOpacity={0.7}
            >
              <View style={styles.functionIconContainer}>
                <Ionicons name="cash-outline" size={24} color={COLORS.primary} />
              </View>
              <Text style={styles.functionButtonText}>{t.depositService}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.functionButton} 
              onPress={() => onNavigateToWithdrawalApplication?.()}
              activeOpacity={0.7}
            >
              <View style={styles.functionIconContainer}>
                <Ionicons name="card-outline" size={24} color={COLORS.primary} />
              </View>
              <Text style={styles.functionButtonText}>{t.withdrawalApplication}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.functionButton, styles.activeButton]} 
              onPress={() => {}}
              activeOpacity={0.7}
            >
              <View style={[styles.functionIconContainer, styles.activeIconContainer]}>
                <Ionicons name="pie-chart" size={24} color="#FFFFFF" />
              </View>
              <Text style={[styles.functionButtonText, styles.activeButtonText]}>{t.assetStatus}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.functionButton} 
              onPress={() => onNavigateToFundTransactions?.()}
              activeOpacity={0.7}
            >
              <View style={styles.functionIconContainer}>
                <Ionicons name="swap-horizontal-outline" size={24} color={COLORS.primary} />
              </View>
              <Text style={styles.functionButtonText}>{t.transactionStatus}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {assets && (
          <>
            {/* 资产分布卡片 */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLine} />
                <Text style={styles.cardTitle}>{t.assetDistribution}</Text>
              </View>
              
              <View style={styles.chartContainer}>
                <PieChart
                  data={getPieChartData()}
                  width={Dimensions.get('window').width - 72}
                  height={200}
                  chartConfig={{
                    backgroundColor: COLORS.cardBg,
                    backgroundGradientFrom: COLORS.cardBg,
                    backgroundGradientTo: COLORS.cardBg,
                    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                    style: {
                      borderRadius: 16
                    }
                  }}
                  accessor="population"
                  backgroundColor="transparent"
                  paddingLeft="15"
                  hasLegend={true}
                  legendStyle={{
                    paddingTop: 10
                  }}
                />
              </View>
            </View>

            {/* 资产明细卡片 */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLine} />
                <Text style={styles.cardTitle}>{t.assetStatus}</Text>
              </View>
              
              <View style={styles.assetDetailsContainer}>
                {/* 基金价值 */}
                <View style={styles.assetDetailItem}>
                  <View style={styles.assetDetailLeft}>
                    <View style={[styles.assetDetailIcon, { backgroundColor: COLORS.fundGreen }]}>
                      <Ionicons name="trending-up" size={16} color="#FFFFFF" />
                    </View>
                    <Text style={styles.assetDetailLabel}>{t.fundValue}</Text>
                  </View>
                  <View style={styles.assetDetailRight}>
                    <Text style={styles.assetDetailValue}>{formatAmount(assets.fundValue || 0)}</Text>
                    <View style={styles.percentageBadge}>
                      <Text style={[styles.assetDetailPercentage, { color: COLORS.fundGreen }]}>
                        {calculatePercentage(assets.fundValue || 0)}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.divider} />

                {/* 现金余额 */}
                <View style={styles.assetDetailItem}>
                  <View style={styles.assetDetailLeft}>
                    <View style={[styles.assetDetailIcon, { backgroundColor: COLORS.cashBlue }]}>
                      <Ionicons name="wallet" size={16} color="#FFFFFF" />
                    </View>
                    <Text style={styles.assetDetailLabel}>{t.cashBalance}</Text>
                  </View>
                  <View style={styles.assetDetailRight}>
                    <Text style={styles.assetDetailValue}>{formatAmount(assets.cashBalance || 0)}</Text>
                    <View style={styles.percentageBadge}>
                      <Text style={[styles.assetDetailPercentage, { color: COLORS.cashBlue }]}>
                        {calculatePercentage(assets.cashBalance || 0)}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.divider} />

                {/* 在途资金 */}
                <View style={styles.assetDetailItem}>
                  <View style={styles.assetDetailLeft}>
                    <View style={[styles.assetDetailIcon, { backgroundColor: COLORS.pendingOrange }]}>
                      <Ionicons name="time" size={16} color="#FFFFFF" />
                    </View>
                    <Text style={styles.assetDetailLabel}>{t.pendingFunds}</Text>
                  </View>
                  <View style={styles.assetDetailRight}>
                    <Text style={styles.assetDetailValue}>{formatAmount(assets.pendingFunds || 0)}</Text>
                    <View style={styles.percentageBadge}>
                      <Text style={[styles.assetDetailPercentage, { color: COLORS.pendingOrange }]}>
                        {calculatePercentage(assets.pendingFunds || 0)}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </>
        )}

        {/* 底部留白 */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 20,
  },
  errorText: {
    color: COLORS.negative,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
  },
  
  // 头部渐变背景
  headerGradient: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  
  // 头部导航
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginLeft: 12,
  },
  iconButtonBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // 总资产展示
  totalAssetsContainer: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 8,
  },
  totalAssetsLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  totalAssetsValue: {
    color: '#FFFFFF',
    fontSize: 42,
    fontWeight: '800',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  returnContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  returnItem: {
    alignItems: 'center',
    flex: 1,
  },
  returnDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 16,
  },
  returnLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginBottom: 4,
  },
  returnValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  positiveText: {
    color: '#90EE90',
  },
  negativeText: {
    color: '#FFB6B6',
  },
  
  // 内容滚动区域
  contentScrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  
  // 资管功能按钮卡片
  assetManagementCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  functionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 12,
  },
  activeButton: {
    backgroundColor: 'rgba(26, 78, 162, 0.08)',
  },
  functionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(26, 78, 162, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  activeIconContainer: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  functionButtonText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  activeButtonText: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  
  // 通用卡片样式
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardHeaderLine: {
    width: 4,
    height: 20,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
    marginRight: 10,
  },
  cardTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  
  // 图表样式
  chartContainer: {
    alignItems: 'center',
    minHeight: 220,
  },
  
  // 资产明细样式
  assetDetailsContainer: {
    marginTop: 8,
  },
  assetDetailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  assetDetailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  assetDetailIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  assetDetailLabel: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  assetDetailRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  assetDetailValue: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginRight: 12,
  },
  percentageBadge: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    minWidth: 50,
    alignItems: 'center',
  },
  assetDetailPercentage: {
    fontSize: 13,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginLeft: 48,
  },
  
  // 底部留白
  bottomPadding: {
    height: 30,
  },
})
