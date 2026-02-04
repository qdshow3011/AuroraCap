import { View, Text, StyleSheet, Pressable, ScrollView, Alert } from 'react-native'
import { useState } from 'react'

export default function PersonalInfoSecurityScreen({ lang = 'zh', onClose, onNavigateToPersonalProfile }: { lang?: 'zh' | 'en'; onClose?: () => void; onNavigateToPersonalProfile?: () => void }) {
  // 语言翻译
  const t = lang === 'zh' ? {
    title: '个人信息与安全',
    personalProfile: '个人资料',
    accountSecurity: '账户安全',
    privacySettings: '隐私设置',
    notificationSettings: '通知设置',
    changePassword: '修改密码',
    bindPhone: '绑定手机',
    bindEmail: '绑定邮箱',
    loginDevices: '登录设备',
    twoFactorAuth: '双重验证',
    privacyPolicy: '隐私政策',
    dataProtection: '数据保护',
    personalInfoCollection: '个人信息收集',
    thirdPartyAccess: '第三方访问',
    notificationManagement: '通知管理',
    messageNotification: '消息通知',
    transactionNotification: '交易通知',
    marketingNotification: '营销通知'
  } : {
    title: 'Personal Info & Security',
    personalProfile: 'Personal Profile',
    accountSecurity: 'Account Security',
    privacySettings: 'Privacy Settings',
    notificationSettings: 'Notification Settings',
    changePassword: 'Change Password',
    bindPhone: 'Bind Phone',
    bindEmail: 'Bind Email',
    loginDevices: 'Login Devices',
    twoFactorAuth: 'Two-Factor Auth',
    privacyPolicy: 'Privacy Policy',
    dataProtection: 'Data Protection',
    personalInfoCollection: 'Personal Info Collection',
    thirdPartyAccess: 'Third-Party Access',
    notificationManagement: 'Notification Management',
    messageNotification: 'Message Notifications',
    transactionNotification: 'Transaction Notifications',
    marketingNotification: 'Marketing Notifications'
  }

  // 模拟数据
  const userInfo = {
    phone: '138****8888',
    email: 'user****@example.com',
    hasTwoFactor: false
  }

  return (
    <View style={styles.container}>
      {/* 顶部导航栏 */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={onClose}>
          <Text style={styles.backButtonText}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{t.title}</Text>
        <View style={styles.headerRight} />
      </View>

      {/* 内容区域 */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 个人资料 */}
        <View style={styles.section}>
          <Pressable style={styles.settingItem} onPress={onNavigateToPersonalProfile}>
            <Text style={styles.settingItemText}>{t.personalProfile}</Text>
            <Text style={styles.settingItemArrow}>›</Text>
          </Pressable>
        </View>

        {/* 账户安全 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.accountSecurity}</Text>
          <View style={styles.sectionContent}>
            <Pressable style={styles.settingItem} onPress={() => Alert.alert('提示', '修改密码功能开发中')}>
              <Text style={styles.settingItemText}>{t.changePassword}</Text>
              <Text style={styles.settingItemArrow}>›</Text>
            </Pressable>
            <Pressable style={styles.settingItem} onPress={() => Alert.alert('提示', '绑定手机功能开发中')}>
              <Text style={styles.settingItemText}>{t.bindPhone}</Text>
              <View style={styles.settingItemRight}>
                <Text style={styles.settingItemValue}>{userInfo.phone}</Text>
                <Text style={styles.settingItemArrow}>›</Text>
              </View>
            </Pressable>
            <Pressable style={styles.settingItem} onPress={() => Alert.alert('提示', '绑定邮箱功能开发中')}>
              <Text style={styles.settingItemText}>{t.bindEmail}</Text>
              <View style={styles.settingItemRight}>
                <Text style={styles.settingItemValue}>{userInfo.email}</Text>
                <Text style={styles.settingItemArrow}>›</Text>
              </View>
            </Pressable>
            <Pressable style={styles.settingItem} onPress={() => Alert.alert('提示', '登录设备管理功能开发中')}>
              <Text style={styles.settingItemText}>{t.loginDevices}</Text>
              <Text style={styles.settingItemArrow}>›</Text>
            </Pressable>
            <Pressable style={styles.settingItem} onPress={() => Alert.alert('提示', '双重验证功能开发中')}>
              <Text style={styles.settingItemText}>{t.twoFactorAuth}</Text>
              <View style={styles.settingItemRight}>
                <Text style={[styles.settingItemValue, !userInfo.hasTwoFactor && styles.disabledText]}>
                  {userInfo.hasTwoFactor ? '已开启' : '未开启'}
                </Text>
                <Text style={styles.settingItemArrow}>›</Text>
              </View>
            </Pressable>
          </View>
        </View>

        {/* 隐私设置 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.privacySettings}</Text>
          <View style={styles.sectionContent}>
            <Pressable style={styles.settingItem} onPress={() => Alert.alert('提示', '隐私政策查看功能开发中')}>
              <Text style={styles.settingItemText}>{t.privacyPolicy}</Text>
              <Text style={styles.settingItemArrow}>›</Text>
            </Pressable>
            <Pressable style={styles.settingItem} onPress={() => Alert.alert('提示', '数据保护功能开发中')}>
              <Text style={styles.settingItemText}>{t.dataProtection}</Text>
              <Text style={styles.settingItemArrow}>›</Text>
            </Pressable>
            <Pressable style={styles.settingItem} onPress={() => Alert.alert('提示', '个人信息收集设置功能开发中')}>
              <Text style={styles.settingItemText}>{t.personalInfoCollection}</Text>
              <Text style={styles.settingItemArrow}>›</Text>
            </Pressable>
            <Pressable style={styles.settingItem} onPress={() => Alert.alert('提示', '第三方访问设置功能开发中')}>
              <Text style={styles.settingItemText}>{t.thirdPartyAccess}</Text>
              <Text style={styles.settingItemArrow}>›</Text>
            </Pressable>
          </View>
        </View>

        {/* 通知设置 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.notificationSettings}</Text>
          <View style={styles.sectionContent}>
            <Pressable style={styles.settingItem} onPress={() => Alert.alert('提示', '通知管理功能开发中')}>
              <Text style={styles.settingItemText}>{t.notificationManagement}</Text>
              <Text style={styles.settingItemArrow}>›</Text>
            </Pressable>
            <Pressable style={styles.settingItem} onPress={() => Alert.alert('提示', '消息通知设置功能开发中')}>
              <Text style={styles.settingItemText}>{t.messageNotification}</Text>
              <Text style={styles.settingItemArrow}>›</Text>
            </Pressable>
            <Pressable style={styles.settingItem} onPress={() => Alert.alert('提示', '交易通知设置功能开发中')}>
              <Text style={styles.settingItemText}>{t.transactionNotification}</Text>
              <Text style={styles.settingItemArrow}>›</Text>
            </Pressable>
            <Pressable style={styles.settingItem} onPress={() => Alert.alert('提示', '营销通知设置功能开发中')}>
              <Text style={styles.settingItemText}>{t.marketingNotification}</Text>
              <Text style={styles.settingItemArrow}>›</Text>
            </Pressable>
          </View>
        </View>

        {/* 底部留白 */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 24,
    color: '#333',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 16,
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    color: '#999',
    marginBottom: 8,
    marginLeft: 8,
  },
  sectionContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingItemText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  settingItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingItemValue: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  settingItemArrow: {
    fontSize: 20,
    color: '#999',
  },
  disabledText: {
    color: '#999',
  },
})
