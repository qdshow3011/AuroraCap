import React, { useState, useEffect, useCallback } from 'react';
import { Form, Input, Button, Card, Alert, Spin, message, Checkbox } from 'antd';
import { SaveOutlined, ReloadOutlined } from '@ant-design/icons';
import { supabaseClient } from '../../main';

interface IBConfig {
  id: string;
  client_id: string;
  account_id: string;
  api_url: string;
  api_key: string;
  api_secret: string;
  is_sandbox: boolean;
  report_token: string;
  report_query_id: string;
  updated_at: string;
}

const InteractiveBrokersConfig: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<IBConfig | null>(null);

  const fetchIBConfig = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabaseClient
        .from('ib_configs')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 means no rows returned
        throw error;
      }
      
      if (data) {
        setConfig(data as IBConfig);
        form.setFieldsValue({
          client_id: data.client_id,
          account_id: data.account_id,
          api_url: data.api_url,
          api_key: data.api_key,
          api_secret: data.api_secret,
          is_sandbox: data.is_sandbox,
          report_token: data.report_token,
          report_query_id: data.report_query_id
        });
      }
    } catch (err) {
      console.error('Failed to fetch IB config:', err);
      setError('获取盈透配置失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, [form]);

  useEffect(() => {
    fetchIBConfig();
  }, [fetchIBConfig]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      const values = await form.validateFields();

      if (config) {
        // 更新配置
        const { error } = await supabaseClient
          .from('ib_configs')
          .update(values)
          .eq('id', config.id);
        
        if (error) throw error;
      } else {
        // 创建新配置
        const { error } = await supabaseClient
          .from('ib_configs')
          .insert(values);
        
        if (error) throw error;
      }

      message.success('保存成功');
      fetchIBConfig(); // 重新获取配置以确保数据最新
    } catch (err) {
      console.error('Failed to save IB config:', err);
      setError('保存盈透配置失败，请稍后重试');
      message.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (config) {
      form.setFieldsValue({
        client_id: config.client_id,
        account_id: config.account_id,
        api_url: config.api_url,
        api_key: config.api_key,
        api_secret: config.api_secret,
        is_sandbox: config.is_sandbox,
        report_token: config.report_token,
        report_query_id: config.report_query_id
      });
    } else {
      form.resetFields();
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1>盈透配置</h1>
        <Button
          icon={<ReloadOutlined />}
          onClick={fetchIBConfig}
          loading={loading}
        >
          刷新
        </Button>
      </div>

      {error && <Alert message="错误" description={error} type="error" showIcon style={{ marginBottom: 24 }} />}

      <Spin spinning={loading}>
        <Card style={{ maxWidth: 600 }}>
          <Form
            form={form}
            layout="vertical"
            initialValues={{
              is_sandbox: false,
              report_token: '217468031699091975220215',
              report_query_id: '1355163'
            }}
          >
            <Form.Item
              name="client_id"
              label="客户端ID"
              rules={[{ required: true, message: '请输入客户端ID' }]}
            >
              <Input placeholder="请输入盈透客户端ID" />
            </Form.Item>
            
            <Form.Item
              name="account_id"
              label="账户ID"
              rules={[{ required: true, message: '请输入账户ID' }]}
            >
              <Input placeholder="请输入盈透账户ID" />
            </Form.Item>
            
            <Form.Item
              name="api_url"
              label="API地址"
              rules={[{ required: true, message: '请输入API地址' }]}
            >
              <Input placeholder="请输入盈透API地址" />
            </Form.Item>
            
            <Form.Item
              name="api_key"
              label="API Key"
              rules={[{ required: true, message: '请输入API Key' }]}
            >
              <Input placeholder="请输入API Key" />
            </Form.Item>
            
            <Form.Item
              name="api_secret"
              label="API Secret"
              rules={[{ required: true, message: '请输入API Secret' }]}
            >
              <Input.Password placeholder="请输入API Secret" />
            </Form.Item>
            
            <Form.Item
              name="is_sandbox"
              label="沙箱环境"
            >
              <Checkbox>
                使用沙箱环境
              </Checkbox>
            </Form.Item>
            
            <Form.Item
              name="report_token"
              label="报表Token"
              rules={[{ required: true, message: '请输入报表Token' }]}
            >
              <Input placeholder="请输入自定义报表Token" />
            </Form.Item>
            
            <Form.Item
              name="report_query_id"
              label="报表Query ID"
              rules={[{ required: true, message: '请输入报表Query ID' }]}
            >
              <Input placeholder="请输入自定义报表Query ID" />
            </Form.Item>
            
            <Form.Item style={{ marginTop: 32 }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <Button type="primary" onClick={handleSave} loading={saving} icon={<SaveOutlined />}>
                  保存配置
                </Button>
                <Button onClick={handleReset}>
                  重置
                </Button>
              </div>
            </Form.Item>
          </Form>
        </Card>
      </Spin>
    </div>
  );
};

export default InteractiveBrokersConfig;