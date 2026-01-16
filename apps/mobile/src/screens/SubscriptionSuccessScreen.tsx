import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native'
import { supabase } from '../lib/supabase'

interface SubscriptionSuccessScreenProps {
  lang?: 'zh' | 'en'
  userInfo?: any
  subscriptionId?: string | null
  onClose: () => void
  onGoHome: () => void
}

interface SubscriptionRecord {
  id: string
  user_id: string
  fund_id: string
  type: string
  shares: number
  total_amount: number
  nav: number
  created_at: string
  status?: string
  fund_name?: string
}

export default function SubscriptionSuccessScreen({
  lang = 'zh',
  userInfo,
  subscriptionId,
  onClose,
  onGoHome
}: SubscriptionSuccessScreenProps) {
  const [subscription, setSubscription] = useState<SubscriptionRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 语言翻译
  const t = lang === 'zh' ? {
    title: '申购申请提交成功',
    back: '返回',
    goHome: '返回首页',
    orderNumber: '申请编号',
    productName: '产品名称',
    amount: '投资金额',
    shares: '申购份额',
    nav: '申购净值',
    status: '申请状态',
    createdAt: '申请时间',
    loading: '加载中...',
    failed: '加载失败，请重试',
    success: '恭喜，您的申购申请已成功提交！',
    description: '我们将尽快处理您的申请，您可以在交易记录中查看最新进度。',
    active: '处理中'
  } : {
    title: 'Subscription Application Submitted Successfully',
    back: 'Back',
    goHome: 'Go to Home',
    orderNumber: 'Application Number',
    productName: 'Product Name',
    amount: 'Investment Amount',
    shares: 'Subscription Shares',
    nav: 'Subscription NAV',
    status: 'Application Status',
    createdAt: 'Application Time',
    loading: 'Loading...',
    failed: 'Failed to load, please retry',
    success: 'Congratulations, your subscription application has been submitted successfully!',
    description: 'We will process your application as soon as possible. You can check the latest progress in transaction records.',
    active: 'Processing'
  }

  // 获取最新的订阅记录
  useEffect(() => {
    const fetchLatestSubscription = async () => {
      setLoading(true)
      setError(null)

      try {
        let query = supabase
          .from('subscription_redemption')
          .select('id, user_id, fund_id, type, shares, total_amount, nav, created_at')
          .eq('type', 'subscription')
          .order('created_at', { ascending: false })
          .limit(1)

        // 如果有指定的订阅ID，则获取该特定记录
        if (subscriptionId) {
          query = query.eq('id', subscriptionId)
        }

        const { data, error } = await query

        if (error) {
          console.error('Failed to fetch subscription:', error)
          throw error
        }

        if (data && data.length > 0) {
          const subscriptionData = data[0]

          // 获取基金名称
          const { data: fundData } = await supabase
            .from('products')
            .select('name_cn, name_en')
            .eq('id', subscriptionData.fund_id)
            .single()

          setSubscription({
            ...subscriptionData,
            fund_name: fundData ? (lang === 'zh' ? fundData.name_cn : fundData.name_en) || '未命名产品' : '未命名产品'
          })
        }
      } catch (err) {
        console.error('Error fetching subscription:', err)
        setError(t.failed)
      } finally {
        setLoading(false)
      }
    }

    fetchLatestSubscription()
  }, [subscriptionId, lang])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return lang === 'zh' 
      ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`
      : date.toLocaleString(lang === 'zh' ? 'zh-CN' : 'en-US')
  }

  return (
    <View style={styles.container}>
      {/* 顶部导航栏 */}
      <View style={styles.header}>
        <Pressable onPress={onClose} style={styles.backButton}>
          <Text style={styles.backText}>← {t.back}</Text>
        </Pressable>
        <Text style={styles.headerTitle}>
          {t.title}
        </Text>
        <View style={styles.headerRight} />
      </View>

      {/* 主要内容 */}
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 成功状态 */}
        <View style={styles.successContainer}>
          <View style={styles.successIconContainer}>
            <Text style={styles.successIcon}>✓</Text>
          </View>
          <Text style={styles.successTitle}>{t.success}</Text>
          <Text style={styles.successDescription}>{t.description}</Text>
        </View>

        {/* 申请详情 */}
        <View style={styles.detailContainer}>
          <Text style={styles.detailTitle}>{t.orderNumber}</Text>
          {loading ? (
            <ActivityIndicator size="small" color="#188038" style={styles.loadingIndicator} />
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : subscription ? (
            <>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>{t.orderNumber}</Text>
                <Text style={styles.detailValue}>{subscription.id}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>{t.productName}</Text>
                <Text style={styles.detailValue}>{subscription.fund_name}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>{t.amount}</Text>
                <Text style={styles.detailValue}>¥{subscription.total_amount.toFixed(2)}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>{t.shares}</Text>
                <Text style={styles.detailValue}>{subscription.shares.toFixed(4)}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>{t.nav}</Text>
                <Text style={styles.detailValue}>{subscription.nav.toFixed(4)}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>{t.createdAt}</Text>
                <Text style={styles.detailValue}>{formatDate(subscription.created_at)}</Text>
              </View>
            </>
          ) : (
            <Text style={styles.emptyText}>{lang === 'zh' ? '暂无申请记录' : 'No application records'}</Text>
          )}
        </View>

        {/* 操作按钮 */}
        <View style={styles.buttonContainer}>
          <Pressable
            onPress={onGoHome}
            style={styles.button}
          >
            <Text style={styles.buttonText}>{t.goHome}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    height: 56,
  },
  backButton: {
    width: 60,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backText: {
    fontSize: 16,
    color: '#1890ff',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '500',
    color: '#000000',
  },
  headerRight: {
    width: 60,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  successContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#188038',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3.84,
    elevation: 5,
  },
  successIcon: {
    fontSize: 48,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  successDescription: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  detailContainer: {
    backgroundColor: '#ffffff',
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
    marginBottom: 24,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
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
    fontSize: 15,
    color: '#666666',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 15,
    color: '#333333',
    fontWeight: '600',
    textAlign: 'right',
  },
  loadingIndicator: {
    padding: 20,
  },
  errorText: {
    color: '#ff4d4f',
    fontSize: 14,
    textAlign: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#999999',
    fontSize: 14,
    textAlign: 'center',
    padding: 20,
  },
  buttonContainer: {
    marginTop: 24,
  },
  button: {
    backgroundColor: '#188038',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
})