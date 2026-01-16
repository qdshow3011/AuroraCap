import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Pressable, RefreshControl, Alert } from 'react-native'
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

// 已签合同类型定义
interface SignedContract {
  id: string;
  user_id: string;
  contract_id: string;
  contract: Contract;
  signed_at: string;
  status: string;
}

export default function ContractSigningScreen({ 
  lang = 'zh', 
  onClose, 
  userInfo,
  onNavigateToSubscriptionApplication,
  onNavigateToRedemptionApplication,
  onNavigateToSubscriptionRedemptionRecords,
  onNavigateToContractDetail
}: { 
  lang?: 'zh' | 'en';
  onClose?: () => void;
  userInfo?: any;
  onNavigateToSubscriptionApplication?: () => void;
  onNavigateToRedemptionApplication?: () => void;
  onNavigateToSubscriptionRedemptionRecords?: () => void;
  onNavigateToContractDetail?: (contract: Contract) => void;
}) {
  // 状态管理
  const [contracts, setContracts] = useState<Contract[]>([])
  const [signedContracts, setSignedContracts] = useState<SignedContract[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // 语言翻译
  const t = lang === 'zh' ? {
    title: '合同签订',
    subscriptionApplication: '申购申请',
    redemptionApplication: '赎回申请',
    subscriptionRedemptionRecords: '交易记录',
    contractSigning: '合同签订',
    fundRelatedContracts: '基金相关合同',
    mySignedContracts: '我已签的合同',
    noContracts: '暂无合同',
    noSignedContracts: '暂无已签合同',
    loading: '加载中...',
    search: '搜索',
    customerService: '客服',
    signContract: '签订合同',
    viewContract: '查看合同'
  } : {
    title: 'Contract Signing',
    subscriptionApplication: 'Subscription Application',
    redemptionApplication: 'Redemption Application',
    subscriptionRedemptionRecords: 'Subscription/Redemption Records',
    contractSigning: 'Contract Signing',
    fundRelatedContracts: 'Fund-related Contracts',
    mySignedContracts: 'My Signed Contracts',
    noContracts: 'No contracts available',
    noSignedContracts: 'No signed contracts',
    loading: 'Loading...',
    search: 'Search',
    customerService: 'Customer Service',
    signContract: 'Sign Contract',
    viewContract: 'View Contract'
  }

  // 加载合同数据
  const loadContracts = async () => {
    try {
      // 1. 获取基金相关合同
      const { data: contractsData, error: contractsError } = await supabase
        .from('contracts')
        .select('*')
        .order('created_at', { ascending: false })

      if (contractsError) {
        console.error('Failed to load contracts:', contractsError)
        setContracts([])
      } else {
        setContracts(contractsData || [])
      }

      // 2. 获取用户已签合同
      if (userInfo && userInfo.id) {
        const { data: signedContractsData, error: signedContractsError } = await supabase
          .from('contract_signings')
          .select(`
            *, 
            contract:contracts(*)
          `)
          .eq('user_id', userInfo.id)
          .order('signed_at', { ascending: false })

        if (signedContractsError) {
          console.error('Failed to load signed contracts:', signedContractsError)
          setSignedContracts([])
        } else {
          setSignedContracts(signedContractsData || [])
        }
      }
    } catch (error) {
      console.error('Error loading contract data:', error)
      setContracts([])
      setSignedContracts([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // 初始加载数据
  useEffect(() => {
    loadContracts()
  }, [userInfo])

  // 下拉刷新
  const handleRefresh = async () => {
    setRefreshing(true)
    await loadContracts()
  }

  // 查看合同详情
  const handleViewContract = (contract: Contract) => {
    // 导航到合同详情页面
    console.log('View contract:', contract)
    onNavigateToContractDetail?.(contract)
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
          <TouchableOpacity style={styles.iconButton} onPress={() => console.log('客服')}>
            <Text style={styles.icon}>🎧</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 功能按钮区域 */}
      <View style={styles.functionButtons}>
        <TouchableOpacity 
          style={styles.functionButton} 
          onPress={onNavigateToSubscriptionApplication}
        >
          <Text style={styles.functionButtonIcon}>📥</Text>
          <Text style={styles.functionButtonText}>{t.subscriptionApplication}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.functionButton} 
          onPress={onNavigateToRedemptionApplication}
        >
          <Text style={styles.functionButtonIcon}>📤</Text>
          <Text style={styles.functionButtonText}>{t.redemptionApplication}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.functionButton} 
          onPress={onNavigateToSubscriptionRedemptionRecords}
        >
          <Text style={styles.functionButtonIcon}>📋</Text>
          <Text style={styles.functionButtonText}>{t.subscriptionRedemptionRecords}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.functionButton, styles.activeButton]} 
          onPress={() => console.log('合同签订 - 当前页面')}
        >
          <Text style={styles.functionButtonIcon}>📝</Text>
          <Text style={[styles.functionButtonText, styles.activeButtonText]}>{t.contractSigning}</Text>
        </TouchableOpacity>
      </View>

      {/* 主要内容 */}
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={styles.refreshControl.tintColor as any}
            colors={[styles.refreshControl.color as any]}
          />
        }
      >
        {/* 基金相关合同区域 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.fundRelatedContracts}</Text>
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>{t.loading}</Text>
            </View>
          ) : contracts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{t.noContracts}</Text>
            </View>
          ) : (
            contracts.map((contract) => (
              <View key={contract.id} style={styles.contractCard}>
                <View style={styles.contractHeader}>
                  <Text style={styles.contractTitle}>{contract.title}</Text>
                  <TouchableOpacity 
                    style={styles.viewButton}
                    onPress={() => handleViewContract(contract)}
                  >
                    <Text style={styles.viewButtonText}>{t.viewContract}</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.contractDate}>{new Date(contract.created_at).toLocaleDateString()}</Text>
              </View>
            ))
          )}
        </View>

        {/* 我已签的合同区域 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.mySignedContracts}</Text>
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>{t.loading}</Text>
            </View>
          ) : signedContracts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{t.noSignedContracts}</Text>
            </View>
          ) : (
            signedContracts.map((signedContract) => (
              <View key={signedContract.id} style={styles.signedContractCard}>
                <Text style={styles.contractTitle}>{signedContract.contract.title}</Text>
                <Text style={styles.signedDate}>{t.lang === 'zh' ? '签订时间：' : 'Signed at: '}{new Date(signedContract.signed_at).toLocaleString()}</Text>
                <Text style={styles.contractStatus}>{t.lang === 'zh' ? '状态：' : 'Status: '}{signedContract.status}</Text>
              </View>
            ))
          )}
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
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    color: '#333',
    fontSize: 24,
    fontWeight: '700',
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
  // 功能按钮样式
  functionButtons: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
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
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  contractCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  contractHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  contractTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  viewButton: {
    backgroundColor: '#188038',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  viewButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  contractDate: {
    fontSize: 12,
    color: '#999',
  },
  signedContractCard: {
    backgroundColor: '#f8fff9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e8f5e8',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  signedDate: {
    fontSize: 14,
    color: '#666',
    marginVertical: 8,
  },
  contractStatus: {
    fontSize: 14,
    color: '#188038',
    fontWeight: '500',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loadingText: {
    color: '#666',
    fontSize: 14,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  emptyText: {
    color: '#999',
    fontSize: 14,
  },
  // 刷新控件样式
  refreshControl: {
    tintColor: '#188038',
    color: '#188038',
  },
})
