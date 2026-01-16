import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, Tag, Spin, Alert, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { supabaseClient } from '../../main';

const { Option } = Select;
const { TextArea } = Input;

interface Product {
  id: string;
  product_number: string;
  name_cn: string;
  description: string;
  type: 'stock' | 'fund' | 'bond' | 'other';
  risk_level: 'low' | 'medium' | 'high';
  status: 'active' | 'inactive';
  core_assets: string;
  core_strategy: string;
  created_at: string;
  updated_at: string;
}

const ProductManagement: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabaseClient
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data as Product[]);
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setError('获取产品数据失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setSelectedProduct(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    form.setFieldsValue(product);
    setIsModalVisible(true);
  };

  const handleDelete = (product: Product) => {
    setSelectedProduct(product);
    setIsDeleteModalVisible(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      const timestamp = new Date().toISOString();
      
      if (selectedProduct) {
        // 更新产品信息
        const { error } = await supabaseClient
          .from('products')
          .update({ ...values, updated_at: timestamp })
          .eq('id', selectedProduct.id);
        if (error) throw error;
      } else {
        // 创建新产品
        const { error } = await supabaseClient
          .from('products')
          .insert({ ...values, created_at: timestamp, updated_at: timestamp });
        if (error) throw error;
      }
      
      setIsModalVisible(false);
      fetchProducts();
      message.success('保存成功');
    } catch (err) {
      console.error('Failed to save product:', err);
      setError('保存产品信息失败，请稍后重试');
      message.error('保存失败');
    }
  };

  const handleDeleteOk = async () => {
    if (!selectedProduct) return;
    
    try {
      const { error } = await supabaseClient
        .from('products')
        .delete()
        .eq('id', selectedProduct.id);
      
      if (error) throw error;
      
      setIsDeleteModalVisible(false);
      fetchProducts();
      message.success('删除成功');
    } catch (err) {
      console.error('Failed to delete product:', err);
      setError('删除产品失败，请稍后重试');
      message.error('删除失败');
    }
  };

  const getRiskLevelText = (level: string) => {
    const levelMap: Record<string, { text: string; color: string }> = {
      low: { text: '低风险', color: 'green' },
      medium: { text: '中风险', color: 'yellow' },
      high: { text: '高风险', color: 'red' }
    };
    return levelMap[level] || { text: level, color: 'default' };
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, { text: string; color: string }> = {
      active: { text: '活跃', color: 'green' },
      inactive: { text: '非活跃', color: 'red' }
    };
    return statusMap[status] || { text: status, color: 'default' };
  };

  const columns = [
    {
      title: '产品编号',
      dataIndex: 'product_number',
      key: 'product_number',
    },
    {
      title: '产品名称',
      dataIndex: 'name_cn',
      key: 'name_cn',
    },
    {
      title: '产品描述',
      dataIndex: 'description',
      key: 'description',
      render: (description: string) => {
        if (!description) return '-';
        return description.length > 30 ? `${description.substring(0, 30)}...` : description;
      },
    },
    {
      title: '风险等级',
      dataIndex: 'risk_level',
      key: 'risk_level',
      render: (level: string) => {
        const { text, color } = getRiskLevelText(level);
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const { text, color } = getStatusText(status);
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: '核心投资标的',
      dataIndex: 'core_assets',
      key: 'core_assets',
      render: (coreAssets: string) => {
        if (!coreAssets) return '-';
        return coreAssets.length > 30 ? `${coreAssets.substring(0, 30)}...` : coreAssets;
      },
    },
    {
      title: '核心策略',
      dataIndex: 'core_strategy',
      key: 'core_strategy',
      render: (coreStrategy: string) => {
        if (!coreStrategy) return '-';
        return coreStrategy.length > 30 ? `${coreStrategy.substring(0, 30)}...` : coreStrategy;
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Product) => (
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
        <h1>基金产品管理</h1>
        <Space>
          <Input
            placeholder="搜索产品"
            prefix={<SearchOutlined />}
            style={{ width: 200 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增产品
          </Button>
        </Space>
      </div>

      {error && <Alert message="错误" description={error} type="error" showIcon style={{ marginBottom: 24 }} />}

      <Spin spinning={loading}>
        <Table
          dataSource={products}
          columns={columns}
          rowKey="id"
          bordered
          pagination={{ pageSizeOptions: ['10', '20', '50'], showSizeChanger: true, showTotal: (total) => `共 ${total} 条记录` }}
          scroll={{ x: 800 }}
        />
      </Spin>

      <Modal
        title={selectedProduct ? '编辑产品' : '新增产品'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => setIsModalVisible(false)}
        destroyOnHidden
        centered
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="product_number"
            label="产品编号"
            rules={[{ required: true, message: '请输入产品编号' }]}
          >
            <Input placeholder="请输入产品编号" />
          </Form.Item>
          <Form.Item
            name="name_cn"
            label="产品名称"
            rules={[{ required: true, message: '请输入产品名称' }]}
          >
            <Input placeholder="请输入产品名称" />
          </Form.Item>
          <Form.Item
            name="description"
            label="产品描述"
            rules={[{ required: true, message: '请输入产品描述' }]}
          >
            <TextArea rows={4} placeholder="请输入产品描述" />
          </Form.Item>
          <Form.Item
            name="type"
            label="产品类型"
            rules={[{ required: true, message: '请选择产品类型' }]}
          >
            <Select placeholder="请选择产品类型">
              <Option value="stock">股票</Option>
              <Option value="fund">基金</Option>
              <Option value="bond">债券</Option>
              <Option value="other">其他</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="risk_level"
            label="风险等级"
            rules={[{ required: true, message: '请选择风险等级' }]}
          >
            <Select placeholder="请选择风险等级">
              <Option value="low">低风险</Option>
              <Option value="medium">中风险</Option>
              <Option value="high">高风险</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="status"
            label="状态"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select placeholder="请选择状态">
              <Option value="active">活跃</Option>
              <Option value="inactive">非活跃</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="core_assets"
            label="核心投资标的"
          >
            <TextArea rows={3} placeholder="请输入核心投资标的" />
          </Form.Item>
          <Form.Item
            name="core_strategy"
            label="核心策略"
          >
            <TextArea rows={3} placeholder="请输入核心策略" />
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
        <p>确定要删除产品 <strong>{selectedProduct?.name_cn}</strong> 吗？此操作不可恢复。</p>
      </Modal>
    </div>
  );
};

export default ProductManagement;