import React from 'react';
import { Menu } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import { NavigationItem } from '../config/navigation.tsx';

interface DynamicMenuProps {
  items: NavigationItem[];
  theme?: 'light' | 'dark';
  mode?: 'vertical' | 'horizontal' | 'inline';
  style?: React.CSSProperties;
}

const DynamicMenu: React.FC<DynamicMenuProps> = ({
  items,
  theme = 'dark',
  mode = 'inline',
  style,
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  // 转换导航配置为Ant Design Menu所需的格式
  const convertToMenuItems = (navItems: NavigationItem[]) => {
    return navItems.map((item) => {
      const menuItem: any = {
        key: item.key,
        label: item.label,
        icon: item.icon,
      };

      if (item.children) {
        menuItem.children = convertToMenuItems(item.children);
      } else if (item.path) {
        menuItem.onClick = () => {
          navigate(item.path!);
        };
      }

      return menuItem;
    });
  };

  const menuItems = convertToMenuItems(items);

  return (
    <Menu
      theme={theme}
      mode={mode}
      selectedKeys={[location.pathname]}
      items={menuItems}
      style={style}
    />
  );
};

export default DynamicMenu;
