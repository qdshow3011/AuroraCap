'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import BlurEffect from '@/components/BlurEffect';
import { UserNav } from '@/components/UserNav';

// Define local types since @aurora/supabase-types is not available
type UserRole = 'Admin' | 'User' | 'Guest';

export default function Profile() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isObserverMode, setIsObserverMode] = useState(false);

  // Form state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [email2, setEmail2] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other' | ''>('');
  const [address, setAddress] = useState('');
  
  // Account info state
  const [clientId, setClientId] = useState('');
  const [accountType, setAccountType] = useState('');
  const [createdAt, setCreatedAt] = useState('');
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        let currentUser = null;
        let profileData = null;
        let userData = null;
        
        // 1. First check for mock session in localStorage
        try {
          const mockSession = localStorage.getItem('mock_session');
          if (mockSession) {
            const sessionData = JSON.parse(mockSession);
            currentUser = sessionData.user;
            
            // Get user profile from users table
            if (currentUser?.email) {
              // For mock sessions, we get all user data from users table
              const { data: usersTableData } = await supabase
                .from('users')
                .select('*')
                .eq('email', currentUser.email)
                .single();
              
              if (usersTableData) {
                userData = usersTableData;
                // Use users table data for profile as well (since we don't have profiles table for mock users)
                profileData = {
                  ...usersTableData,
                  role: usersTableData.role || 'User'
                };
              }
            }
          }
        } catch (mockError) {
          console.error('Mock session error:', mockError);
        }
        
        // 2. If no mock session, try Supabase Auth
        if (!currentUser) {
          try {
            const { data: { user: supabaseUser } } = await supabase.auth.getUser();
            currentUser = supabaseUser;
            
            if (currentUser?.email) {
              // Get user account info from users table
              const { data: usersTableData } = await supabase
                .from('users')
                .select('*')
                .eq('email', currentUser.email)
                .single();
              userData = usersTableData;
            }
          } catch (authError) {
            console.error('Supabase Auth error:', authError);
          }
        }
        
        // 3. If we have user data, update state
        if (currentUser) {
          setUser(currentUser);
          setEmail(currentUser.email || '');
          
          if (profileData) {
            setFullName(profileData.full_name || '');
            setPhone(profileData.phone || '');
            setAvatar(profileData.avatar_url || null);
            setDateOfBirth(profileData.date_of_birth || '');
            setGender(profileData.gender || '');
            setAddress(profileData.address || '');
            
            // Check if user is in observer mode
            setUserRole(profileData.role as UserRole);
            setIsObserverMode(profileData.role === 'Guest' || profileData.role === 'USER');
          }
          
          if (userData) {
            setClientId(userData.customer_number || userData.client_id || 'J000000001');
            setEmail2(userData.email2 || '');
            setAccountType(userData.account_type || '大陆客户');
            setCreatedAt(userData.created_at ? new Date(userData.created_at).toISOString().split('T')[0] : '');
            setVerified(userData.verified || false);
          }
        } else {
          // If no user data, keep the user on the page with a message
          console.log('No user data found, keeping on profile page');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    try {
      setSaving(true);
      setMessage(null);
      
      // Update profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .upsert([{
          id: user.id,
          full_name: fullName,
          phone: phone,
          avatar_url: avatar,
          date_of_birth: dateOfBirth,
          gender: gender,
          address: address,
        }]);
      
      // Update user account info
      const { data: userData, error: userError } = await supabase
        .from('users')
        .update({
          email2: email2,
          account_type: accountType,
        })
        .eq('id', user.id);
      
      if (profileError || userError) {
        throw profileError || userError;
      }
      
      setMessage({ type: 'success', text: '个人资料更新成功' });
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: '更新失败，请重试' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="container mx-auto px-4 py-8">加载中...</div>;
  }

  // If no user data found, show a message instead of redirecting
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-2xl mx-auto text-center">
          <h1 className="text-2xl md:text-3xl font-bold mb-4">需要登录</h1>
          <p className="text-gray-600 mb-8">
            请登录以查看您的个人资料。如果您已经登录，请刷新页面重试。
          </p>
          <Link 
            href="/login" 
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            去登录
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">个人资料</h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left sidebar */}
        <div className="lg:col-span-1">
          <UserNav user={user} profile={profile} />
        </div>
        
        {/* Main content */}
        <div className="lg:col-span-3">
          <BlurEffect isBlurred={isObserverMode}>
            {/* Account Information Section */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">账户信息</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">客户编号</label>
                  <input
                    type="text"
                    value={clientId}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">账户类型</label>
                  <input
                    type="text"
                    value={accountType}
                    onChange={(e) => setAccountType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="请输入账户类型"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">开户日期</label>
                  <input
                    type="date"
                    value={createdAt}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">实名验证</label>
                  <div className="flex items-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {verified ? '已验证' : '未验证'}
                    </span>
                    {!verified && (
                      <button
                        type="button"
                        className="ml-2 px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                      >
                        立即验证
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Personal Information Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">个人信息</h2>
              
              {message && (
                <div className={`mb-4 p-4 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                  {message.text}
                </div>
              )}
              
              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="请输入姓名"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">电子邮箱</label>
                    <input
                      type="email"
                      value={email}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">备用邮箱</label>
                    <input
                      type="email"
                      value={email2}
                      onChange={(e) => setEmail2(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="请输入备用邮箱"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">手机号码</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="请输入手机号码"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">出生日期</label>
                    <input
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">性别</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as any)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">请选择性别</option>
                      <option value="male">男</option>
                      <option value="female">女</option>
                      <option value="other">其他</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">头像</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          const file = e.target.files[0];
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            if (event.target?.result) {
                              setAvatar(event.target.result as string);
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-end">
                    {avatar && (
                      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mr-4">
                        <img src={avatar} alt="Avatar preview" className="w-full h-full object-cover rounded-full" />
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">联系地址</label>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="请输入联系地址"
                    rows={3}
                  ></textarea>
                </div>
                
                <div>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-400"
                  >
                    {saving ? '保存中...' : '保存修改'}
                  </button>
                </div>
              </form>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6 mt-6">
              <h2 className="text-xl font-semibold mb-4">账户安全</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 border border-gray-200 rounded-md">
            <div>
              <h3 className="font-medium">修改密码</h3>
              <p className="text-sm text-gray-600">定期修改密码有助于保护账户安全</p>
            </div>
            <button
              disabled
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md cursor-not-allowed"
            >
              修改密码
            </button>
            <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
              即将上线
            </span>
          </div>
                
                <div className="flex justify-between items-center p-4 border border-gray-200 rounded-md">
                  <div>
                    <h3 className="font-medium">绑定手机</h3>
                    <p className="text-sm text-gray-600">绑定手机可以提高账户安全性</p>
                  </div>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                    {phone ? '已绑定' : '绑定手机'}
                  </button>
                </div>
                
                <div className="flex justify-between items-center p-4 border border-gray-200 rounded-md">
                  <div>
                    <h3 className="font-medium">登录设备管理</h3>
                    <p className="text-sm text-gray-600">查看并管理所有登录设备</p>
                  </div>
                  <button className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors">
                    查看设备
                  </button>
                </div>
              </div>
            </div>
          </BlurEffect>
        </div>
      </div>
    </div>
  );
}
