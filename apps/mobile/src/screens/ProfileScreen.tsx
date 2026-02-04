import { View, Text, StyleSheet, Pressable, Image, ScrollView } from 'react-native'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function ProfileScreen({ userInfo, onSwitchAccount, onLogout, onEditAccountInfo, onNavigateToAvatarEdit, observerHoldings, observerTransactions, isDemo, onNavigateToAssetStatus, onNavigateToFundTransactions, onNavigateToSubscriptionRedemptionRecords, onNavigateToCustomerService, onNavigateToMessageCenter, onNavigateToApplicationProcessing, onNavigateToMyCustomers, onNavigateToFunctionSettings, onNavigateToSystemSettings, onNavigateToHelpCenter, onNavigateToSecurityCenter, onNavigateToAboutUs, appVersion = 'standard', onNavigateToVersionSwitch, lang = 'zh' }: { userInfo?: any; onSwitchAccount: () => void; onLogout: () => void; onEditAccountInfo: () => void; onNavigateToAvatarEdit?: () => void; observerHoldings?: any[]; observerTransactions?: any[]; isDemo?: boolean; onNavigateToAssetStatus?: () => void; onNavigateToFundTransactions?: () => void; onNavigateToSubscriptionRedemptionRecords?: () => void; onNavigateToCustomerService?: () => void; onNavigateToMessageCenter?: (category?: 'all' | 'system' | 'investment') => void; onNavigateToApplicationProcessing?: () => void; onNavigateToMyCustomers?: () => void; onNavigateToFunctionSettings?: () => void; onNavigateToSystemSettings?: () => void; onNavigateToHelpCenter?: () => void; onNavigateToSecurityCenter?: () => void; onNavigateToAboutUs?: () => void; appVersion?: 'standard' | 'simple' | 'premium'; onNavigateToVersionSwitch?: () => void; lang?: 'zh' | 'en' }) {
  // 获取角色显示名称
  const getRoleDisplayName = (role?: string) => {
    switch (role) {
      case 'customer':
        return '客户';
      case 'waiter':
        return '客服';
      case 'admin':
        return '管理员';
      case 'partner':
        return '合伙人';
      default:
        return '未知';
    }
  };
  
  // 根据版本调整样式
  const getVersionStyles = () => {
    switch (appVersion) {
      case 'simple':
        return {
          fontSize: {
            base: 18,
            large: 24,
            small: 16
          },
          fontWeight: {
            regular: '400',
            medium: '500',
            bold: '700'
          },
          padding: {
            base: 20,
            small: 16
          },
          borderRadius: 12,
          showSimplified: true
        };
      case 'premium':
        return {
          fontSize: {
            base: 16,
            large: 20,
            small: 14
          },
          fontWeight: {
            regular: '400',
            medium: '600',
            bold: '800'
          },
          padding: {
            base: 20,
            small: 16
          },
          borderRadius: 16,
          showPremium: true
        };
      default: // standard
        return {
          fontSize: {
            base: 15,
            large: 18,
            small: 13
          },
          fontWeight: {
            regular: '400',
            medium: '500',
            bold: '700'
          },
          padding: {
            base: 16,
            small: 12
          },
          borderRadius: 8,
          showAll: true
        };
    }
  };
  
  const versionStyles = getVersionStyles();
  
  // 版本差异化标题
  const getVersionTitle = () => {
    switch (appVersion) {
      case 'simple':
        return '我的';
      case 'premium':
        return '尊享中心';
      default:
        return '我的';
    }
  };
  
  // 用户数据
  const [userData, setUserData] = useState({
    avatar: 'https://picsum.photos/100/100',
    nickname: '极光用户',
    clientId: 'J000000001',
    accountInfo: '沪深A股',
    totalAssets: 'N/A',
    availableFunds: 'N/A',
    positionValue: 'N/A',
    profitLoss: 'N/A',
    profitLossRate: 'N/A',
    invitationCode: 'N/A'
  })



  // 获取邀请码
  useEffect(() => {
    const fetchInvitationCode = async () => {
      if (!userInfo || !userInfo.id || !supabase) return;

      try {
        // 获取邀请码
        const { data: client, error: clientError } = await supabase
          .from('users')
          .select('invite_code')
          .eq('id', userInfo.id)
          .single();

        if (!clientError && client) {
          setUserData(prev => ({
            ...prev,
            invitationCode: client.invite_code || 'N/A'
          }));
        }
      } catch (error) {
        console.error('获取邀请码失败:', error);
      }
    };

    fetchInvitationCode();
  }, [userInfo, supabase]);

  // 更新用户数据
  useEffect(() => {
    const fetchUserDetails = async () => {
      if (userInfo && userInfo.id) {
        try {
          // 立即更新头像为userInfo中的最新值，提供即时反馈
          setUserData(prev => ({
            ...prev,
            avatar: userInfo.avatar || prev.avatar || 'https://picsum.photos/100/100'
          }));
          
          // 从users表获取完整用户信息
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userInfo.id)
            .single();

          if (error) {
            console.error('获取用户详情失败:', error);
            // 如果获取失败，使用传入的userInfo
            setUserData(prev => ({
              ...prev,
              nickname: userInfo.nickname || userInfo.name || '极光用户',
              clientId: userInfo.customer_number || userInfo.clientId || userInfo.id_number || 'J000000001'
            }));
          } else if (data) {
            // 使用从users表获取的完整用户信息
            setUserData(prev => ({
              ...prev,
              avatar: data.avatar || userInfo.avatar || prev.avatar || 'https://picsum.photos/100/100',
              nickname: data.nickname || data.name || userInfo.nickname || userInfo.name || '极光用户',
              clientId: data.customer_number || data.id_number || data.client_id || userInfo.clientId || userInfo.id_number || 'J000000001',
              accountInfo: data.account_type || '沪深A股'
            }));
          }
        } catch (error) {
          console.error('获取用户详情异常:', error);
          // 如果获取失败，使用传入的userInfo
          setUserData(prev => ({
            ...prev,
            nickname: userInfo.nickname || userInfo.name || '极光用户',
            clientId: userInfo.customer_number || userInfo.clientId || userInfo.id_number || 'J000000001'
          }));
        }
      }
    };

    fetchUserDetails();
  }, [userInfo, supabase])

  return (
    <View style={styles.container}>
      {/* 顶部用户信息区 - 固定 */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Pressable style={styles.avatarContainer} onPress={() => onNavigateToAvatarEdit?.()}>
            <Image source={{ uri: userData.avatar }} style={styles.avatar} />
            <View style={styles.editIconContainer}>
              <Text style={styles.editIcon}>✏️</Text>
            </View>
          </Pressable>
          <View style={styles.userDetails}>
            <Text style={[styles.nickname, { fontSize: versionStyles.fontSize.large, fontWeight: versionStyles.fontWeight.bold }]}>
              {userData.nickname}
            </Text>
            <Text style={[styles.clientId, { fontSize: versionStyles.fontSize.small }]}>
              {lang === 'zh' ? '客户号: ' : 'Client ID: '}{userData.clientId}
            </Text>
            {/* 尊享版显示会员标识 */}
            {appVersion === 'premium' && (
              <View style={styles.premiumBadge}>
                <Text style={styles.premiumBadgeText}>
                  {lang === 'zh' ? '尊享会员' : 'Premium Member'}
                </Text>
              </View>
            )}
          </View>
        </View>
        <Pressable style={styles.accountInfoButton} onPress={onEditAccountInfo}>
          <Text style={styles.accountInfoText}>{lang === 'zh' ? '账号信息' : 'Account Info'}</Text>
          <Text style={styles.accountInfoArrow}>›</Text>
        </Pressable>
      </View>

      {/* 可滚动内容区 */}
      <ScrollView style={styles.contentScrollView} showsVerticalScrollIndicator={false}>
        {/* 功能管理区块 - 标准和尊享版显示，简易版隐藏 */}
        {appVersion !== 'simple' && (
          <View style={styles.functionManagementSection}>
            <Text style={[styles.sectionTitle, { fontSize: versionStyles.fontSize.base, fontWeight: versionStyles.fontWeight.bold }]}>
              {lang === 'zh' ? '功能管理' : 'Function Management'}（{getRoleDisplayName(userInfo?.role)}）
            </Text>
            <View style={styles.functionGrid}>
            {/* 调试信息 */}
            {/* {userInfo && (
              <View style={styles.debugInfo}>
                <Text style={styles.debugText}>Current user role: {userInfo.role}</Text>
              </View>
            )} */}
            
            {/* 服务员（客服）角色 */}
            {(userInfo?.role === 'waiter' || userInfo?.role === 'cs') && (
              <>
                <Pressable style={styles.functionItem} onPress={() => onNavigateToCustomerService?.()}>
                  <Text style={styles.functionIcon}>💬</Text>
                  <Text style={styles.functionName}>客户对话</Text>
                </Pressable>
                <Pressable style={styles.functionItem} onPress={() => onNavigateToMessageCenter?.()}>
                  <Text style={styles.functionIcon}>📢</Text>
                  <Text style={styles.functionName}>消息查阅</Text>
                </Pressable>
                <Pressable style={styles.functionItem} onPress={() => onNavigateToApplicationProcessing?.()}>
                  <Text style={styles.functionIcon}>📋</Text>
                  <Text style={styles.functionName}>申请办理</Text>
                </Pressable>
              </>
            )}
            
            {/* 管理员角色 */}
            {userInfo?.role === 'admin' && (
              <>
                <Pressable style={styles.functionItem} onPress={() => onNavigateToMessageCenter?.()}>
                  <Text style={styles.functionIcon}>📢</Text>
                  <Text style={styles.functionName}>消息查阅</Text>
                </Pressable>
                <Pressable style={styles.functionItem} onPress={() => onNavigateToApplicationProcessing?.()}>
                  <Text style={styles.functionIcon}>📋</Text>
                  <Text style={styles.functionName}>申请办理</Text>
                </Pressable>
                <Pressable style={styles.functionItem} onPress={() => onNavigateToFunctionSettings?.()}>
                  <Text style={styles.functionIcon}>⚙️</Text>
                  <Text style={styles.functionName}>功能设置</Text>
                </Pressable>
              </>
            )}
            
            {/* 合伙人角色 */}
            {userInfo?.role === 'partner' && (
              <>
                <Pressable style={styles.functionItem} onPress={() => onNavigateToMyCustomers?.()}>
                  <Text style={styles.functionIcon}>👥</Text>
                  <Text style={styles.functionName}>我的客户</Text>
                </Pressable>
                <Pressable style={styles.functionItem} onPress={() => alert('我的佣金功能开发中')}>
                  <Text style={styles.functionIcon}>💵</Text>
                  <Text style={styles.functionName}>我的佣金</Text>
                </Pressable>
                <Pressable style={styles.functionItem} onPress={() => onNavigateToSubscriptionRedemptionRecords?.()}>
                  <Text style={styles.functionIcon}>📋</Text>
                  <Text style={styles.functionName}>我的投资</Text>
                </Pressable>
              </>
            )}
            
            {/* 客户角色 */}
            {userInfo?.role === 'customer' && (
              <>
                <Pressable style={styles.functionItem} onPress={() => onNavigateToAssetStatus?.()}>
                  <Text style={styles.functionIcon}>💰</Text>
                  <Text style={styles.functionName}>资产状况</Text>
                </Pressable>
                <Pressable style={styles.functionItem} onPress={() => onNavigateToFundTransactions?.()}>
                  <Text style={styles.functionIcon}>💸</Text>
                  <Text style={styles.functionName}>资金往来</Text>
                </Pressable>
                <Pressable style={styles.functionItem} onPress={() => onNavigateToSubscriptionRedemptionRecords?.()}>
                  <Text style={styles.functionIcon}>📋</Text>
                  <Text style={styles.functionName}>交易记录</Text>
                </Pressable>
              </>
            )}
            
            {/* 兜底条件：如果以上条件都不满足，显示基本功能按钮 */}
            {!(userInfo?.role === 'waiter' || userInfo?.role === 'cs' || userInfo?.role === 'admin' || userInfo?.role === 'partner' || userInfo?.role === 'customer') && (
              <>
                <Pressable style={styles.functionItem} onPress={() => onNavigateToAssetStatus?.()}>
                  <Text style={styles.functionIcon}>💰</Text>
                  <Text style={[styles.functionName, { fontSize: versionStyles.fontSize.small }]}>
                    {lang === 'zh' ? '资产状况' : 'Asset Status'}
                  </Text>
                </Pressable>
                <Pressable style={styles.functionItem} onPress={() => onNavigateToFundTransactions?.()}>
                  <Text style={styles.functionIcon}>💸</Text>
                  <Text style={[styles.functionName, { fontSize: versionStyles.fontSize.small }]}>
                    {lang === 'zh' ? '资金往来' : 'Fund Transactions'}
                  </Text>
                </Pressable>
                <Pressable style={styles.functionItem} onPress={() => onNavigateToSubscriptionRedemptionRecords?.()}>
                  <Text style={styles.functionIcon}>📋</Text>
                  <Text style={[styles.functionName, { fontSize: versionStyles.fontSize.small }]}>
                    {lang === 'zh' ? '交易记录' : 'Transaction Records'}
                  </Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      )}

        {/* 消息通知区块 - 标准和尊享版显示，简易版隐藏 */}
        {appVersion !== 'simple' && (
          <View style={styles.notificationSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>消息通知</Text>
            <Pressable onPress={() => onNavigateToMessageCenter?.()}>
              <Text style={styles.viewAllText}>查看全部</Text>
            </Pressable>
          </View>
          <Pressable style={styles.notificationItem} onPress={() => onNavigateToMessageCenter?.('system')}>
            <View style={styles.notificationLeft}>
              <View style={styles.notificationIconContainer}>
                <Text style={styles.notificationIcon}>📢</Text>
                <View style={styles.unreadDot}></View>
              </View>
              <View style={styles.notificationContent}>
                <Text style={styles.notificationTitle}>系统通知</Text>
                <Text style={styles.notificationMessage}>您有一笔新的交易记录</Text>
                <Text style={styles.notificationTime}>刚刚</Text>
              </View>
            </View>
            <Text style={styles.notificationArrow}>›</Text>
          </Pressable>
          <Pressable style={styles.notificationItem} onPress={() => onNavigateToMessageCenter?.('investment')}>
            <View style={styles.notificationLeft}>
              <View style={styles.notificationIconContainer}>
                <Text style={styles.notificationIcon}>💡</Text>
                <View style={styles.unreadDot}></View>
              </View>
              <View style={styles.notificationContent}>
                <Text style={[styles.notificationTitle, { fontSize: versionStyles.fontSize.base }]}>投资提示</Text>
                <Text style={[styles.notificationMessage, { fontSize: versionStyles.fontSize.small }]}>
                  {lang === 'zh' ? '市场波动较大，请注意风险' : 'Market volatility is high, please be cautious'}
                </Text>
                <Text style={[styles.notificationTime, { fontSize: versionStyles.fontSize.small }]}>2小时前</Text>
              </View>
            </View>
            <Text style={styles.notificationArrow}>›</Text>
          </Pressable>
        </View>
      )}

        {/* 设置菜单 */}
        <View style={styles.moduleSection}>
          {/* 设置主菜单 */}
          <Pressable style={styles.moduleItem} onPress={() => onNavigateToSystemSettings?.()}>
            <View style={styles.moduleLeft}>
              <Text style={styles.moduleIcon}>⚙️</Text>
              <Text style={[styles.moduleTitle, { fontSize: versionStyles.fontSize.base }]}>
                {lang === 'zh' ? '系统设置' : 'System Settings'}
              </Text>
            </View>
            <Text style={styles.moduleArrow}>›</Text>
          </Pressable>

          {/* 版本切换模块 */}
          <Pressable style={styles.moduleItem} onPress={() => {
            console.log('版本切换 - 跳转到版本切换页面');
            onNavigateToVersionSwitch?.();
          }}>
            <View style={styles.moduleLeft}>
              <Text style={styles.moduleIcon}>🔄</Text>
              <Text style={[styles.moduleTitle, { fontSize: versionStyles.fontSize.base }]}>
                {lang === 'zh' ? '版本切换' : 'Version Switch'}
              </Text>
            </View>
            <Text style={styles.moduleArrow}>›</Text>
          </Pressable>


          

        </View>

        {/* 底部按钮区 */}
        <View style={styles.buttonSection}>
          <Pressable style={styles.button} onPress={onSwitchAccount}>
            <Text style={[styles.buttonText, { fontSize: versionStyles.fontSize.base }]}>
              {lang === 'zh' ? '切换账号' : 'Switch Account'}
            </Text>
          </Pressable>
          
          <Pressable style={[styles.button, styles.logoutButton]} onPress={onLogout}>
            <Text style={[styles.buttonText, styles.logoutButtonText, { fontSize: versionStyles.fontSize.base }]}>
              {lang === 'zh' ? '退出登录' : 'Logout'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5', // 淡浅灰色
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12, // 缩小左右缝隙
    paddingTop: 40,
    paddingBottom: 16,
    backgroundColor: '#f0f2f5',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0', // 浅色边框
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#0a84ff',
  },
  editIconContainer: {
    position: 'absolute',
    bottom: -2,
    right: 2,
    backgroundColor: '#0a84ff',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  editIcon: {
    fontSize: 12,
    color: '#fff',
  },
  userDetails: {
    justifyContent: 'center',
  },
  nickname: {
    color: '#333', // 深色文本
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  clientId: {
    color: '#666', // 灰色文本
    fontSize: 14,
  },
  accountInfoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#e6f4ff',
    borderRadius: 20,
  },
  accountInfoText: {
    color: '#0a84ff',
    fontSize: 14,
    fontWeight: '500',
  },
  accountInfoArrow: {
    color: '#0a84ff',
    fontSize: 18,
    marginLeft: 4,
  },

  moduleSection: {
    marginHorizontal: 12, // 缩小左右缝隙
    marginVertical: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'hidden',
  },
  moduleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  moduleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moduleIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  moduleTitle: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
  },
  moduleRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moduleContent: {
    color: '#999',
    fontSize: 14,
    marginRight: 8,
  },
  moduleArrow: {
    color: '#999',
    fontSize: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
  },
  buttonSection: {
    paddingHorizontal: 12, // 缩小左右缝隙
    paddingVertical: 16,
    marginTop: 'auto',
  },
  button: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    shadowColor: '#ef4444',
  },
  logoutButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  profit: {
    color: '#10b981',
  },
  loss: {
    color: '#ef4444',
  },
  // 内容滚动区域
  contentScrollView: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  // 功能管理区块
  functionManagementSection: {
    marginHorizontal: 12,
    marginTop: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  // 消息通知区块
  notificationSection: {
    marginHorizontal: 12,
    marginTop: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  // 区块标题
  sectionTitle: {
    color: '#333',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  // 区块头部
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  // 查看全部文字
  viewAllText: {
    color: '#0a84ff',
    fontSize: 14,
    fontWeight: '500',
  },
  // 功能网格
  functionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  // 功能项
  functionItem: {
    width: '30%',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
  },
  // 功能图标
  functionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  // 功能名称
  functionName: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  // 通知项
  notificationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  // 通知左侧
  notificationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  // 通知图标容器
  notificationIconContainer: {
    position: 'relative',
    marginRight: 12,
  },
  // 通知图标
  notificationIcon: {
    fontSize: 20,
  },
  // 未读点
  unreadDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  // 通知内容
  notificationContent: {
    flex: 1,
  },
  // 通知标题
  notificationTitle: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  // 通知消息
  notificationMessage: {
    color: '#666',
    fontSize: 14,
    marginBottom: 4,
  },
  // 通知时间
  notificationTime: {
    color: '#999',
    fontSize: 12,
  },
  // 通知箭头
  notificationArrow: {
    color: '#999',
    fontSize: 20,
  },
  // 尊享会员标识样式
  premiumBadge: {
    backgroundColor: '#f0f4ff',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  premiumBadgeText: {
    color: '#4a90e2',
    fontSize: 12,
    fontWeight: '600',
  },
})
