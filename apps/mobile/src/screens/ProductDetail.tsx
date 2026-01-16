import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native'

interface Product {
  id: string;
  product_number?: string;
  name?: string;
  name_cn?: string;
  name_en?: string;
  description?: string;
  type?: string;
  risk_level?: string;
  status?: string;
  return_rate?: number;
  nav?: number;
  latest_nav_date?: string;
  created_at?: string;
  updated_at?: string;
}

export default function ProductDetail({ product, lang = 'zh', onClose, onSubscribe }: { 
  product: Product; 
  lang?: 'zh' | 'en';
  onClose?: () => void;
  onSubscribe?: (product: Product) => void;
}) {
  
  const getProductName = () => {
    if (product.name) return product.name;
    if (lang === 'zh' && product.name_cn) return product.name_cn;
    if (lang === 'en' && product.name_en) return product.name_en;
    return product.name_cn || product.name_en || '未命名产品';
  };

  const getProductCode = () => {
    return product.product_number || 'N/A';
  };

  const getDescription = () => {
    return product.description || (lang === 'zh' ? '暂无描述' : 'No description available');
  };

  const getReturnRate = () => {
    return product.return_rate !== undefined ? product.return_rate : 0;
  };

  const getNav = () => {
    return product.nav !== undefined ? product.nav : 0;
  };

  const getLatestNavDate = () => {
    if (!product.latest_nav_date) return '';
    return new Date(product.latest_nav_date).toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getProductType = () => {
    const typeMap: Record<string, string> = {
      stock: lang === 'zh' ? '股票' : 'Stock',
      fund: lang === 'zh' ? '基金' : 'Fund',
      bond: lang === 'zh' ? '债券' : 'Bond',
      other: lang === 'zh' ? '其他' : 'Other'
    };
    return typeMap[product.type || ''] || product.type || '-';
  };

  const getRiskLevel = () => {
    const riskMap: Record<string, string> = {
      low: lang === 'zh' ? '低风险' : 'Low Risk',
      medium: lang === 'zh' ? '中风险' : 'Medium Risk',
      high: lang === 'zh' ? '高风险' : 'High Risk'
    };
    return riskMap[product.risk_level || ''] || product.risk_level || '-';
  };

  const getStatus = () => {
    const statusMap: Record<string, string> = {
      active: lang === 'zh' ? '活跃' : 'Active',
      inactive: lang === 'zh' ? '非活跃' : 'Inactive'
    };
    return statusMap[product.status || ''] || product.status || '-';
  };

  const returnRate = getReturnRate();
  const isPositive = returnRate >= 0;
  const nav = getNav();
  const hasNavData = nav > 0 || product.latest_nav_date;
  
  return (
    <View style={styles.container}>
      {/* 顶部导航栏 */}
      <View style={styles.header}>
        <Pressable onPress={onClose} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>
          {lang === 'zh' ? '产品详情' : 'Product Detail'}
        </Text>
        <View style={styles.headerRight} />
      </View>

      {/* 产品详情内容 */}
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
      >
        {/* 产品基本信息 */}
        <View style={styles.productContainer}>
          {/* 产品名称 */}
          <Text style={styles.productName}>
            {getProductName()}
          </Text>

          {/* 产品代码 */}
          <View style={styles.codeContainer}>
            <Text style={styles.codeLabel}>
              {lang === 'zh' ? '产品代码' : 'Product Code'}
            </Text>
            <Text style={styles.codeValue}>
              {getProductCode()}
            </Text>
          </View>

          {/* 产品类型 */}
          <View style={styles.typeContainer}>
            <Text style={styles.typeLabel}>
              {lang === 'zh' ? '产品类型' : 'Product Type'}
            </Text>
            <Text style={styles.typeValue}>
              {getProductType()}
            </Text>
          </View>

          {/* 风险等级 */}
          <View style={styles.typeContainer}>
            <Text style={styles.typeLabel}>
              {lang === 'zh' ? '风险等级' : 'Risk Level'}
            </Text>
            <Text style={styles.typeValue}>
              {getRiskLevel()}
            </Text>
          </View>

          {/* 状态 */}
          <View style={styles.typeContainer}>
            <Text style={styles.typeLabel}>
              {lang === 'zh' ? '状态' : 'Status'}
            </Text>
            <Text style={[styles.typeValue, product.status === 'active' ? styles.activeStatus : styles.inactiveStatus]}>
              {getStatus()}
            </Text>
          </View>

          {/* 分隔线 */}
          <View style={styles.divider} />

          {/* 收益率卡片 */}
          <View style={styles.returnCard}>
            <Text style={styles.returnLabel}>
              {lang === 'zh' ? '年化收益率' : 'Annual Return'}
            </Text>
            <Text style={[styles.returnValue, isPositive ? styles.positiveReturn : styles.negativeReturn]}>
              {isPositive ? '+' : ''}{returnRate.toFixed(2)}%
            </Text>
          </View>

          {/* 净值信息 - 仅在有数据时显示 */}
          {hasNavData && (
            <View style={styles.navCard}>
              <View style={styles.navRow}>
                <Text style={styles.navLabel}>
                  {lang === 'zh' ? '最新净值' : 'Latest NAV'}
                </Text>
                <Text style={styles.navValue}>
                  {nav.toFixed(4)}
                </Text>
              </View>
              {product.latest_nav_date && (
                <Text style={styles.navDate}>
                  {lang === 'zh' ? '净值日期：' : 'NAV Date: '}{getLatestNavDate()}
                </Text>
              )}
            </View>
          )}

          {/* 分隔线 */}
          <View style={styles.divider} />

          {/* 产品描述 */}
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionTitle}>
              {lang === 'zh' ? '产品描述' : 'Description'}
            </Text>
            <Text style={styles.descriptionText}>
              {getDescription()}
            </Text>
          </View>

          {/* 风险提示 */}
          <View style={styles.riskContainer}>
            <Text style={styles.riskTitle}>
              {lang === 'zh' ? '风险提示' : 'Risk Warning'}
            </Text>
            <Text style={styles.riskText}>
              {lang === 'zh' 
                ? '投资有风险，入市需谨慎。过往业绩不代表未来表现。投资者应根据自身风险承受能力谨慎投资。'
                : 'Investment involves risks. Past performance does not indicate future results. Investors should invest cautiously based on their own risk tolerance.'}
            </Text>
          </View>

          {/* 申购按钮 */}
          <Pressable 
            style={styles.subscribeButton} 
            onPress={() => {
              if (onSubscribe) {
                onSubscribe(product);
              }
            }}
          >
            <Text style={styles.subscribeButtonText}>
              {lang === 'zh' ? '申请申购' : 'Subscribe'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    height: 56,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: {
    fontSize: 24,
    color: '#000000',
    fontWeight: '300',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '500',
    color: '#000000',
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    paddingBottom: 32,
  },
  productContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  productName: {
    color: '#000000',
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 34,
    marginBottom: 20,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  codeLabel: {
    color: '#666666',
    fontSize: 15,
  },
  codeValue: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '500',
  },
  typeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  activeStatus: {
    color: '#2e7d32',
  },
  inactiveStatus: {
    color: '#d32f2f',
  },
  typeLabel: {
    color: '#666666',
    fontSize: 15,
  },
  typeValue: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginBottom: 24,
  },
  returnCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  returnLabel: {
    color: '#666666',
    fontSize: 14,
    marginBottom: 8,
  },
  returnValue: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 40,
  },
  positiveReturn: {
    color: '#d32f2f',
  },
  negativeReturn: {
    color: '#2e7d32',
  },
  navCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  navLabel: {
    color: '#666666',
    fontSize: 14,
  },
  navValue: {
    color: '#000000',
    fontSize: 28,
    fontWeight: '600',
  },
  navDate: {
    color: '#999999',
    fontSize: 13,
  },
  descriptionContainer: {
    marginBottom: 24,
  },
  descriptionTitle: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  descriptionText: {
    color: '#333333',
    fontSize: 15,
    lineHeight: 24,
    letterSpacing: 0.3,
  },
  riskContainer: {
    backgroundColor: '#fff3e0',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  riskTitle: {
    color: '#e65100',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  riskText: {
    color: '#bf360c',
    fontSize: 13,
    lineHeight: 20,
  },
  subscribeButton: {
    backgroundColor: '#188038',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  subscribeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
})
