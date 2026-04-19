'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface FundInfo {
  id: string;
  name: string;
  nav: number;
  min_redemption: number;
  risk_level: string;
}

interface UserPosition {
  id: string;
  units: number;
  purchase_price: number;
  current_value: number;
}

interface BankCard {
  id: string;
  bankName: string;
  cardNumber: string;
  isDefault: boolean;
}

export default function FundRedeem() {
  const params = useParams();
  const router = useRouter();
  const fundId = params.fundId as string;
  
  const [fund, setFund] = useState<FundInfo | null>(null);
  const [position, setPosition] = useState<UserPosition | null>(null);
  const [bankCards, setBankCards] = useState<BankCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [shares, setShares] = useState('');
  const [amount, setAmount] = useState('');
  const [redeemType, setRedeemType] = useState('shares'); // 'shares' or 'amount'
  const [paymentAccount, setPaymentAccount] = useState('default');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [transactionPassword, setTransactionPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Calculated values
  const [fees, setFees] = useState(0);
  const [netAmount, setNetAmount] = useState(0);
  
  useEffect(() => {
    const fetchFundDetails = async () => {
      try {
        setLoading(true);
        
        // Mock fund data - replace with actual API call
        const mockFund: FundInfo = {
          id: fundId,
          name: '嘉实沪深300ETF联接A',
          nav: 1.3245,
          min_redemption: 1000,
          risk_level: '中风险'
        };
        
        setFund(mockFund);
        
        // Mock user position
        const mockPosition: UserPosition = {
          id: '1',
          units: 12000,
          purchase_price: 1.25,
          current_value: 1.32,
        };
        
        setPosition(mockPosition);
        
        // Mock bank cards
        const mockBankCards: BankCard[] = [
          {
            id: '1',
            bankName: '中国工商银行',
            cardNumber: '**** **** **** 1234',
            isDefault: true
          },
          {
            id: '2',
            bankName: '中国建设银行',
            cardNumber: '**** **** **** 5678',
            isDefault: false
          }
        ];
        
        setBankCards(mockBankCards);
      } catch (err) {
        setError('获取基金信息失败');
        console.error('Error fetching fund details:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchFundDetails();
  }, [fundId]);
  
  // Calculate amount and fees when shares or redeemType changes
  useEffect(() => {
    if (fund && position) {
      let calculatedShares = parseFloat(shares) || 0;
      let calculatedAmount = parseFloat(amount) || 0;
      
      if (redeemType === 'shares' && calculatedShares > 0) {
        // Calculate amount from shares
        calculatedAmount = calculatedShares * fund.nav;
        setAmount(calculatedAmount.toFixed(2));
      } else if (redeemType === 'amount' && calculatedAmount > 0) {
        // Calculate shares from amount
        calculatedShares = calculatedAmount / fund.nav;
        setShares(calculatedShares.toFixed(4));
      }
      
      // Calculate fees (mock logic: 0.5% of amount for redemption)
      const redemptionFee = calculatedAmount * 0.005;
      setFees(redemptionFee);
      setNetAmount(calculatedAmount - redemptionFee);
    } else {
      setFees(0);
      setNetAmount(0);
    }
  }, [shares, amount, redeemType, fund, position]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const redeemShares = parseFloat(shares);
    const redeemAmount = parseFloat(amount);
    
    if ((redeemType === 'shares' && (isNaN(redeemShares) || redeemShares <= 0)) ||
        (redeemType === 'amount' && (isNaN(redeemAmount) || redeemAmount <= 0))) {
      setError('请输入有效的赎回数量或金额');
      return;
    }
    
    if (position && redeemShares > position.units) {
      setError('赎回份额不能超过持有份额');
      return;
    }
    
    if (fund && redeemAmount < (fund.min_redemption || 1000)) {
      setError(`赎回金额不能低于${fund.min_redemption || 1000}元`);
      return;
    }
    
    if (!agreeTerms) {
      setError('请阅读并同意相关条款');
      return;
    }
    
    if (!transactionPassword) {
      setError('请输入交易密码');
      return;
    }
    
    try {
      setProcessing(true);
      setError(null);
      
      // Mock API call - replace with actual transaction
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log('Submit redemption:', {
        fundId,
        shares: redeemShares,
        amount: redeemAmount,
        fees,
        netAmount,
        redeemType,
        paymentAccount,
        transactionPassword
      });
      
      // Navigate to success page
      setSuccess(true);
    } catch (err) {
      setError('赎回失败，请稍后重试');
      console.error('Redemption error:', err);
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
  
  if (!position && !success) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <div className="text-gray-400 mb-4">📊</div>
            <h1 className="text-xl font-bold text-gray-800 mb-2">暂无持仓</h1>
            <p className="text-gray-600 mb-6">您还未持有该基金</p>
            <Link 
              href={`/funds/${fundId}`}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              查看基金详情
            </Link>
          </div>
        </div>
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
            <h1 className="text-2xl font-bold text-gray-800">赎回成功</h1>
            <p className="text-gray-600 mt-2">您的赎回申请已提交，请耐心等待处理</p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">赎回信息</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">基金名称</span>
                <span className="font-medium">{fund?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">赎回份额</span>
                <span className="font-medium text-red-600">{shares}份</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">赎回金额</span>
                <span className="font-medium">¥{amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">赎回费率</span>
                <span className="font-medium">0.5%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">手续费</span>
                <span className="font-medium">¥{fees.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="text-gray-500 font-medium">预计到账金额</span>
                <span className="font-bold">¥{netAmount.toFixed(2)}</span>
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
        <h1 className="text-2xl font-bold text-gray-800 mb-6">赎回 {fund?.name}</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Fund and Position Info */}
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
                  <p className="text-sm text-gray-500">最低赎回金额</p>
                  <p className="font-medium">¥{fund?.min_redemption || '1000'}</p>
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
              <h2 className="text-lg font-semibold mb-3 text-gray-800">持仓信息</h2>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-gray-500">持有份额</p>
                  <p className="font-medium">{position?.units.toFixed(4)}份</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">持仓成本</p>
                  <p className="font-medium">¥{position?.purchase_price.toFixed(4)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">当前市值</p>
                  <p className="font-medium">¥{((position?.units || 0) * (fund?.nav || 0)).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">浮动盈亏</p>
                  <p className={`font-medium ${((position?.units || 0) * (fund?.nav || 0) - (position?.units || 0) * (position?.purchase_price || 0)) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ¥{((position?.units || 0) * (fund?.nav || 0) - (position?.units || 0) * (position?.purchase_price || 0)).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Redemption Form */}
          <div className="md:col-span-2">
            <form onSubmit={handleSubmit}>
              <div className="space-y-5">
                {/* Redeem Type Switch */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    赎回方式
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div 
                      className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${redeemType === 'shares' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-500'}`}
                      onClick={() => setRedeemType('shares')}
                    >
                      <input
                        type="radio"
                        id="shares"
                        name="redeemType"
                        value="shares"
                        checked={redeemType === 'shares'}
                        onChange={() => setRedeemType('shares')}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <label htmlFor="shares" className="ml-3 text-sm font-medium text-gray-700 cursor-pointer">
                        按份额赎回
                      </label>
                    </div>
                    <div 
                      className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${redeemType === 'amount' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-500'}`}
                      onClick={() => setRedeemType('amount')}
                    >
                      <input
                        type="radio"
                        id="amountType"
                        name="redeemType"
                        value="amount"
                        checked={redeemType === 'amount'}
                        onChange={() => setRedeemType('amount')}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <label htmlFor="amountType" className="ml-3 text-sm font-medium text-gray-700 cursor-pointer">
                        按金额赎回
                      </label>
                    </div>
                  </div>
                </div>
                
                {/* Redeem Amount/Shares Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {redeemType === 'shares' ? '赎回份额 (份)' : '赎回金额 (元)'}
                  </label>
                  <div className="relative">
                    {redeemType === 'amount' && (
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                        ¥
                      </span>
                    )}
                    <input
                      type="number"
                      id={redeemType}
                      value={redeemType === 'shares' ? shares : amount}
                      onChange={(e) => {
                        if (redeemType === 'shares') {
                          setShares(e.target.value);
                        } else {
                          setAmount(e.target.value);
                        }
                      }}
                      className={`w-full ${redeemType === 'amount' ? 'pl-8' : 'pl-4'} pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      placeholder={redeemType === 'shares' ? `请输入赎回份额，最低${fund?.min_redemption || 1000 / (fund?.nav || 1)}份` : `请输入赎回金额，最低${fund?.min_redemption || 1000}元`}
                      step={redeemType === 'shares' ? '1' : '100'}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    您最多可赎回 {position?.units.toFixed(4)} 份
                  </p>
                </div>
                
                {/* Payment Account */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    到账账户
                  </label>
                  <div className="grid grid-cols-1 gap-3">
                    {bankCards.map((card) => (
                      <div 
                        key={card.id}
                        className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${paymentAccount === card.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-500'}`}
                        onClick={() => setPaymentAccount(card.id)}
                      >
                        <input
                          type="radio"
                          id={`card-${card.id}`}
                          name="paymentAccount"
                          value={card.id}
                          checked={paymentAccount === card.id}
                          onChange={(e) => setPaymentAccount(e.target.value)}
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <div className="ml-3">
                          <label htmlFor={`card-${card.id}`} className="text-sm font-medium text-gray-700 cursor-pointer">
                            {card.bankName}
                          </label>
                          <p className="text-xs text-gray-500">{card.cardNumber}</p>
                          {card.isDefault && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-1">
                              默认
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Transaction Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    交易密码
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="transactionPassword"
                      value={transactionPassword}
                      onChange={(e) => setTransactionPassword(e.target.value)}
                      className="w-full pl-4 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="请输入6位交易密码"
                      maxLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878a3 3 0 104.243 4.243m0 0l4.243-4.243m-4.242 4.242L5.636 5.636" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    请输入您的6位数字交易密码
                  </p>
                </div>
                
                {/* Fees and Net Amount */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">赎回金额</span>
                      <span className="font-medium">¥{amount || '0.00'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">赎回费率</span>
                      <span className="font-medium">0.5%</span>
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
                    className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${processing ? 'bg-blue-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 text-white'}`}
                  >
                    {processing ? '处理中...' : '确认赎回'}
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