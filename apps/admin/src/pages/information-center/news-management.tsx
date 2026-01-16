import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, Tag, Spin, Alert, message, Badge } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, SyncOutlined, PlayCircleOutlined, StopOutlined } from '@ant-design/icons';
import { supabaseClient } from '../../main';

const { Option } = Select;
const { TextArea } = Input;

interface News {
  id: string;
  new_id?: number;
  title: string;
  content: string;
  category: 'market' | 'company' | 'industry' | 'other';
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  updated_at: string;
  published_at?: string;
}

const NewsManagement: React.FC = () => {
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [selectedNews, setSelectedNews] = useState<News | null>(null);
  const [searchText, setSearchText] = useState('');
  const [schedulerRunning, setSchedulerRunning] = useState(false);
  const [schedulerLoading, setSchedulerLoading] = useState(false);
  
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
          <Input placeholder="请输入快讯标题" />
        </Form.Item>
        <Form.Item
          name="content"
          label="内容"
          rules={[{ required: true, message: '请输入内容' }]}
        >
          <TextArea rows={6} placeholder="请输入快讯内容" />
        </Form.Item>
        <Form.Item
          name="category"
          label="分类"
          rules={[{ required: true, message: '请选择分类' }]}
        >
          <Select placeholder="请选择分类">
            <Option value="market">市场动态</Option>
            <Option value="company">公司新闻</Option>
            <Option value="industry">行业资讯</Option>
            <Option value="other">其他</Option>
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
    fetchNews();
    fetchSchedulerStatus();
  }, []);

  const fetchSchedulerStatus = async () => {
    try {
      const response = await fetch('http://localhost:3003/api/news/scheduler/status');
      const result = await response.json();
      
      if (result.success) {
        setSchedulerRunning(result.isRunning);
      }
    } catch (err) {
      console.error('Failed to fetch scheduler status:', err);
    }
  };

  const handleStartScheduler = async () => {
    setSchedulerLoading(true);
    try {
      const response = await fetch('http://localhost:3003/api/news/scheduler/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.success) {
        message.success(result.message);
        setSchedulerRunning(true);
      } else {
        throw new Error(result.error || '启动失败');
      }
    } catch (err) {
      console.error('Failed to start scheduler:', err);
      message.error('启动采集任务失败');
    } finally {
      setSchedulerLoading(false);
    }
  };

  const handleStopScheduler = async () => {
    setSchedulerLoading(true);
    try {
      const response = await fetch('http://localhost:3003/api/news/scheduler/stop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.success) {
        message.success(result.message);
        setSchedulerRunning(false);
      } else {
        throw new Error(result.error || '停止失败');
      }
    } catch (err) {
      console.error('Failed to stop scheduler:', err);
      message.error('停止采集任务失败');
    } finally {
      setSchedulerLoading(false);
    }
  };

  const fetchNews = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabaseClient
        .from('news')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNews(data as News[]);
    } catch (err) {
      console.error('Failed to fetch news:', err);
      setError('获取快讯数据失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncNews = async () => {
    setSyncing(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:3003/api/news/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category: 'general',
          limit: 20
        })
      });

      const result = await response.json();

      if (result.success) {
        message.success(`成功同步 ${result.saved} 条新闻`);
        fetchNews();
      } else {
        throw new Error(result.error || '同步失败');
      }
    } catch (err) {
      console.error('Failed to sync news:', err);
      setError('同步新闻失败，请稍后重试');
      message.error('同步失败');
    } finally {
      setSyncing(false);
    }
  };

  const handleAdd = () => {
    setSelectedNews(null);
    // 等待Modal渲染后重置字段
    setIsModalVisible(true);
    // 使用setTimeout确保FormModal已经渲染
    setTimeout(() => {
      if (formRef.current) {
        formRef.current.resetFields();
      }
    }, 0);
  };

  const handleEdit = (newsItem: News) => {
    setSelectedNews(newsItem);
    setIsModalVisible(true);
    // 使用setTimeout确保FormModal已经渲染
    setTimeout(() => {
      if (formRef.current) {
        formRef.current.setFieldsValue(newsItem);
      }
    }, 0);
  };

  const handleDelete = (newsItem: News) => {
    setSelectedNews(newsItem);
    setIsDeleteModalVisible(true);
  };

  const handleModalOk = async () => {
    try {
      if (!formRef.current) return;
      const values = await formRef.current.validateFields();
      
      // 如果发布状态且没有发布时间，则设置当前时间
      if (values.status === 'published' && !values.published_at && !selectedNews?.published_at) {
        values.published_at = new Date().toISOString();
      }
      
      if (selectedNews) {
        // 更新快讯
        const { error } = await supabaseClient
          .from('news')
          .update(values)
          .eq('id', selectedNews.id);
        if (error) throw error;
      } else {
        // 创建新快讯
        const { error } = await supabaseClient
          .from('news')
          .insert(values);
        if (error) throw error;
      }
      
      setIsModalVisible(false);
      fetchNews();
      message.success('保存成功');
    } catch (err) {
      console.error('Failed to save news:', err);
      setError('保存快讯失败，请稍后重试');
      message.error('保存失败');
    }
  };

  const handleDeleteOk = async () => {
    if (!selectedNews) return;
    
    try {
      const { error } = await supabaseClient
        .from('news')
        .delete()
        .eq('id', selectedNews.id);
      
      if (error) throw error;
      
      setIsDeleteModalVisible(false);
      fetchNews();
      message.success('删除成功');
    } catch (err) {
      console.error('Failed to delete news:', err);
      setError('删除快讯失败，请稍后重试');
      message.error('删除失败');
    }
  };

  const getCategoryText = (category: string) => {
    const categoryMap: Record<string, string> = {
      market: '市场动态',
      company: '公司新闻',
      industry: '行业资讯',
      other: '其他'
    };
    return categoryMap[category] || category;
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
      dataIndex: 'new_id',
      key: 'new_id',
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
      render: (_: any, record: News) => (
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
        <h1>快讯管理</h1>
        <Space>
          <Input
            placeholder="搜索快讯"
            prefix={<SearchOutlined />}
            style={{ width: 200 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <Badge 
            status={schedulerRunning ? 'processing' : 'default'} 
            text={schedulerRunning ? '自动采集中' : '自动采集已停止'}
          />
          {schedulerRunning ? (
            <Button 
              type="default" 
              danger
              icon={<StopOutlined />} 
              onClick={handleStopScheduler}
              loading={schedulerLoading}
            >
              停止采集
            </Button>
          ) : (
            <Button 
              type="default" 
              icon={<PlayCircleOutlined />} 
              onClick={handleStartScheduler}
              loading={schedulerLoading}
            >
              重新启动
            </Button>
          )}
          <Button 
            type="default" 
            icon={<SyncOutlined />} 
            onClick={handleSyncNews}
            loading={syncing}
          >
            同步数据
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增快讯
          </Button>
        </Space>
      </div>

      {error && <Alert message="错误" description={error} type="error" showIcon style={{ marginBottom: 24 }} />}

      <Spin spinning={loading}>
        <Table
          dataSource={news}
          columns={columns}
          rowKey="id"
          bordered
          pagination={{ pageSizeOptions: ['10', '20', '50'], showSizeChanger: true, showTotal: (total) => `共 ${total} 条记录` }}
          scroll={{ x: 800 }}
        />
      </Spin>

      <Modal
        title={selectedNews ? '编辑快讯' : '新增快讯'}
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
        <p>确定要删除快讯 <strong>{selectedNews?.title}</strong> 吗？此操作不可恢复。</p>
      </Modal>
    </div>
  );
};

export default NewsManagement;