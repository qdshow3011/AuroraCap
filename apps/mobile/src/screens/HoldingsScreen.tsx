import { useState, useEffect, useRef } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Pressable, ActivityIndicator } from 'react-native'
import { supabase } from '../lib/supabase'

interface Product {
  id: string;
  fund_number: string;
  name_cn: string;
  name_en: string;
  net_asset_value: number;
  annual_return: number;
}

interface Position {
  id: string;
  product_id: string;
  shares: number;
  cost_price: number;
  current_value: number;
  product: Product;
}

export default function HoldingsScreen({ lang = 'zh', onClose, onNavigateToCustomerService, onNavigateToWithdrawalApplication, onNavigateToAssetStatus, userInfo }: { lang?: 'zh' | 'en'; onClose: () => void; onNavigateToCustomerService?: () => void; onNavigateToWithdrawalApplication?: () => void; onNavigateToAssetStatus?: () => void; userInfo?: any }) {
  // 状态管理
  const [positions, setPositions] = useState<Position[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  
  // 滚动相关ref
  const scrollViewRef = useRef<ScrollView>(null)

  // 语言翻译
  const t = lang === 'zh' ? {
    title: '持仓状况',
    depositService: '入金咨询',
    withdrawalApplication: '出金申请',
    assetStatus: '资产状况',
    transactionStatus: '成交状况',
    productName: '产品名称',
    fundNumber: '基金编号',
    shares: '持有份额',
    netValue: '净值',
    currentValue: '当前市值',
    noPositions: '暂无持仓记录',
    loading: '加载中...',
    refresh: '刷新'
  } : {
    title: 'Holdings Status',
    depositService: 'Deposit Consultation',
    withdrawalApplication: 'Withdrawal Application',
    assetStatus: 'Asset Status',
    transactionStatus: 'Transaction Status',
    productName: 'Product Name',
    fundNumber: 'Fund Number',
    shares: 'Shares',
    netValue: 'Net Value',
    currentValue: 'Current Value',
    noPositions: 'No positions yet',
    loading: 'Loading...',
    refresh: 'Refresh'
  }

  // 加载持仓数据
  const loadData = async (isRefresh: boolean = false) => {
    if (!userInfo || !userInfo.id) {
      setLoading(false)
      return
    }

    setLoading(isRefresh ? false : true)
    setRefreshing(isRefresh)
    try {
      // 1. 从positions表读取登录用户的持仓数据
      const { data: positionsData, error: positionsError } = await supabase
        .from('positions')
        .select('*')
        .eq('user_id', userInfo.id)
      
      console.log('HoldingsScreen - 获取持仓数据:', positionsData, positionsError)
      
      // 格式化持仓数据
      let formattedPositions: Position[] = []
      
      if (positionsData && positionsData.length > 0) {
        // 提取所有基金ID (使用fund_id字段)
        const fundIds = [...new Set(positionsData.map((pos: any) => pos.fund_id))]
        console.log('HoldingsScreen - 基金ID列表:', fundIds)
        
        // 2. 获取基金产品数据
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*')
          .in('id', fundIds)
        
        console.log('HoldingsScreen - 获取基金产品数据:', productsData, productsError)
        
        if (productsData && productsData.length > 0) {
          // 将产品数据转换为Map，便于查找
          const productsMap = new Map(productsData.map((product: Product) => [product.id, product]))
          
          // 格式化持仓数据，添加产品信息
          formattedPositions = positionsData.map((pos: any) => ({
            id: pos.id,
            product_id: pos.fund_id, // 使用fund_id作为product_id
            shares: pos.shares,
            cost_price: pos.cost_price,
            current_value: pos.current_value,
            product: productsMap.get(pos.fund_id) || {
              id: pos.fund_id,
              fund_number: '',
              name_cn: '未知产品',
              name_en: 'Unknown Product',
              net_asset_value: 1.0,
              annual_return: 0
            }
          }))
          
          console.log('HoldingsScreen - 格式化后的持仓数据:', formattedPositions)
        }
      }
      
      setPositions(formattedPositions)
    } catch (error) {
      console.error('HoldingsScreen - 加载数据失败:', error)
      setPositions([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // 组件挂载时加载数据
  useEffect(() => {
    loadData()
  }, [userInfo])

  // 下拉刷新
  const handleRefresh = () => {
    loadData(true)
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
          <TouchableOpacity style={styles.functionButton} onPress={() => {
            console.log('出金申请 - 跳转出金申请页面');
            onNavigateToWithdrawalApplication?.();
          }}>
            <Text style={styles.functionButtonIcon}>🏦</Text>
            <Text style={styles.functionButtonText}>{t.withdrawalApplication}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.functionButton} onPress={() => {
            console.log('资产状况 - 跳转资产状况页面');
            onNavigateToAssetStatus?.();
          }}>
            <Text style={styles.functionButtonIcon}>📊</Text>
            <Text style={styles.functionButtonText}>{t.assetStatus}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.functionButton} onPress={() => {
            console.log('成交状况');
            alert(lang === 'zh' ? '成交状况功能正在开发中' : 'Transaction status feature is under development');
          }}>
            <Text style={styles.functionButtonIcon}>✅</Text>
            <Text style={styles.functionButtonText}>{t.transactionStatus}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.content} 
        refreshControl={null} // React Native默认不支持refreshControl在ScrollView上，实际项目中可以使用RefreshControl组件
        onRefresh={handleRefresh}
        refreshing={refreshing}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4a90e2" />
            <Text style={styles.loadingText}>{t.loading}</Text>
          </View>
        ) : positions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{t.noPositions}</Text>
          </View>
        ) : (
          <View style={styles.positionsContainer}>
            {positions.map((position) => (
              <View key={position.id} style={styles.positionCard}>
                <Text style={styles.productName}>
                  {lang === 'zh' ? position.product.name_cn : position.product.name_en}
                </Text>
                <Text style={styles.fundNumber}>{position.product.fund_number}</Text>
                <View style={styles.positionDetails}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>{t.shares}</Text>
                    <Text style={styles.detailValue}>{typeof position.shares === 'number' ? position.shares.toFixed(2) : '0.00'}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>{t.netValue}</Text>
                    <Text style={styles.detailValue}>¥{typeof position.product.net_asset_value === 'number' ? position.product.net_asset_value.toFixed(4) : '0.0000'}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>{t.currentValue}</Text>
                    <Text style={styles.detailValue}>¥{typeof position.current_value === 'number' ? position.current_value.toFixed(2) : '0.00'}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
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
  assetManagementButtons: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    marginBottom: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  functionButton: {
    alignItems: 'center',
  },
  functionButtonIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  functionButtonText: {
    fontSize: 14,
    color: '#333',
  },
  content: {
    flex: 1,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  positionsContainer: {
    padding: 16,
  },
  positionCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  fundNumber: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  positionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  detailItem: {
    flex: 1,
    minWidth: '30%',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
})
