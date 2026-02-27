import { useState, useEffect } from 'react'
import { View, Text, Pressable, StyleSheet, StatusBar, Platform } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import PortfolioScreen from './src/screens/PortfolioScreen'
import InsiderDetail from './src/screens/InsiderDetail'
import InsiderList from './src/screens/InsiderList'
import InsiderNewsScreen from './src/screens/InsiderNewsScreen'
import CreateInsiderScreen from './src/screens/CreateInsiderScreen'
import ConfigureAccountsScreen from './src/screens/ConfigureAccountsScreen'
import DraftBoxScreen from './src/screens/DraftBoxScreen'
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
import SystemSettingsScreen from './src/screens/SystemSettingsScreen'
import InterfaceSettingsScreen from './src/screens/InterfaceSettingsScreen'
import PersonalInfoSecurityScreen from './src/screens/PersonalInfoSecurityScreen'
import PersonalProfileScreen from './src/screens/PersonalProfileScreen'
import CareModeScreen from './src/screens/CareModeScreen'
import VersionSwitchScreen from './src/screens/VersionSwitchScreen'
import HelpScreen from './src/screens/HelpScreen'
import SecurityCenterScreen from './src/screens/SecurityCenterScreen'
import AboutUsScreen from './src/screens/AboutUsScreen'
import FeedbackScreen from './src/screens/FeedbackScreen'
import FundCompanyProductsScreen from './src/screens/FundCompanyProductsScreen'
import FundCompanyChatScreen from './src/screens/FundCompanyChatScreen'
import FundCompanyOfficialAccountScreen from './src/screens/FundCompanyOfficialAccountScreen'
import FundCompanyManagementScreen from './src/screens/FundCompanyManagementScreen'
import CustomerListScreen from './src/screens/CustomerListScreen'
import PartnerListScreen from './src/screens/PartnerListScreen'
import FundManagerListScreen from './src/screens/FundManagerListScreen'
import CustomerServiceListScreen from './src/screens/CustomerServiceListScreen'
import { supabase } from './src/lib/supabase'

// 主题色配置
const THEME = {
  primary: '#1A4EA2',
  primaryLight: '#2E6CD1',
  primaryDark: '#0F3A7A',
  secondary: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  background: '#F5F7FA',
  cardBg: '#FFFFFF',
  textPrimary: '#1A1A2E',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  border: '#E5E7EB',
  success: '#10B981',
  danger: '#EF4444',
  // 圆角规范
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999
  },
  // 阴影规范
  shadow: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 8
    }
  }
}

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
  // 系统设置相关状态
  const [showSystemSettings, setShowSystemSettings] = useState(false)
  const [showInterfaceSettings, setShowInterfaceSettings] = useState(false)
  const [showPersonalInfoSecurity, setShowPersonalInfoSecurity] = useState(false)
  const [showPersonalProfile, setShowPersonalProfile] = useState(false)
  const [showCareMode, setShowCareMode] = useState(false)
  // 版本切换相关状态
  const [appVersion, setAppVersion] = useState<'standard' | 'simple' | 'premium'>('standard')
  const [showVersionSwitch, setShowVersionSwitch] = useState(false)
  const [showCreateInsider, setShowCreateInsider] = useState(false)
  const [showConfigureAccounts, setShowConfigureAccounts] = useState(false)
  const [showDraftBox, setShowDraftBox] = useState(false)
  const [editingDraft, setEditingDraft] = useState<any>(null)
  // 帮助中心相关状态
  const [showHelpCenter, setShowHelpCenter] = useState(false)
  // 安全中心相关状态
  const [showSecurityCenter, setShowSecurityCenter] = useState(false)
  // 关于我们相关状态
  const [showAboutUs, setShowAboutUs] = useState(false)
  // 意见反馈相关状态
  const [showFeedback, setShowFeedback] = useState(false)
  // 基金公司相关状态
  const [showFundCompanyProducts, setShowFundCompanyProducts] = useState(false)
  const [showFundCompanyChat, setShowFundCompanyChat] = useState(false)
  const [showFundCompanyOfficialAccount, setShowFundCompanyOfficialAccount] = useState(false)
  const [showFundCompanyManagement, setShowFundCompanyManagement] = useState(false)
  const [showCustomerList, setShowCustomerList] = useState(false)
  const [showPartnerList, setShowPartnerList] = useState(false)
  const [showFundManagerList, setShowFundManagerList] = useState(false)
  const [showCustomerServiceList, setShowCustomerServiceList] = useState(false)
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

  }, []);

  // 监听认证状态变化，获取用户信息
  useEffect(() => {
    if (authed) {
      fetchUserInfo();
    }
  }, [authed]);

  // 只有登录才能进入首页
  const isAuthenticated = authed;
  
  // 添加调试日志，跟踪认证状态

  
  // 如果未认证，显示登录或启动界面
  if (!isAuthenticated) {

    if (!showAuth) {
      return (
        <SafeAreaProvider style={{ flex: 1 }}>
          <View style={{ flex: 1 }}>
            <SplashScreen lang={lang} onLangChange={setLang} onLogin={() => setShowAuth('login')} onRegister={() => setShowAuth('register')} />
          </View>
        </SafeAreaProvider>
      );
    } else {
      return (
        <AuthScreen lang={lang} setLang={setLang} onAuthed={(userInfo) => { 

          setAuthed(true);
          if (userInfo) {

            setUserInfo(userInfo);
          }
        }} initialTab={showAuth} onBack={() => { setShowAuth(null) }} />
      );
    }
  }
  


  
  // 以下内容只有认证用户才能看到
  
  // 如果显示内参详情页，覆盖整个界面
  if (showInsiderDetail && selectedInsiderArticle) {
    return (
      <SafeAreaProvider style={{ flex: 1 }}>
        <View style={{ flex: 1 }}>
          <InsiderDetail 
            article={selectedInsiderArticle} 
            lang={lang}
            onClose={() => {
              setShowInsiderDetail(false)
              setSelectedInsiderArticle(null)
            }} 
          />
        </View>
      </SafeAreaProvider>
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
    return (
      <SafeAreaProvider>
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
      </SafeAreaProvider>
    );
  }

  // 如果显示系统设置页面，覆盖整个界面
  if (showSystemSettings) {
    return (
      <SystemSettingsScreen 
        lang={lang} 
        onClose={() => setShowSystemSettings(false)}
        onLanguageChange={(newLang) => setLang(newLang)}
        onNavigateToFeedback={() => {
          setShowSystemSettings(false);
          setShowFeedback(true);
        }}
        onNavigateToSecurityCenter={() => {
          setShowSystemSettings(false);
          setShowSecurityCenter(true);
        }}
        onNavigateToHelpCenter={() => {
          setShowSystemSettings(false);
          setShowHelpCenter(true);
        }}
        onNavigateToAboutUs={() => {
          setShowSystemSettings(false);
          setShowAboutUs(true);
        }}
        userInfo={userInfo}
      />
    );
  }

  // 如果显示界面与显示页面，覆盖整个界面
  if (showInterfaceSettings) {
    return (
      <InterfaceSettingsScreen 
        lang={lang} 
        onClose={() => setShowInterfaceSettings(false)}
        onLanguageChange={(newLang) => setLang(newLang)}
      />
    );
  }

  // 如果显示个人信息与安全页面，覆盖整个界面
  if (showPersonalInfoSecurity) {
    return (
      <PersonalInfoSecurityScreen 
        lang={lang} 
        onClose={() => setShowPersonalInfoSecurity(false)}
        onNavigateToPersonalProfile={() => {
          setShowPersonalInfoSecurity(false);
          setShowPersonalProfile(true);
        }}
      />
    );
  }

  // 如果显示个人资料页面，覆盖整个界面
  if (showPersonalProfile) {
    return (
      <PersonalProfileScreen 
        lang={lang} 
        userInfo={userInfo} 
        onClose={() => setShowPersonalProfile(false)}
        onNavigateToAvatarEdit={() => {
          setShowPersonalProfile(false);
          setShowAvatarEdit(true);
        }}
      />
    );
  }

  // 如果显示关怀模式页面，覆盖整个界面
  if (showCareMode) {
    return (
      <CareModeScreen 
        lang={lang} 
        onClose={() => setShowCareMode(false)}
      />
    );
  }
  
  // 如果显示版本切换页面，覆盖整个界面
  if (showVersionSwitch) {
    return (
      <VersionSwitchScreen 
        lang={lang} 
        currentVersion={appVersion}
        onClose={() => setShowVersionSwitch(false)}
        onVersionChange={(version) => {
          setAppVersion(version);
          setShowVersionSwitch(false);
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
      <SafeAreaProvider>
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
      </SafeAreaProvider>
    );
  }

  // 如果显示赎回申请页面，覆盖整个界面
  if (showRedemptionApplication) {
    return (
      <SafeAreaProvider>
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
      </SafeAreaProvider>
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
      <SafeAreaProvider>
        <DepositServiceScreen 
          lang={lang} 
          onClose={() => setShowDepositService(false)} 
          onNavigateToCustomerService={() => setShowCustomerService(true)} 
        />
      </SafeAreaProvider>
    );
  }
  
  // 如果显示客服页面
  if (showCustomerService) {
    return (
      <SafeAreaProvider style={{ flex: 1 }}>
        <View style={{ flex: 1 }}>
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
        </View>
      </SafeAreaProvider>
    );
  }
  
  // 如果显示出金申请页面
  if (showWithdrawalApplication) {
    return (
      <SafeAreaProvider>
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
      </SafeAreaProvider>
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
      <SafeAreaProvider>
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
      </SafeAreaProvider>
    );
  }
  
  // 如果显示申赎记录页面
  if (showSubscriptionRedemptionRecords) {
    return (
      <SafeAreaProvider style={{ flex: 1 }}>
        <View style={{ flex: 1 }}>
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
        </View>
      </SafeAreaProvider>
    );
  }

  // 如果显示合同签订页面
  if (showContractSigning) {
    return (
      <SafeAreaProvider style={{ flex: 1 }}>
        <View style={{ flex: 1 }}>
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
        </View>
      </SafeAreaProvider>
    );
  }

  // 如果显示合同详情页面
  if (showContractDetail && selectedContract) {
    return (
      <SafeAreaProvider style={{ flex: 1 }}>
        <View style={{ flex: 1 }}>
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
        </View>
      </SafeAreaProvider>
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
      <SafeAreaProvider style={{ flex: 1 }}>
        <View style={{ flex: 1 }}>
          <MessageCenterScreen 
            lang={lang} 
            userInfo={userInfo}
            onClose={() => setShowMessageCenter(false)}
            initialCategory={messageCenterCategory}
          />
        </View>
      </SafeAreaProvider>
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
  
  // 如果显示撰写内参页面
  if (showCreateInsider) {
    return (
      <CreateInsiderScreen 
        lang={lang}
        userInfo={userInfo}
        draft={editingDraft}
        onClose={() => {
          setShowCreateInsider(false)
          setEditingDraft(null)
        }}
        onNavigateToDraftBox={() => {
          // 先设置显示草稿箱，再关闭撰写页面
          // 这样可以确保状态更新的顺序正确
          setShowDraftBox(true)
          setShowCreateInsider(false)
          setEditingDraft(null)
        }}
      />
    );
  }
  
  // 如果显示配置公众号页面
  if (showConfigureAccounts) {
    return (
      <ConfigureAccountsScreen 
        lang={lang}
        userInfo={userInfo}
        onClose={() => setShowConfigureAccounts(false)}
      />
    );
  }
  
  // 如果显示草稿箱页面
  if (showDraftBox) {
    return (
      <DraftBoxScreen 
        lang={lang}
        userInfo={userInfo}
        onClose={() => setShowDraftBox(false)}
        onEditDraft={(draft) => {

          setEditingDraft(draft);
          setShowDraftBox(false);
          setShowCreateInsider(true);
        }}
      />
    );
  }
  
  // 如果显示帮助中心页面
  if (showHelpCenter) {
    return (
      <HelpScreen 
        lang={lang}
        onBack={() => setShowHelpCenter(false)}
      />
    );
  }
  
  // 如果显示安全中心页面
  if (showSecurityCenter) {
    return (
      <SecurityCenterScreen 
        lang={lang}
        onBack={() => setShowSecurityCenter(false)}
      />
    );
  }
  
  // 如果显示关于我们页面
  if (showAboutUs) {
    return (
      <AboutUsScreen 
        lang={lang}
        onBack={() => setShowAboutUs(false)}
      />
    );
  }
  
  // 如果显示意见反馈页面
  if (showFeedback) {
    return (
      <FeedbackScreen 
        lang={lang}
        onClose={() => setShowFeedback(false)}
        userInfo={userInfo}
      />
    );
  }

  // 如果显示基金公司产品管理页面
  if (showFundCompanyProducts) {
    return (
      <SafeAreaProvider>
        <FundCompanyProductsScreen 
          lang={lang}
          userInfo={userInfo}
          onClose={() => setShowFundCompanyProducts(false)}
        />
      </SafeAreaProvider>
    );
  }

  // 如果显示基金公司客户对话页面
  if (showFundCompanyChat) {
    return (
      <SafeAreaProvider>
        <FundCompanyChatScreen 
          lang={lang}
          userInfo={userInfo}
          onClose={() => setShowFundCompanyChat(false)}
        />
      </SafeAreaProvider>
    );
  }

  // 如果显示基金公司公众号管理页面
  if (showFundCompanyOfficialAccount) {
    return (
      <SafeAreaProvider>
        <FundCompanyOfficialAccountScreen 
          lang={lang}
          userInfo={userInfo}
          onClose={() => setShowFundCompanyOfficialAccount(false)}
        />
      </SafeAreaProvider>
    );
  }

  // 如果显示基金公司管理页面
  if (showFundCompanyManagement) {
    return (
      <SafeAreaProvider>
        <FundCompanyManagementScreen 
          userInfo={userInfo}
          onBack={() => setShowFundCompanyManagement(false)}
        />
      </SafeAreaProvider>
    );
  }

  // 如果显示客户列表页面
  if (showCustomerList) {
    return (
      <SafeAreaProvider>
        <CustomerListScreen 
          userInfo={userInfo}
          onBack={() => setShowCustomerList(false)}
        />
      </SafeAreaProvider>
    );
  }

  // 如果显示合伙人列表页面
  if (showPartnerList) {
    return (
      <SafeAreaProvider>
        <PartnerListScreen 
          userInfo={userInfo}
          onBack={() => setShowPartnerList(false)}
        />
      </SafeAreaProvider>
    );
  }

  // 如果显示基金管理员列表页面
  if (showFundManagerList) {
    return (
      <SafeAreaProvider>
        <FundManagerListScreen 
          userInfo={userInfo}
          onBack={() => setShowFundManagerList(false)}
        />
      </SafeAreaProvider>
    );
  }

  // 如果显示客服列表页面
  if (showCustomerServiceList) {
    return (
      <SafeAreaProvider>
        <CustomerServiceListScreen 
          userInfo={userInfo}
          onBack={() => setShowCustomerServiceList(false)}
        />
      </SafeAreaProvider>
    );
  }
  
  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" translucent={true} backgroundColor="transparent" />
        {/* 主内容区域 */}
        <View style={styles.content}>
        {tab === 'home' && <PortfolioScreen demo={isDemo} lang={lang} userInfo={userInfo} unreadMessages={unreadMessages} appVersion={appVersion} onInsiderArticlePress={(article) => {
            setSelectedInsiderArticle(article)
            setShowInsiderDetail(true)
          }} onProductPress={(product) => {
            setSelectedProduct(product)
            setShowProductDetail(true)
          }} onNavigateTo={(screen) => {

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
              case 'version-switch':
                setShowVersionSwitch(true);
                break;
              case 'account-info':
                setShowAccountInfo(true);
                break;
              case 'interface-settings':
                setShowInterfaceSettings(true);
                break;
              case 'help':
                setShowHelpCenter(true);
                break;
              case 'about':
                setShowAboutUs(true);
                break;
              case 'feedback':
                setShowFeedback(true);
                break;
              // 其他屏幕可以在这里添加导航逻辑
              default:

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
          appVersion={appVersion}
          onNavigateToAssetStatus={() => setShowAssetStatus(true)} 
          onNavigateToSubscriptionApplication={(product) => {
            setSubscriptionProduct(product);
            setShowSubscriptionApplication(true);
          }} 
          onNavigateToDepositService={() => setShowDepositService(true)} 
          onNavigateToCustomerService={() => setShowCustomerService(true)} 
          onNavigateToWithdrawalApplication={() => setShowWithdrawalApplication(true)} 
          onNavigateToFundTransactions={() => setShowFundTransactions(true)} 
          onNavigateToVersionSwitch={() => setShowVersionSwitch(true)}
          onNavigateToMessageCenter={() => {
            setMessageCenterCategory('all');
            setShowMessageCenter(true);
          }}
        />}
        {tab === 'trades' && <TradesScreen 
          lang={lang} 
          userInfo={userInfo} 
          appVersion={appVersion}
          onNavigateToSubscriptionApplication={() => setShowSubscriptionApplication(true)} 
          onNavigateToRedemptionApplication={(product) => {
            setRedemptionProduct(product);
            setShowRedemptionApplication(true);
          }} 
          onNavigateToSubscriptionRedemptionRecords={() => setShowSubscriptionRedemptionRecords(true)} 
          onNavigateToContractSigning={() => setShowContractSigning(true)} 
          onNavigateToMySubscriptionRecords={() => setShowMySubscriptionRecords(true)} 
          onNavigateToMyRedemptionRecords={() => setShowMyRedemptionRecords(true)} 
          onNavigateToCustomerService={() => setShowCustomerService(true)} 
          onNavigateToMessageCenter={() => {
            setMessageCenterCategory('all');
            setShowMessageCenter(true);
          }}
          onNavigateToVersionSwitch={() => setShowVersionSwitch(true)}
        />}
        {tab === 'insider' && <InsiderNewsScreen demo={isDemo} lang={lang} appVersion={appVersion} onArticlePress={(article) => {
            setSelectedInsiderArticle(article)
            setShowInsiderDetail(true)
          }} onNavigateTo={(screen) => {

            // 根据不同的屏幕名称处理导航
            switch(screen) {
              case 'message-center':
                setMessageCenterCategory('all');
                setShowMessageCenter(true);
                break;
              case 'customer-service':
                setShowCustomerService(true);
                break;
              case 'version-switch':
                setShowVersionSwitch(true);
                break;
              case 'create-insider':
                setShowCreateInsider(true);
                break;
              case 'configure-accounts':
                setShowConfigureAccounts(true);
                break;
              case 'draft-box':
                setShowDraftBox(true);
                break;
              default:

            }
          }} />}
        {tab === 'profile' && (
          <ProfileScreen 
            isDemo={isDemo} 
            userInfo={userInfo} 
            appVersion={appVersion}
            onSwitchAccount={() => {
              setAuthed(false)
              setIsDemo(false)
              setShowAuth('login')
            }} 
            onLogout={() => {
              // 清除所有用户相关状态，实现无痕模式
              setAuthed(false)
              setIsDemo(false)
              setShowAuth(null) // 回到起始页
              setTab('home')
              setUserInfo(null) // 清除用户信息
              // 清除用户相关的界面状态
              setShowAccountInfo(false)
              setShowAssetStatus(false)
              setShowFundTransactions(false)
              setShowSubscriptionRedemptionRecords(false)
              setShowMessageCenter(false)
              setMessageCenterCategory('all')
              setUnreadMessages(0)
              setShowAvatarEdit(false)
              setShowSystemSettings(false)
              setShowInterfaceSettings(false)
              setShowPersonalInfoSecurity(false)
              setShowPersonalProfile(false)
              // 清除产品和内参相关状态
              setSelectedInsiderArticle(null)
              setShowInsiderDetail(false)
              setSelectedProduct(null)
              setShowProductDetail(false)
              setShowSubscriptionApplication(false)
              setShowSubscriptionSuccess(false)
              setSubscriptionProduct(null)
              setSubscriptionId(null)
              setShowRedemptionApplication(false)
              setShowRedemptionSuccess(false)
              setRedemptionId(null)
              setRedemptionProduct(null)
              setObserverHoldings([])
              setShowDepositService(false)
              setShowCustomerService(false)
              setShowWithdrawalApplication(false)
              setShowWithdrawalSuccess(false)
              setWithdrawalId(null)
              setShowHoldings(false)
              // 清除合同相关状态
              setShowContractSigning(false)
              setShowContractDetail(false)
              setConsultationType(undefined)
              setSelectedContract(null)
              setShowMySubscriptionRecords(false)
              setShowMyRedemptionRecords(false)
              // 清除其他界面状态
              setShowCareMode(false)
              setShowVersionSwitch(false)
              // 清除基金公司相关状态
              setShowFundCompanyProducts(false)
              setShowFundCompanyChat(false)
              setShowFundCompanyOfficialAccount(false)
              setShowFundCompanyManagement(false)
              setShowCustomerList(false)
              setShowPartnerList(false)
              setShowFundManagerList(false)
              setShowCustomerServiceList(false)

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
            onNavigateToMyCustomers={() => setShowCustomerList(true)}
            onNavigateToSystemSettings={() => setShowSystemSettings(true)}
            onNavigateToVersionSwitch={() => setShowVersionSwitch(true)}
            onNavigateToHelpCenter={() => setShowHelpCenter(true)}
            onNavigateToSecurityCenter={() => setShowSecurityCenter(true)}
            onNavigateToAboutUs={() => setShowAboutUs(true)}
            onNavigateToFundCompanyProducts={() => setShowFundCompanyProducts(true)}
            onNavigateToFundCompanyChat={() => setShowFundCompanyChat(true)}
            onNavigateToFundCompanyOfficialAccount={() => setShowFundCompanyOfficialAccount(true)}
            onNavigateToFundCompanyManagement={() => setShowFundCompanyManagement(true)}
            onNavigateToPartnerList={() => setShowPartnerList(true)}
            onNavigateToFundManagerList={() => setShowFundManagerList(true)}
            onNavigateToCustomerServiceList={() => setShowCustomerServiceList(true)}
          />
        )}
      </View>
      
      {/* 底部导航栏 */}
      <View style={styles.bottomNav}>
        <LinearGradient
          colors={['rgba(255,255,255,0)', THEME.cardBg]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.navContent}>
          <Pressable 
            style={[styles.navItem, tab === 'home' && styles.activeNavItem]} 
            onPress={() => setTab('home')}
          >
            <View style={[styles.navIconContainer, tab === 'home' && styles.activeNavIconContainer]}>
              <Ionicons 
                name={tab === 'home' ? 'home' : 'home-outline'} 
                size={22} 
                color={tab === 'home' ? THEME.primary : THEME.textMuted} 
              />
            </View>
            <Text style={[styles.navText, tab === 'home' && styles.activeNavText]}>{t.home}</Text>
            {tab === 'home' && <View style={styles.activeIndicator} />}
          </Pressable>
          <Pressable 
            style={[styles.navItem, tab === 'products' && styles.activeNavItem]} 
            onPress={() => setTab('products')}
          >
            <View style={[styles.navIconContainer, tab === 'products' && styles.activeNavIconContainer]}>
              <Ionicons 
                name={tab === 'products' ? 'briefcase' : 'briefcase-outline'} 
                size={22} 
                color={tab === 'products' ? THEME.primary : THEME.textMuted} 
              />
            </View>
            <Text style={[styles.navText, tab === 'products' && styles.activeNavText]}>{t.products}</Text>
            {tab === 'products' && <View style={styles.activeIndicator} />}
          </Pressable>
          <Pressable 
            style={[styles.navItem, tab === 'trades' && styles.activeNavItem]} 
            onPress={() => setTab('trades')}
          >
            <View style={[styles.navIconContainer, tab === 'trades' && styles.activeNavIconContainer]}>
              <Ionicons 
                name={tab === 'trades' ? 'swap-horizontal' : 'swap-horizontal-outline'} 
                size={22} 
                color={tab === 'trades' ? THEME.primary : THEME.textMuted} 
              />
            </View>
            <Text style={[styles.navText, tab === 'trades' && styles.activeNavText]}>{t.trades}</Text>
            {tab === 'trades' && <View style={styles.activeIndicator} />}
          </Pressable>
          <Pressable 
            style={[styles.navItem, tab === 'insider' && styles.activeNavItem]} 
            onPress={() => setTab('insider')}
          >
            <View style={[styles.navIconContainer, tab === 'insider' && styles.activeNavIconContainer]}>
              <Ionicons 
                name={tab === 'insider' ? 'newspaper' : 'newspaper-outline'} 
                size={22} 
                color={tab === 'insider' ? THEME.primary : THEME.textMuted} 
              />
            </View>
            <Text style={[styles.navText, tab === 'insider' && styles.activeNavText]}>{t.insider}</Text>
            {tab === 'insider' && <View style={styles.activeIndicator} />}
          </Pressable>
          <Pressable 
            style={[styles.navItem, tab === 'profile' && styles.activeNavItem]} 
            onPress={() => setTab('profile')}
          >
            <View style={[styles.navIconContainer, tab === 'profile' && styles.activeNavIconContainer]}>
              <Ionicons 
                name={tab === 'profile' ? 'person' : 'person-outline'} 
                size={22} 
                color={tab === 'profile' ? THEME.primary : THEME.textMuted} 
              />
            </View>
            <Text style={[styles.navText, tab === 'profile' && styles.activeNavText]}>{t.profile}</Text>
            {tab === 'profile' && <View style={styles.activeIndicator} />}
          </Pressable>
        </View>
      </View>
      </View>
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  content: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  bottomNav: {
    backgroundColor: THEME.cardBg,
    borderTopLeftRadius: THEME.radius.lg,
    borderTopRightRadius: THEME.radius.lg,
    ...THEME.shadow.lg,
    paddingBottom: Platform.OS === 'ios' ? 20 : 12,
    position: 'relative',
    overflow: 'hidden',
  },
  navContent: {
    flexDirection: 'row',
    paddingTop: 8,
    paddingHorizontal: 8,
  },
  navItem: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  navIconContainer: {
    width: 44,
    height: 44,
    borderRadius: THEME.radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  activeNavIconContainer: {
    backgroundColor: 'rgba(26, 78, 162, 0.1)',
  },
  activeNavItem: {
    // 选中状态的额外样式
  },
  navText: {
    color: THEME.textMuted,
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  activeNavText: {
    color: THEME.primary,
    fontWeight: '600',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 4,
    width: 20,
    height: 3,
    borderRadius: 2,
    backgroundColor: THEME.primary,
  },
  // 添加顶部导航栏样式
  topNav: {
    backgroundColor: '#333',
    paddingHorizontal: 12,
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
