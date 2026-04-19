'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface FundInfo {
  id: string;
  name: string;
  nav: number;
  min_subscription: number;
  management_fee: number;
  risk_level: string;
  code: string;
  size: number;
  manager: string;
}

// 模拟基金数据
const mockFunds = [
  {
    id: '1',
    name: '全球股票基金',
    code: 'GF001',
    nav: 10.5,
    min_subscription: 1000,
    management_fee: 1.5,
    risk_level: '高风险',
    size: 1000000000,
    manager: '张三'
  },
  {
    id: '2',
    name: '债券基金',
    code: 'BF001',
    nav: 5.2,
    min_subscription: 500,
    management_fee: 0.8,
    risk_level: '低风险',
    size: 500000000,
    manager: '李四'
  },
  {
    id: '3',
    name: '混合基金',
    code: 'HF001',
    nav: 8.7,
    min_subscription: 1000,
    management_fee: 1.2,
    risk_level: '中风险',
    size: 750000000,
    manager: '王五'
  }
];

export default function FundSubscribe() {
  const params = useParams();
  const router = useRouter();
  const fundId = params.fundId as string;
  
  const [fund, setFund] = useState<FundInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [amount, setAmount] = useState('');
  const [shares, setShares] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('balance');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Calculated values
  const [fees, setFees] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  
  // Available balance (mock data)
  const [availableBalance, setAvailableBalance] = useState(150000);
  
  useEffect(() => {
    const fetchFundDetails = async () => {
      try {
        setLoading(true);
        
        // 查找模拟基金数据
        const fundData = mockFunds.find(f => f.id === fundId);
        
        if (!fundData) {
          setError('基金不存在或获取失败');
          return;
        }
        
        // Set fund data
        setFund(fundData);
      } catch (err) {
        setError('获取基金信息失败');
        console.error('Error fetching fund details:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchFundDetails();
  }, [fundId]);
  
  // Calculate fees and total amount when amount changes
  useEffect(() => {
    if (amount && fund) {
      const amountValue = parseFloat(amount);
      if (!isNaN(amountValue) && amountValue > 0) {
        // Calculate fees (mock logic: 0.15% of amount)
        const fee = amountValue * 0.0015;
        setFees(fee);
        setTotalAmount(amountValue + fee);
        
        // Calculate shares
        const shareValue = amountValue / fund.nav;
        setShares(shareValue.toFixed(4));
      } else {
        setFees(0);
        setTotalAmount(0);
        setShares('');
      }
    } else {
      setFees(0);
      setTotalAmount(0);
      setShares('');
    }
  }, [amount, fund]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || parseFloat(amount) <= 0) {
      setError('请输入有效的申购金额');
      return;
    }
    
    if (parseFloat(amount) < (fund?.min_subscription || 1000)) {
      setError(`申购金额不能低于${fund?.min_subscription || 1000}元`);
      return;
    }
    
    if (!agreeTerms) {
      setError('请阅读并同意相关条款');
      return;
    }
    
    if (paymentMethod === 'balance' && parseFloat(amount) > availableBalance) {
      setError('可用余额不足');
      return;
    }
    
    try {
      setProcessing(true);
      setError(null);
      
      // Mock API call - replace with actual transaction
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log('Submit subscription:', {
        fundId,
        amount: parseFloat(amount),
        shares: parseFloat(shares),
        fees,
        totalAmount,
        paymentMethod,
      });
      
      // Navigate to success page
      setSuccess(true);
    } catch (err) {
      setError('申购失败，请稍后重试');
      console.error('Subscription error:', err);
    } finally {
      setProcessing(false);
    }
  };
  
  if (loading) {
    return <div className="container mx-auto px-4 py-8">加载中...</div>;
  }
  
  if (error && !success) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
        <Link href={`/funds/${fundId}`} className="text-blue-600 hover:underline">
          返回基金详情
        </Link>
      </div>
    );
  }
  
  if (!fund && !success) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          基金不存在
        </div>
        <Link href="/funds" className="text-blue-600 hover:underline">
          返回基金列表
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
            <h1 className="text-2xl font-bold text-gray-800">申购成功</h1>
            <p className="text-gray-600 mt-2">您的申购申请已提交，请耐心等待处理</p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">申购信息</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">基金名称</span>
                <span className="font-medium">{fund?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">申购金额</span>
                <span className="font-medium text-green-600">¥{amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">手续费</span>
                <span className="font-medium">¥{fees.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="text-gray-500 font-medium">合计金额</span>
                <span className="font-bold">¥{totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link 
              href={`/funds/${fundId}`}
              className="flex-1 px-6 py-3 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors text-center"
            >
              查看基金详情
            </Link>
            <Link 
              href="/user/transactions"
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-center"
            >
              查看交易记录
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Link 
        href={`/funds/${fundId}`} 
        className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6"
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        返回基金详情
      </Link>
      
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">申购 {fund?.name}</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Fund Info */}
          <div className="md:col-span-1">
            <div className="bg-gray-50 rounded-lg p-5 mb-5">
              <h2 className="text-lg font-semibold mb-3 text-gray-800">基金信息</h2>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-gray-500">基金名称</p>
                  <p className="font-medium">{fund?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">最新净值</p>
                  <p className="font-medium">¥{fund?.nav?.toFixed(4) || '0.0000'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">最低申购金额</p>
                  <p className="font-medium">¥{fund?.min_subscription || '1000'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">风险等级</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${fund?.risk_level === '高风险' ? 'bg-red-100 text-red-800' : fund?.risk_level === '中风险' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                    {fund?.risk_level || '中风险'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-5">
              <h2 className="text-lg font-semibold mb-3 text-gray-800">账户信息</h2>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-gray-500">可用余额</p>
                  <p className="font-medium text-green-600">¥{availableBalance.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Subscription Form */}
          <div className="md:col-span-2">
            <form onSubmit={handleSubmit}>
              <div className="space-y-5">
                {/* Amount Input */}
                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                    申购金额 (元)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                      ¥
                    </span>
                    <input
                      type="number"
                      id="amount"
                      min={fund?.min_subscription || 1000}
                      step="100"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={`请输入申购金额，最低${fund?.min_subscription || 1000}元`}
                    />
                  </div>
                </div>
                
                {/* Calculated Shares */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    预计申购份额 (份)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={shares}
                      readOnly
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none"
                    />
                  </div>
                </div>
                
                {/* Payment Method */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    支付方式
                  </label>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex items-center p-3 border border-gray-200 rounded-lg hover:border-blue-500 cursor-pointer transition-colors">
                      <input
                        type="radio"
                        id="balance"
                        name="paymentMethod"
                        value="balance"
                        checked={paymentMethod === 'balance'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <label htmlFor="balance" className="ml-3 text-sm font-medium text-gray-700 cursor-pointer">
                        账户余额支付
                      </label>
                      <span className="ml-auto text-sm text-gray-500">可用: ¥{availableBalance.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center p-3 border border-gray-200 rounded-lg hover:border-blue-500 cursor-pointer transition-colors">
                      <input
                        type="radio"
                        id="bankCard"
                        name="paymentMethod"
                        value="bankCard"
                        checked={paymentMethod === 'bankCard'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <label htmlFor="bankCard" className="ml-3 text-sm font-medium text-gray-700 cursor-pointer">
                        银行卡支付
                      </label>
                    </div>
                  </div>
                </div>
                
                {/* Bank Card Selection (if bankCard is selected) */}
                {paymentMethod === 'bankCard' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      选择银行卡
                    </label>
                    <div className="grid grid-cols-1 gap-3">
                      <div className="flex items-center p-3 border border-gray-200 rounded-lg hover:border-blue-500 cursor-pointer transition-colors">
                        <input
                          type="radio"
                          id="card1"
                          name="bankCard"
                          value="card1"
                          checked={true}
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <label htmlFor="card1" className="ml-3 text-sm font-medium text-gray-700 cursor-pointer flex-1">
                          <div>
                            <div className="flex justify-between">
                              <span>中国工商银行</span>
                              <span>储蓄卡</span>
                            </div>
                            <div className="text-gray-500 text-xs mt-1">**** **** **** 1234</div>
                          </div>
                        </label>
                      </div>
                      <div className="flex items-center p-3 border border-gray-200 rounded-lg hover:border-blue-500 cursor-pointer transition-colors">
                        <input
                          type="radio"
                          id="card2"
                          name="bankCard"
                          value="card2"
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <label htmlFor="card2" className="ml-3 text-sm font-medium text-gray-700 cursor-pointer flex-1">
                          <div>
                            <div className="flex justify-between">
                              <span>中国建设银行</span>
                              <span>储蓄卡</span>
                            </div>
                            <div className="text-gray-500 text-xs mt-1">**** **** **** 5678</div>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Transaction Password */}
                <div>
                  <label htmlFor="transactionPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    交易密码
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      id="transactionPassword"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="请输入交易密码"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">交易密码用于保护您的交易安全</p>
                </div>
                
                {/* Fees and Total */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">申购金额</span>
                      <span className="font-medium">¥{amount || '0.00'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">申购费率</span>
                      <span className="font-medium">0.15%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">手续费</span>
                      <span className="font-medium">¥{fees.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t">
                      <span className="text-sm font-semibold text-gray-700">应支付金额</span>
                      <span className="text-lg font-bold">¥{totalAmount.toFixed(2)}</span>
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
                      <Link href="#" className="text-blue-600 hover:underline ml-1">《基金合同》</Link>
                      和
                      <Link href="#" className="text-blue-600 hover:underline ml-1">《风险揭示书》</Link>
                    </label>
                  </div>
                </div>
                
                {/* Submit Button */}
                <div>
                  <button
                    type="submit"
                    disabled={processing}
                    className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${processing ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                  >
                    {processing ? '处理中...' : '确认申购'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}