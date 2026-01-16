'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DepositService() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Form state
  const [amount, setAmount] = useState('');
  const [depositMethod, setDepositMethod] = useState('bank_transfer');
  const [bankInfo, setBankInfo] = useState({
    bankName: '中国银行',
    accountNumber: '6217 8578 **** **** 1234',
    accountName: '张三',
  });
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Bank list for selection
  const banks = [
    { id: 'bank1', name: '中国银行', accountNumber: '6217 8578 **** **** 1234', accountName: '张三' },
    { id: 'bank2', name: '中国工商银行', accountNumber: '6222 0212 **** **** 5678', accountName: '张三' },
    { id: 'bank3', name: '中国建设银行', accountNumber: '6214 6601 **** **** 9012', accountName: '张三' },
  ];
  
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);
        
        // Check for mock session in localStorage
        let isAuth = false;
        
        // 1. First check for mock session
        try {
          const mockSession = localStorage.getItem('mock_session');
          if (mockSession) {
            isAuth = true;
          }
        } catch (mockError) {
          console.error('Mock session error:', mockError);
        }
        
        // 2. If no mock session, try Supabase Auth
        if (!isAuth) {
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              isAuth = true;
            }
          } catch (authError) {
            console.error('Supabase Auth error:', authError);
          }
        }
        
        setIsAuthenticated(isAuth);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);
  
  const handleBankChange = (bankId: string) => {
    const selectedBank = banks.find(bank => bank.id === bankId);
    if (selectedBank) {
      setBankInfo({
        bankName: selectedBank.name,
        accountNumber: selectedBank.accountNumber,
        accountName: selectedBank.accountName,
      });
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || parseFloat(amount) <= 0) {
      setError('请输入有效的入金金额');
      return;
    }
    
    try {
      setProcessing(true);
      setError(null);
      
      // Mock API call - replace with actual deposit process
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log('Submit deposit:', {
        amount: parseFloat(amount),
        depositMethod,
        bankInfo,
      });
      
      // Navigate to success page
      setSuccess(true);
    } catch (err) {
      setError('入金申请失败，请稍后重试');
      console.error('Deposit error:', err);
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
            请登录以申请入金。如果您已经登录，请刷新页面重试。
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
            <h1 className="text-2xl font-bold text-gray-800">入金申请已提交</h1>
            <p className="text-gray-600 mt-2">请按照以下信息完成转账，转账后我们将在1-2个工作日内处理</p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">入金信息</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">入金金额</span>
                <span className="font-medium text-green-600">¥{amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">入金方式</span>
                <span className="font-medium">银行转账</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">处理时间</span>
                <span className="font-medium">1-2个工作日</span>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4 text-blue-800">收款信息</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-blue-600 font-medium">收款银行</p>
                <p className="font-medium">中国银行</p>
              </div>
              <div>
                <p className="text-sm text-blue-600 font-medium">收款账号</p>
                <p className="font-medium">6217 8578 **** **** 1234</p>
              </div>
              <div>
                <p className="text-sm text-blue-600 font-medium">收款户名</p>
                <p className="font-medium">极光资产管理有限公司</p>
              </div>
              <div>
                <p className="text-sm text-blue-600 font-medium">备注信息</p>
                <p className="font-medium">请务必备注您的客户编号：J000000001</p>
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
              继续入金
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">入金服务</h1>
        <Link 
          href="/user/assets"
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          返回资产状态
        </Link>
      </div>
      
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="space-y-6">
          {/* Deposit Amount */}
          <div>
            <h2 className="text-lg font-semibold mb-4 text-gray-800">入金金额</h2>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-500 text-lg">
                ¥
              </span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-10 pr-4 py-4 text-xl border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="请输入入金金额"
                step="100"
              />
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {[10000, 50000, 100000, 200000].map(quickAmount => (
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
          
          {/* Deposit Method */}
          <div>
            <h2 className="text-lg font-semibold mb-4 text-gray-800">入金方式</h2>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center p-3 border border-gray-200 rounded-lg hover:border-blue-500 cursor-pointer transition-colors">
                <input
                  type="radio"
                  id="bank_transfer"
                  name="depositMethod"
                  value="bank_transfer"
                  checked={depositMethod === 'bank_transfer'}
                  onChange={(e) => setDepositMethod(e.target.value)}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <div className="ml-3">
                  <label htmlFor="bank_transfer" className="text-sm font-medium text-gray-700 cursor-pointer">
                    银行转账
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    支持多家银行，到账时间1-2个工作日
                  </p>
                </div>
              </div>
              <div className="flex items-center p-3 border border-gray-200 rounded-lg hover:border-blue-500 cursor-pointer transition-colors">
                <input
                  type="radio"
                  id="online_payment"
                  name="depositMethod"
                  value="online_payment"
                  checked={depositMethod === 'online_payment'}
                  onChange={(e) => setDepositMethod(e.target.value)}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  disabled
                />
                <div className="ml-3">
                  <label htmlFor="online_payment" className="text-sm font-medium text-gray-700 cursor-pointer">
                    在线支付
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    支持支付宝、微信支付，实时到账
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
          
          {/* Bank Selection */}
          {depositMethod === 'bank_transfer' && (
            <div>
              <h2 className="text-lg font-semibold mb-4 text-gray-800">选择收款银行</h2>
              <div className="space-y-3">
                {banks.map(bank => (
                  <div 
                    key={bank.id}
                    className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${bankInfo.bankName === bank.name ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-500'}`}
                    onClick={() => handleBankChange(bank.id)}
                  >
                    <input
                      type="radio"
                      id={bank.id}
                      name="bank"
                      value={bank.id}
                      checked={bankInfo.bankName === bank.name}
                      onChange={() => handleBankChange(bank.id)}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <div className="ml-3">
                      <label htmlFor={bank.id} className="text-sm font-medium text-gray-700 cursor-pointer">
                        {bank.name}
                      </label>
                      <p className="text-xs text-gray-500 mt-1">
                        {bank.accountNumber} - {bank.accountName}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Notice */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-yellow-800 mb-2 flex items-center">
              <span className="text-yellow-500 mr-2">⚠️</span>
              入金须知
            </h3>
            <ul className="text-sm text-yellow-700 space-y-2">
              <li className="flex items-start">
                <span className="text-yellow-500 mr-2">•</span>
                <span>请确保转账金额与申请金额一致，否则可能导致入金失败</span>
              </li>
              <li className="flex items-start">
                <span className="text-yellow-500 mr-2">•</span>
                <span>转账时请务必备注您的客户编号，以便我们及时处理</span>
              </li>
              <li className="flex items-start">
                <span className="text-yellow-500 mr-2">•</span>
                <span>银行转账一般1-2个工作日到账，请耐心等待</span>
              </li>
              <li className="flex items-start">
                <span className="text-yellow-500 mr-2">•</span>
                <span>如有疑问，请联系客服：400-123-4567</span>
              </li>
            </ul>
          </div>
          
          {/* Submit Button */}
          <div>
            <button
              onClick={handleSubmit}
              disabled={!amount || parseFloat(amount) <= 0 || processing}
              className={`w-full py-4 rounded-lg font-medium transition-colors ${(!amount || parseFloat(amount) <= 0 || processing) ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
            >
              {processing ? '处理中...' : '提交入金申请'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}