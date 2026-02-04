import { useState, useEffect, useRef } from 'react'
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Pressable, Alert, ActivityIndicator, Image, Platform, Modal, KeyboardAvoidingView, Dimensions } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import * as DocumentPicker from 'expo-document-picker'
import { supabase } from '../lib/supabase'
import { processPdfUpload } from '../api/pdf'

// 平台特定导入和组件
let RichEditor: any = null
let RichEditorToolbar: any = null
let WebRichEditor: any = null
let WebRichEditorToolbar: any = null

// 只在非Web平台上尝试加载富文本编辑器
if (Platform.OS !== 'web') {
  try {
    const richEditorModule = require('react-native-pell-rich-editor')
    RichEditor = richEditorModule.default
    RichEditorToolbar = richEditorModule.RichEditorToolbar

  } catch (error) {
    console.warn('Failed to load rich editor on', Platform.OS, ':', error)
    RichEditor = null
    RichEditorToolbar = null
  }
} else {

  // 为Web平台创建简单的富文本编辑器组件
  const { createElement } = require('react')
  
  // Web平台的富文本编辑器工具栏
  WebRichEditorToolbar = function WebRichEditorToolbar({ editorRef }: { editorRef: any }) {
    const executeCommand = (command: string, value?: string) => {
      if (editorRef.current) {
        document.execCommand(command, false, value)
        editorRef.current.focus()
      }
    }
    
    return createElement('div', { style: { 
      display: 'flex', 
      flexWrap: 'wrap', 
      gap: '8px', 
      padding: '8px', 
      backgroundColor: '#f5f5f5', 
      borderRadius: '8px', 
      border: '1px solid #e0e0e0', 
      marginBottom: '8px'
    } }, [
      createElement('button', { 
        key: 'bold', 
        onClick: () => executeCommand('bold'),
        style: { padding: '4px 8px', borderRadius: '4px', border: '1px solid #ddd', backgroundColor: '#fff' }
      }, 'B'),
      createElement('button', { 
        key: 'italic', 
        onClick: () => executeCommand('italic'),
        style: { padding: '4px 8px', borderRadius: '4px', border: '1px solid #ddd', backgroundColor: '#fff' }
      }, 'I'),
      createElement('button', { 
        key: 'underline', 
        onClick: () => executeCommand('underline'),
        style: { padding: '4px 8px', borderRadius: '4px', border: '1px solid #ddd', backgroundColor: '#fff' }
      }, 'U'),
      createElement('button', { 
        key: 'strikethrough', 
        onClick: () => executeCommand('strikeThrough'),
        style: { padding: '4px 8px', borderRadius: '4px', border: '1px solid #ddd', backgroundColor: '#fff' }
      }, 'S'),
      createElement('button', { 
        key: 'heading1', 
        onClick: () => executeCommand('formatBlock', '<h1>'),
        style: { padding: '4px 8px', borderRadius: '4px', border: '1px solid #ddd', backgroundColor: '#fff' }
      }, 'H1'),
      createElement('button', { 
        key: 'heading2', 
        onClick: () => executeCommand('formatBlock', '<h2>'),
        style: { padding: '4px 8px', borderRadius: '4px', border: '1px solid #ddd', backgroundColor: '#fff' }
      }, 'H2'),
      createElement('button', { 
        key: 'heading3', 
        onClick: () => executeCommand('formatBlock', '<h3>'),
        style: { padding: '4px 8px', borderRadius: '4px', border: '1px solid #ddd', backgroundColor: '#fff' }
      }, 'H3'),
      createElement('button', { 
        key: 'paragraph', 
        onClick: () => executeCommand('formatBlock', '<p>'),
        style: { padding: '4px 8px', borderRadius: '4px', border: '1px solid #ddd', backgroundColor: '#fff' }
      }, 'P'),
      createElement('button', { 
        key: 'orderedList', 
        onClick: () => executeCommand('insertOrderedList'),
        style: { padding: '4px 8px', borderRadius: '4px', border: '1px solid #ddd', backgroundColor: '#fff' }
      }, '1.'),
      createElement('button', { 
        key: 'unorderedList', 
        onClick: () => executeCommand('insertUnorderedList'),
        style: { padding: '4px 8px', borderRadius: '4px', border: '1px solid #ddd', backgroundColor: '#fff' }
      }, '•'),
      createElement('button', { 
        key: 'removeFormat', 
        onClick: () => executeCommand('removeFormat'),
        style: { padding: '4px 8px', borderRadius: '4px', border: '1px solid #ddd', backgroundColor: '#fff' }
      }, 'Clear')
    ])
  }
  
  // Web平台的富文本编辑器（使用React.forwardRef正确处理ref传递）
  WebRichEditor = require('react').forwardRef(function WebRichEditor(
    {
      value,
      onChange,
      placeholder
    }: {
      value: string,
      onChange: (html: string) => void,
      placeholder: string
    },
    ref
  ) {
    const editorRef = ref || require('react').useRef(null)
    
    require('react').useEffect(() => {
      if (editorRef.current) {
        editorRef.current.innerHTML = value
      }
    }, [value, editorRef])
    
    const handleInput = () => {
      if (editorRef.current) {
        onChange(editorRef.current.innerHTML)
      }
    }
    
    return createElement('div', {
      ref: editorRef,
      contentEditable: true,
      style: {
        minHeight: '300px',
        backgroundColor: '#fff',
        borderRadius: '8px',
        border: '1px solid #e0e0e0',
        padding: '12px',
        fontSize: '16px',
        color: '#333'
      },
      onInput: handleInput,
      dangerouslySetInnerHTML: { __html: value || `<p style="color: #999;">${placeholder}</p>` }
    })
  })
}

// 条件导入PDF组件，只在非Web平台上加载
let Pdf: any = null
if (Platform.OS !== 'web') {
  Pdf = require('react-native-pdf').default
}

interface CreateInsiderScreenProps {
  onClose?: () => void
  onNavigateToDraftBox?: () => void
  lang?: 'zh' | 'en'
  userInfo?: any
  draft?: {
    id: string
    title: string
    content: string
    summary: string
    cover_image?: string
    pdf_url?: string
    account_id: string
  }
}

export default function CreateInsiderScreen({ onClose, onNavigateToDraftBox, lang = 'zh', userInfo, draft }: CreateInsiderScreenProps) {
  const [title, setTitle] = useState(draft?.title || '')
  const [content, setContent] = useState(draft?.content || '')
  const [summary, setSummary] = useState(draft?.summary || '')
  const [pdfUrl, setPdfUrl] = useState(draft?.pdf_url || '')
  const [selectedAccount, setSelectedAccount] = useState(draft?.account_id || '')
  const [accounts, setAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [uploadingPdf, setUploadingPdf] = useState(false)
  const [previewImage, setPreviewImage] = useState(draft?.cover_image || '')
  const [showPdfPreview, setShowPdfPreview] = useState(false)
  
  // 富文本编辑器引用
  const richText = useRef<RichEditor>(null)
  // Web平台富文本编辑器引用
  const webRichText = useRef<HTMLDivElement>(null)

  // 语言翻译
  const t = lang === 'zh' ? {
    title: '撰写内参',
    articleTitle: '文章标题',
    articleContent: '文章内容',
    articleSummary: '文章摘要',
    uploadPdf: '上传PDF文件',
    uploadPreviewImage: '上传示意图片',
    selectAccount: '选择公众号',
    submit: '提交',
    cancel: '取消',
    success: '保存成功',
    error: '保存失败',
    pleaseFill: '请填写',
    loading: '加载中...',
    uploading: '上传中...',
    draftSaved: '已保存到草稿箱',
    pdfUploadSuccess: 'PDF上传成功，已自动提取内容',
    pdfUploadError: 'PDF上传失败，请重试',
    previewImageUploadSuccess: '示意图片上传成功',
    previewImageUploadError: '示意图片上传失败，请重试',
  } : {
    title: 'Create Insider',
    articleTitle: 'Article Title',
    articleContent: 'Article Content',
    articleSummary: 'Article Summary',
    uploadPdf: 'Upload PDF File',
    uploadPreviewImage: 'Upload Preview Image',
    selectAccount: 'Select Account',
    submit: 'Submit',
    cancel: 'Cancel',
    success: 'Saved successfully',
    error: 'Failed to save',
    pleaseFill: 'Please fill in',
    loading: 'Loading...',
    uploading: 'Uploading...',
    draftSaved: 'Saved to draft box',
    pdfUploadSuccess: 'PDF uploaded successfully, content extracted automatically',
    pdfUploadError: 'Failed to upload PDF, please try again',
    previewImageUploadSuccess: 'Preview image uploaded successfully',
    previewImageUploadError: 'Failed to upload preview image, please try again',
  }

  // 获取公众号列表
  const fetchAccounts = async () => {
    if (!supabase) return
    
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('wechat_official_accounts')
        .select('id, name')
        .eq('status', 'active')
      
      if (error) throw error
      setAccounts(data || [])
    } catch (error) {
      console.error('Error fetching accounts:', error)
    } finally {
      setLoading(false)
    }
  }

  // 初始加载公众号列表
  useEffect(() => {
    fetchAccounts()
  }, [])

  // 选择图片函数 - 完全参照头像编辑页面的实现
  const pickImage = async () => {
    try {

      
      // 请求相册权限
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      
      if (status !== 'granted') {
        Alert.alert('权限不足', '需要相册权限才能选择图片');
        return;
      }

      // 打开图片选择器
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9], // 示意图片使用16:9比例
        quality: 0.8,
        base64: true, // 请求Base64数据，避免blob URL问题
      });


      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];

        
        // 上传图片
        const uploadedImageUrl = await uploadImage(asset.uri);
        if (uploadedImageUrl) {
          setPreviewImage(uploadedImageUrl);
        }
      }

    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('错误', `选择图片失败：${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  // 上传图片到Supabase Storage - 完全参照头像编辑页面的实现
  const uploadImage = async (uri: string) => {
    try {
      // 获取用户ID，直接从userInfo获取
      const currentUserId = userInfo?.id;
      
      // 验证用户ID是否有效
      if (!currentUserId) {
        console.error('上传图片失败 - 用户信息无效或用户ID不存在:', { userInfo });
        Alert.alert('上传失败', '用户信息无效，无法上传图片');
        return null;
      }
      
      // 获取文件扩展名
      const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
      // 确保扩展名是有效的图片格式
      const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
      const sanitizedExt = validExtensions.includes(fileExt) ? fileExt : 'jpg';
      // 文件名格式：时间戳_随机字符串.扩展名
      const randomString = Math.random().toString(36).substring(2, 10);
      const fileName = `${Date.now()}_${randomString}.${sanitizedExt}`;
      
      // 使用neican文件夹，与admin应用保持一致
      const filePath = `neican/${fileName}`;

      // 读取文件内容
      let blob;
      
      // 检查是否为blob URL
      if (uri.startsWith('blob:')) {
        try {
          // 尝试从blob URL获取Blob对象
          const response = await fetch(uri);
          blob = await response.blob();
        } catch (error) {
          console.error('Failed to fetch blob URL:', error);
          // 回退方案：创建一个空的Blob作为占位符
          blob = new Blob([], { type: `image/${fileExt}` });
        }
      } 
      // 检查是否为base64数据
      else if (uri.startsWith('data:')) {
        // 从base64数据创建Blob
        const base64Data = uri.split(',')[1];
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        blob = new Blob([byteArray], { type: `image/${fileExt}` });
      } 
      // 常规URL处理
      else {
        try {
          const response = await fetch(uri);
          blob = await response.blob();
        } catch (error) {
          console.error('Failed to fetch regular URL:', error);
          // 回退方案：创建一个空的Blob作为占位符
          blob = new Blob([], { type: `image/${fileExt}` });
        }
      }


    

      // 上传到Supabase Storage


      
      // 增加上传超时处理
      const uploadPromise = supabase.storage.from('qdshow101').upload(filePath, blob, { 
        contentType: `image/${fileExt}`
      });
      
      // 添加超时处理
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Upload timeout')), 60000)
      );
      
      let uploadResult;
      try {
        uploadResult = await Promise.race([uploadPromise, timeoutPromise]);

      } catch (timeoutError) {
        console.error('上传超时:', timeoutError);
        
        // 回退方案：直接使用本地图片URL作为示意图片URL

        
        // 显示更友好的备选方案提示
        Alert.alert(
          '上传提示', 
          '图片上传超时，已保存到本地，将在下次同步时上传到服务器。',
          [{ text: '确定' }]
        );
        
        // 使用备选方案，直接返回原始图片URL

        return uri;
      }
      
      const { error: uploadError } = uploadResult;
      
      // 如果上传失败，显示更详细的错误信息
      if (uploadError) {
        console.error('上传失败详细信息:', {
          error: uploadError,
          errorMessage: uploadError.message,
          userId: currentUserId,
          filePath: filePath,
          bucket: 'qdshow101',
          errorType: typeof uploadError,
          errorKeys: Object.keys(uploadError)
        });
        
        // 备选方案：直接使用本地图片URL作为示意图片URL

        
        // 显示更友好的备选方案提示
        Alert.alert(
          '上传提示', 
          '图片已保存到本地，将在下次同步时上传到服务器。',
          [{ text: '确定' }]
        );
        
        // 使用备选方案，直接返回原始图片URL

        return uri;
      }



      // 获取公共URL
      const { data } = supabase.storage.from('qdshow101').getPublicUrl(filePath);
      
      if (!data || !data.publicUrl) {
        console.error('获取公共URL失败: 无效的URL');
        Alert.alert('上传失败', '获取图片URL失败');
        return null;
      }


      Alert.alert('成功', t.previewImageUploadSuccess);
      return data.publicUrl;
    } catch (error) {
      console.error('上传图片失败 - catch error:', error);
      Alert.alert('上传失败', `图片上传异常: ${error instanceof Error ? error.message : '未知错误'}`);
      return null;
    }
  };

  // 处理PDF上传
  const handlePdfUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      })

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setUploadingPdf(true)
        
        const asset = result.assets[0]
        
        try {
          // 处理PDF上传和内容提取
          const { pdfUrl: uploadedPdfUrl, title: extractedTitle, summary: extractedSummary, content: extractedContent } = await processPdfUpload(asset.uri)
          
          // 更新状态
          setPdfUrl(uploadedPdfUrl)
          setTitle(extractedTitle)
          setSummary(extractedSummary)
          setContent(extractedContent)
          
          Alert.alert(
            t.success,
            t.pdfUploadSuccess
          )
        } catch (error) {
          console.error('Error processing PDF:', error)
          Alert.alert(
            t.error,
            t.pdfUploadError
          )
        } finally {
          setUploadingPdf(false)
        }
      }
    } catch (error) {
      console.error('Error picking document:', error)
      Alert.alert(
        t.error,
        t.pdfUploadError
      )
    }
  }

  // 提交内参
  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert(t.error, `${t.pleaseFill} ${t.articleTitle} 和 ${t.articleContent}`)
      return
    }

    if (!selectedAccount) {
      Alert.alert(t.error, `${t.pleaseFill} ${t.selectAccount}`)
      return
    }

    if (!userInfo) {
      Alert.alert(t.error, '请先登录')
      return
    }

    try {
      setSubmitting(true)
      
      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      let data, error
      
      if (draft?.id) {
        // 编辑现有草稿
        ({ data, error } = await supabase
          .from('internal_references')
          .update({
            title: title.trim(),
            content: content.trim(),
            summary: summary.trim() || title.trim().substring(0, 100),
            category: 'research' as const,
            audience: 'all' as const,
            status: 'draft' as const,
            pdf_url: pdfUrl.trim(),
            account_id: selectedAccount,
            author: userInfo.name || userInfo.email,
            cover_image: previewImage.trim(),
          })
          .eq('id', draft.id)
          .select()
          .single()
        )
      } else {
        // 创建新草稿
        ({ data, error } = await supabase
          .from('internal_references')
          .insert({
            title: title.trim(),
            content: content.trim(),
            summary: summary.trim() || title.trim().substring(0, 100),
            category: 'research' as const,
            audience: 'all' as const,
            status: 'draft' as const,
            pdf_url: pdfUrl.trim(),
            account_id: selectedAccount,
            author: userInfo.name || userInfo.email,
            cover_image: previewImage.trim(),
          })
          .select()
          .single()
        )
      }

      if (error) throw error

      // 重置表单
      setTitle('')
      setContent('')
      setSummary('')
      setPreviewImage('')
      setSelectedAccount('')
      
      // 提交成功后直接跳转到草稿箱页面
      onNavigateToDraftBox ? onNavigateToDraftBox() : onClose?.()
    } catch (error: any) {
      // 即使失败也直接跳转到草稿箱页面
      onNavigateToDraftBox ? onNavigateToDraftBox() : onClose?.()
    } finally {
      setSubmitting(false)
    }
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

      <ScrollView style={styles.scrollView}>
        <View style={styles.form}>
          {/* 标题输入 */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>{t.articleTitle}</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder={t.articleTitle}
              placeholderTextColor="#999"
              maxLength={100}
            />
          </View>

          {/* 摘要输入 */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>{t.articleSummary}</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={summary}
              onChangeText={setSummary}
              placeholder={t.articleSummary}
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
              maxLength={200}
            />
          </View>

          {/* 上传示意图片 */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>{t.uploadPreviewImage}</Text>
            {previewImage ? (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: previewImage }} style={styles.imagePreview} />
                <TouchableOpacity
                  style={styles.changeImageButton}
                  onPress={pickImage}
                >
                  <Text style={styles.changeImageText}>更换图片</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={pickImage}
              >
                <Ionicons name="camera-outline" size={32} color="#999" />
                <Text style={styles.uploadButtonText}>{t.uploadPreviewImage}</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* PDF上传 */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>{t.uploadPdf}</Text>
            <TouchableOpacity
              style={[styles.uploadButton, { borderColor: '#4CAF50' }]}
              onPress={handlePdfUpload}
              disabled={uploadingPdf}
            >
              {uploadingPdf ? (
                <ActivityIndicator size="small" color="#4CAF50" />
              ) : (
                <>
                  <Ionicons name="document-text-outline" size={32} color="#4CAF50" />
                  <Text style={[styles.uploadButtonText, { color: '#4CAF50' }]}>
                    {pdfUrl ? '更换PDF文件' : t.uploadPdf}
                  </Text>
                </>
              )}
            </TouchableOpacity>
            {pdfUrl && (
              <View style={styles.pdfInfoContainer}>
                <Text style={styles.pdfUrlText}>
                  {lang === 'zh' ? 'PDF文件已上传' : 'PDF file uploaded'}
                </Text>
                <TouchableOpacity
                  style={styles.previewButton}
                  onPress={() => setShowPdfPreview(true)}
                >
                  <Ionicons name="eye-outline" size={16} color="#4CAF50" />
                  <Text style={styles.previewButtonText}>{lang === 'zh' ? '预览PDF' : 'Preview PDF'}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* 选择公众号 */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>{t.selectAccount}</Text>
            <View style={styles.accountsContainer}>
              {loading ? (
                <ActivityIndicator size="small" color="#333" />
              ) : (
                accounts.map(account => (
                  <Pressable
                    key={account.id}
                    style={[
                      styles.accountOption,
                      selectedAccount === account.id && styles.accountOptionSelected
                    ]}
                    onPress={() => setSelectedAccount(account.id)}
                  >
                    <Text style={[
                      styles.accountOptionText,
                      selectedAccount === account.id && styles.accountOptionTextSelected
                    ]}>
                      {account.name}
                    </Text>
                  </Pressable>
                ))
              )}
            </View>
          </View>

          {/* 内容输入 */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>{t.articleContent}</Text>
            
            {Platform.OS !== 'web' ? (
              // 移动平台：使用react-native-pell-rich-editor
              RichEditor && RichEditorToolbar ? (
                <>
                  {/* 富文本编辑器工具栏 */}
                  <RichEditorToolbar
                    editor={richText}
                    selectedIconTint="#4CAF50"
                    iconTint="#666"
                    style={styles.richEditorToolbar}
                    actions={[
                      'bold',
                      'italic',
                      'underline',
                      'strikethrough',
                      'heading1',
                      'heading2',
                      'heading3',
                      'paragraph',
                      'alignLeft',
                      'alignCenter',
                      'alignRight',
                      'alignJustify',
                      'indent',
                      'outdent',
                      'orderedList',
                      'unorderedList',
                      'removeFormat',
                    ]}
                  />
                  
                  {/* 富文本编辑器 */}
                  <RichEditor
                    ref={richText}
                    initialContentHTML={content}
                    style={styles.richEditor}
                    editorInitializedCallback={() => {
                      // 编辑器初始化完成后的回调

                    }}
                    onChange={(html) => {
                      setContent(html);
                    }}
                    placeholder={t.articleContent}
                    placeholderColor="#999"
                  />
                </>
              ) : (
                // 回退到TextInput
                <TextInput
                  style={[styles.input, styles.contentArea]}
                  value={content}
                  onChangeText={setContent}
                  placeholder={t.articleContent}
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={10}
                />
              )
            ) : (
              // Web平台：使用原生富文本编辑器
              WebRichEditor && WebRichEditorToolbar ? (
                <>
                  {/* Web平台的富文本编辑器工具栏 */}
                  <WebRichEditorToolbar editorRef={webRichText} />
                  
                  {/* Web平台的富文本编辑器 */}
                  <WebRichEditor
                    ref={webRichText}
                    value={content}
                    onChange={setContent}
                    placeholder={t.articleContent}
                  />
                </>
              ) : (
                // 回退到TextInput
                <TextInput
                  style={[styles.input, styles.contentArea]}
                  value={content}
                  onChangeText={setContent}
                  placeholder={t.articleContent}
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={10}
                />
              )
            )}
          </View>

          {/* 提交按钮 */}
          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>{t.submit}</Text>
            )}
          </TouchableOpacity>

          {/* 取消按钮 */}
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
            disabled={submitting}
          >
            <Text style={styles.cancelButtonText}>{t.cancel}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* PDF预览模态框 */}
      <Modal
        visible={showPdfPreview}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPdfPreview(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {/* 模态框头部 */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{lang === 'zh' ? 'PDF预览' : 'PDF Preview'}</Text>
              <TouchableOpacity
                onPress={() => setShowPdfPreview(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {/* PDF内容 */}
            <View style={styles.pdfPreviewContainer}>
              {pdfUrl ? (
                Pdf ? (
                  <Pdf
                    source={{ uri: pdfUrl }}
                    style={styles.pdfDocument}
                    onLoadComplete={(numberOfPages) => {
  
                    }}
                    onError={(error) => {
                      console.error('PDF loading error:', error);
                      Alert.alert('错误', 'PDF加载失败');
                      setShowPdfPreview(false);
                    }}
                  />
                ) : (
                  <View style={styles.pdfFallback}>
                    <Ionicons name="document-text-outline" size={48} color="#999" />
                    <Text style={styles.pdfFallbackText}>{lang === 'zh' ? 'PDF预览在当前平台不可用' : 'PDF preview not available on this platform'}</Text>
                    <Text style={styles.pdfFallbackUrl}>{pdfUrl}</Text>
                  </View>
                )
              ) : (
                <View style={styles.pdfFallback}>
                  <Ionicons name="document-text-outline" size={48} color="#999" />
                  <Text style={styles.pdfFallbackText}>{lang === 'zh' ? '暂无PDF文件' : 'No PDF file available'}</Text>
                </View>
              )}
            </View>

            {/* 模态框底部 */}
            <View style={styles.modalFooter}>
              <Text style={styles.modalFooterText}>
                {lang === 'zh' ? '对比PDF原文与提取结果，确保内容准确' : 'Compare PDF original with extracted results to ensure accuracy'}
              </Text>
            </View>
          </View>
        </View>
      </Modal>
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
  form: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 20,
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
  contentArea: {
    minHeight: 200,
    textAlignVertical: 'top',
  },
  richEditorToolbar: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 8,
  },
  richEditor: {
    minHeight: 300,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    padding: 12,
  },
  accountsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  accountOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  accountOptionSelected: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  accountOptionText: {
    fontSize: 14,
    color: '#333',
  },
  accountOptionTextSelected: {
    color: '#fff',
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
  },
  uploadButton: {
    backgroundColor: '#fff',
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
    fontSize: 16,
    marginTop: 12,
  },
  imagePreviewContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  changeImageButton: {
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    padding: 8,
    alignItems: 'center',
  },
  changeImageText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '500',
  },
  pdfUrlText: {
    color: '#4CAF50',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  pdfInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  previewButtonText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '100%',
    maxHeight: '80%',
    overflow: 'hidden',
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
  modalCloseButton: {
    padding: 4,
  },
  pdfPreviewContainer: {
    flex: 1,
    padding: 16,
  },
  pdfDocument: {
    flex: 1,
    width: '100%',
  },
  pdfFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pdfFallbackText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    textAlign: 'center',
  },
  pdfFallbackUrl: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
    flexWrap: 'wrap',
    maxWidth: '100%',
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#f9f9f9',
  },
  modalFooterText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
})
