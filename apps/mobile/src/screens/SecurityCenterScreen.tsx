import { View, Text, StyleSheet, ScrollView, Pressable, Switch } from 'react-native'
import { useState } from 'react'

export default function SecurityCenterScreen({ onBack, lang = 'zh' }: { onBack: () => void; lang?: 'zh' | 'en' }) {
  const [biometricAuth, setBiometricAuth] = useState(false)
  const [autoLock, setAutoLock] = useState(true)
  const [loginNotification, setLoginNotification] = useState(true)
  const [transactionNotification, setTransactionNotification] = useState(true)
  const [suspiciousActivityAlert, setSuspiciousActivityAlert] = useState(true)

  const securitySections = {
    account: {
      title: lang === 'zh' ? '账号安全' : 'Account Security',
      icon: '🔐',
      items: [
        {
          title: lang === 'zh' ? '修改登录密码' : 'Change Login Password',
          description: lang === 'zh' ? '定期修改密码以提高账号安全性' : 'Regularly change your password to improve account security',
          action: 'navigate',
          route: 'change-password'
        },
        {
          title: lang === 'zh' ? '修改交易密码' : 'Change Trading Password',
          description: lang === 'zh' ? '交易密码用于保护您的交易操作' : 'Trading password is used to protect your trading operations',
          action: 'navigate',
          route: 'change-trading-password'
        },
        {
          title: lang === 'zh' ? '绑定手机号码' : 'Bind Mobile Phone Number',
          description: lang === 'zh' ? '手机号码用于接收验证码和重要通知' : 'Mobile phone number is used to receive verification codes and important notifications',
          action: 'navigate',
          route: 'bind-phone'
        },
        {
          title: lang === 'zh' ? '绑定邮箱' : 'Bind Email',
          description: lang === 'zh' ? '邮箱可用于密码找回和接收重要通知' : 'Email can be used for password retrieval and receiving important notifications',
          action: 'navigate',
          route: 'bind-email'
        }
      ]
    },
    authentication: {
      title: lang === 'zh' ? '身份验证' : 'Authentication',
      icon: '🧬',
      items: [
        {
          title: lang === 'zh' ? '生物识别认证' : 'Biometric Authentication',
          description: lang === 'zh' ? '使用指纹或面部识别快速登录' : 'Use fingerprint or face recognition for quick login',
          action: 'toggle',
          value: biometricAuth,
          onValueChange: setBiometricAuth
        },
        {
          title: lang === 'zh' ? '自动锁定' : 'Auto Lock',
          description: lang === 'zh' ? '一段时间无操作后自动锁定APP' : 'Automatically lock the APP after a period of inactivity',
          action: 'toggle',
          value: autoLock,
          onValueChange: setAutoLock
        }
      ]
    },
    notifications: {
      title: lang === 'zh' ? '安全通知' : 'Security Notifications',
      icon: '🔔',
      items: [
        {
          title: lang === 'zh' ? '登录通知' : 'Login Notification',
          description: lang === 'zh' ? '当账号在新设备登录时通知您' : 'Notify you when your account logs in on a new device',
          action: 'toggle',
          value: loginNotification,
          onValueChange: setLoginNotification
        },
        {
          title: lang === 'zh' ? '交易通知' : 'Transaction Notification',
          description: lang === 'zh' ? '当账号发生交易时通知您' : 'Notify you when a transaction occurs in your account',
          action: 'toggle',
          value: transactionNotification,
          onValueChange: setTransactionNotification
        },
        {
          title: lang === 'zh' ? '可疑活动提醒' : 'Suspicious Activity Alert',
          description: lang === 'zh' ? '当检测到可疑活动时提醒您' : 'Alert you when suspicious activities are detected',
          action: 'toggle',
          value: suspiciousActivityAlert,
          onValueChange: setSuspiciousActivityAlert
        }
      ]
    },
    device: {
      title: lang === 'zh' ? '设备管理' : 'Device Management',
      icon: '📱',
      items: [
        {
          title: lang === 'zh' ? '已登录设备' : 'Logged-in Devices',
          description: lang === 'zh' ? '查看并管理已登录的设备' : 'View and manage logged-in devices',
          action: 'navigate',
          route: 'device-management'
        },
        {
          title: lang === 'zh' ? '登录地点' : 'Login Locations',
          description: lang === 'zh' ? '查看最近的登录地点记录' : 'View recent login location records',
          action: 'navigate',
          route: 'login-history'
        }
      ]
    },
    protection: {
      title: lang === 'zh' ? '安全防护' : 'Security Protection',
      icon: '🛡️',
      items: [
        {
          title: lang === 'zh' ? '隐私设置' : 'Privacy Settings',
          description: lang === 'zh' ? '管理个人信息的隐私保护' : 'Manage privacy protection of personal information',
          action: 'navigate',
          route: 'privacy-settings'
        },
        {
          title: lang === 'zh' ? '安全风险评估' : 'Security Risk Assessment',
          description: lang === 'zh' ? '评估账号的安全风险并提供建议' : 'Assess account security risks and provide recommendations',
          action: 'navigate',
          route: 'security-assessment'
        },
        {
          title: lang === 'zh' ? '安全日志' : 'Security Logs',
          description: lang === 'zh' ? '查看账号的安全操作日志' : 'View account security operation logs',
          action: 'navigate',
          route: 'security-logs'
        }
      ]
    },
    tips: {
      title: lang === 'zh' ? '安全小贴士' : 'Security Tips',
      icon: '💡',
      items: [
        {
          title: lang === 'zh' ? '密码安全' : 'Password Security',
          description: lang === 'zh' ? '使用强密码，包含字母、数字和特殊字符，定期更换' : 'Use strong passwords with letters, numbers and special characters, and change them regularly',
          action: 'info'
        },
        {
          title: lang === 'zh' ? '钓鱼防范' : 'Phishing Prevention',
          description: lang === 'zh' ? '不要点击可疑链接，不要在非官方渠道输入账号密码' : 'Do not click suspicious links, do not enter account passwords in non-official channels',
          action: 'info'
        },
        {
          title: lang === 'zh' ? '设备安全' : 'Device Security',
          description: lang === 'zh' ? '保持设备系统更新，安装防病毒软件，不要root或越狱设备' : 'Keep device system updated, install anti-virus software, do not root or jailbreak devices',
          action: 'info'
        },
        {
          title: lang === 'zh' ? '交易安全' : 'Transaction Security',
          description: lang === 'zh' ? '确认交易信息无误后再提交，定期检查交易记录' : 'Confirm transaction information is correct before submitting, regularly check transaction records',
          action: 'info'
        }
      ]
    }
  }

  const handleAction = (action: string, route?: string) => {
    if (action === 'navigate' && route) {
      // 这里可以添加导航逻辑
      alert(`${lang === 'zh' ? '导航到' : 'Navigate to'} ${route}`)
    }
  }

  return (
    <View style={styles.container}>
      {/* 头部导航 */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{lang === 'zh' ? '安全中心' : 'Security Center'}</Text>
        <View style={styles.headerRight} />
      </View>

      {/* 安全状态概览 */}
      <View style={styles.securityOverview}>
        <Text style={styles.securityIcon}>🛡️</Text>
        <Text style={styles.securityTitle}>{lang === 'zh' ? '账号安全状态' : 'Account Security Status'}</Text>
        <Text style={styles.securityLevel}>{lang === 'zh' ? '安全级别: 中' : 'Security Level: Medium'}</Text>
        <Text style={styles.securityDescription}>
          {lang === 'zh' ? '您的账号当前处于中等安全状态，建议开启更多安全功能以提高安全性。' : 'Your account is currently in medium security status, it is recommended to enable more security features to improve security.'}
        </Text>
        <Pressable style={styles.improveButton}>
          <Text style={styles.improveButtonText}>{lang === 'zh' ? '提升安全等级' : 'Improve Security Level'}</Text>
        </Pressable>
      </View>

      {/* 安全功能列表 */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {Object.entries(securitySections).map(([key, section]) => (
          <View key={key} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>{section.icon}</Text>
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
            <View style={styles.sectionContent}>
              {section.items.map((item, index) => (
                <View key={index} style={styles.item}>
                  <View style={styles.itemLeft}>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    <Text style={styles.itemDescription}>{item.description}</Text>
                  </View>
                  <View style={styles.itemRight}>
                    {item.action === 'toggle' && (
                      <Switch
                        value={item.value}
                        onValueChange={item.onValueChange}
                        trackColor={{ false: '#e0e0e0', true: '#4a90e2' }}
                        thumbColor={item.value ? '#ffffff' : '#f4f3f4'}
                      />
                    )}
                    {item.action === 'navigate' && (
                      <Text style={styles.itemArrow}>›</Text>
                    )}
                    {item.action === 'info' && (
                      <Text style={styles.itemInfo}>ℹ️</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* 紧急措施 */}
        <View style={styles.emergencySection}>
          <Text style={styles.emergencyTitle}>{lang === 'zh' ? '紧急措施' : 'Emergency Measures'}</Text>
          <Pressable style={styles.emergencyButton}>
            <Text style={styles.emergencyButtonText}>{lang === 'zh' ? '冻结账号' : 'Freeze Account'}</Text>
          </Pressable>
          <Text style={styles.emergencyDescription}>
            {lang === 'zh' ? '如果您的账号被盗用，请立即冻结账号以防止进一步损失。' : 'If your account is compromised, please freeze your account immediately to prevent further losses.'}
          </Text>
        </View>
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
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backButtonText: {
    fontSize: 24,
    color: '#333',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  headerRight: {
    width: 40,
  },
  securityOverview: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    padding: 20,
    borderRadius: 12,
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
  securityIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  securityTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  securityLevel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4a90e2',
    marginBottom: 12,
  },
  securityDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  improveButton: {
    backgroundColor: '#4a90e2',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  improveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  section: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  sectionContent: {
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
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemLeft: {
    flex: 1,
    marginRight: 16,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  itemRight: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemArrow: {
    fontSize: 20,
    color: '#999',
  },
  itemInfo: {
    fontSize: 18,
  },
  emergencySection: {
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 32,
    backgroundColor: '#fff3f3',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ffcccc',
  },
  emergencyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  emergencyButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  emergencyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emergencyDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
})
