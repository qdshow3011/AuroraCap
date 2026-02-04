import { useState, useEffect, useRef } from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable, TouchableOpacity } from 'react-native'
import { supabase } from '../lib/supabase'
import { PieChart } from 'react-native-chart-kit'
import { Dimensions } from 'react-native'

// 我的资产类型定义
interface MyAssets {
  totalAssets: number
  fundValue: number
  cashBalance: number
  pendingFunds: number
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

export default function AssetStatusScreen({ lang = 'zh', demo = false, userInfo, onClose, onNavigateToCustomerService, onNavigateToWithdrawalApplication, onNavigateToFundTransactions }: { lang?: 'zh' | 'en'; demo?: boolean; userInfo?: any; onClose?: () => void; onNavigateToCustomerService?: () => void; onNavigateToWithdrawalApplication?: () => void; onNavigateToFundTransactions?: () => void }) {
  const [assets, setAssets] = useState<MyAssets | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  
  // 滚动相关ref
  const scrollViewRef = useRef<ScrollView>(null)

  // 数据加载函数
  const loadData = async (isRefresh: boolean = false) => {
    setLoading(isRefresh ? false : true)
    setRefreshing(isRefresh)
    try {
      if (!userInfo || !userInfo.id) {
        setAssets(null)
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
      
      // 从cash_balances表获取现金余额数据
      let cashBalance = 0
      let availableBalance = 0
      let pendingAmount = 0
      
      // 获取现金余额数据
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
        // 使用默认值
        cashBalance = 100000.00
        availableBalance = 100000.00
        pendingAmount = 0.00
      }
      
      // 总资产 = 基金价值 + 现金余额
      const totalAssets = fundValue + cashBalance
      
      // 设置资产数据
      setAssets({
        totalAssets,
        fundValue,
        cashBalance,
        pendingFunds: pendingAmount
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
  }, [lang, supabase, userInfo])

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
    // 资管功能按钮翻译
    depositService: '入金咨询',
    withdrawalApplication: '出金申请',
    assetStatus: '资产状况',
    transactionStatus: '资金往来',
    // 资产明细
    fundValue: '基金价值',
    cashBalance: '现金余额',
    pendingFunds: '在途资金',
    // 图表相关
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
    // 资管功能按钮翻译
    depositService: 'Deposit Consultation',
    withdrawalApplication: 'Withdrawal Application',
    assetStatus: 'Asset Status',
    transactionStatus: 'Fund Transactions',
    // 资产明细
    fundValue: 'Fund Value',
    cashBalance: 'Cash Balance',
    pendingFunds: 'Pending Funds',
    // 图表相关
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
        color: '#188038',
        legendFontColor: '#7F7F7F',
        legendFontSize: 12
      },
      {
        name: t.cashBalance,
        population: assets.cashBalance || 0,
        color: '#1890ff',
        legendFontColor: '#7F7F7F',
        legendFontSize: 12
      },
      {
        name: t.pendingFunds,
        population: assets.pendingFunds || 0,
        color: '#faad14',
        legendFontColor: '#7F7F7F',
        legendFontSize: 12
      }
    ]
    
    console.log('Pie chart data:', data)
    return data
  }

  // 计算占比
  const calculatePercentage = (value: number) => {
    if (!assets || !assets.totalAssets || assets.totalAssets === 0) return '0%'
    const percentage = (value / assets.totalAssets) * 100
    return `${percentage.toFixed(1)}%`
  }

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>{lang === 'zh' ? '加载中...' : 'Loading...'}</Text>
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          {lang === 'zh' ? `错误: ${error}` : `Error: ${error}`}
        </Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* 顶部头衔 */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {onClose && (
            <TouchableOpacity style={styles.backButton} onPress={onClose}>
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.title}>{t.myAssets}</Text>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconButton} onPress={() => console.log('搜索')}>
            <Text style={styles.icon}>🔍</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={() => console.log('客服')}>
            <Text style={styles.icon}>🎧</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 资管功能按钮区域 */}
      <View style={styles.assetManagementButtons}>
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.functionButton} onPress={() => {
            console.log('入金咨询 - 跳转客服模块');
            onNavigateToCustomerService?.();
          }}>
            <Text style={styles.functionButtonIcon}>💰</Text>
            <Text style={styles.functionButtonText}>{t.depositService}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.functionButton} onPress={() => {
            console.log('出金申请 - 跳转出金申请页面');
            onNavigateToWithdrawalApplication?.();
          }}>
            <Text style={styles.functionButtonIcon}>🏦</Text>
            <Text style={styles.functionButtonText}>{t.withdrawalApplication}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.functionButton, styles.activeButton]} onPress={() => {
            console.log('资产状况');
          }}>
            <Text style={styles.functionButtonIcon}>📊</Text>
            <Text style={[styles.functionButtonText, styles.activeButtonText]}>{t.assetStatus}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.functionButton} onPress={() => {
            console.log('资金往来 - 跳转资金往来页面');
            onNavigateToFundTransactions?.();
          }}>
            <Text style={styles.functionButtonIcon}>💱</Text>
            <Text style={styles.functionButtonText}>{t.transactionStatus}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 内容滚动区域 */}
      <ScrollView 
        ref={scrollViewRef} 
        style={styles.contentScrollView} 
        showsVerticalScrollIndicator={false}
      >
        {/* 资产状况展示 */}
        {assets && (
          <View style={styles.content}>
            {/* 总资产 */}
            <View style={styles.totalAssetsContainer}>
              <Text style={styles.totalAssetsLabel}>{t.totalAssets}</Text>
              <Text style={styles.totalAssetsValue}>¥{assets.totalAssets ? assets.totalAssets.toFixed(2) : '0.00'}</Text>
            </View>

            {/* 饼状图 */}
            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>{t.assetDistribution}</Text>
              <PieChart
                data={getPieChartData()}
                width={Dimensions.get('window').width - 40}
                height={220}
                chartConfig={{
                  backgroundColor: '#ffffff',
                  backgroundGradientFrom: '#ffffff',
                  backgroundGradientTo: '#ffffff',
                  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  style: {
                    borderRadius: 16
                  },
                  propsForDots: {
                    r: '6',
                    strokeWidth: '2',
                    stroke: '#ffffff'
                  }
                }}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
              />
            </View>

            {/* 资产明细 */}
            <View style={styles.assetDetailsContainer}>
              <View style={styles.assetDetailItem}>
                <View style={styles.assetDetailLeft}>
                  <View style={[styles.assetDetailIcon, { backgroundColor: '#188038' }]} />
                  <Text style={styles.assetDetailLabel}>{t.fundValue}</Text>
                </View>
                <View style={styles.assetDetailRight}>
                  <Text style={styles.assetDetailValue}>¥{assets.fundValue ? assets.fundValue.toFixed(2) : '0.00'}</Text>
                  <Text style={styles.assetDetailPercentage}>{calculatePercentage(assets.fundValue || 0)}</Text>
                </View>
              </View>

              <View style={styles.assetDetailItem}>
                <View style={styles.assetDetailLeft}>
                  <View style={[styles.assetDetailIcon, { backgroundColor: '#1890ff' }]} />
                  <Text style={styles.assetDetailLabel}>{t.cashBalance}</Text>
                </View>
                <View style={styles.assetDetailRight}>
                  <Text style={styles.assetDetailValue}>¥{assets.cashBalance ? assets.cashBalance.toFixed(2) : '0.00'}</Text>
                  <Text style={styles.assetDetailPercentage}>{calculatePercentage(assets.cashBalance || 0)}</Text>
                </View>
              </View>

              <View style={styles.assetDetailItem}>
                <View style={styles.assetDetailLeft}>
                  <View style={[styles.assetDetailIcon, { backgroundColor: '#faad14' }]} />
                  <Text style={styles.assetDetailLabel}>{t.pendingFunds}</Text>
                </View>
                <View style={styles.assetDetailRight}>
                  <Text style={styles.assetDetailValue}>¥{assets.pendingFunds ? assets.pendingFunds.toFixed(2) : '0.00'}</Text>
                  <Text style={styles.assetDetailPercentage}>{calculatePercentage(assets.pendingFunds || 0)}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* 底部留白 */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f2f5',
  },
  loadingText: {
    color: '#333',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f2f5',
    padding: 20,
  },
  errorText: {
    color: '#d93025',
    fontSize: 16,
    textAlign: 'center',
  },
  header: {
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  backButtonText: {
    fontSize: 24,
    color: '#333',
    fontWeight: '600',
  },
  title: {
    color: '#333',
    fontSize: 24,
    fontWeight: '700',
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 8,
    marginLeft: 12,
  },
  icon: {
    fontSize: 20,
    color: '#333',
  },
  // 资管功能按钮样式
  assetManagementButtons: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
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
  },
  functionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
  },
  activeButton: {
    backgroundColor: '#e6f4ea',
  },
  functionButtonIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  functionButtonText: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
  },
  activeButtonText: {
    color: '#188038',
    fontWeight: '600',
  },
  // 内容区域
  content: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  // 总资产
  totalAssetsContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  totalAssetsLabel: {
    color: '#666',
    fontSize: 16,
    marginBottom: 8,
  },
  totalAssetsValue: {
    color: '#333',
    fontSize: 36,
    fontWeight: '700',
  },
  // 图表
  chartContainer: {
    alignItems: 'center',
    marginBottom: 30,
    minHeight: 250,
  },
  chartTitle: {
    color: '#333',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  // 资产明细
  assetDetailsContainer: {
    marginTop: 20,
  },
  assetDetailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  assetDetailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  assetDetailIcon: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  assetDetailLabel: {
    color: '#666',
    fontSize: 16,
  },
  assetDetailRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  assetDetailValue: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
    marginRight: 16,
  },
  assetDetailPercentage: {
    color: '#999',
    fontSize: 14,
  },
  // 内容滚动区域样式
  contentScrollView: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
})