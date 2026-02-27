import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Modal } from 'react-native'
import { useState, useEffect } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { supabase } from '../lib/supabase'

interface FundCompanyProfile {
  id: string
  company_name: string
  license_number: string | null
  contact_person: string | null
  contact_phone: string
  company_email: string | null
  company_address: string | null
  company_description: string | null
  aum: number | null
  status: 'active' | 'inactive' | 'suspended'
  created_at: string
}

export default function FundCompanyManagementScreen({ onBack, userInfo }: { onBack: () => void; userInfo?: any }) {
  const insets = useSafeAreaInsets()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [companies, setCompanies] = useState<FundCompanyProfile[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingCompany, setEditingCompany] = useState<FundCompanyProfile | null>(null)
  
  // 表单数据
  const [formData, setFormData] = useState({
    company_name: '',
    license_number: '',
    contact_person: '',
    contact_phone: '',
    company_email: '',
    company_address: '',
    company_description: '',
    aum: '',
  })

  // 获取基金公司列表
  useEffect(() => {
    fetchCompanies()
  }, [])

  const fetchCompanies = async () => {
    try {
      setLoading(true)
      
      // 根据用户ID查找关联的基金公司
      const { data, error } = await supabase
        .from('fund_company_profiles')
        .select('*')
        .eq('user_id', userInfo?.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('获取基金公司列表失败:', error)
      }

      setCompanies(data || [])
    } catch (error) {
      console.error('获取基金公司列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingCompany(null)
    setFormData({
      company_name: '',
      license_number: '',
      contact_person: '',
      contact_phone: userInfo?.phone || '',
      company_email: '',
      company_address: '',
      company_description: '',
      aum: '',
    })
    setShowForm(true)
  }

  const handleEdit = (company: FundCompanyProfile) => {
    setEditingCompany(company)
    setFormData({
      company_name: company.company_name || '',
      license_number: company.license_number || '',
      contact_person: company.contact_person || '',
      contact_phone: company.contact_phone || '',
      company_email: company.company_email || '',
      company_address: company.company_address || '',
      company_description: company.company_description || '',
      aum: company.aum ? company.aum.toString() : '',
    })
    setShowForm(true)
  }

  const handleDelete = (company: FundCompanyProfile) => {
    Alert.alert(
      '确认删除',
      `确定要删除基金公司 "${company.company_name}" 吗？此操作不可恢复。`,
      [
        { text: '取消', style: 'cancel' },
        { 
          text: '删除', 
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('fund_company_profiles')
                .delete()
                .eq('id', company.id)

              if (error) throw error
              Alert.alert('成功', '基金公司删除成功')
              fetchCompanies()
            } catch (error: any) {
              console.error('删除失败:', error)
              Alert.alert('错误', error.message || '删除失败，请重试')
            }
          }
        }
      ]
    )
  }

  const handleSave = async () => {
    if (!formData.company_name.trim()) {
      Alert.alert('提示', '请输入公司名称')
      return
    }

    try {
      setSaving(true)
      
      const saveData = {
        company_name: formData.company_name.trim(),
        license_number: formData.license_number?.trim() || null,
        contact_person: formData.contact_person?.trim() || null,
        contact_phone: formData.contact_phone?.trim() || userInfo?.phone,
        company_email: formData.company_email?.trim() || null,
        company_address: formData.company_address?.trim() || null,
        company_description: formData.company_description?.trim() || null,
        aum: formData.aum ? parseFloat(formData.aum) : null,
        user_id: userInfo?.id,
        status: 'active',
      }

      if (editingCompany) {
        // 更新
        const { error } = await supabase
          .from('fund_company_profiles')
          .update(saveData)
          .eq('id', editingCompany.id)

        if (error) throw error
        Alert.alert('成功', '基金公司信息更新成功')
      } else {
        // 新建
        const { error } = await supabase
          .from('fund_company_profiles')
          .insert(saveData)

        if (error) throw error
        Alert.alert('成功', '基金公司创建成功')
      }

      setShowForm(false)
      fetchCompanies()
    } catch (error: any) {
      console.error('保存失败:', error)
      Alert.alert('错误', error.message || '保存失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#4CAF50'
      case 'inactive': return '#F44336'
      case 'suspended': return '#FF9800'
      default: return '#999'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return '活跃'
      case 'inactive': return '禁用'
      case 'suspended': return '暂停'
      default: return status
    }
  }

  const renderCompanyCard = (company: FundCompanyProfile) => (
    <View key={company.id} style={styles.companyCard}>
      <View style={styles.companyHeader}>
        <View style={styles.companyTitleSection}>
          <Text style={styles.companyName}>{company.company_name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(company.status) }]}>
            <Text style={styles.statusText}>{getStatusText(company.status)}</Text>
          </View>
        </View>
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => handleEdit(company)}
          >
            <Ionicons name="create-outline" size={20} color="#1A4EA2" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => handleDelete(company)}
          >
            <Ionicons name="trash-outline" size={20} color="#F44336" />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.companyInfo}>
        {company.license_number && (
          <Text style={styles.infoText}>执照编号: {company.license_number}</Text>
        )}
        {company.contact_person && (
          <Text style={styles.infoText}>联系人: {company.contact_person}</Text>
        )}
        <Text style={styles.infoText}>电话: {company.contact_phone}</Text>
        {company.company_email && (
          <Text style={styles.infoText}>邮箱: {company.company_email}</Text>
        )}
        {company.aum && (
          <Text style={styles.infoText}>管理规模: ¥{company.aum.toLocaleString()}</Text>
        )}
      </View>
      
      <Text style={styles.createTime}>
        创建时间: {new Date(company.created_at).toLocaleDateString()}
      </Text>
    </View>
  )

  const renderForm = () => (
    <Modal
      visible={showForm}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowForm(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingCompany ? '编辑基金公司' : '创建基金公司'}
            </Text>
            <TouchableOpacity onPress={() => setShowForm(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.formField}>
              <Text style={styles.formLabel}>公司名称 *</Text>
              <TextInput
                style={styles.formInput}
                value={formData.company_name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, company_name: text }))}
                placeholder="请输入公司名称"
              />
            </View>
            
            <View style={styles.formField}>
              <Text style={styles.formLabel}>执照编号</Text>
              <TextInput
                style={styles.formInput}
                value={formData.license_number}
                onChangeText={(text) => setFormData(prev => ({ ...prev, license_number: text }))}
                placeholder="请输入执照编号"
              />
            </View>
            
            <View style={styles.formField}>
              <Text style={styles.formLabel}>联系人姓名</Text>
              <TextInput
                style={styles.formInput}
                value={formData.contact_person}
                onChangeText={(text) => setFormData(prev => ({ ...prev, contact_person: text }))}
                placeholder="请输入联系人姓名"
              />
            </View>
            
            <View style={styles.formField}>
              <Text style={styles.formLabel}>联系电话</Text>
              <TextInput
                style={styles.formInput}
                value={formData.contact_phone}
                onChangeText={(text) => setFormData(prev => ({ ...prev, contact_phone: text }))}
                placeholder="请输入联系电话"
                keyboardType="phone-pad"
              />
            </View>
            
            <View style={styles.formField}>
              <Text style={styles.formLabel}>公司邮箱</Text>
              <TextInput
                style={styles.formInput}
                value={formData.company_email}
                onChangeText={(text) => setFormData(prev => ({ ...prev, company_email: text }))}
                placeholder="请输入公司邮箱"
                keyboardType="email-address"
              />
            </View>
            
            <View style={styles.formField}>
              <Text style={styles.formLabel}>公司地址</Text>
              <TextInput
                style={styles.formInput}
                value={formData.company_address}
                onChangeText={(text) => setFormData(prev => ({ ...prev, company_address: text }))}
                placeholder="请输入公司地址"
              />
            </View>
            
            <View style={styles.formField}>
              <Text style={styles.formLabel}>管理规模(AUM)</Text>
              <TextInput
                style={styles.formInput}
                value={formData.aum}
                onChangeText={(text) => setFormData(prev => ({ ...prev, aum: text }))}
                placeholder="请输入管理资产规模（万元）"
                keyboardType="numeric"
              />
            </View>
            
            <View style={styles.formField}>
              <Text style={styles.formLabel}>公司简介</Text>
              <TextInput
                style={[styles.formInput, styles.textArea]}
                value={formData.company_description}
                onChangeText={(text) => setFormData(prev => ({ ...prev, company_description: text }))}
                placeholder="请输入公司简介"
                multiline
                numberOfLines={4}
              />
            </View>
          </ScrollView>
          
          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={styles.cancelBtn}
              onPress={() => setShowForm(false)}
            >
              <Text style={styles.cancelBtnText}>取消</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.saveBtn}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>保存</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )

  if (loading) {
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
        <Text style={styles.headerTitle}>基金公司管理</Text>
        <TouchableOpacity 
          style={styles.createButton}
          onPress={handleCreate}
        >
          <Ionicons name="add" size={24} color="#1A4EA2" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {companies.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="business-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>暂无基金公司</Text>
            <Text style={styles.emptySubText}>点击右上角 + 按钮创建</Text>
          </View>
        ) : (
          <View style={styles.companiesList}>
            {companies.map(renderCompanyCard)}
          </View>
        )}
      </ScrollView>

      {/* 表单弹窗 */}
      {renderForm()}
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
  createButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  companiesList: {
    gap: 12,
  },
  companyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  companyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  companyTitleSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  companyName: {
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
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 6,
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
  },
  companyInfo: {
    gap: 6,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
  },
  createTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 12,
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
    maxHeight: '90%',
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
  formContainer: {
    padding: 16,
  },
  formField: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    color: '#333',
    marginBottom: 6,
    fontWeight: '500',
  },
  formInput: {
    fontSize: 15,
    color: '#333',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#1A4EA2',
    borderRadius: 8,
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
})
