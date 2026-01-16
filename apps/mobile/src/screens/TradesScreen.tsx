import { useState, useEffect } from 'react'
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Pressable, TextInput } from 'react-native'
import { supabase } from '../lib/supabase'

interface Product {
  id: string
  fund_number: string
  name_cn: string
  name_en: string
  net_asset_value: number
  annual_return: number
}

interface Position {
  id: string
  product_id: string
  shares: number
  avg_cost: number
  current_value: number
  product: Product
}

interface CashBalance {
  id: string
  user_id: string
  cash_balance: number
  pending_funds: number
  total_deposits: number
  total_withdrawals: number
  created_at: string
  updated_at: string
}

interface Subscription {
  id: string
  product_id: string
  shares: number
  status: string
  created_at: string
  product: Product
}

interface Transaction {
  id: string
  product_id: string
  type: 'subscription' | 'redemption'
  shares: number
  settlement_value: number
  created_at: string
  product: Product
  status: string
}

type TradeView = 'main' | 'subscription' | 'redemption' | 'positions' | 'query' | 'appointments' | 'transactions' | 'contracts'

export default function TradesScreen({ lang, userInfo, onNavigateToSubscriptionApplication, onNavigateToRedemptionApplication, onNavigateToSubscriptionRedemptionRecords, onNavigateToContractSigning, onNavigateToMySubscriptionRecords, onNavigateToMyRedemptionRecords }: { lang: 'zh' | 'en', userInfo?: any, onNavigateToSubscriptionApplication?: () => void, onNavigateToRedemptionApplication?: (product: Product) => void, onNavigateToSubscriptionRedemptionRecords?: () => void, onNavigateToContractSigning?: () => void, onNavigateToMySubscriptionRecords?: () => void, onNavigateToMyRedemptionRecords?: () => void }) {
  const [currentView, setCurrentView] = useState<TradeView>('main')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [subscriptionAmount, setSubscriptionAmount] = useState('')
  const [redemptionShares, setRedemptionShares] = useState('')
  const [positions, setPositions] = useState<Position[]>([])
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [cashBalance, setCashBalance] = useState<CashBalance | null>(null)
  
  // 资产概览数据
  const [totalAssets, setTotalAssets] = useState(0.00)
  const [cashAssets, setCashAssets] = useState(0.00)
  const [fundMarketValue, setFundMarketValue] = useState(0.00)
  const [cumulativeReturn, setCumulativeReturn] = useState(0.00)
  const [pendingFunds, setPendingFunds] = useState(0.00)
  
  // Tab状态
  const [activeTab, setActiveTab] = useState<'appointments' | 'contracts'>('appointments')
  
  // 模拟数据加载
  useEffect(() => {
    fetchPositions()
    fetchSubscriptions()
    fetchTransactions()
  }, [userInfo])

  const t = lang === 'zh' ? {
    title: '交易',
    subscription: '申购',
    redemption: '赎回',
    positions: '持仓状况',
    query: '查询',
    myAppointments: '我的预约',
    transactionRecords: '我的资金往来记录',
    myContracts: '我的合同',
    back: '返回',
    confirm: '确认',
    cancel: '取消',
    selectProduct: '选择产品',
    inputAmount: '输入金额',
    inputShares: '输入份额',
    productInfo: '产品信息',
    productName: '产品名称',
    netValue: '净值',
    annualReturn: '年化收益',
    subscriptionAmount: '申购金额',
    redemptionShares: '赎回份额',
    availableShares: '可用份额',
    submit: '提交',
    success: '提交成功',
    error: '提交失败',
    noPositions: '暂无持仓状况',
    noAppointments: '暂无预约',
    noTransactions: '暂无资金往来记录',
    noContracts: '暂无合同',
    date: '日期',
    type: '类型',
    amount: '金额',
    shares: '份额',
    status: '状态',
    pending: '待处理',
    completed: '已完成',
    processing: '正在办理',
    cancelled: '已中止',
    failed: '失败',
    subscriptionType: '申购',
    redemptionType: '赎回',
    // 资产概览相关
    totalAssets: '总资产',
    cashAssets: '现金资产',
    fundMarketValue: '基金市值',
    cumulativeReturn: '累计收益',
    pendingFunds: '在途资金',
    // Tab相关
    appointments: '我的预约',
    contracts: '我的合同'
  } : {
    title: 'Trades',
    subscription: 'Subscribe',
    redemption: 'Redeem',
    positions: 'Positions',
    query: 'Query',
    myAppointments: 'My Appointments',
    transactionRecords: 'My Transaction Applications',
    myContracts: 'My Contracts',
    back: 'Back',
    confirm: 'Confirm',
    cancel: 'Cancel',
    selectProduct: 'Select Product',
    inputAmount: 'Input Amount',
    inputShares: 'Input Shares',
    productInfo: 'Product Info',
    productName: 'Product Name',
    netValue: 'Net Value',
    annualReturn: 'Annual Return',
    subscriptionAmount: 'Subscription Amount',
    redemptionShares: 'Redemption Shares',
    availableShares: 'Available Shares',
    submit: 'Submit',
    success: 'Success',
    error: 'Error',
    noPositions: 'No positions',
    noAppointments: 'No appointments',
    noTransactions: 'No transaction applications',
    noContracts: 'No contracts',
    date: 'Date',
    type: 'Type',
    amount: 'Amount',
    shares: 'Shares',
    status: 'Status',
    pending: 'Pending',
    completed: 'Completed',
    processing: 'Processing',
    cancelled: 'Cancelled',
    failed: 'Failed',
    subscriptionType: 'Subscription',
    redemptionType: 'Redemption',
    // 资产概览相关
    totalAssets: 'Total Assets',
    cashAssets: 'Cash Assets',
    fundMarketValue: 'Fund Market Value',
    cumulativeReturn: 'Cumulative Return',
    pendingFunds: 'Pending Funds',
    // Tab相关
    appointments: 'My Appointments',
    contracts: 'My Contracts'
  }

  const fetchPositions = async () => {
    console.log('fetchPositions called, userInfo:', userInfo)
    if (!userInfo || !userInfo.id) {
      console.log('No user info, clearing positions data')
      // 没有登录用户，清空数据
      setPositions([])
      setCashBalance(null)
      setTotalAssets(0.00)
      setCashAssets(0.00)
      setFundMarketValue(0.00)
      setPendingFunds(0.00)
      return
    }

    try {
      // 1. 获取持仓数据
      console.log('Fetching positions for user:', userInfo.id)
      const { data: positionsData, error: positionsError } = await supabase
        .from('positions')
        .select('*')
        .eq('user_id', userInfo.id)

      console.log('Positions query result:', positionsData, positionsError)
      
      // 格式化持仓数据
      let formattedPositions: Position[] = []
      let fundMarketValue = 0
      
      if (positionsData && positionsData.length > 0) {
        // 提取所有产品ID
        const productIds = [...new Set(positionsData.map(pos => pos.fund_id))]
        console.log('Product IDs to fetch:', productIds)
        
        // 获取产品数据
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*')
          .in('id', productIds)
        
        console.log('Products query result:', productsData, productsError)
        
        // 将产品数据转换为Map，便于查找
        const productsMap = new Map(productsData ? productsData.map(product => [product.id, product]) : [])
        
        // 格式化持仓数据，添加产品信息
        formattedPositions = positionsData.map((pos: any) => ({
          id: pos.id,
          product_id: pos.fund_id,
          shares: pos.shares || 0,
          avg_cost: pos.avg_cost || 0,
          current_value: pos.current_value || 0,
          product: productsMap.get(pos.fund_id) || {
            id: pos.fund_id,
            fund_number: '',
            name_cn: '未知产品',
            name_en: 'Unknown Product',
            net_asset_value: 1.0,
            annual_return: 0
          }
        }))
        
        // 计算基金市值
        fundMarketValue = formattedPositions.reduce((sum, pos) => sum + pos.current_value, 0)
        console.log('Formatted positions:', formattedPositions)
      }
      
      setPositions(formattedPositions)
      setFundMarketValue(fundMarketValue)
      
      // 2. 从cash_balances表获取现金余额和在途资金
      console.log('Fetching cash balance for user:', userInfo.id)
      const { data: cashBalanceData, error: cashBalanceError } = await supabase
        .from('cash_balances')
        .select('*')
        .eq('user_id', userInfo.id)
      
      console.log('Cash balance query result:', cashBalanceData, cashBalanceError)
      
      if (cashBalanceData && cashBalanceData.length > 0) {
        const cashBalance = cashBalanceData[0]
        setCashBalance(cashBalance)
        setCashAssets(cashBalance.cash_balance)
        setPendingFunds(cashBalance.pending_funds)
        
        // 计算总资产
        const totalAssets = fundMarketValue + cashBalance.cash_balance
        setTotalAssets(totalAssets)
        console.log('Asset data calculated:', totalAssets, cashBalance.cash_balance, fundMarketValue, cashBalance.pending_funds)
      } else {
        // 如果没有现金余额记录，创建一条初始记录
        console.log('No cash balance record found, creating initial record')
        const { data: newCashBalance, error: createError } = await supabase
          .from('cash_balances')
          .insert({
            user_id: userInfo.id,
            cash_balance: 100000.00,
            pending_funds: 0.00,
            total_deposits: 100000.00,
            total_withdrawals: 0.00
          })
          .select('*')
        
        console.log('Create cash balance result:', newCashBalance, createError)
        
        if (newCashBalance && newCashBalance.length > 0) {
          const cashBalance = newCashBalance[0]
          setCashBalance(cashBalance)
          setCashAssets(cashBalance.cash_balance)
          setPendingFunds(cashBalance.pending_funds)
          
          // 计算总资产
          const totalAssets = fundMarketValue + cashBalance.cash_balance
          setTotalAssets(totalAssets)
          console.log('Initial cash balance created:', cashBalance)
        } else {
          // 使用默认值
          console.log('Using default cash balance values')
          setCashAssets(100000.00)
          setPendingFunds(0.00)
          const totalAssets = fundMarketValue + 100000.00
          setTotalAssets(totalAssets)
        }
      }
      
    } catch (error) {
      console.error('获取持仓数据时发生异常:', error)
      setPositions([])
      setCashBalance(null)
      setTotalAssets(0.00)
      setCashAssets(0.00)
      setFundMarketValue(0.00)
      setPendingFunds(0.00)
    }
  }

  const fetchSubscriptions = async () => {
    if (!userInfo || !userInfo.id) {
      setSubscriptions([])
      return
    }

    try {
      const { data, error } = await supabase
        .from('subscription_redemption')
        .select(`
          *,
          product:products(*)
        `)
        .eq('user_id', userInfo.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('获取订阅记录失败:', error)
        setSubscriptions([])
        return
      }

      if (data && data.length > 0) {
        const formattedSubscriptions: Subscription[] = data.map((item: any) => ({
          id: item.id,
          product_id: item.fund_id, // 注意：字段名是fund_id而不是product_id
          shares: item.shares,
          status: item.status || 'pending', // 使用实际状态
          created_at: item.created_at,
          product: item.product
        }))
        setSubscriptions(formattedSubscriptions)
      } else {
        setSubscriptions([])
      }
    } catch (error) {
      console.error('获取订阅记录时发生异常:', error)
      setSubscriptions([])
    }
  }

  const fetchTransactions = async () => {
    console.log('fetchTransactions called, userInfo:', userInfo)
    if (!userInfo || !userInfo.id) {
      console.log('No user info, clearing transactions data')
      setTransactions([])
      return
    }

    try {
      console.log('Fetching transactions for user:', userInfo.id)
      const { data, error } = await supabase
        .from('subscription_redemption')
        .select(`
          *,
          product:products(*)
        `)
        .eq('user_id', userInfo.id)
        .order('created_at', { ascending: false })

      console.log('Transactions query result:', data, error)

      if (error) {
        console.error('获取交易记录失败:', error)
        setTransactions([])
        return
      }

      if (data && data.length > 0) {
        const formattedTransactions: Transaction[] = data.map((item: any) => ({
          id: item.id,
          product_id: item.fund_id, // 注意：字段名是fund_id而不是product_id
          type: item.type,
          shares: item.shares,
          settlement_value: item.total_amount || (item.nav * item.shares),
          created_at: item.created_at,
          product: item.product,
          status: item.status || 'pending' // 使用实际状态
        }))
        setTransactions(formattedTransactions)
        console.log('Formatted transactions:', formattedTransactions)
      } else {
        console.log('No transactions data available')
        setTransactions([])
      }
    } catch (error) {
      console.error('获取交易记录时发生异常:', error)
      setTransactions([])
    }
  }

  // 更新用户现金余额到cash_balances表
  const updateCashBalance = async (userId: string, newBalance: number) => {
    try {
      // 更新现金余额表
      const { error: updateError } = await supabase
        .from('cash_balances')
        .update({ cash_balance: newBalance })
        .eq('user_id', userId)

      if (updateError) {
        console.error('更新现金余额失败:', updateError)
      }
    } catch (error) {
      console.error('更新现金余额时发生异常:', error)
    }
  }

  const handleSubscription = async () => {
    if (!selectedProduct || !subscriptionAmount || !userInfo || !userInfo.id) {
      alert(lang === 'zh' ? '请填写完整信息' : 'Please fill in all fields')
      return
    }

    try {
      const amount = parseFloat(subscriptionAmount)
      
      // 检查申购金额是否小于等于现金余额
      if (amount > cashAssets) {
        alert(lang === 'zh' ? '资金不足，无法申购' : 'Insufficient funds for subscription')
        return
      }
      
      const nav = selectedProduct.net_asset_value || 1.0
      const shares = amount / nav

      // 1. 创建设购记录，状态为pending
      const { error: subscriptionError } = await supabase
        .from('subscription_redemption')
        .insert({
          user_id: userInfo.id,
          fund_id: selectedProduct.id, // 注意：字段名是fund_id而不是product_id
          type: 'subscription',
          shares: shares,
          nav: nav,
          total_amount: amount,
          status: 'pending' // 初始状态为待处理
        })

      if (subscriptionError) {
        throw subscriptionError
      }

      alert(lang === 'zh' ? '申购申请已提交，请等待管理员处理' : 'Subscription application submitted, please wait for admin processing')
      setSubscriptionAmount('')
      setSelectedProduct(null)
      setCurrentView('main')
      
      // 刷新数据
      fetchPositions()
      fetchTransactions()
    } catch (error) {
      alert(lang === 'zh' ? '申购申请提交失败，请稍后重试' : 'Subscription application failed, please try again later')
      console.error('Error creating subscription:', error)
    }
  }

  const handleRedemption = async () => {
    if (!selectedProduct || !redemptionShares || !userInfo || !userInfo.id) {
      alert(lang === 'zh' ? '请填写完整信息' : 'Please fill in all fields')
      return
    }

    try {
      const shares = parseFloat(redemptionShares)
      const nav = selectedProduct.net_asset_value || 1.0
      const amount = shares * nav

      // 创建赎回记录，状态为pending
      const { error: redemptionError } = await supabase
        .from('subscription_redemption')
        .insert({
          user_id: userInfo.id,
          fund_id: selectedProduct.id, // 注意：字段名是fund_id而不是product_id
          type: 'redemption',
          shares: shares,
          nav: nav,
          total_amount: amount,
          status: 'pending' // 初始状态为待处理
        })

      if (redemptionError) {
        throw redemptionError
      }

      alert(lang === 'zh' ? '赎回申请已提交，请等待管理员处理' : 'Redemption application submitted, please wait for admin processing')
      setRedemptionShares('')
      setSelectedProduct(null)
      setCurrentView('main')
      
      // 刷新数据
      fetchPositions()
      fetchTransactions()
    } catch (error) {
      alert(lang === 'zh' ? '赎回申请提交失败，请稍后重试' : 'Redemption application failed, please try again later')
      console.error('Error creating redemption:', error)
    }
  }

  const renderMainView = () => (
    <View>
      
      {/* 我的余额板块 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>我的余额</Text>
        <View style={styles.sectionCard}>
          {cashBalance ? (
            <View style={styles.balanceContainer}>
              <View style={styles.balanceItem}>
                <Text style={styles.balanceLabel}>现金余额</Text>
                <Text style={styles.balanceValue}>¥{(cashBalance.cash_balance || 0).toFixed(2)}</Text>
              </View>
              <View style={styles.balanceItem}>
                <Text style={styles.balanceLabel}>在途资金</Text>
                <Text style={styles.balanceValue}>¥{(cashBalance.pending_funds || 0).toFixed(2)}</Text>
              </View>
              <View style={styles.balanceItem}>
                <Text style={styles.balanceLabel}>总入金</Text>
                <Text style={styles.balanceValue}>¥{(cashBalance.total_deposits || 0).toFixed(2)}</Text>
              </View>
              <View style={styles.balanceItem}>
                <Text style={styles.balanceLabel}>总出金</Text>
                <Text style={styles.balanceValue}>¥{(cashBalance.total_withdrawals || 0).toFixed(2)}</Text>
              </View>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{lang === 'zh' ? '暂无余额数据' : 'No balance data'}</Text>
            </View>
          )}
        </View>
      </View>
      
      {/* 持仓状况板块 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t.positions}</Text>
        <View style={styles.sectionCard}>
          {positions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{lang === 'zh' ? '暂无持仓状况' : 'No positions yet'}</Text>
            </View>
          ) : (
            positions.map((position) => (
              <View key={position.id} style={styles.positionCard}>
                <View style={styles.positionHeaderRow}>
                  <Text style={styles.positionName}>
                    {lang === 'zh' ? position.product.name_cn : position.product.name_en}
                  </Text>
                  <TouchableOpacity style={styles.redemptionButton} onPress={() => {
                    console.log('赎回申请 - 跳转到赎回申请页面', position.product);
                    setSelectedProduct(position.product);
                    onNavigateToRedemptionApplication?.(position.product);
                  }}>
                    <Text style={styles.redemptionButtonText}>赎回申请</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.positionFundNumber}>{position.product.fund_number}</Text>
                <View style={styles.positionDetails}>
                  <View style={styles.positionDetailItem}>
                      <Text style={styles.positionDetailLabel}>{t.shares}</Text>
                      <Text style={styles.positionDetailValue}>{(position.shares || 0).toFixed(2)}</Text>
                    </View>
                    <View style={styles.positionDetailItem}>
                      <Text style={styles.positionDetailLabel}>{t.netValue}</Text>
                      <Text style={styles.positionDetailValue}>¥{(position.product.net_asset_value || 0).toFixed(4)}</Text>
                    </View>
                    <View style={styles.positionDetailItem}>
                      <Text style={styles.positionDetailLabel}>{t.amount}</Text>
                      <Text style={styles.positionDetailValue}>¥{(position.current_value || 0).toFixed(2)}</Text>
                    </View>
                </View>
              </View>
            ))
          )}
        </View>
      </View>
      
      {/* 我的申购记录板块 */}
      <View style={styles.section}>
        <View style={styles.sectionTitleContainer}>
          <Text style={styles.sectionTitle}>我的申购记录</Text>
          <TouchableOpacity onPress={() => onNavigateToMySubscriptionRecords?.()}>
            <Text style={styles.moreText}>更多&gt;&gt;</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.sectionCard}>
          {/* 筛选最新三条申购记录 */}
          {(() => {
            const latestSubscriptions = transactions
              .filter(tx => tx.type === 'subscription')
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              .slice(0, 3);
            
            return latestSubscriptions.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>{lang === 'zh' ? '暂无申购记录' : 'No subscription records'}</Text>
              </View>
            ) : (
              latestSubscriptions.map((tx) => (
                <View key={tx.id} style={styles.recordCard}>
                  <View style={styles.recordHeader}>
                    <Text style={styles.recordName}>
                      {lang === 'zh' ? tx.product.name_cn : tx.product.name_en}
                    </Text>
                    <Text style={[styles.recordType, styles.subscriptionType]}>
                    {t.subscriptionType}
                  </Text>
                  </View>
                  <View style={styles.recordDetails}>
                    <View style={styles.recordDetailItem}>
                      <Text style={styles.recordDetailLabel}>{t.amount}</Text>
                      <Text style={styles.recordDetailValue}>¥{(tx.settlement_value || 0).toFixed(2)}</Text>
                    </View>
                    <View style={styles.recordDetailItem}>
                      <Text style={styles.recordDetailLabel}>{t.date}</Text>
                      <Text style={styles.recordDetailValue}>{tx.created_at.split('T')[0]}</Text>
                    </View>
                    <View style={styles.recordDetailItem}>
                      <Text style={styles.recordDetailLabel}>{t.status}</Text>
                      <Text style={[styles.recordDetailValue, styles.statusText]}>
                        {tx.status === 'pending' ? t.pending : tx.status === 'completed' ? t.completed : tx.status === 'processing' ? t.processing : tx.status === 'cancelled' ? t.cancelled : tx.status === 'failed' ? t.failed : tx.status}
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            );
          })()}
        </View>
      </View>
      
      {/* 我的赎回记录板块 */}
      <View style={styles.section}>
        <View style={styles.sectionTitleContainer}>
          <Text style={styles.sectionTitle}>我的赎回记录</Text>
          <TouchableOpacity onPress={() => onNavigateToMyRedemptionRecords?.()}>
            <Text style={styles.moreText}>更多&gt;&gt;</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.sectionCard}>
          {/* 筛选最新三条赎回记录 */}
          {(() => {
            const latestRedemptions = transactions
              .filter(tx => tx.type === 'redemption')
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              .slice(0, 3);
            
            return latestRedemptions.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>{lang === 'zh' ? '暂无赎回记录' : 'No redemption records'}</Text>
              </View>
            ) : (
              latestRedemptions.map((tx) => (
                <View key={tx.id} style={styles.recordCard}>
                  <View style={styles.recordHeader}>
                    <Text style={styles.recordName}>
                      {lang === 'zh' ? tx.product.name_cn : tx.product.name_en}
                    </Text>
                    <Text style={[styles.recordType, styles.redemptionType]}>
                    {t.redemptionType}
                  </Text>
                  </View>
                  <View style={styles.recordDetails}>
                    <View style={styles.recordDetailItem}>
                      <Text style={styles.recordDetailLabel}>{t.shares}</Text>
                      <Text style={styles.recordDetailValue}>{(tx.shares || 0).toFixed(2)}</Text>
                    </View>
                    <View style={styles.recordDetailItem}>
                      <Text style={styles.recordDetailLabel}>{t.date}</Text>
                      <Text style={styles.recordDetailValue}>{tx.created_at.split('T')[0]}</Text>
                    </View>
                    <View style={styles.recordDetailItem}>
                      <Text style={styles.recordDetailLabel}>{t.status}</Text>
                      <Text style={[styles.recordDetailValue, styles.statusText]}>
                        {tx.status === 'pending' ? t.pending : tx.status === 'completed' ? t.completed : tx.status === 'processing' ? t.processing : tx.status === 'cancelled' ? t.cancelled : tx.status === 'failed' ? t.failed : tx.status}
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            );
          })()}
        </View>
      </View>
      

    </View>
  )

  const renderSubscriptionView = () => (
    <View style={styles.subContainer}>
      <View style={styles.subHeader}>
        <TouchableOpacity onPress={() => setCurrentView('main')}>
          <Text style={styles.backText}>{t.back}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.subscription}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t.productInfo}</Text>
          {selectedProduct ? (
            <View style={styles.productInfo}>
              <Text style={styles.productName}>
                {lang === 'zh' ? selectedProduct.name_cn : selectedProduct.name_en}
              </Text>
              <Text style={styles.productDetail}>{t.netValue}: ¥{(selectedProduct.net_asset_value || 0).toFixed(4)}</Text>
              <Text style={styles.productDetail}>{t.annualReturn}: {selectedProduct.annual_return || 0}%</Text>
              <TouchableOpacity style={styles.changeButton} onPress={() => setSelectedProduct(null)}>
                <Text style={styles.changeButtonText}>{t.selectProduct}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.selectButton} onPress={() => {
              alert(lang === 'zh' ? '产品选择功能开发中' : 'Product selection feature under development')
            }}>
              <Text style={styles.selectButtonText}>{t.selectProduct}</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t.subscriptionAmount}</Text>
          <Text style={styles.inputLabel}>¥</Text>
          <TextInput
            style={styles.input}
            placeholder={t.inputAmount}
            value={subscriptionAmount}
            onChangeText={setSubscriptionAmount}
            keyboardType="numeric"
          />
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={handleSubscription}>
          <Text style={styles.submitButtonText}>{t.submit}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  )

  const renderRedemptionView = () => (
    <View style={styles.subContainer}>
      <View style={styles.subHeader}>
        <TouchableOpacity onPress={() => setCurrentView('main')}>
          <Text style={styles.backText}>{t.back}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.redemption}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t.productInfo}</Text>
          {selectedProduct ? (
            <View style={styles.productInfo}>
              <Text style={styles.productName}>
                {lang === 'zh' ? selectedProduct.name_cn : selectedProduct.name_en}
              </Text>
              <Text style={styles.productDetail}>{t.netValue}: ¥{(selectedProduct.net_asset_value || 0).toFixed(4)}</Text>
              <TouchableOpacity style={styles.changeButton} onPress={() => setSelectedProduct(null)}>
                <Text style={styles.changeButtonText}>{t.selectProduct}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.selectButton} onPress={() => {
              alert(lang === 'zh' ? '产品选择功能开发中' : 'Product selection feature under development')
            }}>
              <Text style={styles.selectButtonText}>{t.selectProduct}</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t.redemptionShares}</Text>
          <TextInput
            style={styles.input}
            placeholder={t.inputShares}
            value={redemptionShares}
            onChangeText={setRedemptionShares}
            keyboardType="numeric"
          />
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={handleRedemption}>
          <Text style={styles.submitButtonText}>{t.submit}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  )

  const renderPositionsView = () => (
    <View style={styles.subContainer}>
      <View style={styles.subHeader}>
        <TouchableOpacity onPress={() => setCurrentView('main')}>
          <Text style={styles.backText}>{t.back}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.positions}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        {positions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{t.noPositions}</Text>
          </View>
        ) : (
          positions.map((position) => (
            <View key={position.id} style={styles.positionCard}>
              <Text style={styles.positionName}>
                {lang === 'zh' ? position.product.name_cn : position.product.name_en}
              </Text>
              <View style={styles.positionDetails}>
                <View style={styles.positionDetailItem}>
                      <Text style={styles.positionDetailLabel}>{t.shares}</Text>
                      <Text style={styles.positionDetailValue}>{(position.shares || 0).toFixed(2)}</Text>
                    </View>
                    <View style={styles.positionDetailItem}>
                      <Text style={styles.positionDetailLabel}>{t.amount}</Text>
                      <Text style={styles.positionDetailValue}>
                        ¥{(position.current_value || 0).toFixed(2)}
                      </Text>
                    </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  )

  const renderQueryView = () => (
    <View style={styles.subContainer}>
      <View style={styles.subHeader}>
        <TouchableOpacity onPress={() => setCurrentView('main')}>
          <Text style={styles.backText}>{t.back}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.query}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        <TouchableOpacity
          style={styles.queryItem}
          onPress={() => { setCurrentView('appointments'); fetchSubscriptions() }}
        >
          <Text style={styles.queryItemText}>{t.myAppointments}</Text>
          <Text style={styles.queryArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.queryItem}
          onPress={() => { setCurrentView('transactions'); fetchTransactions() }}
        >
          <Text style={styles.queryItemText}>{t.transactionRecords}</Text>
          <Text style={styles.queryArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.queryItem}
          onPress={() => setCurrentView('contracts')}
        >
          <Text style={styles.queryItemText}>{t.myContracts}</Text>
          <Text style={styles.queryArrow}>›</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  )

  const renderAppointmentsView = () => (
    <View style={styles.subContainer}>
      <View style={styles.subHeader}>
        <TouchableOpacity onPress={() => setCurrentView('query')}>
          <Text style={styles.backText}>{t.back}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.myAppointments}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        {subscriptions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{t.noAppointments}</Text>
          </View>
        ) : (
          subscriptions.map((sub) => (
            <View key={sub.id} style={styles.recordCard}>
              <Text style={styles.recordName}>
                {lang === 'zh' ? sub.product.name_cn : sub.product.name_en}
              </Text>
              <View style={styles.recordDetails}>
                <View style={styles.recordDetailItem}>
                  <Text style={styles.recordDetailLabel}>{t.shares}</Text>
                  <Text style={styles.recordDetailValue}>{(sub.shares || 0).toFixed(2)}</Text>
                </View>
                <View style={styles.recordDetailItem}>
                  <Text style={styles.recordDetailLabel}>{t.date}</Text>
                  <Text style={styles.recordDetailValue}>{sub.created_at.split('T')[0]}</Text>
                </View>
                <View style={styles.recordDetailItem}>
                  <Text style={styles.recordDetailLabel}>{t.status}</Text>
                  <Text style={[styles.recordDetailValue, styles.statusText]}>
                    {sub.status === 'pending' ? t.pending : sub.status === 'completed' ? t.completed : t.failed}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  )

  const renderTransactionsView = () => (
    <View style={styles.subContainer}>
      <View style={styles.subHeader}>
        <TouchableOpacity onPress={() => setCurrentView('query')}>
          <Text style={styles.backText}>{t.back}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.transactionRecords}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        {transactions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{t.noTransactions}</Text>
          </View>
        ) : (
          transactions.map((tx) => (
            <View key={tx.id} style={styles.recordCard}>
              <Text style={styles.recordName}>
                {lang === 'zh' ? tx.product.name_cn : tx.product.name_en}
              </Text>
              <View style={styles.recordDetails}>
                <View style={styles.recordDetailItem}>
                  <Text style={styles.recordDetailLabel}>{t.type}</Text>
                  <Text style={styles.recordDetailValue}>
                    {tx.type === 'subscription' ? t.subscriptionType : t.redemptionType}
                  </Text>
                </View>
                <View style={styles.recordDetailItem}>
                  <Text style={styles.recordDetailLabel}>{t.shares}</Text>
                  <Text style={styles.recordDetailValue}>{(tx.shares || 0).toFixed(2)}</Text>
                </View>
                <View style={styles.recordDetailItem}>
                  <Text style={styles.recordDetailLabel}>{t.amount}</Text>
                  <Text style={styles.recordDetailValue}>¥{(tx.settlement_value || 0).toFixed(2)}</Text>
                </View>
                <View style={styles.recordDetailItem}>
                  <Text style={styles.recordDetailLabel}>{t.date}</Text>
                  <Text style={styles.recordDetailValue}>{tx.created_at.split('T')[0]}</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  )

  const renderContractsView = () => (
    <View style={styles.subContainer}>
      <View style={styles.subHeader}>
        <TouchableOpacity onPress={() => setCurrentView('query')}>
          <Text style={styles.backText}>{t.back}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.myContracts}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{t.noContracts}</Text>
        </View>
      </ScrollView>
    </View>
  )

  return (
    <View style={styles.container}>
      {/* 顶部头衔 */}
      <View style={styles.mainHeader}>
        <Text style={styles.title}>{t.title}</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconButton} onPress={() => console.log('搜索')}>
            <Text style={styles.icon}>🔍</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={() => console.log('客服')}>
            <Text style={styles.icon}>🎧</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* 交易功能按钮区域 */}
      {currentView === 'main' && (
        <View style={styles.tradeButtons}>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.functionButton} onPress={() => {
              console.log('申购申请 - 跳转到申购申请页面');
              onNavigateToSubscriptionApplication?.();
            }}>
              <Text style={styles.functionButtonIcon}>📥</Text>
              <Text style={styles.functionButtonText}>申购申请</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.functionButton} onPress={() => {
              console.log('赎回申请 - 跳转到赎回申请页面');
              // 这里不传入product参数，因为是从交易页面直接进入赎回申请页面
              onNavigateToRedemptionApplication?.({} as Product);
            }}>
              <Text style={styles.functionButtonIcon}>📤</Text>
              <Text style={styles.functionButtonText}>赎回申请</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.functionButton} onPress={() => {
              console.log('交易记录 - 跳转到交易记录页面');
              onNavigateToSubscriptionRedemptionRecords?.();
            }}>
              <Text style={styles.functionButtonIcon}>📋</Text>
              <Text style={styles.functionButtonText}>交易记录</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.functionButton} onPress={() => {
              console.log('合同签订 - 跳转到合同签订页面');
              onNavigateToContractSigning?.();
            }}>
              <Text style={styles.functionButtonIcon}>📝</Text>
              <Text style={styles.functionButtonText}>合同签订</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      {/* 内容滚动区域 */}
      <ScrollView style={styles.contentScrollView} showsVerticalScrollIndicator={false}>
        {currentView === 'main' && renderMainView()}
        {currentView === 'subscription' && renderSubscriptionView()}
        {currentView === 'redemption' && renderRedemptionView()}
        {currentView === 'positions' && renderPositionsView()}
        {currentView === 'query' && renderQueryView()}
        {currentView === 'appointments' && renderAppointmentsView()}
        {currentView === 'transactions' && renderTransactionsView()}
        {currentView === 'contracts' && renderContractsView()}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#f0f2f5', // 淡浅灰色
      padding: 12, // 缩小左右缝隙
    },
    mainHeader: {
      // 取消底色，使用app背景色
      paddingHorizontal: 12,
      paddingVertical: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    title: {
      color: '#333', // 黑色标题
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
    // 交易功能按钮样式
    tradeButtons: {
      backgroundColor: '#fff',
      padding: 16,
      marginBottom: 16,
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
    // 板块样式
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: '#333',
      marginBottom: 12,
    },
    sectionTitleContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    moreText: {
      fontSize: 14,
      color: '#1a73e8',
      fontWeight: '600',
    },
    sectionCard: {
      backgroundColor: '#fff',
      borderRadius: 12,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    // 我的余额样式
    balanceContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      gap: 12,
    },
    balanceItem: {
      flex: 1,
      minWidth: '45%',
      backgroundColor: '#f8f9fa',
      padding: 16,
      borderRadius: 8,
    },
    balanceLabel: {
      color: '#666',
      fontSize: 14,
      marginBottom: 8,
    },
    balanceValue: {
      color: '#333',
      fontSize: 18,
      fontWeight: '700',
    },
    // 资金状况样式
    fundStatusRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 16,
      gap: 12,
    },
    fundStatusItem: {
      flex: 1,
      backgroundColor: '#f8f9fa',
      padding: 16,
      borderRadius: 8,
    },
    fundStatusItemLeft: {
      marginRight: 6,
    },
    fundStatusItemRight: {
      marginLeft: 6,
    },
    emptyFundItem: {
      backgroundColor: 'transparent',
    },
    fundStatusLabel: {
      color: '#666',
      fontSize: 14,
      marginBottom: 8,
    },
    fundStatusValue: {
      color: '#333',
      fontSize: 18,
      fontWeight: '700',
    },
    profit: {
      color: '#4caf50',
    },
    // 操作按钮样式
    actionButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 24,
      gap: 16,
    },
    actionButton: {
      flex: 1,
      backgroundColor: '#188038',
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    actionButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    // 持仓卡片样式
    positionCard: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#f0f0f0',
    },
    positionHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    positionName: {
      fontSize: 16,
      fontWeight: '600',
      color: '#333',
    },
    positionFundNumber: {
      fontSize: 12,
      color: '#999',
      marginBottom: 12,
    },
    redemptionButton: {
      backgroundColor: '#f44336',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
    },
    redemptionButtonText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '600',
    },
    positionDetails: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    positionDetailItem: {
      alignItems: 'flex-start',
    },
    positionDetailLabel: {
      fontSize: 12,
      color: '#666',
      marginBottom: 2,
    },
    positionDetailValue: {
      fontSize: 14,
      fontWeight: '600',
      color: '#333',
    },
    // 记录卡片样式
    recordCard: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#f0f0f0',
    },
    recordHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    recordName: {
      fontSize: 16,
      fontWeight: '600',
      color: '#333',
    },
    recordType: {
      fontSize: 12,
      fontWeight: '600',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    subscriptionType: {
      backgroundColor: '#e8f5e8',
      color: '#4caf50',
    },
    redemptionType: {
      backgroundColor: '#ffebee',
      color: '#f44336',
    },
    recordDetails: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    recordDetailItem: {
      alignItems: 'flex-start',
    },
    recordDetailLabel: {
      fontSize: 12,
      color: '#666',
      marginBottom: 2,
    },
    recordDetailValue: {
      fontSize: 14,
      color: '#333',
    },
    statusText: {
      fontWeight: '600',
      color: '#1a73e8',
    },
    // 预约卡片样式
    appointmentCard: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#f0f0f0',
    },
    // Tab样式
    tabContainer: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: '#f0f0f0',
      marginBottom: 16,
    },
    tab: {
      flex: 1,
      paddingVertical: 12,
      alignItems: 'center',
    },
    activeTab: {
      borderBottomWidth: 2,
      borderBottomColor: '#1a73e8',
    },
    tabText: {
      fontSize: 14,
      color: '#666',
    },
    activeTabText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#1a73e8',
    },
    tabContent: {
      paddingVertical: 8,
    },
    // 子页面样式
    subContainer: {
      flex: 1,
      backgroundColor: '#f5f5f5',
    },
    subHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      backgroundColor: '#fff',
      borderBottomWidth: 1,
      borderBottomColor: '#e0e0e0',
    },
    backText: {
      fontSize: 16,
      color: '#1a73e8',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#333',
    },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  productInfo: {
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  productDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  changeButton: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#e3f2fd',
    borderRadius: 6,
    alignItems: 'center',
  },
  changeButtonText: {
    fontSize: 14,
    color: '#1a73e8',
    fontWeight: '600',
  },
  selectButton: {
    padding: 20,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1a73e8',
    borderStyle: 'dashed',
  },
  selectButtonText: {
    fontSize: 16,
    color: '#1a73e8',
    fontWeight: '600',
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  submitButton: {
    backgroundColor: '#1a73e8',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  // 查询页面样式
  queryItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  queryItemText: {
    fontSize: 16,
    color: '#333',
  },
  queryArrow: {
    fontSize: 24,
    color: '#999',
  },
  // 内容滚动区域样式
  contentScrollView: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
})
