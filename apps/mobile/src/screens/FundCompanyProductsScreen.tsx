import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TouchableOpacity, TextInput, StatusBar, Platform, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';

// 基金产品类型定义
interface FundProduct {
  id: string;
  name: string;
  code: string;
  returnRate: number;
  description: string;
  type: string;
  riskLevel: string;
  status: 'active' | 'inactive';
  createdAt: string;
  minInvestment: number;
  fundCompanyId: string;
}

export default function FundCompanyProductsScreen({
  lang = 'zh',
  userInfo,
  onClose
}: {
  lang?: 'zh' | 'en';
  userInfo?: any;
  onClose: () => void;
}) {
  // 获取安全区域信息
  const insets = useSafeAreaInsets();

  // 产品列表状态
  const [products, setProducts] = useState<FundProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // 添加/编辑产品模态框状态
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<FundProduct | null>(null);

  // 表单状态
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    returnRate: '',
    description: '',
    type: '混合型',
    riskLevel: '中低风险',
    minInvestment: '',
    status: 'active' as 'active' | 'inactive'
  });

  // 语言翻译
  const t = lang === 'zh' ? {
    title: '产品管理',
    searchPlaceholder: '搜索产品',
    addProduct: '添加产品',
    editProduct: '编辑产品',
    productName: '产品名称',
    productCode: '产品代码',
    returnRate: '收益率',
    description: '产品描述',
    type: '产品类型',
    riskLevel: '风险等级',
    minInvestment: '起投金额',
    status: '状态',
    active: '上架',
    inactive: '下架',
    save: '保存',
    cancel: '取消',
    delete: '删除',
    confirmDelete: '确认删除',
    deleteConfirmMessage: '确定要删除这个产品吗？此操作不可恢复。',
    noProducts: '暂无产品',
    loading: '加载中...',
    success: '操作成功',
    error: '操作失败',
    mixed: '混合型',
    stock: '股票型',
    bond: '债券型',
    lowRisk: '低风险',
    mediumLowRisk: '中低风险',
    mediumRisk: '中风险',
    highRisk: '高风险'
  } : {
    title: 'Product Management',
    searchPlaceholder: 'Search products',
    addProduct: 'Add Product',
    editProduct: 'Edit Product',
    productName: 'Product Name',
    productCode: 'Product Code',
    returnRate: 'Return Rate',
    description: 'Description',
    type: 'Type',
    riskLevel: 'Risk Level',
    minInvestment: 'Min Investment',
    status: 'Status',
    active: 'Active',
    inactive: 'Inactive',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    confirmDelete: 'Confirm Delete',
    deleteConfirmMessage: 'Are you sure you want to delete this product? This action cannot be undone.',
    noProducts: 'No products',
    loading: 'Loading...',
    success: 'Success',
    error: 'Error',
    mixed: 'Mixed',
    stock: 'Stock',
    bond: 'Bond',
    lowRisk: 'Low Risk',
    mediumLowRisk: 'Medium-Low Risk',
    mediumRisk: 'Medium Risk',
    highRisk: 'High Risk'
  };

  // 产品类型选项
  const productTypes = [
    { value: '混合型', label: t.mixed },
    { value: '股票型', label: t.stock },
    { value: '债券型', label: t.bond }
  ];

  // 风险等级选项
  const riskLevels = [
    { value: '低风险', label: t.lowRisk },
    { value: '中低风险', label: t.mediumLowRisk },
    { value: '中风险', label: t.mediumRisk },
    { value: '高风险', label: t.highRisk }
  ];

  // 获取产品列表
  const fetchProducts = async () => {
    try {
      setLoading(true);
      if (!supabase || !userInfo?.id) {
        setProducts([]);
        return;
      }

      const { data, error } = await supabase
        .from('fund_products')
        .select('*')
        .eq('fund_company_id', userInfo.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('获取产品列表失败:', error);
        Alert.alert(t.error, '获取产品列表失败');
        return;
      }

      setProducts(data || []);
    } catch (error) {
      console.error('获取产品列表异常:', error);
    } finally {
      setLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    fetchProducts();
  }, [userInfo]);

  // 打开添加产品模态框
  const handleAddProduct = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      code: '',
      returnRate: '',
      description: '',
      type: '混合型',
      riskLevel: '中低风险',
      minInvestment: '',
      status: 'active'
    });
    setShowModal(true);
  };

  // 打开编辑产品模态框
  const handleEditProduct = (product: FundProduct) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      code: product.code,
      returnRate: product.returnRate.toString(),
      description: product.description,
      type: product.type,
      riskLevel: product.riskLevel,
      minInvestment: product.minInvestment.toString(),
      status: product.status
    });
    setShowModal(true);
  };

  // 保存产品
  const handleSaveProduct = async () => {
    try {
      if (!formData.name.trim() || !formData.code.trim()) {
        Alert.alert(t.error, '请填写产品名称和代码');
        return;
      }

      if (!supabase || !userInfo?.id) {
        Alert.alert(t.error, '用户信息无效');
        return;
      }

      const productData = {
        name: formData.name.trim(),
        code: formData.code.trim(),
        return_rate: parseFloat(formData.returnRate) || 0,
        description: formData.description.trim(),
        type: formData.type,
        risk_level: formData.riskLevel,
        min_investment: parseFloat(formData.minInvestment) || 0,
        status: formData.status,
        fund_company_id: userInfo.id
      };

      if (editingProduct) {
        // 更新现有产品
        const { error } = await supabase
          .from('fund_products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) {
          console.error('更新产品失败:', error);
          Alert.alert(t.error, '更新产品失败');
          return;
        }
      } else {
        // 创建新产品
        const { error } = await supabase
          .from('fund_products')
          .insert(productData);

        if (error) {
          console.error('创建产品失败:', error);
          Alert.alert(t.error, '创建产品失败');
          return;
        }
      }

      Alert.alert(t.success, editingProduct ? '产品更新成功' : '产品创建成功');
      setShowModal(false);
      fetchProducts();
    } catch (error) {
      console.error('保存产品异常:', error);
      Alert.alert(t.error, '保存产品失败');
    }
  };

  // 删除产品
  const handleDeleteProduct = (productId: string) => {
    Alert.alert(
      t.confirmDelete,
      t.deleteConfirmMessage,
      [
        { text: t.cancel, style: 'cancel' },
        {
          text: t.delete,
          style: 'destructive',
          onPress: async () => {
            try {
              if (!supabase) return;

              const { error } = await supabase
                .from('fund_products')
                .delete()
                .eq('id', productId);

              if (error) {
                console.error('删除产品失败:', error);
                Alert.alert(t.error, '删除产品失败');
                return;
              }

              Alert.alert(t.success, '产品删除成功');
              fetchProducts();
            } catch (error) {
              console.error('删除产品异常:', error);
              Alert.alert(t.error, '删除产品失败');
            }
          }
        }
      ]
    );
  };

  // 过滤产品列表
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" translucent={true} backgroundColor="transparent" />

      {/* 顶部导航栏 */}
      <View style={[styles.header, { paddingTop: Platform.OS === 'web' ? 20 : 40 + insets.top }]}>
        <TouchableOpacity style={styles.backButton} onPress={onClose}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.title}</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddProduct}>
          <Ionicons name="add" size={24} color="#4a90e2" />
        </TouchableOpacity>
      </View>

      {/* 搜索框 */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={t.searchPlaceholder}
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {/* 产品列表 */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>{t.loading}</Text>
          </View>
        ) : filteredProducts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>{t.noProducts}</Text>
          </View>
        ) : (
          <View style={styles.productList}>
            {filteredProducts.map((product) => (
              <View key={product.id} style={styles.productCard}>
                <View style={styles.productHeader}>
                  <View style={styles.productInfo}>
                    <Text style={styles.productName}>{product.name}</Text>
                    <Text style={styles.productCode}>{product.code}</Text>
                  </View>
                  <View style={[
                    styles.statusBadge,
                    product.status === 'active' ? styles.statusActive : styles.statusInactive
                  ]}>
                    <Text style={[
                      styles.statusText,
                      product.status === 'active' ? styles.statusTextActive : styles.statusTextInactive
                    ]}>
                      {product.status === 'active' ? t.active : t.inactive}
                    </Text>
                  </View>
                </View>

                <View style={styles.productDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>{t.type}</Text>
                    <Text style={styles.detailValue}>{product.type}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>{t.riskLevel}</Text>
                    <Text style={styles.detailValue}>{product.riskLevel}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>{t.returnRate}</Text>
                    <Text style={[
                      styles.detailValue,
                      product.returnRate >= 0 ? styles.positiveReturn : styles.negativeReturn
                    ]}>
                      {product.returnRate >= 0 ? '+' : ''}{product.returnRate}%
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>{t.minInvestment}</Text>
                    <Text style={styles.detailValue}>¥{product.minInvestment.toLocaleString()}</Text>
                  </View>
                </View>

                {product.description && (
                  <Text style={styles.productDescription} numberOfLines={2}>
                    {product.description}
                  </Text>
                )}

                <View style={styles.productActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.editButton]}
                    onPress={() => handleEditProduct(product)}
                  >
                    <Ionicons name="create-outline" size={18} color="#4a90e2" />
                    <Text style={styles.editButtonText}>{t.editProduct}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDeleteProduct(product.id)}
                  >
                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                    <Text style={styles.deleteButtonText}>{t.delete}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* 添加/编辑产品模态框 */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingProduct ? t.editProduct : t.addProduct}
              </Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* 产品名称 */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>{t.productName}</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  placeholder={t.productName}
                  placeholderTextColor="#999"
                />
              </View>

              {/* 产品代码 */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>{t.productCode}</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.code}
                  onChangeText={(text) => setFormData({ ...formData, code: text })}
                  placeholder={t.productCode}
                  placeholderTextColor="#999"
                />
              </View>

              {/* 收益率 */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>{t.returnRate} (%)</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.returnRate}
                  onChangeText={(text) => setFormData({ ...formData, returnRate: text })}
                  placeholder="0.00"
                  placeholderTextColor="#999"
                  keyboardType="decimal-pad"
                />
              </View>

              {/* 产品类型 */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>{t.type}</Text>
                <View style={styles.selectContainer}>
                  {productTypes.map((type) => (
                    <TouchableOpacity
                      key={type.value}
                      style={[
                        styles.selectOption,
                        formData.type === type.value && styles.selectOptionActive
                      ]}
                      onPress={() => setFormData({ ...formData, type: type.value })}
                    >
                      <Text style={[
                        styles.selectOptionText,
                        formData.type === type.value && styles.selectOptionTextActive
                      ]}>
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* 风险等级 */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>{t.riskLevel}</Text>
                <View style={styles.selectContainer}>
                  {riskLevels.map((level) => (
                    <TouchableOpacity
                      key={level.value}
                      style={[
                        styles.selectOption,
                        formData.riskLevel === level.value && styles.selectOptionActive
                      ]}
                      onPress={() => setFormData({ ...formData, riskLevel: level.value })}
                    >
                      <Text style={[
                        styles.selectOptionText,
                        formData.riskLevel === level.value && styles.selectOptionTextActive
                      ]}>
                        {level.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* 起投金额 */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>{t.minInvestment} (¥)</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.minInvestment}
                  onChangeText={(text) => setFormData({ ...formData, minInvestment: text })}
                  placeholder="0"
                  placeholderTextColor="#999"
                  keyboardType="number-pad"
                />
              </View>

              {/* 状态 */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>{t.status}</Text>
                <View style={styles.selectContainer}>
                  <TouchableOpacity
                    style={[
                      styles.selectOption,
                      formData.status === 'active' && styles.selectOptionActive
                    ]}
                    onPress={() => setFormData({ ...formData, status: 'active' })}
                  >
                    <Text style={[
                      styles.selectOptionText,
                      formData.status === 'active' && styles.selectOptionTextActive
                    ]}>
                      {t.active}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.selectOption,
                      formData.status === 'inactive' && styles.selectOptionActive
                    ]}
                    onPress={() => setFormData({ ...formData, status: 'inactive' })}
                  >
                    <Text style={[
                      styles.selectOptionText,
                      formData.status === 'inactive' && styles.selectOptionTextActive
                    ]}>
                      {t.inactive}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* 产品描述 */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>{t.description}</Text>
                <TextInput
                  style={[styles.formInput, styles.textArea]}
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                  placeholder={t.description}
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.cancelButtonText}>{t.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveProduct}
              >
                <Text style={styles.saveButtonText}>{t.save}</Text>
              </TouchableOpacity>
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
    backgroundColor: '#f0f2f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#f0f2f5',
  },
  backButton: {
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
  addButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#333',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: '#999',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
  productList: {
    gap: 12,
    paddingBottom: 20,
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  productCode: {
    fontSize: 13,
    color: '#999',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusActive: {
    backgroundColor: '#e6f7e6',
  },
  statusInactive: {
    backgroundColor: '#ffe6e6',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  statusTextActive: {
    color: '#10b981',
  },
  statusTextInactive: {
    color: '#ef4444',
  },
  productDetails: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 13,
    color: '#666',
  },
  detailValue: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
  positiveReturn: {
    color: '#10b981',
  },
  negativeReturn: {
    color: '#ef4444',
  },
  productDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  productActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  editButton: {
    backgroundColor: '#e6f4ff',
  },
  editButtonText: {
    fontSize: 14,
    color: '#4a90e2',
    fontWeight: '500',
  },
  deleteButton: {
    backgroundColor: '#ffe6e6',
  },
  deleteButtonText: {
    fontSize: 14,
    color: '#ef4444',
    fontWeight: '500',
  },
  // 模态框样式
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
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: '#333',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  selectContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectOptionActive: {
    backgroundColor: '#4a90e2',
    borderColor: '#4a90e2',
  },
  selectOptionText: {
    fontSize: 14,
    color: '#333',
  },
  selectOptionTextActive: {
    color: '#fff',
    fontWeight: '500',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#4a90e2',
  },
  saveButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});
