import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TouchableOpacity, TextInput, StatusBar, Platform, Modal, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import * as ImagePicker from 'expo-image-picker';

// 文章类型定义
interface Article {
  id: string;
  title: string;
  content: string;
  summary: string;
  coverImage: string;
  status: 'draft' | 'published';
  createdAt: string;
  publishedAt?: string;
  author: string;
  fundCompanyId: string;
}

export default function FundCompanyOfficialAccountScreen({
  lang = 'zh',
  userInfo,
  onClose
}: {
  lang?: 'zh' | 'en';
  userInfo?: any;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();

  // 文章列表状态
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'published' | 'draft'>('all');

  // 添加/编辑文章模态框状态
  const [showModal, setShowModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);

  // 表单状态
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    summary: '',
    coverImage: '',
    status: 'draft' as 'draft' | 'published'
  });

  // 语言翻译
  const t = lang === 'zh' ? {
    title: '公众号管理',
    searchPlaceholder: '搜索文章',
    addArticle: '新建文章',
    editArticle: '编辑文章',
    articleTitle: '文章标题',
    articleContent: '文章内容',
    articleSummary: '文章摘要',
    coverImage: '封面图片',
    status: '状态',
    draft: '草稿',
    published: '已发布',
    publish: '发布',
    save: '保存',
    cancel: '取消',
    delete: '删除',
    confirmDelete: '确认删除',
    deleteConfirmMessage: '确定要删除这篇文章吗？此操作不可恢复。',
    noArticles: '暂无文章',
    loading: '加载中...',
    success: '操作成功',
    error: '操作失败',
    all: '全部',
    publishedTab: '已发布',
    draftTab: '草稿',
    uploadImage: '上传图片',
    changeImage: '更换图片',
    publishNow: '立即发布',
    saveDraft: '保存草稿',
    createdAt: '创建于',
    publishedAt: '发布于'
  } : {
    title: 'Official Account Management',
    searchPlaceholder: 'Search articles',
    addArticle: 'New Article',
    editArticle: 'Edit Article',
    articleTitle: 'Article Title',
    articleContent: 'Article Content',
    articleSummary: 'Article Summary',
    coverImage: 'Cover Image',
    status: 'Status',
    draft: 'Draft',
    published: 'Published',
    publish: 'Publish',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    confirmDelete: 'Confirm Delete',
    deleteConfirmMessage: 'Are you sure you want to delete this article? This action cannot be undone.',
    noArticles: 'No articles',
    loading: 'Loading...',
    success: 'Success',
    error: 'Error',
    all: 'All',
    publishedTab: 'Published',
    draftTab: 'Drafts',
    uploadImage: 'Upload Image',
    changeImage: 'Change Image',
    publishNow: 'Publish Now',
    saveDraft: 'Save Draft',
    createdAt: 'Created at',
    publishedAt: 'Published at'
  };

  // 获取文章列表
  const fetchArticles = async () => {
    try {
      setLoading(true);
      if (!supabase || !userInfo?.id) {
        setArticles([]);
        return;
      }

      const { data, error } = await supabase
        .from('fund_company_articles')
        .select('*')
        .eq('fund_company_id', userInfo.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('获取文章列表失败:', error);
        Alert.alert(t.error, '获取文章列表失败');
        return;
      }

      setArticles(data || []);
    } catch (error) {
      console.error('获取文章列表异常:', error);
    } finally {
      setLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    fetchArticles();
  }, [userInfo]);

  // 打开添加文章模态框
  const handleAddArticle = () => {
    setEditingArticle(null);
    setFormData({
      title: '',
      content: '',
      summary: '',
      coverImage: '',
      status: 'draft'
    });
    setShowModal(true);
  };

  // 打开编辑文章模态框
  const handleEditArticle = (article: Article) => {
    setEditingArticle(article);
    setFormData({
      title: article.title,
      content: article.content,
      summary: article.summary,
      coverImage: article.coverImage,
      status: article.status
    });
    setShowModal(true);
  };

  // 上传图片
  const handleUploadImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('权限不足', '需要相册权限才能选择图片');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];

        // 生成文件名
        const fileExt = asset.uri.split('.').pop()?.toLowerCase() || 'jpg';
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 10)}.${fileExt}`;
        const filePath = `fund-company-articles/${fileName}`;

        // 读取文件
        const response = await fetch(asset.uri);
        const blob = await response.blob();

        // 上传到Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('qdshow101')
          .upload(filePath, blob, {
            contentType: `image/${fileExt}`
          });

        if (uploadError) {
          console.error('上传图片失败:', uploadError);
          Alert.alert(t.error, '上传图片失败');
          return;
        }

        // 获取公共URL
        const { data } = supabase.storage.from('qdshow101').getPublicUrl(filePath);
        setFormData({ ...formData, coverImage: data.publicUrl });
      }
    } catch (error) {
      console.error('上传图片异常:', error);
      Alert.alert(t.error, '上传图片失败');
    }
  };

  // 保存文章
  const handleSaveArticle = async (publish: boolean = false) => {
    try {
      if (!formData.title.trim()) {
        Alert.alert(t.error, '请填写文章标题');
        return;
      }

      if (!supabase || !userInfo?.id) {
        Alert.alert(t.error, '用户信息无效');
        return;
      }

      const articleData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        summary: formData.summary.trim() || formData.title.trim().substring(0, 100),
        cover_image: formData.coverImage,
        status: publish ? 'published' : formData.status,
        fund_company_id: userInfo.id,
        author: userInfo.name || userInfo.nickname || '基金公司',
        published_at: publish || formData.status === 'published' ? new Date().toISOString() : null
      };

      if (editingArticle) {
        // 更新现有文章
        const { error } = await supabase
          .from('fund_company_articles')
          .update(articleData)
          .eq('id', editingArticle.id);

        if (error) {
          console.error('更新文章失败:', error);
          Alert.alert(t.error, '更新文章失败');
          return;
        }
      } else {
        // 创建新文章
        const { error } = await supabase
          .from('fund_company_articles')
          .insert(articleData);

        if (error) {
          console.error('创建文章失败:', error);
          Alert.alert(t.error, '创建文章失败');
          return;
        }
      }

      Alert.alert(t.success, publish ? '文章发布成功' : '文章保存成功');
      setShowModal(false);
      fetchArticles();
    } catch (error) {
      console.error('保存文章异常:', error);
      Alert.alert(t.error, '保存文章失败');
    }
  };

  // 删除文章
  const handleDeleteArticle = (articleId: string) => {
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
                .from('fund_company_articles')
                .delete()
                .eq('id', articleId);

              if (error) {
                console.error('删除文章失败:', error);
                Alert.alert(t.error, '删除文章失败');
                return;
              }

              Alert.alert(t.success, '文章删除成功');
              fetchArticles();
            } catch (error) {
              console.error('删除文章异常:', error);
              Alert.alert(t.error, '删除文章失败');
            }
          }
        }
      ]
    );
  };

  // 过滤文章列表
  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         article.summary.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || article.status === activeTab;
    return matchesSearch && matchesTab;
  });

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" translucent={true} backgroundColor="transparent" />

      {/* 顶部导航栏 */}
      <View style={[styles.header, { paddingTop: Platform.OS === 'web' ? 20 : 40 + insets.top }]}>
        <TouchableOpacity style={styles.backButton} onPress={onClose}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.title}</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddArticle}>
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

      {/* 标签页切换 */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.tabActive]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>
            {t.all}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'published' && styles.tabActive]}
          onPress={() => setActiveTab('published')}
        >
          <Text style={[styles.tabText, activeTab === 'published' && styles.tabTextActive]}>
            {t.publishedTab}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'draft' && styles.tabActive]}
          onPress={() => setActiveTab('draft')}
        >
          <Text style={[styles.tabText, activeTab === 'draft' && styles.tabTextActive]}>
            {t.draftTab}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 文章列表 */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>{t.loading}</Text>
          </View>
        ) : filteredArticles.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>{t.noArticles}</Text>
          </View>
        ) : (
          <View style={styles.articleList}>
            {filteredArticles.map((article) => (
              <View key={article.id} style={styles.articleCard}>
                {/* 封面图片 */}
                {article.coverImage && (
                  <Image source={{ uri: article.coverImage }} style={styles.articleCover} />
                )}

                <View style={styles.articleContent}>
                  {/* 标题和状态 */}
                  <View style={styles.articleHeader}>
                    <Text style={styles.articleTitle} numberOfLines={2}>
                      {article.title}
                    </Text>
                    <View style={[
                      styles.statusBadge,
                      article.status === 'published' ? styles.statusPublished : styles.statusDraft
                    ]}>
                      <Text style={[
                        styles.statusText,
                        article.status === 'published' ? styles.statusTextPublished : styles.statusTextDraft
                      ]}>
                        {article.status === 'published' ? t.published : t.draft}
                      </Text>
                    </View>
                  </View>

                  {/* 摘要 */}
                  {article.summary && (
                    <Text style={styles.articleSummary} numberOfLines={2}>
                      {article.summary}
                    </Text>
                  )}

                  {/* 日期信息 */}
                  <View style={styles.articleMeta}>
                    <Text style={styles.articleDate}>
                      {t.createdAt}: {formatDate(article.createdAt)}
                    </Text>
                    {article.publishedAt && (
                      <Text style={styles.articleDate}>
                        {t.publishedAt}: {formatDate(article.publishedAt)}
                      </Text>
                    )}
                  </View>

                  {/* 操作按钮 */}
                  <View style={styles.articleActions}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.editButton]}
                      onPress={() => handleEditArticle(article)}
                    >
                      <Ionicons name="create-outline" size={18} color="#4a90e2" />
                      <Text style={styles.editButtonText}>{t.editArticle}</Text>
                    </TouchableOpacity>
                    {article.status === 'draft' && (
                      <TouchableOpacity
                        style={[styles.actionButton, styles.publishButton]}
                        onPress={() => {
                          setEditingArticle(article);
                          setFormData({
                            title: article.title,
                            content: article.content,
                            summary: article.summary,
                            coverImage: article.coverImage,
                            status: 'published'
                          });
                          handleSaveArticle(true);
                        }}
                      >
                        <Ionicons name="send-outline" size={18} color="#10b981" />
                        <Text style={styles.publishButtonText}>{t.publish}</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={() => handleDeleteArticle(article.id)}
                    >
                      <Ionicons name="trash-outline" size={18} color="#ef4444" />
                      <Text style={styles.deleteButtonText}>{t.delete}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* 添加/编辑文章模态框 */}
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
                {editingArticle ? t.editArticle : t.addArticle}
              </Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* 封面图片 */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>{t.coverImage}</Text>
                {formData.coverImage ? (
                  <View style={styles.imagePreviewContainer}>
                    <Image source={{ uri: formData.coverImage }} style={styles.imagePreview} />
                    <TouchableOpacity
                      style={styles.changeImageButton}
                      onPress={handleUploadImage}
                    >
                      <Text style={styles.changeImageText}>{t.changeImage}</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.uploadButton}
                    onPress={handleUploadImage}
                  >
                    <Ionicons name="camera-outline" size={32} color="#999" />
                    <Text style={styles.uploadButtonText}>{t.uploadImage}</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* 文章标题 */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>{t.articleTitle}</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.title}
                  onChangeText={(text) => setFormData({ ...formData, title: text })}
                  placeholder={t.articleTitle}
                  placeholderTextColor="#999"
                  maxLength={100}
                />
              </View>

              {/* 文章摘要 */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>{t.articleSummary}</Text>
                <TextInput
                  style={[styles.formInput, styles.textArea]}
                  value={formData.summary}
                  onChangeText={(text) => setFormData({ ...formData, summary: text })}
                  placeholder={t.articleSummary}
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={3}
                  maxLength={200}
                />
              </View>

              {/* 文章内容 */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>{t.articleContent}</Text>
                <TextInput
                  style={[styles.formInput, styles.contentArea]}
                  value={formData.content}
                  onChangeText={(text) => setFormData({ ...formData, content: text })}
                  placeholder={t.articleContent}
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={10}
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
                style={[styles.modalButton, styles.saveDraftButton]}
                onPress={() => handleSaveArticle(false)}
              >
                <Text style={styles.saveDraftButtonText}>{t.saveDraft}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.publishButton]}
                onPress={() => handleSaveArticle(true)}
              >
                <Text style={styles.publishButtonText}>{t.publishNow}</Text>
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
    marginBottom: 12,
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
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#4a90e2',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#fff',
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
  articleList: {
    gap: 12,
    paddingBottom: 20,
  },
  articleCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  articleCover: {
    width: '100%',
    height: 160,
  },
  articleContent: {
    padding: 16,
  },
  articleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  articleTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
    lineHeight: 22,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusPublished: {
    backgroundColor: '#e6f7e6',
  },
  statusDraft: {
    backgroundColor: '#f0f0f0',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  statusTextPublished: {
    color: '#10b981',
  },
  statusTextDraft: {
    color: '#666',
  },
  articleSummary: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  articleMeta: {
    marginBottom: 12,
  },
  articleDate: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  articleActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 6,
    gap: 4,
  },
  editButton: {
    backgroundColor: '#e6f4ff',
  },
  editButtonText: {
    fontSize: 13,
    color: '#4a90e2',
    fontWeight: '500',
  },
  publishButton: {
    backgroundColor: '#e6f7e6',
  },
  publishButtonText: {
    fontSize: 13,
    color: '#10b981',
    fontWeight: '500',
  },
  deleteButton: {
    backgroundColor: '#ffe6e6',
  },
  deleteButtonText: {
    fontSize: 13,
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
    minHeight: 80,
    textAlignVertical: 'top',
  },
  contentArea: {
    minHeight: 150,
    textAlignVertical: 'top',
  },
  uploadButton: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  uploadButtonText: {
    color: '#999',
    fontSize: 14,
    marginTop: 8,
  },
  imagePreviewContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
  },
  imagePreview: {
    width: '100%',
    height: 160,
    borderRadius: 8,
    marginBottom: 12,
  },
  changeImageButton: {
    backgroundColor: '#fff',
    borderRadius: 4,
    padding: 8,
    alignItems: 'center',
  },
  changeImageText: {
    color: '#4a90e2',
    fontSize: 14,
    fontWeight: '500',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  cancelButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  saveDraftButton: {
    backgroundColor: '#f0f0f0',
  },
  saveDraftButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#4a90e2',
  },
  saveButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
});
