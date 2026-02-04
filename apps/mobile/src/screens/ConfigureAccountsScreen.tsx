import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Pressable, Alert, ActivityIndicator, Image } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { supabase } from '../lib/supabase'

interface ConfigureAccountsScreenProps {
  onClose?: () => void
  lang?: 'zh' | 'en'
  userInfo?: any
}

export default function ConfigureAccountsScreen({ onClose, lang = 'zh', userInfo }: ConfigureAccountsScreenProps) {
  const [accounts, setAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [editingAccount, setEditingAccount] = useState<any>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [avatar, setAvatar] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // 语言翻译
  const t = lang === 'zh' ? {
    title: '配置公众号',
    accountName: '公众号名称',
    accountDescription: '公众号描述',
    accountAvatar: '上传公众号头像',
    addAccount: '添加公众号',
    editAccount: '编辑公众号',
    deleteAccount: '删除公众号',
    save: '保存',
    cancel: '取消',
    success: '操作成功',
    error: '操作失败',
    pleaseFill: '请填写',
    loading: '加载中...',
    confirmDelete: '确定要删除这个公众号吗？',
    noAccounts: '暂无公众号，点击下方按钮添加',
    uploadImage: '上传图片',
    chooseImage: '选择图片',
    takePhoto: '拍摄照片',
  } : {
    title: 'Configure Accounts',
    accountName: 'Account Name',
    accountDescription: 'Account Description',
    accountAvatar: 'Upload Account Avatar',
    addAccount: 'Add Account',
    editAccount: 'Edit Account',
    deleteAccount: 'Delete Account',
    save: 'Save',
    cancel: 'Cancel',
    success: 'Operation successful',
    error: 'Operation failed',
    pleaseFill: 'Please fill in',
    loading: 'Loading...',
    confirmDelete: 'Are you sure you want to delete this account?',
    noAccounts: 'No accounts yet, click the button below to add',
    uploadImage: 'Upload Image',
    chooseImage: 'Choose Image',
    takePhoto: 'Take Photo',
  }

  // 检查用户权限
  const hasPermission = () => {
    if (!userInfo) return false
    const allowedRoles = ['admin', 'waiter', 'partner']
    return allowedRoles.includes(userInfo.role)
  }

  // 获取公众号列表
  const fetchAccounts = async () => {
    if (!supabase) return
    if (!hasPermission()) {
      setAccounts([])
      setLoading(false)
      return
    }
    
    try {
      setLoading(true)
      let query = supabase
        .from('wechat_official_accounts')
        .select('*')
        .order('created_at', { ascending: false })
      
      // 合伙人只能看到自己设置的公众号
      if (userInfo?.role === 'partner') {
        query = query.eq('created_by', userInfo.id)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      setAccounts(data || [])
    } catch (error) {
      console.error('Error fetching accounts:', error)
      setAccounts([])
    } finally {
      setLoading(false)
    }
  }

  // 初始加载公众号列表
  useEffect(() => {
    fetchAccounts()
    requestPermission()
  }, [])

  // 请求相机权限
  const requestPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('权限被拒绝', '需要相册权限才能上传图片')
    }
  }

  // 选择图片
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    })

    if (!result.canceled && result.assets && result.assets.length > 0) {
      await uploadImage(result.assets[0].uri)
    }
  }

  // 拍摄照片
  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('权限被拒绝', '需要相机权限才能拍摄照片')
      return
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    })

    if (!result.canceled && result.assets && result.assets.length > 0) {
      await uploadImage(result.assets[0].uri)
    }
  }

  // 上传图片到Supabase存储
  const uploadImage = async (uri: string) => {
    try {
      setSubmitting(true)
      
      const fileName = `account-avatar-${Date.now()}.jpg`
      const { data, error } = await supabase
        .storage
        .from('account-avatars')
        .upload(fileName, {
          uri,
          type: 'image/jpeg',
          cacheControl: '3600',
        })

      if (error) throw error

      // 获取公共URL
      const { data: urlData } = supabase
        .storage
        .from('account-avatars')
        .getPublicUrl(fileName)

      if (urlData.publicUrl) {
        setAvatar(urlData.publicUrl)
        Alert.alert('成功', '图片上传成功')
      }
    } catch (error) {
      console.error('上传图片失败:', error)
      Alert.alert('错误', '图片上传失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  // 显示图片选择选项
  const showImageOptions = () => {
    Alert.alert(
      t.uploadImage,
      t.accountAvatar,
      [
        { text: t.chooseImage, onPress: pickImage },
        { text: t.takePhoto, onPress: takePhoto },
        { text: t.cancel, style: 'cancel' },
      ]
    )
  }

  // 开始编辑或添加公众号
  const startEdit = (account?: any) => {
    if (account) {
      setEditingAccount(account)
      setName(account.name)
      setDescription(account.description || '')
      setAvatar(account.avatar || '')
    } else {
      setEditingAccount(null)
      setName('')
      setDescription('')
      setAvatar('')
    }
  }

  // 保存公众号
  const saveAccount = async () => {
    if (!name.trim()) {
      Alert.alert(t.error, `${t.pleaseFill} ${t.accountName}`)
      return
    }

    if (!userInfo) {
        Alert.alert(t.error, '请先登录')
        return
      }

      // 检查权限
      if (!hasPermission()) {
        Alert.alert(t.error, '您没有权限执行此操作')
        return
      }

      try {
        setSubmitting(true)
        
        if (!supabase) {
          throw new Error('Supabase client not initialized')
        }

        let result
        if (editingAccount) {
          // 更新现有公众号
          result = await supabase
            .from('wechat_official_accounts')
            .update({
              name: name.trim(),
              description: description.trim(),
              avatar: avatar.trim(),
            })
            .eq('id', editingAccount.id)
            .select()
            .single()
        } else {
          // 创建新公众号
          result = await supabase
            .from('wechat_official_accounts')
            .insert({
              name: name.trim(),
              description: description.trim(),
              avatar: avatar.trim(),
              status: 'active',
              created_by: userInfo.id,
            })
            .select()
            .single()
        }

      if (result.error) throw result.error

      Alert.alert(t.success, t.success)
      startEdit() // 重置表单
      fetchAccounts() // 重新加载列表
    } catch (error: any) {
      console.error('Error saving account:', error)
      Alert.alert(t.error, error.message || t.error)
    } finally {
      setSubmitting(false)
    }
  }

  // 删除公众号
  const deleteAccount = async (account: any) => {
    // 检查权限
    if (!hasPermission()) {
      Alert.alert(t.error, '您没有权限执行此操作')
      return
    }

    // 合伙人只能删除自己创建的公众号
    if (userInfo?.role === 'partner' && account.created_by !== userInfo.id) {
      Alert.alert(t.error, '您只能删除自己创建的公众号')
      return
    }

    Alert.alert(
      t.deleteAccount,
      t.confirmDelete,
      [
        { text: t.cancel, style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!supabase) return
            
            try {
              setSubmitting(true)
              const { error } = await supabase
                .from('wechat_official_accounts')
                .delete()
                .eq('id', account.id)
              
              if (error) throw error
              
              Alert.alert(t.success, t.success)
              fetchAccounts() // 重新加载列表
            } catch (error: any) {
              console.error('Error deleting account:', error)
              Alert.alert(t.error, error.message || t.error)
            } finally {
              setSubmitting(false)
            }
          },
        },
      ]
    )
  }

  return (
    <View style={styles.container}>
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.title}</Text>
        <View style={styles.headerButton} />
      </View>

      {/* 检查权限 */}
      {!hasPermission() ? (
        <View style={styles.permissionDenied}>
          <Ionicons name="lock-closed-outline" size={64} color="#999" />
          <Text style={styles.permissionDeniedText}>您没有权限使用此功能</Text>
          <Text style={styles.permissionDeniedSubtext}>只有管理员、服务员和合伙人可以配置公众号</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollView}>
          {/* 公众号列表 */}
          <View style={styles.accountsList}>
            <Text style={styles.sectionTitle}>{t.title}</Text>
            {loading ? (
              <ActivityIndicator size="large" color="#333" style={styles.loading} />
            ) : accounts.length === 0 ? (
              <Text style={styles.emptyText}>{t.noAccounts}</Text>
            ) : (
              accounts.map(account => (
                <Pressable key={account.id} style={styles.accountCard}>
                  <View style={styles.accountInfo}>
                    <View style={[styles.accountAvatar, { backgroundColor: '#4CAF50' }]}>
                      <Text style={styles.avatarText}>{account.name.charAt(0)}</Text>
                    </View>
                    <View style={styles.accountDetails}>
                      <Text style={styles.accountName}>{account.name}</Text>
                      <Text style={styles.accountDesc} numberOfLines={2}>
                        {account.description || t.accountDescription}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.accountActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => startEdit(account)}
                    >
                      <Ionicons name="create-outline" size={20} color="#4CAF50" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => deleteAccount(account)}
                    >
                      <Ionicons name="trash-outline" size={20} color="#FF4444" />
                    </TouchableOpacity>
                  </View>
                </Pressable>
              ))
            )}
          </View>

          {/* 编辑表单 */}
          <View style={styles.form}>
            <Text style={styles.sectionTitle}>
              {editingAccount ? t.editAccount : t.addAccount}
            </Text>
            <View style={styles.formGroup}>
              <Text style={styles.label}>{t.accountName}</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder={t.accountName}
                placeholderTextColor="#999"
                maxLength={50}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>{t.accountDescription}</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder={t.accountDescription}
                placeholderTextColor="#999"
                multiline
                numberOfLines={3}
                maxLength={200}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>{t.accountAvatar}</Text>
              <TouchableOpacity onPress={showImageOptions} disabled={submitting}>
                {avatar ? (
                  <View style={styles.avatarPreviewContainer}>
                    <Image source={{ uri: avatar }} style={styles.avatarPreview} />
                    <View style={styles.avatarOverlay}>
                      <Ionicons name="camera" size={24} color="#fff" />
                      <Text style={styles.avatarOverlayText}>更换头像</Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.avatarUploadButton}>
                    {submitting ? (
                      <ActivityIndicator size="small" color="#4CAF50" />
                    ) : (
                      <>
                        <Ionicons name="camera-outline" size={32} color="#999" />
                        <Text style={styles.avatarUploadText}>点击上传头像</Text>
                      </>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            </View>



            <View style={styles.formButtons}>
              <TouchableOpacity
                style={[styles.button, styles.saveButton, submitting && styles.buttonDisabled]}
                onPress={saveAccount}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>{t.save}</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => startEdit()}
                disabled={submitting}
              >
                <Text style={styles.cancelButtonText}>{t.cancel}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  )
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
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  scrollView: {
    flex: 1,
  },
  accountsList: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  loading: {
    padding: 40,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    padding: 40,
  },
  accountCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  accountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  accountAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  accountDetails: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  accountDesc: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  accountActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 8,
  },
  form: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  permissionDenied: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  permissionDeniedText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  permissionDeniedSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  avatarPreviewContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  avatarPreview: {
    width: '100%',
    height: '100%',
  },
  avatarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarOverlayText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 8,
    fontWeight: '500',
  },
  avatarUploadButton: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  avatarUploadText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
})
