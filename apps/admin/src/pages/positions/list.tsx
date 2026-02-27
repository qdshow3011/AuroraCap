import React, { useState, useEffect } from 'react';
import { Button, Form, InputNumber, message, Modal, Table, Popconfirm } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { Position, Fund, User } from '../../types';
import { supabaseClient } from '../../main';


const PositionsList: React.FC = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [funds, setFunds] = useState<Fund[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingFunds, setIsLoadingFunds] = useState(true); // 添加基金加载状态
  
  // 将form实例提升到组件作用域，使用useRef存储
  const formRef = React.useRef<any>();
  
  // 创建一个FormModal组件，在内部使用useForm
  const FormModal = () => {
    const [form] = Form.useForm();
    
    // 将form实例保存到ref中，供父组件使用
    React.useEffect(() => {
      formRef.current = form;
    }, [form]);
    
    // 使用另一个useEffect处理selectedPosition变化，设置表单值
    React.useEffect(() => {
      if (selectedPosition) {
        form.setFieldsValue({
          shares: selectedPosition.shares,
          latest_nav: selectedPosition.latest_nav || 0,
        });
      }
    }, [form]);
    
    return (
      <Form
        form={form}
        layout="vertical"
        onFinish={handleAdjustSubmit}
        initialValues={{ shares: selectedPosition?.shares, latest_nav: selectedPosition?.latest_nav }}
        style={{ maxWidth: 400, margin: '0 auto' }}
      >
        <Form.Item 
          name="shares" 
          label={
            <span style={{ fontWeight: 500, color: '#333' }}>持仓份额</span>
          } 
          rules={[{ required: true, message: '请输入持仓份额' }]}
        >
          <InputNumber 
            style={{ width: '100%', borderRadius: 4, height: 36 }} 
            min={0} 
            step={10} 
            placeholder="请输入持仓份额"
            variant="outlined"
          />
        </Form.Item>

        <Form.Item 
          name="latest_nav" 
          label={
            <span style={{ fontWeight: 500, color: '#333' }}>最新净值</span>
          } 
          rules={[{ required: true, message: '请输入最新净值' }]}
        >
          <InputNumber 
            style={{ width: '100%', borderRadius: 4, height: 36 }} 
            min={0} 
            step={0.01} 
            precision={2} 
            placeholder="请输入最新净值"
            variant="outlined"
          />
        </Form.Item>

        <Form.Item style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 32 }}>
          <Button 
            onClick={handleCancel} 
            style={{ borderRadius: 4, height: 36, padding: '0 24px' }}
          >
            取消
          </Button>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={tableProps.loading} 
            style={{ borderRadius: 4, height: 36, padding: '0 24px' }}
          >
            确认调整
          </Button>
        </Form.Item>
      </Form>
    );
  };

  // 使用自定义的方式获取positions数据，直接从Supabase查询并包含基金名称
  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoadingPositions, setIsLoadingPositions] = useState(true);

  // 定义独立的获取positions数据函数
  const fetchPositionsWithFundNames = React.useCallback(async () => {
    console.log('=== FETCHING POSITIONS WITH FUND NAMES ===');
    console.log('Current funds data:', funds);
    console.log('Funds data length:', funds.length);
    
    setIsLoadingPositions(true);
    try {
      // 直接查询positions表，不使用join功能
      const { data: positionsData, error: positionsError } = await supabaseClient
        .from('positions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10); // 初始加载10条记录

      if (positionsError) {
        console.error('Error fetching positions:', positionsError);
        message.error('获取持仓数据失败');
        return;
      }

      console.log('Fetched positions data:', positionsData);
      
      // 转换数据格式，保留完整的信息，并将fund_id和user_id转换为字符串类型
      const formattedPositions = (positionsData || []).map((item: any) => ({
        ...item,
        fund_id: String(item.fund_id), // 确保fund_id始终是字符串类型
        user_id: String(item.user_id)  // 确保user_id始终是字符串类型
      }));

      // 获取所有ib_fund_configs和ib_fund_data数据
      const { data: ibFundConfigsData, error: ibFundConfigsError } = await supabaseClient
        .from('ib_fund_configs')
        .select('*');

      if (ibFundConfigsError) {
        console.error('Error fetching ib_fund_configs:', ibFundConfigsError);
        // 这里不抛出错误，因为即使没有ib_fund_data，我们仍然可以显示positions数据
      }

      // 获取所有ib_fund_data数据
      const { data: ibFundData, error: ibFundDataError } = await supabaseClient
        .from('ib_fund_data')
        .select('*')
        .order('updated_at', { ascending: false });

      if (ibFundDataError) {
        console.error('Error fetching ib_fund_data:', ibFundDataError);
        // 这里不抛出错误，因为即使没有ib_fund_data，我们仍然可以显示positions数据
      }

      // 建立ib_fund_configs和ib_fund_data的映射
      const fundConfigMap = new Map();
      (ibFundConfigsData || []).forEach(config => {
        fundConfigMap.set(String(config.id), config);
        console.log('Added config to fundConfigMap:', String(config.id), config.fund_name);
      });

      // 建立fund_name到ib_fund_data的映射（因为ib_fund_configs中的fund_name应该对应products表中的name_cn或name_en）
      const ibFundDataMap = new Map();
      (ibFundData || []).forEach(data => {
        const config = fundConfigMap.get(String(data.fund_config_id));
        if (config) {
          console.log('Processing ib_fund_data for config:', config.fund_name);
          // 对于每个fund_name，只保留最新的ib_fund_data记录
          if (!ibFundDataMap.has(config.fund_name) || 
              new Date(data.updated_at) > new Date(ibFundDataMap.get(config.fund_name).updated_at)) {
            ibFundDataMap.set(config.fund_name, data);
            console.log('Added/updated ib_fund_data for:', config.fund_name);
          }
        } else {
          console.log('No config found for fund_config_id:', data.fund_config_id);
        }
      });

      console.log('=== IB FUND DATA ANALYSIS ===');
      console.log('Fetched ib_fund_configs:', ibFundConfigsData);
      console.log('Fetched ib_fund_data:', ibFundData);
      console.log('Fund config map keys:', Array.from(fundConfigMap.keys()));
      console.log('IB fund data map keys:', Array.from(ibFundDataMap.keys()));
      
      // 输出所有可用的fund_name和ib_fund_data
      console.log('=== AVAILABLE FUND DATA ===');
      Array.from(ibFundDataMap.entries()).forEach(([fundName, data]) => {
        console.log(`Fund: ${fundName} - Data:`, data);
      });

      // 将ib_fund_data信息添加到positions数据中
      const positionsWithIbData = formattedPositions.map(position => {
        // 获取对应基金的ib_fund_data
        const fund = funds.find(f => String(f.id) === String(position.fund_id));
        const fundName = fund ? (fund.name_cn || fund.name_en) : null;
        const ibData = fundName ? ibFundDataMap.get(fundName) : null;
        
        console.log('=== POSITION IB DATA MATCHING ===');
        console.log('Position ID:', position.id);
        console.log('Original fund_id:', position.fund_id);
        console.log('Normalized fund_id:', String(position.fund_id));
        console.log('Found fund:', fund);
        console.log('Fund name_cn:', fund?.name_cn);
        console.log('Fund name_en:', fund?.name_en);
        console.log('Fund name used for lookup:', fundName);
        console.log('Available ibFundDataMap keys:', Array.from(ibFundDataMap.keys()));
        console.log('Fund name in ibFundDataMap:', fundName ? ibFundDataMap.has(fundName) : 'N/A');
        console.log('Found ibData:', ibData);
        
        return {
          ...position,
          ib_fund_data: ibData || null
        };
      });

      setPositions(positionsWithIbData);
    } catch (err) {
      console.error('Exception fetching positions:', err);
      message.error('获取持仓数据时发生异常');
    } finally {
      setIsLoadingPositions(false);
    }
  }, [funds]);

  // 组件挂载时获取positions数据，且当funds变化时重新获取
  useEffect(() => {
    fetchPositionsWithFundNames();
  }, [fetchPositionsWithFundNames]);

  // 创建自定义的tableProps，因为我们不再使用useTable的数据获取功能
  // 当positions或funds变化时，tableProps会自动更新，触发表格重新渲染
  const tableProps: any = {
    dataSource: positions,
    loading: isLoadingPositions || isLoadingFunds
  };

  // Fetch funds for dropdown directly using Supabase client
  useEffect(() => {
    const fetchFunds = async () => {
      console.log('Starting to fetch funds...');
      setIsLoadingFunds(true);
      try {
        // 直接查询products表，明确指定需要的字段，包括时间戳
        const { data, error } = await supabaseClient
          .from('products')
          .select('id, name_cn, created_at, updated_at');

        if (error) {
          console.error('Error fetching products:', error);
          message.error('获取基金产品数据失败');
          return;
        }

        console.log('Fetched products data:', data); // 添加调试信息
        console.log('Fetched products data type:', typeof data);
        console.log('Fetched products data length:', data?.length);
        
        // 确保数据是数组，并将id转换为字符串类型，同时添加缺少的属性
        const fundsData = Array.isArray(data) ? data.map(fund => ({
          ...fund,
          id: String(fund.id), // 确保id始终是字符串类型
          name_en: (fund as any).name_en || '', // 添加默认值
          created_at: fund.created_at || '', // 添加默认值
          updated_at: fund.updated_at || ''  // 添加默认值
        })) : [];
        console.log('Setting funds data:', fundsData);
        
        // 调试信息：打印转换后的funds数据结构
        console.log('Funds data structure:', fundsData.map(fund => ({ id: fund.id, type: typeof fund.id, name_cn: fund.name_cn })));
        
        setFunds(fundsData);
        // 取消显示加载成功提示
      } catch (err) {
        console.error('Exception fetching products:', err);
        message.error('获取基金产品数据时发生异常');
      } finally {
        setIsLoadingFunds(false);
      }
    };

    fetchFunds();
  }, []);

  // 添加调试信息，查看positions数据
  useEffect(() => {
    if (tableProps.dataSource && funds.length > 0) {
      console.log('=== POSITIONS DATA ANALYSIS ===');
      console.log('Positions data:', tableProps.dataSource);
      console.log('Funds data:', funds);
      
      // 分析每个position的fund_id是否能在funds中找到匹配
      tableProps.dataSource.forEach((position: any, index: number) => {
        const fundId = String(position.fund_id);
        const foundFund = funds.find(fund => String(fund.id) === fundId);
        
        console.log(`Position ${index} fund_id analysis:`, {
          positionId: position.id,
          originalFundId: position.fund_id,
          fundIdType: typeof position.fund_id,
          normalizedFundId: fundId,
          foundFund: foundFund,
          found: !!foundFund,
          name_cn: foundFund?.name_cn
        });
      });
    }
  }, [tableProps.dataSource, funds]);



  // Fetch users for dropdown directly using Supabase client
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      console.log('Starting to fetch users...');
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

        console.log('Fetched users data:', data);
        
        if (data) {
          // 确保userId始终是字符串类型
          const formattedUsers = Array.isArray(data) ? data.map(user => ({
            ...user,
            id: String(user.id) // 确保id始终是字符串类型
          })) : [];
          setUsers(formattedUsers as User[]);
        }
      } catch (err) {
        console.error('Exception fetching users:', err);
        message.error('获取用户数据时发生异常');
      } finally {
        setIsLoadingUsers(false);
      }
    };

    fetchUsers();
  }, []);

  const showAdjustModal = (record: Position) => {
    setSelectedPosition(record);
    setIsModalVisible(true);
  };

  const handleDeletePosition = async (record: Position) => {
    try {
      const { error } = await supabaseClient
        .from('positions')
        .delete()
        .eq('id', record.id);

      if (error) {
        throw error;
      }

      message.success('持仓删除成功！');
      fetchPositionsWithFundNames();
    } catch (error) {
      console.error('持仓删除失败:', error);
      message.error('持仓删除失败，请重试！');
    }
  };

  const handleAdjustSubmit = async (values: any) => {
    if (!selectedPosition) return;

    try {
      // 计算current_value = shares * latest_nav
      const current_value = values.shares * values.latest_nav;
      
      // 直接更新数据库记录，包含计算好的current_value
      const { error } = await supabaseClient
        .from('positions')
        .update({
          shares: values.shares,
          latest_nav: values.latest_nav,
          current_value: current_value,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedPosition.id);

      if (error) {
        throw error;
      }

      message.success('持仓调整成功！');
      setIsModalVisible(false);
      // 手动刷新持仓数据
      fetchPositionsWithFundNames();
    } catch (error) {
      console.error('持仓调整失败:', error);
      message.error('持仓调整失败，请重试！');
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setSelectedPosition(null);
  };

  // 获取基金产品名称的函数
  const getFundProductName = (fundId: string | number) => {
    // 确保fundId是字符串类型
    const normalizedFundId = String(fundId);
    
    // 检查funds数组是否已加载
    if (!funds || funds.length === 0) {
      console.warn('Funds array is empty or not loaded yet');
      return normalizedFundId;
    }
    
    // 在funds数组中查找匹配的基金
    const matchedFund = funds.find(fund => {
      const fundIdStr = String(fund.id);
      return fundIdStr === normalizedFundId;
    });
    
    // 如果找到匹配的基金，优先返回中文名称，否则返回英文名称或fundId
    const result = matchedFund?.name_cn || matchedFund?.name_en || normalizedFundId;
    
    // 调试信息：只在找不到基金时显示
    if (!matchedFund) {
      console.warn(`Fund with ID ${normalizedFundId} not found in funds array`);
      console.log('Available funds:', funds.map(fund => ({ id: fund.id, name_cn: fund.name_cn })));
    }
    
    return result;
  };

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user?.name || userId;
  };

  const columns = [
    {
      title: '用户',
      dataIndex: 'user_id',
      key: 'user_id',
      render: (userId: string) => getUserName(userId),
    },
    {
      title: '基金',
      dataIndex: 'fund_id',
      key: 'fund_id',
      render: (fundId: string) => getFundProductName(fundId),
    },
    {
      title: '持仓份额',
      dataIndex: 'shares',
      key: 'shares',
      sorter: true,
    },
    {
      title: '持仓成本',
      dataIndex: 'avg_cost',
      key: 'avg_cost',
      sorter: true,
      render: (avgCost: number) => `$${avgCost.toFixed(2)}`,
    },
    {
      title: '最新净值',
      dataIndex: 'latest_nav',
      key: 'latest_nav',
      sorter: true,
      render: (_: any, record: any) => {
        // 调试信息
        console.log('=== LATEST NAV RENDERING ===');
        console.log('Record:', record);
        console.log('Has ib_fund_data:', !!record.ib_fund_data);
        
        // 检查是否有ib_fund_data
        if (!record.ib_fund_data) {
          console.log('No ib_fund_data available');
          return '-';
        }
        
        const { net_liquidation_value, reserved_fees, latest_shares } = record.ib_fund_data;
        
        console.log('Net liquidation value:', net_liquidation_value);
        console.log('Reserved fees:', reserved_fees);
        console.log('Latest shares:', latest_shares);
        
        // 检查必要字段是否存在且有效
        if (net_liquidation_value === null || net_liquidation_value === undefined) {
          console.log('Net liquidation value is null or undefined');
          return '-';
        }
        
        if (reserved_fees === null || reserved_fees === undefined) {
          console.log('Reserved fees is null or undefined');
          return '-';
        }
        
        if (latest_shares === null || latest_shares === undefined || latest_shares === 0) {
          console.log('Latest shares is null, undefined or 0');
          return '-';
        }
        
        // 计算最新净值：(总净清算价值 - 预留费用) / 最新总份额
        const latestNav = (net_liquidation_value - reserved_fees) / latest_shares;
        
        console.log('Calculated latest NAV:', latestNav);
        
        return `$${latestNav.toFixed(3)}`;
      },
    },
    {
      title: '基金市值',
      key: 'total_value',
      render: (_: any, record: any) => {
        // 计算最新净值
        let latestNav = 0;
        if (record.ib_fund_data) {
          const { net_liquidation_value, reserved_fees, latest_shares } = record.ib_fund_data;
          if (net_liquidation_value !== null && reserved_fees !== null && latest_shares !== null && latest_shares !== 0) {
            latestNav = (net_liquidation_value - reserved_fees) / latest_shares;
          }
        }
        
        // 计算基金市值 = 份额 × 最新净值
        const totalValue = record.shares * latestNav;
        return latestNav > 0 ? `$${totalValue.toFixed(2)}` : '-';
      },
      sorter: (a: any, b: any) => {
        // 计算a的最新净值
        let latestNavA = 0;
        if (a.ib_fund_data) {
          const { net_liquidation_value: nlvA, reserved_fees: rfA, latest_shares: lsA } = a.ib_fund_data;
          if (nlvA !== null && rfA !== null && lsA !== null && lsA !== 0) {
            latestNavA = (nlvA - rfA) / lsA;
          }
        }
        
        // 计算b的最新净值
        let latestNavB = 0;
        if (b.ib_fund_data) {
          const { net_liquidation_value: nlvB, reserved_fees: rfB, latest_shares: lsB } = b.ib_fund_data;
          if (nlvB !== null && rfB !== null && lsB !== null && lsB !== 0) {
            latestNavB = (nlvB - rfB) / lsB;
          }
        }
        
        // 计算基金市值
        const valueA = a.shares * latestNavA;
        const valueB = b.shares * latestNavB;
        return valueA - valueB;
      },
    },
    {
      title: '最近购买时间',
      dataIndex: 'created_at',
      key: 'created_at',
      sorter: true,
      render: (createdAt: string) => new Date(createdAt).toISOString().split('T')[0],
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: Position) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => showAdjustModal(record)}
          >
            调整
          </Button>
          <Popconfirm
            title="确定要删除这条持仓记录吗？"
            onConfirm={() => handleDeletePosition(record)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              danger
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  // 确保funds、positions和users数据都加载完成后再渲染表格
  if (isLoadingFunds || isLoadingPositions || isLoadingUsers) {
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        <div style={{ fontSize: 18, color: '#666', marginBottom: 16 }}>
          {isLoadingFunds ? '正在加载基金产品数据...' : 
           isLoadingPositions ? '正在加载持仓数据...' : 
           '正在加载用户数据...'}
        </div>
        <div style={{ fontSize: 14, color: '#999' }}>
          请稍候，系统正在获取数据
        </div>
      </div>
    );
  }
  
  // 即使funds数组为空，也渲染表格，但显示提示信息
  if (funds.length === 0) {
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        <div style={{ fontSize: 18, color: '#666', marginBottom: 16 }}>
          暂无基金产品数据
        </div>
        <div style={{ fontSize: 14, color: '#999' }}>
          请先在基金管理中添加基金产品
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: '#1890ff' }}>基金持仓管理</h2>
          <div style={{ fontSize: 14, color: '#666', marginTop: 4 }}>
            实时监控和管理客户持仓信息
          </div>
        </div>
      </div>
      <Table
        {...tableProps}
        columns={columns}
        rowKey="id"
        bordered
        pagination={{ pageSizeOptions: ['10', '20', '50'], showSizeChanger: true, showTotal: (total) => `共 ${total} 条记录` }}
        scroll={{ x: 800 }}
        style={{ marginTop: 0 }}
        rowClassName="position-row"
        onRow={() => ({
          onMouseEnter: () => {
            // 可以添加行悬停效果逻辑
          },
        })}
        loading={tableProps.loading}
      />

      <Modal
        title={
          <div style={{ fontSize: 18, fontWeight: 600, color: '#333' }}>
            调整持仓
          </div>
        }
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        destroyOnHidden
        centered
        width={500}
        style={{ borderRadius: 8 }}
        styles={{
          body: { padding: '24px 32px' },
          mask: { backgroundColor: 'rgba(0, 0, 0, 0.5)' },
        }}
      >
        {selectedPosition && (
          <div style={{ marginBottom: 20, padding: 16, backgroundColor: '#f0f9ff', borderRadius: 6 }}>
            <div style={{ marginBottom: 8 }}>
              <strong>客户:</strong> {getUserName(selectedPosition.user_id)}
            </div>
            <div>
              <strong>基金:</strong> {getFundProductName(selectedPosition.fund_id)}
            </div>
          </div>
        )}
        <FormModal />
      </Modal>
    </div>
  );
};

export default PositionsList;