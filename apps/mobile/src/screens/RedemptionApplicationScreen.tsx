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
  SafeAreaView,
  StatusBar,
  ActivityIndicator
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { supabase } from '../lib/supabase'
import { messageGenerator } from '../utils/message-generator'

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
  net_asset_value?: number;
  annual_return?: number;
}

interface Position {
  id: string;
  product_id: string;
  shares: number;
  available_shares: number;
  cost_price: number;
  current_value: number;
  latest_nav: number;
  product: Product;
}

interface CashBalance {
  cash_balance: number;
}

export default function RedemptionApplicationScreen({ 
  lang = 'zh', 
  onClose, 
  userInfo,
  onSuccess,
  observerHoldings,
  product,
  onNavigateToSubscriptionApplication,
  onNavigateToSubscriptionRedemptionRecords,
  onNavigateToContracts
}: { 
  lang?: 'zh' | 'en';
  onClose?: () => void;
  userInfo?: any;
  onSuccess?: (redemptionId: string) => void;
  observerHoldings?: any[];
  product?: any;
  onNavigateToSubscriptionApplication?: () => void;
  onNavigateToSubscriptionRedemptionRecords?: () => void;
  onNavigateToContracts?: () => void;
}) {
  const insets = useSafeAreaInsets()
  
  const [positions, setPositions] = useState<Position[]>([])
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null)
  const [redemptionShares, setRedemptionShares] = useState<string>('')
  const [confirmRedemptionShares, setConfirmRedemptionShares] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [focusedInput, setFocusedInput] = useState<string | null>(null)

  const t = lang === 'zh' ? {
    title: '赎回申请',
    subscriptionApplication: '申购申请',
    redemptionApplication: '赎回申请',
    subscriptionRedemptionRecords: '交易记录',
    contracts: '合同签订',
    positionSelection: '选择持仓基金',
    productName: '基金产品名称',
    productCode: '产品代码',
    nav: '最新净值',
    shares: '持仓份额',
    availableShares: '可用份额',
    redemptionAmount: '赎回份额',
    confirmRedemptionAmount: '再次确认赎回份额',
    submit: '提交申请',
    submitting: '提交中...',
    success: '赎回申请提交成功',
    error: '提交失败',
    pleaseSelectPosition: '请选择基金产品',
    pleaseEnterAmount: '请输入赎回份额',
    pleaseConfirmAmount: '请确认赎回份额',
    invalidAmount: '赎回份额无效',
    amountsMismatch: '两次输入的份额不一致',
    insufficientShares: '可用份额不足',
    minInvestment: '最低赎回份额',
    maxInvestment: '最高赎回份额',
    riskWarning: '风险提示：赎回可能会产生手续费',
    submissionNote: '赎回申请提交后，我们将按照规定的时间（每季度赎回一次）尽快处理您的申请。',
    fullRedemption: '全部',
    redemptionHalf: '1/2',
    redemptionThird: '1/3',
    redemptionQuarter: '1/4',
    open: '已开放',
    closed: '已售净',
    lowRisk: '低风险',
    mediumRisk: '中风险',
    highRisk: '高风险',
    required: '必填',
    estimatedAmount: '预计赎回金额',
    profitLoss: '预估盈亏',
  } : {
    title: 'Redemption Application',
    subscriptionApplication: 'Subscription Application',
    redemptionApplication: 'Redemption Application',
    subscriptionRedemptionRecords: 'Subscription/Redemption Records',
    contracts: 'Contracts',
    positionSelection: 'Select Position',
    productName: 'Product Name',
    productCode: 'Product Code',
    nav: 'Latest NAV',
    shares: 'Holding Shares',
    availableShares: 'Available Shares',
    redemptionAmount: 'Redemption Shares',
    confirmRedemptionAmount: 'Confirm Redemption Shares',
    submit: 'Submit Application',
    submitting: 'Submitting...',
    success: 'Redemption application submitted successfully',
    error: 'Submission failed',
    pleaseSelectPosition: 'Please select a fund product',
    pleaseEnterAmount: 'Please enter redemption shares',
    pleaseConfirmAmount: 'Please confirm redemption shares',
    invalidAmount: 'Invalid redemption shares',
    amountsMismatch: 'The two entered shares do not match',
    insufficientShares: 'Insufficient available shares',
    minInvestment: 'Minimum Redemption Shares',
    maxInvestment: 'Maximum Redemption Shares',
    riskWarning: 'Risk Warning: Redemption may incur fees',
    submissionNote: 'After submitting the redemption application, we will process your application as soon as possible according to the specified schedule (once per quarter).',
    fullRedemption: 'Full',
    redemptionHalf: '1/2',
    redemptionThird: '1/3',
    redemptionQuarter: '1/4',
    open: 'Open',
    closed: 'Closed',
    lowRisk: 'Low Risk',
    mediumRisk: 'Medium Risk',
    highRisk: 'High Risk',
    required: 'Required',
    estimatedAmount: 'Estimated Amount',
    profitLoss: 'Est. P&L',
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
    if (lang === 'zh') {
      return product.name_cn || product.name || product.name_en || '基金产品'
    } else {
      return product.name_en || product.name || product.name_cn || 'Fund Product'
    }
  }

  const getProductCode = (product: Product) => {
    return product.product_number || 'N/A'
  }

  const getProductNav = (position: Position) => {
    return position.latest_nav || position.product.nav || position.product.net_asset_value || 0
  }

  const getEstimatedAmount = () => {
    if (!selectedPosition || !redemptionShares) return 0
    const shares = parseFloat(redemptionShares)
    const nav = getProductNav(selectedPosition)
    return shares * nav
  }

  const getProfitLoss = () => {
    if (!selectedPosition || !redemptionShares) return 0
    const shares = parseFloat(redemptionShares)
    const currentValue = shares * getProductNav(selectedPosition)
    const costValue = shares * selectedPosition.cost_price
    return currentValue - costValue
  }

  useEffect(() => {
    const loadPositions = async () => {
      setLoading(true)
      try {
        if (observerHoldings && observerHoldings.length > 0) {
          const formattedPositions: Position[] = []
          
          for (const pos of observerHoldings) {
            let productNameCn = pos.product?.name_cn
            let productNameEn = pos.product?.name_en
            let productNumber = pos.product?.product_number
            
            if ((!productNameCn && !productNameEn || !productNumber) && pos.fund_id) {
              const { data: productData, error: productError } = await supabase
                .from('products')
                .select('name_cn, name_en, product_number')
                .eq('id', pos.fund_id)
                .single()
              
              if (!productError && productData) {
                productNameCn = productData.name_cn
                productNameEn = productData.name_en
                productNumber = productData.product_number
              }
            }
            
            formattedPositions.push({
              id: pos.id,
              product_id: pos.fund_id,
              shares: pos.shares,
              available_shares: pos.available_shares || pos.shares,
              cost_price: pos.avg_cost,
              current_value: pos.current_value,
              latest_nav: pos.latest_nav || pos.product?.nav || pos.product?.net_asset_value,
              product: {
                id: pos.product?.id || pos.fund_id,
                product_number: productNumber || pos.product?.product_number || '',
                name_cn: productNameCn || pos.product?.name_cn || '基金产品',
                name_en: productNameEn || pos.product?.name_en || 'Fund Product',
                nav: pos.product?.nav || pos.latest_nav,
                net_asset_value: pos.product?.net_asset_value || pos.latest_nav,
                annual_return: pos.product?.annual_return || 0
              }
            })
          }
          
          setPositions(formattedPositions)
          setLoading(false)
          return
        }
        
        if (!userInfo || !userInfo.id) {
          setPositions([])
          setLoading(false)
          return
        }

        const { data: positionsData, error: positionsError } = await supabase
          .from('positions')
          .select(`
            *, 
            products (
              id,
              product_number,
              name_cn,
              name_en,
              nav,
              net_asset_value,
              annual_return
            )
          `)
          .eq('user_id', userInfo.id)
        
        if (positionsError) {
          console.error('Failed to load positions:', positionsError)
          setPositions([])
        } else {
          if (positionsData && positionsData.length > 0) {
            const formattedPositions: Position[] = []
            
            for (const pos of positionsData) {
              let productNameCn = pos.product?.name_cn
              let productNameEn = pos.product?.name_en
              
              if ((!productNameCn && !productNameEn || !pos.product?.product_number) && pos.fund_id) {
                const { data: productData, error: productError } = await supabase
                  .from('products')
                  .select('name_cn, name_en, product_number')
                  .eq('id', pos.fund_id)
                  .single()
                
                if (!productError && productData) {
                  productNameCn = productData.name_cn
                  productNameEn = productData.name_en
                  if (productData.product_number && !pos.product?.product_number) {
                    pos.product = pos.product || {}
                    pos.product.product_number = productData.product_number
                  }
                }
              }
              
              formattedPositions.push({
                id: pos.id,
                product_id: pos.fund_id,
                shares: pos.shares,
                available_shares: pos.available_shares || pos.shares,
                cost_price: pos.avg_cost,
                current_value: pos.current_value,
                latest_nav: pos.latest_nav,
                product: {
                  id: pos.product?.id || pos.fund_id,
                  product_number: pos.product?.product_number || '',
                  name_cn: productNameCn || pos.product?.name_cn || '基金产品',
                  name_en: productNameEn || pos.product?.name_en || 'Fund Product',
                  nav: pos.product?.nav || pos.latest_nav,
                  net_asset_value: pos.product?.net_asset_value || pos.latest_nav,
                  annual_return: pos.product?.annual_return || 0
                }
              })
            }
            
            setPositions(formattedPositions)
          } else {
            setPositions([])
          }
        }
      } catch (error) {
        console.error('Error loading positions:', error)
        setPositions([])
      } finally {
        setLoading(false)
      }
    }

    loadPositions()
  }, [userInfo, supabase, lang, observerHoldings])

  useEffect(() => {
    if (product && positions.length > 0) {
      const matchingPosition = positions.find(pos => pos.product.id === product.id)
      if (matchingPosition) {
        setSelectedPosition(matchingPosition)
      }
    }
  }, [product, positions])

  const handleSubmit = async () => {
    setSubmitting(true)
    setError(null)
    setSuccess(null)
    
    try {
      if (redemptionShares !== confirmRedemptionShares) {
        Alert.alert(t.error, t.amountsMismatch)
        setSubmitting(false)
        return
      }
      
      const shares = parseFloat(redemptionShares)
      const nav = selectedPosition?.latest_nav || selectedPosition?.product.nav || selectedPosition?.product.net_asset_value || 0
      const total_amount = shares * nav
      
      const insertData = {
        user_id: userInfo?.id,
        fund_id: selectedPosition?.product_id,
        type: 'redemption',
        shares: shares,
        total_amount: total_amount,
        nav: nav
      }
      
      const { data, error: srError } = await supabase
        .from('subscription_redemption')
        .insert(insertData)
        .select()
      
      setSubmitting(false)
      
      if (srError) {
        console.error('Failed to submit redemption:', srError)
        Alert.alert(t.error, lang === 'zh' ? '提交失败，请稍后重试' : 'Submission failed, please try again later')
        return
      }
      
      if (selectedPosition) {
        const sharesToRedeem = parseFloat(redemptionShares)
        const currentAvailableShares = selectedPosition.available_shares || selectedPosition.shares
        const newAvailableShares = currentAvailableShares - sharesToRedeem
        
        const { error: updateError } = await supabase
          .from('positions')
          .update({ available_shares: newAvailableShares })
          .eq('id', selectedPosition.id)
          
        if (updateError) {
          console.error('Failed to update available shares:', updateError)
        }
      }
      
      await messageGenerator.generateFundTransactionMessage(
        userInfo?.id || '',
        userInfo?.nickname || userInfo?.name || '极光用户',
        '赎回'
      );
      
      const redemptionId = data && data.length > 0 ? data[0].id : null
      
      if (onSuccess && redemptionId) {
        onSuccess(redemptionId)
      } else {
        Alert.alert(t.error, lang === 'zh' ? '提交成功但无法获取申请ID' : 'Submission successful but unable to get application ID')
      }
    } catch (error) {
      console.error('Error submitting redemption:', error)
      setSubmitting(false)
      Alert.alert(t.error, lang === 'zh' ? '提交失败，请稍后重试' : 'Submission failed, please try again later')
    }
  }
  
  const handleRedemptionRatio = (ratio: number) => {
    if (selectedPosition) {
      const shares = (selectedPosition.available_shares * ratio).toFixed(2)
      setRedemptionShares(shares)
      setConfirmRedemptionShares('')
    }
  }

  const renderPositionSelector = () => {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderIcon}>
            <Ionicons name="cube" size={20} color="#1A4EA2" />
          </View>
          <Text style={styles.cardTitle}>{t.positionSelection}</Text>
          <View style={styles.requiredTag}>
            <Text style={styles.requiredTagText}>{t.required}</Text>
          </View>
        </View>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1A4EA2" />
            <Text style={styles.loadingText}>{lang === 'zh' ? '加载中...' : 'Loading...'}</Text>
          </View>
        ) : positions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="wallet-outline" size={48} color="#CCC" />
            <Text style={styles.emptyText}>{lang === 'zh' ? '暂无持仓产品' : 'No available positions'}</Text>
          </View>
        ) : (
          <View style={styles.productList}>
            {positions.map((position) => (
              <TouchableOpacity 
                key={position.id} 
                style={[
                  styles.productItem, 
                  selectedPosition?.id === position.id && styles.selectedProductItem
                ]}
                onPress={() => setSelectedPosition(position)}
                activeOpacity={0.8}
              >
                <View style={styles.productItemLeft}>
                  <LinearGradient
                    colors={['#FF9800', '#F57C00']}
                    style={styles.productIcon}
                  >
                    <Text style={styles.productIconText}>持</Text>
                  </LinearGradient>
                </View>
                <View style={styles.productItemContent}>
                  <Text style={styles.productItemName}>{getProductName(position.product)}</Text>
                  <Text style={styles.productItemCode}>{getProductCode(position.product)}</Text>
                  <View style={styles.productItemDetails}>
                    <View style={[styles.shareBadge, { backgroundColor: '#E3F2FD' }]}>
                      <Text style={[styles.shareBadgeText, { color: '#1A4EA2' }]}>
                        {t.availableShares}: {position.available_shares.toFixed(2)}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.radioContainer}>
                  <View style={[
                    styles.radioOuter,
                    selectedPosition?.id === position.id && styles.radioOuterSelected
                  ]}>
                    {selectedPosition?.id === position.id && <View style={styles.radioInner} />}
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
    if (!selectedPosition) return null
    
    const profitLoss = getProfitLoss()
    const isProfit = profitLoss >= 0
    
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
            colors={['#FF9800', '#F57C00']}
            style={styles.productInfoHeader}
          >
            <View style={styles.productInfoHeaderContent}>
              <Text style={styles.productInfoName}>{getProductName(selectedPosition.product)}</Text>
              <Text style={styles.productInfoCode}>{getProductCode(selectedPosition.product)}</Text>
            </View>
          </LinearGradient>
          <View style={styles.productInfoDetails}>
            <View style={styles.productInfoDetailItem}>
              <View style={[styles.infoIconContainer, { backgroundColor: '#E3F2FD' }]}>
                <Ionicons name="trending-up" size={18} color="#1A4EA2" />
              </View>
              <View>
                <Text style={styles.productInfoDetailLabel}>{t.nav}</Text>
                <Text style={styles.productInfoDetailValue}>¥{getProductNav(selectedPosition).toFixed(4)}</Text>
              </View>
            </View>
            <View style={styles.productInfoDetailItem}>
              <View style={[styles.infoIconContainer, { backgroundColor: '#E8F5E9' }]}>
                <Ionicons name="layers" size={18} color="#4CAF50" />
              </View>
              <View>
                <Text style={styles.productInfoDetailLabel}>{t.shares}</Text>
                <Text style={[styles.productInfoDetailValue, { color: '#4CAF50' }]}>
                  {selectedPosition.shares.toFixed(2)}
                </Text>
              </View>
            </View>
            <View style={styles.productInfoDetailItem}>
              <View style={[styles.infoIconContainer, { backgroundColor: '#FFF3E0' }]}>
                <Ionicons name="wallet" size={18} color="#FF9800" />
              </View>
              <View>
                <Text style={styles.productInfoDetailLabel}>{t.availableShares}</Text>
                <Text style={[styles.productInfoDetailValue, { color: '#FF9800' }]}>
                  {selectedPosition.available_shares.toFixed(2)}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    )
  }

  const isSubmitDisabled = !selectedPosition || !redemptionShares || !confirmRedemptionShares || redemptionShares !== confirmRedemptionShares || submitting

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
              style={styles.functionButton} 
              onPress={() => onNavigateToSubscriptionApplication?.()}
            >
              <View style={styles.functionIconContainer}>
                <Ionicons name="add-circle" size={22} color="#999" />
              </View>
              <Text style={styles.functionButtonText}>{t.subscriptionApplication}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.functionButton, styles.activeFunctionButton]} 
              onPress={() => {}}
            >
              <View style={[styles.functionIconContainer, styles.activeFunctionIconContainer]}>
                <Ionicons name="remove-circle" size={22} color="#FFFFFF" />
              </View>
              <Text style={[styles.functionButtonText, styles.activeFunctionButtonText]}>{t.redemptionApplication}</Text>
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
          {!product && renderPositionSelector()}
          {renderProductInfo()}
          
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderIcon}>
                <Ionicons name="cash" size={20} color="#1A4EA2" />
              </View>
              <Text style={styles.cardTitle}>{t.redemptionAmount}</Text>
              <View style={styles.requiredTag}>
                <Text style={styles.requiredTagText}>{t.required}</Text>
              </View>
            </View>
            <View style={[
              styles.amountInputContainer,
              focusedInput === 'shares' && styles.amountInputContainerFocused
            ]}>
              <TextInput
                style={styles.amountInput}
                placeholder={lang === 'zh' ? `请输入${t.redemptionAmount}` : `Please enter ${t.redemptionAmount}`}
                placeholderTextColor="#999"
                keyboardType="decimal-pad"
                value={redemptionShares}
                onChangeText={setRedemptionShares}
                editable={!submitting}
                onFocus={() => setFocusedInput('shares')}
                onBlur={() => setFocusedInput(null)}
              />
              <Text style={styles.unitText}>份</Text>
            </View>
            
            {selectedPosition && (
              <View style={styles.quickAmountContainer}>
                <TouchableOpacity 
                  style={styles.quickAmountButton}
                  onPress={() => handleRedemptionRatio(1)}
                  disabled={submitting}
                >
                  <Text style={styles.quickAmountText}>{t.fullRedemption}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.quickAmountButton}
                  onPress={() => handleRedemptionRatio(0.5)}
                  disabled={submitting}
                >
                  <Text style={styles.quickAmountText}>{t.redemptionHalf}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.quickAmountButton}
                  onPress={() => handleRedemptionRatio(1/3)}
                  disabled={submitting}
                >
                  <Text style={styles.quickAmountText}>{t.redemptionThird}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.quickAmountButton}
                  onPress={() => handleRedemptionRatio(0.25)}
                  disabled={submitting}
                >
                  <Text style={styles.quickAmountText}>{t.redemptionQuarter}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderIcon}>
                <Ionicons name="checkmark-circle" size={20} color="#1A4EA2" />
              </View>
              <Text style={styles.cardTitle}>{t.confirmRedemptionAmount}</Text>
              <View style={styles.requiredTag}>
                <Text style={styles.requiredTagText}>{t.required}</Text>
              </View>
            </View>
            <View style={[
              styles.amountInputContainer,
              focusedInput === 'confirmShares' && styles.amountInputContainerFocused
            ]}>
              <TextInput
                style={styles.amountInput}
                placeholder={lang === 'zh' ? `请再次输入${t.redemptionAmount}` : `Please re-enter ${t.redemptionAmount}`}
                placeholderTextColor="#999"
                keyboardType="decimal-pad"
                value={confirmRedemptionShares}
                onChangeText={setConfirmRedemptionShares}
                editable={!submitting}
                onFocus={() => setFocusedInput('confirmShares')}
                onBlur={() => setFocusedInput(null)}
              />
              <Text style={styles.unitText}>份</Text>
            </View>
            <Text style={styles.manualInputHint}>{lang === 'zh' ? '请手工填写' : 'Please fill in manually'}</Text>
          </View>

          {selectedPosition && redemptionShares && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderIcon}>
                  <Ionicons name="calculator" size={20} color="#1A4EA2" />
                </View>
                <Text style={styles.cardTitle}>{t.estimatedAmount}</Text>
              </View>
              <View style={styles.estimatedAmountContent}>
                <Text style={styles.estimatedAmountSymbol}>¥</Text>
                <Text style={styles.estimatedAmountValue}>
                  {getEstimatedAmount().toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
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
              colors={isSubmitDisabled ? ['#CCC', '#999'] : ['#FF5722', '#D84315']}
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
    backgroundColor: '#FF5722',
  },
  functionButtonText: {
    fontSize: 11,
    color: '#999',
    fontWeight: '500',
  },
  activeFunctionButtonText: {
    color: '#FF5722',
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
    backgroundColor: '#FFF3E0',
    borderColor: '#FF9800',
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
  shareBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  shareBadgeText: {
    fontSize: 11,
    fontWeight: '500',
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
    borderColor: '#FF9800',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF9800',
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
  productInfoDetails: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#F8F9FA',
    gap: 8,
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
    marginRight: 8,
  },
  productInfoDetailLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 2,
  },
  productInfoDetailValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
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
    borderColor: '#FF9800',
    backgroundColor: '#FFFFFF',
    shadowColor: '#FF9800',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  amountInput: {
    flex: 1,
    fontSize: 22,
    fontWeight: '600',
    color: '#333',
  },
  unitText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#999',
  },
  quickAmountContainer: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  quickAmountButton: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    alignItems: 'center',
  },
  quickAmountText: {
    fontSize: 14,
    color: '#FF9800',
    fontWeight: '600',
  },
  manualInputHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    textAlign: 'right',
  },
  estimatedAmountContent: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  estimatedAmountSymbol: {
    fontSize: 20,
    fontWeight: '500',
    color: '#4CAF50',
    marginRight: 4,
  },
  estimatedAmountValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#4CAF50',
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
    shadowColor: '#FF5722',
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
