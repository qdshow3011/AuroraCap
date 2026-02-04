import { useState, useEffect } from 'react'
import { View, Text, Pressable, ActivityIndicator, RefreshControl, ScrollView, Image, TextInput, Modal, Alert, TouchableWithoutFeedback, Keyboard } from 'react-native'
import { getUserAccounts, createAccount, updateAccount, deleteAccount } from '../api/accounts'
import { getUserArticles } from '../api/articles'

interface OfficialAccount {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  cover_image?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface Article {
  id: string;
  title: string;
  content: string;
  cover_image?: string;
  read_count?: number;
  like_count?: number;
  comment_count?: number;
  created_at: string;
  published_at?: string;
}

export default function AccountManagementScreen({ onOpenArticle, onClose, lang = 'zh' }: { 
  onOpenArticle: (article: Article) => void; 
  onClose?: () => void; 
  lang?: 'zh' | 'en';
}) {
  const [accounts, setAccounts] = useState<OfficialAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingAccount, setEditingAccount] = useState<OfficialAccount | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    avatar: '',
    cover_image: '',
  })
  const [submitting, setSubmitting] = useState(false)

  const fetchAccounts = async () => {
    try {
      setLoading(true)
      const accountsData = await getUserAccounts();
      setAccounts(accountsData);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      Alert.alert(
        lang === 'zh' ? '错误' : 'Error',
        lang === 'zh' ? '获取公众号列表失败' : 'Failed to fetch accounts'
      );
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchAccounts()
  }, [])

  const onRefresh = () => {
    setRefreshing(true)
    fetchAccounts()
  }

  const handleCreateAccount = async () => {
    if (!formData.name.trim()) {
      Alert.alert(
        lang === 'zh' ? '提示' : 'Tip',
        lang === 'zh' ? '请输入公众号名称' : 'Please enter account name'
      );
      return;
    }

    try {
      setSubmitting(true);
      await createAccount({
        name: formData.name,
        description: formData.description,
        avatar: formData.avatar,
        cover_image: formData.cover_image,
      });
      Alert.alert(
        lang === 'zh' ? '成功' : 'Success',
        lang === 'zh' ? '公众号创建成功' : 'Account created successfully'
      );
      setShowCreateModal(false);
      setFormData({ name: '', description: '', avatar: '', cover_image: '' });
      fetchAccounts();
    } catch (error) {
      console.error('Error creating account:', error);
      Alert.alert(
        lang === 'zh' ? '错误' : 'Error',
        lang === 'zh' ? '创建公众号失败' : 'Failed to create account'
      );
    } finally {
      setSubmitting(false);
    }
  }

  const handleUpdateAccount = async () => {
    if (!editingAccount || !formData.name.trim()) {
      Alert.alert(
        lang === 'zh' ? '提示' : 'Tip',
        lang === 'zh' ? '请输入公众号名称' : 'Please enter account name'
      );
      return;
    }

    try {
      setSubmitting(true);
      await updateAccount(editingAccount.id, {
        name: formData.name,
        description: formData.description,
        avatar: formData.avatar,
        cover_image: formData.cover_image,
      });
      Alert.alert(
        lang === 'zh' ? '成功' : 'Success',
        lang === 'zh' ? '公众号更新成功' : 'Account updated successfully'
      );
      setEditingAccount(null);
      setFormData({ name: '', description: '', avatar: '', cover_image: '' });
      fetchAccounts();
    } catch (error) {
      console.error('Error updating account:', error);
      Alert.alert(
        lang === 'zh' ? '错误' : 'Error',
        lang === 'zh' ? '更新公众号失败' : 'Failed to update account'
      );
    } finally {
      setSubmitting(false);
    }
  }

  const handleDeleteAccount = (accountId: string, accountName: string) => {
    Alert.alert(
      lang === 'zh' ? '确认删除' : 'Confirm Delete',
      `${lang === 'zh' ? '确定要删除公众号' : 'Are you sure you want to delete account'} "${accountName}"?`,
      [
        { text: lang === 'zh' ? '取消' : 'Cancel', style: 'cancel' },
        {
          text: lang === 'zh' ? '删除' : 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccount(accountId);
              Alert.alert(
                lang === 'zh' ? '成功' : 'Success',
                lang === 'zh' ? '公众号删除成功' : 'Account deleted successfully'
              );
              fetchAccounts();
            } catch (error) {
              console.error('Error deleting account:', error);
              Alert.alert(
                lang === 'zh' ? '错误' : 'Error',
                lang === 'zh' ? '删除公众号失败' : 'Failed to delete account'
              );
            }
          },
        },
      ]
    );
  }

  const openEditModal = (account: OfficialAccount) => {
    setEditingAccount(account);
    setFormData({
      name: account.name,
      description: account.description || '',
      avatar: account.avatar || '',
      cover_image: account.cover_image || '',
    });
  }

  const renderAccountItem = (account: OfficialAccount) => (
    <View key={account.id} style={styles.accountItem}>
      <View style={styles.accountHeader}>
        <View style={styles.accountInfo}>
          <View style={styles.avatarContainer}>
            {account.avatar ? (
              <Image source={{ uri: account.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {account.name.charAt(0)}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.accountDetails}>
            <Text style={styles.accountName}>{account.name}</Text>
            {account.description && (
              <Text style={styles.accountDescription}>{account.description}</Text>
            )}
            <Text style={styles.accountDate}>
              {lang === 'zh' ? '创建于' : 'Created on'} {new Date(account.created_at).toLocaleDateString()}
            </Text>
          </View>
        </View>
        <View style={styles.accountActions}>
          <Pressable 
            onPress={() => openEditModal(account)}
            style={styles.actionButton}
          >
            <Text style={styles.actionButtonText}>{lang === 'zh' ? '编辑' : 'Edit'}</Text>
          </Pressable>
          <Pressable 
            onPress={() => handleDeleteAccount(account.id, account.name)}
            style={[styles.actionButton, styles.deleteButton]}
          >
            <Text style={[styles.actionButtonText, styles.deleteButtonText]}>{lang === 'zh' ? '删除' : 'Delete'}</Text>
          </Pressable>
        </View>
      </View>
      {/* 这里可以添加该公众号的文章列表预览 */}
    </View>
  )

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <ActivityIndicator size="large" color="#576b95" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 顶部导航栏 */}
      <View style={styles.header}>
        <Pressable onPress={onClose} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>
          {lang === 'zh' ? '公众号管理' : 'Account Management'}
        </Text>
        <Pressable 
          onPress={() => setShowCreateModal(true)}
          style={styles.addButton}
        >
          <Text style={styles.addButtonText}>+</Text>
        </Pressable>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={['#576b95']} 
            tintColor="#576b95"
          />
        }
      >
        {accounts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {lang === 'zh' ? '您还没有创建公众号' : 'You haven\'t created any accounts yet'}
            </Text>
            <Pressable 
              onPress={() => setShowCreateModal(true)}
              style={styles.createFirstButton}
            >
              <Text style={styles.createFirstButtonText}>
                {lang === 'zh' ? '创建第一个公众号' : 'Create your first account'}
              </Text>
            </Pressable>
          </View>
        ) : (
          accounts.map(renderAccountItem)
        )}
      </ScrollView>

      {/* 创建/编辑公众号的模态框 */}
      <Modal
        visible={showCreateModal || editingAccount !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowCreateModal(false);
          setEditingAccount(null);
          setFormData({ name: '', description: '', avatar: '', cover_image: '' });
        }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editingAccount ? (lang === 'zh' ? '编辑公众号' : 'Edit Account') : (lang === 'zh' ? '创建公众号' : 'Create Account')}
                </Text>
                <Pressable 
                  onPress={() => {
                    setShowCreateModal(false);
                    setEditingAccount(null);
                    setFormData({ name: '', description: '', avatar: '', cover_image: '' });
                  }}
                  style={styles.modalCloseButton}
                >
                  <Text style={styles.modalCloseText}>×</Text>
                </Pressable>
              </View>

              <ScrollView style={styles.modalBody}>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>
                    {lang === 'zh' ? '公众号名称' : 'Account Name'} *
                  </Text>
                  <TextInput
                    style={styles.formInput}
                    value={formData.name}
                    onChangeText={(text) => setFormData({ ...formData, name: text })}
                    placeholder={lang === 'zh' ? '请输入公众号名称' : 'Enter account name'}
                    placeholderTextColor="#999"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>
                    {lang === 'zh' ? '公众号描述' : 'Account Description'}
                  </Text>
                  <TextInput
                    style={[styles.formInput, styles.textArea]}
                    value={formData.description}
                    onChangeText={(text) => setFormData({ ...formData, description: text })}
                    placeholder={lang === 'zh' ? '请输入公众号描述' : 'Enter account description'}
                    placeholderTextColor="#999"
                    multiline
                    numberOfLines={3}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>
                    {lang === 'zh' ? '头像URL' : 'Avatar URL'}
                  </Text>
                  <TextInput
                    style={styles.formInput}
                    value={formData.avatar}
                    onChangeText={(text) => setFormData({ ...formData, avatar: text })}
                    placeholder={lang === 'zh' ? '请输入头像URL' : 'Enter avatar URL'}
                    placeholderTextColor="#999"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>
                    {lang === 'zh' ? '封面图URL' : 'Cover Image URL'}
                  </Text>
                  <TextInput
                    style={styles.formInput}
                    value={formData.cover_image}
                    onChangeText={(text) => setFormData({ ...formData, cover_image: text })}
                    placeholder={lang === 'zh' ? '请输入封面图URL' : 'Enter cover image URL'}
                    placeholderTextColor="#999"
                  />
                </View>
              </ScrollView>

              <View style={styles.modalFooter}>
                <Pressable 
                  onPress={() => {
                    setShowCreateModal(false);
                    setEditingAccount(null);
                    setFormData({ name: '', description: '', avatar: '', cover_image: '' });
                  }}
                  style={[styles.modalButton, styles.cancelButton]}
                >
                  <Text style={styles.cancelButtonText}>
                    {lang === 'zh' ? '取消' : 'Cancel'}
                  </Text>
                </Pressable>
                <Pressable 
                  onPress={editingAccount ? handleUpdateAccount : handleCreateAccount}
                  disabled={submitting}
                  style={[styles.modalButton, styles.submitButton]}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.submitButtonText}>
                      {editingAccount ? (lang === 'zh' ? '保存' : 'Save') : (lang === 'zh' ? '创建' : 'Create')}
                    </Text>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  )
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 4,
  },
  backText: {
    fontSize: 24,
    color: '#333',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  addButton: {
    padding: 4,
  },
  addButtonText: {
    fontSize: 24,
    color: '#576b95',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginBottom: 20,
    textAlign: 'center',
  },
  createFirstButton: {
    backgroundColor: '#576b95',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  createFirstButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  accountItem: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  accountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  accountInfo: {
    flexDirection: 'row',
    flex: 1,
    marginRight: 16,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#576b95',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '600',
  },
  accountDetails: {
    flex: 1,
  },
  accountName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  accountDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  accountDate: {
    fontSize: 12,
    color: '#999',
  },
  accountActions: {
    flexDirection: 'column',
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#576b95',
  },
  actionButtonText: {
    color: '#576b95',
    fontSize: 12,
    fontWeight: '500',
  },
  deleteButton: {
    borderColor: '#ff4444',
  },
  deleteButtonText: {
    color: '#ff4444',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 8,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalCloseText: {
    fontSize: 24,
    color: '#999',
  },
  modalBody: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#333',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  modalButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 4,
    marginLeft: 12,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#576b95',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
};
