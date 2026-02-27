import { useState, useEffect } from 'react'
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Pressable, TextInput, Platform } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
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
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'subscription' | 'redemption' | 'records' | 'contracts'>('subscription')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const getVersionStyles = () => {
    switch (appVersion) {
      case 'simple':
        return {
          fontSize: { base: 18, large: 22, small: 16 },
          fontWeight: { regular: '400', medium: '500', bold: '700' },
          padding: { base: 20, small: 16 },
          borderRadius: 12,
          showSimplified: true
        };
      case 'premium':
        return {
          fontSize: { base: 16, large: 20, small: 14 },
          fontWeight: { regular: '400', medium: '600', bold: '800' },
          padding: { base: 20, small: 16 },
          borderRadius: 16,
          showPremium: true
        };
      default:
        return {
          fontSize: { base: 15, large: 18, small: 13 },
          fontWeight: { regular: '400', medium: '500', bold: '700' },
          padding: { base: 16, small: 12 },
          borderRadius: 8,
          showAll: true
        };
    }
  };

  const versionStyles = getVersionStyles();

  const t = lang === 'zh' ? {
    title: '交易',
    subscription: '申购申请',
    redemption: '赎回申请',
    records: '交易记录',
    contracts: '合同管理',
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
    premiumContent: '专属投资顾问服务' + (appVersion === 'premium' ? ' - 已开通' : ' - 仅尊享版可用'),
    nav: '净值',
    annual: '年化',
    hotProducts: '热门产品',
    myPositions: '我的持仓',
  } : {
    title: 'Trades',
    subscription: 'Subscription',
    redemption: 'Redemption',
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
    premiumContent: 'Exclusive Investment Advisor Service' + (appVersion === 'premium' ? ' - Active' : ' - Premium Only'),
    nav: 'NAV',
    annual: 'Annual',
    hotProducts: 'Hot Products',
    myPositions: 'My Positions',
  };

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

  const getTabIcon = (tab: string) => {
    switch (tab) {
      case 'subscription': return 'add-circle';
      case 'redemption': return 'remove-circle';
      case 'records': return 'document-text';
      case 'contracts': return 'file-tray-full';
      default: return 'ellipse';
    }
  };

  const SubscriptionSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <LinearGradient colors={['#1A4EA2', '#0D3A8A']} style={styles.sectionIconBg}>
          <Ionicons name="trending-up" size={20} color="#FFF" />
        </LinearGradient>
        <Text style={styles.sectionTitle}>{t.hotProducts}</Text>
      </View>
      
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={t.searchPlaceholder}
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      
      <ScrollView style={styles.productList} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>{lang === 'zh' ? '加载中...' : 'Loading...'}</Text>
          </View>
        ) : products.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={48} color="#CCC" />
            <Text style={styles.emptyText}>{t.noProducts}</Text>
          </View>
        ) : (
          products.map((product, index) => (
            <Pressable 
              key={product.id} 
              style={styles.productCard}
              onPress={() => {
                setSelectedProduct(product);
                onNavigateToSubscriptionApplication?.();
              }}
            >
              <LinearGradient
                colors={['#1A4EA2', '#0D3A8A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.productCardGradient}
              >
                <View style={styles.productCardContent}>
                  <View style={styles.productCardHeader}>
                    <View style={styles.productIconBg}>
                      <Text style={styles.productIconText}>基</Text>
                    </View>
                    <View style={styles.productTitleContainer}>
                      <Text style={styles.productName} numberOfLines={1}>
                        {lang === 'zh' ? product.name_cn : product.name_en}
                      </Text>
                      <Text style={styles.productCode}>{product.fund_number}</Text>
                    </View>
                    <View style={styles.annualReturnBadge}>
                      <Text style={styles.annualReturnText}>+{(product.annual_return || 0).toFixed(2)}%</Text>
                    </View>
                  </View>
                  
                  <View style={styles.productDetailsRow}>
                    <View style={styles.detailBox}>
                      <Text style={styles.detailBoxLabel}>{t.nav}</Text>
                      <Text style={styles.detailBoxValue}>{(product.net_asset_value || 0).toFixed(4)}</Text>
                    </View>
                    <View style={styles.detailBox}>
                      <Text style={styles.detailBoxLabel}>{t.annual}</Text>
                      <Text style={[styles.detailBoxValue, styles.positiveText]}>+{(product.annual_return || 0).toFixed(2)}%</Text>
                    </View>
                  </View>
                  
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => {
                      setSelectedProduct(product);
                      onNavigateToSubscriptionApplication?.();
                    }}
                  >
                    <LinearGradient
                      colors={['#4CAF50', '#388E3C']}
                      style={styles.actionButtonGradient}
                    >
                      <Ionicons name="add" size={16} color="#FFF" />
                      <Text style={styles.actionButtonText}>{t.subscribeNow}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );

  const RedemptionSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <LinearGradient colors={['#FF9800', '#F57C00']} style={styles.sectionIconBg}>
          <Ionicons name="wallet" size={20} color="#FFF" />
        </LinearGradient>
        <Text style={styles.sectionTitle}>{t.myPositions}</Text>
      </View>
      
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={t.searchPlaceholder}
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      
      <ScrollView style={styles.productList} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>{lang === 'zh' ? '加载中...' : 'Loading...'}</Text>
          </View>
        ) : positions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="wallet-outline" size={48} color="#CCC" />
            <Text style={styles.emptyText}>{t.noPositions}</Text>
          </View>
        ) : (
          positions.map((position) => (
            <Pressable 
              key={position.id} 
              style={styles.positionCard}
              onPress={() => {
                onNavigateToRedemptionApplication?.(position.product);
              }}
            >
              <View style={styles.positionCardHeader}>
                <View style={[styles.positionIconBg, { backgroundColor: '#FFF3E0' }]}>
                  <Text style={[styles.positionIconText, { color: '#FF9800' }]}>持</Text>
                </View>
                <View style={styles.positionTitleContainer}>
                  <Text style={styles.positionName} numberOfLines={1}>
                    {lang === 'zh' ? position.product.name_cn : position.product.name_en}
                  </Text>
                  <Text style={styles.positionCode}>{position.product.fund_number}</Text>
                </View>
              </View>
              
              <View style={styles.positionDetailsGrid}>
                <View style={styles.positionDetailItem}>
                  <Text style={styles.positionDetailLabel}>{t.shares}</Text>
                  <Text style={styles.positionDetailValue}>{(position.shares || 0).toFixed(2)}</Text>
                </View>
                <View style={styles.positionDetailItem}>
                  <Text style={styles.positionDetailLabel}>{t.avgCost}</Text>
                  <Text style={styles.positionDetailValue}>{(position.avg_cost || 0).toFixed(4)}</Text>
                </View>
                <View style={styles.positionDetailItem}>
                  <Text style={styles.positionDetailLabel}>{t.currentValue}</Text>
                  <Text style={[styles.positionDetailValue, styles.positiveText]}>{(position.current_value || 0).toFixed(2)}</Text>
                </View>
              </View>
              
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => {
                  onNavigateToRedemptionApplication?.(position.product);
                }}
              >
                <LinearGradient
                  colors={['#FF5722', '#D84315']}
                  style={styles.actionButtonGradient}
                >
                  <Ionicons name="remove" size={16} color="#FFF" />
                  <Text style={styles.actionButtonText}>{t.redeemNow}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );

  const RecordsSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <LinearGradient colors={['#9C27B0', '#7B1FA2']} style={styles.sectionIconBg}>
          <Ionicons name="time" size={20} color="#FFF" />
        </LinearGradient>
        <Text style={styles.sectionTitle}>{t.records}</Text>
      </View>
      
      <View style={styles.recordsContainer}>
        <TouchableOpacity 
          style={styles.recordCardLarge}
          onPress={onNavigateToSubscriptionRedemptionRecords}
        >
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.recordCardGradient}
          >
            <View style={styles.recordCardContent}>
              <View style={styles.recordIconBg}>
                <Ionicons name="document-text" size={32} color="#667eea" />
              </View>
              <Text style={styles.recordCardTitle}>{t.viewRecords}</Text>
              <Text style={styles.recordCardSubtitle}>
                {lang === 'zh' ? '查看您的所有申购赎回记录' : 'View all your subscription and redemption records'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#FFF" style={styles.recordCardArrow} />
          </LinearGradient>
        </TouchableOpacity>
        
        {appVersion === 'premium' && (
          <TouchableOpacity 
            style={styles.recordCardLarge}
            onPress={() => alert(t.premiumContent)}
          >
            <LinearGradient
              colors={['#f093fb', '#f5576c']}
              style={styles.recordCardGradient}
            >
              <View style={styles.recordCardContent}>
                <View style={[styles.recordIconBg, { backgroundColor: 'rgba(255,255,255,0.9)' }]}>
                  <Ionicons name="diamond" size={32} color="#f5576c" />
                </View>
                <Text style={styles.recordCardTitle}>{t.premiumServices}</Text>
                <Text style={styles.recordCardSubtitle}>
                  {lang === 'zh' ? '尊享专属投资顾问服务' : 'Exclusive investment advisor service'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#FFF" style={styles.recordCardArrow} />
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const ContractsSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <LinearGradient colors={['#4CAF50', '#388E3C']} style={styles.sectionIconBg}>
          <Ionicons name="shield-checkmark" size={20} color="#FFF" />
        </LinearGradient>
        <Text style={styles.sectionTitle}>{t.contracts}</Text>
      </View>
      
      <TouchableOpacity 
        style={styles.contractCardLarge}
        onPress={onNavigateToContractSigning}
      >
        <LinearGradient
          colors={['#11998e', '#38ef7d']}
          style={styles.contractCardGradient}
        >
          <View style={styles.contractCardContent}>
            <View style={styles.contractIconBg}>
              <Ionicons name="file-tray-full" size={40} color="#11998e" />
            </View>
            <Text style={styles.contractCardTitle}>{t.viewContracts}</Text>
            <Text style={styles.contractCardSubtitle}>
              {lang === 'zh' ? '管理您的基金合同和协议' : 'Manage your fund contracts and agreements'}
            </Text>
          </View>
          <View style={styles.contractCardAction}>
            <Text style={styles.contractCardActionText}>
              {lang === 'zh' ? '立即查看' : 'View Now'}
            </Text>
            <Ionicons name="arrow-forward" size={20} color="#FFF" />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const navLabels = {
    subscription: t.subscription,
    redemption: t.redemption,
    records: t.records,
    contracts: t.contracts
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <LinearGradient
        colors={['#1A4EA2', '#0D3A8A']}
        style={[styles.header, { paddingTop: Platform.OS === 'web' ? 20 : 40 + insets.top }]}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{t.title}</Text>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.headerIconButton} onPress={onNavigateToMessageCenter}>
              <Ionicons name="notifications-outline" size={22} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerIconButton} onPress={onNavigateToCustomerService}>
              <Ionicons name="chatbubble-outline" size={22} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerIconButton} onPress={onNavigateToVersionSwitch}>
              <Ionicons name="settings-outline" size={22} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.tabBar}>
        {Object.entries(navLabels).map(([key, label]) => {
          const tabKey = key as 'subscription' | 'redemption' | 'records' | 'contracts';
          if (!visibleTabs.includes(tabKey)) return null;
          const isActive = activeTab === tabKey;
          
          return (
            <TouchableOpacity
              key={key}
              style={[styles.tabItem, isActive && styles.activeTabItem]}
              onPress={() => setActiveTab(tabKey)}
            >
              <View style={[styles.tabIconContainer, isActive && styles.activeTabIconContainer]}>
                <Ionicons 
                  name={getTabIcon(key) as any} 
                  size={20} 
                  color={isActive ? '#1A4EA2' : '#999'} 
                />
              </View>
              <Text style={[styles.tabText, isActive && styles.activeTabText]}>
                {label}
              </Text>
              {isActive && <View style={styles.activeTabIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'subscription' && <SubscriptionSection />}
        {activeTab === 'redemption' && <RedemptionSection />}
        {activeTab === 'records' && <RecordsSection />}
        {activeTab === 'contracts' && <ContractsSection />}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 8,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    paddingHorizontal: 8,
    paddingTop: 12,
    paddingBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    position: 'relative',
  },
  activeTabItem: {
    // Active state
  },
  tabIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F5F7FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  activeTabIconContainer: {
    backgroundColor: '#E3F2FD',
  },
  tabText: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#1A4EA2',
    fontWeight: '600',
  },
  activeTabIndicator: {
    position: 'absolute',
    bottom: -8,
    width: 20,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#1A4EA2',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#333',
  },
  productList: {
    // Product list
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#999',
    marginTop: 12,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginTop: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    marginTop: 12,
  },
  productCard: {
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#1A4EA2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  productCardGradient: {
    // Gradient background
  },
  productCardContent: {
    padding: 16,
  },
  productCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  productIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  productIconText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
  productTitleContainer: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 4,
  },
  productCode: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  annualReturnBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  annualReturnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4ADE80',
  },
  productDetailsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  detailBox: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    padding: 12,
  },
  detailBoxLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 4,
  },
  detailBoxValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  positiveText: {
    color: '#4ADE80',
  },
  actionButton: {
    // Action button container
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  positionCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  positionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  positionIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  positionIconText: {
    fontSize: 18,
    fontWeight: '700',
  },
  positionTitleContainer: {
    flex: 1,
  },
  positionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  positionCode: {
    fontSize: 12,
    color: '#999',
  },
  positionDetailsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  positionDetailItem: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    padding: 12,
  },
  positionDetailLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 4,
  },
  positionDetailValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
  },
  recordsContainer: {
    gap: 12,
  },
  recordCardLarge: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  recordCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  recordCardContent: {
    flex: 1,
  },
  recordIconBg: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  recordCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 6,
  },
  recordCardSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
  },
  recordCardArrow: {
    marginLeft: 12,
  },
  contractCardLarge: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  contractCardGradient: {
    padding: 24,
  },
  contractCardContent: {
    alignItems: 'center',
    marginBottom: 20,
  },
  contractIconBg: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  contractCardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 8,
  },
  contractCardSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
  },
  contractCardAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  contractCardActionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },
  bottomPadding: {
    height: 30,
  },
});
