import React, { useState, useEffect } from 'react';
import { Button, Card, Table, Spin, message, Modal, Form, Input, InputNumber, Popconfirm, Select, Tag, Switch } from 'antd';
import { EditOutlined, DeleteOutlined, SyncOutlined } from '@ant-design/icons';
import { YahooIndex } from '@aurora/types';
import { supabaseClient } from '../../main';
import { yahooFinanceService } from '../../services/yahoo-finance.service';

const IndexManagement: React.FC = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentIndex, setCurrentIndex] = useState<YahooIndex | null>(null);
  const [indices, setIndices] = useState<YahooIndex[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [form] = Form.useForm();

  const fetchIndices = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabaseClient
        .from('yahoo_indices')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching indices:', error);
        message.error('获取指数数据失败');
        return;
      }

      setIndices(data || []);
    } catch (err) {
      console.error('Exception fetching indices:', err);
      message.error('获取指数数据时发生异常');
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
      const result = await yahooFinanceService.syncAllIndices();
      
      if (result.success) {
        message.success(result.message);
      } else {
        message.error(result.message);
      }
      
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
      data_source: record.data_source || 'yahoo-finance2',
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
    if (!currentIndex) return;

    try {
      const { error } = await supabaseClient
        .from('yahoo_indices')
        .update({
          symbol: values.symbol,
          name: values.name,
          price: values.price,
          change: values.change,
          change_percent: values.change_percent,
          previous_close: values.previous_close,
          open: values.open,
          high: values.high,
          low: values.low,
          volume: values.volume,
          market_type: values.market_type,
          is_enabled: values.is_enabled,
          data_source: values.data_source,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentIndex.id);

      if (error) {
        console.error('Error updating index:', error);
        message.error('更新指数数据失败');
        return;
      }

      message.success('更新指数数据成功');
      setIsModalVisible(false);
      setIsEditMode(false);
      setCurrentIndex(null);
      form.resetFields();
      fetchIndices();
    } catch (err) {
      console.error('Exception updating index:', err);
      message.error('更新指数数据时发生异常');
    }
  };

  const handleDelete = async (record: YahooIndex) => {
    try {
      const { error } = await supabaseClient
        .from('yahoo_indices')
        .delete()
        .eq('id', record.id);

      if (error) {
        console.error('Error deleting index:', error);
        message.error('删除指数数据失败');
        return;
      }

      message.success('删除指数数据成功');
      fetchIndices();
    } catch (err) {
      console.error('Exception deleting index:', err);
      message.error('删除指数数据时发生异常');
    }
  };

  const columns = [
    {
      title: '指数代码',
      dataIndex: 'symbol',
      key: 'symbol',
      width: 150,
      render: (text: string) => <span style={{ fontWeight: 500 }}>{text}</span>,
    },
    {
      title: '指数名称',
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
          'yahoo-finance2': { text: 'Yahoo Finance', color: 'blue' },
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
            description="确定要删除这条指数数据吗？"
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 20, fontWeight: 600 }}>
              指数管理
            </span>
            <Button
              type="primary"
              icon={<SyncOutlined spin={isSyncing} />}
              onClick={handleSyncData}
              loading={isSyncing}
            >
              同步数据
            </Button>
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
        title={isEditMode ? '编辑指数' : '添加指数'}
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
            label="指数代码"
            rules={[{ required: true, message: '请输入指数代码' }]}
          >
            <Input
              style={{ width: '100%' }}
              placeholder="请输入指数代码"
              disabled={isEditMode}
            />
          </Form.Item>

          <Form.Item
            name="name"
            label="指数名称"
            rules={[{ required: true, message: '请输入指数名称' }]}
          >
            <Input
              style={{ width: '100%' }}
              placeholder="请输入指数名称"
            />
          </Form.Item>

          <Form.Item
            name="price"
            label="当前价格"
            rules={[{ required: true, message: '请输入当前价格' }]}
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
            rules={[{ required: true, message: '请输入涨跌额' }]}
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
            rules={[{ required: true, message: '请输入涨跌幅' }]}
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
            rules={[{ required: true, message: '请输入昨收价' }]}
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
            rules={[{ required: true, message: '请输入开盘价' }]}
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
            rules={[{ required: true, message: '请输入最高价' }]}
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
            rules={[{ required: true, message: '请输入最低价' }]}
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
            rules={[{ required: true, message: '请输入成交量' }]}
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
            rules={[{ required: true, message: '请选择市场类型' }]}
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
            rules={[{ required: true, message: '请选择数据来源' }]}
          >
            <Select
              style={{ width: '100%' }}
              placeholder="请选择数据来源"
              options={[
                { label: 'Yahoo Finance', value: 'yahoo-finance2' },
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
