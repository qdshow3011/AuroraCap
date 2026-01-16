import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, Tag, Spin, Alert } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { supabaseClient } from '../../main';
import { useLocation } from 'react-router-dom';

const { Option } = Select;

interface Customer {
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

const CustomerManagement: React.FC = () => {
  const location = useLocation();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  
  // 获取URL参数中的partnerId
  const getPartnerId = () => {
    const params = new URLSearchParams(location.search);
    return params.get('partnerId');
  };
  
  const partnerId = getPartnerId();

  useEffect(() => {
    fetchCustomers();
  }, [partnerId]);

  const fetchCustomers = async () => {
    setLoading(true);
    setError(null);
    try {
      // 获取用户基本信息
      const { data: users, error: usersError } = await supabaseClient
        .from('users')
        .select('id, customer_number, name, email, phone, id_number, status, role, invite_code, created_at')
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
      
      // 创建用户ID到邀请码的映射
      const userIdToInviteCode = new Map(users?.map(user => [user.id, user.invite_code]) || []);
      
      // 创建用户ID到直接推荐人ID的映射
      const userIdToDirectInviterId = new Map<string, string>();
      users?.forEach(user => {
        if (user.invite_code) {
          const inviterId = inviteCodeToCreatorId.get(user.invite_code);
          if (inviterId) {
            userIdToDirectInviterId.set(user.id, inviterId);
          }
        }
      });

      // 合并数据，添加邀请人姓名
      const customersWithInviter = users?.map(user => ({
        ...user,
        inviter_name: user.invite_code 
          ? userIdToName.get(inviteCodeToCreatorId.get(user.invite_code) || '') || null
          : null
      })) || [];
      
      // 如果有partnerId参数，筛选该合伙人名下的客户（包括一级和二级推荐）
      let filteredCustomers = customersWithInviter;
      if (partnerId) {
        // 找出所有直接或间接属于该合伙人的客户
        const partnerCustomers = new Set<string>();
        
        // 一级推荐：直接由合伙人推荐的客户
        users?.forEach(user => {
          if (user.invite_code) {
            const inviterId = inviteCodeToCreatorId.get(user.invite_code);
            if (inviterId === partnerId) {
              partnerCustomers.add(user.id);
            }
          }
        });
        
        // 二级推荐：由合伙人推荐的客户再推荐的客户
        users?.forEach(user => {
          if (user.invite_code) {
            const inviterId = inviteCodeToCreatorId.get(user.invite_code);
            if (inviterId && partnerCustomers.has(inviterId)) {
              partnerCustomers.add(user.id);
            }
          }
        });
        
        // 筛选客户
        filteredCustomers = customersWithInviter.filter(customer => partnerCustomers.has(customer.id));
      }

      setCustomers(filteredCustomers as Customer[]);
    } catch (err) {
      console.error('Failed to fetch customers:', err);
      setError('获取客户数据失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setSelectedCustomer(null);
    form.resetFields();
    // 默认设置角色为客户
    form.setFieldsValue({ role: 'customer' });
    setIsModalVisible(true);
  };

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    form.setFieldsValue(customer);
    setIsModalVisible(true);
  };

  const handleDelete = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDeleteModalVisible(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      
      if (selectedCustomer) {
          // 更新客户信息
          const { error } = await supabaseClient
            .from('users')
            .update(values)
            .eq('id', selectedCustomer.id);
        if (error) throw error;
      } else {
        // 创建新客户
        const { error } = await supabaseClient
          .from('users')
          .insert(values);
        if (error) throw error;
      }
      
      setIsModalVisible(false);
      fetchCustomers();
    } catch (err) {
      console.error('Failed to save customer:', err);
      setError('保存客户信息失败，请稍后重试');
    }
  };

  const handleDeleteOk = async () => {
    if (!selectedCustomer) return;
    
    try {
      const { error } = await supabaseClient
        .from('users')
        .delete()
        .eq('id', selectedCustomer.id);
      
      if (error) throw error;
      
      setIsDeleteModalVisible(false);
      fetchCustomers();
    } catch (err) {
      console.error('Failed to delete customer:', err);
      setError('删除注册用户失败，请稍后重试');
    }
  };



  const columns = [
    {
      title: '用户编号',
      dataIndex: 'customer_number',
      key: 'customer_number',
      render: (text: string, record: Customer) => (
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
      title: '身份证号/护照号码',
      dataIndex: 'id_number',
      key: 'id_number',
      render: (idNumber: string | null) => idNumber || '-',
    },
    {
      title: '邀请码',
      dataIndex: 'invite_code',
      key: 'invite_code',
      render: (inviteCode: string | null) => inviteCode || '-',
    },
    {
      title: '邀请人',
      dataIndex: 'inviter_name',
      key: 'inviter_name',
      render: (inviterName: string | null) => inviterName || '-',
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
        <Tag color={role === 'admin' ? 'red' : role === 'partner' ? 'blue' : 'green'}>
          {role === 'admin' ? '管理员' : role === 'partner' ? '合伙人' : role === 'customer' ? '客户' : role === 'waiter' ? '服务员' : role}
        </Tag>
      ),
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
      render: (_: any, record: Customer) => (
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
        <h1>注册用户管理</h1>
        <Space>
          <Input
            placeholder="搜索注册用户"
            prefix={<SearchOutlined />}
            style={{ width: 200 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增注册用户
          </Button>
        </Space>
      </div>

      {error && <Alert message="错误" description={error} type="error" showIcon style={{ marginBottom: 24 }} />}

      <Spin spinning={loading}>
        <Table
          dataSource={customers}
          columns={columns}
          rowKey="id"
          bordered
          pagination={{ pageSizeOptions: ['10', '20', '50'], showSizeChanger: true, showTotal: (total) => `共 ${total} 条记录` }}
          scroll={{ x: 800 }}
          footer={() => (
            <div style={{ 
              padding: '8px 16px', 
              background: '#fafafa', 
              borderTop: '1px solid #e8e8e8',
              textAlign: 'right',
              fontSize: '12px',
              color: '#666'
            }}>
              当前显示：第 {customers.length > 0 ? 1 : 0}-{customers.length} 条，共 {customers.length} 条客户记录
            </div>
          )}
        />
      </Spin>

      <Modal
        title={selectedCustomer ? '编辑注册用户' : '新增注册用户'}
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
            label="用户编号"
            rules={[{ required: true, message: '请输入用户编号' }]}
          >
            <Input placeholder="请输入用户编号" />
          </Form.Item>
          <Form.Item
            name="name"
            label="姓名"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input placeholder="请输入姓名" />
          </Form.Item>
          <Form.Item
            name="email"
            label="邮箱"
            rules={[{ required: true, message: '请输入邮箱' }, { type: 'email', message: '请输入有效的邮箱地址' }]}
          >
            <Input placeholder="请输入邮箱" />
          </Form.Item>
          <Form.Item
            name="phone"
            label="电话"
            rules={[{ required: true, message: '请输入电话' }]}
          >
            <Input placeholder="请输入电话" />
          </Form.Item>
          <Form.Item
            name="id_number"
            label="身份证号/护照号码"
          >
            <Input placeholder="请输入身份证号或护照号码" />
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
          <Form.Item
            name="role"
            label="角色"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select placeholder="请选择角色">
              <Option value="admin">管理员</Option>
              <Option value="partner">合伙人</Option>
              <Option value="customer">客户</Option>
              <Option value="waiter">服务员</Option>
            </Select>
          </Form.Item>
        </Form>
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
        <p>确定要删除注册用户 <strong>{selectedCustomer?.name}</strong> 吗？此操作不可恢复。</p>
      </Modal>
    </div>
  );
};

export default CustomerManagement;