import { View, Text, StyleSheet, Pressable, ScrollView, Switch } from 'react-native'
import { useState } from 'react'

export default function SystemSettingsScreen({ lang = 'zh', onClose, onLanguageChange, onNavigateToFeedback, onNavigateToSecurityCenter, onNavigateToHelpCenter, onNavigateToAboutUs, userInfo }: { lang?: 'zh' | 'en'; onClose?: () => void; onLanguageChange?: (lang: 'zh' | 'en') => void; onNavigateToFeedback?: () => void; onNavigateToSecurityCenter?: () => void; onNavigateToHelpCenter?: () => void; onNavigateToAboutUs?: () => void; userInfo?: any }) {
  // 语言翻译
  const t = lang === 'zh' ? {
    title: '系统设置',
    basicSettings: '基本设置',
    languageSettings: '语言设置',
    currentLanguage: '简体中文',
    notificationSettings: '通知设置',
    privacySettings: '隐私设置',
    accountSettings: '账户与安全',
    invitationCode: '邀请码',
    securityCenter: '安全中心',
    supportSettings: '支持与关于',
    helpCenter: '帮助中心',
    aboutUs: '关于我们',
    feedback: '意见反馈',
    version: '版本'
  } : {
    title: 'System Settings',
    basicSettings: 'Basic Settings',
    languageSettings: 'Language Settings',
    currentLanguage: 'English',
    notificationSettings: 'Notification Settings',
    privacySettings: 'Privacy Settings',
    accountSettings: 'Account & Security',
    invitationCode: 'Invitation Code',
    securityCenter: 'Security Center',
    supportSettings: 'Support & About',
    helpCenter: 'Help Center',
    aboutUs: 'About Us',
    feedback: 'Feedback',
    version: 'Version'
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
        {/* 基本设置 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.basicSettings}</Text>
          <View style={styles.sectionContent}>
            {/* 语言设置 */}
            <Pressable style={styles.settingItem} onPress={() => {
              const newLang = lang === 'zh' ? 'en' : 'zh'
              onLanguageChange?.(newLang)
            }}>
              <Text style={styles.settingItemText}>{t.languageSettings}</Text>
              <View style={styles.settingItemRight}>
                <Text style={styles.settingItemValue}>{t.currentLanguage}</Text>
                <Text style={styles.settingItemArrow}>›</Text>
              </View>
            </Pressable>
            
            {/* 通知设置 */}
            <Pressable style={styles.settingItem} onPress={() => alert(t.notificationSettings + ' - 开发中')}>
              <Text style={styles.settingItemText}>{t.notificationSettings}</Text>
              <Text style={styles.settingItemArrow}>›</Text>
            </Pressable>
            
            {/* 隐私设置 */}
            <Pressable style={styles.settingItem} onPress={() => alert(t.privacySettings + ' - 开发中')}>
              <Text style={styles.settingItemText}>{t.privacySettings}</Text>
              <Text style={styles.settingItemArrow}>›</Text>
            </Pressable>
          </View>
        </View>

        {/* 账户与安全 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.accountSettings}</Text>
          <View style={styles.sectionContent}>
            {/* 邀请码 */}
            <View style={styles.settingItem}>
              <Text style={styles.settingItemText}>{t.invitationCode}</Text>
              <Text style={styles.versionText}>{userInfo?.invite_code || 'N/A'}</Text>
            </View>
            
            {/* 安全中心 */}
            <Pressable style={styles.settingItem} onPress={() => {
              console.log('Navigate to Security Center');
              onNavigateToSecurityCenter?.();
            }}>
              <Text style={styles.settingItemText}>{t.securityCenter}</Text>
              <Text style={styles.settingItemArrow}>›</Text>
            </Pressable>
          </View>
        </View>

        {/* 支持与关于 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.supportSettings}</Text>
          <View style={styles.sectionContent}>
            {/* 帮助中心 */}
            <Pressable style={styles.settingItem} onPress={() => {
              console.log('Navigate to Help Center');
              onNavigateToHelpCenter?.();
            }}>
              <Text style={styles.settingItemText}>{t.helpCenter}</Text>
              <Text style={styles.settingItemArrow}>›</Text>
            </Pressable>
            
            {/* 意见反馈 */}
            <Pressable style={styles.settingItem} onPress={() => {
              console.log('Navigate to Feedback');
              onNavigateToFeedback?.();
            }}>
              <Text style={styles.settingItemText}>{t.feedback}</Text>
              <Text style={styles.settingItemArrow}>›</Text>
            </Pressable>
            
            {/* 关于我们 */}
            <Pressable style={styles.settingItem} onPress={() => {
              console.log('Navigate to About Us');
              onNavigateToAboutUs?.();
            }}>
              <Text style={styles.settingItemText}>{t.aboutUs}</Text>
              <Text style={styles.settingItemArrow}>›</Text>
            </Pressable>
            
            {/* 版本信息 */}
            <View style={styles.settingItem}>
              <Text style={styles.settingItemText}>{t.version}</Text>
              <Text style={styles.versionText}>1.0.0</Text>
            </View>
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
  settingItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingItemText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  settingItemValue: {
    fontSize: 14,
    color: '#999',
    marginRight: 8,
  },
  settingItemArrow: {
    fontSize: 20,
    color: '#999',
  },
  versionText: {
    fontSize: 14,
    color: '#999',
  },
})
