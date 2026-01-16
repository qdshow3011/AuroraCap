import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, Tag, Spin, Alert } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { supabaseClient } from '../../main';

const { Option } = Select;

interface Partner {
  id: string;
  customer_number: string;
  name: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive';
  role: string;
  created_at: string;
  recommended_clients_count: number;
}

const PartnerManagement: React.FC = () => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    setLoading(true);
    setError(null);
    try {
      // 获取所有合伙人
      const { data: partnersData, error: partnersError } = await supabaseClient
        .from('users')
        .select('id, customer_number, name, email, phone, status, role, created_at')
        .eq('role', 'partner')
        .order('created_at', { ascending: false });

      if (partnersError) throw partnersError;

      // 获取所有邀请码信息，用于关联邀请人
      const { data: inviteCodes, error: inviteCodesError } = await supabaseClient
        .from('invite_codes')
        .select('code, pushed_by');


      if (inviteCodesError) throw inviteCodesError;

      // 获取所有用户信息，用于查询哪些用户使用了邀请码
      const { data: allUsers, error: allUsersError } = await supabaseClient
        .from('users')
        .select('id, invite_code');

      if (allUsersError) throw allUsersError;

      // 创建邀请码到邀请人ID的映射
      const inviteCodeToCreatorId = new Map(inviteCodes?.map(code => [code.code, code.pushed_by]) || []);


      // 创建合伙人ID到推荐客户数量的映射
      const partnerIdToClientCount = new Map<string, number>();
      
      // 初始化所有合伙人为0个推荐客户
      partnersData?.forEach(partner => {
        partnerIdToClientCount.set(partner.id, 0);
      });

      // 统计每个合伙人的推荐客户数量
      allUsers?.forEach(user => {
        if (user.invite_code) {
          const creatorId = inviteCodeToCreatorId.get(user.invite_code);
          if (creatorId && partnerIdToClientCount.has(creatorId)) {
            partnerIdToClientCount.set(creatorId, (partnerIdToClientCount.get(creatorId) || 0) + 1);
          }
        }
      });

      // 将推荐客户数量添加到每个合伙人对象中
      const partnersWithClientCount = partnersData?.map(partner => ({
        ...partner,
        recommended_clients_count: partnerIdToClientCount.get(partner.id) || 0
      })) || [];

      setPartners(partnersWithClientCount as Partner[]);
    } catch (err) {
      console.error('Failed to fetch partners:', err);
      setError('获取合伙人数据失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setSelectedPartner(null);
    form.resetFields();
    // 默认设置角色为合伙人
    form.setFieldsValue({ role: 'partner' });
    setIsModalVisible(true);
  };

  const handleEdit = (partner: Partner) => {
    setSelectedPartner(partner);
    form.setFieldsValue(partner);
    setIsModalVisible(true);
  };

  const handleDelete = (partner: Partner) => {
    setSelectedPartner(partner);
    setIsDeleteModalVisible(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      
      if (selectedPartner) {
          // 更新合伙人信息
          const { error } = await supabaseClient
            .from('users')
            .update(values)
            .eq('id', selectedPartner.id);
        if (error) throw error;
      } else {
        // 创建新合伙人
        const { error } = await supabaseClient
          .from('users')
          .insert(values);
        if (error) throw error;
      }
      
      setIsModalVisible(false);
      fetchPartners();
    } catch (err) {
      console.error('Failed to save partner:', err);
      setError('保存合伙人信息失败，请稍后重试');
    }
  };

  const handleDeleteOk = async () => {
    if (!selectedPartner) return;
    
    try {
      const { error } = await supabaseClient
        .from('users')
        .delete()
        .eq('id', selectedPartner.id);
      
      if (error) throw error;
      
      setIsDeleteModalVisible(false);
      fetchPartners();
    } catch (err) {
      console.error('Failed to delete partner:', err);
      setError('删除合伙人失败，请稍后重试');
    }
  };

  const columns = [
    {
      title: '客户编号',
      dataIndex: 'customer_number',
      key: 'customer_number',
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
    {      title: '推荐客户数量',      dataIndex: 'recommended_clients_count',      key: 'recommended_clients_count',      render: (count: number, record: Partner) => (        <Button type="link" onClick={() => window.location.href = `/user-center/customers?partnerId=${record.id}`}>          {count}        </Button>      ),    },
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
        <Tag color="blue">
          {role === 'partner' ? '合伙人' : role}
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
      render: (_: any, record: Partner) => (
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
        <h1>合伙人管理</h1>
        <Space>
          <Input
            placeholder="搜索合伙人"
            prefix={<SearchOutlined />}
            style={{ width: 200 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增合伙人
          </Button>
        </Space>
      </div>

      {error && <Alert message="错误" description={error} type="error" showIcon style={{ marginBottom: 24 }} />}

      <Spin spinning={loading}>
        <Table
          dataSource={partners}
          columns={columns}
          rowKey="id"
          bordered
          pagination={{ pageSizeOptions: ['10', '20', '50'], showSizeChanger: true, showTotal: (total) => `共 ${total} 条记录` }}
          scroll={{ x: 800 }}
        />
      </Spin>

      <Modal
        title={selectedPartner ? '编辑合伙人' : '新增合伙人'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => setIsModalVisible(false)}
        destroyOnHidden
        centered
        width={500}
      >
        <Form form={form} layout="vertical">
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
            <Select placeholder="请选择角色" disabled={true}>
              <Option value="partner">合伙人</Option>
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
        <p>确定要删除合伙人 <strong>{selectedPartner?.name}</strong> 吗？此操作不可恢复。</p>
      </Modal>
    </div>
  );
};

export default PartnerManagement;
