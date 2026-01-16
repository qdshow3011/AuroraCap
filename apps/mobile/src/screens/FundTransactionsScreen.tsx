import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
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

export default function FundTransactionsScreen({ lang = 'zh', userInfo, onClose, onNavigateToAssetStatus, onNavigateToDepositService, onNavigateToWithdrawalApplication }: { lang?: 'zh' | 'en'; userInfo?: any; onClose?: () => void; onNavigateToAssetStatus?: () => void; onNavigateToDepositService?: () => void; onNavigateToWithdrawalApplication?: () => void }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assets, setAssets] = useState<MyAssets | null>(null);
  const [depositWithdrawals, setDepositWithdrawals] = useState<DepositWithdrawal[]>([]);
  const [chartData, setChartData] = useState<any>(null);
  
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

  // 生成图表数据
  const generateChartData = (records: DepositWithdrawal[]) => {
    // 按月份统计入金出金金额
    const monthlyData: any = {};
    
    // 初始化12个月的数据
    for (let i = 1; i <= 12; i++) {
      monthlyData[i] = { deposit: 0, withdrawal: 0 };
    }
    
    // 统计数据
    records.forEach(record => {
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
          color: () => '#188038', // 入金绿色
          legendFontColor: '#7F7F7F',
          legendFontSize: 12,
        },
        {
          data: withdrawalData,
          color: () => '#d93025', // 出金红色
          legendFontColor: '#7F7F7F',
          legendFontSize: 12,
        },
      ],
      legend: ['入金', '出金'],
    });
  };



  // 语言翻译
  const t = lang === 'zh' ? {
    title: '资金往来',
    depositService: '入金咨询',
    withdrawalApplication: '出金申请',
    fundTransactions: '资金往来',
    assetStatus: '资产状况',
    allRecords: '全部记录',
    annualOverview: '年度资金往来',
    deposit: '入金',
    withdrawal: '出金',
    pending: '待处理',
    processing: '正在办理中',
    completed: '已完成',
    failed: '失败',
    noRecords: '暂无资金往来记录',
    loading: '加载中...',
    error: '加载失败，请稍后重试',
  } : {
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
  };

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
      pending: '#faad14', // 黄色
      processing: '#1890ff', // 蓝色
      completed: '#188038', // 绿色
      failed: '#d93025', // 红色
    };
    
    return (
      <View style={styles.recordItem}>
        <View style={styles.recordHeader}>
          <Text style={styles.recordType}>
            {item.type === 'deposit' ? t.deposit : t.withdrawal}
          </Text>
          <Text style={[styles.recordAmount, item.type === 'deposit' ? styles.depositAmount : styles.withdrawalAmount]}>
            {item.type === 'deposit' ? '+' : '-' }¥{item.amount.toFixed(2)}
          </Text>
        </View>
        <View style={styles.recordDetails}>
          <Text style={[styles.recordStatus, { color: statusColor[item.status] }]}>
            {statusText[item.status]}
          </Text>
          <Text style={styles.recordDate}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
        {item.description && (
          <Text style={styles.recordDescription}>{item.description}</Text>
        )}
      </View>
    );
  };

  // 初始数据加载
  useEffect(() => {
    loadData();
  }, [userInfo]);

  return (
    <View style={styles.container}>
      {/* 顶部头衔 */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {onClose && (
            <TouchableOpacity style={styles.backButton} onPress={onClose}>
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
          )}
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

      {/* 资管功能按钮区域 */}
      <View style={styles.assetManagementButtons}>
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.functionButton} onPress={() => {
            console.log('入金咨询 - 跳转客服模块');
            onNavigateToDepositService?.();
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
            console.log('资产状况 - 导航到资产状况页面');
            onNavigateToAssetStatus?.();
          }}>
            <Text style={styles.functionButtonIcon}>📊</Text>
            <Text style={styles.functionButtonText}>{t.assetStatus}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.functionButton, styles.activeButton]} onPress={() => {
            console.log('资金往来 - 当前页面');
          }}>
            <Text style={styles.functionButtonIcon}>💹</Text>
            <Text style={[styles.functionButtonText, styles.activeButtonText]}>{t.fundTransactions}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 内容滚动区域 */}
      <FlatList
        data={depositWithdrawals}
        renderItem={renderRecordItem}
        keyExtractor={item => item.id}
        style={styles.recordsList}
        contentContainerStyle={styles.recordsListContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* 年度资金往来柱状图 */}
            {!loading && chartData && (
              <View style={styles.chartSection}>
                <Text style={styles.sectionTitle}>{t.annualOverview}</Text>
                <BarChart
                  data={chartData}
                  width={Dimensions.get('window').width - 40}
                  height={220}
                  chartConfig={{
                    backgroundColor: '#ffffff',
                    backgroundGradientFrom: '#ffffff',
                    backgroundGradientTo: '#ffffff',
                    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                    style: {
                      borderRadius: 16
                    },
                    barPercentage: 0.5,
                    barRadius: 8,
                    decimalPlaces: 0,
                    formatYLabel: (value) => `¥${value}`,
                    propsForBackgroundLines: {
                      strokeDasharray: '', // 实线背景线
                      stroke: '#e0e0e0',
                      strokeWidth: 1
                    },
                    propsForLabels: {
                      fontSize: 12
                    }
                  }}
                  style={styles.chart}
                  yAxisLabel="¥"
                  yAxisSuffix=""
                  verticalLabelRotation={0}
                  horizontalLabelRotation={30}
                />
              </View>
            )}

            {/* 全部记录标题 */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t.allRecords}</Text>
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyRecordsContainer}>
            <Text style={styles.emptyRecordsText}>{t.noRecords}</Text>
          </View>
        }
      />
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
  // 资管功能按钮样式
  assetManagementButtons: {
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
  },
  buttonRow: {
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
  // 记录列表样式
  sectionHeader: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  recordsList: {
    flex: 1,
  },
  recordsListContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  recordItem: {
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
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recordType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  recordAmount: {
    fontSize: 18,
    fontWeight: '700',
  },
  depositAmount: {
    color: '#188038', // 入金绿色
  },
  withdrawalAmount: {
    color: '#d93025', // 出金红色
  },
  recordDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recordStatus: {
    fontSize: 14,
    fontWeight: '500',
  },
  recordDate: {
    fontSize: 12,
    color: '#666',
  },
  recordDescription: {
    fontSize: 13,
    color: '#999',
    fontStyle: 'italic',
  },
  emptyRecordsContainer: {
    backgroundColor: '#fff',
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyRecordsText: {
    fontSize: 16,
    color: '#999',
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#d93025',
    textAlign: 'center',
  },
  // 图表样式
  chartSection: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
});
