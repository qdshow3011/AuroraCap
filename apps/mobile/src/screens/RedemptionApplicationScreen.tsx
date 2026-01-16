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
  net_asset_value?: number;
  annual_return?: number;
}

// 持仓类型定义
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

// 现金余额类型定义
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
  // 状态管理
  const [positions, setPositions] = useState<Position[]>([])
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null)
  const [redemptionShares, setRedemptionShares] = useState<string>('')
  const [confirmRedemptionShares, setConfirmRedemptionShares] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // 语言翻译
  const t = lang === 'zh' ? {
    title: '赎回申请',
    subscriptionApplication: '申购申请',
    redemptionApplication: '赎回申请',
    subscriptionRedemptionRecords: '交易记录',
    contracts: '合同签订',
    positionSelection: '持仓状况（选择拟赎回基金）',
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
    redemptionFifth: '1/5',
    open: '已开放',
    closed: '已售净',
    lowRisk: '低风险',
    mediumRisk: '中风险',
    highRisk: '高风险'
  } : {
    title: 'Redemption Application',
    subscriptionApplication: 'Subscription Application',
    redemptionApplication: 'Redemption Application',
    subscriptionRedemptionRecords: 'Subscription/Redemption Records',
    contracts: 'Contracts',
    positionSelection: 'Position Selection',
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
    redemptionFifth: '1/5',
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
    // 优先使用产品的中文名称或英文名称
    console.log('getProductName called with product:', product)
    if (lang === 'zh') {
      return product.name_cn || product.name || product.name_en || '基金产品'
    } else {
      return product.name_en || product.name || product.name_cn || 'Fund Product'
    }
  }

  // 获取产品代码
  const getProductCode = (product: Product) => {
    return product.product_number || 'N/A'
  }

  // 获取产品净值
  const getProductNav = (position: Position) => {
    // 优先使用positions表的latest_nav字段，这是最新的净值
    return position.latest_nav || position.product.nav || position.product.net_asset_value || 0
  }

  // 加载用户持仓
  useEffect(() => {
    const loadPositions = async () => {
      setLoading(true)
      try {
        // 详细打印userInfo
        console.log('loadPositions called')
        console.log('Full userInfo:', JSON.stringify(userInfo, null, 2))
        console.log('User ID:', userInfo?.id)
        console.log('User name:', userInfo?.name)
        console.log('observerHoldings:', observerHoldings)
        console.log('observerHoldings length:', observerHoldings?.length)
        
        // 首先检查是否有特约观察员持仓数据
        if (observerHoldings && observerHoldings.length > 0) {
          console.log('Using observerHoldings data, found', observerHoldings.length, 'positions')
          
          // 格式化持仓数据
          const formattedPositions: Position[] = []
          
          for (const pos of observerHoldings) {
            console.log('Processing observer position:', pos.id, 'fund_id:', pos.fund_id, 'product:', pos.product)
            
            let productNameCn = pos.product?.name_cn
            let productNameEn = pos.product?.name_en
            let productNumber = pos.product?.product_number
            
            // 如果没有产品名称或编号，尝试根据fund_id查询products表
            if ((!productNameCn && !productNameEn || !productNumber) && pos.fund_id) {
              console.log('Product information not complete, querying products table for fund_id:', pos.fund_id)
              const { data: productData, error: productError } = await supabase
                .from('products')
                .select('name_cn, name_en, product_number') // 增加product_number字段
                .eq('id', pos.fund_id)
                .single()
              
              if (!productError && productData) {
                console.log('Found product data:', productData)
                productNameCn = productData.name_cn
                productNameEn = productData.name_en
                productNumber = productData.product_number
              }
            }
            
            formattedPositions.push({
              id: pos.id,
              product_id: pos.fund_id,
              shares: pos.shares,
              available_shares: pos.available_shares || pos.shares, // 如果没有available_shares字段，默认使用shares
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
          
          console.log('Formatted observer positions:', formattedPositions)
          console.log('Formatted positions count:', formattedPositions.length)
          setPositions(formattedPositions)
          setLoading(false)
          return
        }
        
        console.log('No observerHoldings, using userInfo to fetch positions')
        
        if (!userInfo || !userInfo.id) {
          console.log('No user info or user ID, clearing positions')
          setPositions([])
          setLoading(false)
          return
        }

        // 获取持仓数据，使用表连接方式同时获取产品信息
        console.log('=== 开始查询持仓数据 ===')
        console.log('查询条件：user_id =', userInfo.id)
        
        // 先直接查询positions表，不使用表连接，查看是否能获取到数据
        const { data: simplePositionsData, error: simplePositionsError } = await supabase
          .from('positions')
          .select('*')
          .eq('user_id', userInfo.id)
        
        console.log('=== 简单查询结果 ===')
        console.log('数据：', simplePositionsData)
        console.log('错误：', simplePositionsError)
        console.log('数据数量：', simplePositionsData?.length)
        
        // 再使用表连接查询
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
        
        console.log('=== 表连接查询结果 ===')
        console.log('数据：', positionsData)
        console.log('错误：', positionsError)
        console.log('数据数量：', positionsData?.length)
        
        if (positionsError) {
          console.error('Failed to load positions:', positionsError)
          setPositions([])
        } else {
          console.log('Positions data:', positionsData)
          if (positionsData && positionsData.length > 0) {
            console.log('Found', positionsData.length, 'positions')
            
            // 格式化持仓数据
            const formattedPositions: Position[] = []
            
            for (const pos of positionsData) {
              console.log('Processing position:', pos.id, 'fund_id:', pos.fund_id, 'product:', pos.product)
              
              let productNameCn = pos.product?.name_cn
              let productNameEn = pos.product?.name_en
              
              // 如果没有产品名称或编号，尝试根据fund_id查询products表
              if ((!productNameCn && !productNameEn || !pos.product?.product_number) && pos.fund_id) {
                console.log('Product information not complete, querying products table for fund_id:', pos.fund_id)
                const { data: productData, error: productError } = await supabase
                  .from('products')
                  .select('name_cn, name_en, product_number') // 增加product_number字段
                  .eq('id', pos.fund_id)
                  .single()
                
                if (!productError && productData) {
                  console.log('Found product data:', productData)
                  productNameCn = productData.name_cn
                  productNameEn = productData.name_en
                  // 如果查询到了product_number，保存它
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
                available_shares: pos.available_shares || pos.shares, // 如果没有available_shares字段，默认使用shares
                cost_price: pos.avg_cost,
                current_value: pos.current_value,
                latest_nav: pos.latest_nav, // 确保包含latest_nav字段，来自数据库
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
            
            console.log('Formatted positions:', formattedPositions)
            console.log('Formatted positions count:', formattedPositions.length)
            setPositions(formattedPositions)
          } else {
            console.log('No positions found for user:', userInfo.id)
            setPositions([])
          }
        }
      } catch (error) {
        console.error('Error loading positions:', error)
        setPositions([])
      } finally {
        setLoading(false)
        console.log('loadPositions completed')
      }
    }

    loadPositions()
  }, [userInfo, supabase, lang, observerHoldings])

  // 追踪状态变化，便于调试
  useEffect(() => {
    console.log('State changes detected:', {
      selectedPosition: !!selectedPosition,
      redemptionShares: !!redemptionShares,
      confirmRedemptionShares: !!confirmRedemptionShares,
      amountsMatch: redemptionShares === confirmRedemptionShares,
      submitting,
      product: !!product
    })
  }, [selectedPosition, redemptionShares, confirmRedemptionShares, submitting, product])

  // 当传入product时，自动查找对应的持仓并设置为选中状态
  useEffect(() => {
    console.log('Product prop received:', product)
    if (product && positions.length > 0) {
      console.log('Looking for position with product_id:', product.id)
      const matchingPosition = positions.find(pos => pos.product.id === product.id)
      console.log('Matching position found:', matchingPosition)
      if (matchingPosition) {
        setSelectedPosition(matchingPosition)
      }
    }
  }, [product, positions])

  // 提交赎回申请
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
      if (redemptionShares !== confirmRedemptionShares) {
        console.log('Submit failed: Amounts mismatch')
        console.log('Amounts:', { redemptionShares, confirmRedemptionShares })
        Alert.alert(t.error, t.amountsMismatch)
        setSubmitting(false)
        return
      }
      
      console.log('两次份额输入一致，开始执行数据库写入...')
      
      // 执行真实的数据库写入
      const shares = parseFloat(redemptionShares)
      // 优先使用positions表的latest_nav，这是数据库中的真实净值
      const nav = selectedPosition?.latest_nav || selectedPosition?.product.nav || selectedPosition?.product.net_asset_value || 0
      const total_amount = shares * nav
      
      const insertData = {
        user_id: userInfo?.id, // 确保使用真实用户ID
        fund_id: selectedPosition?.product_id, // 确保使用真实基金ID
        type: 'redemption',
        shares: shares,
        total_amount: total_amount,
        nav: nav
      }
      
      console.log('准备插入的数据:', insertData)
      
      // 执行数据库插入操作
      const { data, error: srError } = await supabase
        .from('subscription_redemption')
        .insert(insertData)
        .select() // 添加select()以返回插入的数据
      
      console.log('数据库插入操作完成，结果:', { data, srError })
      
      // 无论成功还是失败，立即设置submitting为false
      setSubmitting(false)
      console.log('设置submitting为false')
      
      if (srError) {
        console.error('Failed to submit redemption:', srError)
        Alert.alert(t.error, lang === 'zh' ? '提交失败，请稍后重试' : 'Submission failed, please try again later')
        return
      }
      
      console.log('数据库写入成功！返回数据:', data)
      
      // 获取插入的赎回ID
      const redemptionId = data && data.length > 0 ? data[0].id : null
      console.log('获取到的赎回ID:', redemptionId)
      
      // 更新positions表中的可用份额
      if (selectedPosition) {
        const sharesToRedeem = parseFloat(redemptionShares)
        const currentAvailableShares = selectedPosition.available_shares || selectedPosition.shares
        const newAvailableShares = currentAvailableShares - sharesToRedeem
        
        console.log('更新可用份额:', {
          positionId: selectedPosition.id,
          currentAvailableShares,
          sharesToRedeem,
          newAvailableShares
        })
        
        // 执行数据库更新操作
        const { error: updateError } = await supabase
          .from('positions')
          .update({ available_shares: newAvailableShares })
          .eq('id', selectedPosition.id)
          
        if (updateError) {
          console.error('Failed to update available shares:', updateError)
          // 这里不阻止成功回调，因为赎回申请已经成功提交，只是可用份额更新失败
          // 可以考虑添加警告信息
        } else {
          console.log('可用份额更新成功')
        }
      }
      
      // 生成赎回消息通知
      await messageGenerator.generateFundTransactionMessage(
        userInfo?.id || '',
        userInfo?.nickname || userInfo?.name || '极光用户',
        '赎回'
      );
      
      // 调用成功回调，跳转到成功页面
      if (onSuccess && redemptionId) {
        console.log('调用onSuccess回调，跳转到成功页面')
        onSuccess(redemptionId)
      } else {
        // 如果没有赎回ID，显示错误信息
        Alert.alert(t.error, lang === 'zh' ? '提交成功但无法获取申请ID' : 'Submission successful but unable to get application ID')
      }
    } catch (error) {
      console.error('Error submitting redemption:', error)
      // 出错时也要立即设置submitting为false
      setSubmitting(false)
      console.log('设置submitting为false')
      Alert.alert(t.error, lang === 'zh' ? '提交失败，请稍后重试' : 'Submission failed, please try again later')
    }
  }
  
  // 按比例赎回
  const handleRedemptionRatio = (ratio: number) => {
    if (selectedPosition) {
      // 直接使用数据库中的available_shares字段
      const shares = (selectedPosition.available_shares * ratio).toFixed(2)
      setRedemptionShares(shares)
      // 不设置confirmRedemptionShares，让用户手工填写
      setConfirmRedemptionShares('')
    }
  }

  // 渲染持仓选择器
  const renderPositionSelector = () => {
    return (
      <View style={styles.productSelectorContainer}>
        <Text style={styles.sectionTitle}>{t.positionSelection}</Text>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>{lang === 'zh' ? '加载中...' : 'Loading...'}</Text>
          </View>
        ) : positions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{lang === 'zh' ? '暂无持仓产品' : 'No available positions'}</Text>
          </View>
        ) : (
          <ScrollView style={styles.productList} showsVerticalScrollIndicator={true}>
            {positions.map((position) => (
              <TouchableOpacity 
                key={position.id} 
                style={[
                  styles.productItem, 
                  selectedPosition?.id === position.id && styles.selectedProductItem
                ]}
                onPress={() => setSelectedPosition(position)}
              >
                <View style={styles.productItemContent}>
                  <Text style={styles.productItemName}>{getProductName(position.product)}</Text>
                </View>
                {selectedPosition?.id === position.id && (
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
    if (!selectedPosition) return null
    
    return (
      <View style={styles.productInfoContainer}>
        <Text style={styles.sectionTitle}>{t.productName}</Text>
        <View style={styles.productInfoContent}>
          <Text style={styles.productInfoName}>{getProductName(selectedPosition.product)}</Text>
          <Text style={styles.productInfoCode}>{getProductCode(selectedPosition.product)}</Text>
          <View style={styles.productInfoDetails}>
            <View style={styles.productInfoDetailItem}>
              <Text style={styles.productInfoDetailLabel}>{t.nav}</Text>
              <Text style={styles.productInfoDetailValue}>¥{getProductNav(selectedPosition).toFixed(4)}</Text>
            </View>
            <View style={styles.productInfoDetailItem}>
              <Text style={styles.productInfoDetailLabel}>{t.shares}</Text>
              <Text style={styles.productInfoDetailValue}>{selectedPosition.shares.toFixed(2)}</Text>
            </View>
            <View style={styles.productInfoDetailItem}>
              <Text style={styles.productInfoDetailLabel}>{t.availableShares}</Text>
              <Text style={styles.productInfoDetailValue}>{selectedPosition.available_shares.toFixed(2)}</Text>
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
          style={styles.functionButton} 
          onPress={() => {
            console.log('申购申请 - 跳转到申购申请页面');
            onNavigateToSubscriptionApplication?.();
          }}
        >
          <Text style={styles.functionButtonIcon}>📥</Text>
          <Text style={styles.functionButtonText}>{t.subscriptionApplication}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.functionButton, styles.activeButton]} 
          onPress={() => {
            console.log('赎回申请 - 当前页面');
          }}
        >
          <Text style={styles.functionButtonIcon}>📤</Text>
          <Text style={[styles.functionButtonText, styles.activeButtonText]}>{t.redemptionApplication}</Text>
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
        {/* 产品选择器 - 只有当没有传入产品时才显示 */}
        {!product && renderPositionSelector()}
        
        {/* 产品信息 */}
        {renderProductInfo()}
        
        {/* 赎回份额输入 */}
        <View style={styles.amountContainer}>
          <Text style={styles.sectionTitle}>{t.redemptionAmount}</Text>
          <View style={styles.amountInputContainer}>
            <TextInput
              style={styles.amountInput}
              placeholder={lang === 'zh' ? `请输入${t.redemptionAmount}` : `Please enter ${t.redemptionAmount}`}
              placeholderTextColor="#999"
              keyboardType="decimal-pad"
              value={redemptionShares}
              onChangeText={setRedemptionShares}
              readOnly={submitting}
            />
            <Text style={styles.currencySymbol}>份</Text>
          </View>
          {selectedPosition && (
            <View style={styles.redemptionRatioContainer}>
              <TouchableOpacity 
                style={styles.redemptionRatioButton}
                onPress={() => handleRedemptionRatio(1)}
                disabled={submitting}
              >
                <Text style={styles.redemptionRatioButtonText}>{t.fullRedemption}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.redemptionRatioButton}
                onPress={() => handleRedemptionRatio(0.5)}
                disabled={submitting}
              >
                <Text style={styles.redemptionRatioButtonText}>{t.redemptionHalf}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.redemptionRatioButton}
                onPress={() => handleRedemptionRatio(1/3)}
                disabled={submitting}
              >
                <Text style={styles.redemptionRatioButtonText}>{t.redemptionThird}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.redemptionRatioButton}
                onPress={() => handleRedemptionRatio(0.25)}
                disabled={submitting}
              >
                <Text style={styles.redemptionRatioButtonText}>{t.redemptionQuarter}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        {/* 确认赎回份额输入 */}
        <View style={styles.amountContainer}>
          <Text style={styles.sectionTitle}>{t.confirmRedemptionAmount}</Text>
          <View style={styles.amountInputContainer}>
            <TextInput
              style={styles.amountInput}
              placeholder={lang === 'zh' ? `请再次输入${t.redemptionAmount}` : `Please re-enter ${t.redemptionAmount}`}
              placeholderTextColor="#999"
              keyboardType="decimal-pad"
              value={confirmRedemptionShares}
              onChangeText={setConfirmRedemptionShares}
              readOnly={submitting}
            />
            <Text style={styles.currencySymbol}>份</Text>
          </View>
          {/* 添加手工填写提示 */}
          <Text style={styles.manualInputHint}>{lang === 'zh' ? '请手工填写' : 'Please fill in manually'}</Text>
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
                selectedPosition: !!selectedPosition,
                redemptionShares: !!redemptionShares,
                confirmRedemptionShares: !!confirmRedemptionShares,
                amountsMatch: redemptionShares === confirmRedemptionShares,
                submitting
              })
              handleSubmit()
            }}
            disabled={!selectedPosition || !redemptionShares || !confirmRedemptionShares || redemptionShares !== confirmRedemptionShares || submitting}
          >
            <View style={{ 
              backgroundColor: (!selectedPosition || !redemptionShares || !confirmRedemptionShares || redemptionShares !== confirmRedemptionShares || submitting) ? '#a5d6a7' : '#188038', 
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
    maxHeight: 300,
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
    flexDirection: 'column',
    gap: 4,
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
  // 赎回比例按钮容器样式
  redemptionRatioContainer: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  // 赎回比例按钮样式
  redemptionRatioButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#e3f2fd',
    borderRadius: 6,
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 8,
    minWidth: 60,
  },
  redemptionRatioButtonText: {
    fontSize: 14,
    color: '#1976d2',
    fontWeight: '600',
  },
  // 手工填写提示样式
  manualInputHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    textAlign: 'right',
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