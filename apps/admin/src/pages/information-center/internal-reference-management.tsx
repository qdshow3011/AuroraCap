import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, Tag, Spin, Alert, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { supabaseClient } from '../../main';

const { Option } = Select;
const { TextArea } = Input;

interface InternalReference {
  id: string;
  title: string;
  content: string;
  category: 'research' | 'analysis' | 'strategy' | 'report' | 'other';
  audience: 'all' | 'admin' | 'partner' | 'specific';
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  updated_at: string;
  published_at?: string;
}

const InternalReferenceManagement: React.FC = () => {
  const [references, setReferences] = useState<InternalReference[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [selectedReference, setSelectedReference] = useState<InternalReference | null>(null);
  const [searchText, setSearchText] = useState('');
  
  // 将form实例提升到组件作用域，使用useRef存储
  const formRef = React.useRef<any>();
  
  // 创建一个FormModal组件，在内部使用useForm
  const FormModal = () => {
    const [form] = Form.useForm();
    
    // 将form实例保存到ref中，供父组件使用
    React.useEffect(() => {
      formRef.current = form;
    }, [form]);
    
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
        >
          <TextArea rows={6} placeholder="请输入内参内容" />
        </Form.Item>
        <Form.Item
          name="category"
          label="分类"
          rules={[{ required: true, message: '请选择分类' }]}
        >
          <Select placeholder="请选择分类">
            <Option value="research">研究报告</Option>
            <Option value="analysis">分析评论</Option>
            <Option value="strategy">投资策略</Option>
            <Option value="report">业绩报告</Option>
            <Option value="other">其他</Option>
          </Select>
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
  }, []);

  const fetchReferences = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabaseClient
        .from('internal_references')
        .select('*')
        .order('created_at', { ascending: false });

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
    setSelectedReference(null);
    // 等待Modal渲染后重置字段
    setIsModalVisible(true);
    // 使用setTimeout确保FormModal已经渲染
    setTimeout(() => {
      if (formRef.current) {
        formRef.current.resetFields();
      }
    }, 0);
  };

  const handleEdit = (reference: InternalReference) => {
    setSelectedReference(reference);
    setIsModalVisible(true);
    // 使用setTimeout确保FormModal已经渲染
    setTimeout(() => {
      if (formRef.current) {
        formRef.current.setFieldsValue(reference);
      }
    }, 0);
  };

  const handleDelete = (reference: InternalReference) => {
    setSelectedReference(reference);
    setIsDeleteModalVisible(true);
  };

  const handleModalOk = async () => {
    try {
      if (!formRef.current) return;
      const values = await formRef.current.validateFields();
      
      // 如果发布状态且没有发布时间，则设置当前时间
      if (values.status === 'published' && !values.published_at && !selectedReference?.published_at) {
        values.published_at = new Date().toISOString();
      }
      
      if (selectedReference) {
        // 更新内参
        const { error } = await supabaseClient
          .from('internal_references')
          .update(values)
          .eq('id', selectedReference.id);
        if (error) throw error;
      } else {
        // 创建新内参
        const { error } = await supabaseClient
          .from('internal_references')
          .insert(values);
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

  const getCategoryText = (category: string) => {
    const categoryMap: Record<string, string> = {
      research: '研究报告',
      analysis: '分析评论',
      strategy: '投资策略',
      report: '业绩报告',
      other: '其他'
    };
    return categoryMap[category] || category;
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

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
    },
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
      render: (category: string) => getCategoryText(category),
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
    {
      title: '发布时间',
      dataIndex: 'published_at',
      key: 'published_at',
      render: (time?: string) => time ? new Date(time).toLocaleString() : '-',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: InternalReference) => (
        <Space size="middle">
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1>内参管理</h1>
        <Space>
          <Input
            placeholder="搜索内参"
            prefix={<SearchOutlined />}
            style={{ width: 200 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增内参
          </Button>
        </Space>
      </div>

      {error && <Alert message="错误" description={error} type="error" showIcon style={{ marginBottom: 24 }} />}

      <Spin spinning={loading}>
        <Table
          dataSource={references}
          columns={columns}
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
        <FormModal />
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