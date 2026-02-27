import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, message, Spin, Alert, InputNumber } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { supabaseClient } from '../../main';

interface Category {
  id: string;
  name: string;
  description?: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

const InternalReferenceCategoryManagement: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabaseClient
        .from('internal_reference_categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setCategories(data as Category[]);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
      setError('获取分类数据失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setSelectedCategory(null);
    form.resetFields();
    form.setFieldsValue({ sort_order: categories.length + 1 });
    setIsModalVisible(true);
  };

  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    form.setFieldsValue(category);
    setIsModalVisible(true);
  };

  const handleDelete = (category: Category) => {
    setSelectedCategory(category);
    setIsDeleteModalVisible(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      
      if (selectedCategory) {
        const { error } = await supabaseClient
          .from('internal_reference_categories')
          .update(values)
          .eq('id', selectedCategory.id);
        if (error) throw error;
      } else {
        const { error } = await supabaseClient
          .from('internal_reference_categories')
          .insert(values);
        if (error) throw error;
      }
      
      setIsModalVisible(false);
      fetchCategories();
      message.success('保存成功');
    } catch (err) {
      console.error('Failed to save category:', err);
      setError('保存分类失败，请稍后重试');
      message.error('保存失败');
    }
  };

  const handleDeleteOk = async () => {
    if (!selectedCategory) return;
    
    try {
      const { error } = await supabaseClient
        .from('internal_reference_categories')
        .delete()
        .eq('id', selectedCategory.id);
      
      if (error) throw error;
      
      setIsDeleteModalVisible(false);
      fetchCategories();
      message.success('删除成功');
    } catch (err) {
      console.error('Failed to delete category:', err);
      setError('删除分类失败，请稍后重试');
      message.error('删除失败');
    }
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    
    const newCategories = [...categories];
    const temp = newCategories[index].sort_order;
    newCategories[index].sort_order = newCategories[index - 1].sort_order;
    newCategories[index - 1].sort_order = temp;
    
    try {
      await supabaseClient
        .from('internal_reference_categories')
        .update({ sort_order: newCategories[index].sort_order })
        .eq('id', newCategories[index].id);
      
      await supabaseClient
        .from('internal_reference_categories')
        .update({ sort_order: newCategories[index - 1].sort_order })
        .eq('id', newCategories[index - 1].id);
      
      fetchCategories();
      message.success('排序成功');
    } catch (err) {
      console.error('Failed to move category:', err);
      message.error('排序失败');
    }
  };

  const handleMoveDown = async (index: number) => {
    if (index === categories.length - 1) return;
    
    const newCategories = [...categories];
    const temp = newCategories[index].sort_order;
    newCategories[index].sort_order = newCategories[index + 1].sort_order;
    newCategories[index + 1].sort_order = temp;
    
    try {
      await supabaseClient
        .from('internal_reference_categories')
        .update({ sort_order: newCategories[index].sort_order })
        .eq('id', newCategories[index].id);
      
      await supabaseClient
        .from('internal_reference_categories')
        .update({ sort_order: newCategories[index + 1].sort_order })
        .eq('id', newCategories[index + 1].id);
      
      fetchCategories();
      message.success('排序成功');
    } catch (err) {
      console.error('Failed to move category:', err);
      message.error('排序失败');
    }
  };

  const columns = [
    {
      title: '分类名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '排序',
      dataIndex: 'sort_order',
      key: 'sort_order',
      width: 80,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (time: string) => new Date(time).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      width: 250,
      render: (_: any, record: Category, index: number) => (
        <Space size="small">
          <Button 
            type="link" 
            icon={<ArrowUpOutlined />} 
            onClick={() => handleMoveUp(index)}
            disabled={index === 0}
          >
            上移
          </Button>
          <Button 
            type="link" 
            icon={<ArrowDownOutlined />} 
            onClick={() => handleMoveDown(index)}
            disabled={index === categories.length - 1}
          >
            下移
          </Button>
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
        <h1>分类管理</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增分类
        </Button>
      </div>

      {error && <Alert message="错误" description={error} type="error" showIcon style={{ marginBottom: 24 }} />}

      <Spin spinning={loading}>
        <Table
          dataSource={categories}
          columns={columns}
          rowKey="id"
          bordered
          pagination={{ pageSizeOptions: ['10', '20', '50'], showSizeChanger: true, showTotal: (total) => `共 ${total} 条记录` }}
          scroll={{ x: 900 }}
        />
      </Spin>

      <Modal
        title={selectedCategory ? '编辑分类' : '新增分类'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => setIsModalVisible(false)}
        destroyOnHidden
        centered
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="分类名称"
            rules={[{ required: true, message: '请输入分类名称' }]}
          >
            <Input placeholder="请输入分类名称" />
          </Form.Item>
          <Form.Item
            name="description"
            label="描述"
          >
            <Input.TextArea placeholder="请输入分类描述" rows={4} />
          </Form.Item>
          <Form.Item
            name="sort_order"
            label="排序"
            rules={[{ required: true, message: '请输入排序' }]}
          >
            <InputNumber min={1} placeholder="请输入排序" style={{ width: '100%' }} />
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
        <p>确定要删除分类 <strong>{selectedCategory?.name}</strong> 吗？此操作不可恢复。</p>
      </Modal>
    </div>
  );
};

export default InternalReferenceCategoryManagement;
