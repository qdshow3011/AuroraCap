import React, { useState, useEffect } from 'react';
import { Button, Card, Table, Spin, message, Modal, Form, InputNumber, Select, Popconfirm, DatePicker } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { supabaseClient } from '../../main';

// 定义申购/赎回记录类型
interface SubscriptionRedemptionRecord {
  id: string;
  user_id: string;
  fund_id: string;
  type: 'subscription' | 'redemption';
  shares: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  nav: number;
  total_amount: number;
  created_at: string;
  updated_at: string;
}

// 定义基金类型
interface Fund {
  id: string;
  name_cn: string;
  name_en: string;
}

// 定义用户类型
interface User {
  id: string;
  name: string;
}

// 定义基金数据模型接口
interface IbFundData {
  id: string;
  fund_config_id: string;
  net_liquidation_value: number | null;
  reserved_fees: number | null;
  latest_shares: number | null;
  updated_at: string;
}

const SubscriptionRedemptionManagement: React.FC = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<SubscriptionRedemptionRecord | null>(null);
  const [records, setRecords] = useState<SubscriptionRedemptionRecord[]>([]);
  const [funds, setFunds] = useState<Fund[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [ibFundDataMap, setIbFundDataMap] = useState<Record<string, IbFundData>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingFunds, setIsLoadingFunds] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [form] = Form.useForm();
  const [searchForm] = Form.useForm();
  const [searchCriteria, setSearchCriteria] = useState<{
    user_id?: string;
    fund_id?: string;
    type?: 'subscription' | 'redemption';
    status?: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  }>({});

  // 获取基金数据
  useEffect(() => {
    const fetchFunds = async () => {
      setIsLoadingFunds(true);
      try {
        const { data, error } = await supabaseClient
          .from('products')
          .select('id, name_cn, name_en');

        if (error) {
          console.error('Error fetching funds:', error);
          message.error('获取基金产品数据失败');
          return;
        }

        setFunds(data || []);
      } catch (err) {
        console.error('Exception fetching funds:', err);
        message.error('获取基金产品数据时发生异常');
      } finally {
        setIsLoadingFunds(false);
      }
    };

    fetchFunds();
  }, []);

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

  // 获取IB基金数据
  useEffect(() => {
    const fetchIbFundData = async () => {
      try {
        // 获取基金配置
        const { data: configs, error: configError } = await supabaseClient
          .from('ib_fund_configs')
          .select('*');

        if (configError) {
          console.error('Error fetching IB fund configs:', configError);
          return;
        }

        // 获取基金数据
        const { data: ibData, error: ibDataError } = await supabaseClient
          .from('ib_fund_data')
          .select('*');

        if (ibDataError) {
          console.error('Error fetching IB fund data:', ibDataError);
          return;
        }

        // 构建基金配置映射
        const configMap = new Map((configs || []).map(config => [config.id, config]));

        // 构建基金名称到最新IB数据的映射
        const dataMap: Record<string, IbFundData> = {};
        (ibData || []).forEach(data => {
          const config = configMap.get(data.fund_config_id);
          if (config) {
            const fundName = config.fund_name;
            if (!dataMap[fundName] || new Date(data.updated_at) > new Date(dataMap[fundName].updated_at)) {
              dataMap[fundName] = data as IbFundData;
            }
          }
        });

        setIbFundDataMap(dataMap);
      } catch (err) {
        console.error('Exception fetching IB fund data:', err);
      }
    };

    fetchIbFundData();
  }, []);

  // 获取申购/赎回记录
  const fetchRecords = React.useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabaseClient
        .from('subscription_redemption')
        .select('*')
        .order('created_at', { ascending: false });

      // 应用搜索条件
      if (searchCriteria.user_id) {
        query = query.eq('user_id', searchCriteria.user_id);
      }

      if (searchCriteria.fund_id) {
        query = query.eq('fund_id', searchCriteria.fund_id);
      }

      if (searchCriteria.type) {
        query = query.eq('type', searchCriteria.type);
      }

      if (searchCriteria.status) {
        query = query.eq('status', searchCriteria.status);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching subscription/redemption records:', error);
        message.error('获取申购/赎回记录失败');
        return;
      }

      setRecords(data || []);
    } catch (err) {
      console.error('Exception fetching subscription/redemption records:', err);
      message.error('获取申购/赎回记录时发生异常');
    } finally {
      setIsLoading(false);
    }
  }, [searchCriteria]);

  // 组件挂载时获取记录
  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // 获取基金名称
  const getFundName = (fundId: string) => {
    const fund = funds.find(f => f.id === fundId);
    return fund?.name_cn || fund?.name_en || fundId;
  };

  // 获取用户名称
  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user?.name || userId;
  };

  // 获取最新净值
  const getLatestNav = (fundId: string) => {
    const fund = funds.find(f => f.id === fundId);
    if (!fund) return 0;

    const fundName = fund.name_cn || fund.name_en;
    const ibData = ibFundDataMap[fundName];

    if (!ibData || ibData.latest_shares === null || ibData.latest_shares === 0) return 0;

    const netLiquidationValue = ibData.net_liquidation_value || 0;
    const reservedFees = ibData.reserved_fees || 0;

    return (netLiquidationValue - reservedFees) / ibData.latest_shares;
  };

  // 计算结算价值
  const calculateSettlementValue = (shares: number, fundId: string) => {
    const latestNav = getLatestNav(fundId);
    return Math.round(shares * latestNav);
  };

  // 显示添加记录模态框
  const showAddModal = () => {
    setIsEditMode(false);
    setCurrentRecord(null);
    setIsModalVisible(true);
    form.resetFields();
  };

  // 显示编辑记录模态框
  const showEditModal = (record: SubscriptionRedemptionRecord) => {
    setIsEditMode(true);
    setCurrentRecord(record);
    setIsModalVisible(true);
    form.setFieldsValue({
      user_id: record.user_id,
      fund_id: record.fund_id,
      type: record.type,
      shares: record.shares,
      status: record.status
    });
  };

  // 处理搜索
  const handleSearch = (values: any) => {
    setSearchCriteria({
      user_id: values.user_id,
      fund_id: values.fund_id,
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
      const latestNav = getLatestNav(values.fund_id);
      const totalAmount = values.shares * latestNav;
      const now = new Date().toISOString();

      if (isEditMode && currentRecord) {
        // 编辑模式：更新记录
        // 准备更新数据
        const updateData: Partial<SubscriptionRedemptionRecord> = {
          user_id: values.user_id,
          fund_id: values.fund_id,
          type: values.type,
          shares: values.shares,
          nav: latestNav,
          total_amount: totalAmount,
          status: values.status,
          updated_at: now,
        };

        // 更新数据
        const { error } = await supabaseClient
          .from('subscription_redemption')
          .update(updateData)
          .eq('id', currentRecord.id);

        if (error) {
          throw error;
        }

        message.success('编辑申购/赎回记录成功');

        // 更新用户持仓
        await updateUserPosition(values.user_id, values.fund_id);
      } else {
        // 新增模式：插入记录
        // 准备数据
        const recordData: Partial<SubscriptionRedemptionRecord> = {
          user_id: values.user_id,
          fund_id: values.fund_id,
          type: values.type,
          shares: values.shares,
          nav: latestNav,
          total_amount: totalAmount,
          status: values.status || 'pending',
          created_at: now,
          updated_at: now,
        };

        // 插入数据
        const { error } = await supabaseClient
          .from('subscription_redemption')
          .insert([recordData]);

        if (error) {
          throw error;
        }

        message.success('添加申购/赎回记录成功');

        // 更新用户持仓
        await updateUserPosition(values.user_id, values.fund_id);
      }

      setIsModalVisible(false);
      form.resetFields();
      fetchRecords(); // 重新获取记录
    } catch (err: any) {
      console.error('Failed to submit record:', err);
      message.error(err.message || (isEditMode ? '编辑申购/赎回记录失败' : '添加申购/赎回记录失败'));
    }
  };

  // 删除记录
  const deleteRecord = async (record: SubscriptionRedemptionRecord) => {
    try {
      // 删除记录
      const { error } = await supabaseClient
        .from('subscription_redemption')
        .delete()
        .eq('id', record.id);

      if (error) {
        throw error;
      }

      message.success('删除申购/赎回记录成功');

      // 更新用户持仓
      await updateUserPosition(record.user_id, record.fund_id);

      // 重新获取记录
      fetchRecords();
    } catch (err: any) {
      console.error('Failed to delete record:', err);
      message.error(err.message || '删除申购/赎回记录失败');
    }
  };

  // 更新用户持仓
  const updateUserPosition = async (userId: string, fundId: string) => {
    try {
      // 获取该用户对该基金的所有申购/赎回记录
      const { data: allRecords, error: recordsError } = await supabaseClient
        .from('subscription_redemption')
        .select('*')
        .eq('user_id', userId)
        .eq('fund_id', fundId)
        .order('created_at', { ascending: true });

      if (recordsError) throw recordsError;

      // 计算当前份额和成本
      let currentShares = 0;
      let totalSubscriptionAmount = 0;
      let totalRedemptionAmount = 0;

      allRecords?.forEach(record => {
        if (record.type === 'subscription') {
          currentShares += record.shares;
          totalSubscriptionAmount += record.shares * (record.nav || getLatestNav(fundId));
        } else {
          const redemptionCost = record.shares * (record.nav || getLatestNav(fundId));
          currentShares -= record.shares;
          totalRedemptionAmount += redemptionCost;
        }
      });

      // 确保份额不为负
      currentShares = Math.max(0, currentShares);

      const latestNav = getLatestNav(fundId);

      // 计算持仓成本
      let avgCost = 0;
      if (currentShares > 0) {
        avgCost = (totalSubscriptionAmount - totalRedemptionAmount) / currentShares;
      }

      // 查找现有持仓
      const { data: existingPositions, error: findError } = await supabaseClient
        .from('positions')
        .select('*')
        .eq('user_id', userId)
        .eq('fund_id', fundId);

      if (findError) throw findError;

      if (existingPositions && existingPositions.length > 0) {
        // 更新现有持仓
        const position = existingPositions[0];
        const currentValue = currentShares * latestNav;

        const { error: updateError } = await supabaseClient
          .from('positions')
          .update({
            shares: currentShares,
            avg_cost: avgCost,
            latest_nav: latestNav,
            current_value: currentValue,
            updated_at: new Date().toISOString(),
          })
          .eq('id', position.id);

        if (updateError) throw updateError;
      } else if (currentShares > 0) {
        // 创建新持仓
        const currentValue = currentShares * latestNav;
        const { error: insertError } = await supabaseClient
          .from('positions')
          .insert([{
            user_id: userId,
            fund_id: fundId,
            shares: currentShares,
            avg_cost: avgCost,
            latest_nav: latestNav,
            current_value: currentValue,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }]);

        if (insertError) throw insertError;
      }
    } catch (err: any) {
      console.error('Failed to update user position:', err);
      message.error('更新用户持仓失败');
    }
  };

  // 获取状态名称
  const getStatusName = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: '待处理',
      processing: '处理中',
      completed: '已完成',
      failed: '失败',
      cancelled: '已取消'
    };
    return statusMap[status] || status;
  };

  // 更新记录状态
  const updateRecordStatus = async (recordId: string, newStatus: string) => {
    try {
      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabaseClient
        .from('subscription_redemption')
        .update(updateData)
        .eq('id', recordId);

      if (error) {
        throw error;
      }

      message.success('状态更新成功');
      fetchRecords();

      // 如果状态变为已完成，更新用户持仓
      if (newStatus === 'completed') {
        const record = records.find(r => r.id === recordId);
        if (record) {
          await updateUserPosition(record.user_id, record.fund_id);
        }
      }
    } catch (err: any) {
      console.error('更新状态失败:', err);
      message.error('更新状态失败');
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
      title: '基金产品',
      dataIndex: 'fund_id',
      key: 'fund_id',
      render: (fundId: string) => getFundName(fundId),
      width: 180,
    },
    {
      title: '申购/赎回',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => type === 'subscription' ? '申购' : '赎回',
      width: 100,
    },
    {
      title: '份额',
      dataIndex: 'shares',
      key: 'shares',
      render: (shares: number) => shares.toLocaleString(),
      width: 120,
    },
    {
      title: '结算价值',
      key: 'settlement_value',
      render: (_: any, record: SubscriptionRedemptionRecord) => {
        const settlementValue = calculateSettlementValue(record.shares, record.fund_id);
        return settlementValue > 0 ? `¥${settlementValue.toLocaleString()}` : '-';
      },
      width: 140,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusName = getStatusName(status);
        let statusColor = '#1890ff'; // 蓝色 - 默认
        if (status === 'pending') statusColor = '#faad14'; // 黄色 - 待处理
        if (status === 'processing') statusColor = '#1890ff'; // 蓝色 - 处理中
        if (status === 'completed') statusColor = '#52c41a'; // 绿色 - 已完成
        if (status === 'failed') statusColor = '#f5222d'; // 红色 - 失败
        if (status === 'cancelled') statusColor = '#8c8c8c'; // 灰色 - 已取消
        return <span style={{ color: statusColor }}>{statusName}</span>;
      },
      width: 100,
    },
    {
      title: '申请时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (createdAt: string) => new Date(createdAt).toLocaleString('zh-CN'),
      width: 180,
    },
    {
      title: '操作',
      key: 'action',
      width: 300,
      render: (_unused: any, record: SubscriptionRedemptionRecord) => (
        <>
          {record.status === 'pending' && (
            <>
              <Button 
                type="primary" 
                size="small"
                style={{ marginRight: 8 }}
                onClick={() => updateRecordStatus(record.id, 'processing')}
              >
                开始处理
              </Button>
              <Button 
                danger 
                size="small"
                style={{ marginRight: 8 }}
                onClick={() => {
                  // 取消记录
                  updateRecordStatus(record.id, 'cancelled');
                }}
              >
                取消
              </Button>
            </>
          )}
          {record.status === 'processing' && (
            <>
              <Button 
                type="primary" 
                size="small"
                style={{ marginRight: 8 }}
                onClick={() => updateRecordStatus(record.id, 'completed')}
              >
                标记完成
              </Button>
              <Button 
                danger 
                size="small"
                style={{ marginRight: 8 }}
                onClick={() => {
                  // 标记失败
                  updateRecordStatus(record.id, 'failed');
                }}
              >
                标记失败
              </Button>
            </>
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
      <h1>申购/赎回管理</h1>
      
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

          <Form.Item name="fund_id" label="基金产品">
            <Select
              placeholder="请选择基金产品"
              showSearch
              optionFilterProp="children"
              loading={isLoadingFunds}
              style={{ width: 150 }}
            >
              {funds.map(fund => (
                <Select.Option key={fund.id} value={fund.id}>
                  {fund.name_cn || fund.name_en}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="type" label="类型">
            <Select
              placeholder="请选择类型"
              style={{ width: 120 }}
            >
              <Select.Option value="subscription">申购</Select.Option>
              <Select.Option value="redemption">赎回</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="status" label="状态">
            <Select
              placeholder="请选择状态"
              style={{ width: 120 }}
            >
              <Select.Option value="pending">待处理</Select.Option>
              <Select.Option value="processing">处理中</Select.Option>
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
        title={isEditMode ? "编辑申购/赎回记录" : "新增申购/赎回记录"}
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
            name="fund_id" 
            label="基金产品" 
            rules={[{ required: true, message: '请选择基金产品' }]}
          >
            <Select
              placeholder="请选择基金产品"
              showSearch
              optionFilterProp="children"
              loading={isLoadingFunds}
            >
              {funds.map(fund => (
                <Select.Option key={fund.id} value={fund.id}>
                  {fund.name_cn || fund.name_en}
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
              <Select.Option value="subscription">申购</Select.Option>
              <Select.Option value="redemption">赎回</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item 
            name="shares" 
            label="份额" 
            rules={[{ required: true, message: '请输入份额' }]}
          >
            <InputNumber 
              style={{ width: '100%' }} 
              min={0} 
              step={10} 
              placeholder="请输入份额"
              formatter={value => value ? value.toLocaleString() : ''}
              parser={value => value ? parseInt(value.replace(/,/g, ''), 10) : 0}
            />
          </Form.Item>

          <Form.Item 
            name="status" 
            label="状态" 
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select placeholder="请选择状态">
              <Select.Option value="pending">待处理</Select.Option>
              <Select.Option value="processing">处理中</Select.Option>
              <Select.Option value="completed">已完成</Select.Option>
              <Select.Option value="failed">失败</Select.Option>
              <Select.Option value="cancelled">已取消</Select.Option>
            </Select>
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

export default SubscriptionRedemptionManagement;