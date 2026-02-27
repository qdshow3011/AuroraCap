import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, Tag, Spin, Alert, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { supabaseClient } from '../../main';

const { Option } = Select;

interface FundCompanyProfile {
  id: string;
  company_name: string;
  license_number: string | null;
  contact_person: string | null;
  contact_phone: string;
  company_email: string | null;
  company_address: string | null;
  company_description: string | null;
  aum: number | null;
  status: 'active' | 'inactive' | 'suspended';
  control_user_id: string | null;
  control_user_name?: string | null;
  created_at: string;
  updated_at: string;
}

interface FundAdminUser {
  id: string;
  name: string | null;
  phone: string | null;
}

const FundCompanyManagement: React.FC = () => {
  const [fundCompanies, setFundCompanies] = useState<FundCompanyProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [selectedFundCompany, setSelectedFundCompany] = useState<FundCompanyProfile | null>(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [fundAdminUsers, setFundAdminUsers] = useState<FundAdminUser[]>([]);

  useEffect(() => {
    fetchFundCompanies();
    fetchFundAdminUsers();
  }, []);

  const fetchFundCompanies = async () => {
    setLoading(true);
    setError(null);
    try {
      // 从fund_company_profiles表获取数据，同时关联users表获取控制用户信息
      const { data, error: fetchError } = await supabaseClient
        .from('fund_company_profiles')
        .select('*, users:control_user_id(name)')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // 处理数据，将关联的用户姓名提取出来
      const processedData = (data || []).map((item: any) => ({
        ...item,
        control_user_name: item.users?.name || null,
      }));

      setFundCompanies(processedData);
    } catch (err) {
      console.error('Failed to fetch fund companies:', err);
      setError('获取基金公司数据失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const fetchFundAdminUsers = async () => {
    try {
      const { data, error: fetchError } = await supabaseClient
        .from('users')
        .select('id, name, phone')
        .eq('role', 'fund_company');

      if (fetchError) throw fetchError;

      setFundAdminUsers(data || []);
    } catch (err) {
      console.error('Failed to fetch fund admin users:', err);
    }
  };

  const handleAdd = () => {
    setSelectedFundCompany(null);
    form.resetFields();
    form.setFieldsValue({ status: 'active' });
    setIsModalVisible(true);
  };

  const handleEdit = (fundCompany: FundCompanyProfile) => {
    setSelectedFundCompany(fundCompany);
    form.setFieldsValue({
      company_name: fundCompany.company_name,
      company_email: fundCompany.company_email,
      contact_phone: fundCompany.contact_phone,
      contact_person: fundCompany.contact_person,
      license_number: fundCompany.license_number,
      company_address: fundCompany.company_address,
      company_description: fundCompany.company_description,
      aum: fundCompany.aum,
      status: fundCompany.status,
      control_user_id: fundCompany.control_user_id,
    });
    setIsModalVisible(true);
  };

  const handleDelete = (fundCompany: FundCompanyProfile) => {
    setSelectedFundCompany(fundCompany);
    setIsDeleteModalVisible(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();

      // 处理空值
      const processedValues = {
        ...values,
        license_number: values.license_number?.trim() || null,
        contact_person: values.contact_person?.trim() || null,
        company_address: values.company_address?.trim() || null,
        company_description: values.company_description?.trim() || null,
        aum: values.aum ? parseFloat(values.aum) : null,
        control_user_id: values.control_user_id || null,
      };

      if (selectedFundCompany) {
        // 更新基金公司信息
        const { error: updateError } = await supabaseClient
          .from('fund_company_profiles')
          .update({
            ...processedValues,
            updated_at: new Date().toISOString(),
          })
          .eq('id', selectedFundCompany.id);

        if (updateError) throw updateError;

        message.success('基金公司信息更新成功');
      } else {
        // 创建新基金公司
        const { error: insertError } = await supabaseClient
          .from('fund_company_profiles')
          .insert(processedValues);

        if (insertError) throw insertError;

        message.success('基金公司创建成功');
      }

      setIsModalVisible(false);
      fetchFundCompanies();
    } catch (err: any) {
      console.error('Failed to save fund company:', err);
      setError(err.message || '保存基金公司信息失败，请稍后重试');
      message.error('保存失败');
    }
  };

  const handleDeleteOk = async () => {
    if (!selectedFundCompany) return;

    try {
      const { error: deleteError } = await supabaseClient
        .from('fund_company_profiles')
        .delete()
        .eq('id', selectedFundCompany.id);

      if (deleteError) throw deleteError;

      message.success('基金公司删除成功');
      setIsDeleteModalVisible(false);
      fetchFundCompanies();
    } catch (err: any) {
      console.error('Failed to delete fund company:', err);
      setError(err.message || '删除基金公司失败，请稍后重试');
      message.error('删除失败');
    }
  };

  // 搜索过滤
  const filteredFundCompanies = fundCompanies.filter(company => {
    if (!searchText) return true;
    const searchLower = searchText.toLowerCase();
    return (
      company.company_name?.toLowerCase().includes(searchLower) ||
      company.company_email?.toLowerCase().includes(searchLower) ||
      company.contact_phone?.toLowerCase().includes(searchLower) ||
      company.contact_person?.toLowerCase().includes(searchLower) ||
      company.license_number?.toLowerCase().includes(searchLower)
    );
  });

  const columns = [
    {
      title: '公司名称',
      dataIndex: 'company_name',
      key: 'company_name',
      render: (text: string, record: FundCompanyProfile) => (
        <Button type="link" onClick={() => handleEdit(record)}>
          {text}
        </Button>
      ),
    },
    {
      title: '联系人',
      dataIndex: 'contact_person',
      key: 'contact_person',
      render: (text: string | null) => text || '-',
    },
    {
      title: '联系电话',
      dataIndex: 'contact_phone',
      key: 'contact_phone',
    },
    {
      title: '公司邮箱',
      dataIndex: 'company_email',
      key: 'company_email',
      render: (text: string | null) => text || '-',
    },
    {
      title: '执照编号',
      dataIndex: 'license_number',
      key: 'license_number',
      render: (text: string | null) => text || '-',
    },
    {
      title: '管理规模(AUM)',
      dataIndex: 'aum',
      key: 'aum',
      render: (aum: number | null) => aum ? `¥${aum.toLocaleString()}` : '-',
    },
    {
      title: '控制用户',
      dataIndex: 'control_user_name',
      key: 'control_user_name',
      render: (text: string | null) => text || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          active: 'green',
          inactive: 'red',
          suspended: 'orange',
        };
        const textMap: Record<string, string> = {
          active: '活跃',
          inactive: '禁用',
          suspended: '暂停',
        };
        return <Tag color={colorMap[status] || 'default'}>{textMap[status] || status}</Tag>;
      },
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
      render: (_: any, record: FundCompanyProfile) => (
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
        <h1>基金公司管理</h1>
        <Space>
          <Input
            placeholder="搜索基金公司"
            prefix={<SearchOutlined />}
            style={{ width: 200 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增基金公司
          </Button>
        </Space>
      </div>

      {error && <Alert message="错误" description={error} type="error" showIcon style={{ marginBottom: 24 }} />}

      <Spin spinning={loading}>
        <Table
          dataSource={filteredFundCompanies}
          columns={columns}
          rowKey="id"
          bordered
          pagination={{ pageSizeOptions: ['10', '20', '50'], showSizeChanger: true, showTotal: (total) => `共 ${total} 条记录` }}
          scroll={{ x: 1200 }}
          footer={() => (
            <div style={{
              padding: '8px 16px',
              background: '#fafafa',
              borderTop: '1px solid #e8e8e8',
              textAlign: 'right',
              fontSize: '12px',
              color: '#666'
            }}>
              当前显示：第 {filteredFundCompanies.length > 0 ? 1 : 0}-{filteredFundCompanies.length} 条，共 {filteredFundCompanies.length} 条基金公司记录
            </div>
          )}
        />
      </Spin>

      <Modal
        title={selectedFundCompany ? '编辑基金公司' : '新增基金公司'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => setIsModalVisible(false)}
        destroyOnHidden
        centered
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="company_name"
            label="公司名称"
            rules={[{ required: true, message: '请输入公司名称' }]}
          >
            <Input placeholder="请输入公司名称" />
          </Form.Item>
          <Form.Item
            name="contact_person"
            label="联系人姓名"
          >
            <Input placeholder="请输入联系人姓名" />
          </Form.Item>
          <Form.Item
            name="contact_phone"
            label="联系电话"
            rules={[{ required: true, message: '请输入联系电话' }]}
          >
            <Input placeholder="请输入联系电话" />
          </Form.Item>
          <Form.Item
            name="company_email"
            label="公司邮箱"
            rules={[{ type: 'email', message: '请输入有效的邮箱地址' }]}
          >
            <Input placeholder="请输入公司邮箱" />
          </Form.Item>
          <Form.Item
            name="license_number"
            label="执照编号"
          >
            <Input placeholder="请输入基金公司执照编号" />
          </Form.Item>
          <Form.Item
            name="company_address"
            label="公司地址"
          >
            <Input placeholder="请输入公司地址" />
          </Form.Item>
          <Form.Item
            name="company_description"
            label="公司简介"
          >
            <Input.TextArea rows={3} placeholder="请输入公司简介" />
          </Form.Item>
          <Form.Item
            name="aum"
            label="管理规模(AUM)"
          >
            <Input type="number" placeholder="请输入管理资产规模（万元）" />
          </Form.Item>
          <Form.Item
            name="status"
            label="状态"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select placeholder="请选择状态">
              <Option value="active">活跃</Option>
              <Option value="inactive">禁用</Option>
              <Option value="suspended">暂停</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="control_user_id"
            label="控制用户"
          >
            <Select
              placeholder="请选择控制用户"
              allowClear
              showSearch
              optionFilterProp="children"
            >
              {fundAdminUsers.map((user) => (
                <Option key={user.id} value={user.id}>
                  {user.name || '未命名'} {user.phone ? `(${user.phone})` : ''}
                </Option>
              ))}
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
        <p>确定要删除基金公司 <strong>{selectedFundCompany?.company_name}</strong> 吗？此操作不可恢复。</p>
      </Modal>
    </div>
  );
};

export default FundCompanyManagement;
