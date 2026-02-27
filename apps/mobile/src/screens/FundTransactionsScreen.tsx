import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabase';

// 入金出金记录类型定义
interface DepositWithdrawal {
  id: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
  description?: string;
}

// 资产数据类型定义
interface MyAssets {
  totalAssets: number;
  fundValue: number;
  cashBalance: number;
  pendingFunds: number;
}

// 主题色定义
const COLORS = {
  primary: '#1A4EA2',
  primaryDark: '#0D3A8A',
  background: '#F5F7FA',
  card: '#FFFFFF',
  deposit: '#4CAF50',
  withdrawal: '#F44336',
  pending: '#FF9800',
  processing: '#2196F3',
  completed: '#4CAF50',
  failed: '#F44336',
  text: '#333333',
  textSecondary: '#666666',
  textLight: '#999999',
  border: '#E8E8E8',
};

export default function FundTransactionsScreen({
  lang = 'zh',
  userInfo,
  onClose,
  onNavigateToAssetStatus,
  onNavigateToDepositService,
  onNavigateToWithdrawalApplication,
}: {
  lang?: 'zh' | 'en';
  userInfo?: any;
  onClose?: () => void;
  onNavigateToAssetStatus?: () => void;
  onNavigateToDepositService?: () => void;
  onNavigateToWithdrawalApplication?: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assets, setAssets] = useState<MyAssets | null>(null);
  const [depositWithdrawals, setDepositWithdrawals] = useState<DepositWithdrawal[]>([]);
  const [chartData, setChartData] = useState<any>(null);
  const [stats, setStats] = useState({
    totalDeposit: 0,
    totalWithdrawal: 0,
    netFlow: 0,
  });

  // 滚动相关ref
  const scrollViewRef = useRef<any>(null);

  // 数据加载函数
  const loadData = async () => {
    setLoading(true);
    try {
      if (userInfo && userInfo.id) {
        // 获取入金出金记录
        const { data: dwData, error: dwError } = await supabase
          .from('deposit_withdrawal')
          .select('*')
          .eq('user_id', userInfo.id)
          .order('created_at', { ascending: false });

        if (dwError) {
          console.error('获取入金出金记录失败:', dwError);
          setDepositWithdrawals([]);
        } else {
          setDepositWithdrawals(dwData || []);
          // 生成图表数据
          generateChartData(dwData || []);
          // 计算统计数据
          calculateStats(dwData || []);
        }
      } else {
        // 没有登录用户信息，不显示数据
        setDepositWithdrawals([]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setError('无法加载数据，请检查网络连接或稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 计算统计数据
  const calculateStats = (records: DepositWithdrawal[]) => {
    let totalDeposit = 0;
    let totalWithdrawal = 0;

    records.forEach((record) => {
      if (record.status === 'completed') {
        if (record.type === 'deposit') {
          totalDeposit += record.amount;
        } else {
          totalWithdrawal += record.amount;
        }
      }
    });

    setStats({
      totalDeposit,
      totalWithdrawal,
      netFlow: totalDeposit - totalWithdrawal,
    });
  };

  // 生成图表数据
  const generateChartData = (records: DepositWithdrawal[]) => {
    // 按月份统计入金出金金额
    const monthlyData: any = {};

    // 初始化12个月的数据
    for (let i = 1; i <= 12; i++) {
      monthlyData[i] = { deposit: 0, withdrawal: 0 };
    }

    // 统计数据
    records.forEach((record) => {
      const month = new Date(record.created_at).getMonth() + 1;
      if (record.type === 'deposit') {
        monthlyData[month].deposit += record.amount;
      } else {
        monthlyData[month].withdrawal += record.amount;
      }
    });

    // 转换为图表所需格式
    const labels = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    const depositData = Object.values(monthlyData).map((data: any) => data.deposit);
    const withdrawalData = Object.values(monthlyData).map((data: any) => data.withdrawal);

    setChartData({
      labels,
      datasets: [
        {
          data: depositData,
          color: () => COLORS.deposit,
          legendFontColor: '#7F7F7F',
          legendFontSize: 12,
        },
        {
          data: withdrawalData,
          color: () => COLORS.withdrawal,
          legendFontColor: '#7F7F7F',
          legendFontSize: 12,
        },
      ],
      legend: ['入金', '出金'],
    });
  };

  // 语言翻译
  const t =
    lang === 'zh'
      ? {
          title: '资金往来',
          depositService: '入金服务',
          withdrawalApplication: '出金申请',
          fundTransactions: '资金往来',
          assetStatus: '资产状况',
          allRecords: '全部记录',
          annualOverview: '年度资金往来',
          deposit: '入金',
          withdrawal: '出金',
          pending: '待处理',
          processing: '处理中',
          completed: '已完成',
          failed: '失败',
          noRecords: '暂无资金往来记录',
          loading: '加载中...',
          error: '加载失败，请稍后重试',
          totalDeposit: '总入金',
          totalWithdrawal: '总出金',
          netFlow: '净资金流向',
          goToDeposit: '去入金',
          search: '搜索',
          customerService: '客服',
        }
      : {
          title: 'Fund Transactions',
          depositService: 'Deposit Service',
          withdrawalApplication: 'Withdrawal Application',
          fundTransactions: 'Fund Transactions',
          assetStatus: 'Asset Status',
          allRecords: 'All Records',
          annualOverview: 'Annual Fund Transactions',
          deposit: 'Deposit',
          withdrawal: 'Withdrawal',
          pending: 'Pending',
          processing: 'Processing',
          completed: 'Completed',
          failed: 'Failed',
          noRecords: 'No fund transaction records',
          loading: 'Loading...',
          error: 'Failed to load, please try again later',
          totalDeposit: 'Total Deposit',
          totalWithdrawal: 'Total Withdrawal',
          netFlow: 'Net Flow',
          goToDeposit: 'Go to Deposit',
          search: 'Search',
          customerService: 'Service',
        };

  // 渲染统计卡片
  const renderStatsCard = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <View style={[styles.statIconBg, { backgroundColor: 'rgba(76, 175, 80, 0.1)' }]}>
            <Ionicons name="arrow-down-circle" size={24} color={COLORS.deposit} />
          </View>
          <Text style={styles.statLabel}>{t.totalDeposit}</Text>
          <Text style={[styles.statValue, { color: COLORS.deposit }]}>
            ¥{stats.totalDeposit.toFixed(2)}
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <View style={[styles.statIconBg, { backgroundColor: 'rgba(244, 67, 54, 0.1)' }]}>
            <Ionicons name="arrow-up-circle" size={24} color={COLORS.withdrawal} />
          </View>
          <Text style={styles.statLabel}>{t.totalWithdrawal}</Text>
          <Text style={[styles.statValue, { color: COLORS.withdrawal }]}>
            ¥{stats.totalWithdrawal.toFixed(2)}
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <View style={[styles.statIconBg, { backgroundColor: 'rgba(26, 78, 162, 0.1)' }]}>
            <Ionicons name="swap-horizontal" size={24} color={COLORS.primary} />
          </View>
          <Text style={styles.statLabel}>{t.netFlow}</Text>
          <Text
            style={[
              styles.statValue,
              { color: stats.netFlow >= 0 ? COLORS.deposit : COLORS.withdrawal },
            ]}
          >
            {stats.netFlow >= 0 ? '+' : ''}¥{stats.netFlow.toFixed(2)}
          </Text>
        </View>
      </View>
    </View>
  );

  // 渲染记录项
  const renderRecordItem = ({ item }: { item: DepositWithdrawal }) => {
    // 状态文本映射
    const statusText = {
      pending: t.pending,
      processing: t.processing,
      completed: t.completed,
      failed: t.failed,
    };

    // 状态颜色映射
    const statusColor = {
      pending: COLORS.pending,
      processing: COLORS.processing,
      completed: COLORS.completed,
      failed: COLORS.failed,
    };

    const isDeposit = item.type === 'deposit';

    return (
      <View
        style={[
          styles.recordItem,
          { borderLeftColor: isDeposit ? COLORS.deposit : COLORS.withdrawal },
        ]}
      >
        <View style={styles.recordHeader}>
          <View style={styles.recordTypeContainer}>
            <View
              style={[
                styles.recordTypeIcon,
                { backgroundColor: isDeposit ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)' },
              ]}
            >
              <Ionicons
                name={isDeposit ? 'arrow-down' : 'arrow-up'}
                size={16}
                color={isDeposit ? COLORS.deposit : COLORS.withdrawal}
              />
            </View>
            <Text style={styles.recordType}>
              {isDeposit ? t.deposit : t.withdrawal}
            </Text>
          </View>
          <Text
            style={[
              styles.recordAmount,
              { color: isDeposit ? COLORS.deposit : COLORS.withdrawal },
            ]}
          >
            {isDeposit ? '+' : '-'}¥{item.amount.toFixed(2)}
          </Text>
        </View>
        <View style={styles.recordDetails}>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor[item.status]}20` }]}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: statusColor[item.status] },
              ]}
            />
            <Text style={[styles.recordStatus, { color: statusColor[item.status] }]}>
              {statusText[item.status]}
            </Text>
          </View>
          <View style={styles.recordDateContainer}>
            <Ionicons name="time-outline" size={12} color={COLORS.textLight} />
            <Text style={styles.recordDate}>
              {new Date(item.created_at).toLocaleDateString()}
            </Text>
          </View>
        </View>
        {item.description && (
          <Text style={styles.recordDescription}>{item.description}</Text>
        )}
      </View>
    );
  };

  // 渲染空状态
  const renderEmptyState = () => (
    <View style={styles.emptyRecordsContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="wallet-outline" size={48} color={COLORS.textLight} />
      </View>
      <Text style={styles.emptyRecordsText}>{t.noRecords}</Text>
      <TouchableOpacity
        style={styles.goToDepositButton}
        onPress={() => onNavigateToDepositService?.()}
      >
        <Text style={styles.goToDepositButtonText}>{t.goToDeposit}</Text>
      </TouchableOpacity>
    </View>
  );

  // 初始数据加载
  useEffect(() => {
    loadData();
  }, [userInfo]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* 渐变头部 */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            {onClose && (
              <TouchableOpacity style={styles.backButton} onPress={onClose}>
                <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
              </TouchableOpacity>
            )}
            <Text style={styles.title}>{t.title}</Text>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => console.log('搜索')}
            >
              <View style={styles.iconButtonBg}>
                <Ionicons name="search" size={20} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => console.log('客服')}
            >
              <View style={styles.iconButtonBg}>
                <Ionicons name="headset-outline" size={20} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 功能按钮区域 */}
        <View style={styles.assetManagementButtons}>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.functionButton}
              onPress={() => {
                console.log('入金服务');
                onNavigateToDepositService?.();
              }}
            >
              <View
                style={[
                  styles.functionButtonIcon,
                  { backgroundColor: 'rgba(76, 175, 80, 0.15)' },
                ]}
              >
                <Ionicons name="download-outline" size={24} color={COLORS.deposit} />
              </View>
              <Text style={styles.functionButtonText}>{t.depositService}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.functionButton}
              onPress={() => {
                console.log('出金申请');
                onNavigateToWithdrawalApplication?.();
              }}
            >
              <View
                style={[
                  styles.functionButtonIcon,
                  { backgroundColor: 'rgba(244, 67, 54, 0.15)' },
                ]}
              >
                <Ionicons name="upload-outline" size={24} color={COLORS.withdrawal} />
              </View>
              <Text style={styles.functionButtonText}>{t.withdrawalApplication}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.functionButton}
              onPress={() => {
                console.log('资产状况');
                onNavigateToAssetStatus?.();
              }}
            >
              <View
                style={[
                  styles.functionButtonIcon,
                  { backgroundColor: 'rgba(33, 150, 243, 0.15)' },
                ]}
              >
                <Ionicons name="pie-chart-outline" size={24} color="#2196F3" />
              </View>
              <Text style={styles.functionButtonText}>{t.assetStatus}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.functionButton}>
              <View
                style={[
                  styles.functionButtonIcon,
                  styles.activeButtonIcon,
                  { backgroundColor: `${COLORS.primary}25` },
                ]}
              >
                <Ionicons name="swap-horizontal" size={24} color={COLORS.primary} />
              </View>
              <Text style={[styles.functionButtonText, styles.activeButtonText]}>
                {t.fundTransactions}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 统计概览卡片 */}
        {!loading && depositWithdrawals.length > 0 && renderStatsCard()}

        {/* 年度资金往来图表 */}
        {!loading && chartData && (
          <View style={styles.chartSection}>
            <View style={styles.sectionTitleContainer}>
              <View style={styles.sectionTitleLine} />
              <Text style={styles.sectionTitle}>{t.annualOverview}</Text>
            </View>
            <View style={styles.chartCard}>
              <BarChart
                data={chartData}
                width={Dimensions.get('window').width - 72}
                height={220}
                chartConfig={{
                  backgroundColor: COLORS.card,
                  backgroundGradientFrom: COLORS.card,
                  backgroundGradientTo: COLORS.card,
                  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(102, 102, 102, ${opacity})`,
                  style: {
                    borderRadius: 16,
                  },
                  barPercentage: 0.6,
                  barRadius: 6,
                  decimalPlaces: 0,
                  formatYLabel: (value) => {
                    const num = parseInt(value);
                    if (num >= 10000) {
                      return `${(num / 10000).toFixed(0)}w`;
                    }
                    return value;
                  },
                  propsForBackgroundLines: {
                    strokeDasharray: '',
                    stroke: '#E8E8E8',
                    strokeWidth: 1,
                  },
                  propsForLabels: {
                    fontSize: 10,
                  },
                }}
                style={styles.chart}
                yAxisLabel=""
                yAxisSuffix=""
                verticalLabelRotation={0}
                horizontalLabelRotation={0}
                fromZero
                showBarTops={false}
              />
              <View style={styles.chartLegend}>
                <View style={styles.legendItem}>
                  <View
                    style={[styles.legendDot, { backgroundColor: COLORS.deposit }]}
                  />
                  <Text style={styles.legendText}>{t.deposit}</Text>
                </View>
                <View style={styles.legendItem}>
                  <View
                    style={[styles.legendDot, { backgroundColor: COLORS.withdrawal }]}
                  />
                  <Text style={styles.legendText}>{t.withdrawal}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* 记录列表 */}
        <View style={styles.recordsSection}>
          <View style={styles.sectionTitleContainer}>
            <View style={styles.sectionTitleLine} />
            <Text style={styles.sectionTitle}>{t.allRecords}</Text>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <Ionicons name="refresh" size={32} color={COLORS.primary} />
              <Text style={styles.loadingText}>{t.loading}</Text>
            </View>
          ) : depositWithdrawals.length === 0 ? (
            renderEmptyState()
          ) : (
            <FlatList
              data={depositWithdrawals}
              renderItem={renderRecordItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              contentContainerStyle={styles.recordsListContent}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  // 头部样式
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginLeft: 8,
  },
  iconButtonBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // 功能按钮样式
  assetManagementButtons: {
    backgroundColor: COLORS.card,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  functionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  functionButtonIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  activeButtonIcon: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  functionButtonText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  activeButtonText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  // 统计卡片样式
  statsContainer: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  statsCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: 8,
  },
  // 图表样式
  chartSection: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  chartCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  chart: {
    borderRadius: 16,
    marginVertical: 8,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  // 记录列表样式
  recordsSection: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitleLine: {
    width: 4,
    height: 18,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  recordsListContent: {
    paddingBottom: 20,
  },
  recordItem: {
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  recordTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordTypeIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  recordType: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  recordAmount: {
    fontSize: 18,
    fontWeight: '700',
  },
  recordDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  recordStatus: {
    fontSize: 12,
    fontWeight: '600',
  },
  recordDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordDate: {
    fontSize: 12,
    color: COLORS.textLight,
    marginLeft: 4,
  },
  recordDescription: {
    fontSize: 13,
    color: COLORS.textLight,
    marginTop: 8,
    fontStyle: 'italic',
  },
  // 空状态样式
  emptyRecordsContainer: {
    backgroundColor: COLORS.card,
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyRecordsText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  goToDepositButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  goToDepositButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  // 加载状态
  loadingContainer: {
    backgroundColor: COLORS.card,
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 12,
  },
});
