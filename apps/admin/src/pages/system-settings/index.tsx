import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Form, Input, Button, Card, Alert, Spin, Switch, Select, message, Tabs, Table, Space, Modal } from 'antd';
import { SaveOutlined, ReloadOutlined, EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { supabaseClient } from '../../main';

const { Option } = Select;

// 系统配置和通知配置类型定义已移除，因为未被使用

const SystemSettings: React.FC = () => {
  const basicFormRef = useRef<any>();
  const notificationFormRef = useRef<any>();
  const securityFormRef = useRef<any>();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('basic');

  // 基础设置表单组件
  const BasicSettingsForm = () => {
    const [form] = Form.useForm();
    
    React.useEffect(() => {
      basicFormRef.current = form;
      
      // 当表单初始化后，立即加载数据
      const loadBasicConfig = async () => {
        try {
          console.log('开始加载基础设置数据...');
          const { data, error } = await supabaseClient
            .from('system_configs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1);

          console.log('基础设置数据获取结果:', { data, error });
          
          if (error) {
            console.error('获取系统配置错误:', error);
            throw error;
          }
          
          if (data && data.length > 0) {
            const configData = data[0];
            console.log('设置基础设置表单值:', configData);
            form.setFieldsValue({
              platform_name: configData.platform_name,
              platform_logo: configData.platform_logo,
              contact_email: configData.contact_email,
              contact_phone: configData.contact_phone,
              privacy_policy_url: configData.privacy_policy_url,
              terms_of_service_url: configData.terms_of_service_url
            });
            console.log('基础设置表单值设置完成');
          }
        } catch (err) {
          console.error('Failed to fetch system config:', err);
          setError('获取系统配置失败，请稍后重试');
        }
      };
      
      loadBasicConfig();
    }, [form]);

    return (
      <Card style={{ maxWidth: 800 }}>
        <Form form={form} layout="vertical">
          <Form.Item
            name="platform_name"
            label="平台名称"
            rules={[{ required: true, message: '请输入平台名称' }]}
          >
            <Input placeholder="请输入平台名称" />
          </Form.Item>
          <Form.Item
            name="platform_logo"
            label="平台Logo URL"
          >
            <Input placeholder="请输入平台Logo URL" />
          </Form.Item>
          <Form.Item
            name="contact_email"
            label="联系邮箱"
            rules={[{ required: true, message: '请输入联系邮箱' }, { type: 'email', message: '请输入有效的邮箱地址' }]}
          >
            <Input placeholder="请输入联系邮箱" />
          </Form.Item>
          <Form.Item
            name="contact_phone"
            label="联系电话"
            rules={[{ required: true, message: '请输入联系电话' }]}
          >
            <Input placeholder="请输入联系电话" />
          </Form.Item>
          <Form.Item
            name="privacy_policy_url"
            label="隐私政策URL"
          >
            <Input placeholder="请输入隐私政策URL" />
          </Form.Item>
          <Form.Item
            name="terms_of_service_url"
            label="服务条款URL"
          >
            <Input placeholder="请输入服务条款URL" />
          </Form.Item>
          <Form.Item style={{ marginTop: 32 }}>
            <Button type="primary" onClick={handleSaveBasicSettings} loading={saving} icon={<SaveOutlined />}>
              保存基础设置
            </Button>
          </Form.Item>
        </Form>
      </Card>
    );
  };

  // 通知设置表单组件
  const NotificationSettingsForm = () => {
    const [form] = Form.useForm();
    
    React.useEffect(() => {
      notificationFormRef.current = form;
      
      // 当表单初始化后，立即加载数据
      const loadNotificationConfig = async () => {
        try {
          console.log('开始加载通知设置数据...');
          const { data, error } = await supabaseClient
            .from('notification_configs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1);

          console.log('通知设置数据获取结果:', { data, error });
          
          if (error) {
            console.error('获取通知配置错误:', error);
            throw error;
          }
          
          if (data && data.length > 0) {
            const configData = data[0];
            console.log('设置通知设置表单值:', configData);
            form.setFieldsValue({
              email_notifications_enabled: configData.email_notifications_enabled,
              sms_notifications_enabled: configData.sms_notifications_enabled,
              push_notifications_enabled: configData.push_notifications_enabled,
              admin_email: configData.admin_email
            });
            console.log('通知设置表单值设置完成');
          }
        } catch (err) {
          console.error('Failed to fetch notification config:', err);
          setError('获取通知配置失败，请稍后重试');
        }
      };
      
      loadNotificationConfig();
    }, [form]);

    return (
      <Card style={{ maxWidth: 800 }}>
        <Form form={form} layout="vertical">
          <Form.Item
            name="email_notifications_enabled"
            label="启用邮件通知"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          <Form.Item
            name="sms_notifications_enabled"
            label="启用短信通知"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          <Form.Item
            name="push_notifications_enabled"
            label="启用推送通知"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          <Form.Item
            name="admin_email"
            label="管理员邮箱"
            rules={[{ required: true, message: '请输入管理员邮箱' }, { type: 'email', message: '请输入有效的邮箱地址' }]}
          >
            <Input placeholder="请输入管理员邮箱" />
          </Form.Item>
          <Form.Item style={{ marginTop: 32 }}>
            <Button type="primary" onClick={handleSaveNotificationSettings} loading={saving} icon={<SaveOutlined />}>
              保存通知设置
            </Button>
          </Form.Item>
        </Form>
      </Card>
    );
  };

  // 安全设置表单组件
  const SecuritySettingsForm = () => {
    const [form] = Form.useForm();
    
    React.useEffect(() => {
      securityFormRef.current = form;
      
      // 当表单初始化后，立即加载数据
      const loadSecurityConfig = async () => {
        try {
          console.log('开始加载安全设置数据...');
          const { data, error } = await supabaseClient
            .from('security_configs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1);

          console.log('安全设置数据获取结果:', { data, error });
          
          if (error) {
            console.error('获取安全配置错误:', error);
            throw error;
          }
          
          if (data && data.length > 0) {
            const configData = data[0];
            console.log('设置安全设置表单值:', configData);
            form.setFieldsValue({
              password_policy: configData.password_policy,
              session_timeout: configData.session_timeout,
              two_factor_auth_enabled: configData.two_factor_auth_enabled
            });
            console.log('安全设置表单值设置完成');
          }
        } catch (err) {
          console.error('Failed to fetch security config:', err);
          setError('获取安全配置失败，请稍后重试');
        }
      };
      
      loadSecurityConfig();
    }, [form]);

    return (
      <Card style={{ maxWidth: 800 }}>
        <Form form={form} layout="vertical">
          <Form.Item
            name="password_policy"
            label="密码策略"
          >
            <Select placeholder="请选择密码策略">
              <Option value="weak">宽松</Option>
              <Option value="medium">中等</Option>
              <Option value="strong">严格</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="session_timeout"
            label="会话超时时间（分钟）"
          >
            <Input type="number" placeholder="请输入会话超时时间" />
          </Form.Item>
          <Form.Item
            name="two_factor_auth_enabled"
            label="启用双因素认证"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          <Form.Item style={{ marginTop: 32 }}>
            <Button type="primary" onClick={handleSaveSecuritySettings} loading={saving} icon={<SaveOutlined />}>
              保存安全设置
            </Button>
          </Form.Item>
        </Form>
      </Card>
    );
  };

  // 用户角色设置表单组件
  const UserRolesSettingsForm = () => {
    const [form] = Form.useForm();
    const [roles, setRoles] = useState<any[]>([]);
    const [editingRole, setEditingRole] = useState<any>(null);
    const [formVisible, setFormVisible] = useState(false);

    // 角色权限表列定义
    const columns = [
      {
        title: '角色名称',
        dataIndex: 'name',
        key: 'name',
      },
      {
        title: '角色代码',
        dataIndex: 'code',
        key: 'code',
      },
      {
        title: '描述',
        dataIndex: 'description',
        key: 'description',
      },
      {
        title: '操作',
        key: 'action',
        render: (_, record) => (
          <div>
            <Button type="link" icon={<EditOutlined />} onClick={() => handleEditRole(record)}>
              编辑
            </Button>
            <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDeleteRole(record.id)}>
              删除
            </Button>
          </div>
        ),
      },
    ];

    // 获取角色列表
    const fetchRoles = async () => {
      try {
        const { data, error } = await supabaseClient
          .from('user_roles')
          .select('*');
        
        if (error) throw error;
        setRoles(data || []);
      } catch (err) {
        console.error('Failed to fetch roles:', err);
        message.error('获取角色列表失败');
      }
    };

    // 编辑角色
    const handleEditRole = (role: any) => {
      setEditingRole(role);
      form.setFieldsValue(role);
      setFormVisible(true);
    };

    // 删除角色
    const handleDeleteRole = async (roleId: string) => {
      try {
        const { error } = await supabaseClient
          .from('user_roles')
          .delete()
          .eq('id', roleId);
        
        if (error) throw error;
        message.success('角色删除成功');
        fetchRoles();
      } catch (err) {
        console.error('Failed to delete role:', err);
        message.error('删除角色失败');
      }
    };

    // 保存角色
    const handleSaveRole = async () => {
      try {
        // 获取表单值
        const values = await form.validateFields();
        
        // 检查角色代码是否已存在
        if (!editingRole) {
          const { data: existingRoles } = await supabaseClient
            .from('user_roles')
            .select('id')
            .eq('code', values.code)
            .limit(1);
          
          if (existingRoles && existingRoles.length > 0) {
            message.error('角色代码已存在，请使用其他代码');
            return;
          }
        } else if (editingRole.code !== values.code) {
          // 编辑时如果角色代码发生变化，检查新代码是否已存在
          const { data: existingRoles } = await supabaseClient
            .from('user_roles')
            .select('id')
            .eq('code', values.code)
            .neq('id', editingRole.id)
            .limit(1);
          
          if (existingRoles && existingRoles.length > 0) {
            message.error('角色代码已存在，请使用其他代码');
            return;
          }
        }
        
        if (editingRole) {
          // 更新角色
          const { error } = await supabaseClient
            .from('user_roles')
            .update(values)
            .eq('id', editingRole.id);
          
          if (error) throw error;
          message.success('角色更新成功');
        } else {
          // 创建角色
          const { error } = await supabaseClient
            .from('user_roles')
            .insert(values);
          
          if (error) throw error;
          message.success('角色创建成功');
        }
        
        // 关闭表单，重置状态，刷新角色列表
        setFormVisible(false);
        setEditingRole(null);
        form.resetFields();
        fetchRoles();
      } catch (err: any) {
        console.error('Failed to save role:', err);
        message.error(err.message || '保存角色失败');
      }
    };

    // 初始加载角色列表
    useEffect(() => {
      fetchRoles();
    }, []);

    return (
      <div>
        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3>用户角色管理</h3>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => {
              setEditingRole(null);
              form.resetFields();
              setFormVisible(true);
            }}>
              添加角色
            </Button>
          </div>
          
          <Table columns={columns} dataSource={roles} rowKey="id" />
        </Card>
        
        <Modal
          title={editingRole ? "编辑角色" : "添加角色"}
          open={formVisible}
          onCancel={() => {
            setFormVisible(false);
            setEditingRole(null);
            form.resetFields();
          }}
          footer={null}
          width={600}
        >
          <Form form={form} layout="vertical">
            <Form.Item
              name="name"
              label="角色名称"
              rules={[{ required: true, message: '请输入角色名称' }]}
            >
              <Input placeholder="请输入角色名称" />
            </Form.Item>
            <Form.Item
              name="code"
              label="角色代码"
              rules={[{ required: true, message: '请输入角色代码' }]}
            >
              {editingRole ? (
                <Space.Compact>
                  <Input 
                    placeholder="请输入角色代码（如：admin, partner, client, waiter）" 
                    disabled
                  />
                  <span style={{ color: '#999', padding: '0 8px' }}>角色代码不可修改</span>
                </Space.Compact>
              ) : (
                <Input 
                  placeholder="请输入角色代码（如：admin, partner, client, waiter）" 
                />
              )}
            </Form.Item>
            <Form.Item
              name="description"
              label="角色描述"
            >
              <Input.TextArea placeholder="请输入角色描述" />
            </Form.Item>
            <Form.Item style={{ marginTop: 32, display: 'flex', justifyContent: 'flex-end' }}>
              <Button style={{ marginRight: 16 }} onClick={() => {
                setFormVisible(false);
                setEditingRole(null);
                form.resetFields();
              }}>
                取消
              </Button>
              <Button type="primary" onClick={handleSaveRole}>
                保存角色
              </Button>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    );
  };

  const handleSaveBasicSettings = async () => {
    try {
      setSaving(true);
      setError(null);
      if (!basicFormRef.current) return;
      const values = await basicFormRef.current.validateFields();

      // 检查是否存在系统配置
      const { data: existingConfigs } = await supabaseClient
        .from('system_configs')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(1);

      if (existingConfigs && existingConfigs.length > 0) {
        // 更新配置
        const { error } = await supabaseClient
          .from('system_configs')
          .update(values)
          .eq('id', existingConfigs[0].id);
        
        if (error) throw error;
      } else {
        // 创建新配置
        const { error } = await supabaseClient
          .from('system_configs')
          .insert(values);
        
        if (error) throw error;
      }

      message.success('基础设置保存成功');
    } catch (err) {
      console.error('Failed to save basic settings:', err);
      setError('保存基础设置失败，请稍后重试');
      message.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotificationSettings = async () => {
    try {
      setSaving(true);
      setError(null);
      if (!notificationFormRef.current) return;
      const values = await notificationFormRef.current.validateFields();

      // 检查是否存在通知配置
      const { data: existingConfigs } = await supabaseClient
        .from('notification_configs')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(1);

      if (existingConfigs && existingConfigs.length > 0) {
        // 更新配置
        const { error } = await supabaseClient
          .from('notification_configs')
          .update(values)
          .eq('id', existingConfigs[0].id);
        
        if (error) throw error;
      } else {
        // 创建新配置
        const { error } = await supabaseClient
          .from('notification_configs')
          .insert(values);
        
        if (error) throw error;
      }

      message.success('通知设置保存成功');
    } catch (err) {
      console.error('Failed to save notification settings:', err);
      setError('保存通知设置失败，请稍后重试');
      message.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSecuritySettings = async () => {
    try {
      setSaving(true);
      setError(null);
      if (!securityFormRef.current) return;
      const values = await securityFormRef.current.validateFields();

      // 检查是否存在安全配置
      const { data: existingConfigs } = await supabaseClient
        .from('security_configs')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(1);

      if (existingConfigs && existingConfigs.length > 0) {
        // 更新配置
        const { error } = await supabaseClient
          .from('security_configs')
          .update(values)
          .eq('id', existingConfigs[0].id);
        
        if (error) throw error;
      } else {
        // 创建新配置
        const { error } = await supabaseClient
          .from('security_configs')
          .insert(values);
        
        if (error) throw error;
      }

      message.success('安全设置保存成功');
    } catch (err) {
      console.error('Failed to save security settings:', err);
      setError('保存安全设置失败，请稍后重试');
      message.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleTabChange = (key: string) => {
    setActiveTab(key);
  };

  // 刷新当前激活标签页的表单数据
  const handleRefresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      switch (activeTab) {
        case 'basic':
          if (basicFormRef.current) {
            // 刷新基础设置数据
            const { data, error } = await supabaseClient
              .from('system_configs')
              .select('*')
              .order('created_at', { ascending: false })
              .limit(1);
            
            if (error) {
              throw error;
            }
            
            if (data && data.length > 0) {
              basicFormRef.current.setFieldsValue({
                platform_name: data[0].platform_name,
                platform_logo: data[0].platform_logo,
                contact_email: data[0].contact_email,
                contact_phone: data[0].contact_phone,
                privacy_policy_url: data[0].privacy_policy_url,
                terms_of_service_url: data[0].terms_of_service_url
              });
            }
          }
          break;
          
        case 'notifications':
          if (notificationFormRef.current) {
            // 刷新通知设置数据
            const { data, error } = await supabaseClient
              .from('notification_configs')
              .select('*')
              .order('created_at', { ascending: false })
              .limit(1);
            
            if (error) {
              throw error;
            }
            
            if (data && data.length > 0) {
              notificationFormRef.current.setFieldsValue({
                email_notifications_enabled: data[0].email_notifications_enabled,
                sms_notifications_enabled: data[0].sms_notifications_enabled,
                push_notifications_enabled: data[0].push_notifications_enabled,
                admin_email: data[0].admin_email
              });
            }
          }
          break;
          
        case 'security':
          if (securityFormRef.current) {
            // 刷新安全设置数据
            const { data, error } = await supabaseClient
              .from('security_configs')
              .select('*')
              .order('created_at', { ascending: false })
              .limit(1);
            
            if (error) {
              throw error;
            }
            
            if (data && data.length > 0) {
              securityFormRef.current.setFieldsValue({
                password_policy: data[0].password_policy,
                session_timeout: data[0].session_timeout,
                two_factor_auth_enabled: data[0].two_factor_auth_enabled
              });
            }
          }
          break;
          
        case 'roles':
          // 刷新角色列表数据
          {
            const { error: rolesError } = await supabaseClient
              .from('user_roles')
              .select('*');
          
            if (rolesError) {
              throw rolesError;
            }
            // 角色列表会自动刷新，不需要额外处理
          }
          break;
      }
      
      message.success('刷新成功');
    } catch (err) {
      console.error('Failed to refresh data:', err);
      setError('刷新数据失败，请稍后重试');
      message.error('刷新失败');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1>系统设置</h1>
        <Button
          icon={<ReloadOutlined />}
          onClick={handleRefresh}
          loading={loading}
        >
          刷新
        </Button>
      </div>

      {error && <Alert message="错误" description={error} type="error" showIcon style={{ marginBottom: 24 }} />}

      <Spin spinning={loading}>
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          size="large"
          items={[
            {
              key: 'basic',
              label: '基础设置',
              children: <BasicSettingsForm />
            },
            {
              key: 'notifications',
              label: '通知设置',
              children: <NotificationSettingsForm />
            },
            {
              key: 'security',
              label: '安全设置',
              children: <SecuritySettingsForm />
            },
            {
              key: 'roles',
              label: '用户角色设置',
              children: <UserRolesSettingsForm />
            }
          ]}
        />
      </Spin>
    </div>
  );
};

export default SystemSettings;