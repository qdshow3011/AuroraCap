import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native'
import { supabase } from '../lib/supabase'

interface WithdrawalDetails {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  updated_at?: string;
}

export default function WithdrawalSuccessScreen({ lang = 'zh', onClose, onGoHome, withdrawalId, userInfo }: { lang?: 'zh' | 'en'; onClose: () => void; onGoHome: () => void; withdrawalId: string | null; userInfo?: any }) {
  // 状态管理
  const [withdrawal, setWithdrawal] = useState<WithdrawalDetails | null>(null)
  const [loading, setLoading] = useState(true)

  // 语言翻译
  const t = lang === 'zh' ? {
    title: '出金申请成功',
    successIcon: '✅',
    successMessage: '您的出金申请已提交成功',
    note: '出金申请提交后，我们将尽快处理，请耐心等待。',
    details: '申请详情',
    applicationId: '申请ID',
    amount: '出金金额',
    status: '状态',
    createdAt: '申请时间',
    goHome: '返回首页',
    viewRecords: '查看资金往来',
    pending: '待处理',
    processing: '正在处理',
    processed: '已处理',
    completed: '已完成',
    failed: '失败',
    cancelled: '已取消',
    loading: '加载中...',
    error: '加载失败，请稍后重试'
  } : {
    title: 'Withdrawal Application Success',
    successIcon: '✅',
    successMessage: 'Your withdrawal application has been submitted successfully',
    note: 'Your withdrawal application will be processed as soon as possible, please wait patiently.',
    details: 'Application Details',
    applicationId: 'Application ID',
    amount: 'Withdrawal Amount',
    status: 'Status',
    createdAt: 'Created At',
    goHome: 'Go to Home',
    viewRecords: 'View Records',
    pending: 'Pending',
    processing: 'Processing',
    processed: 'Processed',
    completed: 'Completed',
    failed: 'Failed',
    cancelled: 'Cancelled',
    loading: 'Loading...',
    error: 'Failed to load, please try again later'
  }

  // 加载出金申请详情
  useEffect(() => {
    const loadWithdrawalDetails = async () => {
      if (!withdrawalId || !userInfo || !userInfo.id) {
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('deposit_withdrawal')
          .select('*')
          .eq('id', withdrawalId)
          .single()

        if (error) {
          console.error('获取出金申请详情失败:', error)
        } else {
          setWithdrawal(data)
        }
      } catch (error) {
        console.error('加载出金申请详情失败:', error)
      } finally {
        setLoading(false)
      }
    }

    loadWithdrawalDetails()
  }, [withdrawalId, userInfo])

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString(lang === 'zh' ? 'zh-CN' : 'en-US')
  }

  return (
    <View style={styles.container}>
      {/* 顶部导航栏 */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={onClose}>
          <Text style={styles.backButtonText}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{t.title}</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4a90e2" />
            <Text style={styles.loadingText}>{t.loading}</Text>
          </View>
        ) : (
          <>
            {/* 成功状态显示 */}
            <View style={styles.successContainer}>
              <Text style={styles.successIcon}>{t.successIcon}</Text>
              <Text style={styles.successMessage}>{t.successMessage}</Text>
              <Text style={styles.note}>{t.note}</Text>
            </View>

            {/* 申请详情 */}
            {withdrawal && (
              <View style={styles.detailsContainer}>
                <Text style={styles.detailsTitle}>{t.details}</Text>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>{t.applicationId}</Text>
                  <Text style={styles.detailValue}>{withdrawal.id}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>{t.amount}</Text>
                  <Text style={styles.detailValue}>¥{withdrawal.amount.toFixed(2)}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>{t.status}</Text>
                  <Text style={[styles.detailValue, styles.statusText]}>{t[withdrawal.status as keyof typeof t]}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>{t.createdAt}</Text>
                  <Text style={styles.detailValue}>{formatDate(withdrawal.created_at)}</Text>
                </View>
              </View>
            )}

            {/* 操作按钮 */}
            <View style={styles.buttonContainer}>
              <Pressable
                style={styles.button}
                onPress={onGoHome}
              >
                <Text style={styles.buttonText}>{t.goHome}</Text>
              </Pressable>
              <Pressable
                style={[styles.button, styles.secondaryButton]}
                onPress={onClose}
              >
                <Text style={[styles.buttonText, styles.secondaryButtonText]}>{t.viewRecords}</Text>
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#333',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: '#4a90e2',
    fontSize: 24,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  successContainer: {
    alignItems: 'center',
    marginBottom: 30,
    paddingVertical: 20,
  },
  successIcon: {
    fontSize: 80,
    marginBottom: 16,
  },
  successMessage: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  note: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  detailsContainer: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  statusText: {
    color: '#ffd700',
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  button: {
    backgroundColor: '#4a90e2',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#4a90e2',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#4a90e2',
  },
})
