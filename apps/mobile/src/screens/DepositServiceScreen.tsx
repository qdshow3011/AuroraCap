import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Pressable, 
  ScrollView, 
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabase';

interface ServicePerson {
  id: string;
  name: string;
  phone: string;
  wechat: string;
  avatar?: string;
}

export default function DepositServiceScreen({ 
  lang = 'zh', 
  onClose, 
  onNavigateToCustomerService 
}: { 
  lang?: 'zh' | 'en'; 
  onClose: () => void; 
  onNavigateToCustomerService?: () => void;
}) {
  const insets = useSafeAreaInsets();
  
  // 状态管理
  const [servicePerson, setServicePerson] = useState<ServicePerson | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'noCard' | 'hasCard'>('noCard');

  // 语言翻译
  const t = lang === 'zh' ? {
    title: '入金服务',
    note: '本基金以美元计价，涉及资金汇转比较复杂，故整个过程安排客服给以指导',
    yourCustomer: '您的专属客服',
    name: '姓名',
    phone: '手机号码',
    wechat: '微信号',
    transferProcess: '资金汇转流程',
    noOverseasCard: '没有境外卡的大陆客户',
    hasOverseasCard: '已有港卡（且上面有资金）的客户',
    step1: '换美元（人民币额度每人每年5万元美金）',
    step2: '开港卡（由客服根据具体情况指导并推荐几家银行，需要入境香港）',
    step3: '汇美元到港卡（要求备注消费或旅游，不能写投资）',
    step4: '从港卡转汇到基金账户（基金账户信息：银行名称：香港招商永隆银行；银行账号：25025666522；账户名称：BVI出海财经有限公司）',
    stepOnly1: '查看港卡上的资金情况，不足则想办法汇入。',
    stepOnly2: '从港卡汇美元到基金账户（基金账户信息：银行名称：香港招商永隆银行；银行账号：25025666522；账户名称：BVI出海财经有限公司）',
    contactService: '联系客服',
    copySuccess: '复制成功',
    copy: '复制',
    bankInfo: '银行账户信息',
    bankName: '银行名称',
    accountNumber: '银行账号',
    accountName: '账户名称',
    currency: '币种',
    usd: '美元（USD）'
  } : {
    title: 'Deposit Service',
    note: 'This fund is denominated in US dollars, and fund transfer is relatively complicated, so the whole process is arranged for customers to guide',
    yourCustomer: 'Your Customer Service',
    name: 'Name',
    phone: 'Phone Number',
    wechat: 'WeChat ID',
    transferProcess: 'Fund Transfer Process',
    noOverseasCard: 'Mainland customers without overseas card',
    hasOverseasCard: 'Customers who already have a Hong Kong card (with funds on it)',
    step1: 'Exchange for US dollars (Annual quota: $50,000 USD per person)',
    step2: 'Open a Hong Kong card (Guided by customer service, need to enter Hong Kong)',
    step3: 'Transfer US dollars to Hong Kong card (Note: consumption or travel, not investment)',
    step4: 'Transfer from Hong Kong card to fund account (Bank: CMB Wing Lung Bank Hong Kong; Account No.: 25025666522; Account Name: BVI Chuhai Finance Co., Ltd.)',
    stepOnly1: 'Check the funds on your Hong Kong card, top up if insufficient.',
    stepOnly2: 'Transfer US dollars from Hong Kong card to fund account (Bank: CMB Wing Lung Bank Hong Kong; Account No.: 25025666522; Account Name: BVI Chuhai Finance Co., Ltd.)',
    contactService: 'Contact Customer Service',
    copySuccess: 'Copied',
    copy: 'Copy',
    bankInfo: 'Bank Account Information',
    bankName: 'Bank Name',
    accountNumber: 'Account Number',
    accountName: 'Account Name',
    currency: 'Currency',
    usd: 'US Dollar (USD)'
  };

  // 获取服务员信息
  useEffect(() => {
    const fetchServicePerson = async () => {
      setLoading(true);
      try {
        // 从users表获取角色为服务员的用户
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('role', '服务员')
          .limit(1);

        if (error) {
          console.error('Failed to fetch service person:', error);
          // 使用默认服务员信息
          setServicePerson({
            id: 'default',
            name: '张三',
            phone: '138****8888',
            wechat: 'zhangsan123'
          });
        } else if (data && data.length > 0) {
          const person = data[0];
          setServicePerson({
            id: person.id,
            name: person.name || '服务员',
            phone: person.phone_number || 'N/A',
            wechat: person.wechat || 'N/A'
          });
        } else {
          // 使用默认服务员信息
          setServicePerson({
            id: 'default',
            name: '张三',
            phone: '138****8888',
            wechat: 'zhangsan123'
          });
        }
      } catch (error) {
        console.error('Error fetching service person:', error);
        // 使用默认服务员信息
        setServicePerson({
          id: 'default',
          name: '张三',
          phone: '138****8888',
          wechat: 'zhangsan123'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchServicePerson();
  }, []);

  // 复制到剪贴板
  const handleCopy = (text: string) => {
    // 这里可以实现复制功能
    console.log('Copied:', text);
  };

  // 步骤数据
  const noCardSteps = [
    { icon: 'cash-outline', title: t.step1 },
    { icon: 'card-outline', title: t.step2 },
    { icon: 'airplane-outline', title: t.step3 },
    { icon: 'business-outline', title: t.step4 },
  ];

  const hasCardSteps = [
    { icon: 'wallet-outline', title: t.stepOnly1 },
    { icon: 'send-outline', title: t.stepOnly2 },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A4EA2" />
      
      {/* 渐变头部 */}
      <LinearGradient
        colors={['#1A4EA2', '#0D3A8A']}
        style={[styles.header, { paddingTop: insets.top > 0 ? insets.top : 16 }]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={onClose}>
            <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t.title}</Text>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      {/* 主要内容 */}
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 备注提示 */}
        <View style={styles.infoCard}>
          <View style={styles.infoIconWrapper}>
            <Ionicons name="information-circle" size={28} color="#1A4EA2" />
          </View>
          <Text style={styles.infoText}>{t.note}</Text>
        </View>

        {/* 客服信息卡片 */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="person-circle-outline" size={22} color="#1A4EA2" />
            <Text style={styles.cardTitle}>{t.yourCustomer}</Text>
          </View>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#1A4EA2" />
              <Text style={styles.loadingText}>{lang === 'zh' ? '加载中...' : 'Loading...'}</Text>
            </View>
          ) : (
            <View style={styles.customerCard}>
              {/* 客服头像 */}
              <View style={styles.avatarContainer}>
                <LinearGradient
                  colors={['#1A4EA2', '#0D3A8A']}
                  style={styles.avatar}
                >
                  <Text style={styles.avatarText}>
                    {servicePerson?.name?.charAt(0) || '客'}
                  </Text>
                </LinearGradient>
                <View style={styles.onlineIndicator} />
              </View>
              
              {/* 客服信息 */}
              <View style={styles.customerInfo}>
                <View style={styles.infoRow}>
                  <View style={styles.infoItem}>
                    <Ionicons name="person-outline" size={16} color="#666666" />
                    <Text style={styles.infoLabel}>{t.name}</Text>
                    <Text style={styles.infoValue}>{servicePerson?.name}</Text>
                  </View>
                </View>
                <View style={styles.infoRow}>
                  <View style={styles.infoItem}>
                    <Ionicons name="call-outline" size={16} color="#666666" />
                    <Text style={styles.infoLabel}>{t.phone}</Text>
                    <Text style={styles.infoValue}>{servicePerson?.phone}</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.copyButton}
                    onPress={() => handleCopy(servicePerson?.phone || '')}
                  >
                    <Text style={styles.copyButtonText}>{t.copy}</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.infoRow}>
                  <View style={styles.infoItem}>
                    <Ionicons name="chatbubble-outline" size={16} color="#666666" />
                    <Text style={styles.infoLabel}>{t.wechat}</Text>
                    <Text style={styles.infoValue}>{servicePerson?.wechat}</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.copyButton}
                    onPress={() => handleCopy(servicePerson?.wechat || '')}
                  >
                    <Text style={styles.copyButtonText}>{t.copy}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
          
          {/* 联系客服按钮 */}
          <TouchableOpacity 
            style={styles.contactButton}
            onPress={() => {
              console.log('联系客服按钮被点击，跳转到客服页面');
              onNavigateToCustomerService?.();
            }}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#1A4EA2', '#0D3A8A']}
              style={styles.contactButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="headset" size={20} color="#FFFFFF" />
              <Text style={styles.contactButtonText}>{t.contactService}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* 银行账户信息卡片 */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="business-outline" size={22} color="#1A4EA2" />
            <Text style={styles.cardTitle}>{t.bankInfo}</Text>
          </View>
          
          <View style={styles.bankInfoContainer}>
            <View style={styles.bankInfoItem}>
              <View style={[styles.bankIconContainer, { backgroundColor: '#E3F2FD' }]}>
                <Ionicons name="business" size={20} color="#1A4EA2" />
              </View>
              <View style={styles.bankInfoContent}>
                <Text style={styles.bankInfoLabel}>{t.bankName}</Text>
                <Text style={styles.bankInfoValue}>香港招商永隆银行</Text>
              </View>
            </View>
            
            <View style={styles.bankInfoItem}>
              <View style={[styles.bankIconContainer, { backgroundColor: '#E8F5E9' }]}>
                <Ionicons name="card" size={20} color="#4CAF50" />
              </View>
              <View style={styles.bankInfoContent}>
                <Text style={styles.bankInfoLabel}>{t.accountNumber}</Text>
                <View style={styles.accountNumberRow}>
                  <Text style={styles.bankInfoValue}>25025666522</Text>
                  <TouchableOpacity 
                    style={styles.copyButtonSmall}
                    onPress={() => handleCopy('25025666522')}
                  >
                    <Text style={styles.copyButtonTextSmall}>{t.copy}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            
            <View style={styles.bankInfoItem}>
              <View style={[styles.bankIconContainer, { backgroundColor: '#FFF3E0' }]}>
                <Ionicons name="person" size={20} color="#FF9800" />
              </View>
              <View style={styles.bankInfoContent}>
                <Text style={styles.bankInfoLabel}>{t.accountName}</Text>
                <Text style={styles.bankInfoValue}>BVI出海财经有限公司</Text>
              </View>
            </View>
            
            <View style={styles.bankInfoItem}>
              <View style={[styles.bankIconContainer, { backgroundColor: '#F3E5F5' }]}>
                <Ionicons name="logo-usd" size={20} color="#9C27B0" />
              </View>
              <View style={styles.bankInfoContent}>
                <Text style={styles.bankInfoLabel}>{t.currency}</Text>
                <Text style={styles.bankInfoValue}>{t.usd}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 资金汇转流程 */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="git-branch-outline" size={22} color="#1A4EA2" />
            <Text style={styles.cardTitle}>{t.transferProcess}</Text>
          </View>

          {/* 标签页切换 */}
          <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'noCard' && styles.activeTab]}
              onPress={() => setActiveTab('noCard')}
            >
              <Text style={[styles.tabText, activeTab === 'noCard' && styles.activeTabText]}>
                {t.noOverseasCard}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'hasCard' && styles.activeTab]}
              onPress={() => setActiveTab('hasCard')}
            >
              <Text style={[styles.tabText, activeTab === 'hasCard' && styles.activeTabText]}>
                {t.hasOverseasCard}
              </Text>
            </TouchableOpacity>
          </View>

          {/* 时间线步骤 */}
          <View style={styles.timelineContainer}>
            {(activeTab === 'noCard' ? noCardSteps : hasCardSteps).map((step, index) => (
              <View key={index} style={styles.timelineItem}>
                {/* 左侧时间线 */}
                <View style={styles.timelineLeft}>
                  <View style={styles.timelineDot}>
                    <Text style={styles.timelineNumber}>{index + 1}</Text>
                  </View>
                  {index < (activeTab === 'noCard' ? noCardSteps : hasCardSteps).length - 1 && (
                    <View style={styles.timelineLine} />
                  )}
                </View>
                
                {/* 右侧内容 */}
                <View style={styles.timelineContent}>
                  <View style={styles.stepCard}>
                    <View style={[styles.stepIconContainer, { backgroundColor: getStepColor(index) + '15' }]}>
                      <Ionicons name={step.icon as any} size={20} color={getStepColor(index)} />
                    </View>
                    <Text style={styles.stepText}>{step.title}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
        
        {/* 底部留白 */}
        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// 获取步骤颜色
const getStepColor = (index: number) => {
  const colors = ['#1A4EA2', '#4CAF50', '#FF9800', '#9C27B0', '#F44336', '#00BCD4'];
  return colors[index % colors.length];
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  // 头部样式
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
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 40,
  },
  // 滚动区域
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  // 信息卡片
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#1A4EA2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  infoIconWrapper: {
    marginRight: 12,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1565C0',
    lineHeight: 22,
  },
  // 卡片样式
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginLeft: 8,
  },
  // 加载样式
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: '#999999',
    fontSize: 14,
    marginTop: 12,
  },
  // 客服卡片
  customerCard: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  customerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: '#999999',
    marginLeft: 6,
    marginRight: 8,
    width: 60,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    flex: 1,
  },
  copyButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#E3F2FD',
    borderRadius: 4,
  },
  copyButtonText: {
    fontSize: 12,
    color: '#1A4EA2',
    fontWeight: '500',
  },
  // 联系按钮
  contactButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  contactButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  contactButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // 银行信息
  bankInfoContainer: {
    gap: 12,
  },
  bankInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
  },
  bankIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  bankInfoContent: {
    flex: 1,
  },
  bankInfoLabel: {
    fontSize: 12,
    color: '#999999',
    marginBottom: 4,
  },
  bankInfoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333333',
  },
  accountNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  copyButtonSmall: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    backgroundColor: '#E3F2FD',
    borderRadius: 4,
  },
  copyButtonTextSmall: {
    fontSize: 11,
    color: '#1A4EA2',
    fontWeight: '500',
  },
  // 标签页
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F5F7FA',
    borderRadius: 10,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 13,
    color: '#666666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#1A4EA2',
    fontWeight: '600',
  },
  // 时间线
  timelineContainer: {
    paddingLeft: 8,
  },
  timelineItem: {
    flexDirection: 'row',
  },
  timelineLeft: {
    alignItems: 'center',
    width: 40,
  },
  timelineDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1A4EA2',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  timelineNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E0E0E0',
    marginTop: 4,
    marginBottom: -4,
  },
  timelineContent: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: 20,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 14,
  },
  stepIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
    fontWeight: '500',
  },
});
