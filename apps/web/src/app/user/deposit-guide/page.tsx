'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { UserNav } from '@/components/UserNav';

// Define local types since @aurora/supabase-types is not available
type UserRole = 'Admin' | 'User' | 'Guest';

export default function DepositGuide() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isObserverMode, setIsObserverMode] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        let currentUser = null;
        let profileData = null;
        
        // 1. First check for mock session in localStorage
        try {
          const mockSession = localStorage.getItem('mock_session');
          if (mockSession) {
            const sessionData = JSON.parse(mockSession);
            currentUser = sessionData.user;
            
            // Get user profile from users table
            if (currentUser?.email) {
              const { data: userData } = await supabase
                .from('users')
                .select('*')
                .eq('email', currentUser.email)
                .single();
              profileData = userData;
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
            
            // Get user profile from users table
            if (currentUser?.email) {
              const { data: userData } = await supabase
                .from('users')
                .select('*')
                .eq('email', currentUser.email)
                .single();
              profileData = userData;
            }
          } catch (authError) {
            console.error('Supabase Auth error:', authError);
          }
        }
        
        // 3. If we have user data, update state
        if (currentUser && profileData) {
          setUser(currentUser);
          setProfile(profileData);
          setUserRole(profileData.role as UserRole);
          setIsObserverMode(profileData.role === 'Guest' || profileData.role === 'User');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  if (loading) {
    return <div className="container mx-auto px-4 py-8">加载中...</div>;
  }

  // If no user data found, show a message instead of redirecting
  if (!userRole) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-2xl mx-auto text-center">
          <h1 className="text-2xl md:text-3xl font-bold mb-4">需要登录</h1>
          <p className="text-gray-600 mb-8">
            请登录以查看入金指导。如果您已经登录，请刷新页面重试。
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">入金指导</h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left sidebar */}
        <div className="lg:col-span-1">
          <UserNav user={user} profile={profile} />
        </div>
        
        {/* Main content */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-8">
              {/* Introduction */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">入金说明</h2>
                <p className="text-gray-600 mb-4">
                  欢迎使用我们的入金服务。以下是入金的详细步骤和流程，帮助您顺利完成资金存入操作。
                </p>
                <p className="text-gray-600">
                  入金流程简单快捷，通常在1-2个工作日内完成处理。请确保您提供的信息准确无误，以避免不必要的延误。
                </p>
              </div>
              
              {/* Process Steps */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-6 text-gray-800">入金流程</h2>
                
                {/* Flow Chart */}
                <div className="mb-8 bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-medium mb-4 text-center text-gray-800">入金流程图</h3>
                  <div className="relative">
                    {/* Flow Chart SVG */}
                    <svg className="w-full" viewBox="0 0 800 300" fill="none" xmlns="http://www.w3.org/2000/svg">
                      {/* Step 1 */}
                      <rect x="50" y="50" width="150" height="80" rx="10" fill="#E3F2FD" stroke="#2196F3" strokeWidth="2" />
                      <text x="125" y="85" textAnchor="middle" fill="#1976D2" fontWeight="bold" fontSize="16">1. 登录账户</text>
                      <text x="125" y="105" textAnchor="middle" fill="#1976D2" fontSize="12">访问账户中心</text>
                      
                      {/* Arrow 1 */}
                      <path d="M200 90 L250 90" stroke="#2196F3" strokeWidth="2" strokeLinecap="round" />
                      <polygon points="250,90 242,85 242,95" fill="#2196F3" />
                      
                      {/* Step 2 */}
                      <rect x="250" y="50" width="150" height="80" rx="10" fill="#E3F2FD" stroke="#2196F3" strokeWidth="2" />
                      <text x="325" y="85" textAnchor="middle" fill="#1976D2" fontWeight="bold" fontSize="16">2. 选择入金方式</text>
                      <text x="325" y="105" textAnchor="middle" fill="#1976D2" fontSize="12">银行转账/第三方支付</text>
                      
                      {/* Arrow 2 */}
                      <path d="M400 90 L450 90" stroke="#2196F3" strokeWidth="2" strokeLinecap="round" />
                      <polygon points="450,90 442,85 442,95" fill="#2196F3" />
                      
                      {/* Step 3 */}
                      <rect x="450" y="50" width="150" height="80" rx="10" fill="#E3F2FD" stroke="#2196F3" strokeWidth="2" />
                      <text x="525" y="85" textAnchor="middle" fill="#1976D2" fontWeight="bold" fontSize="16">3. 填写入金信息</text>
                      <text x="525" y="105" textAnchor="middle" fill="#1976D2" fontSize="12">金额、账户信息</text>
                      
                      {/* Arrow 3 */}
                      <path d="M600 90 L650 90" stroke="#2196F3" strokeWidth="2" strokeLinecap="round" />
                      <polygon points="650,90 642,85 642,95" fill="#2196F3" />
                      
                      {/* Step 4 */}
                      <rect x="650" y="50" width="100" height="80" rx="10" fill="#E3F2FD" stroke="#2196F3" strokeWidth="2" />
                      <text x="700" y="85" textAnchor="middle" fill="#1976D2" fontWeight="bold" fontSize="16">4. 确认提交</text>
                      <text x="700" y="105" textAnchor="middle" fill="#1976D2" fontSize="12">等待处理</text>
                      
                      {/* Arrow 4 */}
                      <path d="M525 130 L525 170" stroke="#2196F3" strokeWidth="2" strokeLinecap="round" />
                      <polygon points="525,170 520,162 530,162" fill="#2196F3" />
                      
                      {/* Step 5 */}
                      <rect x="450" y="170" width="150" height="80" rx="10" fill="#E8F5E8" stroke="#4CAF50" strokeWidth="2" />
                      <text x="525" y="205" textAnchor="middle" fill="#2E7D32" fontWeight="bold" fontSize="16">5. 处理完成</text>
                      <text x="525" y="225" textAnchor="middle" fill="#2E7D32" fontSize="12">资金到账通知</text>
                    </svg>
                  </div>
                </div>
                
                {/* Detailed Steps */}
                <div className="space-y-6">
                  <div className="flex">
                    <div className="flex-shrink-0 mr-4">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">1</div>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-800 mb-1">登录账户</h3>
                      <p className="text-gray-600">使用您的用户名和密码登录账户中心，进入"资产状态"页面。</p>
                    </div>
                  </div>
                  
                  <div className="flex">
                    <div className="flex-shrink-0 mr-4">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">2</div>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-800 mb-1">选择入金方式</h3>
                      <p className="text-gray-600">在入金页面，选择适合您的入金方式，包括银行转账、支付宝、微信支付等。</p>
                    </div>
                  </div>
                  
                  <div className="flex">
                    <div className="flex-shrink-0 mr-4">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">3</div>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-800 mb-1">填写入金信息</h3>
                      <p className="text-gray-600">输入您要存入的金额，并填写相关的账户信息。请确保信息准确无误。</p>
                    </div>
                  </div>
                  
                  <div className="flex">
                    <div className="flex-shrink-0 mr-4">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">4</div>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-800 mb-1">确认提交</h3>
                      <p className="text-gray-600">仔细核对您的入金信息，确认无误后提交申请。系统将生成唯一的入金订单号。</p>
                    </div>
                  </div>
                  
                  <div className="flex">
                    <div className="flex-shrink-0 mr-4">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold">5</div>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-800 mb-1">处理完成</h3>
                      <p className="text-gray-600">我们将在1-2个工作日内处理您的入金申请。资金到账后，您将收到系统通知。</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Instructions */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">入金须知</h2>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <svg className="w-5 h-5 text-yellow-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
                      </svg>
                      <span className="text-gray-700">入金金额最低为1000元，最高不限。</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="w-5 h-5 text-yellow-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
                      </svg>
                      <span className="text-gray-700">请确保您的入金账户名称与您在平台注册的名称一致，否则可能导致入金失败。</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="w-5 h-5 text-yellow-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
                      </svg>
                      <span className="text-gray-700">入金处理时间为工作日9:00-17:00，非工作日入金将在下一个工作日处理。</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="w-5 h-5 text-yellow-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
                      </svg>
                      <span className="text-gray-700">如有任何疑问，请联系我们的客服团队。</span>
                    </li>
                  </ul>
                </div>
              </div>
              
              {/* FAQ */}
              <div>
                <h2 className="text-xl font-semibold mb-4 text-gray-800">常见问题</h2>
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-gray-800 mb-2">Q: 入金需要多长时间到账？</h3>
                    <p className="text-gray-600">A: 通常情况下，入金会在1-2个工作日内处理完成。银行转账可能需要更长时间，具体取决于您的银行。</p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-gray-800 mb-2">Q: 入金是否有手续费？</h3>
                    <p className="text-gray-600">A: 我们不收取任何入金手续费，但您的银行或支付平台可能会收取相应费用。</p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-gray-800 mb-2">Q: 如何查看入金状态？</h3>
                    <p className="text-gray-600">A: 您可以在"交易流水"页面查看所有入金记录和状态。</p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-gray-800 mb-2">Q: 入金失败怎么办？</h3>
                    <p className="text-gray-600">A: 如果您的入金失败，请检查您的账户信息是否正确，并确保您的账户有足够的资金。如问题仍未解决，请联系客服。</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}