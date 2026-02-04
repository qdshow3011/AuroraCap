import { useState, useEffect } from 'react'
import { View, Text, Pressable, ActivityIndicator, ScrollView, Image, TextInput, Alert, TouchableWithoutFeedback, Keyboard } from 'react-native'
import * as DocumentPicker from 'expo-document-picker'
import { createArticle, updateArticle } from '../api/articles'
import { getUserAccounts } from '../api/accounts'
import { processPdfUpload } from '../api/pdf'

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
  pdf_url?: string;
  account_id: string;
  summary?: string;
  category_id?: string;
}

export default function ArticleEditScreen({ 
  article, 
  onClose, 
  onSave, 
  lang = 'zh' 
}: { 
  article?: Article; 
  onClose?: () => void; 
  onSave?: () => void; 
  lang?: 'zh' | 'en';
}) {
  const [accounts, setAccounts] = useState<OfficialAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [uploadingPdf, setUploadingPdf] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    cover_image: '',
    pdf_url: '',
    account_id: '',
    summary: '',
  })

  useEffect(() => {
    fetchAccounts();
    if (article) {
      setFormData({
        title: article.title,
        content: article.content,
        cover_image: article.cover_image || '',
        pdf_url: article.pdf_url || '',
        account_id: article.account_id,
        summary: article.summary || '',
      });
    }
  }, [article]);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const accountsData = await getUserAccounts();
      setAccounts(accountsData);
      if (accountsData.length > 0 && !formData.account_id) {
        setFormData({ ...formData, account_id: accountsData[0].id });
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
      Alert.alert(
        lang === 'zh' ? '错误' : 'Error',
        lang === 'zh' ? '获取公众号列表失败' : 'Failed to fetch accounts'
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePickPdf = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setUploadingPdf(true);
        
        const asset = result.assets[0];
        
        try {
          // 处理PDF上传和内容提取
          const { pdfUrl, title, summary } = await processPdfUpload(asset.uri);
          
          // 更新表单数据
          setFormData({
            ...formData,
            pdf_url: pdfUrl,
            title: title,
            summary: summary,
          });
          
          Alert.alert(
            lang === 'zh' ? '成功' : 'Success',
            lang === 'zh' ? 'PDF上传成功，已自动提取标题和摘要' : 'PDF uploaded successfully, title and summary extracted automatically'
          );
        } catch (error) {
          console.error('Error processing PDF:', error);
          Alert.alert(
            lang === 'zh' ? '错误' : 'Error',
            lang === 'zh' ? 'PDF处理失败，请重试' : 'Failed to process PDF, please try again'
          );
        } finally {
          setUploadingPdf(false);
        }
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert(
        lang === 'zh' ? '错误' : 'Error',
        lang === 'zh' ? '选择文件失败，请重试' : 'Failed to select file, please try again'
      );
    }
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.content.trim() || !formData.account_id) {
      Alert.alert(
        lang === 'zh' ? '提示' : 'Tip',
        lang === 'zh' ? '请填写标题、内容并选择公众号' : 'Please enter title, content and select an account'
      );
      return;
    }

    try {
      setSubmitting(true);
      if (article) {
        // 更新现有文章
        await updateArticle(article.id, {
          title: formData.title,
          content: formData.content,
          cover_image: formData.cover_image,
          pdf_url: formData.pdf_url,
          summary: formData.summary,
        });
        Alert.alert(
          lang === 'zh' ? '成功' : 'Success',
          lang === 'zh' ? '文章更新成功' : 'Article updated successfully'
        );
      } else {
        // 创建新文章
        await createArticle({
          title: formData.title,
          content: formData.content,
          cover_image: formData.cover_image,
          pdf_url: formData.pdf_url,
          account_id: formData.account_id,
          summary: formData.summary,
        });
        Alert.alert(
          lang === 'zh' ? '成功' : 'Success',
          lang === 'zh' ? '文章创建成功' : 'Article created successfully'
        );
      }
      if (onSave) {
        onSave();
      }
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error('Error saving article:', error);
      Alert.alert(
        lang === 'zh' ? '错误' : 'Error',
        lang === 'zh' ? '保存文章失败' : 'Failed to save article'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <ActivityIndicator size="large" color="#576b95" />
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        {/* 顶部导航栏 */}
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>
              {lang === 'zh' ? '取消' : 'Cancel'}
            </Text>
          </Pressable>
          <Text style={styles.headerTitle}>
            {article ? (lang === 'zh' ? '编辑文章' : 'Edit Article') : (lang === 'zh' ? '写文章' : 'Write Article')}
          </Text>
          <Pressable 
            onPress={handleSave} 
            disabled={submitting}
            style={styles.headerButton}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#576b95" />
            ) : (
              <Text style={[styles.headerButtonText, styles.saveButtonText]}>
                {lang === 'zh' ? '保存' : 'Save'}
              </Text>
            )}
          </Pressable>
        </View>

        <ScrollView style={styles.scrollView}>
          {/* 选择公众号 */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>
              {lang === 'zh' ? '选择公众号' : 'Select Account'} *
            </Text>
            <View style={styles.accountSelect}>
              {accounts.length === 0 ? (
                <Text style={styles.noAccountsText}>
                  {lang === 'zh' ? '请先创建公众号' : 'Please create an account first'}
                </Text>
              ) : (
                accounts.map((account) => (
                  <Pressable
                    key={account.id}
                    onPress={() => setFormData({ ...formData, account_id: account.id })}
                    style={[
                      styles.accountOption,
                      formData.account_id === account.id && styles.accountOptionSelected
                    ]}
                  >
                    <Text style={[
                      styles.accountOptionText,
                      formData.account_id === account.id && styles.accountOptionTextSelected
                    ]}>
                      {account.name}
                    </Text>
                  </Pressable>
                ))
              )}
            </View>
          </View>

          {/* 标题输入 */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>
              {lang === 'zh' ? '标题' : 'Title'} *
            </Text>
            <TextInput
              style={styles.titleInput}
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
              placeholder={lang === 'zh' ? '请输入文章标题' : 'Enter article title'}
              placeholderTextColor="#999"
              maxLength={100}
            />
            <Text style={styles.charCount}>
              {formData.title.length}/100
            </Text>
          </View>

          {/* 封面图片URL */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>
              {lang === 'zh' ? '封面图片URL' : 'Cover Image URL'}
            </Text>
            <TextInput
              style={styles.urlInput}
              value={formData.cover_image}
              onChangeText={(text) => setFormData({ ...formData, cover_image: text })}
              placeholder={lang === 'zh' ? '请输入封面图片URL' : 'Enter cover image URL'}
              placeholderTextColor="#999"
            />
            {formData.cover_image && (
              <View style={styles.previewContainer}>
                <Image source={{ uri: formData.cover_image }} style={styles.previewImage} />
              </View>
            )}
          </View>

          {/* PDF上传 */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>
              {lang === 'zh' ? '上传PDF文件' : 'Upload PDF File'}
            </Text>
            <Pressable
              onPress={handlePickPdf}
              disabled={uploadingPdf}
              style={styles.pdfUploadButton}
            >
              {uploadingPdf ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Text style={styles.pdfUploadIcon}>📄</Text>
                  <Text style={styles.pdfUploadText}>
                    {formData.pdf_url 
                      ? lang === 'zh' ? '已上传PDF文件' : 'PDF file uploaded'
                      : lang === 'zh' ? '点击选择并上传PDF文件' : 'Click to select and upload PDF file'
                    }
                  </Text>
                </>
              )}
            </Pressable>
            {formData.pdf_url && (
              <Text style={styles.pdfUrlText}>
                {lang === 'zh' ? 'PDF链接：' : 'PDF URL: '}
                {formData.pdf_url.length > 50 ? formData.pdf_url.substring(0, 50) + '...' : formData.pdf_url}
              </Text>
            )}
          </View>

          {/* 摘要输入 */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>
              {lang === 'zh' ? '摘要' : 'Summary'}
            </Text>
            <TextInput
              style={[styles.textArea, styles.summaryInput]}
              value={formData.summary}
              onChangeText={(text) => setFormData({ ...formData, summary: text })}
              placeholder={lang === 'zh' ? '请输入文章摘要' : 'Enter article summary'}
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
              maxLength={200}
            />
            <Text style={styles.charCount}>
              {formData.summary?.length || 0}/200
            </Text>
          </View>

          {/* 内容输入 */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>
              {lang === 'zh' ? '内容' : 'Content'} *
            </Text>
            <TextInput
              style={[styles.textArea, styles.contentInput]}
              value={formData.content}
              onChangeText={(text) => setFormData({ ...formData, content: text })}
              placeholder={lang === 'zh' ? '请输入文章内容' : 'Enter article content'}
              placeholderTextColor="#999"
              multiline
              numberOfLines={10}
            />
          </View>
        </ScrollView>
      </View>
    </TouchableWithoutFeedback>
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
  headerButton: {
    padding: 4,
  },
  headerButtonText: {
    fontSize: 16,
    color: '#333',
  },
  saveButtonText: {
    color: '#576b95',
    fontWeight: '500',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  formGroup: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 12,
  },
  titleInput: {
    fontSize: 18,
    fontWeight: '500',
    color: '#333',
    padding: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingBottom: 8,
  },
  urlInput: {
    fontSize: 16,
    color: '#333',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 12,
    backgroundColor: '#f9f9f9',
    textAlignVertical: 'top',
  },
  summaryInput: {
    minHeight: 80,
    maxHeight: 120,
  },
  contentInput: {
    minHeight: 300,
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
  accountSelect: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  accountOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#f9f9f9',
  },
  accountOptionSelected: {
    backgroundColor: '#576b95',
    borderColor: '#576b95',
  },
  accountOptionText: {
    fontSize: 14,
    color: '#333',
  },
  accountOptionTextSelected: {
    color: '#fff',
  },
  noAccountsText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  previewContainer: {
    marginTop: 12,
    borderRadius: 4,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  pdfUploadButton: {
    backgroundColor: '#576b95',
    padding: 16,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  pdfUploadIcon: {
    fontSize: 20,
  },
  pdfUploadText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  pdfUrlText: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    wordBreak: 'break-all',
  },
};
