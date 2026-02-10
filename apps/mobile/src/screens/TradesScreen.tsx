import { useState, useEffect } from 'react'
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Pressable, TextInput, Platform } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../lib/supabase'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

interface Product {
  id: string
  fund_number: string
  name_cn: string
  name_en: string
  net_asset_value: number
  annual_return: number
}

interface Position {
  id: string
  product_id: string
  shares: number
  avg_cost: number
  current_value: number
  product: Product
}

export default function TradesScreen({ 
  lang, 
  userInfo, 
  appVersion = 'standard', 
  onNavigateToSubscriptionApplication, 
  onNavigateToRedemptionApplication, 
  onNavigateToSubscriptionRedemptionRecords, 
  onNavigateToContractSigning, 
  onNavigateToMySubscriptionRecords, 
  onNavigateToMyRedemptionRecords,
  onNavigateToVersionSwitch,
  onNavigateToCustomerService,
  onNavigateToMessageCenter
}: { 
  lang: 'zh' | 'en', 
  userInfo?: any, 
  appVersion?: 'standard' | 'simple' | 'premium', 
  onNavigateToSubscriptionApplication?: () => void, 
  onNavigateToRedemptionApplication?: (product: Product) => void, 
  onNavigateToSubscriptionRedemptionRecords?: () => void, 
  onNavigateToContractSigning?: () => void, 
  onNavigateToMySubscriptionRecords?: () => void, 
  onNavigateToMyRedemptionRecords?: () => void,
  onNavigateToVersionSwitch?: () => void,
  onNavigateToCustomerService?: () => void,
  onNavigateToMessageCenter?: () => void
}) {
  // 获取安全区域信息
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'subscription' | 'redemption' | 'records' | 'contracts'>('subscription')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // 根据版本获取样式配置
  const getVersionStyles = () => {
    switch (appVersion) {
      case 'simple':
        return {
          fontSize: {
            base: 18,
            large: 22,
            small: 16
          },
          fontWeight: {
            regular: '400',
            medium: '500',
            bold: '700'
          },
          padding: {
            base: 20,
            small: 16
          },
          borderRadius: 12,
          showSimplified: true
        };
      case 'premium':
        return {
          fontSize: {
            base: 16,
            large: 20,
            small: 14
          },
          fontWeight: {
            regular: '400',
            medium: '600',
            bold: '800'
          },
          padding: {
            base: 20,
            small: 16
          },
          borderRadius: 16,
          showPremium: true
        };
      default: // standard
        return {
          fontSize: {
            base: 15,
            large: 18,
            small: 13
          },
          fontWeight: {
            regular: '400',
            medium: '500',
            bold: '700'
          },
          padding: {
            base: 16,
            small: 12
          },
          borderRadius: 8,
          showAll: true
        };
    }
  };

  const versionStyles = getVersionStyles();

  // 语言翻译
  const t = lang === 'zh' ? {
    title: '交易',
    subscription: '申购',
    redemption: '赎回',
    records: '记录',
    contracts: '合同',
    searchPlaceholder: '搜索产品',
    noProducts: '暂无产品',
    noPositions: '暂无持仓',
    productInfo: '产品信息',
    shares: '持有份额',
    avgCost: '持仓成本',
    currentValue: '当前价值',
    apply: '申请',
    subscribeNow: '立即申购',
    redeemNow: '立即赎回',
    viewRecords: '查看记录',
    viewContracts: '查看合同',
    premiumServices: '尊享服务',
    premiumContent: '专属投资顾问服务' + (appVersion === 'premium' ? ' - 已开通' : ' - 仅尊享版可用')
  } : {
    title: 'Trades',
    subscription: 'Subscribe',
    redemption: 'Redeem',
    records: 'Records',
    contracts: 'Contracts',
    searchPlaceholder: 'Search Products',
    noProducts: 'No Products',
    noPositions: 'No Positions',
    productInfo: 'Product Info',
    shares: 'Shares',
    avgCost: 'Avg Cost',
    currentValue: 'Current Value',
    apply: 'Apply',
    subscribeNow: 'Subscribe Now',
    redeemNow: 'Redeem Now',
    viewRecords: 'View Records',
    viewContracts: 'View Contracts',
    premiumServices: 'Premium Services',
    premiumContent: 'Exclusive Investment Advisor Service' + (appVersion === 'premium' ? ' - Active' : ' - Premium Only')
  };

  // 获取产品列表
  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      if (!supabase) return;

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .limit(10);

      if (error) throw error;

      if (data) {
        setProducts(data as Product[]);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 获取持仓列表
  const fetchPositions = async () => {
    try {
      setIsLoading(true);
      if (!supabase || !userInfo?.id) return;

      const { data, error } = await supabase
        .from('positions')
        .select('*, product:products(*)')
        .eq('user_id', userInfo.id)
        .limit(10);

      if (error) throw error;

      if (data) {
        setPositions(data as Position[]);
      }
    } catch (error) {
      console.error('Error fetching positions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchPositions();
  }, []);

  // 根据appVersion过滤显示的功能
  const getVisibleTabs = () => {
    switch (appVersion) {
      case 'simple':
        return ['subscription', 'redemption', 'records'];
      case 'premium':
        return ['subscription', 'redemption', 'records', 'contracts'];
      default:
        return ['subscription', 'redemption', 'records', 'contracts'];
    }
  };

  const visibleTabs = getVisibleTabs();

  // 申购部分组件
  const SubscriptionSection = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { fontSize: versionStyles.fontSize.large }]}>{t.subscription}</Text>
      
      {/* 搜索框 */}
      <TextInput
        style={[styles.searchInput, { fontSize: versionStyles.fontSize.base }]}
        placeholder={t.searchPlaceholder}
        placeholderTextColor="#999"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      
      {/* 产品列表 */}
      <ScrollView style={styles.productList}>
        {isLoading ? (
          <Text style={styles.loadingText}>{lang === 'zh' ? '加载中...' : 'Loading...'}</Text>
        ) : products.length === 0 ? (
          <Text style={styles.noDataText}>{t.noProducts}</Text>
        ) : (
          products.map((product) => (
            <Pressable 
              key={product.id} 
              style={[styles.productCard, {
                padding: versionStyles.padding.base,
                borderRadius: versionStyles.borderRadius
              }]}
              onPress={() => {
                setSelectedProduct(product);
                onNavigateToSubscriptionApplication?.();
              }}
            >
              <Text style={[styles.productName, { fontSize: versionStyles.fontSize.base, fontWeight: versionStyles.fontWeight.medium }]}>
                {lang === 'zh' ? product.name_cn : product.name_en}
              </Text>
              <Text style={[styles.productCode, { fontSize: versionStyles.fontSize.small }]}>{product.fund_number}</Text>
              <View style={styles.productDetails}>
                <View style={styles.detailItem}>
                  <Text style={[styles.detailLabel, { fontSize: versionStyles.fontSize.small }]}>{lang === 'zh' ? '净值' : 'NAV'}</Text>
                  <Text style={[styles.detailValue, { fontSize: versionStyles.fontSize.base }]}>{(product.net_asset_value || 0).toFixed(4)}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={[styles.detailLabel, { fontSize: versionStyles.fontSize.small }]}>{lang === 'zh' ? '年化' : 'Annual'}</Text>
                  <Text style={[styles.detailValue, { fontSize: versionStyles.fontSize.base }]}>{(product.annual_return || 0).toFixed(2)}%</Text>
                </View>
              </View>
              <View style={styles.actionButtons}>
                <Pressable 
                  style={[styles.applyButton, {
                    backgroundColor: '#188038',
                    borderRadius: versionStyles.borderRadius
                  }]}
                  onPress={() => {
                    setSelectedProduct(product);
                    onNavigateToSubscriptionApplication?.();
                  }}
                >
                  <Text style={styles.applyButtonText}>{t.subscribeNow}</Text>
                </Pressable>
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );

  // 赎回部分组件
  const RedemptionSection = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { fontSize: versionStyles.fontSize.large }]}>{t.redemption}</Text>
      
      {/* 搜索框 */}
      <TextInput
        style={[styles.searchInput, { fontSize: versionStyles.fontSize.base }]}
        placeholder={t.searchPlaceholder}
        placeholderTextColor="#999"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      
      {/* 持仓列表 */}
      <ScrollView style={styles.productList}>
        {isLoading ? (
          <Text style={styles.loadingText}>{lang === 'zh' ? '加载中...' : 'Loading...'}</Text>
        ) : positions.length === 0 ? (
          <Text style={styles.noDataText}>{t.noPositions}</Text>
        ) : (
          positions.map((position) => (
            <Pressable 
              key={position.id} 
              style={[styles.productCard, {
                padding: versionStyles.padding.base,
                borderRadius: versionStyles.borderRadius
              }]}
              onPress={() => {
                onNavigateToRedemptionApplication?.(position.product);
              }}
            >
              <Text style={[styles.productName, { fontSize: versionStyles.fontSize.base, fontWeight: versionStyles.fontWeight.medium }]}>
                {lang === 'zh' ? position.product.name_cn : position.product.name_en}
              </Text>
              <Text style={[styles.productCode, { fontSize: versionStyles.fontSize.small }]}>{position.product.fund_number}</Text>
              <View style={styles.holdingDetails}>
                <View style={styles.detailItem}>
                  <Text style={[styles.detailLabel, { fontSize: versionStyles.fontSize.small }]}>{t.shares}</Text>
                  <Text style={[styles.detailValue, { fontSize: versionStyles.fontSize.base }]}>{(position.shares || 0).toFixed(2)}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={[styles.detailLabel, { fontSize: versionStyles.fontSize.small }]}>{t.avgCost}</Text>
                  <Text style={[styles.detailValue, { fontSize: versionStyles.fontSize.base }]}>{(position.avg_cost || 0).toFixed(4)}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={[styles.detailLabel, { fontSize: versionStyles.fontSize.small }]}>{t.currentValue}</Text>
                  <Text style={[styles.detailValue, { fontSize: versionStyles.fontSize.base }]}>{(position.current_value || 0).toFixed(2)}</Text>
                </View>
              </View>
              <View style={styles.actionButtons}>
                <Pressable 
                  style={[styles.applyButton, {
                    backgroundColor: '#d93025',
                    borderRadius: versionStyles.borderRadius
                  }]}
                  onPress={() => {
                    onNavigateToRedemptionApplication?.(position.product);
                  }}
                >
                  <Text style={styles.applyButtonText}>{t.redeemNow}</Text>
                </Pressable>
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );

  // 记录部分组件
  const RecordsSection = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { fontSize: versionStyles.fontSize.large }]}>{t.records}</Text>
      
      <View style={styles.recordsButtons}>
        <Pressable 
          style={[styles.recordButton, {
            padding: versionStyles.padding.base,
            borderRadius: versionStyles.borderRadius
          }]}
          onPress={onNavigateToSubscriptionRedemptionRecords}
        >
          <Text style={[styles.recordButtonText, { fontSize: versionStyles.fontSize.base }]}>{t.viewRecords}</Text>
        </Pressable>
        
        {appVersion === 'premium' && (
          <Pressable 
            style={[styles.recordButton, {
              padding: versionStyles.padding.base,
              borderRadius: versionStyles.borderRadius,
              backgroundColor: '#4a90e2'
            }]}
            onPress={() => alert(t.premiumContent)}
          >
            <Text style={[styles.recordButtonText, { fontSize: versionStyles.fontSize.base, color: '#fff' }]}>{t.premiumServices}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );

  // 合同部分组件
  const ContractsSection = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { fontSize: versionStyles.fontSize.large }]}>{t.contracts}</Text>
      
      <Pressable 
        style={[styles.contractButton, {
          padding: versionStyles.padding.base,
          borderRadius: versionStyles.borderRadius
        }]}
        onPress={onNavigateToContractSigning}
      >
        <Text style={[styles.contractButtonText, { fontSize: versionStyles.fontSize.base }]}>{t.viewContracts}</Text>
      </Pressable>
    </View>
  );

  // 语言翻译
  const navLabels = {
    subscription: t.subscription,
    redemption: t.redemption,
    records: t.records,
    contracts: t.contracts
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#f0f2f5',
    },
    content: {
      flex: 1,
    },
    header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: '#f0f2f5',
  },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#333',
    },
    headerIcons: {
      flexDirection: 'row',
      gap: 16,
    },
    iconButton: {
      padding: 8,
    },
    icon: {
      fontSize: 24,
      color: '#666',
    },
    tabBar: {
      flexDirection: 'row',
      backgroundColor: '#fff',
      borderBottomWidth: 1,
      borderBottomColor: '#e0e0e0',
    },
    tabItem: {
      flex: 1,
      paddingVertical: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    activeTab: {
      borderBottomWidth: 2,
      borderBottomColor: '#4a90e2',
    },
    tabText: {
      fontSize: 16,
      fontWeight: '500',
    },
    activeTabText: {
      color: '#4a90e2',
      fontWeight: '600',
    },
    section: {
      padding: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 16,
      color: '#333',
    },
    searchInput: {
      backgroundColor: '#fff',
      padding: 12,
      borderRadius: 8,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: '#e0e0e0',
    },
    productList: {
      flex: 1,
    },
    productCard: {
      backgroundColor: '#fff',
      marginBottom: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    productName: {
      fontSize: 16,
      fontWeight: '600',
      color: '#333',
      marginBottom: 4,
    },
    productCode: {
      fontSize: 14,
      color: '#666',
      marginBottom: 8,
    },
    productDetails: {
      flexDirection: 'row',
      marginBottom: 12,
    },
    detailItem: {
      flex: 1,
    },
    detailLabel: {
      fontSize: 12,
      color: '#999',
      marginBottom: 4,
    },
    detailValue: {
      fontSize: 16,
      color: '#333',
      fontWeight: '500',
    },
    holdingDetails: {
      marginBottom: 12,
    },
    actionButtons: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
    },
    applyButton: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      backgroundColor: '#4a90e2',
      borderRadius: 8,
    },
    applyButtonText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '600',
    },
    loadingText: {
      fontSize: 16,
      color: '#666',
      textAlign: 'center',
      padding: 20,
    },
    noDataText: {
      fontSize: 16,
      color: '#666',
      textAlign: 'center',
      padding: 20,
    },
    recordsButtons: {
      flexDirection: 'column',
      gap: 12,
    },
    recordButton: {
      backgroundColor: '#fff',
      padding: 16,
      borderRadius: 8,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    recordButtonText: {
      fontSize: 16,
      color: '#333',
      fontWeight: '500',
    },
    contractButton: {
      backgroundColor: '#fff',
      padding: 16,
      borderRadius: 8,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    contractButtonText: {
      fontSize: 16,
      color: '#333',
      fontWeight: '500',
    },
    emptyContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      flex: 1,
    },
    emptyText: {
      fontSize: 16,
      color: '#666',
    },
  });

  return (
    <View style={styles.container}>
      {/* 顶部导航栏 */}
      <View style={[styles.header, { paddingTop: Platform.OS === 'web' ? 20 : 40 + insets.top }]}>
        <Text style={styles.title}>{t.title}</Text>
        <View style={styles.headerIcons}>
          {/* 消息中心图标 */}
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={onNavigateToMessageCenter}
          >
            <Ionicons name="notifications-outline" size={24} color="#333" />
          </TouchableOpacity>
          {/* 在线客服图标 */}
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={onNavigateToCustomerService}
          >
            <Ionicons name="chatbubble-outline" size={24} color="#333" />
          </TouchableOpacity>
          {/* 版本切换图标 */}
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={onNavigateToVersionSwitch}
          >
            <Ionicons name="settings-outline" size={24} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 底部标签栏 */}
      <View style={styles.tabBar}>
        {Object.entries(navLabels).map(([key, label]) => {
          const tabKey = key as 'subscription' | 'redemption' | 'records' | 'contracts';
          if (!visibleTabs.includes(tabKey)) return null;
          
          return (
            <TouchableOpacity
              key={key}
              style={[styles.tabItem, activeTab === tabKey && styles.activeTab]}
              onPress={() => setActiveTab(tabKey)}
            >
              <Text style={[styles.tabText, activeTab === tabKey && styles.activeTabText]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 主要内容区域 */}
      <ScrollView style={styles.content}>
        {/* 根据activeTab显示不同的内容 */}
        {activeTab === 'subscription' && (
          <SubscriptionSection />
        )}
        
        {activeTab === 'redemption' && (
          <RedemptionSection />
        )}
        
        {activeTab === 'records' && (
          <RecordsSection />
        )}
        
        {activeTab === 'contracts' && (
          <ContractsSection />
        )}
      </ScrollView>
    </View>
  );
}