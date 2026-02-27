// 类型定义文件

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  invite_code?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Customer extends User {
  role: 'customer';
}

export interface Waiter extends User {
  role: 'waiter';
}

export interface Admin extends User {
  role: 'admin';
}

export interface Partner extends User {
  role: 'partner';
}

export interface FundCompany extends User {
  role: 'fund_company';
}

export interface InviteCode {
  id: string;
  code: string;
  used: boolean;
  user_id?: string;
  status?: 'unused' | 'used' | 'expired';
  max_uses?: number;
  uses?: number;
  expiry_date?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  user_id?: string;
  agent_id?: string;
  content: string;
  type: 'text' | 'image' | 'file';
  status: 'pending' | 'sent' | 'delivered' | 'read';
  created_at?: string;
  updated_at?: string;
}

export interface ChatSession {
  id: string;
  user_id: string;
  agent_id: string;
  status: 'pending' | 'active' | 'closed';
  last_message_at?: string;
  created_at?: string;
  updated_at?: string;
  users?: User;
  agents?: User;
  customer?: Customer | undefined;
  agent?: Waiter | undefined;
  user_name?: string;
  agent_name?: string;
}

export interface CustomerWaiterSessionGroup {
  id: string;
  user_id: string;
  agent_id: string;
  status: string;
  last_message_at: string;
  created_at: string;
  user_name?: string;
  agent_name?: string;
}

export interface PartnerDashboard {
  id: string;
  name: string;
  email: string;
  phone: string;
  total_customers: number;
  total_assets: number;
  total_commission: number;
  total_aum?: number;
  client_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Position {
  id: string;
  fund_id: string;
  user_id: string;
  amount: number;
  price: number;
  status: 'active' | 'closed';
  shares?: number;
  latest_nav?: number;
  created_at?: string;
  updated_at?: string;
  fund?: Fund;
  user?: User;
}

export interface Fund {
  id: string;
  name: string;
  symbol: string;
  type: 'stock' | 'bond' | 'etf' | 'mutual';
  status: 'active' | 'inactive';
  name_cn?: string;
  name_en?: string;
  created_at?: string;
  updated_at?: string;
}
