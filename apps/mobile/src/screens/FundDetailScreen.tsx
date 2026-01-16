import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable, Image } from 'react-native'
import { supabase } from '../lib/supabase'
import NavChart from '../components/NavChart'

// 基金产品类型定义
interface FundProduct {
  id: string
  name: string
  code: string
  returnRate: number
  riskLevel: 'low' | 'medium' | 'high'
  manager: string
  description: string
  nav: number
  inceptionDate: string
  type: string
  scale: number
  annualFee: number
  minInvestment: number
  investmentStrategy: string
  performanceData: number[]
}

export default function FundDetailScreen({ productId, lang = 'zh', onBack, demo }: { productId: string; lang?: 'zh' | 'en'; onBack: () => void; demo?: boolean }) {
  const [product, setProduct] = useState<FundProduct | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        // 直接从Supabase获取基金详情，不使用模拟数据
        console.log('Loading fund details from Supabase...');
        console.log('Fund ID:', productId);
        
        // 获取基金基本信息
        const { data: fundData, error: fundError } = await supabase
          .from('products')
          .select('*')
          .eq('id', productId)
          .single()
        
        if (fundError) {
          console.error('Error fetching fund data from Supabase:', fundError);
          throw fundError;
        }
        
        console.log('Raw fund data from Supabase:', JSON.stringify(fundData, null, 2));
        
        // 获取基金净值历史数据
        const { data: navData, error: navError } = await supabase
          .from('fund_nav_history')
          .select('nav')
          .eq('fund_id', productId)
          .order('date', { ascending: true })
        
        if (navError) {
          console.error('Error fetching NAV history from Supabase:', navError);
          throw navError;
        }
        
        console.log('Raw NAV data from Supabase:', JSON.stringify(navData, null, 2));
        
        // 构建业绩表现数据
        const performanceData = navData.map((item: any) => item.nav) || []
        
        // 转换基金类型显示
        const getFundTypeDisplay = (type: string) => {
          if (lang === 'zh') {
            switch (type) {
              case 'equity': return '股票型'
              case 'bond': return '债券型'
              case 'mixed': return '混合型'
              case 'money_market': return '货币型'
              case 'qdii': return 'QDII'
              default: return type
            }
          } else {
            switch (type) {
              case 'equity': return 'Equity'
              case 'bond': return 'Bond'
              case 'mixed': return 'Mixed'
              case 'money_market': return 'Money Market'
              case 'qdii': return 'QDII'
              default: return type
            }
          }
        }
        
        // 格式化基金数据
        const formattedProduct: FundProduct = {
          id: fundData.id,
          name: lang === 'zh' ? fundData.name_cn : fundData.name_en || fundData.name_cn,
          code: fundData.fund_number || fundData.id,
          returnRate: fundData.annual_return || 0,
          riskLevel: (fundData.risk_level || 'medium') as 'low' | 'medium' | 'high',
          manager: fundData.manager || '未知',
          description: lang === 'zh' ? fundData.description_cn : fundData.description_en || fundData.description_cn,
          nav: fundData.net_asset_value || 1.0,
          inceptionDate: fundData.creation_date ? fundData.creation_date.split('T')[0] : fundData.created_at.split('T')[0],
          type: getFundTypeDisplay(fundData.type),
          scale: fundData.asset_scale || 0,
          annualFee: fundData.management_fee || 0,
          minInvestment: fundData.min_investment || 1000,
          investmentStrategy: lang === 'zh' ? fundData.investment_strategy_cn : fundData.investment_strategy_en || fundData.investment_strategy_cn,
          performanceData: performanceData.length > 0 ? performanceData : [1.0]
        }
        
        console.log('Formatted fund data:', JSON.stringify(formattedProduct, null, 2));
        setProduct(formattedProduct)
      } catch (error) {
        console.error('Error fetching fund details from Supabase:', error);
        // 在特约观察员模式下，我们必须使用真实数据，所以即使出错也不应该回退到模拟数据
        // 而是显示错误信息
        console.log('Failed to load fund details');
      } finally {
        setLoading(false)
      }
    })()
  }, [demo, lang, productId, supabase])

  // 语言翻译
  const t = lang === 'zh' ? {
    back: '返回',
    fundDetails: '基金详情',
    type: '基金类型',
    riskLevel: '风险等级',
    manager: '基金经理',
    nav: '单位净值',
    inception: '成立日期',
    scale: '基金规模',
    annualFee: '年管理费率',
    minInvestment: '起购金额',
    yearReturn: '年收益率',
    performance: '业绩表现',
    investmentStrategy: '投资策略',
    productProfile: '产品档案',
    riskWarning: '风险提示',
    riskWarningText: '基金有风险，投资需谨慎。过往业绩不代表未来表现，投资决策需谨慎。',
    buyNow: '立即购买',
    riskLow: '低风险',
    riskMedium: '中风险',
    riskHigh: '高风险'
  } : {
    back: 'Back',
    fundDetails: 'Fund Details',
    type: 'Fund Type',
    riskLevel: 'Risk Level',
    manager: 'Fund Manager',
    nav: 'Unit NAV',
    inception: 'Inception Date',
    scale: 'Fund Scale',
    annualFee: 'Annual Fee',
    minInvestment: 'Minimum Investment',
    yearReturn: 'Annual Return',
    performance: 'Performance',
    investmentStrategy: 'Investment Strategy',
    productProfile: 'Product Profile',
    riskWarning: 'Risk Warning',
    riskWarningText: 'Fund investment involves risks. Past performance does not guarantee future results. Investment decisions should be made cautiously.',
    buyNow: 'Buy Now',
    riskLow: 'Low Risk',
    riskMedium: 'Medium Risk',
    riskHigh: 'High Risk'
  }

  // 获取风险等级对应的颜色和文本
  const getRiskLevelInfo = (level: 'low' | 'medium' | 'high') => {
    switch (level) {
      case 'low':
        return { color: '#10b981', text: t.riskLow }
      case 'medium':
        return { color: '#f59e0b', text: t.riskMedium }
      case 'high':
        return { color: '#ef4444', text: t.riskHigh }
    }
  }

  // 格式化日期
  const formatDate = (dateString: string) => {
    if (lang === 'zh') {
      return dateString
    } else {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }
  }

  // 格式化数字
  const formatNumber = (num: number, decimalPlaces: number = 2) => {
    return num.toFixed(decimalPlaces)
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>{lang === 'zh' ? '加载中...' : 'Loading...'}</Text>
      </View>
    )
  }

  if (!product) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{lang === 'zh' ? '未找到基金信息' : 'Fund not found'}</Text>
        <Pressable style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>{t.back}</Text>
        </Pressable>
      </View>
    )
  }

  const riskInfo = getRiskLevelInfo(product.riskLevel)

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 顶部导航 */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>{t.back}</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{t.fundDetails}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* 基金基本信息 */}
      <View style={styles.basicInfoContainer}>
        <View style={styles.fundNameContainer}>
          <Text style={styles.fundName}>{product.name}</Text>
          <Text style={styles.fundCode}>{product.code}</Text>
        </View>
        
        <View style={styles.returnContainer}>
          <Text style={[styles.returnRate, product.returnRate > 0 ? styles.positiveReturn : styles.negativeReturn]}>
            {product.returnRate > 0 ? '+' : ''}{product.returnRate}%
          </Text>
          <Text style={styles.returnLabel}>{t.yearReturn}</Text>
        </View>

        <View style={styles.navContainer}>
          <Text style={styles.navLabel}>{t.nav}</Text>
          <Text style={styles.navValue}>${formatNumber(product.nav)}</Text>
        </View>

        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>{t.type}</Text>
            <Text style={styles.infoValue}>{product.type}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>{t.riskLevel}</Text>
            <Text style={[styles.infoValue, { color: riskInfo.color }]}>{riskInfo.text}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>{t.manager}</Text>
            <Text style={styles.infoValue}>{product.manager}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>{t.inception}</Text>
            <Text style={styles.infoValue}>{formatDate(product.inceptionDate)}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>{t.scale}</Text>
            <Text style={styles.infoValue}>{formatNumber(product.scale)}亿</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>{t.annualFee}</Text>
            <Text style={styles.infoValue}>{formatNumber(product.annualFee)}%</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>{t.minInvestment}</Text>
            <Text style={styles.infoValue}>${formatNumber(product.minInvestment)}</Text>
          </View>
        </View>
      </View>

      {/* 业绩表现 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t.performance}</Text>
        <View style={styles.chartContainer}>
          <NavChart data={product.performanceData} />
        </View>
      </View>

      {/* 投资策略 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t.investmentStrategy}</Text>
        <Text style={styles.strategyText}>{product.investmentStrategy}</Text>
      </View>

      {/* 产品档案 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t.productProfile}</Text>
        <View style={styles.profileContainer}>
          <Text style={styles.description}>{product.description}</Text>
        </View>
      </View>

      {/* 风险提示 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t.riskWarning}</Text>
        <Text style={styles.riskWarningText}>{t.riskWarningText}</Text>
      </View>

      {/* 底部购买按钮 */}
      <View style={styles.bottomContainer}>
        <Pressable style={styles.buyButton}>
          <Text style={styles.buyButtonText}>{t.buyNow}</Text>
        </Pressable>
      </View>

      {/* 底部留白 */}
      <View style={{ height: 40 }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    color: '#333',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  errorText: {
    color: '#333',
    fontSize: 18,
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  backButton: {
    padding: 10,
  },
  backButtonText: {
    color: '#1a73e8',
    fontSize: 16,
  },
  headerTitle: {
    color: '#333',
    fontSize: 18,
    fontWeight: '600',
  },
  basicInfoContainer: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 10,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  fundNameContainer: {
    marginBottom: 15,
  },
  fundName: {
    color: '#333',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 5,
  },
  fundCode: {
    color: '#999',
    fontSize: 14,
  },
  returnContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  returnRate: {
    fontSize: 36,
    fontWeight: '700',
    marginBottom: 5,
  },
  positiveReturn: {
    color: '#d93025',
  },
  negativeReturn: {
    color: '#188038',
  },
  returnLabel: {
    color: '#999',
    fontSize: 14,
  },
  navContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  navLabel: {
    color: '#999',
    fontSize: 14,
    marginRight: 10,
  },
  navValue: {
    color: '#333',
    fontSize: 18,
    fontWeight: '600',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  infoItem: {
    width: '45%',
  },
  infoLabel: {
    color: '#999',
    fontSize: 12,
    marginBottom: 5,
  },
  infoValue: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 10,
    borderRadius: 12,
    marginHorizontal: 16,
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
    color: '#333',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  chartContainer: {
    height: 200,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 10,
  },
  strategyText: {
    color: '#666',
    fontSize: 14,
    lineHeight: 22,
  },
  profileContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 15,
  },
  description: {
    color: '#666',
    fontSize: 14,
    lineHeight: 22,
  },
  riskWarningText: {
    color: '#d93025',
    fontSize: 14,
    lineHeight: 22,
  },
  bottomContainer: {
    padding: 20,
    backgroundColor: '#fff',
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
  buyButton: {
    backgroundColor: '#1a73e8',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buyButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
})