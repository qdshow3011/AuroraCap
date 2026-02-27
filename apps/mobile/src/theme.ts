/**
 * AuroraCap 移动应用主题配置
 * 统一的颜色、圆角、阴影等设计规范
 */

export const THEME = {
  // 主色调
  primary: '#1A4EA2',
  primaryLight: '#2E6CD1',
  primaryDark: '#0F3A7A',
  
  // 辅助色
  secondary: '#4CAF50',
  secondaryLight: '#66BB6A',
  secondaryDark: '#388E3C',
  
  // 功能色
  warning: '#FF9800',
  error: '#F44336',
  success: '#10B981',
  danger: '#EF4444',
  info: '#3B82F6',
  
  // 背景色
  background: '#F5F7FA',
  backgroundDark: '#E8ECF1',
  cardBg: '#FFFFFF',
  surface: '#FFFFFF',
  
  // 文字色
  textPrimary: '#1A1A2E',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  textInverse: '#FFFFFF',
  
  // 边框色
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  divider: '#E5E7EB',
  
  // 渐变配置
  gradients: {
    primary: ['#1A4EA2', '#2E6CD1'] as const,
    primaryDark: ['#0F3A7A', '#1A4EA2'] as const,
    surface: ['#FFFFFF', '#F5F7FA'] as const,
  },
  
  // 圆角规范
  radius: {
    sm: 8,      // 小圆角：按钮、标签
    md: 12,     // 中圆角：卡片、输入框
    lg: 16,     // 大圆角：大卡片、弹窗
    xl: 24,     // 全圆角：搜索框、头像
    full: 9999, // 完全圆形
  },
  
  // 阴影规范
  shadow: {
    none: {
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
      elevation: 8,
    },
    top: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 8,
    },
  },
  
  // 间距规范
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
  },
  
  // 字体规范
  typography: {
    h1: {
      fontSize: 28,
      fontWeight: '700' as const,
      lineHeight: 36,
    },
    h2: {
      fontSize: 24,
      fontWeight: '700' as const,
      lineHeight: 32,
    },
    h3: {
      fontSize: 20,
      fontWeight: '600' as const,
      lineHeight: 28,
    },
    h4: {
      fontSize: 18,
      fontWeight: '600' as const,
      lineHeight: 26,
    },
    body: {
      fontSize: 16,
      fontWeight: '400' as const,
      lineHeight: 24,
    },
    bodySmall: {
      fontSize: 14,
      fontWeight: '400' as const,
      lineHeight: 20,
    },
    caption: {
      fontSize: 12,
      fontWeight: '400' as const,
      lineHeight: 16,
    },
    button: {
      fontSize: 14,
      fontWeight: '600' as const,
      lineHeight: 20,
    },
  },
  
  // 动画配置
  animation: {
    fast: 150,
    normal: 300,
    slow: 500,
  },
  
  // 市场涨跌颜色（A股市场：红涨绿跌）
  market: {
    up: '#EF4444',    // 红色
    down: '#10B981',  // 绿色
    neutral: '#6B7280',
  },
  
  // 透明度
  opacity: {
    disabled: 0.4,
    hover: 0.8,
    pressed: 0.6,
  },
} as const;

// 导出类型
export type Theme = typeof THEME;
export type ThemeColor = keyof typeof THEME;

// 辅助函数：获取渐变颜色
export const getGradientColors = (name: keyof typeof THEME.gradients) => {
  return THEME.gradients[name];
};

// 辅助函数：获取带透明度的颜色
export const withOpacity = (color: string, opacity: number): string => {
  // 将 hex 转换为 rgba
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

// 辅助函数：判断颜色亮度（用于决定文字颜色）
export const getContrastColor = (backgroundColor: string): string => {
  const hex = backgroundColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? THEME.textPrimary : THEME.textInverse;
};

export default THEME;
