import React from 'react';
import {  DashboardOutlined,  UserOutlined,  TeamOutlined,  DatabaseOutlined,  SettingOutlined,  FileTextOutlined,  GiftOutlined,  ProductOutlined,  BellOutlined,  MessageOutlined,  TransactionOutlined,  LineChartOutlined,} from '@ant-design/icons';

// 定义导航项类型
export interface NavigationItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  path?: string;
  component?: () => Promise<{ default: React.ComponentType }>;
  children?: NavigationItem[];
}

// 导航配置
export const navigationConfig: NavigationItem[] = [
  {        key: '/dashboard',        label: '仪表盘',        icon: <DashboardOutlined />,        path: '/dashboard',        component: () => import('../pages/dashboard/index'),      },
  {
    key: '/user-center',
    label: '用户中心',
    icon: <UserOutlined />,
    children: [
      {
        key: '/user-center/customers',
        label: '注册用户管理',
        icon: <UserOutlined />,
        path: '/user-center/customers',
        component: () => import('../pages/user-center/customer-management'),
      },
      {
        key: '/user-center/clients',
        label: '客户管理',
        icon: <UserOutlined />,
        path: '/user-center/clients',
        component: () => import('../pages/user-center/client-management'),
      },
      {
        key: '/user-center/partners',
        label: '合伙人管理',
        icon: <TeamOutlined />,
        path: '/user-center/partners',
        component: () => import('../pages/user-center/partner-management'),
      },
      {
        key: '/user-center/admin-waiter',
        label: '管理员配置',
        icon: <UserOutlined />,
        path: '/user-center/admin-waiter',
        component: () => import('../pages/user-center/admin-waiter-management'),
      },
      {        key: '/user-center/invitation-codes',        label: '邀请码管理',        icon: <GiftOutlined />,        path: '/user-center/invitation-codes',        component: () => import('../pages/user-center/invitation-code-management'),      },
      {        key: '/user-center/customer-service',        label: '客服管理',        icon: <MessageOutlined />,        path: '/user-center/customer-service',        component: () => import('../pages/user-center/customer-service-management'),      },
    ],
  },
  {
      key: '/asset-management',
      label: '资管中心',
      icon: <DatabaseOutlined />,
      children: [
        {
          key: '/asset-management/cash-balance',
          label: '现金余额管理',
          icon: <DatabaseOutlined />,
          path: '/asset-management/cash-balance',
          component: () => import('../pages/asset-management/cash-balance-management'),
        },
        {
          key: '/asset-management/positions',
          label: '基金持仓管理',
          icon: <DatabaseOutlined />,
          path: '/asset-management/positions',
          component: () => import('../pages/positions/list'),
        },
        {
          key: '/asset-management/deposit-withdrawal',
          label: '入金/出金管理',
          icon: <TransactionOutlined />,
          path: '/asset-management/deposit-withdrawal',
          component: () => import('../pages/asset-management/deposit-withdrawal-management'),
        },
        {
          key: '/asset-management/subscription-redemption',
          label: '申购/赎回管理',
          icon: <TransactionOutlined />,
          path: '/asset-management/subscription-redemption',
          component: () => import('../pages/asset-management/subscription-redemption'),
        },
        {
          key: '/asset-management/products',
          label: '产品管理',
          icon: <ProductOutlined />,
          path: '/asset-management/products',
          component: () => import('../pages/asset-management/product-management'),
        },
        {
          key: '/asset-management/ib-data',
          label: '净值管理',
          icon: <SettingOutlined />,
          path: '/asset-management/ib-data',
          component: () => import('../pages/asset-management/interactive-brokers-data'),
        },
        {
          key: '/asset-management/index-management',
          label: '指数管理',
          icon: <LineChartOutlined />,
          path: '/asset-management/index-management',
          component: () => import('../pages/asset-management/index-management'),
        },
        {
          key: '/asset-management/contracts',
          label: '合同管理',
          icon: <FileTextOutlined />,
          path: '/asset-management/contracts',
          component: () => import('../pages/asset-management/contract-management'),
        },
      ],
    },
  {
    key: '/information-center',
    label: '资讯中心',
    icon: <BellOutlined />,
    children: [
      {
        key: '/information-center/news',
        label: '快讯管理',
        icon: <MessageOutlined />,
        path: '/information-center/news',
        component: () => import('../pages/information-center/news-management'),
      },
      {
        key: '/information-center/internal-references',
        label: '内参管理',
        icon: <FileTextOutlined />,
        path: '/information-center/internal-references',
        component: () => import('../pages/information-center/internal-reference-management'),
      },
      {
        key: '/information-center/messages',
        label: '消息管理',
        icon: <MessageOutlined />,
        path: '/information-center/messages',
        component: () => import('../pages/information-center/message-management'),
      },
    ],
  },
  {        key: '/system-settings',        label: '系统设置',        icon: <SettingOutlined />,        path: '/system-settings',        component: () => import('../pages/system-settings/index'),      },
];

// 扁平化路由列表
export const getFlattenedRoutes = (items: NavigationItem[]): string[] => {
  return items.reduce((acc, item) => {
    if (item.path && !item.children) {
      return [...acc, item.path];
    } else if (item.children) {
      return [...acc, ...getFlattenedRoutes(item.children)];
    }
    return acc;
  }, [] as string[]);
};
