import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, RefreshControl, ScrollView } from 'react-native';
import { supabase } from '../lib/supabase';

// 申购赎回记录类型定义
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
  onNavigateToRedemptionApplication?: () => void;
  onNavigateToContracts?: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscriptionRecords, setSubscriptionRecords] = useState<SubscriptionRedemptionRecord[]>([]);
  const [redemptionRecords, setRedemptionRecords] = useState<SubscriptionRedemptionRecord[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // 数据加载函数
  const loadData = useCallback(async (isRefresh: boolean = false) => {
    setLoading(isRefresh ? false : true);
    setRefreshing(isRefresh);
    setError(null);
    
    try {
      if (!userInfo || !userInfo.id) {
        setSubscriptionRecords([]);
        setRedemptionRecords([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // 获取申购赎回记录
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
        setSubscriptionRecords([]);
        setRedemptionRecords([]);
        return;
      }

      if (data && data.length > 0) {
        // 格式化数据
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

        // 分离申购和赎回记录
        const subscriptions = formattedRecords.filter(record => record.type === 'subscription');
        const redemptions = formattedRecords.filter(record => record.type === 'redemption');

        setSubscriptionRecords(subscriptions);
        setRedemptionRecords(redemptions);
      } else {
        setSubscriptionRecords([]);
        setRedemptionRecords([]);
      }
    } catch (error) {
      console.error('获取交易记录时发生异常:', error);
      setError('无法加载数据，请检查网络连接或稍后重试');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userInfo]);

  // 刷新处理
  const handleRefresh = () => {
    loadData(true);
  };

  // 初始数据加载
  useEffect(() => {
    loadData();
  }, [userInfo, loadData]);

  // 语言翻译
  const t = lang === 'zh' ? {
    title: '申购/赎回记录',
    subscriptionApplication: '申购申请',
    redemptionApplication: '赎回申请',
    subscriptionRedemptionRecords: '交易记录',
    contracts: '合同签订',
    subscriptionRecords: '申购记录',
    redemptionRecords: '赎回记录',
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
  } : {
    title: 'Subscription/Redemption Records',
    subscriptionApplication: 'Subscription Application',
    redemptionApplication: 'Redemption Application',
    subscriptionRedemptionRecords: 'Subscription/Redemption Records',
    contracts: 'Contracts',
    subscriptionRecords: 'Subscription Records',
    redemptionRecords: 'Redemption Records',
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
  };

  // 状态文本映射
  const getStatusText = (status: string) => {
    const statusMap = {
      pending: t.pending,
      processing: t.processing,
      completed: t.completed,
      failed: t.failed,
    };
    return statusMap[status as keyof typeof statusMap] || status;
  };

  // 状态颜色映射
  const getStatusColor = (status: string) => {
    const colorMap = {
      pending: '#faad14', // 黄色
      processing: '#1890ff', // 蓝色
      completed: '#188038', // 绿色
      failed: '#d93025', // 红色
    };
    return colorMap[status as keyof typeof colorMap] || '#666';
  };

  // 渲染申购记录项
  const renderSubscriptionItem = ({ item }: { item: SubscriptionRedemptionRecord }) => (
    <View style={styles.recordCard}>
      {/* 第一行：基金名称 */}
      <Text style={styles.recordName}>
        {lang === 'zh' ? item.product.name_cn : item.product.name_en}
      </Text>
      <Text style={styles.fundNumber}>{item.product.fund_number}</Text>
      
      {/* 第二行：类型、申购金额 */}
      <View style={styles.row}>
        <View style={styles.cell}>
          <Text style={styles.cellLabel}>{t.type}</Text>
          <Text style={styles.cellValue}>{t.subscriptionType}</Text>
        </View>
        <View style={styles.cell}>
          <Text style={styles.cellLabel}>{t.amount}</Text>
          <Text style={styles.cellValue}>¥{item.settlement_value.toFixed(2)}</Text>
        </View>
      </View>
      
      {/* 第三行：日期、状态 */}
      <View style={styles.row}>
        <View style={styles.cell}>
          <Text style={styles.cellLabel}>{t.date}</Text>
          <Text style={styles.cellValue}>{item.created_at.split('T')[0]}</Text>
        </View>
        <View style={styles.cell}>
          <Text style={styles.cellLabel}>{t.status}</Text>
          <Text style={[styles.cellValue, { color: getStatusColor(item.status) }]}>
            {getStatusText(item.status)}
          </Text>
        </View>
      </View>
      
      {/* 第四行：成交价格、成交份额 */}
      <View style={styles.row}>
        <View style={styles.cell}>
          <Text style={styles.cellLabel}>成交价格</Text>
          <Text style={styles.cellValue}>¥{(item.settlement_value / item.shares).toFixed(4)}</Text>
        </View>
        <View style={styles.cell}>
          <Text style={styles.cellLabel}>成交份额</Text>
          <Text style={styles.cellValue}>{item.shares.toFixed(4)}</Text>
        </View>
      </View>
    </View>
  );

  // 渲染赎回记录项
  const renderRedemptionItem = ({ item }: { item: SubscriptionRedemptionRecord }) => (
    <View style={styles.recordCard}>
      {/* 第一行：基金名称 */}
      <Text style={styles.recordName}>
        {lang === 'zh' ? item.product.name_cn : item.product.name_en}
      </Text>
      <Text style={styles.fundNumber}>{item.product.fund_number}</Text>
      
      {/* 第二行：类型、赎回份额 */}
      <View style={styles.row}>
        <View style={styles.cell}>
          <Text style={styles.cellLabel}>{t.type}</Text>
          <Text style={styles.cellValue}>{t.redemptionType}</Text>
        </View>
        <View style={styles.cell}>
          <Text style={styles.cellLabel}>赎回份额</Text>
          <Text style={styles.cellValue}>{item.shares.toFixed(4)}</Text>
        </View>
      </View>
      
      {/* 第三行：日期、状态 */}
      <View style={styles.row}>
        <View style={styles.cell}>
          <Text style={styles.cellLabel}>{t.date}</Text>
          <Text style={styles.cellValue}>{item.created_at.split('T')[0]}</Text>
        </View>
        <View style={styles.cell}>
          <Text style={styles.cellLabel}>{t.status}</Text>
          <Text style={[styles.cellValue, { color: getStatusColor(item.status) }]}>
            {getStatusText(item.status)}
          </Text>
        </View>
      </View>
      
      {/* 第四行：成交净值、赎回金额 */}
      <View style={styles.row}>
        <View style={styles.cell}>
          <Text style={styles.cellLabel}>成交净值</Text>
          <Text style={styles.cellValue}>¥{(item.settlement_value / item.shares).toFixed(4)}</Text>
        </View>
        <View style={styles.cell}>
          <Text style={styles.cellLabel}>赎回金额</Text>
          <Text style={styles.cellValue}>¥{item.settlement_value.toFixed(2)}</Text>
        </View>
      </View>
    </View>
  );

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
          style={[styles.functionButton, styles.activeButton]} 
          onPress={() => {
            console.log('交易记录 - 当前页面');
          }}
        >
          <Text style={styles.functionButtonIcon}>📋</Text>
          <Text style={[styles.functionButtonText, styles.activeButtonText]}>{t.subscriptionRedemptionRecords}</Text>
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

      {/* 内容滚动区域 */}
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#188038']}
            tintColor="#188038"
          />
        }
      >
        {/* 申购记录区块 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.subscriptionRecords}</Text>
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>{t.loading}</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{t.error}</Text>
            </View>
          ) : subscriptionRecords.length > 0 ? (
            subscriptionRecords.map(item => (
              <View key={item.id}>{renderSubscriptionItem({ item })}</View>
            ))
          ) : (
            <View style={styles.emptyRecordsContainer}>
              <Text style={styles.emptyRecordsText}>{t.noRecords}</Text>
            </View>
          )}
        </View>

        {/* 赎回记录区块 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.redemptionRecords}</Text>
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>{t.loading}</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{t.error}</Text>
            </View>
          ) : redemptionRecords.length > 0 ? (
            redemptionRecords.map(item => (
              <View key={item.id}>{renderRedemptionItem({ item })}</View>
            ))
          ) : (
            <View style={styles.emptyRecordsContainer}>
              <Text style={styles.emptyRecordsText}>{t.noRecords}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  header: {
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
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
  // 区块样式
  section: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  // 滚动视图样式
  scrollView: {
    flex: 1,
  },
  // 记录列表样式
  recordsList: {
    flex: 1,
  },
  recordsListContent: {
    paddingBottom: 20,
  },
  recordCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  recordName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  fundNumber: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  // 表格化布局样式
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 8,
  },
  cell: {
    flex: 1,
  },
  cellLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  cellValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  recordDetails: {
    gap: 12,
  },
  recordDetailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recordDetailLabel: {
    fontSize: 14,
    color: '#666',
  },
  recordDetailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  // 空状态样式
  emptyRecordsContainer: {
    backgroundColor: '#fff',
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyRecordsText: {
    fontSize: 16,
    color: '#999',
  },
  // 加载状态样式
  loadingContainer: {
    backgroundColor: '#fff',
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  // 错误状态样式
  errorContainer: {
    backgroundColor: '#fff',
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#d93025',
    textAlign: 'center',
  },
});
