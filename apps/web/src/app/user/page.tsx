'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import BlurEffect from '@/components/BlurEffect';
import { UserNav } from '@/components/UserNav';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

// 我的资产类型定义
interface MyAssets {
  totalAssets: number;
  fundValue: number;
  cashBalance: number;
  pendingFunds: number;
}

// 资金状况类型定义
interface FundStatus {
  availableBalance: number;
  totalDeposit: number;
  totalWithdrawal: number;
  pendingAmount: number;
}

// 个人信息类型定义
interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  id_number: string;
  address: string;
  bank_cards: BankCard[];
  risk_assessment: RiskAssessment;
  kyc_verified: boolean;
  two_factor_enabled: boolean;
}

// 银行卡类型定义
interface BankCard {
  id: string;
  bank_name: string;
  card_number: string;
  card_type: string;
  is_default: boolean;
}

// 风险评估类型定义
interface RiskAssessment {
  level: string;
  score: number;
  date: string;
  expires_at: string;
}

// 模拟用户数据
const mockUser = {
  id: '1',
  email: 'user@example.com',
  name: '张三',
  role: 'USER'
};

// 模拟个人资料数据
const mockProfile: UserProfile = {
  id: '1',
  name: '张三',
  email: 'user@example.com',
  phone: '13800138000',
  avatar: 'https://neeko-copilot.bytedance.net/api/text2image?prompt=professional%20business%20person%20avatar&size=256x256',
  id_number: '110101199001011234',
  address: '北京市朝阳区建国路88号',
  bank_cards: [
    {
      id: '1',
      bank_name: '中国工商银行',
      card_number: '**** **** **** 1234',
      card_type: '储蓄卡',
      is_default: true
    },
    {
      id: '2',
      bank_name: '中国建设银行',
      card_number: '**** **** **** 5678',
      card_type: '储蓄卡',
      is_default: false
    }
  ],
  risk_assessment: {
    level: 'C3',
    score: 65,
    date: '2024-01-01',
    expires_at: '2025-01-01'
  },
  kyc_verified: true,
  two_factor_enabled: false
};

// 模拟资产数据
const mockAssets: MyAssets = {
  totalAssets: 125000.50,
  fundValue: 100000.00,
  cashBalance: 20000.50,
  pendingFunds: 5000.00
};

// 模拟资金状况数据
const mockFundStatus: FundStatus = {
  availableBalance: 18000.50,
  totalDeposit: 200000.00,
  totalWithdrawal: 75000.00,
  pendingAmount: 5000.00
};

export default function UserCenter() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [assets, setAssets] = useState<MyAssets | null>(null);
  const [fundStatus, setFundStatus] = useState<FundStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [isObserverMode, setIsObserverMode] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        // 检查本地存储中的模拟会话
        let currentUser = null;
        let profileData = null;
        
        try {
          const mockSession = localStorage.getItem('mock_session');
          if (mockSession) {
            const sessionData = JSON.parse(mockSession);
            currentUser = sessionData.user;
          } else {
            // 如果没有模拟会话，使用默认模拟数据
            currentUser = mockUser;
            // 保存到本地存储
            localStorage.setItem('mock_session', JSON.stringify({ user: currentUser }));
          }
        } catch (mockError) {
          console.error('Mock session error:', mockError);
          // 使用默认模拟数据
          currentUser = mockUser;
        }
        
        // 使用模拟个人资料数据
        profileData = mockProfile;
        
        // 设置状态
        setUser(currentUser);
        setProfile(profileData);
        setIsObserverMode(currentUser?.role === 'Guest' || currentUser?.role === 'USER');
        
        // 使用模拟资产数据
        setAssets(mockAssets);
        setFundStatus(mockFundStatus);
      } catch (error) {
        console.error('Error fetching user data:', error);
        // 使用默认模拟数据
        setUser(mockUser);
        setProfile(mockProfile);
        setAssets(mockAssets);
        setFundStatus(mockFundStatus);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  if (loading) {
    return <div className="container mx-auto px-4 py-8">加载中...</div>;
  }

  // Prepare data for charts
  const pieData = [
    { name: '基金市值', value: assets?.fundValue || 0, color: '#3b82f6' },
    { name: '现金余额', value: assets?.cashBalance || 0, color: '#10b981' },
    { name: '在途资金', value: assets?.pendingFunds || 0, color: '#f59e0b' },
  ];

  const barData = [
    { name: '可用余额', value: fundStatus?.availableBalance || 0, color: '#3b82f6' },
    { name: '总入金', value: fundStatus?.totalDeposit || 0, color: '#10b981' },
    { name: '总出金', value: fundStatus?.totalWithdrawal || 0, color: '#ef4444' },
    { name: '在途金额', value: fundStatus?.pendingAmount || 0, color: '#f59e0b' },
  ];



  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">用户中心</h1>
        <button 
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
          onClick={() => {
            // Handle logout
            localStorage.removeItem('mock_session');
            window.location.href = '/login';
          }}
        >
          退出登录
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left sidebar */}
        <div className="lg:col-span-1">
          <UserNav user={user} profile={profile} />
        </div>
        
        {/* Main content */}
        <div className="lg:col-span-3">
          {/* User Profile Card */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <div className="flex-shrink-0">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-gray-100">
                  <img 
                    src={profile?.avatar || 'https://neeko-copilot.bytedance.net/api/text2image?prompt=professional%20business%20person%20avatar&size=256x256'} 
                    alt="User Avatar" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-bold">{profile?.name || '未知用户'}</h2>
                    <p className="text-gray-500">{profile?.email || '未知邮箱'}</p>
                  </div>
                  <Link 
                    href="/user/profile" 
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    编辑资料
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">手机号</p>
                    <p className="text-sm font-medium">{profile?.phone || '未设置'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">实名认证</p>
                    <p className={`text-sm font-medium ${profile?.kyc_verified ? 'text-green-600' : 'text-red-600'}`}>
                      {profile?.kyc_verified ? '已认证' : '未认证'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">风险评估等级</p>
                    <p className="text-sm font-medium">{profile?.risk_assessment?.level || '未评估'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">风险评估日期</p>
                    <p className="text-sm font-medium">{profile?.risk_assessment?.date || '未评估'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Total Assets Overview */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">总资产概览</h2>
            <BlurEffect isBlurred={isObserverMode}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={60}
                          fill="#8884d8"
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `¥${Number(value).toFixed(2)}`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4 rounded-md">
                      <p className="text-sm text-gray-500">总资产</p>
                      <p className="text-sm font-bold">¥{(assets?.totalAssets || 0).toFixed(2)}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-md">
                      <p className="text-sm text-gray-500">基金市值</p>
                      <p className="text-sm font-bold">¥{(assets?.fundValue || 0).toFixed(2)}</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-md">
                      <p className="text-sm text-gray-500">现金余额</p>
                      <p className="text-sm font-bold">¥{(assets?.cashBalance || 0).toFixed(2)}</p>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-md">
                      <p className="text-sm text-gray-500">可用余额</p>
                      <p className="text-sm font-bold">¥{(fundStatus?.availableBalance || 0).toFixed(2)}</p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-md">
                      <p className="text-sm text-gray-500">总出金</p>
                      <p className="text-sm font-bold">¥{(fundStatus?.totalWithdrawal || 0).toFixed(2)}</p>
                    </div>
                    <div className="bg-indigo-50 p-4 rounded-md">
                      <p className="text-sm text-gray-500">在途金额</p>
                      <p className="text-sm font-bold">¥{(fundStatus?.pendingAmount || 0).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </BlurEffect>
          </div>
          
          {/* Bank Cards */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">银行卡管理</h2>
              <Link 
                href="/user/profile" 
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                管理银行卡
              </Link>
            </div>
            <BlurEffect isBlurred={isObserverMode}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profile?.bank_cards?.map((card) => (
                  <div key={card.id} className="border rounded-lg p-4 relative">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{card.bank_name}</p>
                        <p className="text-sm text-gray-500 mt-1">{card.card_type}</p>
                        <p className="text-sm font-medium mt-2">{card.card_number}</p>
                      </div>
                      {card.is_default && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">默认</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </BlurEffect>
          </div>
          
          {/* Fund Status Chart */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">资金状况</h2>
            <BlurEffect isBlurred={isObserverMode}>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={barData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => `¥${Number(value).toFixed(2)}`} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {barData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </BlurEffect>
          </div>
          
          {/* Security Settings */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">安全设置</h2>
              <Link 
                href="/user/settings" 
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                安全中心
              </Link>
            </div>
            <BlurEffect isBlurred={isObserverMode}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border rounded-lg p-4">
                  <p className="font-medium">交易密码</p>
                  <p className="text-sm text-gray-500 mt-1">用于保护您的交易操作</p>
                  <button className="mt-3 px-3 py-1 bg-gray-200 text-gray-800 rounded text-sm hover:bg-gray-300 transition-colors">
                    设置
                  </button>
                </div>
                <div className="border rounded-lg p-4">
                  <p className="font-medium">两步验证</p>
                  <p className="text-sm text-gray-500 mt-1">{profile?.two_factor_enabled ? '已开启' : '未开启'}</p>
                  <button className="mt-3 px-3 py-1 bg-gray-200 text-gray-800 rounded text-sm hover:bg-gray-300 transition-colors">
                    {profile?.two_factor_enabled ? '管理' : '开启'}
                  </button>
                </div>
                <div className="border rounded-lg p-4">
                  <p className="font-medium">登录密码</p>
                  <p className="text-sm text-gray-500 mt-1">定期修改密码保障安全</p>
                  <button className="mt-3 px-3 py-1 bg-gray-200 text-gray-800 rounded text-sm hover:bg-gray-300 transition-colors">
                    修改
                  </button>
                </div>
              </div>
            </BlurEffect>
          </div>
        </div>
      </div>
    </div>
  );
}
