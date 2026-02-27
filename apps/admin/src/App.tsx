import { Layout, theme, Button, Dropdown, MenuProps } from 'antd';
import { MenuUnfoldOutlined, UserOutlined, LogoutOutlined } from '@ant-design/icons';
import { useState } from 'react';
// import { useLocation } from 'react-router-dom'; // 暂时注释掉，因为未使用
import './App.css';

// 导入自定义组件和配置
import { navigationConfig, getFlattenedRoutes } from './config/navigation.tsx';
import DynamicMenu from './components/DynamicMenu';
import DynamicRoutes from './components/DynamicRoutes';
import { useKeyboardNavigation } from './hooks/useKeyboardNavigation';

const { Header, Sider, Content } = Layout;

interface AppProps {
  user: any;
  onLogout: () => void;
}

const App: React.FC<AppProps> = ({ user, onLogout }) => {
  // const location = useLocation(); // 暂时注释掉，因为未使用
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  // 获取扁平化路由列表用于键盘导航
  const flattenedRoutes = getFlattenedRoutes(navigationConfig);

  // 使用键盘导航Hook
  useKeyboardNavigation({ routes: flattenedRoutes });

  // 下拉菜单选项
  const menuItems: MenuProps['items'] = [
    {
      key: 'profile',
      label: (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <UserOutlined />
          <span>个人资料</span>
        </div>
      ),
    },
    {
      key: 'logout',
      label: (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <LogoutOutlined />
          <span>退出登录</span>
        </div>
      ),
      danger: true,
      onClick: onLogout,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', background: '#001529' }}>
        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff', display: 'flex', alignItems: 'center', gap: 12 }}>
          <MenuUnfoldOutlined
            className="trigger"
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: 18, color: '#fff', cursor: 'pointer' }}
          />
          Aurora Intelligent Fund 管理后台
        </div>
        <div>
          <Dropdown menu={{ items: menuItems }} placement="bottomRight">
            <Button
              type="text"
              icon={<UserOutlined />}
              style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <span>{user?.role === 'admin' ? '管理员' : user?.role === 'waiter' ? '服务员' : user?.role === 'partner' ? '合伙人' : user?.role === 'customer' ? '客户' : user?.role === 'fund_company' ? '基金管理员' : user?.role}</span>
            </Button>
          </Dropdown>
        </div>
      </Header>
      <Layout>
        <Sider
          collapsible
          collapsed={collapsed}
          trigger={null}
          width={200}
          style={{ background: '#001529' }}
        >
          <DynamicMenu
            items={navigationConfig}
            theme="dark"
            mode="inline"
            style={{ height: '100%', borderRight: 0 }}
          />
        </Sider>
        <Layout style={{ background: colorBgContainer }}>
          <Content
            style={{
              margin: '24px 16px',
              padding: 24,
              minHeight: 280,
              maxHeight: 'calc(100vh - 112px)', // 100vh - Header高度(64px) - Content上下margin(24px*2)
              overflowY: 'auto',
              background: '#fff',
              borderRadius: borderRadiusLG,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)',
            }}
          >
            <DynamicRoutes items={navigationConfig} defaultPath="/dashboard" />
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default App;
