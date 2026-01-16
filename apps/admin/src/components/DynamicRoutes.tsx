import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { NavigationItem } from '../config/navigation.tsx';

interface DynamicRoutesProps {
  items: NavigationItem[];
  defaultPath?: string;
}

const DynamicRoutes: React.FC<DynamicRoutesProps> = ({ items, defaultPath = '/dashboard' }) => {
  // 递归生成路由
  const generateRoutes = (navItems: NavigationItem[]): React.ReactNode[] => {
    return navItems.flatMap((item): React.ReactNode[] => {
      if (item.path && item.component) {
        // 动态导入组件
        const LazyComponent = React.lazy(item.component);
        
        return [
          <Route
            key={item.key}
            path={item.path}
            element={
              <Suspense fallback={<div>加载中...</div>}>
                <LazyComponent />
              </Suspense>
            }
          />
        ];
      } else if (item.children) {
        // 递归处理子项
        return generateRoutes(item.children);
      }
      return [];
    });
  };

  const routes = generateRoutes(items);

  // 定义额外路由的懒加载组件
  const UsedInvitationCodes = React.lazy(() => import('../pages/user-center/used-invitation-codes'));
  const ChatDetail = React.lazy(() => import('../pages/user-center/chat-detail'));

  return (
    <Routes>
      {/* 默认路由 */}
      <Route path="/" element={<Navigate to={defaultPath} replace />} />
      {/* 动态生成的路由 */}
      {routes}
      {/* 额外路由 - 不显示在菜单中 */}
      <Route
        path="/user-center/used-invitation-codes"
        element={
          <Suspense fallback={<div>加载中...</div>}>
            <UsedInvitationCodes />
          </Suspense>
        }
      />
      {/* 聊天详情路由 */}
      <Route
        path="/user-center/chat-detail"
        element={
          <Suspense fallback={<div>加载中...</div>}>
            <ChatDetail />
          </Suspense>
        }
      />
    </Routes>
  );
};

export default DynamicRoutes;
