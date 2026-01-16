import { useState, useEffect, useRef } from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert, ActivityIndicator, TouchableOpacity } from 'react-native'
import { supabase } from '../lib/supabase'
import { messageGenerator } from '../utils/message-generator'

export default function WithdrawalApplicationScreen({ lang = 'zh', onClose, onSuccess, userInfo, onNavigateToCustomerService, onNavigateToAssetStatus, onNavigateToFundTransactions }: { lang?: 'zh' | 'en'; onClose: () => void; onSuccess: (withdrawalId: string) => void; userInfo?: any; onNavigateToCustomerService?: () => void; onNavigateToAssetStatus?: () => void; onNavigateToFundTransactions?: () => void }) {
  // 状态管理
  const [withdrawalAmount, setWithdrawalAmount] = useState('')
  const [confirmWithdrawalAmount, setConfirmWithdrawalAmount] = useState('')
  const [availableBalance, setAvailableBalance] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [withdrawalHistory, setWithdrawalHistory] = useState<any[]>([])
  const [refreshing, setRefreshing] = useState(false)
  
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
    <View style={styles.container}>
      {/* 顶部头衔 */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backButton} onPress={onClose}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{t.title}</Text>
        </View>
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
            onNavigateToCustomerService?.();
          }}>
            <Text style={styles.functionButtonIcon}>💰</Text>
            <Text style={styles.functionButtonText}>{t.depositService}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.functionButton, styles.activeButton]} onPress={() => {
            console.log('出金申请 - 当前页面');
          }}>
            <Text style={styles.functionButtonIcon}>🏦</Text>
            <Text style={[styles.functionButtonText, styles.activeButtonText]}>{t.withdrawalApplication}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.functionButton} onPress={() => {
            console.log('资产状况 - 导航到资产状况页面');
            onNavigateToAssetStatus?.();
          }}>
            <Text style={styles.functionButtonIcon}>📊</Text>
            <Text style={styles.functionButtonText}>{t.assetStatus}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.functionButton} onPress={() => {
            console.log('资金往来 - 跳转到资金往来页面');
            onNavigateToFundTransactions?.();
          }}>
            <Text style={styles.functionButtonIcon}>💹</Text>
            <Text style={styles.functionButtonText}>{t.fundTransactions}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 内容滚动区域 */}
      <ScrollView 
        ref={scrollViewRef} 
        style={styles.contentScrollView} 
        showsVerticalScrollIndicator={false}
      >
        {/* 内容区域 */}
        <View style={styles.content}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#188038" />
              <Text style={styles.loadingText}>{lang === 'zh' ? '加载中...' : 'Loading...'}</Text>
            </View>
          ) : (
            <>
              {/* 可用余额 */}
              <View style={styles.balanceContainer}>
                <Text style={styles.balanceLabel}>{t.availableBalance}</Text>
                <Text style={styles.balanceValue}>¥{availableBalance.toFixed(2)}</Text>
              </View>

              {/* 出金金额输入表单 */}
              <View style={styles.formContainer}>
                <View style={styles.formItem}>
                  <Text style={styles.formLabel}>{t.withdrawalAmount}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={lang === 'zh' ? '请输入出金金额' : 'Please enter withdrawal amount'}
                    placeholderTextColor="#999"
                    keyboardType="numeric"
                    value={withdrawalAmount}
                    onChangeText={setWithdrawalAmount}
                  />
                </View>

                <View style={styles.formItem}>
                  <Text style={styles.formLabel}>{t.confirmWithdrawalAmount}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={lang === 'zh' ? '请再次输入出金金额' : 'Please enter withdrawal amount again'}
                    placeholderTextColor="#999"
                    keyboardType="numeric"
                    value={confirmWithdrawalAmount}
                    onChangeText={setConfirmWithdrawalAmount}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                  onPress={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.submitButtonText}>{t.submit}</Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* 出金历史记录 */}
              <View style={styles.historyContainer}>
                <Text style={styles.historyTitle}>{t.history}</Text>
                {withdrawalHistory.length > 0 ? (
                  <View style={styles.historyList}>
                    {withdrawalHistory.map((item) => (
                      <View key={item.id} style={styles.historyItem}>
                        <View style={styles.historyItemLeft}>
                          <Text style={styles.historyAmount}>¥{item.amount.toFixed(2)}</Text>
                          <Text style={styles.historyDate}>{formatDate(item.created_at)}</Text>
                        </View>
                        <View style={[styles.statusBadge, 
                          item.status === 'pending' ? styles.statusPending : 
                          item.status === 'processing' ? styles.statusProcessing : 
                          item.status === 'processed' ? styles.statusProcessed : 
                          item.status === 'completed' ? styles.statusCompleted : 
                          item.status === 'failed' ? styles.statusFailed : 
                          item.status === 'cancelled' ? styles.statusCancelled : 
                          styles.statusPending]}>
                          <Text style={styles.statusText}>{t[item.status as keyof typeof t]}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.noHistoryText}>{t.noHistory}</Text>
                )}
              </View>
            </>
          )}
        </View>

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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f2f5',
    paddingVertical: 40,
  },
  loadingText: {
    color: '#333',
    fontSize: 16,
    marginTop: 8,
  },
  balanceContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  balanceLabel: {
    color: '#666',
    fontSize: 16,
    marginBottom: 8,
  },
  balanceValue: {
    color: '#333',
    fontSize: 36,
    fontWeight: '700',
  },
  formContainer: {
    marginTop: 20,
  },
  formItem: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  submitButton: {
    backgroundColor: '#188038',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  historyContainer: {
    marginTop: 30,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  historyList: {
    gap: 12,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  historyItemLeft: {
    flex: 1,
  },
  historyAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  historyDate: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusPending: {
    backgroundColor: '#ffd700',
  },
  statusApproved: {
    backgroundColor: '#98fb98',
  },
  statusProcessed: {
    backgroundColor: '#87ceeb',
  },
  statusCompleted: {
    backgroundColor: '#90ee90',
  },
  statusFailed: {
    backgroundColor: '#ffb6c1',
  },
  statusCancelled: {
    backgroundColor: '#d3d3d3',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  noHistoryText: {
    textAlign: 'center',
    color: '#999',
    paddingVertical: 20,
  },
  // 内容滚动区域样式
  contentScrollView: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
})
