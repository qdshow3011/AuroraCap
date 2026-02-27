import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TouchableOpacity, TextInput, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

// 基金产品类型定义
interface FundProduct {
  id: string;
  name: string;
  code: string;
  returnRate: number;
  description: string;
  type: string;
  riskLevel: string;
}

// 获取基金类型对应的颜色和图标
const getFundTypeStyle = (type: string) => {
  switch (type) {
    case '混合型':
      return { color: '#7B61FF', icon: 'pie-chart', bgColor: '#F0EBFF' };
    case '股票型':
      return { color: '#FF6B6B', icon: 'trending-up', bgColor: '#FFF0F0' };
    case '债券型':
      return { color: '#4CAF50', icon: 'shield', bgColor: '#E8F5E9' };
    default:
      return { color: '#1A4EA2', icon: 'wallet', bgColor: '#E3F2FD' };
  }
};

// 获取风险等级颜色
const getRiskLevelColor = (level: string) => {
  if (level.includes('低')) return '#4CAF50';
  if (level.includes('中')) return '#FF9800';
  return '#F44336';
};

export default function ProductsScreen({
  lang = 'zh',
  demo = false,
  userInfo,
  onNavigateToAssetStatus,
  onNavigateToSubscriptionApplication,
  onNavigateToDepositService,
  onNavigateToCustomerService,
  onNavigateToWithdrawalApplication,
  onNavigateToFundTransactions,
  onNavigateToVersionSwitch,
  onNavigateToMessageCenter,
  appVersion = 'standard'
}: {
  lang?: 'zh' | 'en';
  demo?: boolean;
  userInfo?: any;
  onNavigateToAssetStatus?: () => void;
  onNavigateToSubscriptionApplication?: (product?: any) => void;
  onNavigateToDepositService?: () => void;
  onNavigateToCustomerService?: () => void;
  onNavigateToWithdrawalApplication?: () => void;
  onNavigateToFundTransactions?: () => void;
  onNavigateToVersionSwitch?: () => void;
  onNavigateToMessageCenter?: () => void;
  appVersion?: 'standard' | 'simple' | 'premium';
}) {
  // 获取安全区域信息
  const insets = useSafeAreaInsets();
  // 模拟基金产品数据
  const [fundProducts, setFundProducts] = useState<FundProduct[]>([
    {
      id: '1',
      name: '极光稳健增长基金',
      code: 'J00001',
      returnRate: 8.5,
      description: '稳健增长型基金，适合风险偏好较低的投资者',
      type: '混合型',
      riskLevel: '中低风险'
    },
    {
      id: '2',
      name: '极光科技先锋基金',
      code: 'J00002',
      returnRate: 15.2,
      description: '重点投资科技板块，追求高收益',
      type: '股票型',
      riskLevel: '高风险'
    },
    {
      id: '3',
      name: '极光固定收益基金',
      code: 'J00003',
      returnRate: 4.8,
      description: '主要投资债券市场，收益稳定',
      type: '债券型',
      riskLevel: '低风险'
    }
  ]);

  // 模拟资产数据
  const [assets, setAssets] = useState({
    totalAssets: 1250000,
    fundValue: 850000,
    cash: 400000
  });

  // 模拟资金记录数据
  const [fundRecords, setFundRecords] = useState([
    {
      id: '1',
      type: 'deposit',
      amount: 50000,
      status: 'completed',
      date: '2024-01-15'
    },
    {
      id: '2',
      type: 'withdrawal',
      amount: 20000,
      status: 'completed',
      date: '2024-01-10'
    },
    {
      id: '3',
      type: 'subscription',
      amount: 100000,
      status: 'completed',
      date: '2024-01-05'
    }
  ]);

  // 根据版本调整样式
  const getVersionStyles = () => {
    switch (appVersion) {
      case 'simple':
        return {
          fontSize: {
            base: 18,
            large: 24,
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

  // 版本差异化标题
  const getVersionTitle = () => {
    switch (appVersion) {
      case 'simple':
        return lang === 'zh' ? '资管产品' : 'Asset Management';
      case 'premium':
        return lang === 'zh' ? '尊享资管' : 'Premium Asset Mgmt';
      default:
        return lang === 'zh' ? '资管' : 'Asset Management';
    }
  };

  // 获取记录类型样式
  const getRecordTypeStyle = (type: string) => {
    switch (type) {
      case 'deposit':
        return { 
          color: '#4CAF50', 
          bgColor: '#E8F5E9',
          icon: 'arrow-down-circle',
          label: lang === 'zh' ? '入金' : 'Deposit'
        };
      case 'withdrawal':
        return { 
          color: '#F44336', 
          bgColor: '#FFEBEE',
          icon: 'arrow-up-circle',
          label: lang === 'zh' ? '出金' : 'Withdrawal'
        };
      case 'subscription':
        return { 
          color: '#1A4EA2', 
          bgColor: '#E3F2FD',
          icon: 'cart',
          label: lang === 'zh' ? '申购' : 'Subscription'
        };
      default:
        return { 
          color: '#666', 
          bgColor: '#F5F5F5',
          icon: 'help-circle',
          label: type
        };
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* 渐变头部背景 */}
      <LinearGradient
        colors={['#1A4EA2', '#0D3A8A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.headerGradient, { paddingTop: Platform.OS === 'web' ? 20 : insets.top }]}
      >
        {/* 顶部导航栏 */}
        <View style={styles.header}>
          <Text style={[styles.title, { fontSize: versionStyles.fontSize.large }]}>
            {getVersionTitle()}
          </Text>
          
          <View style={styles.headerIcons}>
            {/* 消息中心图标 */}
            <TouchableOpacity style={styles.iconButton} onPress={onNavigateToMessageCenter}>
              <View style={styles.iconButtonBg}>
                <Ionicons name="notifications-outline" size={20} color="#fff" />
              </View>
            </TouchableOpacity>
            {/* 在线客服图标 */}
            <TouchableOpacity style={styles.iconButton} onPress={onNavigateToCustomerService}>
              <View style={styles.iconButtonBg}>
                <Ionicons name="chatbubble-outline" size={20} color="#fff" />
              </View>
            </TouchableOpacity>
            {/* 版本切换图标 */}
            <TouchableOpacity style={styles.iconButton} onPress={onNavigateToVersionSwitch}>
              <View style={styles.iconButtonBg}>
                <Ionicons name="settings-outline" size={20} color="#fff" />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* 搜索框 */}
        <View style={styles.searchWrapper}>
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={18} color="#999" style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { fontSize: versionStyles.fontSize.small }]}
              placeholder={lang === 'zh' ? '搜索产品' : 'Search Products'}
              placeholderTextColor="#999"
            />
          </View>
        </View>
      </LinearGradient>

      {/* 可滚动内容区域 */}
      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 资产总览卡片 */}
        <View style={styles.assetsCard}>
          <LinearGradient
            colors={['#FFFFFF', '#F8FAFF']}
            style={styles.assetsCardGradient}
          >
            <View style={styles.assetsHeader}>
              <View style={styles.assetsTitleWrapper}>
                <View style={styles.assetsIconBg}>
                  <Ionicons name="wallet-outline" size={20} color="#1A4EA2" />
                </View>
                <Text style={[styles.assetsTitle, { fontSize: versionStyles.fontSize.base }]}>
                  {lang === 'zh' ? '资产总览' : 'Asset Overview'}
                </Text>
              </View>
              <Pressable onPress={onNavigateToAssetStatus} style={styles.moreButtonWrapper}>
                <Text style={styles.moreButton}>{lang === 'zh' ? '查看详情' : 'View Details'}</Text>
                <Ionicons name="chevron-forward" size={14} color="#1A4EA2" />
              </Pressable>
            </View>
            
            <View style={styles.totalAssetsSection}>
              <Text style={[styles.assetLabel, { fontSize: versionStyles.fontSize.small }]}>
                {lang === 'zh' ? '总资产 (CNY)' : 'Total Assets (CNY)'}
              </Text>
              <Text style={[styles.assetValue, { fontSize: appVersion === 'simple' ? 32 : 28 }]}>
                ¥{assets.totalAssets.toLocaleString()}
              </Text>
            </View>
            
            {/* 标准版本显示完整资产分布，简易版只显示总资产 */}
            {appVersion !== 'simple' && (
              <View style={styles.assetDistribution}>
                <View style={styles.assetDistributionItem}>
                  <View style={[styles.distributionDot, { backgroundColor: '#1A4EA2' }]} />
                  <Text style={[styles.distributionLabel, { fontSize: versionStyles.fontSize.small }]}>
                    {lang === 'zh' ? '基金持仓' : 'Fund'}
                  </Text>
                  <Text style={[styles.distributionValue, { fontSize: versionStyles.fontSize.base }]}>
                    ¥{assets.fundValue.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.distributionDivider} />
                <View style={styles.assetDistributionItem}>
                  <View style={[styles.distributionDot, { backgroundColor: '#4CAF50' }]} />
                  <Text style={[styles.distributionLabel, { fontSize: versionStyles.fontSize.small }]}>
                    {lang === 'zh' ? '现金资产' : 'Cash'}
                  </Text>
                  <Text style={[styles.distributionValue, { fontSize: versionStyles.fontSize.base }]}>
                    ¥{assets.cash.toLocaleString()}
                  </Text>
                </View>
              </View>
            )}
          </LinearGradient>
        </View>

        {/* 资产管理功能按钮 */}
        <View style={styles.functionCard}>
          <View style={styles.functionGrid}>
            <Pressable style={styles.functionButton} onPress={onNavigateToDepositService}>
              <View style={[styles.functionIconBg, { backgroundColor: '#E8F5E9' }]}>
                <Ionicons name="arrow-down-circle" size={28} color="#4CAF50" />
              </View>
              <Text style={[styles.functionButtonText, { fontSize: versionStyles.fontSize.small }]}>
                {lang === 'zh' ? '入金服务' : 'Deposit'}
              </Text>
            </Pressable>
            
            <Pressable style={styles.functionButton} onPress={onNavigateToWithdrawalApplication}>
              <View style={[styles.functionIconBg, { backgroundColor: '#FFEBEE' }]}>
                <Ionicons name="arrow-up-circle" size={28} color="#F44336" />
              </View>
              <Text style={[styles.functionButtonText, { fontSize: versionStyles.fontSize.small }]}>
                {lang === 'zh' ? '出金申请' : 'Withdraw'}
              </Text>
            </Pressable>
            
            {/* 简易版只显示核心功能 */}
            {appVersion !== 'simple' && (
              <>
                <Pressable style={styles.functionButton} onPress={onNavigateToAssetStatus}>
                  <View style={[styles.functionIconBg, { backgroundColor: '#E3F2FD' }]}>
                    <Ionicons name="wallet" size={28} color="#1A4EA2" />
                  </View>
                  <Text style={[styles.functionButtonText, { fontSize: versionStyles.fontSize.small }]}>
                    {lang === 'zh' ? '资产状况' : 'Assets'}
                  </Text>
                </Pressable>
                
                <Pressable style={styles.functionButton} onPress={onNavigateToFundTransactions}>
                  <View style={[styles.functionIconBg, { backgroundColor: '#FFF3E0' }]}>
                    <Ionicons name="swap-horizontal" size={28} color="#FF9800" />
                  </View>
                  <Text style={[styles.functionButtonText, { fontSize: versionStyles.fontSize.small }]}>
                    {lang === 'zh' ? '资金往来' : 'Transactions'}
                  </Text>
                </Pressable>
              </>
            )}
          </View>
        </View>

        {/* 尊享版专属服务 */}
        {appVersion === 'premium' && (
          <View style={styles.premiumCard}>
            <View style={styles.premiumHeader}>
              <View style={styles.premiumIconBg}>
                <Ionicons name="diamond" size={20} color="#FFD700" />
              </View>
              <Text style={[styles.premiumTitle, { fontSize: versionStyles.fontSize.base }]}>
                {lang === 'zh' ? '尊享专属服务' : 'Premium Exclusive Services'}
              </Text>
            </View>
            
            <View style={styles.premiumServiceItem}>
              <View style={[styles.premiumServiceIconBg, { backgroundColor: '#E3F2FD' }]}>
                <Ionicons name="shield-checkmark" size={22} color="#1A4EA2" />
              </View>
              <View style={styles.premiumServiceContent}>
                <Text style={styles.premiumServiceTitle}>
                  {lang === 'zh' ? '专属投资顾问' : 'Personal Investment Advisor'}
                </Text>
                <Text style={styles.premiumServiceDescription}>
                  {lang === 'zh' ? '一对一专业投资建议，量身定制理财方案' : 'One-on-one professional investment advice'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#CCC" />
            </View>
            
            <View style={styles.premiumServiceDivider} />
            
            <View style={styles.premiumServiceItem}>
              <View style={[styles.premiumServiceIconBg, { backgroundColor: '#FFF3E0' }]}>
                <Ionicons name="calendar" size={22} color="#FF9800" />
              </View>
              <View style={styles.premiumServiceContent}>
                <Text style={styles.premiumServiceTitle}>
                  {lang === 'zh' ? '专属投资策略会' : 'Exclusive Investment Strategy Meeting'}
                </Text>
                <Text style={styles.premiumServiceDescription}>
                  {lang === 'zh' ? '定期举办高端投资策略会，提前把握市场先机' : 'Regular high-end investment strategy meetings'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#CCC" />
            </View>
            
            <View style={styles.premiumServiceDivider} />
            
            <View style={styles.premiumServiceItem}>
              <View style={[styles.premiumServiceIconBg, { backgroundColor: '#F3E5F5' }]}>
                <Ionicons name="star" size={22} color="#9C27B0" />
              </View>
              <View style={styles.premiumServiceContent}>
                <Text style={styles.premiumServiceTitle}>
                  {lang === 'zh' ? '优先购买权' : 'Priority Purchase Right'}
                </Text>
                <Text style={styles.premiumServiceDescription}>
                  {lang === 'zh' ? '新基金产品优先购买权，享受专属费率优惠' : 'Priority purchase right for new fund products'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#CCC" />
            </View>
          </View>
        )}

        {/* 基金产品列表 */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleWrapper}>
              <View style={styles.sectionIconBg}>
                <Ionicons name="trending-up" size={18} color="#1A4EA2" />
              </View>
              <Text style={[styles.sectionTitle, { fontSize: versionStyles.fontSize.base }]}>
                {lang === 'zh' ? '基金产品' : 'Fund Products'}
              </Text>
            </View>
          </View>
          
          <View style={styles.fundProductsList}>
            {fundProducts.map((product, index) => {
              const typeStyle = getFundTypeStyle(product.type);
              return (
                <Pressable 
                  key={product.id} 
                  style={styles.fundProductCard}
                  onPress={() => onNavigateToSubscriptionApplication?.(product)}
                >
                  <View style={styles.fundProductHeader}>
                    <View style={[styles.fundTypeIconBg, { backgroundColor: typeStyle.bgColor }]}>
                      <Ionicons name={typeStyle.icon as any} size={18} color={typeStyle.color} />
                    </View>
                    <View style={styles.fundProductTitleSection}>
                      <Text style={[styles.productName, { fontSize: versionStyles.fontSize.base }]}>
                        {product.name}
                      </Text>
                      <View style={styles.productTags}>
                        <View style={[styles.productTag, { backgroundColor: typeStyle.bgColor }]}>
                          <Text style={[styles.productTagText, { color: typeStyle.color }]}>{product.type}</Text>
                        </View>
                        <View style={[styles.productTag, { backgroundColor: getRiskLevelColor(product.riskLevel) + '20' }]}>
                          <Text style={[styles.productTagText, { color: getRiskLevelColor(product.riskLevel) }]}>{product.riskLevel}</Text>
                        </View>
                      </View>
                    </View>
                    <View style={styles.returnSection}>
                      <Text style={[
                        styles.productReturn,
                        product.returnRate >= 0 ? styles.positiveReturn : styles.negativeReturn,
                        { fontSize: versionStyles.fontSize.large }
                      ]}>
                        {product.returnRate >= 0 ? '+' : ''}{product.returnRate}%
                      </Text>
                      <Text style={styles.returnLabel}>{lang === 'zh' ? '年化收益' : 'Annual Return'}</Text>
                    </View>
                  </View>
                  
                  {/* 标准版本显示完整产品信息 */}
                  {appVersion !== 'simple' && (
                    <View style={styles.productDetails}>
                      <View style={styles.detailItem}>
                        <Text style={[styles.detailLabel, { fontSize: versionStyles.fontSize.small }]}>
                          {lang === 'zh' ? '产品代码' : 'Code'}
                        </Text>
                        <Text style={[styles.detailValue, { fontSize: versionStyles.fontSize.small }]}>
                          {product.code}
                        </Text>
                      </View>
                      <View style={styles.detailDivider} />
                      <View style={styles.detailItem}>
                        <Text style={[styles.detailLabel, { fontSize: versionStyles.fontSize.small }]}>
                          {lang === 'zh' ? '产品描述' : 'Description'}
                        </Text>
                        <Text style={[styles.detailValue, { fontSize: versionStyles.fontSize.small }]} numberOfLines={1}>
                          {product.description}
                        </Text>
                      </View>
                    </View>
                  )}
                  
                  <View style={styles.productFooter}>
                    <Pressable 
                      style={styles.subscribeButton}
                      onPress={() => onNavigateToSubscriptionApplication?.(product)}
                    >
                      <LinearGradient
                        colors={['#1A4EA2', '#0D3A8A']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.subscribeButtonGradient}
                      >
                        <Text style={styles.subscribeButtonText}>
                          {lang === 'zh' ? '立即申购' : 'Subscribe'}
                        </Text>
                      </LinearGradient>
                    </Pressable>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* 资金往来记录 - 标准版本显示，简易版隐藏 */}
        {appVersion !== 'simple' && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleWrapper}>
                <View style={styles.sectionIconBg}>
                  <Ionicons name="time-outline" size={18} color="#1A4EA2" />
                </View>
                <Text style={[styles.sectionTitle, { fontSize: versionStyles.fontSize.base }]}>
                  {lang === 'zh' ? '资金往来记录' : 'Fund Transactions'}
                </Text>
              </View>
              <Pressable onPress={onNavigateToFundTransactions} style={styles.moreButtonWrapper}>
                <Text style={styles.moreButton}>{lang === 'zh' ? '查看全部' : 'View All'}</Text>
                <Ionicons name="chevron-forward" size={14} color="#1A4EA2" />
              </Pressable>
            </View>
            
            <View style={styles.recordsList}>
              {fundRecords.map((record) => {
                const typeStyle = getRecordTypeStyle(record.type);
                return (
                  <View key={record.id} style={styles.recordCard}>
                    <View style={[styles.recordIconBg, { backgroundColor: typeStyle.bgColor }]}>
                      <Ionicons name={typeStyle.icon as any} size={22} color={typeStyle.color} />
                    </View>
                    <View style={styles.recordContent}>
                      <View style={styles.recordHeader}>
                        <Text style={[styles.recordType, { fontSize: versionStyles.fontSize.base }]}>
                          {typeStyle.label}
                        </Text>
                        <Text style={[
                          styles.recordAmount,
                          { color: typeStyle.color, fontSize: versionStyles.fontSize.base }
                        ]}>
                          {record.type === 'deposit' ? '+' : '-'}¥{record.amount.toLocaleString()}
                        </Text>
                      </View>
                      <View style={styles.recordFooter}>
                        <View style={[styles.statusBadge, { 
                          backgroundColor: record.status === 'completed' ? '#E8F5E9' : '#FFF3E0' 
                        }]}>
                          <Text style={[styles.statusText, { 
                            color: record.status === 'completed' ? '#4CAF50' : '#FF9800',
                            fontSize: versionStyles.fontSize.small 
                          }]}>
                            {lang === 'zh' 
                              ? record.status === 'completed' ? '已完成' : '处理中' 
                              : record.status === 'completed' ? 'Completed' : 'Processing'
                            }
                          </Text>
                        </View>
                        <Text style={[styles.recordDate, { fontSize: versionStyles.fontSize.small }]}>
                          {record.date}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}
        
        {/* 底部留白 */}
        <View style={{ height: insets.bottom + 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  headerGradient: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
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
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchWrapper: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 44,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 14,
    color: '#333',
  },
  scrollContent: {
    flex: 1,
    marginTop: -10,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    backgroundColor: '#F5F7FA',
  },
  // 资产总览卡片
  assetsCard: {
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 16,
    backgroundColor: '#fff',
    shadowColor: '#1A4EA2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    overflow: 'hidden',
  },
  assetsCardGradient: {
    padding: 20,
  },
  assetsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  assetsTitleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  assetsIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  assetsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  moreButtonWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moreButton: {
    color: '#1A4EA2',
    fontSize: 13,
    fontWeight: '500',
  },
  totalAssetsSection: {
    marginBottom: 20,
  },
  assetLabel: {
    fontSize: 13,
    color: '#999',
    marginBottom: 8,
  },
  assetValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A4EA2',
  },
  assetDistribution: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  assetDistributionItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  distributionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  distributionLabel: {
    fontSize: 12,
    color: '#999',
    marginRight: 8,
  },
  distributionValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  distributionDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 16,
  },
  // 功能按钮卡片
  functionCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    backgroundColor: '#fff',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  functionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  functionButton: {
    alignItems: 'center',
    paddingVertical: 8,
    minWidth: 70,
  },
  functionIconBg: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  functionButtonText: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
  // 尊享服务卡片
  premiumCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    backgroundColor: '#fff',
    padding: 20,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#FFF8E1',
  },
  premiumHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  premiumIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFF8E1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  premiumTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  premiumServiceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  premiumServiceIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  premiumServiceContent: {
    flex: 1,
  },
  premiumServiceTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  premiumServiceDescription: {
    fontSize: 12,
    color: '#999',
  },
  premiumServiceDivider: {
    height: 1,
    backgroundColor: '#F5F5F5',
    marginLeft: 58,
  },
  // 通用区块
  sectionContainer: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIconBg: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  // 基金产品列表
  fundProductsList: {
    gap: 12,
  },
  fundProductCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  fundProductHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  fundTypeIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  fundProductTitleSection: {
    flex: 1,
  },
  productName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  productTags: {
    flexDirection: 'row',
    gap: 8,
  },
  productTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  productTagText: {
    fontSize: 11,
    fontWeight: '500',
  },
  returnSection: {
    alignItems: 'flex-end',
  },
  productReturn: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  positiveReturn: {
    color: '#4CAF50',
  },
  negativeReturn: {
    color: '#F44336',
  },
  returnLabel: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  productDetails: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    marginBottom: 12,
  },
  detailItem: {
    flex: 1,
  },
  detailDivider: {
    width: 1,
    backgroundColor: '#F5F5F5',
    marginHorizontal: 12,
  },
  detailLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  productFooter: {
    alignItems: 'flex-end',
  },
  subscribeButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  subscribeButtonGradient: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  subscribeButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  // 资金记录
  recordsList: {
    gap: 10,
  },
  recordCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  recordIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  recordContent: {
    flex: 1,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  recordType: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  recordAmount: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  recordFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '500',
  },
  recordDate: {
    fontSize: 12,
    color: '#999',
  },
});
