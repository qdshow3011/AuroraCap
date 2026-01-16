'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserNav } from '@/components/UserNav';

export default function WithdrawalApplication() {
  const router = useRouter();
  
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Form state
  const [amount, setAmount] = useState('');
  const [withdrawalMethod, setWithdrawalMethod] = useState('bank_account');
  const [selectedAccount, setSelectedAccount] = useState('default');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Calculated values
  const [fees, setFees] = useState(0);
  const [netAmount, setNetAmount] = useState(0);
  
  // Available balance (mock data)
  const [availableBalance, setAvailableBalance] = useState(150000);
  
  // Bank accounts for selection
  const bankAccounts = [
    { id: 'default', name: '中国银行', accountNumber: '6217 8578 **** **** 1234', accountName: '张三' },
    { id: 'account2', name: '中国工商银行', accountNumber: '6222 0212 **** **** 5678', accountName: '张三' },
  ];
  
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);
        
        // Check for mock session in localStorage
        let isAuth = false;
        let currentUser = null;
        let profileData = null;
        
        // 1. First check for mock session
        try {
          const mockSession = localStorage.getItem('mock_session');
          if (mockSession) {
            const sessionData = JSON.parse(mockSession);
            currentUser = sessionData.user;
            isAuth = true;
            
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
        if (!isAuth) {
          try {
            const { data: { user: supabaseUser } } = await supabase.auth.getUser();
            if (supabaseUser) {
              currentUser = supabaseUser;
              isAuth = true;
              
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
          } catch (authError) {
            console.error('Supabase Auth error:', authError);
          }
        }
        
        setUser(currentUser);
        setProfile(profileData);
        setIsAuthenticated(isAuth);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);
  
  // Calculate fees and net amount when amount changes
  useEffect(() => {
    const amountValue = parseFloat(amount);
    if (!isNaN(amountValue) && amountValue > 0) {
      // Mock fee calculation: 0.1% of withdrawal amount, minimum 5 yuan
      const calculatedFee = Math.max(amountValue * 0.001, 5);
      setFees(calculatedFee);
      setNetAmount(amountValue - calculatedFee);
    } else {
      setFees(0);
      setNetAmount(0);
    }
  }, [amount]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const amountValue = parseFloat(amount);
    
    if (!amount || amountValue <= 0) {
      setError('请输入有效的出金金额');
      return;
    }
    
    if (amountValue > availableBalance) {
      setError('出金金额不能超过可用余额');
      return;
    }
    
    if (!agreeTerms) {
      setError('请阅读并同意相关条款');
      return;
    }
    
    try {
      setProcessing(true);
      setError(null);
      
      // Mock API call - replace with actual withdrawal process
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log('Submit withdrawal:', {
        amount: amountValue,
        fees,
        netAmount,
        withdrawalMethod,
        selectedAccount,
      });
      
      // Navigate to success page
      setSuccess(true);
    } catch (err) {
      setError('出金申请失败，请稍后重试');
      console.error('Withdrawal error:', err);
    } finally {
      setProcessing(false);
    }
  };
  
  if (loading) {
    return <div className="container mx-auto px-4 py-8">加载中...</div>;
  }
  
  // If not authenticated, show login message
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-2xl mx-auto text-center">
          <h1 className="text-2xl md:text-3xl font-bold mb-4">需要登录</h1>
          <p className="text-gray-600 mb-8">
            请登录以申请出金。如果您已经登录，请刷新页面重试。
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
  
  if (error && !success) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
        <Link href="/user/assets" className="text-blue-600 hover:underline">
          返回资产状态
        </Link>
      </div>
    );
  }
  
  if (success) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">出金申请已提交</h1>
            <p className="text-gray-600 mt-2">您的出金申请已提交，请耐心等待处理</p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">出金信息</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">出金金额</span>
                <span className="font-medium text-red-600">¥{amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">手续费</span>
                <span className="font-medium">¥{fees.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">预计到账金额</span>
                <span className="font-medium">¥{netAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">处理时间</span>
                <span className="font-medium">1-2个工作日</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link 
              href="/user/assets"
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-center"
            >
              查看资产状态
            </Link>
            <button 
              onClick={() => setSuccess(false)}
              className="flex-1 px-6 py-3 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors text-center"
            >
              继续出金
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">出金申请</h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left sidebar */}
        <div className="lg:col-span-1">
          <UserNav user={user} profile={profile} />
        </div>
        
        {/* Withdrawal Form */}
        <div className="lg:col-span-3 max-w-3xl">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="space-y-6">
              {/* Available Balance */}
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-blue-600">可用余额</p>
                    <p className="text-xl font-bold text-blue-900">¥{availableBalance.toFixed(2)}</p>
                  </div>
                  <button 
                    onClick={() => setAmount(availableBalance.toString())}
                    className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-full hover:bg-blue-700 transition-colors"
                  >
                    全部取出
                  </button>
                </div>
              </div>
              
              {/* Withdrawal Amount */}
              <div>
                <h2 className="text-lg font-semibold mb-4 text-gray-800">出金金额</h2>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-500 text-lg">
                    ¥
                  </span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-10 pr-4 py-4 text-xl border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="请输入出金金额"
                    step="100"
                  />
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {[5000, 10000, 20000, 50000].map(quickAmount => (
                    <button
                      key={quickAmount}
                      onClick={() => setAmount(quickAmount.toString())}
                      className="px-4 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
                    >
                      ¥{quickAmount}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Withdrawal Method */}
              <div>
                <h2 className="text-lg font-semibold mb-4 text-gray-800">出金方式</h2>
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center p-3 border border-gray-200 rounded-lg hover:border-blue-500 cursor-pointer transition-colors">
                    <input
                      type="radio"
                      id="bank_account"
                      name="withdrawalMethod"
                      value="bank_account"
                      checked={withdrawalMethod === 'bank_account'}
                      onChange={(e) => setWithdrawalMethod(e.target.value)}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <div className="ml-3">
                      <label htmlFor="bank_account" className="text-sm font-medium text-gray-700 cursor-pointer">
                        银行账户
                      </label>
                      <p className="text-xs text-gray-500 mt-1">
                        出金至绑定的银行账户，1-2个工作日到账
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center p-3 border border-gray-200 rounded-lg hover:border-blue-500 cursor-pointer transition-colors">
                    <input
                      type="radio"
                      id="alipay"
                      name="withdrawalMethod"
                      value="alipay"
                      checked={withdrawalMethod === 'alipay'}
                      onChange={(e) => setWithdrawalMethod(e.target.value)}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      disabled
                    />
                    <div className="ml-3">
                      <label htmlFor="alipay" className="text-sm font-medium text-gray-700 cursor-pointer">
                        支付宝
                      </label>
                      <p className="text-xs text-gray-500 mt-1">
                        出金至支付宝账户，实时到账
                      </p>
                    </div>
                    <div className="ml-auto">
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                        即将上线
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Bank Account Selection */}
              {withdrawalMethod === 'bank_account' && (
                <div>
                  <h2 className="text-lg font-semibold mb-4 text-gray-800">选择出金账户</h2>
                  <div className="space-y-3">
                    {bankAccounts.map(account => (
                      <div 
                        key={account.id}
                        className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${selectedAccount === account.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-500'}`}
                        onClick={() => setSelectedAccount(account.id)}
                      >
                        <input
                          type="radio"
                          id={account.id}
                          name="selectedAccount"
                          value={account.id}
                          checked={selectedAccount === account.id}
                          onChange={() => setSelectedAccount(account.id)}
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <div className="ml-3">
                          <label htmlFor={account.id} className="text-sm font-medium text-gray-700 cursor-pointer">
                            {account.name}
                          </label>
                          <p className="text-xs text-gray-500 mt-1">
                            {account.accountNumber} - {account.accountName}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Fees and Net Amount */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">出金金额</span>
                    <span className="font-medium">¥{amount || '0.00'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">手续费</span>
                    <span className="font-medium">¥{fees.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-sm font-semibold text-gray-700">预计到账金额</span>
                    <span className="text-lg font-bold">¥{netAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              {/* Terms and Conditions */}
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="terms"
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="terms" className="text-gray-600">
                    我已阅读并同意
                    <Link href="#" className="text-blue-600 hover:underline ml-1">《出金协议》</Link>
                    和
                    <Link href="#" className="text-blue-600 hover:underline ml-1">《隐私政策》</Link>
                  </label>
                </div>
              </div>
              
              {/* Submit Button */}
              <div>
                <button
                  onClick={handleSubmit}
                  disabled={!amount || parseFloat(amount) <= 0 || parseFloat(amount) > availableBalance || !agreeTerms || processing}
                  className={`w-full py-4 rounded-lg font-medium transition-colors ${(!amount || parseFloat(amount) <= 0 || parseFloat(amount) > availableBalance || !agreeTerms || processing) ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                >
                  {processing ? '处理中...' : '提交出金申请'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}