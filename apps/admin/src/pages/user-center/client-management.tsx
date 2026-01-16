import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, Tag, Spin, Alert } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { supabaseClient } from '../../main';

const { Option } = Select;

interface Client {
  id: string;
  customer_number: string;
  name: string;
  email: string;
  phone: string;
  id_number: string | null;
  status: 'active' | 'inactive';
  role: string;
  invite_code: string | null;
  inviter_name: string | null;
  created_at: string;
}

const ClientManagement: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    setError(null);
    try {
      // 获取用户基本信息，只查询role为customer或partner的用户
      const { data: users, error: usersError } = await supabaseClient
        .from('users')
        .select('id, customer_number, name, email, phone, id_number, status, role, invite_code, created_at')
        .in('role', ['customer', 'partner'])
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      // 获取所有邀请码信息，用于关联邀请人
      const { data: inviteCodes, error: inviteCodesError } = await supabaseClient
        .from('invite_codes')
        .select('code, pushed_by');

      if (inviteCodesError) throw inviteCodesError;

      // 获取所有用户信息，用于查询邀请人姓名
      const { data: allUsers, error: allUsersError } = await supabaseClient
        .from('users')
        .select('id, name');

      if (allUsersError) throw allUsersError;

      // 创建邀请码到邀请人ID的映射
      const inviteCodeToCreatorId = new Map(inviteCodes?.map(code => [code.code, code.pushed_by]) || []);

      // 创建用户ID到姓名的映射
      const userIdToName = new Map(allUsers?.map(user => [user.id, user.name]) || []);

      // 合并数据，添加邀请人姓名
      const clientsWithInviter = users?.map(user => ({
        ...user,
        inviter_name: user.invite_code 
          ? userIdToName.get(inviteCodeToCreatorId.get(user.invite_code) || '') || null
          : null
      })) || [];

      setClients(clientsWithInviter);
    } catch (err) {
      console.error('Failed to fetch clients:', err);
      setError('获取客户数据失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setSelectedClient(null);
    form.resetFields();
    // 默认设置角色为客户
    form.setFieldsValue({ role: 'customer', status: 'active' });
    setIsModalVisible(true);
  };

  const handleEdit = (client: Client) => {
    setSelectedClient(client);
    form.setFieldsValue(client);
    setIsModalVisible(true);
  };

  const handleDelete = (client: Client) => {
    setSelectedClient(client);
    setIsDeleteModalVisible(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      
      if (selectedClient) {
          // 更新客户信息
          const { error } = await supabaseClient
            .from('users')
            .update(values)
            .eq('id', selectedClient.id);
        if (error) throw error;
      } else {
        // 创建新客户
        // 生成客户编号（C+年月日+序号）
        const today = new Date();
        const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
        const prefix = `C${dateStr}`;
        
        // 查询当天最大序号
        const { data: maxSeqData } = await supabaseClient
          .from('users')
          .select('customer_number')
          .like('customer_number', `${prefix}%`)
          .order('customer_number', { ascending: false })
          .limit(1)
          .single();
        
        let sequenceNumber = 1;
        if (maxSeqData && maxSeqData.customer_number) {
          const seqPart = maxSeqData.customer_number.slice(-3);
          sequenceNumber = parseInt(seqPart, 10) + 1;
        }
        
        // 格式化序号
        const formattedSeq = String(sequenceNumber).padStart(3, '0');
        const customerNumber = `${prefix}${formattedSeq}`;
        
        // 准备创建用户的数据
        const userData = {
          ...values,
          customer_number: customerNumber,
          status: 'active',
          created_at: new Date().toISOString()
        };
        
        // 创建用户
        const { error } = await supabaseClient
          .from('users')
          .insert(userData);
        if (error) throw error;
      }
      
      setIsModalVisible(false);
      fetchClients();
    } catch (err) {
      console.error('Failed to save client:', err);
      setError('保存客户信息失败，请稍后重试');
    }
  };

  const handleDeleteOk = async () => {
    if (!selectedClient) return;
    
    try {
      const { error } = await supabaseClient
        .from('users')
        .delete()
        .eq('id', selectedClient.id);
      
      if (error) throw error;
      
      setIsDeleteModalVisible(false);
      fetchClients();
    } catch (err) {
      console.error('Failed to delete client:', err);
      setError('删除客户失败，请稍后重试');
    }
  };

  const columns = [
    {
      title: '客户编号',
      dataIndex: 'customer_number',
      key: 'customer_number',
      render: (text: string, record: Client) => (
        <Button type="link" onClick={() => handleEdit(record)}>
          {text}
        </Button>
      ),
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '电话',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '身份证号/护照号码',
      dataIndex: 'id_number',
      key: 'id_number',
      render: (idNumber: string | null) => idNumber || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? '活跃' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => (
        <Tag color={role === 'partner' ? 'blue' : 'green'}>
          {role === 'partner' ? '合伙人' : '客户'}
        </Tag>
      ),
    },
    {
      title: '邀请人',
      dataIndex: 'inviter_name',
      key: 'inviter_name',
      render: (inviterName: string | null) => inviterName || '-',
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (time: string) => new Date(time).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Client) => (
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
      {error && (
        <Alert
          message="错误"
          description={error}
          type="error"
          showIcon
          closable
          onClose={() => setError(null)}
          style={{ marginBottom: 16 }}
        />
      )}
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1>客户管理</h1>
        <Space>
          <Input
            placeholder="搜索客户"
            prefix={<SearchOutlined />}
            style={{ width: 200 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增客户
          </Button>
        </Space>
      </div>
      
      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={clients}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          style={{ background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}
        />
      </Spin>
      
      {/* 添加/编辑模态框 */}
      <Modal
        title={selectedClient ? '编辑客户' : '新增客户'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => setIsModalVisible(false)}
        destroyOnHidden
        centered
        width={500}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="customer_number"
            label="客户编号"
            rules={[{ required: true, message: '请输入客户编号' }]}
          >
            <Input placeholder="请输入客户编号" />
          </Form.Item>
          <Form.Item
            name="name"
            label="姓名"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input placeholder="请输入姓名" />
          </Form.Item>
          <Form.Item
            name="phone"
            label="电话"
            rules={[{ required: true, message: '请输入电话' }]}
          >
            <Input placeholder="请输入电话" />
          </Form.Item>
          <Form.Item
            name="email"
            label="邮箱"
            rules={[{ required: true, message: '请输入邮箱' }, { type: 'email', message: '请输入有效的邮箱地址' }]}
          >
            <Input placeholder="请输入邮箱" />
          </Form.Item>
          <Form.Item
            name="id_number"
            label="身份证号/护照号码"
          >
            <Input placeholder="请输入身份证号或护照号码" />
          </Form.Item>
          <Form.Item
            name="password"
            label={selectedClient ? '密码（可选）' : '密码'}
            rules={[{ required: !selectedClient, message: '请输入密码' }, { min: 6, message: '密码长度不能少于6位' }]}
          >
            <Input.Password placeholder={selectedClient ? '留空则不修改密码' : '请输入密码'} />
          </Form.Item>
          <Form.Item
            name="role"
            label="角色"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select placeholder="请选择角色">
              <Option value="customer">客户</Option>
              <Option value="partner">合伙人</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="status"
            label="状态"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select placeholder="请选择状态">
              <Option value="active">活跃</Option>
              <Option value="inactive">禁用</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
      
      {/* 删除模态框 */}
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
        <p>确定要删除客户 <strong>{selectedClient?.name}</strong> 吗？此操作不可恢复。</p>
      </Modal>
    </div>
  );
};

export default ClientManagement;