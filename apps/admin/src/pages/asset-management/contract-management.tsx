import React, { useState, useEffect } from 'react';
import { Button, Card, Table, Spin, message, Modal, Form, Input, Select, Tabs, Space, Popconfirm, DatePicker } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, FileTextOutlined, UserOutlined } from '@ant-design/icons';
import { supabaseClient } from '../../main';

// 定义合同类型
interface Contract {
  id: string;
  title: string;
  content: string;
  fund_id?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

// 定义合同签订记录类型
interface ContractSigning {
  id: string;
  user_id: string;
  contract_id: string;
  signed_at: string;
  status: string;
  contract?: Contract;
  user_name?: string;
}

// 定义基金产品类型
interface Product {
  id: string;
  name: string;
}

// 定义用户类型
interface User {
  id: string;
  name: string;
  email: string;
}

const ContractManagement: React.FC = () => {
  // 状态管理
  const [activeTab, setActiveTab] = useState<string>('contracts');
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [signings, setSignings] = useState<ContractSigning[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [isSigningModalVisible, setIsSigningModalVisible] = useState<boolean>(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [selectedSigning, setSelectedSigning] = useState<ContractSigning | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingSignings, setIsLoadingSignings] = useState<boolean>(false);
  const [form] = Form.useForm();
  const [searchForm] = Form.useForm();
  const [signingSearchForm] = Form.useForm();
  const [searchCriteria, setSearchCriteria] = useState<any>({});
  const [signingSearchCriteria, setSigningSearchCriteria] = useState<any>({});

  // 获取合同列表
  const fetchContracts = async () => {
    setIsLoading(true);
    try {
      let query = supabaseClient
        .from('contracts')
        .select('*')
        .order('created_at', { ascending: false });

      // 应用搜索条件
      if (searchCriteria.title) {
        query = query.ilike('title', `%${searchCriteria.title}%`);
      }
      if (searchCriteria.fund_id) {
        query = query.eq('fund_id', searchCriteria.fund_id);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching contracts:', error);
        message.error('获取合同列表失败');
        return;
      }

      setContracts(data || []);
    } catch (err) {
      console.error('Exception fetching contracts:', err);
      message.error('获取合同列表时发生异常');
    } finally {
      setIsLoading(false);
    }
  };

  // 获取合同签订记录
  const fetchSignings = async () => {
    setIsLoadingSignings(true);
    try {
      let query = supabaseClient
        .from('contract_signings')
        .select(
          'id, user_id, contract_id, signed_at, status,' +
          'contracts:contract_id(title)'
        )
        .order('signed_at', { ascending: false });

      // 应用搜索条件
      if (signingSearchCriteria.contract_id) {
        query = query.eq('contract_id', signingSearchCriteria.contract_id);
      }
      if (signingSearchCriteria.user_id) {
        query = query.eq('user_id', signingSearchCriteria.user_id);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching contract signings:', error);
        message.error('获取合同签订记录失败');
        return;
      }

      const formattedSignings: ContractSigning[] = (data || []).map((signing: any) => ({
        id: signing.id,
        user_id: signing.user_id,
        contract_id: signing.contract_id,
        signed_at: signing.signed_at,
        status: signing.status,
        contract: signing.contracts as Contract,
        user_name: signing.user_id
      }));

      setSignings(formattedSignings);
    } catch (err) {
      console.error('Exception fetching contract signings:', err);
      message.error('获取合同签订记录时发生异常');
    } finally {
      setIsLoadingSignings(false);
    }
  };

  // 获取基金产品列表
  const fetchProducts = async () => {
    try {
      const { data, error } = await supabaseClient
        .from('products')
        .select('id, name_cn');

      if (error) {
        console.error('Error fetching products:', error);
        return;
      }

      setProducts(data || []);
    } catch (err) {
      console.error('Exception fetching products:', err);
    }
  };

  // 获取用户列表
  const fetchUsers = async () => {
    try {
      const { data, error } = await supabaseClient
        .from('users')
        .select('id, name, email');

      if (error) {
        console.error('Error fetching users:', error);
        return;
      }

      setUsers(data || []);
    } catch (err) {
      console.error('Exception fetching users:', err);
    }
  };

  // 组件挂载时获取数据
  useEffect(() => {
    fetchContracts();
    fetchProducts();
    fetchUsers();
  }, [searchCriteria]);

  // 切换到签订记录标签时获取数据
  useEffect(() => {
    if (activeTab === 'signings') {
      fetchSignings();
    }
  }, [activeTab, signingSearchCriteria]);

  // 显示合同编辑模态框
  const showModal = (contract?: Contract) => {
    if (contract) {
      setSelectedContract(contract);
      form.setFieldsValue({
        title: contract.title,
        content: contract.content,
        fund_id: contract.fund_id
      });
    } else {
      setSelectedContract(null);
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  // 显示签订记录详情模态框
  const showSigningModal = (signing: ContractSigning) => {
    setSelectedSigning(signing);
    setIsSigningModalVisible(true);
  };

  // 关闭模态框
  const handleCancel = () => {
    setIsModalVisible(false);
    setIsSigningModalVisible(false);
    form.resetFields();
    setSelectedContract(null);
    setSelectedSigning(null);
  };

  // 提交合同表单
  const handleContractSubmit = async (values: any) => {
    try {
      if (selectedContract) {
        // 更新合同
        const { data, error } = await supabaseClient
          .from('contracts')
          .update({
            title: values.title,
            content: values.content,
            fund_id: values.fund_id || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedContract.id)
          .select()
          .single();

        if (error) {
          throw error;
        }

        message.success('合同更新成功');
        setContracts(prevContracts => 
          prevContracts.map(contract => 
            contract.id === selectedContract.id ? data : contract
          )
        );
      } else {
        // 创建新合同
        const { data, error } = await supabaseClient
          .from('contracts')
          .insert({
            title: values.title,
            content: values.content,
            fund_id: values.fund_id || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) {
          throw error;
        }

        message.success('合同创建成功');
        setContracts(prevContracts => [data, ...prevContracts]);
      }

      setIsModalVisible(false);
      form.resetFields();
      setSelectedContract(null);
    } catch (err: any) {
      console.error('Failed to save contract:', err);
      message.error(err.message || '保存合同失败');
    }
  };

  // 删除合同
  const handleContractDelete = async (contractId: string) => {
    try {
      const { error } = await supabaseClient
        .from('contracts')
        .delete()
        .eq('id', contractId);

      if (error) {
        throw error;
      }

      message.success('合同删除成功');
      setContracts(prevContracts => 
        prevContracts.filter(contract => contract.id !== contractId)
      );
    } catch (err: any) {
      console.error('Failed to delete contract:', err);
      message.error(err.message || '删除合同失败');
    }
  };

  // 处理合同搜索
  const handleContractSearch = (values: any) => {
    setSearchCriteria(values);
    fetchContracts();
  };

  // 处理签订记录搜索
  const handleSigningSearch = (values: any) => {
    setSigningSearchCriteria(values);
    fetchSignings();
  };

  // 合同列表列配置
  const contractColumns = [
    {
      title: '合同标题',
      dataIndex: 'title',
      key: 'title',
      width: 200,
    },
    {
      title: '关联产品',
      dataIndex: 'fund_id',
      key: 'fund_id',
      width: 150,
      render: (fundId: string) => {
        const product = products.find(p => p.id === fundId);
        return product?.name || '-';
      },
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: '更新时间',
      dataIndex: 'updated_at',
      key: 'updated_at',
      width: 180,
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: Contract) => (
        <Space size="middle">
          <Button
            type="primary"
            icon={<EditOutlined />}
            size="small"
            onClick={() => showModal(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个合同吗？"
            onConfirm={() => handleContractDelete(record.id)}
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

  // 签订记录列表列配置
  const signingColumns = [
    {
      title: '用户',
      dataIndex: 'user_name',
      key: 'user_name',
      width: 150,
    },
    {
      title: '合同',
      dataIndex: 'contract',
      key: 'contract',
      width: 200,
      render: (contract?: Contract) => contract?.title || '-',
    },
    {
      title: '签订时间',
      dataIndex: 'signed_at',
      key: 'signed_at',
      width: 180,
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: any, record: ContractSigning) => (
        <Button
          type="default"
          icon={<FileTextOutlined />}
          size="small"
          onClick={() => showSigningModal(record)}
        >
          详情
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <h1>合同管理</h1>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'contracts',
            label: '合同内容管理',
            icon: <FileTextOutlined />,
            children: (
              <div>
                <Card style={{ marginBottom: 24 }}>
                  <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => showModal()}
                    >
                      创建合同
                    </Button>
                  </div>

                  <Spin spinning={isLoading}>
                    <Table
                      columns={contractColumns}
                      dataSource={contracts}
                      rowKey="id"
                      pagination={{ pageSize: 10 }}
                    />
                  </Spin>
                </Card>
              </div>
            ),
          },
          {
            key: 'signings',
            label: '合同签订管理',
            icon: <UserOutlined />,
            children: (
              <div>
                <Card style={{ marginBottom: 24 }}>
                  <Spin spinning={isLoadingSignings}>
                    <Table
                      columns={signingColumns}
                      dataSource={signings}
                      rowKey="id"
                      pagination={{ pageSize: 10 }}
                    />
                  </Spin>
                </Card>
              </div>
            ),
          },
        ]}
      />

      {/* 合同编辑/创建模态框 */}
      <Modal
        title={selectedContract ? '编辑合同' : '创建合同'}
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleContractSubmit}
        >
          <Form.Item
            name="title"
            label="合同标题"
            rules={[{ required: true, message: '请输入合同标题' }]}
          >
            <Input placeholder="请输入合同标题" />
          </Form.Item>

          <Form.Item
            name="fund_id"
            label="关联产品"
          >
            <Select placeholder="请选择关联产品">
              {products.map(product => (
                <Select.Option key={product.id} value={product.id}>
                  {product.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="content"
            label="合同内容"
            rules={[{ required: true, message: '请输入合同内容' }]}
          >
            <Input.TextArea
              placeholder="请输入合同内容"
              rows={10}
            />
          </Form.Item>

          <Form.Item style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <Button onClick={handleCancel}>取消</Button>
            <Button type="primary" htmlType="submit">
              {selectedContract ? '更新' : '创建'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* 签订记录详情模态框 */}
      <Modal
        title="合同签订详情"
        open={isSigningModalVisible}
        onCancel={handleCancel}
        footer={null}
      >
        {selectedSigning && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <h3>合同信息</h3>
              <p><strong>合同标题:</strong> {selectedSigning.contract?.title}</p>
            </div>
            <div style={{ marginBottom: 16 }}>
              <h3>签订信息</h3>
              <p><strong>用户:</strong> {selectedSigning.user_name}</p>
              <p><strong>签订时间:</strong> {new Date(selectedSigning.signed_at).toLocaleString()}</p>
              <p><strong>状态:</strong> {selectedSigning.status}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ContractManagement;