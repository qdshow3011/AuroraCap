import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native'
import { supabase } from '../lib/supabase'
import { messageGenerator } from '../utils/message-generator'

// 产品类型定义，复用ProductDetail中的接口
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

// 现金余额类型定义
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
  // 状态管理
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(product || null)
  const [products, setProducts] = useState<Product[]>([])
  const [investmentAmount, setInvestmentAmount] = useState<string>('')
  const [confirmInvestmentAmount, setConfirmInvestmentAmount] = useState<string>('')
  const [cashBalance, setCashBalance] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // 语言翻译
  const t = lang === 'zh' ? {
    title: '申购申请',
    subscriptionApplication: '申购申请',
    redemptionApplication: '赎回申请',
    subscriptionRedemptionRecords: '交易记录',
    contracts: '合同签订',
    productSelection: '基金产品（请选择拟申购的一款基金）',
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
    submissionNote: '申购申请提交后，如果可用余额里有资金，首先使用该部分资金；如没有或不足，则由客服指导如何入金，具体点击[入金咨询]。',
    open: '已开放',
    closed: '已售净',
    lowRisk: '低风险',
    mediumRisk: '中风险',
    highRisk: '高风险'
  } : {
    title: 'Subscription Application',
    subscriptionApplication: 'Subscription Application',
    redemptionApplication: 'Redemption Application',
    subscriptionRedemptionRecords: 'Subscription/Redemption Records',
    contracts: 'Contracts',
    productSelection: 'Fund Product (Please select one fund to subscribe)',
    productName: 'Product Name',
    productCode: 'Product Code',
    riskLevel: 'Risk Level',
    nav: 'Latest NAV',
    availableBalance: 'Available Balance',
    investmentAmount: 'Application Investment Amount',
    confirmInvestmentAmount: 'Confirm Investment Amount',
    submit: 'Submit Application',
    submitting: 'Submitting...',
    success: 'Subscription application submitted successfully',
    error: 'Submission failed',
    pleaseSelectProduct: 'Please select a fund product',
    pleaseEnterAmount: 'Please enter application investment amount',
    pleaseConfirmAmount: 'Please confirm investment amount',
    invalidAmount: 'Invalid application investment amount',
    amountsMismatch: 'The two entered investment amounts do not match',
    insufficientBalance: 'Insufficient balance',
    minInvestment: 'Minimum Investment',
    maxInvestment: 'Maximum Investment',
    riskWarning: 'Risk Warning: Investment involves risks, please invest cautiously',
    submissionNote: 'After submitting the subscription application, if there are funds in the available balance, this part of the funds will be used first; if there are none or insufficient, the customer service will guide you on how to deposit funds, please click [Deposit Consultation] for details.',
    open: 'Open',
    closed: 'Closed',
    lowRisk: 'Low Risk',
    mediumRisk: 'Medium Risk',
    highRisk: 'High Risk'
  }

  // 获取风险等级文本
  const getRiskLevelText = (riskLevel?: string) => {
    switch (riskLevel) {
      case 'low':
        return t.lowRisk
      case 'medium':
        return t.mediumRisk
      case 'high':
        return t.highRisk
      default:
        return riskLevel || ''
    }
  }

  // 获取产品名称
  const getProductName = (product: Product) => {
    if (product.name) return product.name
    if (lang === 'zh' && product.name_cn) return product.name_cn
    if (lang === 'en' && product.name_en) return product.name_en
    return product.name_cn || product.name_en || '未命名产品'
  }

  // 获取产品代码
  const getProductCode = (product: Product) => {
    return product.product_number || 'N/A'
  }

  // 获取产品净值
  const getProductNav = (product: Product) => {
    return product.nav || 0
  }

  // 加载可用产品和现金余额
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        // 1. 获取可用产品列表（只获取基金类型产品）
        console.log('开始获取基金产品数据...')
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*')
          // 移除类型过滤，获取所有类型产品，便于调试
          .order('created_at', { ascending: false })
        
        console.log('获取产品数据结果:', { productsData, productsError })
        
        if (productsError) {
          console.error('Failed to load products:', productsError)
          setProducts([])
        } else {
          console.log('原始产品数据:', productsData)
          // 处理产品数据，确保每个产品都有必要字段
          const processedProducts = (productsData || []).map(product => ({
            ...product,
            // 调试：移除sale_status过滤，显示所有产品
            sale_status: product.sale_status || 'open' // 调试：默认设为open
          }))
          console.log('处理后产品数据:', processedProducts)
          // 调试：移除sale_status过滤，显示所有产品
          setProducts(processedProducts)
        }
        
        // 2. 获取用户现金余额
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
            // 如果没有记录，使用默认值
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

  // 选择产品
  const handleProductSelect = (selected: Product) => {
    console.log('Product selected:', selected)
    setSelectedProduct(selected)
  }

  // 追踪状态变化，便于调试
  useEffect(() => {
    console.log('State changes detected:', {
      selectedProduct: !!selectedProduct,
      investmentAmount: !!investmentAmount,
      confirmInvestmentAmount: !!confirmInvestmentAmount,
      amountsMatch: investmentAmount === confirmInvestmentAmount,
      submitting,
      buttonDisabled: !selectedProduct || !investmentAmount || !confirmInvestmentAmount || investmentAmount !== confirmInvestmentAmount || submitting
    })
  }, [selectedProduct, investmentAmount, confirmInvestmentAmount, submitting])

  // 提交申购申请
  const handleSubmit = async () => {
    console.log('handleSubmit函数被调用')
    
    // 立即设置submitting为true，确保状态更新
    setSubmitting(true)
    console.log('设置submitting为true')
    
    // 清除之前的错误和成功信息
    setError(null)
    setSuccess(null)
    
    try {
      // 核心验证：两次输入金额是否一致
      if (investmentAmount !== confirmInvestmentAmount) {
        console.log('Submit failed: Amounts mismatch')
        console.log('Amounts:', { investmentAmount, confirmInvestmentAmount })
        Alert.alert(t.error, t.amountsMismatch)
        setSubmitting(false)
        return
      }
      
      console.log('两次金额输入一致，开始执行数据库写入...')
      
      // 执行真实的数据库写入
      const amount = parseFloat(investmentAmount)
      const insertData = {
        user_id: userInfo?.id || 'test_user_id', // 使用实际用户ID或测试ID
        fund_id: selectedProduct?.id || 'test_fund_id', // 使用实际基金ID或测试ID
        type: 'subscription',
        shares: amount / (selectedProduct?.nav || 1),
        total_amount: amount,
        nav: selectedProduct?.nav || 1
      }
      
      console.log('准备插入的数据:', insertData)
      
      // 执行数据库插入操作
      const { data, error: srError } = await supabase
        .from('subscription_redemption')
        .insert(insertData)
        .select() // 添加select()以返回插入的数据
      
      console.log('subscription_redemption插入完成，结果:', { data, srError })
      
      if (srError) {
        console.error('Failed to submit subscription:', srError)
        setSubmitting(false)
        console.log('设置submitting为false')
        Alert.alert(t.error, lang === 'zh' ? '提交失败，请稍后重试' : 'Submission failed, please try again later')
        return
      }
      
      console.log('subscription_redemption写入成功！返回数据:', data)
      
      // 准备deposit_withdrawal数据
      const depositData = {
        user_id: userInfo?.id || 'test_user_id',
        type: 'deposit',
        amount: amount,
        status: 'pending',
        notes: `自动入金 - 申购${getProductName(selectedProduct)}`
      };
      
      // 插入deposit_withdrawal记录
      const { error: dwError } = await supabase
        .from('deposit_withdrawal')
        .insert(depositData);
      
      console.log('deposit_withdrawal插入完成，结果:', { dwError })
      
      // 无论成功还是失败，立即设置submitting为false
      setSubmitting(false)
      console.log('设置submitting为false')
      
      if (dwError) {
        console.error('Failed to insert deposit_withdrawal:', dwError)
        Alert.alert(t.error, lang === 'zh' ? '提交失败，请稍后重试' : 'Submission failed, please try again later')
        return
      }
      
      // 生成申购消息通知
      await messageGenerator.generateFundTransactionMessage(
        userInfo?.id || '',
        userInfo?.nickname || userInfo?.name || '极光用户',
        '申购'
      );
      
      // 获取插入的订阅ID
      const subscriptionId = data && data.length > 0 ? data[0].id : null
      console.log('获取到的订阅ID:', subscriptionId)
      
      // 调用成功回调，跳转到成功页面
      if (onSuccess && subscriptionId) {
        console.log('调用onSuccess回调，跳转到成功页面')
        onSuccess(subscriptionId)
      } else {
        // 如果没有订阅ID，显示错误信息
        Alert.alert(t.error, lang === 'zh' ? '提交成功但无法获取申请ID' : 'Submission successful but unable to get application ID')
      }
    } catch (error) {
      console.error('Error submitting subscription:', error)
      // 出错时也要立即设置submitting为false
      setSubmitting(false)
      console.log('设置submitting为false')
      Alert.alert(t.error, lang === 'zh' ? '提交失败，请稍后重试' : 'Submission failed, please try again later')
    }
  }
  
  

  // 渲染产品选择器
  const renderProductSelector = () => {
    if (product) return null // 如果有指定产品，不显示选择器
    
    return (
      <View style={styles.productSelectorContainer}>
        <Text style={styles.sectionTitle}>{t.productSelection}</Text>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>{lang === 'zh' ? '加载中...' : 'Loading...'}</Text>
          </View>
        ) : products.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{lang === 'zh' ? '暂无可用产品' : 'No available products'}</Text>
          </View>
        ) : (
          <ScrollView style={styles.productList} showsVerticalScrollIndicator={true}>
            {products.map((p) => (
              <TouchableOpacity 
                key={p.id} 
                style={[
                  styles.productItem, 
                  selectedProduct?.id === p.id && styles.selectedProductItem
                ]}
                onPress={() => handleProductSelect(p)}
              >
                <View style={styles.productItemContent}>
                  <Text style={styles.productItemName}>{getProductName(p)}</Text>
                </View>
                {selectedProduct?.id === p.id && (
                  <Text style={styles.selectedIcon}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    )
  }

  // 渲染产品信息
  const renderProductInfo = () => {
    if (!selectedProduct) return null
    
    return (
      <View style={styles.productInfoContainer}>
        <Text style={styles.sectionTitle}>{t.productName}</Text>
        <View style={styles.productInfoContent}>
          <Text style={styles.productInfoName}>{getProductName(selectedProduct)}</Text>
          <Text style={styles.productInfoCode}>{getProductCode(selectedProduct)}</Text>
          <View style={styles.productInfoDetails}>
            <View style={styles.productInfoDetailItem}>
              <Text style={styles.productInfoDetailLabel}>{t.riskLevel}</Text>
              <Text style={styles.productInfoDetailValue}>{getRiskLevelText(selectedProduct.risk_level)}</Text>
            </View>
            <View style={styles.productInfoDetailItem}>
              <Text style={styles.productInfoDetailLabel}>{t.nav}</Text>
              <Text style={styles.productInfoDetailValue}>{getProductNav(selectedProduct).toFixed(4)}</Text>
            </View>
          </View>
        </View>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
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

      {/* 顶部功能按钮 */}
      <View style={styles.functionButtons}>
        <TouchableOpacity 
          style={[styles.functionButton, styles.activeButton]} 
          onPress={() => {
            console.log('申购申请 - 当前页面');
          }}
        >
          <Text style={styles.functionButtonIcon}>📥</Text>
          <Text style={[styles.functionButtonText, styles.activeButtonText]}>{t.subscriptionApplication}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.functionButton} 
          onPress={() => {
            console.log('赎回申请 - 跳转到赎回申请页面');
            onNavigateToRedemptionApplication?.();
          }}
        >
          <Text style={styles.functionButtonIcon}>📤</Text>
          <Text style={styles.functionButtonText}>{t.redemptionApplication}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.functionButton} 
          onPress={() => {
            console.log('交易记录 - 跳转到交易记录页面');
            onNavigateToSubscriptionRedemptionRecords?.();
          }}
        >
          <Text style={styles.functionButtonIcon}>📋</Text>
          <Text style={styles.functionButtonText}>{t.subscriptionRedemptionRecords}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.functionButton} 
          onPress={() => {
            console.log('合同签订 - 跳转到合同签订页面');
            onNavigateToContracts?.();
          }}
        >
          <Text style={styles.functionButtonIcon}>📝</Text>
          <Text style={styles.functionButtonText}>{t.contracts}</Text>
        </TouchableOpacity>
      </View>

      {/* 主要内容 */}
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 产品选择器 */}
        {renderProductSelector()}
        
        {/* 产品信息 */}
        {renderProductInfo()}
        
        {/* 可用余额 */}
        <View style={styles.balanceContainer}>
          <Text style={styles.balanceLabel}>{t.availableBalance}</Text>
          <Text style={styles.balanceValue}>¥{cashBalance.toFixed(2)}</Text>
        </View>
        
        {/* 投资金额输入 */}
        <View style={styles.amountContainer}>
          <Text style={styles.sectionTitle}>{t.investmentAmount}</Text>
          <View style={styles.amountInputContainer}>
            <Text style={styles.currencySymbol}>¥</Text>
            <TextInput
              style={styles.amountInput}
              placeholder={lang === 'zh' ? `请输入${t.investmentAmount}` : `Please enter ${t.investmentAmount}`}
              placeholderTextColor="#999"
              keyboardType="decimal-pad"
              value={investmentAmount}
              onChangeText={setInvestmentAmount}
              readOnly={submitting}
            />
          </View>
        </View>
        
        {/* 确认投资金额输入 */}
        <View style={styles.amountContainer}>
          <Text style={styles.sectionTitle}>{t.confirmInvestmentAmount}</Text>
          <View style={styles.amountInputContainer}>
            <Text style={styles.currencySymbol}>¥</Text>
            <TextInput
              style={styles.amountInput}
              placeholder={lang === 'zh' ? `请再次输入${t.investmentAmount}` : `Please re-enter ${t.investmentAmount}`}
              placeholderTextColor="#999"
              keyboardType="decimal-pad"
              value={confirmInvestmentAmount}
              onChangeText={setConfirmInvestmentAmount}
              readOnly={submitting}
            />
          </View>
        </View>
        
        {/* 风险提示 */}
        <View style={styles.riskContainer}>
          <Text style={styles.riskTitle}>{t.riskWarning}</Text>
        </View>
        
        {/* 简化的提交按钮 */}
        <View style={{ backgroundColor: 'transparent', padding: 20 }}>
          <Pressable
            onPress={() => {
              console.log('Pressable按钮被点击！')
              console.log('当前状态：', {
                selectedProduct: !!selectedProduct,
                investmentAmount: !!investmentAmount,
                confirmInvestmentAmount: !!confirmInvestmentAmount,
                amountsMatch: investmentAmount === confirmInvestmentAmount,
                submitting
              })
              handleSubmit()
            }}
            disabled={!selectedProduct || !investmentAmount || !confirmInvestmentAmount || investmentAmount !== confirmInvestmentAmount || submitting}
          >
            <View style={{ 
              backgroundColor: (!selectedProduct || !investmentAmount || !confirmInvestmentAmount || investmentAmount !== confirmInvestmentAmount || submitting) ? '#a5d6a7' : '#188038', 
              padding: 20, 
              borderRadius: 8,
              alignItems: 'center',
              justifyContent: 'center',
              height: 60
            }}>
              <Text style={{ color: 'white', fontSize: 18, fontWeight: '600' }}>
                {submitting ? t.submitting : t.submit}
              </Text>
            </View>
          </Pressable>
        </View>
        {/* 提交备注 */}
        <View style={styles.submissionNoteContainer}>
          <Text style={styles.submissionNote}>{t.submissionNote}</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  // 产品选择器样式
  productSelectorContainer: {
    marginBottom: 24,
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
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 16,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    color: '#666666',
    fontSize: 14,
  },
  productList: {
    maxHeight: 200,
  },
  productItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedProductItem: {
    backgroundColor: '#e6f4ea',
    borderRadius: 8,
  },
  productItemContent: {
    flex: 1,
  },
  productItemName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 4,
  },
  productItemCode: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 8,
  },
  productItemDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  productItemDetail: {
    fontSize: 12,
    color: '#666666',
  },
  selectedIcon: {
    fontSize: 18,
    color: '#188038',
    fontWeight: '600',
  },
  // 产品信息样式
  productInfoContainer: {
    marginBottom: 24,
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
  },
  productInfoContent: {
    alignItems: 'center',
  },
  productInfoName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  productInfoCode: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
  },
  productInfoDetails: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  productInfoDetailItem: {
    alignItems: 'center',
  },
  productInfoDetailLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  productInfoDetailValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
  },
  // 可用余额样式
  balanceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
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
  },
  balanceLabel: {
    fontSize: 15,
    color: '#666666',
  },
  balanceValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#188038',
  },
  // 金额输入样式
  amountContainer: {
    marginBottom: 24,
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
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
  },
  currencySymbol: {
    fontSize: 18,
    color: '#333333',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 18,
    color: '#333333',
  },
  // 风险提示样式
  riskContainer: {
    marginBottom: 24,
    backgroundColor: '#fff3e0',
    borderRadius: 8,
    padding: 12,
  },
  riskTitle: {
    fontSize: 14,
    color: '#e65100',
    textAlign: 'center',
  },
  // 提交按钮样式
  submitButton: {
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
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  // 提交备注样式
  submissionNoteContainer: {
    marginTop: 24,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  submissionNote: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 20,
    textAlign: 'justify',
  },
  // 空状态样式
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginVertical: 10,
  },
  emptyText: {
    color: '#666666',
    fontSize: 14,
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
})
