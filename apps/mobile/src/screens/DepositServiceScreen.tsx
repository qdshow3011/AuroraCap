import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { supabase } from '../lib/supabase';

interface ServicePerson {
  id: string;
  name: string;
  phone: string;
  wechat: string;
}

export default function DepositServiceScreen({ lang = 'zh', onClose, onNavigateToCustomerService }: { lang?: 'zh' | 'en'; onClose: () => void; onNavigateToCustomerService?: () => void }) {
  // 状态管理
  const [servicePerson, setServicePerson] = useState<ServicePerson | null>(null);
  const [loading, setLoading] = useState(true);

  // 语言翻译
  const t = lang === 'zh' ? {
    title: '入金服务',
    note: '本基金以美元计价，涉及资金汇转比较负责，故整个过程安排客服给以指导',
    yourCustomer: '您的客服',
    name: '姓名',
    phone: '手机号码',
    wechat: '微信号',
    transferProcess: '资金汇转流程',
    noOverseasCard: '没有境外卡的大陆客户',
    hasOverseasCard: '已经有港卡（且上面有资金）的客户',
    step1: '换美元（人民币额度每人每年5万元美金）',
    step2: '开港卡（由客服根据具体情况指导并推荐几家银行，需要入境香港）',
    step3: '汇美元到港卡（要求备注消费或旅游，不能写投资）',
    step4: '从港卡转汇到基金账户（基金账户信息：银行名称：香港招商永隆银行；银行账号：25025666522；账户名称：BVI出海财经有限公司）',
    stepOnly1: '查看港卡上的资金情况，不足则想办法汇入。',
    stepOnly2: '从港卡汇美元到基金账户（基金账户信息：银行名称：香港招商永隆银行；银行账号：25025666522；账户名称：BVI出海财经有限公司）',
    back: '返回'
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
    back: 'Back'
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

  return (
    <View style={styles.container}>
      {/* 顶部导航栏 */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={onClose}>
          <Text style={styles.backButtonText}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{t.title}</Text>
        <View style={styles.headerRight} />
      </View>

      {/* 主要内容 */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 备注提示 */}
        <View style={styles.noteContainer}>
          <Text style={styles.noteText}>{t.note}</Text>
        </View>

        {/* 您的客户信息 */}
        <View style={styles.customerContainer}>
          <Text style={styles.sectionTitle}>{t.yourCustomer}</Text>
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>{lang === 'zh' ? '加载中...' : 'Loading...'}</Text>
            </View>
          ) : (
            <View style={styles.customerInfoCard}>
              <View style={styles.customerInfoItem}>
                <Text style={styles.customerInfoLabel}>{t.name}</Text>
                <Text style={styles.customerInfoValue}>{servicePerson?.name}</Text>
              </View>
              <View style={styles.customerInfoItem}>
                <Text style={styles.customerInfoLabel}>{t.phone}</Text>
                <Text style={styles.customerInfoValue}>{servicePerson?.phone}</Text>
              </View>
              <View style={styles.customerInfoItem}>
                <Text style={styles.customerInfoLabel}>{t.wechat}</Text>
                <Text style={styles.customerInfoValue}>{servicePerson?.wechat}</Text>
              </View>
            </View>
          )}
        </View>
        
        {/* 联系客服按钮 */}
        <Pressable 
          style={styles.contactServiceButton} 
          onPress={() => {
            console.log('联系客服按钮被点击，跳转到客服页面');
            onNavigateToCustomerService?.();
          }}
        >
          <Text style={styles.contactServiceButtonIcon}>🎧</Text>
          <Text style={styles.contactServiceButtonText}>{lang === 'zh' ? '联系客服' : 'Contact Customer Service'}</Text>
        </Pressable>

        {/* 资金汇转流程 */}
        <View style={styles.processContainer}>
          <Text style={styles.sectionTitle}>{t.transferProcess}</Text>

          {/* 无境外卡的大陆客户 */}
          <View style={styles.processCard}>
            <Text style={styles.processTitle}>{t.noOverseasCard}</Text>
            <View style={styles.stepContainer}>
              <View style={styles.stepItem}>
                <View style={styles.stepNumberContainer}>
                  <Text style={styles.stepNumber}>1</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepText}>{t.step1}</Text>
                </View>
              </View>
              <View style={styles.stepConnector} />
              <View style={styles.stepItem}>
                <View style={styles.stepNumberContainer}>
                  <Text style={styles.stepNumber}>2</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepText}>{t.step2}</Text>
                </View>
              </View>
              <View style={styles.stepConnector} />
              <View style={styles.stepItem}>
                <View style={styles.stepNumberContainer}>
                  <Text style={styles.stepNumber}>3</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepText}>{t.step3}</Text>
                </View>
              </View>
              <View style={styles.stepConnector} />
              <View style={styles.stepItem}>
                <View style={styles.stepNumberContainer}>
                  <Text style={styles.stepNumber}>4</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepText}>{t.step4}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* 已有港卡的客户 */}
          <View style={styles.processCard}>
            <Text style={styles.processTitle}>{t.hasOverseasCard}</Text>
            <View style={styles.stepContainer}>
              <View style={styles.stepItem}>
                <View style={styles.stepNumberContainer}>
                  <Text style={styles.stepNumber}>1</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepText}>{t.stepOnly1}</Text>
                </View>
              </View>
              <View style={styles.stepConnector} />
              <View style={styles.stepItem}>
                <View style={styles.stepNumberContainer}>
                  <Text style={styles.stepNumber}>2</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepText}>{t.stepOnly2}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  backButtonText: {
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
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  noteContainer: {
    backgroundColor: '#e3f2fd',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#2196f3',
  },
  noteText: {
    fontSize: 14,
    color: '#1565c0',
    lineHeight: 20,
  },
  customerContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 16,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
  },
  loadingText: {
    color: '#666666',
    fontSize: 14,
  },
  customerInfoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  customerInfoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  customerInfoLabel: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '500',
  },
  customerInfoValue: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '600',
  },
  processContainer: {
    marginBottom: 16,
  },
  processCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
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
  processTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 20,
  },
  stepContainer: {
    position: 'relative',
  },
  stepItem: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  stepNumberContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2196f3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    zIndex: 1,
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  stepContent: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginLeft: -16,
    paddingLeft: 32,
  },
  stepText: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
  },
  stepConnector: {
    position: 'absolute',
    left: 16,
    top: 32,
    bottom: 0,
    width: 2,
    backgroundColor: '#e0e0e0',
  },
});
