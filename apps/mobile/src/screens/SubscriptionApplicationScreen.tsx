import { useState, useEffect } from 'react'
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Pressable, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform, 
  Alert,
  Dimensions,
  SafeAreaView,
  StatusBar,
  ActivityIndicator
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { supabase } from '../lib/supabase'
import { messageGenerator } from '../utils/message-generator'

const { width } = Dimensions.get('window')

interface Product {
  id: string;
  product_number?: string;
  name?: string;
  name_cn?: string;
  name_en?: string;
  description?: string;
  type?: string;
  risk_level?: string;
  status?: string;
  return_rate?: number;
  nav?: number;
  latest_nav_date?: string;
  created_at?: string;
  updated_at?: string;
  sale_status?: string;
}

interface CashBalance {
  cash_balance: number;
}

export default function SubscriptionApplicationScreen({ 
  product, 
  lang = 'zh', 
  onClose, 
  userInfo,
  onSuccess,
  onNavigateToRedemptionApplication,
  onNavigateToSubscriptionRedemptionRecords,
  onNavigateToContracts
}: { 
  product?: Product; 
  lang?: 'zh' | 'en';
  onClose?: () => void;
  userInfo?: any;
  onSuccess?: (subscriptionId: string) => void;
  onNavigateToRedemptionApplication?: () => void;
  onNavigateToSubscriptionRedemptionRecords?: () => void;
  onNavigateToContracts?: () => void;
}) {
  const insets = useSafeAreaInsets()
  
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(product || null)
  const [products, setProducts] = useState<Product[]>([])
  const [investmentAmount, setInvestmentAmount] = useState<string>('')
  const [confirmInvestmentAmount, setConfirmInvestmentAmount] = useState<string>('')
  const [cashBalance, setCashBalance] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [focusedInput, setFocusedInput] = useState<string | null>(null)

  const t = lang === 'zh' ? {
    title: '申购申请',
    subscriptionApplication: '申购申请',
    redemptionApplication: '赎回申请',
    subscriptionRedemptionRecords: '交易记录',
    contracts: '合同签订',
    productSelection: '选择基金产品',
    productName: '产品名称',
    productCode: '产品代码',
    riskLevel: '风险等级',
    nav: '最新净值',
    availableBalance: '可用余额',
    investmentAmount: '申请投资金额',
    confirmInvestmentAmount: '再次确认投资金额',
    submit: '提交申请',
    submitting: '提交中...',
    success: '申购申请提交成功',
    error: '提交失败',
    pleaseSelectProduct: '请选择基金产品',
    pleaseEnterAmount: '请输入申请投资金额',
    pleaseConfirmAmount: '请确认投资金额',
    invalidAmount: '申请投资金额无效',
    amountsMismatch: '两次输入的投资金额不一致',
    insufficientBalance: '可用余额不足',
    minInvestment: '最低投资金额',
    maxInvestment: '最高投资金额',
    riskWarning: '风险提示：投资有风险，入市需谨慎',
    submissionNote: '申购申请提交后，如果可用余额里有资金，首先使用该部分资金；如没有或不足，则由客服指导如何入金。',
    open: '已开放',
    closed: '已售净',
    lowRisk: '低风险',
    mediumRisk: '中风险',
    highRisk: '高风险',
    required: '必填',
    all: '全部',
    half: '50%',
    thirty: '30%',
    estimatedShares: '预计获得份额',
  } : {
    title: 'Subscription Application',
    subscriptionApplication: 'Subscription Application',
    redemptionApplication: 'Redemption Application',
    subscriptionRedemptionRecords: 'Subscription/Redemption Records',
    contracts: 'Contracts',
    productSelection: 'Select Fund Product',
    productName: 'Product Name',
    productCode: 'Product Code',
    riskLevel: 'Risk Level',
    nav: 'Latest NAV',
    availableBalance: 'Available Balance',
    investmentAmount: 'Investment Amount',
    confirmInvestmentAmount: 'Confirm Investment Amount',
    submit: 'Submit Application',
    submitting: 'Submitting...',
    success: 'Subscription application submitted successfully',
    error: 'Submission failed',
    pleaseSelectProduct: 'Please select a fund product',
    pleaseEnterAmount: 'Please enter investment amount',
    pleaseConfirmAmount: 'Please confirm investment amount',
    invalidAmount: 'Invalid investment amount',
    amountsMismatch: 'The two entered amounts do not match',
    insufficientBalance: 'Insufficient balance',
    minInvestment: 'Minimum Investment',
    maxInvestment: 'Maximum Investment',
    riskWarning: 'Risk Warning: Investment involves risks',
    submissionNote: 'After submission, available balance will be used first.',
    open: 'Open',
    closed: 'Closed',
    lowRisk: 'Low Risk',
    mediumRisk: 'Medium Risk',
    highRisk: 'High Risk',
    required: 'Required',
    all: 'All',
    half: '50%',
    thirty: '30%',
    estimatedShares: 'Estimated Shares',
  }

  const getRiskLevelText = (riskLevel?: string) => {
    switch (riskLevel) {
      case 'low': return t.lowRisk
      case 'medium': return t.mediumRisk
      case 'high': return t.highRisk
      default: return riskLevel || ''
    }
  }

  const getRiskLevelColor = (riskLevel?: string) => {
    switch (riskLevel) {
      case 'low': return '#4CAF50'
      case 'medium': return '#FF9800'
      case 'high': return '#F44336'
      default: return '#666666'
    }
  }

  const getRiskLevelBgColor = (riskLevel?: string) => {
    switch (riskLevel) {
      case 'low': return '#E8F5E9'
      case 'medium': return '#FFF3E0'
      case 'high': return '#FFEBEE'
      default: return '#F5F5F5'
    }
  }

  const getProductName = (product: Product) => {
    if (product.name) return product.name
    if (lang === 'zh' && product.name_cn) return product.name_cn
    if (lang === 'en' && product.name_en) return product.name_en
    return product.name_cn || product.name_en || '未命名产品'
  }

  const getProductCode = (product: Product) => {
    return product.product_number || 'N/A'
  }

  const getProductNav = (product: Product) => {
    return product.nav || 0
  }

  const formatAmount = (amount: number) => {
    return amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const getEstimatedShares = () => {
    if (!selectedProduct || !investmentAmount) return 0
    const amount = parseFloat(investmentAmount)
    const nav = getProductNav(selectedProduct)
    if (nav <= 0) return 0
    return amount / nav
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false })
        
        if (productsError) {
          console.error('Failed to load products:', productsError)
          setProducts([])
        } else {
          const processedProducts = (productsData || []).map(product => ({
            ...product,
            sale_status: product.sale_status || 'open'
          }))
          setProducts(processedProducts)
        }
        
        if (userInfo && userInfo.id) {
          const { data: cashData, error: cashError } = await supabase
            .from('cash_balances')
            .select('cash_balance')
            .eq('user_id', userInfo.id)
          
          if (cashError) {
            console.error('Failed to load cash balance:', cashError)
            setCashBalance(0)
          } else if (cashData && cashData.length > 0) {
            setCashBalance(cashData[0].cash_balance || 0)
          } else {
            setCashBalance(0)
          }
        }
      } catch (error) {
        console.error('Error loading data:', error)
        setProducts([])
        setCashBalance(0)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [userInfo, supabase, lang])

  const handleProductSelect = (selected: Product) => {
    setSelectedProduct(selected)
  }

  const handleQuickAmount = (ratio: number) => {
    const amount = cashBalance * ratio
    setInvestmentAmount(amount.toFixed(2))
    setConfirmInvestmentAmount('')
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setError(null)
    setSuccess(null)
    
    try {
      if (investmentAmount !== confirmInvestmentAmount) {
        Alert.alert(t.error, t.amountsMismatch)
        setSubmitting(false)
        return
      }
      
      const amount = parseFloat(investmentAmount)
      const insertData = {
        user_id: userInfo?.id || 'test_user_id',
        fund_id: selectedProduct?.id || 'test_fund_id',
        type: 'subscription',
        shares: amount / (selectedProduct?.nav || 1),
        total_amount: amount,
        nav: selectedProduct?.nav || 1
      }
      
      const { data, error: srError } = await supabase
        .from('subscription_redemption')
        .insert(insertData)
        .select()
      
      if (srError) {
        console.error('Failed to submit subscription:', srError)
        setSubmitting(false)
        Alert.alert(t.error, lang === 'zh' ? '提交失败，请稍后重试' : 'Submission failed, please try again later')
        return
      }
      
      const depositData = {
        user_id: userInfo?.id || 'test_user_id',
        type: 'deposit',
        amount: amount,
        status: 'pending',
        notes: `自动入金 - 申购${getProductName(selectedProduct)}`
      };
      
      const { error: dwError } = await supabase
        .from('deposit_withdrawal')
        .insert(depositData);
      
      setSubmitting(false)
      
      if (dwError) {
        console.error('Failed to insert deposit_withdrawal:', dwError)
        Alert.alert(t.error, lang === 'zh' ? '提交失败，请稍后重试' : 'Submission failed, please try again later')
        return
      }
      
      await messageGenerator.generateFundTransactionMessage(
        userInfo?.id || '',
        userInfo?.nickname || userInfo?.name || '极光用户',
        '申购'
      );
      
      const subscriptionId = data && data.length > 0 ? data[0].id : null
      
      if (onSuccess && subscriptionId) {
        onSuccess(subscriptionId)
      } else {
        Alert.alert(t.error, lang === 'zh' ? '提交成功但无法获取申请ID' : 'Submission successful but unable to get application ID')
      }
    } catch (error) {
      console.error('Error submitting subscription:', error)
      setSubmitting(false)
      Alert.alert(t.error, lang === 'zh' ? '提交失败，请稍后重试' : 'Submission failed, please try again later')
    }
  }

  const renderProductSelector = () => {
    if (product) return null
    
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderIcon}>
            <Ionicons name="cube" size={20} color="#1A4EA2" />
          </View>
          <Text style={styles.cardTitle}>{t.productSelection}</Text>
          <View style={styles.requiredTag}>
            <Text style={styles.requiredTagText}>{t.required}</Text>
          </View>
        </View>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1A4EA2" />
            <Text style={styles.loadingText}>{lang === 'zh' ? '加载中...' : 'Loading...'}</Text>
          </View>
        ) : products.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={48} color="#CCC" />
            <Text style={styles.emptyText}>{lang === 'zh' ? '暂无可用产品' : 'No available products'}</Text>
          </View>
        ) : (
          <View style={styles.productList}>
            {products.map((p) => (
              <TouchableOpacity 
                key={p.id} 
                style={[
                  styles.productItem, 
                  selectedProduct?.id === p.id && styles.selectedProductItem
                ]}
                onPress={() => handleProductSelect(p)}
                activeOpacity={0.8}
              >
                <View style={styles.productItemLeft}>
                  <LinearGradient
                    colors={['#1A4EA2', '#0D3A8A']}
                    style={styles.productIcon}
                  >
                    <Text style={styles.productIconText}>基</Text>
                  </LinearGradient>
                </View>
                <View style={styles.productItemContent}>
                  <Text style={styles.productItemName}>{getProductName(p)}</Text>
                  <Text style={styles.productItemCode}>{getProductCode(p)}</Text>
                  <View style={styles.productItemDetails}>
                    <View style={[styles.riskBadge, { backgroundColor: getRiskLevelBgColor(p.risk_level) }]}>
                      <Text style={[styles.riskBadgeText, { color: getRiskLevelColor(p.risk_level) }]}>
                        {getRiskLevelText(p.risk_level)}
                      </Text>
                    </View>
                    {p.return_rate !== undefined && (
                      <Text style={styles.returnRateText}>+{p.return_rate}%</Text>
                    )}
                  </View>
                </View>
                <View style={styles.radioContainer}>
                  <View style={[
                    styles.radioOuter,
                    selectedProduct?.id === p.id && styles.radioOuterSelected
                  ]}>
                    {selectedProduct?.id === p.id && <View style={styles.radioInner} />}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    )
  }

  const renderProductInfo = () => {
    if (!selectedProduct) return null
    
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderIcon}>
            <Ionicons name="information-circle" size={20} color="#1A4EA2" />
          </View>
          <Text style={styles.cardTitle}>{t.productName}</Text>
        </View>
        <View style={styles.productInfoContent}>
          <LinearGradient
            colors={['#1A4EA2', '#0D3A8A']}
            style={styles.productInfoHeader}
          >
            <View style={styles.productInfoHeaderContent}>
              <Text style={styles.productInfoName}>{getProductName(selectedProduct)}</Text>
              <Text style={styles.productInfoCode}>{getProductCode(selectedProduct)}</Text>
            </View>
            <View style={[styles.riskBadgeLarge, { backgroundColor: getRiskLevelBgColor(selectedProduct.risk_level) }]}>
              <Text style={[styles.riskBadgeLargeText, { color: getRiskLevelColor(selectedProduct.risk_level) }]}>
                {getRiskLevelText(selectedProduct.risk_level)}
              </Text>
            </View>
          </LinearGradient>
          <View style={styles.productInfoDetails}>
            <View style={styles.productInfoDetailItem}>
              <View style={[styles.infoIconContainer, { backgroundColor: '#E3F2FD' }]}>
                <Ionicons name="trending-up" size={18} color="#1A4EA2" />
              </View>
              <View>
                <Text style={styles.productInfoDetailLabel}>{t.nav}</Text>
                <Text style={styles.productInfoDetailValue}>{getProductNav(selectedProduct).toFixed(4)}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    )
  }

  const isSubmitDisabled = !selectedProduct || !investmentAmount || !confirmInvestmentAmount || investmentAmount !== confirmInvestmentAmount || submitting

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A4EA2" />
      
      <LinearGradient
        colors={['#1A4EA2', '#0D3A8A']}
        style={[styles.header, { paddingTop: insets.top > 0 ? insets.top : 16 }]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={onClose}>
            <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t.title}</Text>
          <TouchableOpacity style={styles.helpButton} onPress={() => console.log('客服')}>
            <Ionicons name="headset" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView 
        style={styles.keyboardView} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.functionButtonsContainer}>
          <View style={styles.functionButtons}>
            <TouchableOpacity 
              style={[styles.functionButton, styles.activeFunctionButton]} 
              onPress={() => {}}
            >
              <View style={[styles.functionIconContainer, styles.activeFunctionIconContainer]}>
                <Ionicons name="add-circle" size={22} color="#FFFFFF" />
              </View>
              <Text style={[styles.functionButtonText, styles.activeFunctionButtonText]}>{t.subscriptionApplication}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.functionButton} 
              onPress={() => onNavigateToRedemptionApplication?.()}
            >
              <View style={styles.functionIconContainer}>
                <Ionicons name="remove-circle" size={22} color="#999" />
              </View>
              <Text style={styles.functionButtonText}>{t.redemptionApplication}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.functionButton} 
              onPress={() => onNavigateToSubscriptionRedemptionRecords?.()}
            >
              <View style={styles.functionIconContainer}>
                <Ionicons name="document-text" size={22} color="#999" />
              </View>
              <Text style={styles.functionButtonText}>{t.subscriptionRedemptionRecords}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.functionButton} 
              onPress={() => onNavigateToContracts?.()}
            >
              <View style={styles.functionIconContainer}>
                <Ionicons name="create" size={22} color="#999" />
              </View>
              <Text style={styles.functionButtonText}>{t.contracts}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {renderProductSelector()}
          {renderProductInfo()}
          
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderIcon}>
                <Ionicons name="wallet" size={20} color="#1A4EA2" />
              </View>
              <Text style={styles.cardTitle}>{t.availableBalance}</Text>
            </View>
            <View style={styles.balanceContent}>
              <Text style={styles.balanceSymbol}>¥</Text>
              <Text style={styles.balanceValue}>{formatAmount(cashBalance)}</Text>
            </View>
          </View>
          
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderIcon}>
                <Ionicons name="cash" size={20} color="#1A4EA2" />
              </View>
              <Text style={styles.cardTitle}>{t.investmentAmount}</Text>
              <View style={styles.requiredTag}>
                <Text style={styles.requiredTagText}>{t.required}</Text>
              </View>
            </View>
            <View style={[
              styles.amountInputContainer,
              focusedInput === 'amount' && styles.amountInputContainerFocused
            ]}>
              <Text style={styles.currencySymbol}>¥</Text>
              <TextInput
                style={styles.amountInput}
                placeholder={lang === 'zh' ? `请输入${t.investmentAmount}` : `Please enter ${t.investmentAmount}`}
                placeholderTextColor="#999"
                keyboardType="decimal-pad"
                value={investmentAmount}
                onChangeText={setInvestmentAmount}
                editable={!submitting}
                onFocus={() => setFocusedInput('amount')}
                onBlur={() => setFocusedInput(null)}
              />
            </View>
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
              <TouchableOpacity 
                style={styles.quickAmountButton}
                onPress={() => handleQuickAmount(0.3)}
                disabled={submitting}
              >
                <Text style={styles.quickAmountText}>{t.thirty}</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderIcon}>
                <Ionicons name="checkmark-circle" size={20} color="#1A4EA2" />
              </View>
              <Text style={styles.cardTitle}>{t.confirmInvestmentAmount}</Text>
              <View style={styles.requiredTag}>
                <Text style={styles.requiredTagText}>{t.required}</Text>
              </View>
            </View>
            <View style={[
              styles.amountInputContainer,
              focusedInput === 'confirmAmount' && styles.amountInputContainerFocused
            ]}>
              <Text style={styles.currencySymbol}>¥</Text>
              <TextInput
                style={styles.amountInput}
                placeholder={lang === 'zh' ? `请再次输入${t.investmentAmount}` : `Please re-enter ${t.investmentAmount}`}
                placeholderTextColor="#999"
                keyboardType="decimal-pad"
                value={confirmInvestmentAmount}
                onChangeText={setConfirmInvestmentAmount}
                editable={!submitting}
                onFocus={() => setFocusedInput('confirmAmount')}
                onBlur={() => setFocusedInput(null)}
              />
            </View>
          </View>

          {selectedProduct && investmentAmount && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderIcon}>
                  <Ionicons name="calculator" size={20} color="#1A4EA2" />
                </View>
                <Text style={styles.cardTitle}>{t.estimatedShares}</Text>
              </View>
              <View style={styles.estimatedSharesContent}>
                <Text style={styles.estimatedSharesValue}>{getEstimatedShares().toFixed(4)}</Text>
                <Text style={styles.estimatedSharesUnit}>份</Text>
              </View>
            </View>
          )}
          
          <View style={styles.infoCard}>
            <View style={styles.infoIconWrapper}>
              <Ionicons name="information-circle" size={24} color="#1A4EA2" />
            </View>
            <Text style={styles.infoText}>{t.submissionNote}</Text>
          </View>
          
          <View style={styles.riskCard}>
            <Ionicons name="warning" size={20} color="#FF9800" />
            <Text style={styles.riskText}>{t.riskWarning}</Text>
          </View>
          
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isSubmitDisabled}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={isSubmitDisabled ? ['#CCC', '#999'] : ['#1A4EA2', '#0D3A8A']}
              style={styles.submitButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.submitButtonText}>
                {submitting ? t.submitting : t.submit}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
          
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
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  helpButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
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
    // Active state
  },
  functionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F5F7FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  activeFunctionIconContainer: {
    backgroundColor: '#1A4EA2',
  },
  functionButtonText: {
    fontSize: 11,
    color: '#999',
    fontWeight: '500',
  },
  activeFunctionButtonText: {
    color: '#1A4EA2',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
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
  cardHeaderIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  requiredTag: {
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  requiredTagText: {
    fontSize: 11,
    color: '#F44336',
    fontWeight: '500',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: '#999',
    fontSize: 14,
    marginTop: 12,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#999',
    fontSize: 14,
    marginTop: 12,
  },
  productList: {
    // Product list
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  selectedProductItem: {
    backgroundColor: '#E3F2FD',
    borderColor: '#1A4EA2',
  },
  productItemLeft: {
    marginRight: 12,
  },
  productIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productIconText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  productItemContent: {
    flex: 1,
  },
  productItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  productItemCode: {
    fontSize: 12,
    color: '#999',
    marginBottom: 6,
  },
  productItemDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  riskBadgeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  returnRateText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  radioContainer: {
    marginLeft: 8,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#CCC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterSelected: {
    borderColor: '#1A4EA2',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#1A4EA2',
  },
  productInfoContent: {
    overflow: 'hidden',
    borderRadius: 12,
  },
  productInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  productInfoHeaderContent: {
    flex: 1,
  },
  productInfoName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  productInfoCode: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  riskBadgeLarge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  riskBadgeLargeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  productInfoDetails: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#F8F9FA',
  },
  productInfoDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  infoIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  productInfoDetailLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  productInfoDetailValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  balanceContent: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  balanceSymbol: {
    fontSize: 24,
    fontWeight: '500',
    color: '#1A4EA2',
    marginRight: 4,
  },
  balanceValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#1A4EA2',
  },
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
    color: '#333',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 22,
    fontWeight: '600',
    color: '#333',
  },
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
  estimatedSharesContent: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  estimatedSharesValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#4CAF50',
  },
  estimatedSharesUnit: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4CAF50',
    marginLeft: 4,
  },
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
  riskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  riskText: {
    flex: 1,
    fontSize: 13,
    color: '#E65100',
    marginLeft: 10,
    fontWeight: '500',
  },
  submitButton: {
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
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
});
