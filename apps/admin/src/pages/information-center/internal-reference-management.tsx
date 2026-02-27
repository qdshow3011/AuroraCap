import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Table, Button, Space, Modal, Form, Input, Select, Tag, Spin, Alert, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, DownloadOutlined } from '@ant-design/icons';
import { supabaseClient } from '../../main';
import ReactQuill from 'react-quill';
import 'quill/dist/quill.snow.css';
import html2pdf from 'html2pdf.js';

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
  content: string;
  category: string;
  category_id?: string;
  account_id?: string;
  audience: 'all' | 'admin' | 'partner' | 'specific';
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  updated_at: string;
  published_at?: string;
}

const InternalReferenceManagement: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [references, setReferences] = useState<InternalReference[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [selectedReference, setSelectedReference] = useState<InternalReference | null>(null);
  const [searchText, setSearchText] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [accounts, setAccounts] = useState<OfficialAccount[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  
  // 根据当前路由确定显示的内容
  const getCurrentView = () => {
    const path = location.pathname;
    if (path.includes('/drafts')) {
      return 'drafts';
    } else if (path.includes('/published')) {
      return 'published';
    } else {
      return 'list';
    }
  };
  
  const currentView = getCurrentView();
  
  // 创建form实例
  const [form] = Form.useForm();
  const editorRef = useRef<any>(null);
  
  // 处理富文本编辑器内容变化
  const handleEditorChange = (content: string | null) => {
    form.setFieldsValue({ content });
  };
  
  // 监听选中的内参变化，更新表单值
  React.useEffect(() => {
    if (selectedReference) {
      form.setFieldsValue(selectedReference);
    }
  }, [selectedReference, form]);
  
  // 创建一个FormModal组件
  const FormModal = ({ categories }: { categories: Category[] }) => {
    return (
      <Form form={form} layout="vertical">
        <Form.Item
          name="title"
          label="标题"
          rules={[{ required: true, message: '请输入标题' }]}
        >
          <Input placeholder="请输入内参标题" />
        </Form.Item>
        <Form.Item
          name="content"
          label="内容"
          rules={[{ required: true, message: '请输入内容' }]}
          initialValue=""
        >
          <ReactQuill
            value={typeof form.getFieldValue('content') === 'string' ? form.getFieldValue('content') : ''}
            onChange={handleEditorChange}
            style={{ height: 500 }}
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
        <Form.Item
          name="category"
          label="分类"
          rules={[{ required: true, message: '请选择分类' }]}
        >
          <Select placeholder="请选择分类">
            {categories.map(category => (
              <Option key={category.id} value={category.name}>
                {category.name}
              </Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item
          name="category_id"
          label="分类ID"
          hidden
        >
          <Input />
        </Form.Item>
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
        <Form.Item
          name="status"
          label="状态"
          rules={[{ required: true, message: '请选择状态' }]}
        >
          <Select placeholder="请选择状态">
            <Option value="draft">草稿</Option>
            <Option value="published">已发布</Option>
            <Option value="archived">已归档</Option>
          </Select>
        </Form.Item>
      </Form>
    );
  };

  useEffect(() => {
    fetchReferences();
    fetchCategories();
    fetchAccounts();
  }, []);

  // 当视图或选中的公众号变化时重新获取数据
  useEffect(() => {
    fetchReferences();
  }, [currentView, selectedAccountId]);

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
    } finally {
      setAccountsLoading(false);
    }
  };

  const fetchReferences = async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabaseClient
        .from('internal_references')
        .select('*');

      // 根据当前视图筛选状态
      if (currentView === 'drafts') {
        query = query.eq('status', 'draft');
      } else if (currentView === 'published') {
        query = query.eq('status', 'published');
      }

      // 根据选中的公众号筛选
      if (selectedAccountId) {
        query = query.eq('account_id', selectedAccountId);
      }

      // 排序
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setReferences(data as InternalReference[]);
    } catch (err) {
      console.error('Failed to fetch internal references:', err);
      setError('获取内参数据失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    // 使用React Router的navigate方法进行客户端路由跳转，保持登录状态
    navigate('/information-center/internal-references/editor');
  };

  const handleEdit = (reference: InternalReference) => {
    // 使用React Router的navigate方法进行客户端路由跳转，保持登录状态
    navigate(`/information-center/internal-references/editor?id=${reference.id}`);
  };

  const handleDelete = (reference: InternalReference) => {
    setSelectedReference(reference);
    setIsDeleteModalVisible(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      
      // 确保category字段有值
      const finalValues = {
        ...values,
        category: values.category || 'other'
      };
      
      // 如果发布状态且没有发布时间，则设置当前时间
      if (finalValues.status === 'published' && !finalValues.published_at && !selectedReference?.published_at) {
        finalValues.published_at = new Date().toISOString();
      }
      
      if (selectedReference) {
        // 更新内参
        const { error } = await supabaseClient
          .from('internal_references')
          .update(finalValues)
          .eq('id', selectedReference.id);
        if (error) throw error;
      } else {
        // 创建新内参
        const { error } = await supabaseClient
          .from('internal_references')
          .insert(finalValues);
        if (error) throw error;
      }
      
      setIsModalVisible(false);
      fetchReferences();
      message.success('保存成功');
    } catch (err) {
      console.error('Failed to save internal reference:', err);
      setError('保存内参失败，请稍后重试');
      message.error('保存失败');
    }
  };

  const handleDeleteOk = async () => {
    if (!selectedReference) return;
    
    try {
      const { error } = await supabaseClient
        .from('internal_references')
        .delete()
        .eq('id', selectedReference.id);
      
      if (error) throw error;
      
      setIsDeleteModalVisible(false);
      fetchReferences();
      message.success('删除成功');
    } catch (err) {
      console.error('Failed to delete internal reference:', err);
      setError('删除内参失败，请稍后重试');
      message.error('删除失败');
    }
  };
  
  // 处理内参文章转化为PDF功能
  const handleExportToPdf = (reference: InternalReference) => {
    try {
      // 创建一个包含内参标题和内容的HTML元素
      const pdfElement = document.createElement('div');
      pdfElement.style.padding = '20px';
      pdfElement.style.maxWidth = '800px';
      pdfElement.style.margin = '0 auto';
      
      // 添加标题
      const titleElement = document.createElement('h1');
      titleElement.textContent = reference.title;
      titleElement.style.textAlign = 'center';
      titleElement.style.marginBottom = '20px';
      pdfElement.appendChild(titleElement);
      
      // 添加内容
      const contentElement = document.createElement('div');
      contentElement.innerHTML = reference.content;
      contentElement.style.lineHeight = '1.6';
      pdfElement.appendChild(contentElement);
      
      // 配置PDF选项
      const opt = {
        margin: 10,
        filename: `${reference.title}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
      };
      
      // 生成PDF并下载
      html2pdf().set(opt).from(pdfElement).save();
      message.success('PDF导出成功');
    } catch (err) {
      console.error('Failed to export internal reference to PDF:', err);
      message.error('PDF导出失败，请稍后重试');
    }
  };

  const getCategoryText = (category: string, category_id?: string) => {
    // 首先尝试使用category_id从数据库获取的分类中查找
    if (category_id) {
      const foundCategory = categories.find(c => c.id === category_id);
      if (foundCategory) {
        return foundCategory.name;
      }
    }
    
    // 然后尝试使用category字段查找
    const foundCategory = categories.find(c => c.id === category || c.name === category);
    if (foundCategory) {
      return foundCategory.name;
    }
    
    // 保留原有映射作为后备
    const categoryMap: Record<string, string> = {
      research: '研究报告',
      analysis: '分析评论',
      strategy: '投资策略',
      report: '业绩报告',
      other: '其他'
    };
    return categoryMap[category] || category;
  };

  const getAccountText = (account_id?: string) => {
    if (!account_id) {
      return '未关联公众号';
    }
    
    // 从数据库获取的公众号中查找
    const foundAccount = accounts.find(a => a.id === account_id);
    if (foundAccount) {
      return foundAccount.name;
    }
    
    return '未知公众号';
  };

  const getAudienceText = (audience: string) => {
    const audienceMap: Record<string, string> = {
      all: '全部用户',
      admin: '管理员',
      partner: '合伙人',
      specific: '特定用户'
    };
    return audienceMap[audience] || audience;
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, { text: string; color: string }> = {
      draft: { text: '草稿', color: 'default' },
      published: { text: '已发布', color: 'green' },
      archived: { text: '已归档', color: 'red' }
    };
    return statusMap[status] || { text: status, color: 'default' };
  };

  // 处理发表内参功能
  const handlePublish = async (reference: InternalReference) => {
    try {
      const { error } = await supabaseClient
        .from('internal_references')
        .update({
          status: 'published',
          published_at: new Date().toISOString()
        })
        .eq('id', reference.id);

      if (error) throw error;

      fetchReferences();
      message.success('内参发表成功');
    } catch (err) {
      console.error('Failed to publish internal reference:', err);
      message.error('发表失败，请稍后重试');
    }
  };

  // 根据当前视图动态生成列
  const getColumns = () => {
    const baseColumns: any[] = [
      {
        title: '标题',
        dataIndex: 'title',
        key: 'title',
        ellipsis: true,
        width: 250,
      },
      {
        title: '分类',
        dataIndex: 'category',
        key: 'category',
        render: (_: string, record: InternalReference) => getCategoryText(record.category, record.category_id),
      },
      {
        title: '公众号',
        dataIndex: 'account_id',
        key: 'account_id',
        render: (_: string, record: InternalReference) => getAccountText(record.account_id),
      },
      {
        title: '受众',
        dataIndex: 'audience',
        key: 'audience',
        render: (audience: string) => getAudienceText(audience),
      },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        render: (status: string) => {
          const { text, color } = getStatusText(status);
          return <Tag color={color}>{text}</Tag>;
        },
      },
      {
        title: '创建时间',
        dataIndex: 'created_at',
        key: 'created_at',
        render: (time: string) => new Date(time).toLocaleString(),
      },
    ];

    // 非草稿箱视图显示发布时间列
    if (currentView !== 'drafts') {
      baseColumns.push({
        title: '发布时间',
        dataIndex: 'published_at',
        key: 'published_at',
        render: (time?: string) => time ? new Date(time).toLocaleString() : '-',
      });
    }

    // 添加操作列
    baseColumns.push({
      title: '操作',
      key: 'action',
      render: (_: any, record: InternalReference) => (
        <Space size="middle">
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          
          {/* 草稿箱视图不显示导出PDF按钮，显示发表按钮 */}
          {currentView === 'drafts' ? (
            <Button type="primary" onClick={() => handlePublish(record)}>
              发表
            </Button>
          ) : (
            <Button type="link" icon={<DownloadOutlined />} onClick={() => handleExportToPdf(record)}>
              导出PDF
            </Button>
          )}
          
          <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)}>
            删除
          </Button>
        </Space>
      ),
    });

    return baseColumns;
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1>
          {currentView === 'list' && '内参列表'}
          {currentView === 'drafts' && '草稿箱'}
          {currentView === 'published' && '发布记录'}
        </h1>
        <Space>
          <Select
            placeholder="选择公众号"
            loading={accountsLoading}
            style={{ width: 200 }}
            value={selectedAccountId}
            onChange={setSelectedAccountId}
            allowClear
          >
            {accounts.map(account => (
              <Option key={account.id} value={account.id}>
                {account.name}
              </Option>
            ))}
          </Select>
          <Input
            placeholder="搜索内参"
            prefix={<SearchOutlined />}
            style={{ width: 200 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          {currentView !== 'published' && (
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新增内参
            </Button>
          )}
        </Space>
      </div>

      {error && <Alert message="错误" description={error} type="error" showIcon style={{ marginBottom: 24 }} />}

      <Spin spinning={loading}>
        <Table
          dataSource={references}
          columns={getColumns()}
          rowKey="id"
          bordered
          pagination={{ pageSizeOptions: ['10', '20', '50'], showSizeChanger: true, showTotal: (total) => `共 ${total} 条记录` }}
          scroll={{ x: 900 }}
        />
      </Spin>

      <Modal
        title={selectedReference ? '编辑内参' : '新增内参'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => setIsModalVisible(false)}
        destroyOnHidden
        centered
        width={700}
      >
        {/* 使用新创建的FormModal组件 */}
        <FormModal categories={categories} />
      </Modal>

      <Modal
        title="确认删除"
        open={isDeleteModalVisible}
        onOk={handleDeleteOk}
        onCancel={() => setIsDeleteModalVisible(false)}
        destroyOnHidden
        centered
        okText="删除"
        cancelText="取消"
        okType="danger"
      >
        <p>确定要删除内参 <strong>{selectedReference?.title}</strong> 吗？此操作不可恢复。</p>
      </Modal>
    </div>
  );
};

export default InternalReferenceManagement;