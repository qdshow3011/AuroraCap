import React, { useState, useEffect } from 'react';
import { Button, Card, Table, Spin, message, Modal, Form, Input, InputNumber, Popconfirm, Select, Tag, Switch, Radio } from 'antd';
import { EditOutlined, DeleteOutlined, SyncOutlined } from '@ant-design/icons';
import { YahooIndex } from '@aurora/types';
import { supabaseClient } from '../../main';
import { finnhubService } from '../../services/finnhub.service';
import { alphaVantageService } from '../../services/alpha-vantage.service';
import { useNavigate } from 'react-router-dom';

const IndexManagement: React.FC = () => {
  const navigate = useNavigate();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentIndex, setCurrentIndex] = useState<YahooIndex | null>(null);
  const [indices, setIndices] = useState<YahooIndex[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedApi, setSelectedApi] = useState<'alpha-vantage' | 'finnhub'>('alpha-vantage');
  const [form] = Form.useForm();

  const fetchIndices = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabaseClient
        .from('yahoo_indices')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching securities:', error);
        message.error('获取证券数据失败');
        return;
      }

      setIndices(data || []);
    } catch (err) {
      console.error('Exception fetching securities:', err);
      message.error('获取证券数据时发生异常');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIndices();
  }, []);

  const handleSyncData = async () => {
    setIsSyncing(true);
    try {
      // 首先从数据库中获取所有已有的证券代码
      const { data: existingSecurities, error: fetchError } = await supabaseClient
        .from('yahoo_indices')
        .select('symbol');
      
      if (fetchError) {
        console.error('获取现有证券代码失败:', fetchError);
        message.error('获取现有证券代码失败');
        return;
      }
      
      const existingSymbols = existingSecurities?.map(security => security.symbol) || [];
      
      if (existingSymbols.length === 0) {
        message.warning('没有需要同步的证券');
        return;
      }
      
      console.log('开始同步证券数据，共', existingSymbols.length, '个证券');
      
      // 对每个证券代码进行同步
      let successCount = 0;
      let errorCount = 0;
      
      for (const symbol of existingSymbols) {
        try {
          let syncResult;
          if (selectedApi === 'finnhub') {
            syncResult = await finnhubService.syncSingleIndex(symbol);
          } else {
            syncResult = await alphaVantageService.syncSingleIndex(symbol);
          }
          
          if (syncResult.success) {
            successCount++;
            console.log(`证券 ${symbol} 同步成功`);
          } else {
            errorCount++;
            console.error(`证券 ${symbol} 同步失败:`, syncResult.message);
          }
        } catch (err) {
          errorCount++;
          console.error(`同步证券 ${symbol} 时发生错误:`, err);
        }
      }
      
      // 显示同步结果
      if (successCount > 0) {
        message.success(`成功同步 ${successCount} 个证券数据${errorCount > 0 ? `，${errorCount} 个证券同步失败` : ''}`);
      } else {
        message.error(`所有证券同步失败`);
      }
      
      // 重新获取证券数据
      await fetchIndices();
    } catch (err) {
      console.error('同步数据失败:', err);
      message.error(err instanceof Error ? err.message : '同步数据失败');
    } finally {
      setIsSyncing(false);
    }
  };

  const showEditModal = (record: YahooIndex) => {
    setIsEditMode(true);
    setCurrentIndex(record);
    form.setFieldsValue({
      symbol: record.symbol,
      name: record.name,
      price: record.price,
      change: record.change,
      change_percent: record.change_percent,
      previous_close: record.previous_close,
      open: record.open,
      high: record.high,
      low: record.low,
      volume: record.volume,
      market_type: record.market_type || 'other',
      is_enabled: record.is_enabled ?? true,
      data_source: record.data_source || 'finnhub',
    });
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setIsEditMode(false);
    setCurrentIndex(null);
    form.resetFields();
  };

  const handleEditSubmit = async (values: any) => {
    try {
      // 为非必填字段提供默认值
      const defaultValues = {
        name: values.name || values.symbol,
        price: values.price || 0,
        change: values.change || 0,
        change_percent: values.change_percent || 0,
        previous_close: values.previous_close || 0,
        open: values.open || 0,
        high: values.high || 0,
        low: values.low || 0,
        volume: values.volume || 0,
        market_type: values.market_type || 'other',
        is_enabled: values.is_enabled !== false,
        data_source: values.data_source || 'manual',
      };

      if (isEditMode && currentIndex) {
        // 编辑现有证券
        const { error } = await supabaseClient
          .from('yahoo_indices')
          .update({
            symbol: values.symbol,
            name: defaultValues.name,
            price: defaultValues.price,
            change: defaultValues.change,
            change_percent: defaultValues.change_percent,
            previous_close: defaultValues.previous_close,
            open: defaultValues.open,
            high: defaultValues.high,
            low: defaultValues.low,
            volume: defaultValues.volume,
            market_type: defaultValues.market_type,
            is_enabled: defaultValues.is_enabled,
            data_source: defaultValues.data_source,
            updated_at: new Date().toISOString(),
          })
          .eq('id', currentIndex.id);

        if (error) {
          console.error('Error updating security:', error);
          message.error('更新证券数据失败');
          return;
        }

        message.success('更新证券数据成功');
      } else {
        // 添加新证券
        const { error } = await supabaseClient
          .from('yahoo_indices')
          .insert({
            symbol: values.symbol,
            name: defaultValues.name,
            price: defaultValues.price,
            change: defaultValues.change,
            change_percent: defaultValues.change_percent,
            previous_close: defaultValues.previous_close,
            open: defaultValues.open,
            high: defaultValues.high,
            low: defaultValues.low,
            volume: defaultValues.volume,
            market_type: defaultValues.market_type,
            is_enabled: defaultValues.is_enabled,
            data_source: defaultValues.data_source,
            timestamp: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            sync_status: 'success',
            last_sync_time: new Date().toISOString(),
            sync_error_message: null,
          });

        if (error) {
          console.error('Error adding security:', error);
          message.error('添加证券数据失败');
          return;
        }

        message.success('添加证券数据成功');
      }

      setIsModalVisible(false);
      setIsEditMode(false);
      setCurrentIndex(null);
      form.resetFields();
      fetchIndices();
    } catch (err) {
      console.error('Exception submitting form:', err);
      message.error('提交表单时发生异常');
    }
  };

  const handleDelete = async (record: YahooIndex) => {
    try {
      const { error } = await supabaseClient
        .from('yahoo_indices')
        .delete()
        .eq('id', record.id);

      if (error) {
        console.error('Error deleting security:', error);
        message.error('删除证券数据失败');
        return;
      }

      message.success('删除证券数据成功');
      fetchIndices();
    } catch (err) {
      console.error('Exception deleting security:', err);
      message.error('删除证券数据时发生异常');
    }
  };

  const columns = [
    {
      title: '证券代码',
      dataIndex: 'symbol',
      key: 'symbol',
      width: 150,
      render: (text: string) => (
        <span 
          style={{ 
            fontWeight: 500, 
            color: '#1890ff', 
            cursor: 'pointer',
            textDecoration: 'underline'
          }} 
          onClick={() => navigate(`/asset-management/security-detail/${text}`)}
        >
          {text}
        </span>
      ),
    },
    {
      title: '证券名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: '市场类型',
      dataIndex: 'market_type',
      key: 'market_type',
      width: 100,
      render: (value: string) => {
        const typeMap: Record<string, { text: string; color: string }> = {
          'us': { text: '美股', color: 'blue' },
          'cn': { text: 'A股', color: 'red' },
          'hk': { text: '港股', color: 'orange' },
          'crypto': { text: '加密货币', color: 'purple' },
          'commodity': { text: '大宗商品', color: 'gold' },
          'other': { text: '其他', color: 'default' },
        };
        const { text, color } = typeMap[value] || typeMap['other'];
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: '同步状态',
      dataIndex: 'sync_status',
      key: 'sync_status',
      width: 100,
      render: (value: string) => {
        const statusMap: Record<string, { text: string; color: string }> = {
          'success': { text: '成功', color: 'success' },
          'failed': { text: '失败', color: 'error' },
          'pending': { text: '待同步', color: 'warning' },
        };
        const { text, color } = statusMap[value] || statusMap['pending'];
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: '数据来源',
      dataIndex: 'data_source',
      key: 'data_source',
      width: 120,
      render: (value: string) => {
        const sourceMap: Record<string, { text: string; color: string }> = {
          'alpha-vantage': { text: 'Alpha Vantage', color: 'purple' },
          'finnhub': { text: 'Finnhub', color: 'green' },
          'manual': { text: '手动录入', color: 'green' },
        };
        const { text, color } = sourceMap[value] || sourceMap['manual'];
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: '是否启用',
      dataIndex: 'is_enabled',
      key: 'is_enabled',
      width: 100,
      render: (value: boolean) => (
        <Tag color={value ? 'success' : 'default'}>
          {value ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '当前价格',
      dataIndex: 'price',
      key: 'price',
      width: 120,
      render: (value: number) => value?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '-',
    },
    {
      title: '涨跌额',
      dataIndex: 'change',
      key: 'change',
      width: 120,
      render: (value: number) => {
        const color = value > 0 ? '#52c41a' : value < 0 ? '#ff4d4f' : '#52c41a';
        const prefix = value > 0 ? '+' : '';
        return <span style={{ color }}>{prefix}{value?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '-'}</span>;
      },
    },
    {
      title: '涨跌幅(%)',
      dataIndex: 'change_percent',
      key: 'change_percent',
      width: 120,
      render: (value: number) => {
        const color = value > 0 ? '#52c41a' : value < 0 ? '#ff4d4f' : '#52c41a';
        const prefix = value > 0 ? '+' : '';
        return <span style={{ color }}>{prefix}{value?.toFixed(2) || '-'}%</span>;
      },
    },
    {
      title: '昨收',
      dataIndex: 'previous_close',
      key: 'previous_close',
      width: 120,
      render: (value: number) => value?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '-',
    },
    {
      title: '开盘',
      dataIndex: 'open',
      key: 'open',
      width: 120,
      render: (value: number) => value?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '-',
    },
    {
      title: '最高',
      dataIndex: 'high',
      key: 'high',
      width: 120,
      render: (value: number) => value?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '-',
    },
    {
      title: '最低',
      dataIndex: 'low',
      key: 'low',
      width: 120,
      render: (value: number) => value?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '-',
    },
    {
      title: '成交量',
      dataIndex: 'volume',
      key: 'volume',
      width: 150,
      render: (value: number) => value?.toLocaleString('en-US') || '-',
    },
    {
      title: '更新时间',
      dataIndex: 'updated_at',
      key: 'updated_at',
      width: 180,
      render: (value: string) => {
        if (!value) return '-';
        const date = new Date(value);
        return date.toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });
      },
    },
    {
      title: '操作',
      key: 'actions',
      fixed: 'right' as const,
      width: 150,
      render: (_: any, record: YahooIndex) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => showEditModal(record)}
            style={{ borderRadius: 4 }}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除"
            description="确定要删除这条证券数据吗？"
            onConfirm={() => handleDelete(record)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              danger
              size="small"
              icon={<DeleteOutlined />}
              style={{ borderRadius: 4 }}
            >
              删除
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px', background: '#f5f5f5', minHeight: '100vh' }}>
      <Card
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <span style={{ fontSize: 20, fontWeight: 600 }}>
              证券管理
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14, color: '#666' }}>数据来源：</span>
                <Radio.Group
                  value={selectedApi}
                  buttonStyle="solid"
                  onChange={(e) => setSelectedApi(e.target.value)}
                >
                  <Radio.Button value="alpha-vantage">Alpha Vantage</Radio.Button>
                  <Radio.Button value="finnhub">Finnhub</Radio.Button>
                </Radio.Group>
              </div>
              <Button
                type="primary"
                icon={<SyncOutlined spin={isSyncing} />}
                onClick={handleSyncData}
                loading={isSyncing}
              >
                同步数据
              </Button>
              <Button
                type="default"
                onClick={() => {
                  setIsEditMode(false);
                  setCurrentIndex(null);
                  form.resetFields();
                  setIsModalVisible(true);
                }}
              >
                添加证券
              </Button>
            </div>
          </div>
        }
        style={{ borderRadius: 8 }}
      >
        <Spin spinning={isLoading}>
          <Table
            columns={columns}
            dataSource={indices}
            rowKey="id"
            scroll={{ x: 1800 }}
            pagination={{
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条记录`,
              pageSizeOptions: ['10', '20', '50', '100'],
              defaultPageSize: 20,
            }}
          />
        </Spin>
      </Card>

      <Modal
        title={isEditMode ? '编辑证券' : '添加证券'}
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleEditSubmit}
          style={{ marginTop: 24 }}
        >
          <Form.Item
            name="symbol"
            label="证券代码"
            rules={[{ required: true, message: '请输入证券代码' }]}
          >
            <Input
              style={{ width: '100%' }}
              placeholder="请输入证券代码"
              disabled={isEditMode}
            />
          </Form.Item>

          <Form.Item
            name="name"
            label="证券名称"
            rules={[]}
          >
            <Input
              style={{ width: '100%' }}
              placeholder="请输入证券名称"
            />
          </Form.Item>

          <Form.Item
            name="price"
            label="当前价格"
            rules={[]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="请输入当前价格"
              precision={2}
              min={0}
            />
          </Form.Item>

          <Form.Item
            name="change"
            label="涨跌额"
            rules={[]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="请输入涨跌额"
              precision={2}
            />
          </Form.Item>

          <Form.Item
            name="change_percent"
            label="涨跌幅(%)"
            rules={[]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="请输入涨跌幅"
              precision={2}
            />
          </Form.Item>

          <Form.Item
            name="previous_close"
            label="昨收"
            rules={[]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="请输入昨收价"
              precision={2}
              min={0}
            />
          </Form.Item>

          <Form.Item
            name="open"
            label="开盘"
            rules={[]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="请输入开盘价"
              precision={2}
              min={0}
            />
          </Form.Item>

          <Form.Item
            name="high"
            label="最高"
            rules={[]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="请输入最高价"
              precision={2}
              min={0}
            />
          </Form.Item>

          <Form.Item
            name="low"
            label="最低"
            rules={[]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="请输入最低价"
              precision={2}
              min={0}
            />
          </Form.Item>

          <Form.Item
            name="volume"
            label="成交量"
            rules={[]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="请输入成交量"
              precision={0}
              min={0}
            />
          </Form.Item>

          <Form.Item
            name="market_type"
            label="市场类型"
            rules={[]}
          >
            <Select
              style={{ width: '100%' }}
              placeholder="请选择市场类型"
              options={[
                { label: '美股', value: 'us' },
                { label: 'A股', value: 'cn' },
                { label: '港股', value: 'hk' },
                { label: '加密货币', value: 'crypto' },
                { label: '大宗商品', value: 'commodity' },
                { label: '其他', value: 'other' },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="is_enabled"
            label="是否启用"
            valuePropName="checked"
          >
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>

          <Form.Item
            name="data_source"
            label="数据来源"
            rules={[]}
          >
            <Select
              style={{ width: '100%' }}
              placeholder="请选择数据来源"
              options={[
                { label: 'Alpha Vantage', value: 'alpha-vantage' },
                { label: 'Finnhub', value: 'finnhub' },
                { label: '手动录入', value: 'manual' },
              ]}
            />
          </Form.Item>

          <Form.Item style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 32 }}>
            <Button onClick={handleCancel}>
              取消
            </Button>
            <Button type="primary" htmlType="submit">
              确定
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default IndexManagement;
