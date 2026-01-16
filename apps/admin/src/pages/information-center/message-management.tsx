import React, { useState, useEffect } from 'react';
import { Button, Card, Table, Spin, message, Modal, Form, Input, Select, Space, Popconfirm, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, MessageOutlined, EyeOutlined } from '@ant-design/icons';
import { supabaseClient } from '../../main';

// 定义消息类型
interface SystemMessage {
  id: string;
  content: string;
  category: string;
  audience_type: string;
  user_id?: string;
  created_by: string;
  created_at: string;
}

// 定义消息状态类型
interface SystemMessageStatus {
  id: string;
  message_id: string;
  user_id: string;
  is_read: boolean;
  read_at?: string;
}

// 定义用户类型
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

const MessageManagement: React.FC = () => {
  // 状态管理
  const [messages, setMessages] = useState<SystemMessage[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [selectedMessage, setSelectedMessage] = useState<SystemMessage | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [form] = Form.useForm();
  const [searchForm] = Form.useForm();
  const [searchCriteria, setSearchCriteria] = useState<any>({});

  // 消息分类选项
  const categoryOptions = [
    { value: 'announcement', label: '公司公告' },
    { value: 'system', label: '系统消息' },
    { value: 'investment', label: '投资提示' },
    { value: 'notice', label: '通知提醒' },
    { value: 'other', label: '其他消息' },
  ];

  // 公示对象选项
  const audienceTypeOptions = [
    { value: 'all', label: '全体用户' },
    { value: 'partner', label: '合伙人' },
    { value: 'customer', label: '客户' },
    { value: 'waiter', label: '服务员' },
    { value: 'admin', label: '管理员' },
    { value: 'logged_in', label: '登录用户' },
  ];

  // 获取消息列表
  const fetchMessages = async () => {
    setIsLoading(true);
    try {
      let query = supabaseClient
        .from('system_messages')
        .select('*')
        .order('created_at', { ascending: false });

      // 应用搜索条件
      if (searchCriteria.category) {
        query = query.eq('category', searchCriteria.category);
      }
      if (searchCriteria.audience_type) {
        query = query.eq('audience_type', searchCriteria.audience_type);
      }
      if (searchCriteria.content) {
        query = query.ilike('content', `%${searchCriteria.content}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching messages:', error);
        message.error('获取消息列表失败');
        return;
      }

      setMessages(data || []);
    } catch (err) {
      console.error('Exception fetching messages:', err);
      message.error('获取消息列表时发生异常');
    } finally {
      setIsLoading(false);
    }
  };

  // 获取用户列表
  const fetchUsers = async () => {
    try {
      const { data, error } = await supabaseClient
        .from('users')
        .select('id, name, email, role')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching users:', error);
        message.error('获取用户列表失败');
        return;
      }

      setUsers(data || []);
    } catch (err) {
      console.error('Exception fetching users:', err);
      message.error('获取用户列表时发生异常');
    }
  };

  // 组件挂载时获取数据
  useEffect(() => {
    fetchMessages();
    fetchUsers();
  }, [searchCriteria]);

  // 显示消息编辑模态框
  const showModal = (message?: SystemMessage) => {
    if (message) {
      setSelectedMessage(message);
      form.setFieldsValue({
        content: message.content,
        category: message.category,
        audience_type: message.audience_type,
        user_id: message.user_id
      });
    } else {
      setSelectedMessage(null);
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  // 关闭模态框
  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setSelectedMessage(null);
  };

  // 提交消息表单
  const handleMessageSubmit = async (values: any) => {
    try {
      if (selectedMessage) {
        // 更新消息
        const { data, error } = await supabaseClient
          .from('system_messages')
          .update({
            content: values.content,
            category: values.category,
            audience_type: values.audience_type,
            user_id: values.user_id || null
          })
          .eq('id', selectedMessage.id)
          .select()
          .single();

        if (error) {
          throw error;
        }

        message.success('消息更新成功');
        setMessages(prevMessages => 
          prevMessages.map(message => 
            message.id === selectedMessage.id ? data : message
          )
        );
      } else {
        // 创建新消息
        const { data, error } = await supabaseClient
          .from('system_messages')
          .insert({
            content: values.content,
            category: values.category,
            audience_type: values.audience_type,
            user_id: values.user_id || null,
            created_by: 'system',
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) {
          throw error;
        }

        message.success('消息创建成功');
        setMessages(prevMessages => [data, ...prevMessages]);
      }

      setIsModalVisible(false);
      form.resetFields();
      setSelectedMessage(null);
    } catch (err: any) {
      console.error('Failed to save message:', err);
      message.error(err.message || '保存消息失败');
    }
  };

  // 删除消息
  const handleMessageDelete = async (messageId: string) => {
    try {
      // 先删除相关的消息状态记录
      const { error: statusError } = await supabaseClient
        .from('system_messages_status')
        .delete()
        .eq('message_id', messageId);

      if (statusError) {
        throw statusError;
      }

      // 然后删除消息
      const { error: messageError } = await supabaseClient
        .from('system_messages')
        .delete()
        .eq('id', messageId);

      if (messageError) {
        throw messageError;
      }

      message.success('消息删除成功');
      setMessages(prevMessages => 
        prevMessages.filter(message => message.id !== messageId)
      );
    } catch (err: any) {
      console.error('Failed to delete message:', err);
      message.error(err.message || '删除消息失败');
    }
  };

  // 处理搜索
  const handleSearch = (values: any) => {
    setSearchCriteria(values);
    fetchMessages();
  };

  // 重置搜索
  const handleReset = () => {
    searchForm.resetFields();
    setSearchCriteria({});
    fetchMessages();
  };

  // 格式化公示对象
  const formatAudienceType = (audienceType: string) => {
    const option = audienceTypeOptions.find(opt => opt.value === audienceType);
    return option?.label || audienceType;
  };

  // 格式化分类
  const formatCategory = (category: string) => {
    const option = categoryOptions.find(opt => opt.value === category);
    return option?.label || category;
  };

  // 获取用户名称
  const getUserName = (userId?: string) => {
    if (!userId) return '全体用户';
    const user = users.find(u => u.id === userId);
    return user?.name || userId;
  };

  // 消息列表列配置
  const columns = [
    {
      title: '消息内容',
      dataIndex: 'content',
      key: 'content',
      render: (content: string) => (
        <div style={{ maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {content}
        </div>
      ),
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (category: string) => (
        <Tag color="blue">{formatCategory(category)}</Tag>
      ),
    },
    {
      title: '公示对象',
      dataIndex: 'audience_type',
      key: 'audience_type',
      width: 120,
      render: (audienceType: string) => (
        <Tag color="green">{formatAudienceType(audienceType)}</Tag>
      ),
    },
    {
      title: '涉及用户',
      dataIndex: 'user_id',
      key: 'user_id',
      width: 150,
      render: (userId?: string) => getUserName(userId),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: any, record: SystemMessage) => (
        <Space size="middle">
          <Button
            type="primary"
            icon={<EyeOutlined />}
            size="small"
            onClick={() => showModal(record)}
          >
            查看
          </Button>
          <Button
            type="default"
            icon={<EditOutlined />}
            size="small"
            onClick={() => showModal(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个消息吗？"
            onConfirm={() => handleMessageDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              danger
              icon={<DeleteOutlined />}
              size="small"
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <h1>消息管理</h1>
      
      <Card style={{ marginBottom: 24 }}>
        <Form
          form={searchForm}
          layout="inline"
          onFinish={handleSearch}
          style={{ marginBottom: 16 }}
        >
          <Form.Item name="content" label="消息内容">
            <Input placeholder="请输入消息内容" style={{ width: 300 }} />
          </Form.Item>
          
          <Form.Item name="category" label="分类">
            <Select placeholder="请选择分类" style={{ width: 150 }}>
              {categoryOptions.map(option => (
                <Select.Option key={option.value} value={option.value}>
                  {option.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item name="audience_type" label="公示对象">
            <Select placeholder="请选择公示对象" style={{ width: 150 }}>
              {audienceTypeOptions.map(option => (
                <Select.Option key={option.value} value={option.value}>
                  {option.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">搜索</Button>
              <Button onClick={handleReset}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
        
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => showModal()}
          >
            创建消息
          </Button>
        </div>

        <Spin spinning={isLoading}>
          <Table
            columns={columns}
            dataSource={messages}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        </Spin>
      </Card>

      {/* 消息编辑/创建模态框 */}
      <Modal
        title={selectedMessage ? '编辑消息' : '创建消息'}
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleMessageSubmit}
        >
          <Form.Item
            name="content"
            label="消息内容"
            rules={[{ required: true, message: '请输入消息内容' }]}
          >
            <Input.TextArea
              placeholder="请输入消息内容"
              rows={8}
              style={{ resize: 'vertical' }}
            />
          </Form.Item>

          <Form.Item
            name="category"
            label="分类"
            rules={[{ required: true, message: '请选择消息分类' }]}
          >
            <Select placeholder="请选择消息分类">
              {categoryOptions.map(option => (
                <Select.Option key={option.value} value={option.value}>
                  {option.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="audience_type"
            label="公示对象"
            rules={[{ required: true, message: '请选择公示对象' }]}
          >
            <Select placeholder="请选择公示对象">
              {audienceTypeOptions.map(option => (
                <Select.Option key={option.value} value={option.value}>
                  {option.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="user_id"
            label="涉及用户"
            help="选择'全体用户'或'登录用户'时，此项可选"
          >
            <Select placeholder="请选择涉及用户（可选）" style={{ width: '100%' }}>
              <Select.Option value={''}>全体用户</Select.Option>
              {users.map(user => (
                <Select.Option key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <Button onClick={handleCancel}>取消</Button>
            <Button type="primary" htmlType="submit">
              {selectedMessage ? '更新' : '创建'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MessageManagement;