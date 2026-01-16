import { useState, useEffect, useRef } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native'
import { supabase } from '../lib/supabase'

// 合同类型定义
interface Contract {
  id: string;
  title: string;
  content: string;
  fund_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export default function ContractDetailScreen({ 
  contract, 
  lang = 'zh', 
  onClose, 
  onSignSuccess,
  userInfo
}: { 
  contract: Contract;
  lang?: 'zh' | 'en';
  onClose?: () => void;
  onSignSuccess?: (contractId: string) => void;
  userInfo?: any;
}) {
  // 状态管理
  const [countdown, setCountdown] = useState(10) // 10秒倒计时
  const [canSign, setCanSign] = useState(false) // 是否可以签订合同
  const [isSigning, setIsSigning] = useState(false) // 是否正在签订合同
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // 语言翻译
  const t = lang === 'zh' ? {
    title: '合同详情',
    contractContent: '合同内容',
    countdownTip: '请仔细阅读合同内容，{{countdown}}秒后可签订',
    signContract: '同意并签订合同',
    signing: '签订中...',
    signedSuccess: '合同签订成功',
    signFailed: '合同签订失败',
    pleaseWait: '请等待倒计时结束',
    alreadySigned: '您已签订过此合同',
    loading: '加载中...'
  } : {
    title: 'Contract Details',
    contractContent: 'Contract Content',
    countdownTip: 'Please read the contract carefully, you can sign after {{countdown}} seconds',
    signContract: 'Agree and Sign Contract',
    signing: 'Signing...',
    signedSuccess: 'Contract signed successfully',
    signFailed: 'Failed to sign contract',
    pleaseWait: 'Please wait for the countdown to end',
    alreadySigned: 'You have already signed this contract',
    loading: 'Loading...'
  }

  // 开始倒计时
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCountdown((prevCountdown) => {
        if (prevCountdown <= 1) {
          clearInterval(timerRef.current as NodeJS.Timeout)
          setCanSign(true)
          return 0
        }
        return prevCountdown - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  // 检查用户是否已签订该合同
  const checkIfAlreadySigned = async () => {
    if (!userInfo || !userInfo.id) return false

    try {
      const { data, error } = await supabase
        .from('contract_signings')
        .select('*')
        .eq('user_id', userInfo.id)
        .eq('contract_id', contract.id)
        .limit(1)

      if (error) {
        console.error('Failed to check signed status:', error)
        return false
      }

      return data && data.length > 0
    } catch (error) {
      console.error('Error checking signed status:', error)
      return false
    }
  }

  // 签订合同
  const handleSignContract = async () => {
    if (!canSign) {
      Alert.alert(t.signFailed, t.pleaseWait)
      return
    }

    if (!userInfo || !userInfo.id) {
      Alert.alert(t.signFailed, lang === 'zh' ? '请先登录' : 'Please login first')
      return
    }

    setIsSigning(true)

    try {
      // 检查是否已签订
      const alreadySigned = await checkIfAlreadySigned()
      if (alreadySigned) {
        Alert.alert(t.signFailed, t.alreadySigned)
        setIsSigning(false)
        return
      }

      // 签订合同
      const { data, error } = await supabase
        .from('contract_signings')
        .insert({
          user_id: userInfo.id,
          contract_id: contract.id,
          status: 'signed'
        })
        .select('*')

      if (error) {
        throw error
      }

      // 签订成功
      Alert.alert(t.signedSuccess, lang === 'zh' ? '您已成功签订合同' : 'You have successfully signed the contract')
      
      // 调用成功回调
      if (onSignSuccess) {
        onSignSuccess(contract.id)
      }

      // 关闭页面
      if (onClose) {
        onClose()
      }
    } catch (error) {
      console.error('Failed to sign contract:', error)
      Alert.alert(t.signFailed, lang === 'zh' ? '签订失败，请稍后重试' : 'Signing failed, please try again later')
    } finally {
      setIsSigning(false)
    }
  }

  return (
    <View style={styles.container}>
      {/* 顶部头衔 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onClose}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t.title}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* 主要内容 */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={true}>
        <View style={styles.content}>
          {/* 合同标题 */}
          <Text style={styles.contractTitle}>{contract.title}</Text>
          <Text style={styles.contractDate}>{new Date(contract.created_at).toLocaleDateString()}</Text>

          {/* 合同内容 */}
          <View style={styles.contractContentContainer}>
            <Text style={styles.sectionTitle}>{t.contractContent}</Text>
            <View style={styles.contentBox}>
              <Text style={styles.contentText}>{contract.content}</Text>
            </View>
          </View>

          {/* 倒计时提示 */}
          <View style={styles.countdownContainer}>
            <Text style={styles.countdownText}>
              {t.countdownTip.replace('{{countdown}}', countdown.toString())}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* 底部签订按钮 */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity 
          style={[
            styles.signButton,
            (!canSign || isSigning) && styles.disabledButton
          ]}
          onPress={handleSignContract}
          disabled={!canSign || isSigning}
        >
          <Text style={styles.signButtonText}>
            {isSigning ? t.signing : t.signContract}
          </Text>
        </TouchableOpacity>
      </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 24,
    color: '#333',
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  contractTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  contractDate: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
  },
  contractContentContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  contentBox: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  contentText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
    textAlign: 'justify',
  },
  countdownContainer: {
    backgroundColor: '#fff3e0',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  countdownText: {
    fontSize: 14,
    color: '#e65100',
    fontWeight: '500',
    textAlign: 'center',
  },
  bottomContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  signButton: {
    backgroundColor: '#188038',
    borderRadius: 8,
    paddingVertical: 16,
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
  disabledButton: {
    backgroundColor: '#a5d6a7',
    shadowOpacity: 0,
    elevation: 0,
  },
  signButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
})
