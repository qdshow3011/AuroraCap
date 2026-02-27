import { useState, useEffect, useRef } from 'react'
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Pressable, 
  TextInput, 
  Alert, 
  ActivityIndicator, 
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { supabase } from '../lib/supabase'
import { messageGenerator } from '../utils/message-generator'

export default function WithdrawalApplicationScreen({ 
  lang = 'zh', 
  onClose, 
  onSuccess, 
  userInfo, 
  onNavigateToCustomerService, 
  onNavigateToAssetStatus, 
  onNavigateToFundTransactions 
}: { 
  lang?: 'zh' | 'en'; 
  onClose: () => void; 
  onSuccess: (withdrawalId: string) => void; 
  userInfo?: any; 
  onNavigateToCustomerService?: () => void; 
  onNavigateToAssetStatus?: () => void; 
  onNavigateToFundTransactions?: () => void;
}) {
  const insets = useSafeAreaInsets()
  
  // 状态管理
  const [withdrawalAmount, setWithdrawalAmount] = useState('')
  const [confirmWithdrawalAmount, setConfirmWithdrawalAmount] = useState('')
  const [availableBalance, setAvailableBalance] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [withdrawalHistory, setWithdrawalHistory] = useState<any[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [focusedInput, setFocusedInput] = useState<string | null>(null)
  
  // 滚动相关ref
  const scrollViewRef = useRef<ScrollView>(null)

  // 语言翻译
  const t = lang === 'zh' ? {
    title: '出金申请',
    availableBalance: '可用余额',
    withdrawalAmount: '出金金额',
    confirmWithdrawalAmount: '确认出金金额',
    submit: '提交申请',
    submitting: '提交中...',
    success: '出金申请提交成功',
    error: '提交失败',
    pleaseEnterAmount: '请输入出金金额',
    pleaseConfirmAmount: '请确认出金金额',
    amountsMismatch: '两次输入的出金金额不一致',
    invalidAmount: '请输入有效的出金金额',
    insufficientBalance: '可用余额不足',
    history: '出金历史',
    noHistory: '暂无出金记录',
    amount: '金额',
    status: '状态',
    createdAt: '申请时间',
    pending: '待处理',
    processing: '正在处理',
    processed: '已处理',
    completed: '已完成',
    failed: '失败',
    cancelled: '已取消',
    // 资管功能按钮翻译
    depositService: '入金咨询',
    withdrawalApplication: '出金申请',
    assetStatus: '资产状况',
    fundTransactions: '资金往来',
    required: '必填',
    note: '出金申请提交后，客服将在1-3个工作日内处理您的申请，请确保您的银行账户信息准确无误。',
    all: '全部',
    half: '50%',
    max: '最大可出金'
  } : {
    title: 'Withdrawal Application',
    availableBalance: 'Available Balance',
    withdrawalAmount: 'Withdrawal Amount',
    confirmWithdrawalAmount: 'Confirm Withdrawal Amount',
    submit: 'Submit Application',
    submitting: 'Submitting...',
    success: 'Withdrawal application submitted successfully',
    error: 'Submission failed',
    pleaseEnterAmount: 'Please enter withdrawal amount',
    pleaseConfirmAmount: 'Please confirm withdrawal amount',
    amountsMismatch: 'The two entered withdrawal amounts do not match',
    invalidAmount: 'Please enter a valid withdrawal amount',
    insufficientBalance: 'Insufficient balance',
    history: 'Withdrawal History',
    noHistory: 'No withdrawal records',
    amount: 'Amount',
    status: 'Status',
    createdAt: 'Created At',
    pending: 'Pending',
    processing: 'Processing',
    processed: 'Processed',
    completed: 'Completed',
    failed: 'Failed',
    cancelled: 'Cancelled',
    // 资管功能按钮翻译
    depositService: 'Deposit Consultation',
    withdrawalApplication: 'Withdrawal Application',
    assetStatus: 'Asset Status',
    fundTransactions: 'Fund Transactions',
    required: 'Required',
    note: 'After submitting the withdrawal application, customer service will process your request within 1-3 business days. Please ensure your bank account information is accurate.',
    all: 'All',
    half: '50%',
    max: 'Max Available'
  }

  // 加载可用余额和出金历史
  const loadData = async (isRefresh: boolean = false) => {
    if (!userInfo || !userInfo.id) {
      setLoading(false)
      setRefreshing(false)
      return
    }

    setLoading(isRefresh ? false : true)
    setRefreshing(isRefresh)
    try {
      // 获取可用余额
      const { data: cashBalanceData, error: cashBalanceError } = await supabase
        .from('cash_balances')
        .select('*')
        .eq('user_id', userInfo.id)
        .single()

      if (cashBalanceError) {
        console.error('获取可用余额失败:', cashBalanceError)
        setAvailableBalance(0)
      } else {
        setAvailableBalance(cashBalanceData?.cash_balance || 0)
      }

      // 获取出金历史
      const { data: historyData, error: historyError } = await supabase
        .from('deposit_withdrawal')
        .select('*')
        .eq('user_id', userInfo.id)
        .eq('type', 'withdrawal')
        .order('created_at', { ascending: false })

      if (historyError) {
        console.error('获取出金历史失败:', historyError)
        setWithdrawalHistory([])
      } else {
        setWithdrawalHistory(historyData || [])
      }
    } catch (error) {
      console.error('加载数据失败:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [userInfo])

  // 下拉刷新
  const handleRefresh = () => {
    loadData(true)
  }

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString(lang === 'zh' ? 'zh-CN' : 'en-US')
  }

  // 格式化金额（千分位）
  const formatAmount = (amount: number) => {
    return amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#FF9800'
      case 'processing':
        return '#2196F3'
      case 'processed':
      case 'completed':
        return '#4CAF50'
      case 'failed':
        return '#F44336'
      case 'cancelled':
        return '#9E9E9E'
      default:
        return '#FF9800'
    }
  }

  // 获取状态背景色
  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#FFF3E0'
      case 'processing':
        return '#E3F2FD'
      case 'processed':
      case 'completed':
        return '#E8F5E9'
      case 'failed':
        return '#FFEBEE'
      case 'cancelled':
        return '#F5F5F5'
      default:
        return '#FFF3E0'
    }
  }

  // 快速选择金额
  const handleQuickAmount = (ratio: number) => {
    const amount = availableBalance * ratio
    setWithdrawalAmount(amount.toFixed(2))
    setConfirmWithdrawalAmount('')
  }

  // 处理出金申请提交
  const handleSubmit = async () => {
    if (!userInfo || !userInfo.id) {
      Alert.alert(lang === 'zh' ? '错误' : 'Error', lang === 'zh' ? '用户信息不存在' : 'User information not found')
      return
    }

    // 表单验证
    if (!withdrawalAmount) {
      Alert.alert(lang === 'zh' ? '提示' : 'Tips', t.pleaseEnterAmount)
      return
    }

    if (!confirmWithdrawalAmount) {
      Alert.alert(lang === 'zh' ? '提示' : 'Tips', t.pleaseConfirmAmount)
      return
    }

    const amount = parseFloat(withdrawalAmount)
    const confirmAmount = parseFloat(confirmWithdrawalAmount)

    if (isNaN(amount) || amount <= 0) {
      Alert.alert(lang === 'zh' ? '提示' : 'Tips', t.invalidAmount)
      return
    }

    if (amount !== confirmAmount) {
      Alert.alert(lang === 'zh' ? '提示' : 'Tips', t.amountsMismatch)
      return
    }

    if (amount > availableBalance) {
      Alert.alert(lang === 'zh' ? '提示' : 'Tips', t.insufficientBalance)
      return
    }

    setSubmitting(true)
    try {
      // 提交出金申请到数据库
      const { data, error } = await supabase
        .from('deposit_withdrawal')
        .insert({
          user_id: userInfo.id,
          type: 'withdrawal',
          amount: amount,
          status: 'pending',
          notes: '用户主动申请出金'
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      // 通知客服（这里只是记录日志，实际项目中可以集成推送或邮件通知）
      console.log(`新的出金申请：用户 ${userInfo.id} 申请出金 ${amount} 元，申请ID：${data.id}`)

      // 生成出金消息通知
      await messageGenerator.generateFundTransactionMessage(
        userInfo.id,
        userInfo.nickname || userInfo.name || '极光用户',
        '出金'
      );

      // 提交成功，调用回调函数
      onSuccess(data.id)
    } catch (error) {
      console.error('出金申请提交失败:', error)
      Alert.alert(lang === 'zh' ? '错误' : 'Error', t.error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A4EA2" />
      
      {/* 渐变头部 */}
      <LinearGradient
        colors={['#1A4EA2', '#0D3A8A']}
        style={[styles.header, { paddingTop: insets.top > 0 ? insets.top : 16 }]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={onClose}>
            <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t.title}</Text>
          <TouchableOpacity style={styles.helpButton} onPress={() => onNavigateToCustomerService?.()}>
            <Ionicons name="headset-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView 
        style={styles.keyboardView} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* 资管功能按钮区域 */}
        <View style={styles.functionButtonsContainer}>
          <View style={styles.functionButtons}>
            <TouchableOpacity 
              style={styles.functionButton} 
              onPress={() => {
                console.log('入金咨询 - 跳转客服模块');
                onNavigateToCustomerService?.();
              }}
            >
              <View style={styles.functionIconContainer}>
                <Ionicons name="add-circle" size={20} color="#666666" />
              </View>
              <Text style={styles.functionButtonText}>{t.depositService}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.functionButton, styles.activeFunctionButton]} 
              onPress={() => {
                console.log('出金申请 - 当前页面');
              }}
            >
              <View style={[styles.functionIconContainer, { backgroundColor: '#1A4EA2' }]}>
                <Ionicons name="remove-circle" size={20} color="#FFFFFF" />
              </View>
              <Text style={[styles.functionButtonText, styles.activeFunctionButtonText]}>{t.withdrawalApplication}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.functionButton} 
              onPress={() => {
                console.log('资产状况 - 导航到资产状况页面');
                onNavigateToAssetStatus?.();
              }}
            >
              <View style={styles.functionIconContainer}>
                <Ionicons name="pie-chart" size={20} color="#666666" />
              </View>
              <Text style={styles.functionButtonText}>{t.assetStatus}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.functionButton} 
              onPress={() => {
                console.log('资金往来 - 跳转到资金往来页面');
                onNavigateToFundTransactions?.();
              }}
            >
              <View style={styles.functionIconContainer}>
                <Ionicons name="swap-horizontal" size={20} color="#666666" />
              </View>
              <Text style={styles.functionButtonText}>{t.fundTransactions}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 内容滚动区域 */}
        <ScrollView 
          ref={scrollViewRef} 
          style={styles.contentScrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#1A4EA2" />
              <Text style={styles.loadingText}>{lang === 'zh' ? '加载中...' : 'Loading...'}</Text>
            </View>
          ) : (
            <>
              {/* 可用余额卡片 */}
              <View style={styles.balanceCard}>
                <LinearGradient
                  colors={['#1A4EA2', '#0D3A8A']}
                  style={styles.balanceGradient}
                >
                  <View style={styles.balanceHeader}>
                    <Ionicons name="wallet-outline" size={20} color="rgba(255,255,255,0.8)" />
                    <Text style={styles.balanceLabel}>{t.availableBalance}</Text>
                  </View>
                  <View style={styles.balanceContent}>
                    <Text style={styles.balanceSymbol}>¥</Text>
                    <Text style={styles.balanceValue}>{formatAmount(availableBalance)}</Text>
                  </View>
                  <View style={styles.balanceFooter}>
                    <Text style={styles.balanceHint}>{t.max}: ¥{formatAmount(availableBalance)}</Text>
                  </View>
                </LinearGradient>
              </View>

              {/* 出金金额输入表单 */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Ionicons name="cash-outline" size={20} color="#1A4EA2" />
                  <Text style={styles.cardTitle}>{t.withdrawalAmount}</Text>
                  <Text style={styles.requiredBadge}>{t.required}</Text>
                </View>
                <View style={[
                  styles.amountInputContainer,
                  focusedInput === 'amount' && styles.amountInputContainerFocused
                ]}>
                  <Text style={styles.currencySymbol}>¥</Text>
                  <TextInput
                    style={styles.amountInput}
                    placeholder={lang === 'zh' ? '请输入出金金额' : 'Please enter withdrawal amount'}
                    placeholderTextColor="#999999"
                    keyboardType="decimal-pad"
                    value={withdrawalAmount}
                    onChangeText={setWithdrawalAmount}
                    editable={!submitting}
                    onFocus={() => setFocusedInput('amount')}
                    onBlur={() => setFocusedInput(null)}
                  />
                </View>
                
                {/* 快速选择按钮 */}
                <View style={styles.quickAmountContainer}>
                  <TouchableOpacity 
                    style={styles.quickAmountButton}
                    onPress={() => handleQuickAmount(1)}
                    disabled={submitting}
                  >
                    <Text style={styles.quickAmountText}>{t.all}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.quickAmountButton}
                    onPress={() => handleQuickAmount(0.5)}
                    disabled={submitting}
                  >
                    <Text style={styles.quickAmountText}>{t.half}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* 确认出金金额输入 */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Ionicons name="checkmark-circle-outline" size={20} color="#1A4EA2" />
                  <Text style={styles.cardTitle}>{t.confirmWithdrawalAmount}</Text>
                  <Text style={styles.requiredBadge}>{t.required}</Text>
                </View>
                <View style={[
                  styles.amountInputContainer,
                  focusedInput === 'confirmAmount' && styles.amountInputContainerFocused
                ]}>
                  <Text style={styles.currencySymbol}>¥</Text>
                  <TextInput
                    style={styles.amountInput}
                    placeholder={lang === 'zh' ? '请再次输入出金金额' : 'Please enter withdrawal amount again'}
                    placeholderTextColor="#999999"
                    keyboardType="decimal-pad"
                    value={confirmWithdrawalAmount}
                    onChangeText={setConfirmWithdrawalAmount}
                    editable={!submitting}
                    onFocus={() => setFocusedInput('confirmAmount')}
                    onBlur={() => setFocusedInput(null)}
                  />
                </View>
              </View>

              {/* 提示信息 */}
              <View style={styles.infoCard}>
                <View style={styles.infoIconWrapper}>
                  <Ionicons name="information-circle" size={24} color="#1A4EA2" />
                </View>
                <Text style={styles.infoText}>{t.note}</Text>
              </View>

              {/* 提交按钮 */}
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={submitting || !withdrawalAmount || !confirmWithdrawalAmount}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={(submitting || !withdrawalAmount || !confirmWithdrawalAmount) 
                    ? ['#CCCCCC', '#999999'] 
                    : ['#1A4EA2', '#0D3A8A']}
                  style={styles.submitButton}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {submitting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitButtonText}>{t.submit}</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* 出金历史记录 */}
              <View style={styles.historyCard}>
                <View style={styles.cardHeader}>
                  <Ionicons name="time-outline" size={20} color="#1A4EA2" />
                  <Text style={styles.cardTitle}>{t.history}</Text>
                </View>
                
                {withdrawalHistory.length > 0 ? (
                  <View style={styles.historyList}>
                    {withdrawalHistory.map((item, index) => (
                      <View key={item.id} style={[
                        styles.historyItem,
                        index === withdrawalHistory.length - 1 && styles.historyItemLast
                      ]}>
                        <View style={styles.historyItemLeft}>
                          <View style={styles.historyAmountContainer}>
                            <Text style={styles.historyAmount}>¥{formatAmount(item.amount)}</Text>
                            <View style={[
                              styles.statusBadge, 
                              { backgroundColor: getStatusBgColor(item.status) }
                            ]}>
                              <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
                              <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                                {t[item.status as keyof typeof t]}
                              </Text>
                            </View>
                          </View>
                          <Text style={styles.historyDate}>{formatDate(item.created_at)}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#CCCCCC" />
                      </View>
                    ))}
                  </View>
                ) : (
                  <View style={styles.emptyHistory}>
                    <Ionicons name="document-text-outline" size={48} color="#CCCCCC" />
                    <Text style={styles.noHistoryText}>{t.noHistory}</Text>
                  </View>
                )}
              </View>
            </>
          )}
          
          {/* 底部留白 */}
          <View style={{ height: 30 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  keyboardView: {
    flex: 1,
  },
  // 头部样式
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  helpButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  // 功能按钮样式
  functionButtonsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F5F7FA',
  },
  functionButtons: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  functionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeFunctionButton: {
    // 激活状态的额外样式
  },
  functionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F5F7FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  functionButtonText: {
    fontSize: 11,
    color: '#666666',
    fontWeight: '500',
  },
  activeFunctionButtonText: {
    color: '#1A4EA2',
    fontWeight: '600',
  },
  // 滚动区域
  contentScrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  // 加载样式
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    color: '#999999',
    fontSize: 14,
    marginTop: 12,
  },
  // 余额卡片
  balanceCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#1A4EA2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  balanceGradient: {
    padding: 20,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginLeft: 8,
  },
  balanceContent: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  balanceSymbol: {
    fontSize: 24,
    fontWeight: '500',
    color: '#FFFFFF',
    marginRight: 4,
  },
  balanceValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  balanceFooter: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  balanceHint: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  // 卡片样式
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333333',
    marginLeft: 8,
    flex: 1,
  },
  requiredBadge: {
    fontSize: 12,
    color: '#F44336',
    fontWeight: '500',
  },
  // 金额输入样式
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    backgroundColor: '#FAFAFA',
  },
  amountInputContainerFocused: {
    borderColor: '#1A4EA2',
    backgroundColor: '#FFFFFF',
    shadowColor: '#1A4EA2',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 22,
    fontWeight: '600',
    color: '#333333',
  },
  // 快速选择按钮
  quickAmountContainer: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  quickAmountButton: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    alignItems: 'center',
  },
  quickAmountText: {
    fontSize: 14,
    color: '#1A4EA2',
    fontWeight: '600',
  },
  // 信息卡片样式
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#1A4EA2',
  },
  infoIconWrapper: {
    marginRight: 12,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1565C0',
    lineHeight: 20,
  },
  // 提交按钮样式
  submitButton: {
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#1A4EA2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // 历史记录卡片
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  historyList: {
    // 历史列表
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  historyItemLast: {
    borderBottomWidth: 0,
  },
  historyItemLeft: {
    flex: 1,
  },
  historyAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  historyAmount: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333333',
    marginRight: 10,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  historyDate: {
    fontSize: 13,
    color: '#999999',
  },
  emptyHistory: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noHistoryText: {
    textAlign: 'center',
    color: '#999999',
    fontSize: 14,
    marginTop: 12,
  },
})
