/**
 * Admin Panel 核心类型定义
 * 极光资管 (Aurora Capital) - 管理后台类型
 */

// IBKR 连接状态枚举
export enum IBKRConnectionStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error',
  MAINTENANCE = 'maintenance'
}

// 持仓调整类型
export enum PositionAdjustmentType {
  BUY = 'buy',
  SELL = 'sell',
  TRANSFER_IN = 'transfer_in',
  TRANSFER_OUT = 'transfer_out',
  ADJUSTMENT = 'adjustment'
}

// 合伙人等级
export enum PartnerTier {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum',
  DIAMOND = 'diamond'
}

// 文章权限等级
export enum ArticleMinTier {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum',
  DIAMOND = 'diamond',
  PARTNER = 'partner'
}

// Dashboard 核心数据类型
export interface DashboardMetrics {
  totalAUM: number;
  totalUsers: number;
  totalPartners: number;
  activePositions: number;
  ibkrConnectionStatus: IBKRConnectionStatus;
  ibkrLastSyncTime: string | null;
  dailyPnL: number;
  monthlyReturn: number;
}

// IBKR 连接状态详情
export interface IBKRConnection {
  status: IBKRConnectionStatus;
  lastPing: string | null;
  errorMessage: string | null;
  uptime: number; // seconds
  reconnectAttempts: number;
  accountId: string | null;
}

// 合伙人信息
export interface Partner {
  id: string;
  email: string;
  name: string;
  tier: PartnerTier;
  invitedBy: string | null;
  invitedAt: string | null;
  activatedAt: string | null;
  totalAUM: number;
  clientCount: number;
  commissionRate: number;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  updatedAt: string;
}

// 批量邀请码生成请求
export interface BatchInviteRequest {
  count: number;
  tier: PartnerTier;
  commissionRate: number;
  expiresInDays: number;
  notes?: string;
}

// 邀请码信息
export interface InviteCode {
  code: string;
  status: 'active' | 'used' | 'expired' | 'revoked';
  uses: number;
  max_uses: number;
  expiry_date: string | null;
  created_at: string;
  updated_at: string | null;
  pushed_by: string | null;
  tier?: PartnerTier;
  commissionRate?: number;
  expiresAt?: string;
  usedBy?: string | null;
  usedAt?: string | null;
  notes?: string;
}

// 用户持仓信息
export interface UserPosition {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  symbol: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  positionType: 'long' | 'short';
  accountId: string;
  openedAt: string;
  updatedAt: string;
}

// 持仓调整请求
export interface PositionAdjustmentRequest {
  positionId: string;
  type: PositionAdjustmentType;
  quantity: number;
  price: number;
  reason: string;
  adminNotes?: string;
  executedAt: string;
}

// 持仓调整记录
export interface PositionAdjustment {
  id: string;
  positionId: string;
  userId: string;
  type: PositionAdjustmentType;
  quantity: number;
  price: number;
  reason: string;
  adminNotes?: string;
  adminId: string;
  executedAt: string;
  createdAt: string;
  status: 'pending' | 'completed' | 'rejected';
}

// 文章信息
export interface Article {
  id: string;
  title: string;
  content: string;
  summary: string;
  minTier: ArticleMinTier;
  tags: string[];
  authorId: string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'published' | 'archived';
  viewCount: number;
  featured: boolean;
}

// RPC 函数类型定义
export interface AdminRPCs {
  // Dashboard
  get_dashboard_metrics: () => Promise<DashboardMetrics>;
  get_ibkr_connection_status: () => Promise<IBKRConnection>;
  
  // Partner Management
  get_partners: (filters?: {
    tier?: PartnerTier;
    status?: string;
    search?: string;
  }) => Promise<Partner[]>;
  
  generate_batch_invite_codes: (request: BatchInviteRequest) => Promise<{
    codes: InviteCode[];
    totalCreated: number;
  }>;
  
  get_invite_codes: (filters?: {
    status?: string;
    tier?: PartnerTier;
  }) => Promise<InviteCode[]>;
  
  // Position Control
  get_user_positions: (filters?: {
    userId?: string;
    symbol?: string;
    minValue?: number;
  }) => Promise<UserPosition[]>;
  
  admin_adjust_position: (request: PositionAdjustmentRequest) => Promise<{
    success: boolean;
    adjustmentId: string;
    newPosition?: UserPosition;
  }>;
  
  get_position_adjustments: (filters?: {
    positionId?: string;
    userId?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => Promise<PositionAdjustment[]>;
  
  // Content Management
  get_articles: (filters?: {
    status?: string;
    minTier?: ArticleMinTier;
    search?: string;
    authorId?: string;
  }) => Promise<Article[]>;
  
  create_article: (article: Omit<Article, 'id' | 'createdAt' | 'updatedAt' | 'viewCount'>) => Promise<{
    success: boolean;
    articleId: string;
  }>;
  
  update_article: (id: string, updates: Partial<Article>) => Promise<{
    success: boolean;
  }>;
  
  publish_article: (id: string) => Promise<{
    success: boolean;
  }>;
}

// Admin 用户权限
export interface AdminPermissions {
  canViewDashboard: boolean;
  canManagePartners: boolean;
  canAdjustPositions: boolean;
  canManageContent: boolean;
  canViewAllPositions: boolean;
  canExportData: boolean;
  maxAdjustmentLimit: number; // 最大调整金额限制
  allowedAdjustmentTypes: PositionAdjustmentType[];
}

// Position 持仓信息
export interface Position {
  id: string;
  user_id: string;
  fund_id: string;
  shares: number;
  avg_cost: number;
  latest_nav: number;
  created_at: string;
  updated_at: string;
}

// Fund 基金产品信息
export interface Fund {
  id: string;
  name_en: string;
  name_cn: string;
  created_at: string;
  updated_at: string;
}

// User 用户信息
export interface User {
  id: string;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

// 用户角色枚举
export enum UserRole {
  ADMIN = 'admin',
  PARTNER = 'partner',
  CLIENT = 'client',
  WAITER = 'waiter'
}

// Admin 用户信息
export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  permissions: AdminPermissions;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// 合伙人仪表盘数据
export interface PartnerDashboard {
  id: string;
  name: string;
  email: string;
  phone_number: string | null;
  total_aum: number;
  client_count: number;
  created_at: string;
}

// Yahoo Finance 指数数据
export interface YahooIndex {
  id: string;
  symbol: string;
  name: string | null;
  price: number;
  change: number;
  change_percent: number;
  previous_close: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  timestamp: string;
  updated_at: string;
  
  // 新增字段：用于管理和监控
  market_type: 'us' | 'cn' | 'hk' | 'crypto' | 'commodity' | 'other';
  is_enabled: boolean;
  sync_status: 'success' | 'failed' | 'pending';
  last_sync_time: string | null;
  sync_error_message: string | null;
  data_source: 'yahoo-finance2' | 'manual';
}