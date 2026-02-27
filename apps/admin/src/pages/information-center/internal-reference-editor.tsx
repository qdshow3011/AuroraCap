import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Form, Input, Select, Upload, Button, Space, Alert, message, Spin } from 'antd';
import { SaveOutlined, EyeOutlined, SendOutlined, ArrowLeftOutlined, UploadOutlined } from '@ant-design/icons';
import { supabaseClient } from '../../main';
import ReactQuill from 'react-quill';
import 'quill/dist/quill.snow.css';

const { Option } = Select;
const { TextArea } = Input;

interface Category {
  id: string;
  name: string;
}

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

interface InternalReference {
  id: string;
  title: string;
  author: string;
  content: string;
  summary: string;
  cover_image: string;
  account_id?: string;
  category: string;
  category_id?: string;
  audience: 'all' | 'admin' | 'partner' | 'specific';
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  updated_at: string;
  published_at?: string;
}

const InternalReferenceEditor: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [accounts, setAccounts] = useState<OfficialAccount[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const editorRef = useRef<any>(null);
  
  // 获取URL参数中的id，用于编辑现有内参
  const params = new URLSearchParams(location.search);
  const referenceId = params.get('id');

  useEffect(() => {
    // 加载分类数据
    fetchCategories();
    // 加载公众号数据
    fetchAccounts();
    
    // 如果是编辑模式，加载现有内参数据
    if (referenceId) {
      loadReferenceData();
    }
  }, [referenceId]);

  const fetchCategories = async () => {
    setCategoriesLoading(true);
    try {
      const { data, error } = await supabaseClient
        .from('internal_reference_categories')
        .select('id, name')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setCategories(data as Category[]);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
      message.error('获取分类数据失败，请稍后重试');
    } finally {
      setCategoriesLoading(false);
    }
  };

  const fetchAccounts = async () => {
    setAccountsLoading(true);
    try {
      const { data, error } = await supabaseClient
        .from('wechat_official_accounts')
        .select('id, name')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAccounts(data as OfficialAccount[]);
    } catch (err) {
      console.error('Failed to fetch accounts:', err);
      message.error('获取公众号数据失败，请稍后重试');
    } finally {
      setAccountsLoading(false);
    }
  };

  const loadReferenceData = async () => {
    if (!referenceId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabaseClient
        .from('internal_references')
        .select('*')
        .eq('id', referenceId)
        .single();

      if (error) throw error;
      
      // 确保content字段是字符串
      const safeData = {
        ...data,
        content: typeof data.content === 'string' ? data.content : ''
      };
      
      form.setFieldsValue(safeData);
      if (data.cover_image) {
        setPreviewImage(data.cover_image);
      }
    } catch (err) {
      console.error('Failed to load internal reference:', err);
      setError('加载内参数据失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    try {
      console.log('Starting to save draft...');
      
      // 手动从编辑器获取内容
      if (editorRef.current?.editor) {
        const content = editorRef.current.editor.getContent();
        console.log('Got editor content, length:', content.length);
        // 更新Form的content字段
        form.setFieldsValue({ content });
      }
      
      console.log('Validating form fields...');
      const values = await form.validateFields();
      console.log('Form validation successful, values:', values);
      
      setLoading(true);
      
      // 保存为草稿
      const draftValues = {
        ...values,
        status: 'draft' as const,
        // 确保category字段有值
        category: values.category || 'other',
        // 确保category_id字段有值
        category_id: values.category_id,
        // 确保account_id字段有值
        account_id: values.account_id
      };

      console.log('Saving draft with values:', draftValues);

      let result;
      if (referenceId) {
        // 更新现有内参
        console.log('Updating existing reference:', referenceId);
        result = await supabaseClient
          .from('internal_references')
          .update(draftValues)
          .eq('id', referenceId);
      } else {
        // 创建新内参
        console.log('Creating new reference');
        result = await supabaseClient
          .from('internal_references')
          .insert(draftValues);
      }

      console.log('Save draft result:', result);

      if (result.error) {
        console.error('Save draft error:', result.error);
        throw result.error;
      }
      
      console.log('Draft saved successfully');
      message.success('已保存为草稿');
      navigate('/information-center/internal-references/drafts');
    } catch (err) {
      console.error('Failed to save draft:', err);
      message.error('保存草稿失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async () => {
    try {
      // 手动从编辑器获取内容
      if (editorRef.current?.editor) {
        const content = editorRef.current.editor.getContent();
        // 更新Form的content字段
        form.setFieldsValue({ content });
      }
      
      const values = await form.validateFields();
      
      // 创建预览窗口
      const previewWindow = window.open('', '_blank', 'width=800,height=1000,scrollbars=yes');
      if (!previewWindow) {
        message.error('无法打开预览窗口，请检查浏览器设置');
        return;
      }
      
      // 构建预览HTML
      const previewHtml = `
        <!DOCTYPE html>
        <html lang="zh-CN">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${values.title} - 预览</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f5f5f5;
            }
            .preview-container {
              background-color: white;
              padding: 40px;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            h1 {
              font-size: 28px;
              font-weight: 600;
              margin-bottom: 16px;
              line-height: 1.3;
            }
            .meta-info {
              display: flex;
              align-items: center;
              margin-bottom: 24px;
              color: #666;
              font-size: 14px;
            }
            .author {
              margin-right: 24px;
            }
            .cover-image {
              width: 100%;
              height: auto;
              max-height: 400px;
              object-fit: cover;
              border-radius: 8px;
              margin-bottom: 24px;
            }
            .summary {
              font-size: 16px;
              line-height: 1.6;
              margin-bottom: 32px;
              padding-bottom: 20px;
              border-bottom: 1px solid #e8e8e8;
            }
            .content {
              font-size: 16px;
              line-height: 1.8;
            }
            .content img {
              max-width: 100%;
              height: auto;
            }
            .content p {
              margin-bottom: 16px;
            }
            .content h2 {
              font-size: 22px;
              margin-top: 32px;
              margin-bottom: 16px;
            }
            .content h3 {
              font-size: 18px;
              margin-top: 24px;
              margin-bottom: 12px;
            }
          </style>
        </head>
        <body>
          <div class="preview-container">
            <h1>${values.title}</h1>
            <div class="meta-info">
              <span class="author">作者：${values.author}</span>
              <span class="date">${new Date().toLocaleDateString()}</span>
            </div>
            ${values.cover_image ? `<img class="cover-image" src="${values.cover_image}" alt="封面图片">` : ''}
            <div class="summary">${values.summary}</div>
            <div class="content">${values.content}</div>
          </div>
        </body>
        </html>
      `;
      
      // 写入预览窗口
      previewWindow.document.write(previewHtml);
      previewWindow.document.close();
      
    } catch (err) {
      console.error('Failed to preview:', err);
      message.error('预览失败，请稍后重试');
    }
  };

  const handlePublish = async () => {
    try {
      // 手动从编辑器获取内容
      if (editorRef.current?.editor) {
        const content = editorRef.current.editor.getContent();
        // 更新Form的content字段
        form.setFieldsValue({ content });
      }
      
      const values = await form.validateFields();
      setLoading(true);
      
      // 发布内参
      const publishValues = {
        ...values,
        status: 'published' as const,
        published_at: new Date().toISOString(),
        // 确保category字段有值
        category: values.category || 'other',
        // 确保category_id字段有值
        category_id: values.category_id,
        // 确保account_id字段有值
        account_id: values.account_id
      };

      console.log('Publishing internal reference:', publishValues);

      let result;
      if (referenceId) {
        // 更新现有内参
        console.log('Updating existing reference:', referenceId);
        result = await supabaseClient
          .from('internal_references')
          .update(publishValues)
          .eq('id', referenceId);
      } else {
        // 创建新内参
        console.log('Creating new reference');
        result = await supabaseClient
          .from('internal_references')
          .insert(publishValues);
      }

      console.log('Publish result:', result);

      if (result.error) {
        console.error('Publish error:', result.error);
        throw result.error;
      }
      
      message.success('发布成功');
      console.log('Navigating to published records');
      navigate('/information-center/internal-references/published');
    } catch (err) {
      console.error('Failed to publish:', err);
      message.error('发布失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file: any) => {
    try {
      console.log('Uploading file:', file);
      
      // 检查文件对象
      if (!file || !file.file) {
        throw new Error('文件对象无效');
      }
      
      // 生成唯一文件名
      const originalName = file.name || 'unknown';
      const fileName = `neican/${Date.now()}_${originalName.replace(/\s+/g, '_')}`;
      console.log('Uploading to:', fileName);
      
      // 上传到Supabase Storage
      const { data, error } = await supabaseClient
        .storage
        .from('qdshow101')
        .upload(fileName, file.file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (error) {
        console.error('Upload error:', error);
        throw error;
      }
      
      console.log('Upload success:', data);
      
      // 获取上传后的文件URL
      const { data: urlData } = await supabaseClient
        .storage
        .from('qdshow101')
        .getPublicUrl(fileName);
      
      const coverUrl = urlData.publicUrl;
      console.log('File URL:', coverUrl);
      
      // 更新预览和表单值
      setPreviewImage(coverUrl);
      form.setFieldsValue({ cover_image: coverUrl });
      
      return Promise.resolve({ status: 'done', url: coverUrl });
    } catch (error) {
      console.error('Upload failed:', error);
      return Promise.reject(new Error('上传失败，请稍后重试'));
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* 顶部导航栏 */}
      <div style={{ 
        backgroundColor: '#fff', 
        borderBottom: '1px solid #e8e8e8', 
        padding: '0 24px', 
        height: 64, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate('/information-center/internal-references/list')}
            style={{ marginRight: 16 }}
          >
            返回
          </Button>
          <h1 style={{ margin: 0, fontSize: 18 }}>
            {referenceId ? '编辑内参' : '写新内参'}
          </h1>
        </div>
        <Space>
          <Button 
            icon={<SaveOutlined />} 
            onClick={handleSaveDraft}
            loading={loading}
          >
            保存为草稿
          </Button>
          <Button 
            icon={<EyeOutlined />} 
            onClick={handlePreview}
            loading={loading}
          >
            预览
          </Button>
          <Button 
            type="primary" 
            icon={<SendOutlined />} 
            onClick={handlePublish}
            loading={loading}
          >
            发表
          </Button>
        </Space>
      </div>

      {/* 编辑区域 */}
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: 24, backgroundColor: '#fff', minHeight: 'calc(100vh - 64px)' }}>
        {error && <Alert message="错误" description={error} type="error" showIcon style={{ marginBottom: 24 }} />}
        
        <Spin spinning={loading}>
          <Form form={form} layout="vertical">
            {/* 标题 */}
            <Form.Item
              name="title"
              label="标题"
              rules={[{ required: true, message: '请输入标题' }]}
            >
              <Input 
                placeholder="请输入内参标题" 
                style={{ fontSize: 20, padding: '12px 16px' }}
              />
            </Form.Item>

            {/* 作者 */}
            <Form.Item
              name="author"
              label="作者"
              rules={[{ required: true, message: '请输入作者' }]}
            >
              <Input placeholder="请输入作者" />
            </Form.Item>

            {/* 封面图片 */}
            <Form.Item
              name="cover_image"
              label="封面图片"
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Upload
                  customRequest={handleUpload}
                  listType="picture-card"
                  showUploadList={false}
                  maxCount={1}
                  fileList={previewImage ? [{ url: previewImage }] : []}
                  style={{ width: 'fit-content' }}
                >
                  {previewImage ? (
                    <div 
                      style={{
                        width: 200, 
                        height: 200,
                        borderRadius: 8,
                        overflow: 'hidden',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                        transition: 'all 0.3s ease',
                        position: 'relative'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.25)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <img src={previewImage} alt="封面" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div 
                        style={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          backgroundColor: 'rgba(0, 0, 0, 0.6)',
                          color: '#fff',
                          padding: '2px 8px',
                          borderRadius: 8,
                          fontSize: 10,
                          opacity: 0,
                          transition: 'opacity 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.opacity = 1;
                        }}
                      >
                        点击更换
                      </div>
                    </div>
                  ) : (
                    <div 
                      style={{
                        width: 200, 
                        height: 200,
                        padding: '40px 0', 
                        textAlign: 'center', 
                        border: '2px dashed #d9d9d9', 
                        borderRadius: 8,
                        transition: 'all 0.3s ease',
                        backgroundColor: '#fafafa'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#1890ff';
                        e.currentTarget.style.backgroundColor = '#f0f8ff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#d9d9d9';
                        e.currentTarget.style.backgroundColor = '#fafafa';
                      }}
                    >
                      <div style={{ marginBottom: 12 }}>
                        <UploadOutlined style={{ fontSize: 16, color: '#999', marginBottom: 12 }} />
                      </div>
                      <p style={{ marginBottom: 6, fontSize: 14, color: '#333', fontWeight: 500 }}>上传封面图片</p>
                      <p style={{ color: '#999', fontSize: 10, lineHeight: 1.4 }}>
                        建议尺寸：400×400px<br />
                        支持格式：JPG、PNG、WebP<br />
                        最大文件大小：5MB
                      </p>
                    </div>
                  )}
                </Upload>
                {previewImage && (
                  <Button 
                    danger 
                    type="text" 
                    size="small"
                    onClick={() => {
                      setPreviewImage('');
                      form.setFieldsValue({ cover_image: '' });
                    }}
                    style={{ width: 200, textAlign: 'left', padding: 0 }}
                  >
                    移除封面图片
                  </Button>
                )}
              </div>
            </Form.Item>

            {/* 摘要 */}
            <Form.Item
              name="summary"
              label="摘要"
              rules={[{ required: true, message: '请输入摘要' }]}
            >
              <TextArea 
                placeholder="请输入内参摘要"
                rows={3}
              />
            </Form.Item>

            {/* 分类 */}
            <Form.Item
              name="category_id"
              label="分类"
              rules={[{ required: true, message: '请选择分类' }]}
            >
              <Select 
                placeholder="请选择分类"
                loading={categoriesLoading}
              >
                {categories.map(category => (
                  <Option key={category.id} value={category.id}>
                    {category.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            {/* 公众号 */}
            <Form.Item
              name="account_id"
              label="公众号"
              rules={[{ required: true, message: '请选择公众号' }]}
            >
              <Select 
                placeholder="请选择公众号"
                loading={accountsLoading}
              >
                {accounts.map(account => (
                  <Option key={account.id} value={account.id}>
                    {account.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            {/* 受众 */}
            <Form.Item
              name="audience"
              label="受众"
              rules={[{ required: true, message: '请选择受众' }]}
            >
              <Select placeholder="请选择受众">
                <Option value="all">全部用户</Option>
                <Option value="admin">管理员</Option>
                <Option value="partner">合伙人</Option>
                <Option value="specific">特定用户</Option>
              </Select>
            </Form.Item>

            {/* 正文 */}
            <Form.Item
              name="content"
              label="正文"
              rules={[{ required: true, message: '请输入内容' }]}
              initialValue=""
            >
              <ReactQuill
                value={form.getFieldValue('content') || ''}
                onChange={(content) => form.setFieldsValue({ content })}
                style={{ height: 600 }}
                modules={{
                  toolbar: [
                    ['bold', 'italic', 'underline', 'strike'],
                    ['blockquote', 'code-block'],
                    [{ 'header': 1 }, { 'header': 2 }],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    [{ 'indent': '-1'}, { 'indent': '+1' }],
                    [{ 'direction': 'rtl' }],
                    [{ 'size': ['small', false, 'large', 'huge'] }],
                    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                    [{ 'color': [] }, { 'background': [] }],
                    [{ 'font': [] }],
                    [{ 'align': [] }],
                    ['clean'],
                    ['link', 'image', 'video']
                  ]
                }}
                formats={[
                  'header', 'bold', 'italic', 'underline', 'strike', 'blockquote',
                  'list', 'bullet', 'indent', 'link', 'image', 'video', 'code-block',
                  'size', 'color', 'background', 'font', 'align'
                ]}
              />
            </Form.Item>
          </Form>
        </Spin>
      </div>
    </div>
  );
};

export default InternalReferenceEditor;