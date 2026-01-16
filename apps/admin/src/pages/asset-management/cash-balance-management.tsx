import React, { useState, useEffect } from 'react';
import { Button, Card, Table, Spin, message, Modal, Form, InputNumber, Select, Popconfirm } from 'antd';
import { EditOutlined, PlusOutlined } from '@ant-design/icons';
import { supabaseClient } from '../../main';

// 定义现金余额记录类型
interface CashBalanceRecord {
  id: string;
  user_id: string;
  cash_balance: number;
  pending_funds: number;
  total_deposits: number;
  total_withdrawals: number;
  created_at: string;
  updated_at: string;
}

// 定义用户类型
interface User {
  id: string;
  name: string;
}

const CashBalanceManagement: React.FC = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<CashBalanceRecord | null>(null);
  const [isAddMode, setIsAddMode] = useState(false);
  const [records, setRecords] = useState<CashBalanceRecord[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [form] = Form.useForm();
  const [searchForm] = Form.useForm();
  const [searchCriteria, setSearchCriteria] = useState<{
    user_id?: string;
  }>({});

  // 获取用户数据
  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoadingUsers(true);
      try {
        const { data, error } = await supabaseClient
          .from('users')
          .select('id, name');

        if (error) {
          console.error('Error fetching users:', error);
          message.error('获取用户数据失败');
          return;
        }

        setUsers(data || []);
      } catch (err) {
        console.error('Exception fetching users:', err);
        message.error('获取用户数据时发生异常');
      } finally {
        setIsLoadingUsers(false);
      }
    };

    fetchUsers();
  }, []);

  // 获取现金余额记录
  const fetchRecords = React.useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabaseClient
        .from('cash_balances')
        .select('*')
        .order('created_at', { ascending: false });

      // 应用搜索条件
      if (searchCriteria.user_id) {
        query = query.eq('user_id', searchCriteria.user_id);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching cash balances:', error);
        message.error('获取现金余额记录失败');
        return;
      }

      setRecords(data || []);
    } catch (err) {
      console.error('Exception fetching cash balances:', err);
      message.error('获取现金余额记录时发生异常');
    } finally {
      setIsLoading(false);
    }
  }, [searchCriteria]);

  // 组件挂载时获取记录
  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // 获取用户名称
  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user?.name || userId;
  };

  // 显示编辑记录模态框
  const showEditModal = (record: CashBalanceRecord) => {
    setIsAddMode(false);
    setSelectedRecord(record);
    setIsModalVisible(true);
    form.setFieldsValue({
      cash_balance: record.cash_balance,
      pending_funds: record.pending_funds,
      total_deposits: record.total_deposits,
      total_withdrawals: record.total_withdrawals
    });
  };

  // 显示添加记录模态框
  const showAddModal = () => {
    setIsAddMode(true);
    setSelectedRecord(null);
    setIsModalVisible(true);
    form.resetFields();
  };

  // 处理搜索
  const handleSearch = (values: any) => {
    setSearchCriteria({
      user_id: values.user_id
    });
    fetchRecords();
  };

  // 处理重置
  const handleReset = () => {
    searchForm.resetFields();
    setSearchCriteria({});
    fetchRecords();
  };

  // 关闭模态框
  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setSelectedRecord(null);
  };

  // 提交表单（添加/编辑）
  const handleSubmit = async (values: any) => {
    try {
      if (isAddMode) {
        // 添加模式
        const { user_id, ...restValues } = values;
        
        // 检查是否已存在该用户的现金余额记录
        const { data: existingRecord, error: checkError } = await supabaseClient
          .from('cash_balances')
          .select('id')
          .eq('user_id', user_id)
          .single();
        
        if (checkError && checkError.code !== 'PGRST116') {
          // PGRST116表示没有找到记录，这是正常情况
          throw checkError;
        }
        
        if (existingRecord) {
          message.error('该用户已存在现金余额记录');
          return;
        }
        
        // 准备添加数据
        const insertData = {
          user_id,
          ...restValues
        };
        
        // 添加数据
        const { error } = await supabaseClient
          .from('cash_balances')
          .insert(insertData);
        
        if (error) {
          throw error;
        }
        
        message.success('添加现金余额记录成功');
      } else {
        // 编辑模式
        if (!selectedRecord) return;

        // 准备更新数据
        const updateData: Partial<CashBalanceRecord> = {
          cash_balance: values.cash_balance,
          pending_funds: values.pending_funds,
          total_deposits: values.total_deposits,
          total_withdrawals: values.total_withdrawals
        };

        // 更新数据
        const { error } = await supabaseClient
          .from('cash_balances')
          .update(updateData)
          .eq('id', selectedRecord.id);

        if (error) {
          throw error;
        }

        message.success('编辑现金余额记录成功');
      }

      setIsModalVisible(false);
      form.resetFields();
      fetchRecords(); // 重新获取记录
    } catch (err: any) {
      console.error('Failed to submit record:', err);
      message.error(err.message || (isAddMode ? '添加现金余额记录失败' : '编辑现金余额记录失败'));
    }
  };

  // 删除现金余额记录
  const handleDelete = async (record: CashBalanceRecord) => {
    try {
      const { error } = await supabaseClient
        .from('cash_balances')
        .delete()
        .eq('id', record.id);

      if (error) {
        throw error;
      }

      message.success('删除现金余额记录成功');
      fetchRecords(); // 重新获取记录
    } catch (err: any) {
      console.error('Failed to delete record:', err);
      message.error(err.message || '删除现金余额记录失败');
    }
  };

  // 表格列配置
  const columns = [
    {
      title: '客户',
      dataIndex: 'user_id',
      key: 'user_id',
      render: (userId: string) => getUserName(userId),
      width: 120,
    },
    {
      title: '现金余额',
      dataIndex: 'cash_balance',
      key: 'cash_balance',
      render: (cashBalance: number) => `¥${cashBalance.toLocaleString()}`,
      width: 120,
    },
    {
      title: '在途资金',
      dataIndex: 'pending_funds',
      key: 'pending_funds',
      render: (pendingFunds: number) => `¥${pendingFunds.toLocaleString()}`,
      width: 120,
    },
    {
      title: '累计入金',
      dataIndex: 'total_deposits',
      key: 'total_deposits',
      render: (totalDeposits: number) => `¥${totalDeposits.toLocaleString()}`,
      width: 120,
    },
    {
      title: '累计出金',
      dataIndex: 'total_withdrawals',
      key: 'total_withdrawals',
      render: (totalWithdrawals: number) => `¥${totalWithdrawals.toLocaleString()}`,
      width: 120,
    },
    {
      title: '更新时间',
      dataIndex: 'updated_at',
      key: 'updated_at',
      render: (updatedAt: string) => new Date(updatedAt).toLocaleString('zh-CN'),
      width: 180,
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_unused: any, record: CashBalanceRecord) => (
        <>
          <Button 
            type="primary" 
            icon={<EditOutlined />} 
            size="small"
            onClick={() => showEditModal(record)}
            style={{ marginRight: 8 }}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除该现金余额记录吗？"
            onConfirm={() => handleDelete(record)}
            okText="确定"
            cancelText="取消"
          >
            <Button 
              danger 
              size="small"
            >
              删除
            </Button>
          </Popconfirm>
        </>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <h1>现金余额管理</h1>
      
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Form
            form={searchForm}
            layout="inline"
            onFinish={handleSearch}
          >
            <Form.Item name="user_id" label="客户">
              <Select
                placeholder="请选择客户"
                showSearch
                optionFilterProp="children"
                loading={isLoadingUsers}
                style={{ width: 150 }}
              >
                {users.map(user => (
                  <Select.Option key={user.id} value={user.id}>
                    {user.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" style={{ marginRight: 8 }}>搜索</Button>
              <Button onClick={handleReset}>重置</Button>
            </Form.Item>
          </Form>
          
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={showAddModal}
          >
            添加现金余额
          </Button>
        </div>

        <Spin spinning={isLoading}>
          <Table
            columns={columns}
            dataSource={records}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        </Spin>
      </Card>

      {/* 添加/编辑记录模态框 */}
      <Modal
        title={isAddMode ? "添加现金余额记录" : "编辑现金余额记录"}
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
      >
        {!isAddMode && selectedRecord && (
          <div style={{ marginBottom: 20, padding: 16, backgroundColor: '#f0f9ff', borderRadius: 6 }}>
            <div>
              <strong>客户:</strong> {getUserName(selectedRecord.user_id)}
            </div>
          </div>
        )}
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          style={{ maxWidth: 400, margin: '0 auto' }}
        >
          {/* 添加模式下显示客户选择 */}
          {isAddMode && (
            <Form.Item 
              name="user_id" 
              label="客户" 
              rules={[{ required: true, message: '请选择客户' }]}
            >
              <Select
                placeholder="请选择客户"
                showSearch
                optionFilterProp="children"
                loading={isLoadingUsers}
                style={{ width: '100%' }}
              >
                {users.map(user => (
                  <Select.Option key={user.id} value={user.id}>
                    {user.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          )}
          
          <Form.Item 
            name="cash_balance" 
            label="现金余额" 
            rules={[{ required: true, message: '请输入现金余额' }]}
          >
            <InputNumber 
              style={{ width: '100%' }} 
              min={0} 
              step={1000} 
              placeholder="请输入现金余额"
              formatter={value => value ? `¥${value.toLocaleString()}` : ''}
              parser={value => value ? parseFloat(value.replace(/[¥,]/g, '')) : 0}
            />
          </Form.Item>

          <Form.Item 
            name="pending_funds" 
            label="在途资金" 
            rules={[{ required: true, message: '请输入在途资金' }]}
          >
            <InputNumber 
              style={{ width: '100%' }} 
              min={0} 
              step={1000} 
              placeholder="请输入在途资金"
              formatter={value => value ? `¥${value.toLocaleString()}` : ''}
              parser={value => value ? parseFloat(value.replace(/[¥,]/g, '')) : 0}
            />
          </Form.Item>

          <Form.Item 
            name="total_deposits" 
            label="累计入金" 
            rules={[{ required: true, message: '请输入累计入金' }]}
          >
            <InputNumber 
              style={{ width: '100%' }} 
              min={0} 
              step={1000} 
              placeholder="请输入累计入金"
              formatter={value => value ? `¥${value.toLocaleString()}` : ''}
              parser={value => value ? parseFloat(value.replace(/[¥,]/g, '')) : 0}
            />
          </Form.Item>

          <Form.Item 
            name="total_withdrawals" 
            label="累计出金" 
            rules={[{ required: true, message: '请输入累计出金' }]}
          >
            <InputNumber 
              style={{ width: '100%' }} 
              min={0} 
              step={1000} 
              placeholder="请输入累计出金"
              formatter={value => value ? `¥${value.toLocaleString()}` : ''}
              parser={value => value ? parseFloat(value.replace(/[¥,]/g, '')) : 0}
            />
          </Form.Item>

          <Form.Item style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <Button onClick={handleCancel}>取消</Button>
            <Button type="primary" htmlType="submit">{isAddMode ? '确认添加' : '确认编辑'}</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CashBalanceManagement;