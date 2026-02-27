import { StrictMode, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Refine } from '@refinedev/core';
import routerProvider from '@refinedev/react-router-v6';
import { dataProvider as supabaseDataProvider } from '@refinedev/supabase';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ConfigProvider, message, Spin, Form, Input, Button, Card } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import zhCN from 'antd/locale/zh_CN';
import { createClient } from '@supabase/supabase-js';
import './index.css';
import App from './App';
import { UserProvider } from './contexts/UserContext';

// Get Supabase environment variables directly from Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY'
  );
}

// Initialize Supabase client directly here
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// Create data provider
const dataProvider = supabaseDataProvider(supabaseClient);

// Admin Login Component
const AdminLogin: React.FC<{ onLogin: (user: any) => void }> = ({ onLogin }) => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const handleLogin = async () => {
    setLoading(true);
    try {
      // 验证表单
      await form.validateFields();
      
      console.log('Login attempt with phone:', phone);
      
      // 直接从数据库中查询用户，不使用 Supabase Auth
      const { data: userData, error } = await supabaseClient
        .from('users')
        .select('id, name, role, email, password')
        .or(`phone.eq.${phone},email.eq.${phone}@auroracm.net`)
        .single();

      if (error || !userData) {
        console.error('User not found or database error:', error);
        throw new Error('用户不存在或密码错误');
      }

      console.log('User found:', userData.id, userData.role);
      
      // 检查密码是否匹配（注意：实际生产环境中应该使用加密密码）
      if (userData.password !== password) {
        console.error('Password mismatch');
        throw new Error('用户不存在或密码错误');
      }
      
      // Check if user has admin or waiter role
      if (userData.role !== 'admin' && userData.role !== 'waiter') {
        console.error('Insufficient permissions:', userData.role);
        throw new Error('You do not have permission to access this admin panel');
      }

      // Login successful
      onLogin(userData);
      message.success('登录成功');
    } catch (error: any) {
      console.error('Admin login error details:', {
        message: error.message,
        name: error.name,
        code: error.code,
        status: error.status
      });
      message.error(error.message || '登录失败，请重试');
      console.error('Admin login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <Card 
        style={{
          width: 420,
          borderRadius: 16,
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
          padding: '32px 24px'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{
            fontSize: 28,
            fontWeight: 700,
            color: '#1890ff',
            marginBottom: 8
          }}>
            Aurora Intelligent Fund SPC Ltd.
          </h1>
          <p style={{ fontSize: 14, color: '#666' }}>
            管理员登录
          </p>
        </div>
        
        <Form
          form={form}
          layout="vertical"
          onFinish={handleLogin}
        >
          <Form.Item
            name="phone"
            label={<span style={{ fontWeight: 600, color: '#333' }}>手机号码</span>}
            rules={[
              { required: true, message: '请输入手机号码' },
              { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码格式' }
            ]}
            style={{ marginBottom: 20 }}
          >
            <Input
              type="tel"
              placeholder="请输入手机号码"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              size="large"
              prefix={<UserOutlined />}
              style={{
                borderRadius: 8,
                height: 48,
                fontSize: 16
              }}
            />
          </Form.Item>
          
          <Form.Item
            name="password"
            label={<span style={{ fontWeight: 600, color: '#333' }}>密码</span>}
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码长度不能少于6位' }
            ]}
            style={{ marginBottom: 28 }}
          >
            <Input.Password
              placeholder="请输入密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              size="large"
              prefix={<LockOutlined />}
              style={{
                borderRadius: 8,
                height: 48,
                fontSize: 16
              }}
              autoComplete="current-password"
            />
          </Form.Item>
          
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              size="large"
              style={{
                width: '100%',
                height: 48,
                borderRadius: 8,
                fontSize: 16,
                fontWeight: 600
              }}
            >
              登录
            </Button>
          </Form.Item>
        </Form>
        
        <div style={{
          textAlign: 'center',
          marginTop: 24,
          fontSize: 12,
          color: '#999'
        }}>
          © {new Date().getFullYear()} Aurora Intelligent Fund SPC Ltd.
        </div>
      </Card>
    </div>
  );
};

// Protected Admin App Component
const ProtectedApp: React.FC = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Check authentication status on mount
  useEffect(() => {
    // 由于我们不再使用 Supabase Auth，直接将 loading 设置为 false
    // 首次访问时，用户将看到登录页面
    setLoading(false);
  }, []);

  // Handle login success
  const handleLogin = (userData: any) => {
    setAuthenticated(true);
    setUser(userData);
  };

  // Handle logout
  const handleLogout = () => {
    // 由于我们不再使用 Supabase Auth，直接重置状态
    setAuthenticated(false);
    setUser(null);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!authenticated) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  return (
    <UserProvider initialUser={user}>
      <App user={user} onLogout={handleLogout} />
    </UserProvider>
  );
};

// Store root reference to avoid duplicate createRoot calls
let root = (window as any).__reactRoot;
if (!root) {
  root = createRoot(document.getElementById('root')!);
  (window as any).__reactRoot = root;
}

root.render(
  <StrictMode>
    <BrowserRouter>
      <ConfigProvider locale={zhCN}>
        <Refine
          routerProvider={routerProvider}
          dataProvider={dataProvider}
          // 移除positions资源配置，因为我们已经在前端手动处理了数据获取
          resources={[
            {
              name: 'partners',
              list: '/partners',
            },
          ]}
        >
          <Routes>
            <Route path="/*" element={<ProtectedApp />} />
          </Routes>
        </Refine>
      </ConfigProvider>
    </BrowserRouter>
  </StrictMode>,
);
