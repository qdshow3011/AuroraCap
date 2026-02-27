import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Modal, FlatList } from 'react-native'
import { useState, useEffect } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { supabase } from '../lib/supabase'

interface Customer {
  id: string
  customer_number: string
  name: string | null
  email: string | null
  phone: string | null
  id_number: string | null
  status: 'active' | 'inactive'
  created_at: string
  role: string
}

interface EditFormData {
  name: string
  phone: string
  email: string
  id_number: string
  status: 'active' | 'inactive'
}

export default function CustomerListScreen({ onBack, userInfo }: { onBack: () => void; userInfo?: any }) {
  const insets = useSafeAreaInsets()
  const [loading, setLoading] = useState(true)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [searchText, setSearchText] = useState('')
  const [showDetail, setShowDetail] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editFormData, setEditFormData] = useState<EditFormData>({
    name: '',
    phone: '',
    email: '',
    id_number: '',
    status: 'active'
  })

  // 获取客户列表
  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('users')
        .select('id, customer_number, name, email, phone, id_number, status, created_at, role')
        .eq('role', 'customer')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('获取客户列表失败:', error)
      }

      setCustomers(data || [])
    } catch (error) {
      console.error('获取客户列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 搜索过滤
  const filteredCustomers = customers.filter(customer => {
    if (!searchText) return true
    const searchLower = searchText.toLowerCase()
    return (
      customer.name?.toLowerCase().includes(searchLower) ||
      customer.phone?.toLowerCase().includes(searchLower) ||
      customer.email?.toLowerCase().includes(searchLower) ||
      customer.customer_number?.toLowerCase().includes(searchLower)
    )
  })

  const handleViewDetail = (customer: Customer) => {
    setSelectedCustomer(customer)
    setShowDetail(true)
    setIsEditing(false)
  }

  const handleEdit = () => {
    if (selectedCustomer) {
      setEditFormData({
        name: selectedCustomer.name || '',
        phone: selectedCustomer.phone || '',
        email: selectedCustomer.email || '',
        id_number: selectedCustomer.id_number || '',
        status: selectedCustomer.status
      })
      setIsEditing(true)
    }
  }

  const handleSaveEdit = async () => {
    if (!selectedCustomer) return

    try {
      setLoading(true)
      const { error } = await supabase
        .from('users')
        .update({
          name: editFormData.name,
          phone: editFormData.phone,
          email: editFormData.email,
          id_number: editFormData.id_number,
          status: editFormData.status
        })
        .eq('id', selectedCustomer.id)

      if (error) {
        console.error('保存客户信息失败:', error)
        Alert.alert('错误', '保存客户信息失败，请重试')
        return
      }

      Alert.alert('成功', '客户信息已更新')
      setIsEditing(false)
      fetchCustomers()
      
      // 更新选中的客户数据
      setSelectedCustomer({
        ...selectedCustomer,
        name: editFormData.name,
        phone: editFormData.phone,
        email: editFormData.email,
        id_number: editFormData.id_number,
        status: editFormData.status
      })
    } catch (error) {
      console.error('保存客户信息失败:', error)
      Alert.alert('错误', '保存客户信息失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
  }

  const getStatusColor = (status: string) => {
    return status === 'active' ? '#4CAF50' : '#F44336'
  }

  const getStatusText = (status: string) => {
    return status === 'active' ? '活跃' : '禁用'
  }

  const renderCustomerCard = ({ item }: { item: Customer }) => (
    <TouchableOpacity 
      style={styles.customerCard}
      onPress={() => handleViewDetail(item)}
    >
      <View style={styles.customerHeader}>
        <View style={styles.customerTitleSection}>
          <Text style={styles.customerName}>{item.name || '未命名客户'}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#999" />
      </View>
      
      <View style={styles.customerInfo}>
        <Text style={styles.infoText}>客户编号: {item.customer_number}</Text>
        {item.phone && <Text style={styles.infoText}>电话: {item.phone}</Text>}
        {item.email && <Text style={styles.infoText}>邮箱: {item.email}</Text>}
      </View>
      
      <Text style={styles.createTime}>
        注册时间: {new Date(item.created_at).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  )

  const renderDetailModal = () => (
    <Modal
      visible={showDetail}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowDetail(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {isEditing ? '编辑客户' : '客户详情'}
            </Text>
            <TouchableOpacity onPress={() => setShowDetail(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.detailContainer} showsVerticalScrollIndicator={false}>
            {selectedCustomer && (
              <>
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>客户编号</Text>
                  <Text style={styles.detailValue}>{selectedCustomer.customer_number}</Text>
                </View>
                
                {isEditing ? (
                  <>
                    <View style={styles.detailSection}>
                      <Text style={styles.detailLabel}>姓名</Text>
                      <TextInput
                        style={styles.editInput}
                        value={editFormData.name}
                        onChangeText={(text) => setEditFormData({ ...editFormData, name: text })}
                        placeholder="请输入姓名"
                      />
                    </View>
                    
                    <View style={styles.detailSection}>
                      <Text style={styles.detailLabel}>电话</Text>
                      <TextInput
                        style={styles.editInput}
                        value={editFormData.phone}
                        onChangeText={(text) => setEditFormData({ ...editFormData, phone: text })}
                        placeholder="请输入电话"
                        keyboardType="phone-pad"
                      />
                    </View>
                    
                    <View style={styles.detailSection}>
                      <Text style={styles.detailLabel}>邮箱</Text>
                      <TextInput
                        style={styles.editInput}
                        value={editFormData.email}
                        onChangeText={(text) => setEditFormData({ ...editFormData, email: text })}
                        placeholder="请输入邮箱"
                        keyboardType="email-address"
                        autoCapitalize="none"
                      />
                    </View>
                    
                    <View style={styles.detailSection}>
                      <Text style={styles.detailLabel}>身份证号</Text>
                      <TextInput
                        style={styles.editInput}
                        value={editFormData.id_number}
                        onChangeText={(text) => setEditFormData({ ...editFormData, id_number: text })}
                        placeholder="请输入身份证号"
                      />
                    </View>
                    
                    <View style={styles.detailSection}>
                      <Text style={styles.detailLabel}>状态</Text>
                      <View style={styles.statusButtonContainer}>
                        <TouchableOpacity
                          style={[
                            styles.statusButton,
                            editFormData.status === 'active' && styles.statusButtonActive
                          ]}
                          onPress={() => setEditFormData({ ...editFormData, status: 'active' })}
                        >
                          <Text style={[
                            styles.statusButtonText,
                            editFormData.status === 'active' && styles.statusButtonTextActive
                          ]}>活跃</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.statusButton,
                            editFormData.status === 'inactive' && styles.statusButtonInactive
                          ]}
                          onPress={() => setEditFormData({ ...editFormData, status: 'inactive' })}
                        >
                          <Text style={[
                            styles.statusButtonText,
                            editFormData.status === 'inactive' && styles.statusButtonTextInactive
                          ]}>禁用</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </>
                ) : (
                  <>
                    <View style={styles.detailSection}>
                      <Text style={styles.detailLabel}>姓名</Text>
                      <Text style={styles.detailValue}>{selectedCustomer.name || '未设置'}</Text>
                    </View>
                    
                    <View style={styles.detailSection}>
                      <Text style={styles.detailLabel}>电话</Text>
                      <Text style={styles.detailValue}>{selectedCustomer.phone || '未设置'}</Text>
                    </View>
                    
                    <View style={styles.detailSection}>
                      <Text style={styles.detailLabel}>邮箱</Text>
                      <Text style={styles.detailValue}>{selectedCustomer.email || '未设置'}</Text>
                    </View>
                    
                    <View style={styles.detailSection}>
                      <Text style={styles.detailLabel}>身份证号</Text>
                      <Text style={styles.detailValue}>{selectedCustomer.id_number || '未设置'}</Text>
                    </View>
                    
                    <View style={styles.detailSection}>
                      <Text style={styles.detailLabel}>状态</Text>
                      <View style={[styles.statusBadgeLarge, { backgroundColor: getStatusColor(selectedCustomer.status) }]}>
                        <Text style={styles.statusTextLarge}>{getStatusText(selectedCustomer.status)}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.detailSection}>
                      <Text style={styles.detailLabel}>注册时间</Text>
                      <Text style={styles.detailValue}>
                        {new Date(selectedCustomer.created_at).toLocaleString()}
                      </Text>
                    </View>
                  </>
                )}
              </>
            )}
          </ScrollView>
          
          {isEditing ? (
            <View style={styles.editButtonContainer}>
              <TouchableOpacity 
                style={[styles.editActionButton, styles.cancelButton]}
                onPress={handleCancelEdit}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.editActionButton, styles.saveButton]}
                onPress={handleSaveEdit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>保存</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={styles.editButton}
                onPress={handleEdit}
              >
                <Ionicons name="create-outline" size={18} color="#fff" />
                <Text style={styles.editButtonText}>编辑</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowDetail(false)}
              >
                <Text style={styles.closeButtonText}>关闭</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  )

  if (loading && customers.length === 0) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#1A4EA2" />
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    )
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* 头部导航 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>客户列表</Text>
        <View style={styles.placeholder} />
      </View>

      {/* 搜索框 */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="搜索客户姓名、电话或编号"
          value={searchText}
          onChangeText={setSearchText}
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => setSearchText('')}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {/* 统计信息 */}
      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>
          共 {filteredCustomers.length} 位客户
        </Text>
      </View>

      {/* 客户列表 */}
      <FlatList
        data={filteredCustomers}
        renderItem={renderCustomerCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>暂无客户</Text>
          </View>
        }
      />

      {/* 详情弹窗 */}
      {renderDetailModal()}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
  },
  statsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  statsText: {
    fontSize: 14,
    color: '#666',
  },
  listContainer: {
    padding: 16,
    paddingTop: 0,
    gap: 12,
  },
  customerCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  customerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  customerTitleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '500',
  },
  customerInfo: {
    gap: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
  },
  createTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  // 弹窗样式
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  detailContainer: {
    padding: 16,
  },
  detailSection: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  statusBadgeLarge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusTextLarge: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  editInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#f9f9f9',
  },
  statusButtonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statusButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  statusButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  statusButtonInactive: {
    backgroundColor: '#F44336',
    borderColor: '#F44336',
  },
  statusButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  statusButtonTextActive: {
    color: '#fff',
  },
  statusButtonTextInactive: {
    color: '#fff',
  },
  buttonContainer: {
    padding: 16,
    gap: 12,
  },
  editButton: {
    backgroundColor: '#FF9800',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  editButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  closeButton: {
    backgroundColor: '#1A4EA2',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  editButtonContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  editActionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  saveButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
})
