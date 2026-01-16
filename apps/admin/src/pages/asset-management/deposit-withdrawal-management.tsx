import React, { useState, useEffect } from 'react';
import { Button, Card, Table, Spin, message, Modal, Form, InputNumber, Input, Select, Popconfirm, DatePicker } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { supabaseClient } from '../../main';


// 定义入金/出金记录类型
interface DepositWithdrawalRecord {
  id: string;
  user_id: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  transaction_date: string;
  created_at: string;
  updated_at: string;
  notes?: string;
}

// 定义用户类型
interface User {
  id: string;
  name: string;
}

const DepositWithdrawalManagement: React.FC = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<DepositWithdrawalRecord | null>(null);
  const [records, setRecords] = useState<DepositWithdrawalRecord[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [form] = Form.useForm();
  const [searchForm] = Form.useForm();
  const [searchCriteria, setSearchCriteria] = useState<{
    user_id?: string;
    type?: 'deposit' | 'withdrawal';
    status?: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
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

  // 获取入金/出金记录
  const fetchRecords = React.useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabaseClient
        .from('deposit_withdrawal')
        .select('*')
        .order('created_at', { ascending: false });

      // 应用搜索条件
      if (searchCriteria.user_id) {
        query = query.eq('user_id', searchCriteria.user_id);
      }

      if (searchCriteria.type) {
        query = query.eq('type', searchCriteria.type);
      }

      if (searchCriteria.status) {
        query = query.eq('status', searchCriteria.status);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching deposit/withdrawal records:', error);
        message.error('获取入金/出金记录失败');
        return;
      }

      setRecords(data || []);
    } catch (err) {
      console.error('Exception fetching deposit/withdrawal records:', err);
      message.error('获取入金/出金记录时发生异常');
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

  // 获取类型名称
  const getTypeName = (type: string) => {
    return type === 'deposit' ? '入金' : '出金';
  };

  // 获取状态名称
  const getStatusName = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: '待处理',
      processing: '正在处理',
      completed: '已完成',
      failed: '失败',
      cancelled: '已取消'
    };
    return statusMap[status] || status;
  };

  // 显示添加记录模态框
  const showAddModal = () => {
    setIsEditMode(false);
    setCurrentRecord(null);
    setIsModalVisible(true);
    form.resetFields();
  };

  // 显示编辑记录模态框
  const showEditModal = (record: DepositWithdrawalRecord) => {
    setIsEditMode(true);
    setCurrentRecord(record);
    setIsModalVisible(true);
    
    form.setFieldsValue({
      user_id: record.user_id,
      type: record.type,
      amount: record.amount,
      status: record.status,
      notes: record.notes
    });
  };

  // 处理搜索
  const handleSearch = (values: any) => {
    setSearchCriteria({
      user_id: values.user_id,
      type: values.type,
      status: values.status
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
  };

  // 提交表单（新增或编辑）
  const handleSubmit = async (values: any) => {
    try {
      if (isEditMode && currentRecord) {
        // 编辑模式：更新记录
        // 准备更新数据
        const updateData: Partial<DepositWithdrawalRecord> = {
          user_id: values.user_id,
          type: values.type,
          amount: values.amount,
          status: values.status,
          notes: values.notes,
        };

        // 根据状态变化更新相应的时间字段
        // 注意：processed_at字段已从数据库表中移除

        // 更新数据
        const { error } = await supabaseClient
          .from('deposit_withdrawal')
          .update(updateData)
          .eq('id', currentRecord.id);

        if (error) {
          throw error;
        }

        // 如果状态变为已完成，更新用户现金余额
        if (values.status === 'completed' && currentRecord.status !== 'completed') {
          // 获取用户现金余额
          const { data: cashBalanceData, error: cashError } = await supabaseClient
            .from('cash_balances')
            .select('*')
            .eq('user_id', values.user_id)
            .single();

          if (cashError) {
            console.error('获取现金余额失败:', cashError);
          } else if (cashBalanceData) {
            // 计算新的现金余额
            let newBalance = cashBalanceData.cash_balance;
            let totalDeposits = cashBalanceData.total_deposits;
            let totalWithdrawals = cashBalanceData.total_withdrawals;

            if (values.type === 'deposit') {
              newBalance += values.amount;
              totalDeposits += values.amount;
            } else if (values.type === 'withdrawal') {
              newBalance -= values.amount;
              totalWithdrawals += values.amount;
            }

            // 更新现金余额
            const { error: updateError } = await supabaseClient
              .from('cash_balances')
              .update({
                cash_balance: newBalance,
                total_deposits: totalDeposits,
                total_withdrawals: totalWithdrawals
              })
              .eq('user_id', values.user_id);

            if (updateError) {
              console.error('更新现金余额失败:', updateError);
            }
          }
        }

        message.success('编辑入金/出金记录成功');
      } else {
        // 新增模式：插入记录
        // 准备数据
        const recordData: Partial<DepositWithdrawalRecord> = {
          user_id: values.user_id,
          type: values.type,
          amount: values.amount,
          status: values.status,
          transaction_date: new Date().toISOString(),
          notes: values.notes,
        };

        // 插入数据
        const { error } = await supabaseClient
          .from('deposit_withdrawal')
          .insert([recordData]);

        if (error) {
          throw error;
        }

        message.success('添加入金/出金记录成功');
      }

      setIsModalVisible(false);
      form.resetFields();
      fetchRecords(); // 重新获取记录
    } catch (err: any) {
      console.error('Failed to submit record:', err);
      message.error(err.message || (isEditMode ? '编辑入金/出金记录失败' : '添加入金/出金记录失败'));
    }
  };

  // 删除记录
  const deleteRecord = async (record: DepositWithdrawalRecord) => {
    try {
      // 删除记录
      const { error } = await supabaseClient
        .from('deposit_withdrawal')
        .delete()
        .eq('id', record.id);

      if (error) {
        throw error;
      }

      message.success('删除入金/出金记录成功');

      // 重新获取记录
      fetchRecords();
    } catch (err: any) {
      console.error('Failed to delete record:', err);
      message.error(err.message || '删除入金/出金记录失败');
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
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => getTypeName(type),
      width: 100,
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => `¥${amount.toLocaleString()}`,
      width: 120,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusName = getStatusName(status);
        let statusColor = '#1890ff'; // 蓝色 - 默认
        if (status === 'pending') statusColor = '#faad14'; // 黄色 - 待处理
        if (status === 'processing') statusColor = '#1890ff'; // 蓝色 - 正在处理
        if (status === 'completed') statusColor = '#52c41a'; // 绿色 - 已完成
        if (status === 'failed') statusColor = '#f5222d'; // 红色 - 失败
        if (status === 'cancelled') statusColor = '#8c8c8c'; // 灰色 - 已取消
        return <span style={{ color: statusColor }}>{statusName}</span>;
      },
      width: 100,
    },
    {
      title: '申请日期',
      dataIndex: 'transaction_date',
      key: 'transaction_date',
      render: (transactionDate: string) => transactionDate ? new Date(transactionDate).toLocaleString('zh-CN') : '-',
      width: 180,
    },

    {
      title: '备注',
      dataIndex: 'notes',
      key: 'notes',
      render: (notes: string) => notes || '-',
      width: 200,
    },
    {
      title: '操作',
      key: 'action',
      width: 250,
      render: (_unused: any, record: DepositWithdrawalRecord) => (
        <>
          {record.status === 'pending' && (
            <>
              <Button 
                type="primary" 
                size="small"
                style={{ marginRight: 8 }}
                onClick={async () => {
                  // 开始处理
                  try {
                    const updateData = {
                      status: 'processing'
                    };
                    await supabaseClient
                      .from('deposit_withdrawal')
                      .update(updateData)
                      .eq('id', record.id);
                    message.success('已开始处理');
                    fetchRecords();
                  } catch (err: any) {
                    console.error('开始处理失败:', err);
                    message.error('开始处理失败');
                  }
                }}
              >
                开始处理
              </Button>
              <Button 
                danger 
                size="small"
                style={{ marginRight: 8 }}
                onClick={() => {
                  // 直接拒绝（设为失败）
                  showEditModal(record);
                }}
              >
                拒绝
              </Button>
            </>
          )}
          {record.status === 'processing' && (
            <Button 
              type="primary" 
              size="small"
              style={{ marginRight: 8 }}
              onClick={async () => {
                // 直接标记为已完成
                try {
                  const updateData = {
                    status: 'completed'
                  };
                  await supabaseClient
                    .from('deposit_withdrawal')
                    .update(updateData)
                    .eq('id', record.id);
                  message.success('已标记为已完成');
                  // 更新用户现金余额
                  try {
                    const { data: cashBalanceData } = await supabaseClient
                      .from('cash_balances')
                      .select('*')
                      .eq('user_id', record.user_id)
                      .single();
                    if (cashBalanceData) {
                      let newBalance = cashBalanceData.cash_balance;
                      let totalDeposits = cashBalanceData.total_deposits;
                      let totalWithdrawals = cashBalanceData.total_withdrawals;

                      if (record.type === 'deposit') {
                        newBalance += record.amount;
                        totalDeposits += record.amount;
                      } else if (record.type === 'withdrawal') {
                        newBalance -= record.amount;
                        totalWithdrawals += record.amount;
                      }

                      await supabaseClient
                        .from('cash_balances')
                        .update({
                          cash_balance: newBalance,
                          total_deposits: totalDeposits,
                          total_withdrawals: totalWithdrawals
                        })
                        .eq('user_id', record.user_id);
                    }
                  } catch (err: any) {
                    console.error('更新现金余额失败:', err);
                  }
                  fetchRecords();
                } catch (err: any) {
                  console.error('标记完成失败:', err);
                  message.error('标记完成失败');
                }
              }}
            >
              标记完成
            </Button>
          )}
          <Button 
            icon={<EditOutlined />} 
            size="small"
            style={{ marginRight: 8 }}
            onClick={() => showEditModal(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这条记录吗？"
            onConfirm={() => deleteRecord(record)}
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
        </>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <h1>入金/出金管理</h1>
      
      <Card style={{ marginBottom: 24 }}>
        <Form
          form={searchForm}
          layout="inline"
          onFinish={handleSearch}
          style={{ marginBottom: 16 }}
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

          <Form.Item name="type" label="类型">
            <Select
              placeholder="请选择类型"
              style={{ width: 120 }}
            >
              <Select.Option value="deposit">入金</Select.Option>
              <Select.Option value="withdrawal">出金</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="status" label="状态">
            <Select
              placeholder="请选择状态"
              style={{ width: 120 }}
            >
              <Select.Option value="pending">待处理</Select.Option>
              <Select.Option value="processing">正在处理</Select.Option>
              <Select.Option value="completed">已完成</Select.Option>
              <Select.Option value="failed">失败</Select.Option>
              <Select.Option value="cancelled">已取消</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" style={{ marginRight: 8 }}>搜索</Button>
            <Button onClick={handleReset}>重置</Button>
          </Form.Item>
        </Form>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={showAddModal}
          >
            新增记录
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

      {/* 新增/编辑记录模态框 */}
      <Modal
        title={isEditMode ? "编辑入金/出金记录" : "新增入金/出金记录"}
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          style={{ maxWidth: 400, margin: '0 auto' }}
        >
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
            >
              {users.map(user => (
                <Select.Option key={user.id} value={user.id}>
                  {user.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item 
            name="type" 
            label="类型" 
            rules={[{ required: true, message: '请选择类型' }]}
          >
            <Select placeholder="请选择类型">
              <Select.Option value="deposit">入金</Select.Option>
              <Select.Option value="withdrawal">出金</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item 
            name="amount" 
            label="金额" 
            rules={[{ required: true, message: '请输入金额' }]}
          >
            <InputNumber<number> 
              style={{ width: '100%' }} 
              min={0} 
              step={1000} 
              placeholder="请输入金额"
              formatter={value => value ? `¥${value.toLocaleString()}` : ''}
              parser={value => value ? parseFloat(value.replace(/[¥,]/g, '')) : 0}
            />
          </Form.Item>

          <Form.Item 
            name="status" 
            label="状态" 
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select placeholder="请选择状态">
              <Select.Option value="pending">待处理</Select.Option>
              <Select.Option value="processing">正在处理</Select.Option>
              <Select.Option value="completed">已完成</Select.Option>
              <Select.Option value="failed">失败</Select.Option>
              <Select.Option value="cancelled">已取消</Select.Option>
            </Select>
          </Form.Item>



          <Form.Item 
            name="notes" 
            label="备注"
          >
            <Input.TextArea 
              rows={4} 
              placeholder="请输入备注"
              style={{ resize: 'vertical' }}
            />
          </Form.Item>

          <Form.Item style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <Button onClick={handleCancel}>取消</Button>
            <Button type="primary" htmlType="submit">确认添加</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DepositWithdrawalManagement;