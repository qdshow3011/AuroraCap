import { useState, useEffect } from 'react'
import { View, Text, Pressable, SafeAreaView, StyleSheet } from 'react-native'
import PortfolioScreen from './src/screens/PortfolioScreen'
import InsiderDetail from './src/screens/InsiderDetail'
import InsiderList from './src/screens/InsiderList'
import InsiderNewsScreen from './src/screens/InsiderNewsScreen'
import ProfileScreen from './src/screens/ProfileScreen'
import TradesScreen from './src/screens/TradesScreen'
import AuthScreen from './src/screens/AuthScreen'
import SplashScreen from './src/screens/SplashScreen'
import ProductsScreen from './src/screens/ProductsScreen'
import AccountInfoScreen from './src/screens/AccountInfoScreen'
import ProductDetail from './src/screens/ProductDetail'
import AssetStatusScreen from './src/screens/AssetStatusScreen'
import SubscriptionApplicationScreen from './src/screens/SubscriptionApplicationScreen'
import SubscriptionSuccessScreen from './src/screens/SubscriptionSuccessScreen'
import RedemptionApplicationScreen from './src/screens/RedemptionApplicationScreen'
import RedemptionSuccessScreen from './src/screens/RedemptionSuccessScreen'
import DepositServiceScreen from './src/screens/DepositServiceScreen'
import CustomerServiceScreen from './src/screens/CustomerServiceScreen'
import WithdrawalApplicationScreen from './src/screens/WithdrawalApplicationScreen'
import WithdrawalSuccessScreen from './src/screens/WithdrawalSuccessScreen'
import HoldingsScreen from './src/screens/HoldingsScreen'
import FundTransactionsScreen from './src/screens/FundTransactionsScreen'
import SubscriptionRedemptionRecordsScreen from './src/screens/SubscriptionRedemptionRecordsScreen'
import ContractSigningScreen from './src/screens/ContractSigningScreen'
import ContractDetailScreen from './src/screens/ContractDetailScreen'
import MySubscriptionRecordsScreen from './src/screens/MySubscriptionRecordsScreen'
import MyRedemptionRecordsScreen from './src/screens/MyRedemptionRecordsScreen'
import MessageCenterScreen from './src/screens/MessageCenterScreen'
import AvatarEditScreen from './src/screens/AvatarEditScreen'
import SupabaseTest from './src/components/SupabaseTest'
import { supabase } from './src/lib/supabase'

export default function App() {
  const [isDemo, setIsDemo] = useState(false)
  const [authed, setAuthed] = useState(false)
  const [showAuth, setShowAuth] = useState<null | 'login' | 'register'>(null)
  const [tab, setTab] = useState<'home' | 'products' | 'trades' | 'insider' | 'profile'>('home')
  const [lang, setLang] = useState<'zh' | 'en'>('zh')
  const [userInfo, setUserInfo] = useState<any>(null)
  const [showAccountInfo, setShowAccountInfo] = useState(false)
  const [selectedInsiderArticle, setSelectedInsiderArticle] = useState<any>(null)
  const [showInsiderDetail, setShowInsiderDetail] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [showProductDetail, setShowProductDetail] = useState(false)
  const [showAssetStatus, setShowAssetStatus] = useState(false)
  const [showSubscriptionApplication, setShowSubscriptionApplication] = useState(false)
  const [showSubscriptionSuccess, setShowSubscriptionSuccess] = useState(false)
  const [subscriptionProduct, setSubscriptionProduct] = useState<any>(null)
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null)
  const [showRedemptionApplication, setShowRedemptionApplication] = useState(false)
  const [showRedemptionSuccess, setShowRedemptionSuccess] = useState(false)
  const [redemptionId, setRedemptionId] = useState<string | null>(null)
  const [redemptionProduct, setRedemptionProduct] = useState<any>(null)
  const [observerHoldings, setObserverHoldings] = useState<any[]>([])
  const [showDepositService, setShowDepositService] = useState(false)
  const [showCustomerService, setShowCustomerService] = useState(false)
  const [showWithdrawalApplication, setShowWithdrawalApplication] = useState(false)
  const [showWithdrawalSuccess, setShowWithdrawalSuccess] = useState(false)
  const [withdrawalId, setWithdrawalId] = useState<string | null>(null)
  const [showHoldings, setShowHoldings] = useState(false)
  const [showFundTransactions, setShowFundTransactions] = useState(false)
  const [showSubscriptionRedemptionRecords, setShowSubscriptionRedemptionRecords] = useState(false)
  // 合同签订相关状态
  const [showContractSigning, setShowContractSigning] = useState(false)
  const [showContractDetail, setShowContractDetail] = useState(false)
  const [consultationType, setConsultationType] = useState<'deposit' | 'normal' | undefined>(undefined)
  const [selectedContract, setSelectedContract] = useState<any>(null)
  // 申购记录相关状态
  const [showMySubscriptionRecords, setShowMySubscriptionRecords] = useState(false)
  // 赎回记录相关状态
  const [showMyRedemptionRecords, setShowMyRedemptionRecords] = useState(false)
  // 消息中心相关状态
  const [showMessageCenter, setShowMessageCenter] = useState(false)
  const [messageCenterCategory, setMessageCenterCategory] = useState<'all' | 'system' | 'investment'>('all')
  const [unreadMessages, setUnreadMessages] = useState(0)
  // 头像编辑相关状态
  const [showAvatarEdit, setShowAvatarEdit] = useState(false)
  const demoUnlocked = isDemo
  
  // 语言翻译
  const t = lang === 'zh' ? {
    home: '首页',
    products: '资管',
    trades: '交易',
    insider: '内参',
    profile: '我的'
  } : {
    home: 'Home',
    products: 'Asset Mgmt',
    trades: 'Trades',
    insider: 'Insider',
    profile: 'Profile'
  }
  

  // 获取未读消息数量
  const fetchUnreadMessagesCount = async () => {
    try {
      if (!authed || !userInfo?.id || !supabase) {
        return;
      }

      // 获取用户的系统消息
      const { data: messagesData, error: messagesError } = await supabase
        .from('system_messages')
        .select('*')
        .or(`audience_type.eq.all,user_id.eq.${userInfo.id}`);

      if (messagesError) {
        console.error('获取消息列表失败:', messagesError);
        return;
      }

      // 获取已读状态
      const { data: statusData, error: statusError } = await supabase
        .from('system_messages_status')
        .select('message_id, is_read')
        .eq('user_id', userInfo.id)
        .eq('is_read', true);

      if (statusError) {
        console.error('获取消息状态失败:', statusError);
        return;
      }

      // 计算未读消息数量
      const readMessageIds = new Set(statusData?.map(item => item.message_id) || []);
      const unreadCount = (messagesData || []).filter(msg => !readMessageIds.has(msg.id)).length;
      
      setUnreadMessages(unreadCount);
    } catch (error) {
      console.error('获取未读消息数量失败:', error);
    }
  };

  // 获取当前用户信息
  const fetchUserInfo = async () => {
    try {
      // 确保isDemo设置为false
      setIsDemo(false);
      
      // 已经通过登录界面认证，保持authed为true
      if (!authed || !userInfo?.id) {
        return;
      }
      
      // 直接从users表获取用户详细信息
      if (supabase) {
        try {
          const { data: clientData, error: clientError } = await supabase
            .from('users')
            .select('*')
            .eq('id', userInfo.id)
            .single();
          
          if (clientError) {
            console.error('获取客户信息失败:', clientError);
            // 使用基本用户信息作为后备，但保持已认证状态
          } else {
            // 设置用户信息，确保包含role字段
            setUserInfo({
              id: clientData.id,
              nickname: clientData.nickname || '极光用户',
              clientId: clientData.client_id || 'J000000001',
              phone: clientData.phone_number || clientData.phone || '138****8888',
              email: clientData.email || 'user@example.com',
              avatar: clientData.avatar || 'https://picsum.photos/100/100',
              role: clientData.role || userInfo?.role || 'customer' // 保留原始role或使用默认值
            });
          }
          
          // 获取用户的持仓数据
          const { data: positionsData, error: positionsError } = await supabase
            .from('positions')
            .select(`
              *,
              products (
                id,
                product_number,
                name_cn,
                name_en,
                type
              )
            `)
            .eq('user_id', userInfo.id);
          
          if (positionsError) {
            console.error('获取持仓数据失败:', positionsError);
          } else {
            console.log('获取到持仓数据:', positionsData);
            setObserverHoldings(positionsData || []);
          }
          
          // 获取未读消息数量
          await fetchUnreadMessagesCount();
        } catch (error) {
          console.error('获取用户信息失败:', error);
          // 获取用户信息失败，但保持已认证状态
        }
      } else {
        // 没有数据库连接，但保持已认证状态
        console.log('没有数据库连接，但保持已认证状态');
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
      // 获取用户信息失败，不设置用户信息，但保持已认证状态
    }
  };

  // 应用启动时，确保未认证用户停留在登录界面
  useEffect(() => {
    // 重置认证状态
    setAuthed(false);
    setIsDemo(false);
    setUserInfo(null);
    console.log('应用启动 - 认证状态重置:', { authed: false, isDemo: false, isAuthenticated: false });
  }, []);

  // 监听认证状态变化，获取用户信息
  useEffect(() => {
    console.log('authed changed:', authed);
    console.log('userInfo when authed changed:', userInfo);
    if (authed) {
      fetchUserInfo();
    }
  }, [authed]);

  // 只有登录才能进入首页
  const isAuthenticated = authed;
  
  // 添加调试日志，跟踪认证状态
  console.log('认证状态检查:', { authed, isDemo, isAuthenticated, showAuth });
  
  // 如果未认证，显示登录或启动界面
  if (!isAuthenticated) {
    console.log('未认证，显示登录界面');
    if (!showAuth) {
      return (
        <SplashScreen lang={lang} onLangChange={setLang} onLogin={() => setShowAuth('login')} onRegister={() => setShowAuth('register')} />
      );
    } else {
      return (
        <AuthScreen lang={lang} setLang={setLang} onAuthed={(userInfo) => { 
          console.log('onAuthed called with userInfo:', userInfo);
          setAuthed(true);
          if (userInfo) {
            console.log('Setting userInfo:', userInfo);
            setUserInfo(userInfo);
          }
        }} initialTab={showAuth} onBack={() => { setShowAuth(null) }} />
      );
    }
  }
  
  console.log('已认证，显示主界面');

  
  // 以下内容只有认证用户才能看到
  
  // 如果显示内参详情页，覆盖整个界面
  if (showInsiderDetail && selectedInsiderArticle) {
    return (
      <InsiderDetail 
        article={selectedInsiderArticle} 
        lang={lang} 
        onClose={() => {
          setShowInsiderDetail(false)
          setSelectedInsiderArticle(null)
        }} 
      />
    );
  }

  // 如果显示产品详情页，覆盖整个界面
  if (showProductDetail && selectedProduct) {
    return (
      <ProductDetail 
        product={selectedProduct} 
        lang={lang} 
        onClose={() => {
          setShowProductDetail(false)
          setSelectedProduct(null)
        }} 
        onSubscribe={(product) => {
          setSubscriptionProduct(product);
          setShowSubscriptionApplication(true);
        }} 
      />
    );
  }
  
  // 如果显示资产状况页面，覆盖整个界面
  if (showAssetStatus) {
    console.log('Rendering AssetStatusScreen with userInfo:', userInfo);
    return (
      <AssetStatusScreen 
        lang={lang} 
        userInfo={userInfo} 
        onClose={() => setShowAssetStatus(false)} 
        onNavigateToCustomerService={() => {
          setShowAssetStatus(false);
          setShowCustomerService(true);
        }} 
        onNavigateToWithdrawalApplication={() => {
          setShowAssetStatus(false);
          setShowWithdrawalApplication(true);
        }} 
        onNavigateToFundTransactions={() => {
          setShowAssetStatus(false);
          setShowFundTransactions(true);
        }} 
      />
    );
  }
  
  // 如果显示成功页面，覆盖整个界面
  if (showSubscriptionSuccess) {
    return (
      <SubscriptionSuccessScreen 
        lang={lang} 
        userInfo={userInfo}
        subscriptionId={subscriptionId}
        onClose={() => {
          setShowSubscriptionSuccess(false)
          setSubscriptionId(null)
          setShowSubscriptionApplication(false)
          setSubscriptionProduct(null)
        }}
        onGoHome={() => {
          setShowSubscriptionSuccess(false)
          setSubscriptionId(null)
          setShowSubscriptionApplication(false)
          setSubscriptionProduct(null)
          setTab('home')
        }}
      />
    );
  }

  // 如果显示赎回成功页面，覆盖整个界面
  if (showRedemptionSuccess) {
    return (
      <RedemptionSuccessScreen 
        lang={lang} 
        userInfo={userInfo}
        redemptionId={redemptionId}
        onClose={() => {
          setShowRedemptionSuccess(false)
          setRedemptionId(null)
          setShowRedemptionApplication(false)
        }}
        onGoHome={() => {
          setShowRedemptionSuccess(false)
          setRedemptionId(null)
          setShowRedemptionApplication(false)
          setTab('home')
        }}
      />
    );
  }

  // 如果显示申购申请页面，覆盖整个界面
  if (showSubscriptionApplication) {
    return (
      <SubscriptionApplicationScreen 
        product={subscriptionProduct} 
        lang={lang} 
        userInfo={userInfo} 
        onClose={() => {
          setShowSubscriptionApplication(false)
          setSubscriptionProduct(null)
        }}
        onSuccess={(subscriptionId) => {
          setSubscriptionId(subscriptionId)
          setShowSubscriptionSuccess(true)
        }}
        onNavigateToRedemptionApplication={() => {
          setShowSubscriptionApplication(false)
          setSubscriptionProduct(null)
          setShowRedemptionApplication(true)
        }}
        onNavigateToSubscriptionRedemptionRecords={() => {
          setShowSubscriptionApplication(false)
          setSubscriptionProduct(null)
          setShowSubscriptionRedemptionRecords(true)
        }}
        onNavigateToContracts={() => {
          setShowSubscriptionApplication(false)
          setSubscriptionProduct(null)
          setShowContractSigning(true)
        }}
      />
    );
  }

  // 如果显示赎回申请页面，覆盖整个界面
  if (showRedemptionApplication) {
    return (
      <RedemptionApplicationScreen 
        lang={lang} 
        userInfo={userInfo} 
        observerHoldings={observerHoldings}
        product={redemptionProduct}
        onClose={() => {
          setShowRedemptionApplication(false)
          setRedemptionProduct(null)
        }}
        onSuccess={(redemptionId) => {
          setRedemptionId(redemptionId)
          setShowRedemptionSuccess(true)
        }}
        onNavigateToSubscriptionApplication={() => {
          setShowRedemptionApplication(false)
          setRedemptionProduct(null)
          setShowSubscriptionApplication(true)
        }}
        onNavigateToSubscriptionRedemptionRecords={() => {
          setShowRedemptionApplication(false)
          setRedemptionProduct(null)
          setShowSubscriptionRedemptionRecords(true)
        }}
        onNavigateToContracts={() => {
          setShowRedemptionApplication(false)
          setRedemptionProduct(null)
          setShowContractSigning(true)
        }}
      />
    );
  }
  
  // 如果显示账户信息页面
  if (showAccountInfo) {
    return (
      <AccountInfoScreen 
        onBack={() => setShowAccountInfo(false)} 
        userInfo={userInfo} 
        onUpdateUserInfo={(updatedInfo) => {
          setUserInfo(updatedInfo);
        }}
      />
    );
  }
  
  // 如果显示入金服务页面
  if (showDepositService) {
    return (
      <DepositServiceScreen 
        lang={lang} 
        onClose={() => setShowDepositService(false)} 
        onNavigateToCustomerService={() => setShowCustomerService(true)} 
      />
    );
  }
  
  // 如果显示客服页面
  if (showCustomerService) {
    return (
      <CustomerServiceScreen 
        lang={lang} 
        onClose={() => {
          setShowCustomerService(false);
          setConsultationType(undefined); // 重置咨询类型
        }} 
        userInfo={userInfo}
        consultationType={consultationType}
        onNavigateToDepositService={() => {
          setShowCustomerService(false);
          setShowDepositService(true);
        }}
      />
    );
  }
  
  // 如果显示出金申请页面
  if (showWithdrawalApplication) {
    return (
      <WithdrawalApplicationScreen 
        lang={lang} 
        onClose={() => setShowWithdrawalApplication(false)} 
        onSuccess={(withdrawalId) => {
          setWithdrawalId(withdrawalId);
          setShowWithdrawalSuccess(true);
        }} 
        userInfo={userInfo}
        onNavigateToCustomerService={() => {
          setShowWithdrawalApplication(false);
          setShowCustomerService(true);
        }}
        onNavigateToAssetStatus={() => {
          setShowWithdrawalApplication(false);
          setShowAssetStatus(true);
        }}
        onNavigateToFundTransactions={() => {
          setShowWithdrawalApplication(false);
          setShowFundTransactions(true);
        }}
      />
    );
  }
  
  // 如果显示出金成功页面
  if (showWithdrawalSuccess) {
    return (
      <WithdrawalSuccessScreen 
        lang={lang} 
        onClose={() => {
          setShowWithdrawalSuccess(false);
          setWithdrawalId(null);
          setShowWithdrawalApplication(false);
        }} 
        onGoHome={() => {
          setShowWithdrawalSuccess(false);
          setWithdrawalId(null);
          setShowWithdrawalApplication(false);
          setTab('home');
        }} 
        withdrawalId={withdrawalId}
        userInfo={userInfo}
      />
    );
  }
  
  // 如果显示持仓状况页面
  if (showHoldings) {
    return (
      <HoldingsScreen 
        lang={lang} 
        onClose={() => setShowHoldings(false)} 
        onNavigateToCustomerService={() => {
          setShowHoldings(false);
          setShowCustomerService(true);
        }} 
        onNavigateToWithdrawalApplication={() => {
          setShowHoldings(false);
          setShowWithdrawalApplication(true);
        }} 
        onNavigateToAssetStatus={() => {
          setShowHoldings(false);
          setShowAssetStatus(true);
        }} 
        userInfo={userInfo}
      />
    );
  }
  
  // 如果显示资金往来页面
  if (showFundTransactions) {
    return (
      <FundTransactionsScreen 
        lang={lang} 
        userInfo={userInfo}
        onClose={() => setShowFundTransactions(false)}
        onNavigateToAssetStatus={() => {
          setShowFundTransactions(false);
          setShowAssetStatus(true);
        }}
        onNavigateToDepositService={() => {
          setShowFundTransactions(false);
          setShowDepositService(true);
        }}
        onNavigateToWithdrawalApplication={() => {
          setShowFundTransactions(false);
          setShowWithdrawalApplication(true);
        }}
      />
    );
  }
  
  // 如果显示申赎记录页面
  if (showSubscriptionRedemptionRecords) {
    return (
      <SubscriptionRedemptionRecordsScreen 
        lang={lang} 
        userInfo={userInfo}
        onClose={() => setShowSubscriptionRedemptionRecords(false)}
        onNavigateToSubscriptionApplication={() => {
          setShowSubscriptionRedemptionRecords(false);
          setShowSubscriptionApplication(true);
        }}
        onNavigateToRedemptionApplication={(product) => {
          setShowSubscriptionRedemptionRecords(false);
          setRedemptionProduct(product);
          setShowRedemptionApplication(true);
        }}
        onNavigateToContracts={() => {
          setShowSubscriptionRedemptionRecords(false);
          setShowContractSigning(true);
        }}
      />
    );
  }

  // 如果显示合同签订页面
  if (showContractSigning) {
    return (
      <ContractSigningScreen 
        lang={lang} 
        userInfo={userInfo}
        onClose={() => setShowContractSigning(false)}
        onNavigateToSubscriptionApplication={() => {
          setShowContractSigning(false);
          setShowSubscriptionApplication(true);
        }}
        onNavigateToRedemptionApplication={(product) => {
          setShowContractSigning(false);
          setRedemptionProduct(product);
          setShowRedemptionApplication(true);
        }}
        onNavigateToSubscriptionRedemptionRecords={() => {
          setShowContractSigning(false);
          setShowSubscriptionRedemptionRecords(true);
        }}
        onNavigateToContractDetail={(contract) => {
          setSelectedContract(contract);
          setShowContractDetail(true);
        }}
      />
    );
  }

  // 如果显示合同详情页面
  if (showContractDetail && selectedContract) {
    return (
      <ContractDetailScreen 
        contract={selectedContract} 
        lang={lang} 
        userInfo={userInfo}
        onClose={() => {
          setShowContractDetail(false);
          setSelectedContract(null);
        }}
        onSignSuccess={(contractId) => {
          setShowContractDetail(false);
          setSelectedContract(null);
          // 可以添加刷新逻辑
        }}
      />
    );
  }

  // 如果显示我的申购记录页面
  if (showMySubscriptionRecords) {
    return (
      <MySubscriptionRecordsScreen 
        lang={lang} 
        userInfo={userInfo}
        onClose={() => setShowMySubscriptionRecords(false)}
        onNavigateToSubscriptionApplication={() => {
          setShowMySubscriptionRecords(false);
          setShowSubscriptionApplication(true);
        }}
        onNavigateToRedemptionApplication={(product) => {
          setShowMySubscriptionRecords(false);
          setRedemptionProduct(product);
          setShowRedemptionApplication(true);
        }}
        onNavigateToSubscriptionRedemptionRecords={() => {
          setShowMySubscriptionRecords(false);
          setShowSubscriptionRedemptionRecords(true);
        }}
        onNavigateToContractSigning={() => {
          setShowMySubscriptionRecords(false);
          setShowContractSigning(true);
        }}
      />
    );
  }

  // 如果显示我的赎回记录页面
  if (showMyRedemptionRecords) {
    return (
      <MyRedemptionRecordsScreen 
        lang={lang} 
        userInfo={userInfo}
        onClose={() => setShowMyRedemptionRecords(false)}
        onNavigateToSubscriptionApplication={() => {
          setShowMyRedemptionRecords(false);
          setShowSubscriptionApplication(true);
        }}
        onNavigateToRedemptionApplication={(product) => {
          setShowMyRedemptionRecords(false);
          setRedemptionProduct(product);
          setShowRedemptionApplication(true);
        }}
        onNavigateToSubscriptionRedemptionRecords={() => {
          setShowMyRedemptionRecords(false);
          setShowSubscriptionRedemptionRecords(true);
        }}
        onNavigateToContractSigning={() => {
          setShowMyRedemptionRecords(false);
          setShowContractSigning(true);
        }}
      />
    );
  }
  
  // 如果显示消息中心页面
  if (showMessageCenter) {
    return (
      <MessageCenterScreen 
        lang={lang} 
        userInfo={userInfo}
        onClose={() => setShowMessageCenter(false)}
        initialCategory={messageCenterCategory}
      />
    );
  }
  
  // 如果显示头像编辑页面
  if (showAvatarEdit) {
    return (
      <AvatarEditScreen 
        userInfo={userInfo}
        onClose={() => setShowAvatarEdit(false)}
        onAvatarUpdate={(newAvatar) => {
          // 更新用户信息中的头像
          setUserInfo(prev => ({
            ...prev,
            avatar: newAvatar
          }));
        }}
      />
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      {/* 主内容区域 */}
      <View style={styles.content}>
        {tab === 'home' && <PortfolioScreen demo={isDemo} lang={lang} userInfo={userInfo} unreadMessages={unreadMessages} onInsiderArticlePress={(article) => {
            setSelectedInsiderArticle(article)
            setShowInsiderDetail(true)
          }} onProductPress={(product) => {
            setSelectedProduct(product)
            setShowProductDetail(true)
          }} onNavigateTo={(screen) => {
            console.log(`Navigating to: ${screen}`);
            // 根据不同的屏幕名称处理导航
            switch(screen) {
              case 'products':
                setTab('products');
                break;
              case 'trades':
                setTab('trades');
                break;
              case 'profile':
                setTab('profile');
                break;
              case 'deposit-service':
                setShowDepositService(true);
                break;
              case 'customer-service':
                // 默认咨询类型
                setConsultationType('normal');
                setShowCustomerService(true);
                break;
              case 'deposit-consultation':
                // 入金咨询
                setConsultationType('deposit');
                setShowCustomerService(true);
                break;
              case 'message-center':
                setMessageCenterCategory('all');
                setShowMessageCenter(true);
                break;
              case 'withdrawal-application':
                setShowWithdrawalApplication(true);
                break;
              case 'assetStatus':
                setShowAssetStatus(true);
                break;
              case 'holdings':
                setShowHoldings(true);
                break;
              case 'fundTransactions':
                setShowFundTransactions(true);
                break;
              case 'subscriptionRedemptionRecords':
                setShowSubscriptionRedemptionRecords(true);
                break;
              // 其他屏幕可以在这里添加导航逻辑
              default:
                console.log(`Screen ${screen} not implemented yet`);
            }
          }} onNavigateToSubscriptionApplication={(product) => {
            setSubscriptionProduct(product);
            setShowSubscriptionApplication(true);
          }} onNavigateToRedemptionApplication={(product) => {
            setRedemptionProduct(product);
            setShowRedemptionApplication(true);
          }} />}
        {tab === 'products' && <ProductsScreen 
          demo={false} 
          lang={lang} 
          userInfo={userInfo} 
          onNavigateToAssetStatus={() => setShowAssetStatus(true)} 
          onNavigateToSubscriptionApplication={(product) => {
            setSubscriptionProduct(product);
            setShowSubscriptionApplication(true);
          }} 
          onNavigateToDepositService={() => setShowDepositService(true)} 
          onNavigateToCustomerService={() => setShowCustomerService(true)} 
          onNavigateToWithdrawalApplication={() => setShowWithdrawalApplication(true)} 
          onNavigateToFundTransactions={() => setShowFundTransactions(true)} 
        />}
        {tab === 'trades' && <TradesScreen 
          lang={lang} 
          userInfo={userInfo} 
          onNavigateToSubscriptionApplication={() => setShowSubscriptionApplication(true)} 
          onNavigateToRedemptionApplication={(product) => {
            setRedemptionProduct(product);
            setShowRedemptionApplication(true);
          }} 
          onNavigateToSubscriptionRedemptionRecords={() => setShowSubscriptionRedemptionRecords(true)} 
          onNavigateToContractSigning={() => setShowContractSigning(true)} 
          onNavigateToMySubscriptionRecords={() => setShowMySubscriptionRecords(true)} 
          onNavigateToMyRedemptionRecords={() => setShowMyRedemptionRecords(true)} 
        />}
        {tab === 'insider' && <InsiderNewsScreen demo={isDemo} lang={lang} />}
        {tab === 'profile' && (
          <ProfileScreen 
            isDemo={isDemo} 
            userInfo={userInfo} 
            onSwitchAccount={() => {
              setAuthed(false)
              setIsDemo(false)
              setShowAuth('login')
            }} 
            onLogout={() => {
              setAuthed(false)
              setIsDemo(false)
              setShowAuth(null) // 回到起始页
              setTab('home')
              setUserInfo(null) // 清除用户信息
            }} 
            onEditAccountInfo={() => setShowAccountInfo(true)}
            onNavigateToAvatarEdit={() => setShowAvatarEdit(true)}
            onNavigateToAssetStatus={() => setShowAssetStatus(true)} 
            onNavigateToFundTransactions={() => setShowFundTransactions(true)} 
            onNavigateToSubscriptionRedemptionRecords={() => setShowSubscriptionRedemptionRecords(true)} 
            onNavigateToCustomerService={() => setShowCustomerService(true)} 
            onNavigateToMessageCenter={(category) => {
              if (category) {
                setMessageCenterCategory(category);
              } else {
                setMessageCenterCategory('all');
              }
              setShowMessageCenter(true);
            }} 
            onNavigateToApplicationProcessing={() => alert('申请办理功能开发中')} 
            onNavigateToMyCustomers={() => alert('我的客户功能开发中')} 
            onNavigateToFunctionSettings={() => alert('功能设置功能开发中')} 
          />
        )}
      </View>
      
      {/* 底部导航栏 */}
      <View style={styles.bottomNav}>
        <Pressable 
          style={[styles.navItem, tab === 'home' && styles.activeNavItem]} 
          onPress={() => setTab('home')}
        >
          <Text style={[styles.navText, tab === 'home' && styles.activeNavText]}>{t.home}</Text>
        </Pressable>
        <Pressable 
          style={[styles.navItem, tab === 'products' && styles.activeNavItem]} 
          onPress={() => setTab('products')}
        >
          <Text style={[styles.navText, tab === 'products' && styles.activeNavText]}>{t.products}</Text>
        </Pressable>
        <Pressable 
          style={[styles.navItem, tab === 'trades' && styles.activeNavItem]} 
          onPress={() => setTab('trades')}
        >
          <Text style={[styles.navText, tab === 'trades' && styles.activeNavText]}>{t.trades}</Text>
        </Pressable>
        <Pressable 
          style={[styles.navItem, tab === 'insider' && styles.activeNavItem]} 
          onPress={() => setTab('insider')}
        >
          <Text style={[styles.navText, tab === 'insider' && styles.activeNavText]}>{t.insider}</Text>
        </Pressable>
        <Pressable 
          style={[styles.navItem, tab === 'profile' && styles.activeNavItem]} 
          onPress={() => setTab('profile')}
        >
          <Text style={[styles.navText, tab === 'profile' && styles.activeNavText]}>{t.profile}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5', // 淡浅灰色
  },
  content: {
    flex: 1,
    backgroundColor: '#f0f2f5', // 淡浅灰色
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#333', // 灰黑色底部导航
    borderTopWidth: 1,
    borderTopColor: '#222',
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3.84,
    elevation: 5,
  },
  navItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeNavItem: {
    borderTopWidth: 2,
    borderTopColor: '#4a90e2',
  },
  navText: {
    color: '#999',
    fontSize: 14,
    fontWeight: '500',
  },
  activeNavText: {
    color: '#4a90e2',
    fontWeight: '600',
  },
  // 添加顶部导航栏样式
  topNav: {
    backgroundColor: '#333', // 灰黑色顶部导航
    paddingHorizontal: 12, // 缩小左右缝隙
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  topNavTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  topNavButton: {
    padding: 8,
  },
  topNavButtonText: {
    color: '#4a90e2',
    fontSize: 16,
    fontWeight: '600',
  },
})
