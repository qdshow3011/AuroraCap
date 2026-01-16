import React, { useState, useEffect, useCallback } from 'react';
import { Button, Card, Table, Spin, message, Alert, Modal, Form, Input, InputNumber, Select } from 'antd';
import { PlusOutlined, ReloadOutlined, EditOutlined } from '@ant-design/icons';
import { supabaseClient } from '../../main';
import { IBKRService } from '../../services/ibkr.service';


// 定义基金配置数据模型接口
export interface IbConfig {
  id: string;
  fund_name: string;
  report_token: string;
  report_query_id: string;
  created_at: string;
  updated_at: string;
}

// 定义基金数据模型接口
export interface IbFundData {
  id: string;
  fund_config_id: string;
  net_liquidation_value: number | null;
  reserved_fees: number | null;
  latest_shares: number | null;
  updated_at: string;
}

const InteractiveBrokersData: React.FC = () => {
  const [ibConfigs, setIbConfigs] = useState<IbConfig[]>([]);
  const [globalLoading, setGlobalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [currentEditId, setCurrentEditId] = useState<string | null>(null);
  const [fundOptions, setFundOptions] = useState<{ id: string; name: string }[]>([]);
  const [fundLoading, setFundLoading] = useState(false);
  const [fundDataMap, setFundDataMap] = useState<Record<string, IbFundData>>({});
  // 任务状态管理，用于跟踪每个基金的网络请求状态
  const [taskStatus, setTaskStatus] = useState<Record<string, 'idle' | 'loading' | 'success' | 'error'>>({});

  // 处理编辑按钮点击
  const handleEdit = (fundConfigId: string) => {
    setCurrentEditId(fundConfigId);
    const currentData = fundDataMap[fundConfigId];
    const currentConfig = ibConfigs.find(config => config.id === fundConfigId);
    
    // 初始化编辑表单
    editForm.setFieldsValue({
      net_liquidation_value: currentData?.net_liquidation_value || 0,
      reserved_fees: currentData?.reserved_fees || 0,
      latest_shares: currentData?.latest_shares || 0,
      report_token: currentConfig?.report_token || '',
      report_query_id: currentConfig?.report_query_id || ''
    });
    
    setIsEditModalVisible(true);
  };

  // 获取所有基金的最新数据
  const fetchAllFundLatestData = useCallback(async (configs: IbConfig[]) => {
    try {
      console.log('=== 开始获取基金最新数据 ===');
      console.log('基金配置数量:', configs.length);
      console.log('基金配置IDs:', configs.map(c => c.id));
      
      if (configs.length === 0) {
        console.log('没有基金配置，设置空的fundDataMap');
        setFundDataMap({});
        return;
      }

      // 为每个基金配置ID单独获取最新记录
      const dataMap: Record<string, IbFundData> = {};
      
      // 使用Promise.all并行获取所有基金的最新数据
      await Promise.all(configs.map(async (config) => {
        try {
          const { data, error } = await supabaseClient
            .from('ib_fund_data')
            .select('*')
            .eq('fund_config_id', config.id)
            .order('updated_at', { ascending: false })
            .limit(1);

          if (error) {
            console.error(`查询基金 ${config.id} 数据失败:`, error);
            return;
          }

          if (data && data.length > 0) {
            const latestData = data[0] as IbFundData;
            console.log('基金', config.fund_name, '最新数据:', latestData.net_liquidation_value);
            dataMap[config.id] = latestData;
          } else {
            console.log('基金', config.fund_name, '没有数据');
          }
        } catch (err) {
          console.error(`处理基金 ${config.id} 数据时出错:`, err);
        }
      }));

      console.log('构建的基金数据映射:', dataMap);
      setFundDataMap(dataMap);
      
      console.log('=== 基金最新数据获取完成 ===');
    } catch (err) {
      console.error('Failed to fetch all fund latest data:', err);
      setFundDataMap({});
    }
  }, []);

  // 加载基金配置数据
  const fetchIbConfigs = useCallback(async () => {
    setGlobalLoading(true);
    setError(null);
    try {
      const { data, error } = await supabaseClient
        .from('ib_fund_configs')
        .select('*')
        .order('fund_name', { ascending: true });

      if (error) {
        console.error('查询ib_fund_configs表失败:', error);
        throw error;
      }

      console.log('获取到的基金配置数据:', data);
      setIbConfigs(data as IbConfig[]);
      
      // 获取所有基金的最新数据
      if (data.length > 0) {
        await fetchAllFundLatestData(data as IbConfig[]);
      }
    } catch (err) {
      setError('加载基金配置数据失败，请稍后重试');
      message.error('加载基金配置数据失败');
      console.error('Failed to fetch IB configs:', err);
    } finally {
      setGlobalLoading(false);
    }
  }, [fetchAllFundLatestData]);

  // 表格列配置
  const columns = [
    { 
      title: '基金名称', 
      dataIndex: 'fund_name', 
      key: 'fund_name', 
      width: 150
    },
    { title: '盈透自主查询验证口令', dataIndex: 'report_token', key: 'report_token', width: 200 },
    { title: '自主查询ID', dataIndex: 'report_query_id', key: 'report_query_id', width: 150 },
    { title: 'IBKR账户总净清算价值', 
      key: 'net_liquidation_value', 
      width: 180, 
      render: (_: any, record: IbConfig) => {
        const latestData = fundDataMap[record.id];
        // 加强空值检查，确保只有当net_liquidation_value是有效数字时才调用toLocaleString()
        if (latestData && latestData.net_liquidation_value !== undefined && latestData.net_liquidation_value !== null && typeof latestData.net_liquidation_value === 'number') {
          return `$${latestData.net_liquidation_value.toLocaleString()}`;
        }
        return '-';
      }
    },
    { title: '预留未计提费用', 
      key: 'reserved_fees', 
      width: 150, 
      render: (_: any, record: IbConfig) => {
        const latestData = fundDataMap[record.id];
        if (latestData && latestData.reserved_fees !== undefined && latestData.reserved_fees !== null && typeof latestData.reserved_fees === 'number') {
          return `$${latestData.reserved_fees.toLocaleString()}`;
        }
        return '-';
      }
    },
    { title: '最新总份额', 
      key: 'latest_shares', 
      width: 150, 
      render: (_: any, record: IbConfig) => {
        const latestData = fundDataMap[record.id];
        if (latestData && latestData.latest_shares !== undefined && latestData.latest_shares !== null && typeof latestData.latest_shares === 'number') {
          return latestData.latest_shares.toLocaleString();
        }
        return '-';
      }
    },
    { title: '最新单位净值', 
      key: 'latest_unit_nav', 
      width: 150, 
      render: (_: any, record: IbConfig) => {
        const latestData = fundDataMap[record.id];
        // 检查所有参与计算的值是否有效
        if (latestData && 
            latestData.net_liquidation_value !== undefined && latestData.net_liquidation_value !== null && 
            latestData.reserved_fees !== undefined && latestData.reserved_fees !== null && 
            latestData.latest_shares !== undefined && latestData.latest_shares !== null && 
            typeof latestData.net_liquidation_value === 'number' && 
            typeof latestData.reserved_fees === 'number' && 
            typeof latestData.latest_shares === 'number' && 
            latestData.latest_shares > 0) {
          // 计算公式：(IBKR账户总净清算价值 - 预留未计提费用) / 最新总份额
          const unitNav = (latestData.net_liquidation_value - latestData.reserved_fees) / latestData.latest_shares;
          return `$${unitNav.toFixed(3)}`;
        }
        return '-';
      }
    },
    { 
      title: '操作', 
      key: 'action', 
      width: 200, 
      render: (_: any, record: IbConfig) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button 
            type="primary" 
            icon={<ReloadOutlined />}
            onClick={() => handleUpdateNow(record.id)}
            loading={taskStatus[record.id] === 'loading'}
            disabled={taskStatus[record.id] === 'loading'}
          >
            更新
          </Button>
          <Button 
            type="default" 
            icon={<EditOutlined />}
            onClick={() => handleEdit(record.id)}
            disabled={taskStatus[record.id] === 'loading'}
          >
            编辑
          </Button>
        </div>
      )
    }
  ];

  // 获取基金产品列表
  const fetchFundProducts = useCallback(async () => {
    setFundLoading(true);
    try {
      // 先获取所有产品，不进行过滤
      const { data, error } = await supabaseClient
        .from('products')
        .select('id, name_cn')
        .order('name_cn', { ascending: true });

      if (error) {
        message.error(`获取产品列表失败: ${error.message}`);
        console.error('Failed to fetch products:', error);
        setFundOptions([]);
        return;
      }

      console.log('Fetched products:', data);
      
      // 设置所有产品作为选项（暂时不进行过滤）
      setFundOptions(data.map(item => ({
        id: item.id as string,
        name: item.name_cn as string
      })));
      

    } catch (err: any) {
      message.error(`加载产品列表失败: ${err.message || '未知错误'}`);
      console.error('Failed to fetch fund products:', err);
      setFundOptions([]);
    } finally {
      setFundLoading(false);
    }
  }, []);

  // 显示新增基金配置模态框
  const showAddModal = () => {
    setIsModalVisible(true);
    form.resetFields();
    fetchFundProducts(); // 每次打开模态框时重新获取基金产品列表
  };

  // 关闭新增基金配置模态框
  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };



  // 即时更新数据 - 在后台运行网络请求
  const handleUpdateNow = async (fundConfigId: string) => {
    // 设置当前基金的任务状态为loading
    setTaskStatus(prev => ({ ...prev, [fundConfigId]: 'loading' }));
    
    try {
      // 1. 获取基金配置信息
      console.log('=== 开始更新基金数据 ===');
      console.log('基金配置ID:', fundConfigId);
      
      const { data: configData, error: configError } = await supabaseClient
        .from('ib_fund_configs')
        .select('*')
        .eq('id', fundConfigId)
        .single();
      
      if (configError || !configData) {
        console.error('基金配置信息获取失败:', configError);
        throw new Error('基金配置信息不存在');
      }
      
      console.log('获取到的基金配置:', configData);
      console.log('report_token:', configData.report_token);
      console.log('report_query_id:', configData.report_query_id);

      // 2. 使用IBKRService类同步数据
      console.log('=== 创建IBKRService实例 ===');
      const ibkrService = new IBKRService(configData.report_token, configData.report_query_id);
      console.log('=== 调用syncDailyAssets ===');
      const syncResult = await ibkrService.syncDailyAssets(fundConfigId);
      
      console.log('=== 同步结果 ===');
      console.log(syncResult);

      // 更新任务状态为success
      setTaskStatus(prev => ({ ...prev, [fundConfigId]: 'success' }));
      
      // 显示成功消息
      message.success(`数据更新成功`);
      
      // 重新加载数据
      fetchIbConfigs(); 
      
      // 1秒后重置任务状态
      setTimeout(() => {
        setTaskStatus(prev => ({ ...prev, [fundConfigId]: 'idle' }));
      }, 1000);
    } catch (err: any) {
      // 更新任务状态为error
      setTaskStatus(prev => ({ ...prev, [fundConfigId]: 'error' }));
      
      let errorMessage = '数据更新失败';
      
      // 根据错误类型提供更具体的提示
      if (err.message.includes('ECONNABORTED') || err.message.includes('timeout')) {
        errorMessage = '数据更新失败：IBKR API请求超时。建议检查网络连接或稍后重试。';
      } else if (err.message.includes('500') || err.message.includes('服务器内部错误')) {
        errorMessage = '数据更新失败：IBKR服务器内部错误。可能是API临时问题或参数错误，请稍后重试。';
      } else if (err.message.includes('Network Error') || err.message.includes('ERR_FAILED')) {
        errorMessage = '数据更新失败：网络连接问题。请检查网络连接或稍后重试。';
      } else if (err.message.includes('未找到ReferenceCode')) {
        errorMessage = '数据更新失败：无法获取IBKR报表引用码。请检查token和queryId是否正确。';
      } else if (err.message.includes('XML') || err.message.includes('报表数据')) {
        errorMessage = '数据更新失败：解析IBKR报表失败。请检查报表格式是否正确，或联系管理员。';
      } else if (err.message.includes('HTML页面')) {
        errorMessage = '数据更新失败：IBKR服务器返回了错误页面。可能是API端点变更或访问限制，请联系管理员。';
      } else if (err.message.includes('token') || err.message.includes('queryId')) {
        errorMessage = '数据更新失败：请检查token和queryId是否正确。';
      } else {
        errorMessage = `数据更新失败: ${err.message}`;
      }
      
      // 显示错误消息
      message.error(errorMessage);
      console.error('Failed to update data:', err);
      
      // 2秒后重置任务状态
      setTimeout(() => {
        setTaskStatus(prev => ({ ...prev, [fundConfigId]: 'idle' }));
      }, 2000);
    }
  };

  // 提交编辑基金数据
  const handleEditSubmit = async () => {
    try {
      if (!currentEditId) return;
      
      const values = await editForm.validateFields();
      const { report_token, report_query_id, net_liquidation_value, reserved_fees, latest_shares } = values;
      
      // 更新基金配置信息（验证口令和查询ID）
      const { error: configError } = await supabaseClient
        .from('ib_fund_configs')
        .update({
          report_token,
          report_query_id
        })
        .eq('id', currentEditId);
      
      if (configError) {
        throw new Error(`更新基金配置失败: ${configError.message}`);
      }
      
      // 检查是否已存在该基金的数据记录
      const { data: existingDataArray, error: checkError } = await supabaseClient
        .from('ib_fund_data')
        .select('*')
        .eq('fund_config_id', currentEditId)
        .order('updated_at', { ascending: false })
        .limit(1);
      
      if (checkError) {
        throw new Error(`检查基金数据失败: ${checkError.message}`);
      }
      
      // 获取最新的基金数据记录
      const existingData = existingDataArray && existingDataArray.length > 0 ? existingDataArray[0] : null;
      
      // 根据是否存在记录决定是插入还是更新
      if (existingData) {
        // 更新现有记录
        const { error: updateError } = await supabaseClient
          .from('ib_fund_data')
          .update({
            net_liquidation_value: net_liquidation_value,
            reserved_fees: reserved_fees,
            latest_shares: latest_shares,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingData.id);
        
        if (updateError) {
          throw new Error(`更新基金数据失败: ${updateError.message}`);
        }
      } else {
        // 插入新记录
        const { error: insertError } = await supabaseClient
          .from('ib_fund_data')
          .insert({
            fund_config_id: currentEditId,
            net_liquidation_value: net_liquidation_value,
            reserved_fees: reserved_fees,
            latest_shares: latest_shares,
            updated_at: new Date().toISOString()
          });
        
        if (insertError) {
          throw new Error(`插入基金数据失败: ${insertError.message}`);
        }
      }
      
      message.success('数据编辑成功');
      setIsEditModalVisible(false);
      fetchIbConfigs(); // 重新加载数据
    } catch (err: any) {
      console.error('Failed to edit fund data:', err);
      message.error(err.message || '数据编辑失败');
    }
  };

  // 提交新增盈透数据
  const handleAddFundConfig = async () => {
    try {
      const values = await form.validateFields();
      
      // 插入新的基金配置
      const { data: configData, error: configError } = await supabaseClient
        .from('ib_fund_configs')
        .insert([{
          fund_name: values.fund_name,
          fund_code: 'default', // 添加默认基金编号
          report_token: values.report_token,
          report_query_id: values.report_query_id
        }])
        .select('*')
        .single();

      if (configError || !configData) {
        throw configError || new Error('基金配置插入失败');
      }

      // 使用返回的配置ID插入基金数据
      const { error: dataError } = await supabaseClient
        .from('ib_fund_data')
        .insert({
          fund_config_id: configData.id,
          net_liquidation_value: values.net_liquidation_value,
          reserved_fees: values.reserved_fees,
          latest_shares: values.latest_shares,
          updated_at: new Date().toISOString()
        });

      if (dataError) {
        throw dataError;
      }

      message.success('新增盈透数据成功');
      setIsModalVisible(false);
      form.resetFields();
      fetchIbConfigs(); // 重新加载数据
    } catch (err: any) {
      console.error('Failed to add fund data:', err);
      message.error(err.message || '新增盈透数据失败');
    }
  };

  // 自动同步功能：每天北京时间5:00执行
  useEffect(() => {
    // 检查当前时间是否为北京时间5:00的函数
    const checkAndSync = async () => {
      try {
        // 获取当前北京时间
        const now = new Date();
        const beijingTime = new Date(now.getTime() + 8 * 60 * 60 * 1000); // GMT+8
        const hours = beijingTime.getUTCHours();
        const minutes = beijingTime.getUTCMinutes();
        
        console.log('=== 自动同步时间检查 ===');
        console.log('当前北京时间:', beijingTime.toISOString());
        console.log('小时:', hours);
        console.log('分钟:', minutes);
        
        // 如果当前时间是5:00，则执行同步
        if (hours === 5 && minutes === 0) {
          console.log('=== 触发自动同步 ===');
          
          // 获取所有基金配置
          const { data: configs, error: configError } = await supabaseClient
            .from('ib_fund_configs')
            .select('*');
          
          if (configError) {
            console.error('获取基金配置失败:', configError);
            return;
          }
          
          // 对每个基金执行同步
          if (configs && configs.length > 0) {
            for (const config of configs) {
              // 跳过已经在同步的基金
              if (taskStatus[config.id] === 'loading') continue;
              
              console.log('=== 自动同步基金 ===');
              console.log('基金ID:', config.id);
              console.log('基金名称:', config.fund_name);
              
              // 设置任务状态
              setTaskStatus(prev => ({ ...prev, [config.id]: 'loading' }));
              
              try {
                // 创建IBKRService实例并执行同步
                const ibkrService = new IBKRService(config.report_token, config.report_query_id);
                await ibkrService.syncDailyAssets(config.id);
                
                // 更新任务状态为成功
                setTaskStatus(prev => ({ ...prev, [config.id]: 'success' }));
                
                // 1秒后重置任务状态
                setTimeout(() => {
                  setTaskStatus(prev => ({ ...prev, [config.id]: 'idle' }));
                }, 1000);
              } catch (syncError) {
                console.error('自动同步基金失败:', syncError);
                // 更新任务状态为错误
                setTaskStatus(prev => ({ ...prev, [config.id]: 'error' }));
                
                // 2秒后重置任务状态
                setTimeout(() => {
                  setTaskStatus(prev => ({ ...prev, [config.id]: 'idle' }));
                }, 2000);
              }
              
              // 避免同时发起过多请求，每个同步间隔1秒
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            // 同步完成后重新加载数据
            await fetchIbConfigs();
            
            console.log('=== 自动同步完成 ===');
          }
        }
      } catch (error) {
        console.error('自动同步检查失败:', error);
      }
    };
    
    // 立即执行一次检查
    checkAndSync();
    
    // 每分钟检查一次
    const intervalId = setInterval(checkAndSync, 60000);
    
    // 组件卸载时清除定时器
    return () => clearInterval(intervalId);
  }, [fetchIbConfigs, taskStatus]);
  
  // 组件加载时初始化数据
  useEffect(() => {
    fetchIbConfigs();
    fetchFundProducts();
  }, [fetchIbConfigs, fetchFundProducts]);

  return (
    <div>
      <Card 
        title="盈透数据管理"
        extra={
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={showAddModal}
          >
            新增盈透数据
          </Button>
        }
      >
        {error && (
          <Alert message="错误" description={error} type="error" showIcon style={{ marginBottom: 16 }} />
        )}
        
        <Spin spinning={globalLoading}>
          <Table
            columns={columns}
            dataSource={ibConfigs}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        </Spin>
      </Card>

      {/* 新增盈透数据模态框 */}
      <Modal
        title="新增盈透数据"
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          name="add_fund_config"
          onFinish={handleAddFundConfig}
        >
          <Form.Item
            name="fund_name"
            label="基金名称"
            rules={[{ required: true, message: '请选择基金名称' }]}
          >
            <Select 
              placeholder="请选择基金名称" 
              showSearch 
              filterOption={(input, option) => {
                if (!option) return false;
                const optionValue = (option as any).children as string;
                return optionValue.toLowerCase().includes(input.toLowerCase());
              }}
              loading={fundLoading}
            >
              {fundOptions.map(option => (
                <Select.Option key={option.id} value={option.name}>{option.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          

          
          <Form.Item
            name="report_token"
            label="盈透自主查询验证口令"
            rules={[{ required: true, message: '请输入盈透自主查询验证口令' }]}
          >
            <Input.Password placeholder="请输入盈透自主查询验证口令" />
          </Form.Item>
          
          <Form.Item
            name="report_query_id"
            label="自主查询ID"
            rules={[{ required: true, message: '请输入自主查询ID' }]}
          >
            <Input placeholder="请输入自主查询ID" />
          </Form.Item>
          
          <Form.Item
            name="net_liquidation_value"
            label="IBKR账户总净清算价值"
            rules={[
              { required: true, message: '请输入IBKR账户总净清算价值' },
              { type: 'number', min: 0, message: 'IBKR账户总净清算价值必须大于等于0' }
            ]}
          >
            <InputNumber 
              placeholder="请输入IBKR账户总净清算价值" 
              style={{ width: '100%' }} 
              min={0}
              step={0.01}
              formatter={(value) => {
                if (value === undefined || value === null) return '';
                return value ? `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '$ 0';
              }}
              parser={(value) => {
                if (value === undefined || value === null) return 0;
                if (typeof value === 'number') return value;
                const parsedValue = parseFloat((value as string).replace(/^\$\s?|,/g, ''));
                return isNaN(parsedValue) ? 0 : parsedValue;
              }}
            />
          </Form.Item>
          
          <Form.Item
            name="reserved_fees"
            label="预留未计提费用"
            rules={[
              { required: true, message: '请输入预留未计提费用' },
              { type: 'number', min: 0, message: '预留未计提费用必须大于等于0' }
            ]}
          >
            <InputNumber 
              placeholder="请输入预留未计提费用" 
              style={{ width: '100%' }} 
              min={0}
              step={0.01}
              formatter={(value) => {
                if (value === undefined || value === null) return '';
                return value ? `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '$ 0';
              }}
              parser={(value) => {
                if (value === undefined || value === null) return 0;
                if (typeof value === 'number') return value;
                const parsedValue = parseFloat((value as string).replace(/^\$\s?|,/g, ''));
                return isNaN(parsedValue) ? 0 : parsedValue;
              }}
            />
          </Form.Item>
          
          <Form.Item
            name="latest_shares"
            label="最新总份额"
            rules={[
              { required: true, message: '请输入最新总份额' },
              { type: 'number', min: 0, message: '最新总份额必须大于等于0' }
            ]}
          >
            <InputNumber 
              placeholder="请输入最新总份额" 
              style={{ width: '100%' }} 
              min={0}
              step={0.01}
              formatter={(value) => {
                if (value === undefined || value === null || isNaN(value)) return '';
                return value.toLocaleString();
              }}
              parser={(value) => {
                if (value === undefined || value === null) return 0;
                if (typeof value === 'number') return value;
                const stringValue = (value as string).replace(/,/g, '');
                const parsedValue = parseFloat(stringValue);
                return isNaN(parsedValue) ? 0 : parsedValue;
              }}
            />
          </Form.Item>
          
          <Form.Item style={{ textAlign: 'right' }}>
            <Button type="default" onClick={handleCancel} style={{ marginRight: 8 }}>
              取消
            </Button>
            <Button type="primary" htmlType="submit">
              确定
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑基金数据模态框 */}
      <Modal
        title="编辑基金数据"
        open={isEditModalVisible}
        onCancel={() => setIsEditModalVisible(false)}
        footer={null}
      >
        <Form
          form={editForm}
          layout="vertical"
          name="edit_fund_data"
          onFinish={handleEditSubmit}
        >
          <Form.Item
            name="report_token"
            label="验证口令"
            rules={[{ required: true, message: '请输入验证口令' }]}
          >
            <Input.Password placeholder="请输入验证口令" />
          </Form.Item>
          
          <Form.Item
            name="report_query_id"
            label="查询ID"
            rules={[{ required: true, message: '请输入查询ID' }]}
          >
            <Input placeholder="请输入查询ID" />
          </Form.Item>
          
          <Form.Item
            name="net_liquidation_value"
            label="IBKR账户总净清算价值"
            rules={[
              { required: true, message: '请输入IBKR账户总净清算价值' },
              { type: 'number', min: 0, message: 'IBKR账户总净清算价值必须大于等于0' }
            ]}
          >
            <InputNumber 
              placeholder="请输入IBKR账户总净清算价值" 
              style={{ width: '100%' }} 
              min={0}
              step={0.01}
              formatter={(value) => {
                if (value === undefined || value === null) return '';
                return value ? `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '$ 0';
              }}
              parser={(value) => {
                if (value === undefined || value === null) return 0;
                if (typeof value === 'number') return value;
                const parsedValue = parseFloat((value as string).replace(/^\$\s?|,/g, ''));
                return isNaN(parsedValue) ? 0 : parsedValue;
              }}
            />
          </Form.Item>
          
          <Form.Item
            name="reserved_fees"
            label="预留未计提费用"
            rules={[
              { required: true, message: '请输入预留未计提费用' },
              { type: 'number', min: 0, message: '预留未计提费用必须大于等于0' }
            ]}
          >
            <InputNumber 
              placeholder="请输入预留未计提费用" 
              style={{ width: '100%' }} 
              min={0}
              step={0.01}
              formatter={(value) => {
                if (value === undefined || value === null) return '';
                return value ? `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '$ 0';
              }}
              parser={(value) => {
                if (value === undefined || value === null) return 0;
                if (typeof value === 'number') return value;
                const parsedValue = parseFloat((value as string).replace(/^\$\s?|,/g, ''));
                return isNaN(parsedValue) ? 0 : parsedValue;
              }}
            />
          </Form.Item>
          
          <Form.Item
            name="latest_shares"
            label="最新总份额"
            rules={[
              { required: true, message: '请输入最新总份额' },
              { type: 'number', min: 0, message: '最新总份额必须大于等于0' }
            ]}
          >
            <InputNumber 
              placeholder="请输入最新总份额" 
              style={{ width: '100%' }} 
              min={0}
              step={0.01}
              formatter={(value) => {
                if (value === undefined || value === null || isNaN(value)) return '';
                return value.toLocaleString();
              }}
              parser={(value) => {
                if (value === undefined || value === null) return 0;
                if (typeof value === 'number') return value;
                const stringValue = (value as string).replace(/,/g, '');
                const parsedValue = parseFloat(stringValue);
                return isNaN(parsedValue) ? 0 : parsedValue;
              }}
            />
          </Form.Item>
          
          <Form.Item style={{ textAlign: 'right' }}>
            <Button type="default" onClick={() => setIsEditModalVisible(false)} style={{ marginRight: 8 }}>
              取消
            </Button>
            <Button type="primary" htmlType="submit">
              保存
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default InteractiveBrokersData;
