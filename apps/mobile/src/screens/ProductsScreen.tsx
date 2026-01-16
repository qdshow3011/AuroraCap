import { useState, useEffect, useRef } from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, TouchableOpacity } from 'react-native'
import { supabase } from '../lib/supabase'
import ProductDetail from './ProductDetail'
import AssetStatusScreen from './AssetStatusScreen'
import { messageGenerator } from '../utils/message-generator'

// 我的资产类型定义
interface MyAssets {
  totalAssets: number
  fundValue: number
  cashBalance: number
  pendingFunds: number // 在途资金
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
  status: 'pending' | 'processing' | 'completed' | 'failed'
  created_at: string
  updated_at: string
  description?: string
}

export default function ProductsScreen({ lang = 'zh', demo = false, userInfo, onNavigateToAssetStatus, onNavigateToSubscriptionApplication, onNavigateToDepositService, onNavigateToCustomerService, onNavigateToWithdrawalApplication, onNavigateToFundTransactions }: { lang?: 'zh' | 'en'; demo?: boolean; userInfo?: any; onNavigateToAssetStatus?: () => void; onNavigateToSubscriptionApplication?: (product?: any) => void; onNavigateToDepositService?: () => void; onNavigateToCustomerService?: () => void; onNavigateToWithdrawalApplication?: () => void; onNavigateToFundTransactions?: () => void }) {
  const [products, setProducts] = useState<any[]>([])
  const [assets, setAssets] = useState<MyAssets | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  // 新增资金管理相关状态
  const [fundStatus, setFundStatus] = useState<FundStatus | null>(null)
  const [depositWithdrawals, setDepositWithdrawals] = useState<DepositWithdrawal[]>([])
  const [showFundManagement, setShowFundManagement] = useState(true)
  const [depositAmount, setDepositAmount] = useState('')
  const [withdrawalAmount, setWithdrawalAmount] = useState('')
  
  // 滚动相关ref
  const scrollViewRef = useRef<ScrollView>(null)
  const assetsSectionRef = useRef<View>(null)
  const fundManagementSectionRef = useRef<View>(null)
  const transactionsSectionRef = useRef<View>(null)

  // 数据加载函数
  const loadData = async () => {
    setLoading(true)
    try {
      // 加载产品数据
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

      if (productsError) throw productsError

      // 处理产品数据，确保每个产品都有sale_status字段
      const processedProducts = (productsData || []).map(product => ({
        ...product,
        // 如果sale_status字段不存在，设置默认值为'closed'
        sale_status: product.sale_status || 'closed'
      }))

      // 存储处理后的产品数据
      setProducts(processedProducts)

      // 从positions表读取登录用户的持仓数据
      if (userInfo && userInfo.id) {
        console.log('登录用户ID:', userInfo.id)
        
        // 获取持仓数据
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
        console.log('基金价值计算: 各持仓current_value累加 =', fundValue)
        
        // 从cash_balances表获取现金余额数据
        let cashBalance = 0
        let availableBalance = 0
        let totalDeposit = 0
        let totalWithdrawal = 0
        let pendingAmount = 0

        // 获取现金余额数据
        const { data: cashBalanceData, error: cashBalanceError } = await supabase
          .from('cash_balances')
          .select('*')
          .eq('user_id', userInfo.id)
        
        if (cashBalanceData && cashBalanceData.length > 0) {
          // 如果有现金余额记录，使用现有记录
          cashBalance = cashBalanceData[0].cash_balance
          availableBalance = cashBalanceData[0].cash_balance
          pendingAmount = cashBalanceData[0].pending_funds
          totalDeposit = cashBalanceData[0].total_deposits
          totalWithdrawal = cashBalanceData[0].total_withdrawals
        } else {
          console.log('未找到现金余额记录，创建新记录:', cashBalanceError)
          // 如果没有现金余额记录，创建一条初始记录
          console.log('Creating new cash balance record for user:', userInfo.id)
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
            cashBalance = newCashBalance[0].cash_balance
            availableBalance = newCashBalance[0].cash_balance
            pendingAmount = newCashBalance[0].pending_funds
            totalDeposit = newCashBalance[0].total_deposits
            totalWithdrawal = newCashBalance[0].total_withdrawals
            console.log('Using newly created cash balance record:', cashBalance, availableBalance, pendingAmount, totalDeposit, totalWithdrawal)
          } else {
            // 使用默认值
            console.log('Using default cash balance values')
            cashBalance = 100000.00
            availableBalance = 100000.00
            pendingAmount = 0.00
            totalDeposit = 100000.00
            totalWithdrawal = 0.00
          }
        }
        
        // 总资产 = 基金价值 + 现金余额
        const totalAssets = fundValue + cashBalance
        
        // 设置资金状况
        setFundStatus({
          availableBalance,
          totalDeposit,
          totalWithdrawal,
          pendingAmount
        })
        
        // 设置资产数据
        setAssets({
          totalAssets,
          fundValue,
          cashBalance,
          pendingFunds: pendingAmount // 设置在途资金
        })
        
        // 获取入金出金记录
        const { data: dwData, error: dwError } = await supabase
          .from('deposit_withdrawal')
          .select('*')
          .eq('user_id', userInfo.id)
          .order('created_at', { ascending: false })
          
        if (dwError) {
          console.error('获取入金出金记录失败:', dwError)
          setDepositWithdrawals([])
        } else {
          // 设置入金出金记录
          setDepositWithdrawals(dwData || [])
        }
        
        // 从subscription_redemption表读取登录用户的交易记录
        try {
          const { data: transactionsData, error: transactionsError } = await supabase
            .from('subscription_redemption')
            .select(`
              *,
              products (
                id,
                name_cn,
                name_en
              )
            `)
            .eq('user_id', userInfo.id)
            .order('created_at', { ascending: false })
          
          if (transactionsError) {
            console.error('获取交易记录失败:', transactionsError)
            setTransactions([])
          } else if (transactionsData && transactionsData.length > 0) {
            const formattedTransactions: Transaction[] = transactionsData.map((item: any) => {
              const product = item.products
              const productName = product 
                ? (lang === 'zh' ? product.name_cn : product.name_en) 
                : '未知产品'
              
              return {
                id: item.id,
                productName: productName,
                transactionType: item.type as 'subscription' | 'redemption',
                settlementValue: item.total_amount || (item.nav * item.shares),
                shares: item.shares,
                date: item.created_at ? item.created_at.split('T')[0] : ''
              }
            })
            setTransactions(formattedTransactions)
          } else {
            setTransactions([])
          }
        } catch (error) {
          console.error('查询交易记录时发生异常:', error)
          setTransactions([])
        }
      } else {
        // 没有登录用户信息，不显示数据
        setAssets(null)
        setFundStatus(null)
        setDepositWithdrawals([])
        setProducts([])
      }

    } catch (error) {
      console.error('Error loading data:', error)
      setError('无法加载数据，请检查网络连接或稍后重试')
    } finally {
      setLoading(false)
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
    productName: '产品名称',
    productCode: '产品代码',
    transactionType: '交易类型',
    buy: '买入',
    sell: '卖出',
    settlementValue: '结算价值',
    shares: '份额',
    date: '日期',
    viewDetails: '查看详情',
    riskLow: '低风险',
    riskMedium: '中风险',
    riskHigh: '高风险',
    // 新增资金管理相关翻译
    fundManagement: '资金管理',
    availableBalance: '可用余额',
    totalDeposit: '累计入金',
    totalWithdrawal: '累计出金',
    pendingAmount: '在途资金',
    deposit: '入金',
    withdrawal: '出金',
    depositAmount: '入金金额',
    withdrawalAmount: '出金金额',
    confirmDeposit: '确认入金',
    confirmWithdrawal: '确认出金',
    recentRecords: '最近记录',
    recordType: '记录类型',
    status: '状态',
    pending: '待处理',
    completed: '已完成',
    failed: '失败',
    saleStatus: '可售状态',
    openSale: '已开放',
    closedSale: '已售净'
  } : {
    assetsCenter: 'Asset Management Center',
    myAssets: 'My Asset Status',
    totalAssets: 'Total Assets',
    todayReturn: 'Today\'s Return',
    returnRate: 'Return Rate',
    investmentReview: 'Investment Review',
    fundProducts: 'Fund Products',
    historicalTransactions: 'My Transactions',
    productName: 'Product Name',
    productCode: 'Product Code',
    transactionType: 'Transaction Type',
    buy: 'Buy',
    sell: 'Sell',
    settlementValue: 'Settlement Value',
    shares: 'Shares',
    date: 'Date',
    viewDetails: 'View Details',
    riskLow: 'Low Risk',
    riskMedium: 'Medium Risk',
    riskHigh: 'High Risk',
    // 新增资金管理相关翻译
    fundManagement: 'Fund Management',
    availableBalance: 'Available Balance',
    totalDeposit: 'Total Deposit',
    totalWithdrawal: 'Total Withdrawal',
    pendingAmount: 'Pending Funds',
    deposit: 'Deposit',
    withdrawal: 'Withdrawal',
    depositAmount: 'Deposit Amount',
    withdrawalAmount: 'Withdrawal Amount',
    confirmDeposit: 'Confirm Deposit',
    confirmWithdrawal: 'Confirm Withdrawal',
    recentRecords: 'Recent Records',
    recordType: 'Record Type',
    status: 'Status',
    pending: 'Pending',
    completed: 'Completed',
    failed: 'Failed',
    saleStatus: 'Sale Status',
    openSale: 'Open',
    closedSale: 'Closed'
  }

  // 获取风险等级对应的颜色和文本
  const getRiskLevelInfo = (level: 'low' | 'medium' | 'high') => {
    switch (level) {
      case 'low':
        return { color: '#10b981', text: t.riskLow }
      case 'medium':
        return { color: '#f59e0b', text: t.riskMedium }
      case 'high':
        return { color: '#ef4444', text: t.riskHigh }
    }
  }

  // 处理查看详情
  const handleViewDetail = (productId: string) => {
    const product = products.find(p => p.id === productId)
    if (product) {
      setSelectedProduct(product)
    }
  }

  // 处理返回
  const handleBack = () => {
    setSelectedProduct(null)
  }

  // 更新用户现金余额到cash_balances表
  const updateCashBalance = async (userId: string, newBalance: number, type: 'deposit' | 'withdrawal' = 'deposit', amount: number = 0) => {
    try {
      // 首先获取当前现金余额记录
      const { data: cashBalanceData, error: getError } = await supabase
        .from('cash_balances')
        .select('*')
        .eq('user_id', userId)

      if (!cashBalanceData || cashBalanceData.length === 0) {
        console.error('获取现金余额记录失败:', getError)
        return
      }

      const existingBalance = cashBalanceData[0]
      let totalDeposits = existingBalance.total_deposits
      let totalWithdrawals = existingBalance.total_withdrawals

      // 根据交易类型更新累计入金或累计出金
      if (type === 'deposit') {
        totalDeposits += amount
      } else {
        totalWithdrawals += amount
      }

      // 更新现金余额表
      const { error: updateError } = await supabase
        .from('cash_balances')
        .update({
          cash_balance: newBalance,
          total_deposits: totalDeposits,
          total_withdrawals: totalWithdrawals
        })
        .eq('user_id', userId)

      if (updateError) {
        console.error('更新现金余额失败:', updateError)
      }
    } catch (error) {
      console.error('更新现金余额时发生异常:', error)
    }
  }

  // 处理入金
  const handleDeposit = async () => {
    if (!userInfo || !userInfo.id) {
      alert(lang === 'zh' ? '请先登录' : 'Please login first')
      return
    }

    const amount = parseFloat(depositAmount)
    if (isNaN(amount) || amount <= 0) {
      alert(lang === 'zh' ? '请输入有效的入金金额' : 'Please enter a valid deposit amount')
      return
    }

    try {
      // 1. 创建入金记录，状态为pending
      const { error: dwError } = await supabase
        .from('deposit_withdrawal')
        .insert({
          user_id: userInfo.id,
          type: 'deposit',
          amount: amount,
          status: 'pending', // 初始状态为待处理
          notes: '用户主动申请入金'
        })

      if (dwError) throw dwError

      // 生成入金消息通知
      await messageGenerator.generateFundTransactionMessage(
        userInfo.id,
        userInfo.nickname || userInfo.name || '极光用户',
        '入金'
      );

      alert(lang === 'zh' ? '入金申请已提交，请等待管理员审批' : 'Deposit application submitted, please wait for admin approval')
      setDepositAmount('')
      // 重新加载数据
      loadData()
    } catch (error) {
      console.error('入金申请失败:', error)
      alert(lang === 'zh' ? '入金申请失败，请稍后重试' : 'Deposit application failed, please try again later')
    }
  }

  // 处理出金
  const handleWithdrawal = async () => {
    if (!userInfo || !userInfo.id) {
      alert(lang === 'zh' ? '请先登录' : 'Please login first')
      return
    }

    const amount = parseFloat(withdrawalAmount)
    if (isNaN(amount) || amount <= 0) {
      alert(lang === 'zh' ? '请输入有效的出金金额' : 'Please enter a valid withdrawal amount')
      return
    }

    // 检查可用余额
    if (fundStatus && amount > fundStatus.availableBalance) {
      alert(lang === 'zh' ? '出金金额超过可用余额' : 'Withdrawal amount exceeds available balance')
      return
    }

    try {
      // 1. 创建出金记录，状态为pending
      const { error: dwError } = await supabase
        .from('deposit_withdrawal')
        .insert({
          user_id: userInfo.id,
          type: 'withdrawal',
          amount: amount,
          status: 'pending', // 初始状态为待处理
          notes: '用户主动申请出金'
        })

      if (dwError) throw dwError

      alert(lang === 'zh' ? '出金申请已提交，请等待管理员审批' : 'Withdrawal application submitted, please wait for admin approval')
      setWithdrawalAmount('')
      // 重新加载数据
      loadData()
    } catch (error) {
      console.error('出金申请失败:', error)
      alert(lang === 'zh' ? '出金申请失败，请稍后重试' : 'Withdrawal application failed, please try again later')
    }
  }

  if (loading) {
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

  // 如果选中了产品，显示详情页
  if (selectedProduct) {
    return <ProductDetail product={selectedProduct} lang={lang} onClose={handleBack} />
  }

  return (
    <View style={styles.container}>
      {/* 顶部头衔 */}
      <View style={styles.header}>
        <Text style={styles.title}>{t.assetsCenter}</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconButton} onPress={() => console.log('搜索')}>
            <Text style={styles.icon}>🔍</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={() => {
            console.log('客服按钮被点击，跳转到客服页面');
            onNavigateToCustomerService?.();
          }}>
            <Text style={styles.icon}>🎧</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 资管功能按钮区域 */}
      <View style={styles.assetManagementButtons}>
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.functionButton} onPress={() => {
            console.log('入金咨询 - 跳转客服模块');
            // 实际实现：跳转客服模块
            onNavigateToCustomerService?.();
          }}>
            <Text style={styles.functionButtonIcon}>💰</Text>
            <Text style={styles.functionButtonText}>入金咨询</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.functionButton} onPress={() => {
            console.log('出金申请 - 跳转出金申请页面');
            // 实际实现：跳转出金申请页面
            onNavigateToWithdrawalApplication?.();
          }}>
            <Text style={styles.functionButtonIcon}>🏦</Text>
            <Text style={styles.functionButtonText}>出金申请</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.functionButton} onPress={() => {
            console.log('资产状况 - 导航到资产状况页面');
            if (onNavigateToAssetStatus) {
              onNavigateToAssetStatus();
            } else {
              // 备用方案：如果没有提供导航函数，仍然滚动到资产板块
              assetsSectionRef.current?.measureLayout(
                scrollViewRef.current as any,
                (x, y) => {
                  scrollViewRef.current?.scrollTo({ y: y, animated: true });
                },
                () => console.error('测量失败')
              );
            }
          }}>
            <Text style={styles.functionButtonIcon}>📊</Text>
            <Text style={styles.functionButtonText}>资产状况</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.functionButton} onPress={() => {
            console.log('资金往来 - 跳转到资金往来页面');
            // 实际实现：跳转到资金往来页面
            onNavigateToFundTransactions?.();
          }}>
            <Text style={styles.functionButtonIcon}>💹</Text>
            <Text style={styles.functionButtonText}>资金往来</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 内容滚动区域 */}
      <ScrollView ref={scrollViewRef} style={styles.contentScrollView} showsVerticalScrollIndicator={false}>
        {/* 1. 我的资产板块 */}
        <View ref={assetsSectionRef} style={styles.section}>
          {assets && (
            <View style={styles.assetsContainer}>
              {/* 区块内部标题和更多按钮 */}
              <View style={styles.assetsHeader}>
                <Text style={styles.assetsTitle}>{t.myAssets}</Text>
                <TouchableOpacity onPress={() => {
                  console.log('我的资产 - 点击更多按钮');
                  if (onNavigateToAssetStatus) {
                    onNavigateToAssetStatus();
                  }
                }}>
                  <Text style={styles.moreButton}>更多&gt;&gt;</Text>
                </TouchableOpacity>
              </View>
              
              {/* 总资产 */}
              <View style={styles.assetItem}>
                <Text style={styles.assetLabel}>{t.totalAssets}</Text>
                <Text style={styles.assetValue}>¥{assets.totalAssets.toFixed(2)}</Text>
              </View>
              
              {/* 基金价值 */}
              <View style={styles.assetItem}>
                <Text style={styles.assetLabel}>基金价值</Text>
                <Text style={styles.assetValue}>¥{assets.fundValue.toFixed(2)}</Text>
              </View>
              
              {/* 现金余额 */}
              <View style={styles.assetItem}>
                <Text style={styles.assetLabel}>现金余额</Text>
                <Text style={styles.assetValue}>¥{assets.cashBalance.toFixed(2)}</Text>
              </View>
              
              {/* 在途资金 */}
              <View style={styles.assetItem}>
                <Text style={styles.assetLabel}>在途资金</Text>
                <Text style={styles.assetValue}>¥{assets.pendingFunds.toFixed(2)}</Text>
              </View>
            </View>
          )}
        </View>

        {/* 2. 资金往来最新记录 */}
        <View style={styles.section}>
          <View style={styles.fundsRecordsContainer}>
            {/* 区块标题和更多按钮 */}
            <View style={styles.recordsHeader}>
              <Text style={styles.recordsTitle}>资金往来最新记录</Text>
              <TouchableOpacity onPress={() => {
                console.log('查看更多资金往来记录');
                onNavigateToFundTransactions?.();
              }}>
                <Text style={styles.moreButton}>更多&gt;&gt;</Text>
              </TouchableOpacity>
            </View>
            
            {/* 记录列表 */}
            {depositWithdrawals.length === 0 ? (
              <View style={styles.emptyRecordsContainer}>
                <Text style={styles.emptyRecordsText}>
                  {lang === 'zh' ? '暂无入金出金记录' : 'No deposit/withdrawal records yet'}
                </Text>
              </View>
            ) : (
              <View style={styles.recordsList}>
                {/* 只显示3条记录 */}
                {depositWithdrawals.slice(0, 3).map((record) => (
                  <View key={record.id} style={styles.recordItem}>
                    <View style={styles.recordHeader}>
                      <Text style={styles.recordType}>
                        {record.type === 'deposit' ? t.deposit : t.withdrawal}
                      </Text>
                      <Text style={[styles.recordAmount, record.type === 'deposit' ? styles.depositAmount : styles.withdrawalAmount]}>
                        {record.type === 'deposit' ? '+' : '-' }¥{record.amount.toFixed(2)}
                      </Text>
                    </View>
                    <View style={styles.recordDetails}>
                      <Text style={styles.recordStatus}>
                        {record.status === 'pending' ? t.pending : record.status === 'processing' ? (lang === 'zh' ? '正在办理中' : 'Processing') : record.status === 'completed' ? t.completed : t.failed}
                      </Text>
                      <Text style={styles.recordDate}>
                        {new Date(record.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* 3. 基金产品板块 */}
        <View style={styles.section}>
          {products.length > 0 ? (
            <View style={styles.fundProductsContainer}>
              {/* 区块内部标题 */}
              <Text style={styles.fundProductsTitle}>{t.fundProducts}</Text>
              
              {/* 基金产品列表（无独立卡片） */}
              <View style={styles.fundProductsList}>
                {products.map((product) => {
                  const productName = lang === 'zh' ? product.name_cn : product.name_en || product.name_cn
                  const returnRate = product.annual_return || 0
                  const riskLevel = (product.risk_level || 'medium') as 'low' | 'medium' | 'high'
                  const nav = product.net_asset_value || 1.0
                  const riskInfo = getRiskLevelInfo(riskLevel)
                  
                  return (
                    <View key={product.id} style={styles.fundProductItem}>
                      {/* 基金产品信息 */}
                      <View style={styles.fundProductInfo}>
                        <Pressable onPress={() => handleViewDetail(product.id)}>
                          <Text style={styles.productName}>{productName}</Text>
                        </Pressable>
                        
                        <View style={styles.productDetails}>
                          <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>风险等级</Text>
                            <Text style={[styles.detailValue, { color: riskInfo.color }]}>
                              {riskInfo.text}
                            </Text>
                          </View>
                          <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>单位净值</Text>
                            <Text style={styles.detailValue}>¥{nav.toFixed(2)}</Text>
                          </View>
                          <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>年化收益</Text>
                            <Text style={[styles.returnRate, returnRate > 0 ? styles.positiveReturn : styles.negativeReturn]}>
                              {returnRate > 0 ? '+' : ''}{returnRate}%
                            </Text>
                          </View>
                          <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>{t.saleStatus}</Text>
                            <Text style={[
                              styles.detailValue,
                              (product.sale_status || '') === 'open' ? { color: '#188038' } : { color: '#d93025' }
                            ]}>
                              {(product.sale_status || '') === 'open' ? t.openSale : t.closedSale}
                            </Text>
                          </View>
                        </View>
                      </View>
                      
                      {/* 申请申购按钮 */}
                      <TouchableOpacity style={styles.subscribeButton} onPress={() => {
                        console.log('申请申购:', productName);
                        if (onNavigateToSubscriptionApplication) {
                          onNavigateToSubscriptionApplication(product);
                        }
                      }}>
                        <Text style={styles.subscribeButtonText}>申请申购</Text>
                      </TouchableOpacity>
                    </View>
                  )
                })}
              </View>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{lang === 'zh' ? '暂无基金产品' : 'No fund products yet'}</Text>
            </View>
          )}
        </View>

        {/* 底部留白 */}
        <View style={{ height: 80 }} />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f2f5', // 淡浅灰色
  },
  loadingText: {
    color: '#333',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f2f5', // 淡浅灰色
    padding: 12, // 缩小左右缝隙
  },
  errorText: {
    color: '#d93025',
    fontSize: 16,
    textAlign: 'center',
  },
  header: {
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
  // 资管功能按钮样式
  assetManagementButtons: {
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
  subtitle: {
    color: '#666',
    fontSize: 16,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    color: '#333',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  assetsContainer: {
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
  // 资产区块内部标题
  assetsTitle: {
    color: '#333',
    fontSize: 18,
    fontWeight: '600',
  },
  // 资产区块标题栏
  assetsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },

  assetItem: {
    marginBottom: 20,
  },
  assetLabel: {
    color: '#666',
    fontSize: 16,
    marginBottom: 8,
  },
  assetValue: {
    color: '#333',
    fontSize: 24,
    fontWeight: '700',
  },
  investmentReview: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  reviewLabel: {
    color: '#666',
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  reviewText: {
    color: '#333',
    fontSize: 14,
    lineHeight: 20,
  },
  productList: {
    gap: 16,
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  productName: {
    color: '#333',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  productCode: {
    color: '#999',
    fontSize: 12,
  },
  returnRate: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 2,
  },
  positiveReturn: {
    color: '#d93025',
  },
  negativeReturn: {
    color: '#188038',
  },
  productDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  detailItem: {
    width: '30%', // 调整宽度，允许每行显示3个详情项
  },
  detailLabel: {
    color: '#999',
    fontSize: 12,
    marginBottom: 4,
  },
  detailValue: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
  },
  transactionsContainer: {
    gap: 12,
  },
  emptyTransactionsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTransactionsText: {
    color: '#999',
    fontSize: 14,
  },
  transactionItem: {
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
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  transactionProductName: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  transactionProductCode: {
    color: '#999',
    fontSize: 12,
  },
  transactionType: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 16,
    fontSize: 12,
    fontWeight: '600',
  },
  buyType: {
    backgroundColor: '#e6f4ea',
    color: '#188038',
  },
  sellType: {
    backgroundColor: '#fde8e9',
    color: '#d93025',
  },
  transactionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  transactionDetailItem: {
    width: '30%',
  },
  transactionDetailLabel: {
    color: '#999',
    fontSize: 12,
    marginBottom: 4,
  },
  transactionDetailValue: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
  },
  // 资金往来记录样式
  fundsRecordsContainer: {
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
  recordsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  recordsTitle: {
    color: '#333',
    fontSize: 18,
    fontWeight: '600',
  },
  moreButton: {
    color: '#188038',
    fontSize: 14,
    fontWeight: '500',
  },
  recordsList: {
    gap: 12,
  },
  recordItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recordType: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  recordAmount: {
    fontSize: 18,
    fontWeight: '700',
  },
  depositAmount: {
    color: '#188038',
  },
  withdrawalAmount: {
    color: '#d93025',
  },
  recordDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recordStatus: {
    fontSize: 14,
    color: '#666',
  },
  recordDate: {
    fontSize: 14,
    color: '#999',
  },
  emptyRecordsContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyRecordsText: {
    color: '#999',
    fontSize: 14,
  },
  // 基金产品新样式
  fundProductsContainer: {
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
  fundProductsTitle: {
    color: '#333',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  fundProductsList: {
    gap: 12,
  },
  fundProductItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  fundProductInfo: {
    flex: 1,
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
  // 内容滚动区域样式
  contentScrollView: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  // 空状态样式
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
})