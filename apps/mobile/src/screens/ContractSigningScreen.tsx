import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  StatusBar,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { messageGenerator } from '../utils/message-generator';

interface Contract {
  id: string;
  title: string;
  content: string;
  type: string;
  status: 'unsigned' | 'signed';
  signed_at?: string;
  created_at: string;
  updated_at: string;
}

export default function ContractSigningScreen({
  lang = 'zh',
  userInfo,
  onClose,
  onNavigateToSubscriptionApplication,
  onNavigateToRedemptionApplication,
  onNavigateToSubscriptionRedemptionRecords,
}: {
  lang?: 'zh' | 'en';
  userInfo?: any;
  onClose?: () => void;
  onNavigateToSubscriptionApplication?: () => void;
  onNavigateToRedemptionApplication?: () => void;
  onNavigateToSubscriptionRedemptionRecords?: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [showContractModal, setShowContractModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'unsigned' | 'signed'>('all');

  const t = lang === 'zh' ? {
    title: '合同管理',
    subscriptionApplication: '申购申请',
    redemptionApplication: '赎回申请',
    subscriptionRedemptionRecords: '交易记录',
    contracts: '合同签订',
    allContracts: '全部合同',
    unsignedContracts: '待签署',
    signedContracts: '已签署',
    loading: '加载中...',
    error: '加载失败',
    noContracts: '暂无合同',
    signContract: '签署合同',
    viewContract: '查看合同',
    contractSigned: '合同已签署',
    signedAt: '签署时间',
    confirmSign: '确认签署',
    signConfirmTitle: '确认签署合同',
    signConfirmMessage: '您确定要签署此合同吗？签署后将具有法律效力。',
    cancel: '取消',
    confirm: '确认',
    success: '签署成功',
    errorSigning: '签署失败',
    contractContent: '合同内容',
    close: '关闭',
    unsigned: '待签署',
    signed: '已签署',
    contractType: '合同类型',
    createdAt: '创建时间',
    totalContracts: '共 {count} 份合同',
    unsignedCount: '{count} 份待签署',
  } : {
    title: 'Contract Management',
    subscriptionApplication: 'Subscription Application',
    redemptionApplication: 'Redemption Application',
    subscriptionRedemptionRecords: 'Transaction Records',
    contracts: 'Contracts',
    allContracts: 'All Contracts',
    unsignedContracts: 'Pending',
    signedContracts: 'Signed',
    loading: 'Loading...',
    error: 'Failed to load',
    noContracts: 'No contracts available',
    signContract: 'Sign Contract',
    viewContract: 'View Contract',
    contractSigned: 'Contract Signed',
    signedAt: 'Signed At',
    confirmSign: 'Confirm Signature',
    signConfirmTitle: 'Confirm Contract Signing',
    signConfirmMessage: 'Are you sure you want to sign this contract? It will be legally binding after signing.',
    cancel: 'Cancel',
    confirm: 'Confirm',
    success: 'Signed Successfully',
    errorSigning: 'Signing Failed',
    contractContent: 'Contract Content',
    close: 'Close',
    unsigned: 'Pending',
    signed: 'Signed',
    contractType: 'Contract Type',
    createdAt: 'Created At',
    totalContracts: '{count} contracts total',
    unsignedCount: '{count} pending',
  };

  const loadContracts = async () => {
    setLoading(true);
    try {
      if (!userInfo || !userInfo.id) {
        setContracts([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('user_id', userInfo.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to load contracts:', error);
        setContracts([]);
      } else {
        setContracts(data || []);
      }
    } catch (error) {
      console.error('Error loading contracts:', error);
      setContracts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContracts();
  }, [userInfo]);

  const handleSignContract = async (contract: Contract) => {
    Alert.alert(
      t.signConfirmTitle,
      t.signConfirmMessage,
      [
        { text: t.cancel, style: 'cancel' },
        {
          text: t.confirm,
          onPress: async () => {
            setSigning(true);
            try {
              const { error } = await supabase
                .from('contracts')
                .update({
                  status: 'signed',
                  signed_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                })
                .eq('id', contract.id);

              if (error) {
                console.error('Failed to sign contract:', error);
                Alert.alert(t.errorSigning, lang === 'zh' ? '签署失败，请稍后重试' : 'Signing failed, please try again later');
              } else {
                await messageGenerator.generateContractSignedMessage(
                  userInfo?.id || '',
                  userInfo?.nickname || userInfo?.name || '极光用户',
                  contract.title
                );
                Alert.alert(t.success, lang === 'zh' ? '合同签署成功' : 'Contract signed successfully');
                loadContracts();
              }
            } catch (error) {
              console.error('Error signing contract:', error);
              Alert.alert(t.errorSigning, lang === 'zh' ? '签署失败，请稍后重试' : 'Signing failed, please try again later');
            } finally {
              setSigning(false);
            }
          },
        },
      ]
    );
  };

  const handleViewContract = (contract: Contract) => {
    setSelectedContract(contract);
    setShowContractModal(true);
  };

  const getStatusColor = (status: string) => {
    return status === 'signed' ? '#4CAF50' : '#FF9800';
  };

  const getStatusBgColor = (status: string) => {
    return status === 'signed' ? '#E8F5E9' : '#FFF3E0';
  };

  const getStatusText = (status: string) => {
    return status === 'signed' ? t.signed : t.unsigned;
  };

  const getFilteredContracts = () => {
    switch (activeTab) {
      case 'unsigned':
        return contracts.filter(c => c.status === 'unsigned');
      case 'signed':
        return contracts.filter(c => c.status === 'signed');
      default:
        return contracts;
    }
  };

  const filteredContracts = getFilteredContracts();
  const unsignedCount = contracts.filter(c => c.status === 'unsigned').length;

  const renderContractCard = (contract: Contract) => {
    const isSigned = contract.status === 'signed';

    return (
      <View style={styles.contractCard} key={contract.id}>
        <LinearGradient
          colors={isSigned ? ['#E8F5E9', '#FFFFFF'] : ['#FFF3E0', '#FFFFFF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.contractCardGradient}
        >
          <View style={styles.contractCardHeader}>
            <View style={styles.contractCardHeaderLeft}>
              <View style={[styles.contractIconContainer, { backgroundColor: getStatusBgColor(contract.status) }]}>
                <Ionicons
                  name={isSigned ? 'document-text' : 'create-outline'}
                  size={24}
                  color={getStatusColor(contract.status)}
                />
              </View>
              <View style={styles.contractTitleContainer}>
                <Text style={styles.contractTitle} numberOfLines={1}>
                  {contract.title}
                </Text>
                <Text style={styles.contractType}>{t.contractType}: {contract.type}</Text>
              </View>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusBgColor(contract.status) }]}>
              <Text style={[styles.statusText, { color: getStatusColor(contract.status) }]}>
                {getStatusText(contract.status)}
              </Text>
            </View>
          </View>

          <View style={styles.contractCardDivider} />

          <View style={styles.contractCardBody}>
            <View style={styles.contractInfoRow}>
              <View style={styles.contractInfoItem}>
                <Text style={styles.contractInfoLabel}>{t.createdAt}</Text>
                <Text style={styles.contractInfoValue}>
                  {new Date(contract.created_at).toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US')}
                </Text>
              </View>
              {contract.signed_at && (
                <View style={styles.contractInfoItem}>
                  <Text style={styles.contractInfoLabel}>{t.signedAt}</Text>
                  <Text style={styles.contractInfoValue}>
                    {new Date(contract.signed_at).toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US')}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.contractCardFooter}>
            <TouchableOpacity
              style={styles.viewButton}
              onPress={() => handleViewContract(contract)}
            >
              <Ionicons name="eye-outline" size={18} color="#1A4EA2" />
              <Text style={styles.viewButtonText}>{t.viewContract}</Text>
            </TouchableOpacity>

            {!isSigned && (
              <TouchableOpacity
                style={styles.signButton}
                onPress={() => handleSignContract(contract)}
                disabled={signing}
              >
                <LinearGradient
                  colors={['#4CAF50', '#388E3C']}
                  style={styles.signButtonGradient}
                >
                  <Ionicons name="create" size={18} color="#FFFFFF" />
                  <Text style={styles.signButtonText}>{t.signContract}</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>
      </View>
    );
  };

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
            onPress={onNavigateToSubscriptionApplication}
          >
            <View style={styles.functionIconContainer}>
              <Ionicons name="add-circle" size={22} color="#999" />
            </View>
            <Text style={styles.functionButtonText}>{t.subscriptionApplication}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.functionButton}
            onPress={onNavigateToRedemptionApplication}
          >
            <View style={styles.functionIconContainer}>
              <Ionicons name="remove-circle" size={22} color="#999" />
            </View>
            <Text style={styles.functionButtonText}>{t.redemptionApplication}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.functionButton}
            onPress={onNavigateToSubscriptionRedemptionRecords}
          >
            <View style={styles.functionIconContainer}>
              <Ionicons name="document-text" size={22} color="#999" />
            </View>
            <Text style={styles.functionButtonText}>{t.subscriptionRedemptionRecords}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.functionButton, styles.activeFunctionButton]}
          >
            <View style={[styles.functionIconContainer, styles.activeFunctionIconContainer]}>
              <Ionicons name="create" size={22} color="#FFFFFF" />
            </View>
            <Text style={[styles.functionButtonText, styles.activeFunctionButtonText]}>{t.contracts}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'all' && styles.activeTabItem]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
            {t.allContracts}
          </Text>
          {activeTab === 'all' && <View style={styles.activeTabIndicator} />}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'unsigned' && styles.activeTabItem]}
          onPress={() => setActiveTab('unsigned')}
        >
          <Text style={[styles.tabText, activeTab === 'unsigned' && styles.activeTabText]}>
            {t.unsignedContracts}
          </Text>
          {unsignedCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unsignedCount}</Text>
            </View>
          )}
          {activeTab === 'unsigned' && <View style={styles.activeTabIndicator} />}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'signed' && styles.activeTabItem]}
          onPress={() => setActiveTab('signed')}
        >
          <Text style={[styles.tabText, activeTab === 'signed' && styles.activeTabText]}>
            {t.signedContracts}
          </Text>
          {activeTab === 'signed' && <View style={styles.activeTabIndicator} />}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {contracts.length > 0 && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{contracts.length}</Text>
              <Text style={styles.statLabel}>{t.totalContracts.replace('{count}', contracts.length.toString())}</Text>
            </View>
            {unsignedCount > 0 && (
              <View style={[styles.statCard, styles.statCardHighlight]}>
                <Text style={[styles.statValue, styles.statValueHighlight]}>{unsignedCount}</Text>
                <Text style={[styles.statLabel, styles.statLabelHighlight]}>
                  {t.unsignedCount.replace('{count}', unsignedCount.toString())}
                </Text>
              </View>
            )}
          </View>
        )}

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1A4EA2" />
            <Text style={styles.loadingText}>{t.loading}</Text>
          </View>
        ) : filteredContracts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color="#CCC" />
            <Text style={styles.emptyText}>{t.noContracts}</Text>
          </View>
        ) : (
          <View style={styles.contractsContainer}>
            {filteredContracts.map(renderContractCard)}
          </View>
        )}
        <View style={styles.bottomPadding} />
      </ScrollView>

      <Modal
        visible={showContractModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowContractModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <LinearGradient
              colors={['#1A4EA2', '#0D3A8A']}
              style={styles.modalHeader}
            >
              <Text style={styles.modalTitle}>{selectedContract?.title}</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowContractModal(false)}
              >
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </LinearGradient>
            <ScrollView style={styles.modalBody}>
              <Text style={styles.modalContractType}>
                {t.contractType}: {selectedContract?.type}
              </Text>
              <Text style={styles.modalContractContent}>
                {selectedContract?.content}
              </Text>
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setShowContractModal(false)}
              >
                <Text style={styles.modalCloseBtnText}>{t.close}</Text>
              </TouchableOpacity>
              {selectedContract?.status === 'unsigned' && (
                <TouchableOpacity
                  style={styles.modalSignBtn}
                  onPress={() => {
                    setShowContractModal(false);
                    if (selectedContract) {
                      handleSignContract(selectedContract);
                    }
                  }}
                >
                  <LinearGradient
                    colors={['#4CAF50', '#388E3C']}
                    style={styles.modalSignBtnGradient}
                  >
                    <Text style={styles.modalSignBtnText}>{t.signContract}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
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
    backgroundColor: '#4CAF50',
  },
  functionButtonText: {
    fontSize: 11,
    color: '#999',
    fontWeight: '500',
  },
  activeFunctionButtonText: {
    color: '#4CAF50',
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
    flexDirection: 'row',
    justifyContent: 'center',
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
  badge: {
    backgroundColor: '#F44336',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  statCardHighlight: {
    backgroundColor: '#FFF3E0',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A4EA2',
    marginBottom: 4,
  },
  statValueHighlight: {
    color: '#FF9800',
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
  },
  statLabelHighlight: {
    color: '#E65100',
  },
  contractsContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  contractCard: {
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  contractCardGradient: {
    // Gradient background
  },
  contractCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  contractCardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  contractIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contractTitleContainer: {
    flex: 1,
  },
  contractTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  contractType: {
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
  contractCardDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 16,
  },
  contractCardBody: {
    padding: 16,
  },
  contractInfoRow: {
    flexDirection: 'row',
  },
  contractInfoItem: {
    flex: 1,
  },
  contractInfoLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 4,
  },
  contractInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  contractCardFooter: {
    flexDirection: 'row',
    padding: 16,
    paddingTop: 0,
    gap: 12,
  },
  viewButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#E3F2FD',
    borderRadius: 10,
    gap: 6,
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A4EA2',
  },
  signButton: {
    flex: 1,
  },
  signButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  signButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#999',
    fontSize: 14,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    padding: 20,
    maxHeight: 400,
  },
  modalContractType: {
    fontSize: 14,
    color: '#999',
    marginBottom: 16,
  },
  modalContractContent: {
    fontSize: 15,
    color: '#333',
    lineHeight: 24,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 0,
    gap: 12,
  },
  modalCloseBtn: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: '#F5F7FA',
    borderRadius: 10,
    alignItems: 'center',
  },
  modalCloseBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  modalSignBtn: {
    flex: 1,
  },
  modalSignBtnGradient: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalSignBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
