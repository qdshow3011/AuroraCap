import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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

  return (
    <View style={styles.container}>
      {/* 顶部导航栏 */}
      <View style={styles.header}>
        <Text style={[styles.title, { fontSize: versionStyles.fontSize.large, fontWeight: versionStyles.fontWeight.bold }]}>
          {getVersionTitle()}
        </Text>
        
        {/* 搜索框 */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={versionStyles.fontSize.base} color="#999" style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { fontSize: versionStyles.fontSize.small }]}
            placeholder={lang === 'zh' ? '搜索产品' : 'Search Products'}
            placeholderTextColor="#999"
          />
        </View>
        
        <View style={styles.headerIcons}>
          {/* 消息中心图标 */}
          <TouchableOpacity style={styles.iconButton} onPress={onNavigateToMessageCenter}>
            <Ionicons name="notifications-outline" size={versionStyles.fontSize.base} color="#333" />
          </TouchableOpacity>
          {/* 在线客服图标 */}
          <TouchableOpacity style={styles.iconButton} onPress={onNavigateToCustomerService}>
            <Ionicons name="chatbubble-outline" size={versionStyles.fontSize.base} color="#333" />
          </TouchableOpacity>
          {/* 版本切换图标 */}
          <TouchableOpacity style={styles.iconButton} onPress={onNavigateToVersionSwitch}>
            <Ionicons name="settings-outline" size={versionStyles.fontSize.base} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 可滚动内容区域 */}
      <ScrollView style={styles.scrollContent}>
        {/* 资产总览 */}
        <View style={styles.assetsContainer}>
        <View style={styles.assetsHeader}>
          <Text style={[styles.assetsTitle, { fontSize: versionStyles.fontSize.base, fontWeight: versionStyles.fontWeight.bold }]}>
            {lang === 'zh' ? '资产总览' : 'Asset Overview'}
          </Text>
          <Pressable onPress={onNavigateToAssetStatus}>
            <Text style={styles.moreButton}>{lang === 'zh' ? '查看详情' : 'View Details'} &gt;</Text>
          </Pressable>
        </View>
        
        <View style={styles.assetItem}>
          <Text style={[styles.assetLabel, { fontSize: versionStyles.fontSize.small }]}>
            {lang === 'zh' ? '总资产' : 'Total Assets'}
          </Text>
          <Text style={[styles.assetValue, { fontSize: versionStyles.fontSize.large, fontWeight: versionStyles.fontWeight.bold }]}>
            ¥{assets.totalAssets.toLocaleString()}
          </Text>
        </View>
        
        {/* 标准版本显示完整资产分布，简易版只显示总资产 */}
        {appVersion !== 'simple' && (
          <>
            <View style={styles.assetItem}>
              <Text style={[styles.assetLabel, { fontSize: versionStyles.fontSize.small }]}>
                {lang === 'zh' ? '基金持仓' : 'Fund Holdings'}
              </Text>
              <Text style={[styles.assetValue, { fontSize: versionStyles.fontSize.base, fontWeight: versionStyles.fontWeight.medium }]}>
                ¥{assets.fundValue.toLocaleString()}
              </Text>
            </View>
            
            <View style={styles.assetItem}>
              <Text style={[styles.assetLabel, { fontSize: versionStyles.fontSize.small }]}>
                {lang === 'zh' ? '现金资产' : 'Cash Assets'}
              </Text>
              <Text style={[styles.assetValue, { fontSize: versionStyles.fontSize.base, fontWeight: versionStyles.fontWeight.medium }]}>
                ¥{assets.cash.toLocaleString()}
              </Text>
            </View>
          </>
        )}
      </View>

      {/* 资产管理功能按钮 */}
      <View style={styles.assetManagementButtons}>
        <View style={styles.buttonRow}>
          <Pressable style={styles.functionButton} onPress={onNavigateToSubscriptionApplication}>
            <Ionicons name="add-circle-outline" size={versionStyles.fontSize.large} color="#4a90e2" />
            <Text style={[styles.functionButtonText, { fontSize: versionStyles.fontSize.small }]}>
              {lang === 'zh' ? '申购' : 'Subscribe'}
            </Text>
          </Pressable>
          
          <Pressable style={styles.functionButton} onPress={() => {/* 导航到赎回 */}}>
            <Ionicons name="remove-circle-outline" size={versionStyles.fontSize.large} color="#4a90e2" />
            <Text style={[styles.functionButtonText, { fontSize: versionStyles.fontSize.small }]}>
              {lang === 'zh' ? '赎回' : 'Redeem'}
            </Text>
          </Pressable>
          
          {/* 简易版只显示核心功能 */}
          {appVersion !== 'simple' && (
            <>
              <Pressable style={styles.functionButton} onPress={onNavigateToDepositService}>
                <Ionicons name="arrow-down-circle-outline" size={versionStyles.fontSize.large} color="#4a90e2" />
                <Text style={[styles.functionButtonText, { fontSize: versionStyles.fontSize.small }]}>
                  {lang === 'zh' ? '入金' : 'Deposit'}
                </Text>
              </Pressable>
              
              <Pressable style={styles.functionButton} onPress={onNavigateToWithdrawalApplication}>
                <Ionicons name="arrow-up-circle-outline" size={versionStyles.fontSize.large} color="#4a90e2" />
                <Text style={[styles.functionButtonText, { fontSize: versionStyles.fontSize.small }]}>
                  {lang === 'zh' ? '出金' : 'Withdraw'}
                </Text>
              </Pressable>
            </>
          )}
        </View>
      </View>

      {/* 尊享版专属服务 */}
      {appVersion === 'premium' && (
        <View style={styles.premiumServices}>
          <Text style={[styles.assetsTitle, { fontSize: versionStyles.fontSize.base, fontWeight: versionStyles.fontWeight.bold, marginBottom: 16 }]}>
            {lang === 'zh' ? '尊享专属服务' : 'Premium Exclusive Services'}
          </Text>
          
          <View style={styles.premiumServiceItem}>
            <Ionicons name="shield-checkmark-outline" size={24} color="#4a90e2" style={styles.premiumServiceIcon} />
            <View style={styles.premiumServiceContent}>
              <Text style={styles.premiumServiceTitle}>
                {lang === 'zh' ? '专属投资顾问' : 'Personal Investment Advisor'}
              </Text>
              <Text style={styles.premiumServiceDescription}>
                {lang === 'zh' ? '一对一专业投资建议，量身定制理财方案' : 'One-on-one professional investment advice, customized financial plan'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#4a90e2" style={styles.premiumServiceArrow} />
          </View>
          
          <View style={styles.premiumServiceDivider} />
          
          <View style={styles.premiumServiceItem}>
            <Ionicons name="calendar-outline" size={24} color="#4a90e2" style={styles.premiumServiceIcon} />
            <View style={styles.premiumServiceContent}>
              <Text style={styles.premiumServiceTitle}>
                {lang === 'zh' ? '专属投资策略会' : 'Exclusive Investment Strategy Meeting'}
              </Text>
              <Text style={styles.premiumServiceDescription}>
                {lang === 'zh' ? '定期举办高端投资策略会，提前把握市场先机' : 'Regular high-end investment strategy meetings, grasp market opportunities in advance'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#4a90e2" style={styles.premiumServiceArrow} />
          </View>
          
          <View style={styles.premiumServiceDivider} />
          
          <View style={styles.premiumServiceItem}>
            <Ionicons name="diamond-outline" size={24} color="#4a90e2" style={styles.premiumServiceIcon} />
            <View style={styles.premiumServiceContent}>
              <Text style={styles.premiumServiceTitle}>
                {lang === 'zh' ? '优先购买权' : 'Priority Purchase Right'}
              </Text>
              <Text style={styles.premiumServiceDescription}>
                {lang === 'zh' ? '新基金产品优先购买权，享受专属费率优惠' : 'Priority purchase right for new fund products, exclusive fee discounts'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#4a90e2" style={styles.premiumServiceArrow} />
          </View>
        </View>
      )}

      {/* 基金产品列表 */}
      <View style={styles.fundProductsContainer}>
        <Text style={[styles.fundProductsTitle, { fontSize: versionStyles.fontSize.base, fontWeight: versionStyles.fontWeight.bold }]}>
          {lang === 'zh' ? '基金产品' : 'Fund Products'}
        </Text>
        
        <View style={styles.fundProductsList}>
          {fundProducts.map((product) => (
            <Pressable 
              key={product.id} 
              style={styles.fundProductItem}
              onPress={() => onNavigateToSubscriptionApplication?.(product)}
            >
              <View style={styles.fundProductInfo}>
                <Text style={[styles.productName, { fontSize: versionStyles.fontSize.base, fontWeight: versionStyles.fontWeight.medium }]}>
                  {product.name}
                </Text>
                
                {/* 标准版本显示完整产品信息，简易版只显示名称和收益率 */}
                {appVersion !== 'simple' && (
                  <View style={styles.productDetails}>
                    <View style={styles.detailItem}>
                      <Text style={[styles.detailLabel, { fontSize: versionStyles.fontSize.small }]}>
                        {lang === 'zh' ? '代码' : 'Code'}
                      </Text>
                      <Text style={[styles.detailValue, { fontSize: versionStyles.fontSize.small }]}>
                        {product.code}
                      </Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={[styles.detailLabel, { fontSize: versionStyles.fontSize.small }]}>
                        {lang === 'zh' ? '类型' : 'Type'}
                      </Text>
                      <Text style={[styles.detailValue, { fontSize: versionStyles.fontSize.small }]}>
                        {product.type}
                      </Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={[styles.detailLabel, { fontSize: versionStyles.fontSize.small }]}>
                        {lang === 'zh' ? '风险' : 'Risk'}
                      </Text>
                      <Text style={[styles.detailValue, { fontSize: versionStyles.fontSize.small }]}>
                        {product.riskLevel}
                      </Text>
                    </View>
                  </View>
                )}
                
                <Text style={[
                  styles.productReturn,
                  product.returnRate >= 0 ? styles.positiveReturn : styles.negativeReturn,
                  { fontSize: versionStyles.fontSize.base, fontWeight: versionStyles.fontWeight.bold }
                ]}>
                  {product.returnRate}%
                </Text>
              </View>
              <Pressable 
                style={styles.subscribeButton}
                onPress={() => onNavigateToSubscriptionApplication?.(product)}
              >
                <Text style={styles.subscribeButtonText}>
                  {lang === 'zh' ? '申购' : 'Subscribe'}
                </Text>
              </Pressable>
            </Pressable>
          ))}
        </View>
      </View>

      {/* 资金往来记录 - 标准版本显示，简易版隐藏 */}
      {appVersion !== 'simple' && (
        <View style={styles.fundsRecordsContainer}>
          <View style={styles.recordsHeader}>
            <Text style={[styles.recordsTitle, { fontSize: versionStyles.fontSize.base, fontWeight: versionStyles.fontWeight.bold }]}>
              {lang === 'zh' ? '资金往来记录' : 'Fund Transactions'}
            </Text>
            <Pressable onPress={onNavigateToFundTransactions}>
              <Text style={styles.moreButton}>{lang === 'zh' ? '查看全部' : 'View All'} &gt;</Text>
            </Pressable>
          </View>
          
          <View style={styles.recordsList}>
            {fundRecords.map((record) => (
              <View key={record.id} style={styles.recordItem}>
                <View style={styles.recordHeader}>
                  <Text style={[styles.recordType, { fontSize: versionStyles.fontSize.small }]}>
                    {lang === 'zh' 
                      ? record.type === 'deposit' ? '入金' : record.type === 'withdrawal' ? '出金' : '申购' 
                      : record.type === 'deposit' ? 'Deposit' : record.type === 'withdrawal' ? 'Withdrawal' : 'Subscription'
                    }
                  </Text>
                  <Text style={[
                    styles.recordAmount,
                    record.type === 'deposit' ? styles.depositAmount : styles.withdrawalAmount,
                    { fontSize: versionStyles.fontSize.small, fontWeight: versionStyles.fontWeight.bold }
                  ]}>
                    {record.type === 'deposit' ? '+' : '-'}
                    ¥{record.amount.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.recordDetails}>
                  <Text style={[styles.recordStatus, { fontSize: versionStyles.fontSize.small }]}>
                    {lang === 'zh' 
                      ? record.status === 'completed' ? '已完成' : '处理中' 
                      : record.status === 'completed' ? 'Completed' : 'Processing'
                    }
                  </Text>
                  <Text style={[styles.recordDate, { fontSize: versionStyles.fontSize.small }]}>
                    {record.date}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 12,
    paddingHorizontal: 12,
    backgroundColor: '#f0f2f5',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f2f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginHorizontal: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 14,
    color: '#333',
  },
  scrollContent: {
    flex: 1,
    padding: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginLeft: 16,
    padding: 8,
  },
  assetsContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  assetsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  assetsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  moreButton: {
    color: '#4a90e2',
    fontSize: 14,
  },
  assetItem: {
    marginBottom: 16,
  },
  assetLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  assetValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  assetManagementButtons: {
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
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  functionButtonText: {
    fontSize: 14,
    color: '#333',
  },
  fundProductsContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  fundProductsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  fundProductsList: {
    gap: 12,
  },
  fundProductItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  fundProductInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  productDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  productReturn: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  positiveReturn: {
    color: '#188038',
  },
  negativeReturn: {
    color: '#d93025',
  },
  subscribeButton: {
    backgroundColor: '#4a90e2',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
  },
  subscribeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  fundsRecordsContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  recordsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  recordsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  recordsList: {
    marginTop: 16,
  },
  recordItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
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
    fontWeight: '500',
    color: '#333',
  },
  recordAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  depositAmount: {
    color: '#188038',
  },
  withdrawalAmount: {
    color: '#d93025',
  },
  recordDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recordStatus: {
    fontSize: 14,
    color: '#666',
  },
  recordDate: {
    fontSize: 14,
    color: '#999',
  },
  // 尊享版专属服务样式
  premiumServices: {
    backgroundColor: '#f0f4ff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  premiumServiceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  premiumServiceIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  premiumServiceContent: {
    flex: 1,
  },
  premiumServiceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  premiumServiceDescription: {
    fontSize: 14,
    color: '#666',
  },
  premiumServiceArrow: {
    fontSize: 16,
    color: '#4a90e2',
  },
  premiumServiceDivider: {
    height: 1,
    backgroundColor: '#e0e8ff',
    marginVertical: 8,
  },
});
