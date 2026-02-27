import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, RefreshControl, ScrollView, StatusBar, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';

interface SubscriptionRedemptionRecord {
  id: string;
  product_id: string;
  type: 'subscription' | 'redemption';
  shares: number;
  settlement_value: number;
  created_at: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  product: {
    name_cn: string;
    name_en: string;
    fund_number: string;
  };
}

export default function SubscriptionRedemptionRecordsScreen({ 
  lang = 'zh', 
  userInfo, 
  onClose, 
  onNavigateToSubscriptionApplication, 
  onNavigateToRedemptionApplication,
  onNavigateToContracts 
}: { 
  lang?: 'zh' | 'en'; 
  userInfo?: any; 
  onClose?: () => void; 
  onNavigateToSubscriptionApplication?: () => void;
  onNavigateToRedemptionApplication?: (product?: any) => void;
  onNavigateToContracts?: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscriptionRecords, setSubscriptionRecords] = useState<SubscriptionRedemptionRecord[]>([]);
  const [redemptionRecords, setRedemptionRecords] = useState<SubscriptionRedemptionRecord[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'subscription' | 'redemption'>('all');
  const [isReady, setIsReady] = useState(false);

  const loadData = useCallback(async (isRefresh: boolean = false) => {
    if (!isRefresh) {
      setLoading(true);
    }
    setRefreshing(isRefresh);
    setError(null);
    
    try {
      if (!userInfo || !userInfo.id) {
        console.log('No user info available');
        setSubscriptionRecords([]);
        setRedemptionRecords([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }
  
      console.log('Fetching records for user:', userInfo.id);
      const { data, error } = await supabase
        .from('subscription_redemption')
        .select(`
          *, 
          product:products(*)
        `)
        .eq('user_id', userInfo.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('获取交易记录失败:', error);
        setError('获取交易记录失败: ' + error.message);
        setSubscriptionRecords([]);
        setRedemptionRecords([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      console.log('Fetched data:', data);

      if (data && data.length > 0) {
        const formattedRecords: SubscriptionRedemptionRecord[] = data.map((item: any) => ({
          id: item.id,
          product_id: item.fund_id,
          type: item.type,
          shares: item.shares,
          settlement_value: item.total_amount || (item.nav * item.shares),
          created_at: item.created_at,
          status: item.status,
          product: item.product
        }));

        const subscriptions = formattedRecords.filter(record => record.type === 'subscription');
        const redemptions = formattedRecords.filter(record => record.type === 'redemption');

        setSubscriptionRecords(subscriptions);
        setRedemptionRecords(redemptions);
      } else {
        setSubscriptionRecords([]);
        setRedemptionRecords([]);
      }
    } catch (error: any) {
      console.error('获取交易记录时发生异常:', error);
      setError('无法加载数据，请检查网络连接或稍后重试: ' + (error?.message || '未知错误'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userInfo]);

  const handleRefresh = () => {
    loadData(true);
  };

  useEffect(() => {
    console.log('SubscriptionRedemptionRecordsScreen mounted, userInfo:', userInfo);
    // 延迟一点加载数据，确保组件已完全挂载
    const timer = setTimeout(() => {
      setIsReady(true);
      loadData();
    }, 100);
    return () => clearTimeout(timer);
  }, [userInfo, loadData]);

  const t = lang === 'zh' ? {
    title: '交易记录',
    subscriptionApplication: '申购申请',
    redemptionApplication: '赎回申请',
    subscriptionRedemptionRecords: '交易记录',
    contracts: '合同签订',
    subscriptionRecords: '申购记录',
    redemptionRecords: '赎回记录',
    allRecords: '全部记录',
    type: '类型',
    subscriptionType: '申购',
    redemptionType: '赎回',
    shares: '份额',
    amount: '金额',
    date: '日期',
    status: '状态',
    pending: '待处理',
    processing: '处理中',
    completed: '已完成',
    failed: '失败',
    noRecords: '暂无记录',
    loading: '加载中...',
    error: '加载失败，请稍后重试',
    nav: '成交净值',
    totalRecords: '共 {count} 条记录',
  } : {
    title: 'Transaction Records',
    subscriptionApplication: 'Subscription Application',
    redemptionApplication: 'Redemption Application',
    subscriptionRedemptionRecords: 'Transaction Records',
    contracts: 'Contracts',
    subscriptionRecords: 'Subscription Records',
    redemptionRecords: 'Redemption Records',
    allRecords: 'All Records',
    type: 'Type',
    subscriptionType: 'Subscription',
    redemptionType: 'Redemption',
    shares: 'Shares',
    amount: 'Amount',
    date: 'Date',
    status: 'Status',
    pending: 'Pending',
    processing: 'Processing',
    completed: 'Completed',
    failed: 'Failed',
    noRecords: 'No records',
    loading: 'Loading...',
    error: 'Failed to load, please try again later',
    nav: 'NAV',
    totalRecords: '{count} records total',
  };

  const getStatusText = (status: string) => {
    const statusMap = {
      pending: t.pending,
      processing: t.processing,
      completed: t.completed,
      failed: t.failed,
    };
    return statusMap[status as keyof typeof statusMap] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap = {
      pending: '#FF9800',
      processing: '#2196F3',
      completed: '#4CAF50',
      failed: '#F44336',
    };
    return colorMap[status as keyof typeof colorMap] || '#666';
  };

  const getStatusBgColor = (status: string) => {
    const colorMap = {
      pending: '#FFF3E0',
      processing: '#E3F2FD',
      completed: '#E8F5E9',
      failed: '#FFEBEE',
    };
    return colorMap[status as keyof typeof colorMap] || '#F5F5F5';
  };

  const getTypeColor = (type: string) => {
    return type === 'subscription' ? '#4CAF50' : '#FF5722';
  };

  const getTypeBgColor = (type: string) => {
    return type === 'subscription' ? '#E8F5E9' : '#FFEBEE';
  };

  const getTypeText = (type: string) => {
    return type === 'subscription' ? t.subscriptionType : t.redemptionType;
  };

  const getTypeIcon = (type: string) => {
    return type === 'subscription' ? 'arrow-down-circle' : 'arrow-up-circle';
  };

  const renderRecordCard = (item: SubscriptionRedemptionRecord) => {
    const isSubscription = item.type === 'subscription';
    
    return (
      <View style={styles.recordCard}>
        <LinearGradient
          colors={isSubscription ? ['#E8F5E9', '#FFFFFF'] : ['#FFEBEE', '#FFFFFF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.recordCardGradient}
        >
          <View style={styles.recordCardHeader}>
            <View style={styles.recordCardHeaderLeft}>
              <View style={[styles.typeIconContainer, { backgroundColor: getTypeBgColor(item.type) }]}>
                <Ionicons 
                  name={getTypeIcon(item.type) as any} 
                  size={20} 
                  color={getTypeColor(item.type)} 
                />
              </View>
              <View>
                <Text style={styles.recordName} numberOfLines={1}>
                  {lang === 'zh' ? item.product.name_cn : item.product.name_en}
                </Text>
                <Text style={styles.fundNumber}>{item.product.fund_number}</Text>
              </View>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusBgColor(item.status) }]}>
              <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                {getStatusText(item.status)}
              </Text>
            </View>
          </View>
          
          <View style={styles.recordCardDivider} />
          
          <View style={styles.recordCardBody}>
            <View style={styles.recordInfoRow}>
              <View style={styles.recordInfoItem}>
                <Text style={styles.recordInfoLabel}>{t.type}</Text>
                <Text style={[styles.recordInfoValue, { color: getTypeColor(item.type) }]}>
                  {getTypeText(item.type)}
                </Text>
              </View>
              <View style={styles.recordInfoItem}>
                <Text style={styles.recordInfoLabel}>{isSubscription ? t.amount : t.shares}</Text>
                <Text style={styles.recordInfoValue}>
                  {isSubscription 
                    ? `¥${item.settlement_value.toFixed(2)}`
                    : `${item.shares.toFixed(4)}`
                  }
                </Text>
              </View>
              <View style={styles.recordInfoItem}>
                <Text style={styles.recordInfoLabel}>{t.date}</Text>
                <Text style={styles.recordInfoValue}>
                  {item.created_at.split('T')[0]}
                </Text>
              </View>
            </View>
            
            <View style={styles.recordInfoRow}>
              <View style={styles.recordInfoItem}>
                <Text style={styles.recordInfoLabel}>{t.nav}</Text>
                <Text style={styles.recordInfoValue}>
                  ¥{(item.settlement_value / item.shares).toFixed(4)}
                </Text>
              </View>
              <View style={styles.recordInfoItem}>
                <Text style={styles.recordInfoLabel}>
                  {isSubscription ? '获得份额' : '赎回金额'}
                </Text>
                <Text style={styles.recordInfoValue}>
                  {isSubscription 
                    ? `${item.shares.toFixed(4)}`
                    : `¥${item.settlement_value.toFixed(2)}`
                  }
                </Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </View>
    );
  };

  const getAllRecords = () => {
    const all = [...subscriptionRecords, ...redemptionRecords];
    return all.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  };

  const getDisplayRecords = () => {
    switch (activeTab) {
      case 'subscription':
        return subscriptionRecords;
      case 'redemption':
        return redemptionRecords;
      default:
        return getAllRecords();
    }
  };

  const displayRecords = getDisplayRecords();

  return (
    <View style={styles.container}>
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
          <TouchableOpacity style={styles.helpButton}>
            <Ionicons name="headset" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

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
            style={styles.functionButton} 
            onPress={() => onNavigateToRedemptionApplication?.()}
          >
            <View style={styles.functionIconContainer}>
              <Ionicons name="remove-circle" size={22} color="#999" />
            </View>
            <Text style={styles.functionButtonText}>{t.redemptionApplication}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.functionButton, styles.activeFunctionButton]} 
          >
            <View style={[styles.functionIconContainer, styles.activeFunctionIconContainer]}>
              <Ionicons name="document-text" size={22} color="#FFFFFF" />
            </View>
            <Text style={[styles.functionButtonText, styles.activeFunctionButtonText]}>{t.subscriptionRedemptionRecords}</Text>
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

      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tabItem, activeTab === 'all' && styles.activeTabItem]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
            {t.allRecords}
          </Text>
          {activeTab === 'all' && <View style={styles.activeTabIndicator} />}
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabItem, activeTab === 'subscription' && styles.activeTabItem]}
          onPress={() => setActiveTab('subscription')}
        >
          <Text style={[styles.tabText, activeTab === 'subscription' && styles.activeTabText]}>
            {t.subscriptionRecords}
          </Text>
          {activeTab === 'subscription' && <View style={styles.activeTabIndicator} />}
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabItem, activeTab === 'redemption' && styles.activeTabItem]}
          onPress={() => setActiveTab('redemption')}
        >
          <Text style={[styles.tabText, activeTab === 'redemption' && styles.activeTabText]}>
            {t.redemptionRecords}
          </Text>
          {activeTab === 'redemption' && <View style={styles.activeTabIndicator} />}
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#1A4EA2']}
            tintColor="#1A4EA2"
          />
        }
      >
        {displayRecords.length > 0 && (
          <View style={styles.recordCountContainer}>
            <Text style={styles.recordCountText}>
              {t.totalRecords.replace('{count}', displayRecords.length.toString())}
            </Text>
          </View>
        )}

        {!isReady ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1A4EA2" />
            <Text style={styles.loadingText}>{t.loading}</Text>
          </View>
        ) : loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1A4EA2" />
            <Text style={styles.loadingText}>{t.loading}</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={48} color="#F44336" />
            <Text style={styles.errorText}>{t.error}</Text>
          </View>
        ) : displayRecords.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color="#CCC" />
            <Text style={styles.emptyText}>{t.noRecords}</Text>
          </View>
        ) : (
          <View style={styles.recordsContainer}>
            {displayRecords.map(item => (
              <View key={item.id}>
                {renderRecordCard(item)}
              </View>
            ))}
          </View>
        )}
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
    backgroundColor: '#9C27B0',
  },
  functionButtonText: {
    fontSize: 11,
    color: '#999',
    fontWeight: '500',
  },
  activeFunctionButtonText: {
    color: '#9C27B0',
    fontWeight: '600',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    position: 'relative',
  },
  activeTabItem: {
    // Active state
  },
  tabText: {
    fontSize: 14,
    color: '#999',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#1A4EA2',
    fontWeight: '600',
  },
  activeTabIndicator: {
    position: 'absolute',
    bottom: 0,
    width: 24,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#1A4EA2',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  recordCountContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  recordCountText: {
    fontSize: 13,
    color: '#999',
  },
  recordsContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  recordCard: {
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  recordCardGradient: {
    // Gradient background
  },
  recordCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  recordCardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  typeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recordName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  fundNumber: {
    fontSize: 12,
    color: '#999',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  recordCardDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 16,
  },
  recordCardBody: {
    padding: 16,
  },
  recordInfoRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  recordInfoItem: {
    flex: 1,
  },
  recordInfoLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 4,
  },
  recordInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#999',
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#F44336',
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    marginTop: 16,
  },
  bottomPadding: {
    height: 30,
  },
});
