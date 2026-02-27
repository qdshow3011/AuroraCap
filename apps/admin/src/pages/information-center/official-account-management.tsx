import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Input,
  Modal,
  Form,
  message,
  Space,
  Avatar,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, UserOutlined } from '@ant-design/icons';
import { supabaseClient } from '../../main';
import { useUser } from '../../contexts/UserContext';

interface OfficialAccount {
  id: string;
  name: string;
  description: string;
  avatar: string;
  user_id: string;
  created_at: string;
  user?: {
    email: string;
  };
}

const OfficialAccountManagement: React.FC = () => {
  const { user } = useUser();
  const [accounts, setAccounts] = useState<OfficialAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAccount, setEditingAccount] = useState<OfficialAccount | null>(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabaseClient
        .from('wechat_official_accounts')
        .select('*, user:user_id(*)')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setAccounts(data || []);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      message.error('获取公众号列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleCreate = () => {
    setEditingAccount(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (account: OfficialAccount) => {
    setEditingAccount(account);
    form.setFieldsValue(account);
    setModalVisible(true);
  };

  const handleDelete = async (accountId: string) => {
    try {
      setLoading(true);
      const { error } = await supabaseClient
        .from('wechat_official_accounts')
        .delete()
        .eq('id', accountId);

      if (error) {
        throw error;
      }

      message.success('删除成功');
      fetchAccounts();
    } catch (error) {
      console.error('Error deleting account:', error);
      message.error('删除失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      if (editingAccount) {
        const { error } = await supabaseClient
          .from('wechat_official_accounts')
          .update(values)
          .eq('id', editingAccount.id);

        if (error) {
          throw error;
        }

        message.success('更新成功');
      } else {
        if (!user) {
          throw new Error('用户未登录');
        }

        const { error } = await supabaseClient
          .from('wechat_official_accounts')
          .insert({
            ...values,
            user_id: user.id
          });

        if (error) {
          throw error;
        }

        message.success('创建成功');
      }

      setModalVisible(false);
      fetchAccounts();
    } catch (error) {
      console.error('Error submitting form:', error);
      message.error('操作失败');
    } finally {
      setLoading(false);
    }
  };

  const filteredAccounts = accounts.filter(account =>
    account.name.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div className="p-4">
      <Card
        title="公众号管理"
        extra={
          <Space>
            <Input
              placeholder="搜索公众号"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 200 }}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              创建公众号
            </Button>
          </Space>
        }
      >
        <Table
          dataSource={filteredAccounts}
          columns={[
            {
              title: '头像',
              dataIndex: 'avatar',
              key: 'avatar',
              render: (avatar) => (
                <Avatar src={avatar} icon={<UserOutlined />} />
              ),
            },
            {
              title: '公众号名称',
              dataIndex: 'name',
              key: 'name',
            },
            {
              title: '描述',
              dataIndex: 'description',
              key: 'description',
              ellipsis: true,
            },
            {
              title: '创建者',
              dataIndex: 'user',
              key: 'user',
              render: (user) => user?.email || '-',
            },
            {
              title: '创建时间',
              dataIndex: 'created_at',
              key: 'created_at',
              render: (createdAt) => new Date(createdAt).toLocaleString(),
            },
            {
              title: '操作',
              key: 'action',
              render: (_, record) => (
                <Space>
                  <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} />
                  <Button danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)} />
                </Space>
              ),
            },
          ]}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
          }}
        />
      </Card>

      <Modal
        title={editingAccount ? '编辑公众号' : '创建公众号'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        okButtonProps={{ loading }}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="公众号名称"
            rules={[{ required: true, message: '请输入公众号名称' }]}
          >
            <Input placeholder="请输入公众号名称" />
          </Form.Item>

          <Form.Item
            name="description"
            label="公众号描述"
          >
            <Input.TextArea placeholder="请输入公众号描述" rows={4} />
          </Form.Item>

          <Form.Item
            name="avatar"
            label="公众号头像"
          >
            <Input placeholder="请输入头像URL" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default OfficialAccountManagement;