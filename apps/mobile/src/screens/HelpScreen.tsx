import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native'
import { useState } from 'react'

export default function HelpScreen({ onBack, lang = 'zh' }: { onBack: () => void; lang?: 'zh' | 'en' }) {
  const [expandedSection, setExpandedSection] = useState<string | null>('basic')

  const toggleSection = (section: string) => {
    if (expandedSection === section) {
      setExpandedSection(null)
    } else {
      setExpandedSection(section)
    }
  }

  const sections = {
    basic: {
      title: lang === 'zh' ? '基本操作' : 'Basic Operations',
      icon: '📱',
      items: [
        {
          question: lang === 'zh' ? '如何登录和注册账号？' : 'How to login and register an account?',
          answer: lang === 'zh' ? '打开APP后，点击"注册"按钮，按照提示输入手机号码、验证码和设置密码即可完成注册。登录时输入注册的手机号码和密码即可。' : 'After opening the APP, click the "Register" button, follow the prompts to enter your mobile phone number, verification code and set a password to complete registration. When logging in, enter the registered mobile phone number and password.'
        },
        {
          question: lang === 'zh' ? '如何修改个人信息？' : 'How to modify personal information?',
          answer: lang === 'zh' ? '进入"我的"页面，点击头像或"账号信息"按钮，即可修改昵称、头像等个人信息。' : 'Enter the "My" page, click the avatar or "Account Info" button to modify nickname, avatar and other personal information.'
        },
        {
          question: lang === 'zh' ? '如何切换账号？' : 'How to switch accounts?',
          answer: lang === 'zh' ? '进入"我的"页面，点击底部的"切换账号"按钮，即可切换到其他已登录的账号。' : 'Enter the "My" page, click the "Switch Account" button at the bottom to switch to other logged-in accounts.'
        }
      ]
    },
    portfolio: {
      title: lang === 'zh' ? '资产与投资' : 'Assets & Investment',
      icon: '💰',
      items: [
        {
          question: lang === 'zh' ? '如何查看资产状况？' : 'How to check asset status?',
          answer: lang === 'zh' ? '进入"我的"页面，点击"资产状况"按钮，即可查看总资产、可用资金、持仓市值等详细信息。' : 'Enter the "My" page, click the "Asset Status" button to view detailed information such as total assets, available funds, and position market value.'
        },
        {
          question: lang === 'zh' ? '如何查看交易记录？' : 'How to check transaction records?',
          answer: lang === 'zh' ? '进入"我的"页面，点击"交易记录"按钮，即可查看历史交易明细。' : 'Enter the "My" page, click the "Transaction Records" button to view historical transaction details.'
        },
        {
          question: lang === 'zh' ? '如何查看资金往来？' : 'How to check fund transactions?',
          answer: lang === 'zh' ? '进入"我的"页面，点击"资金往来"按钮，即可查看资金的存入和取出记录。' : 'Enter the "My" page, click the "Fund Transactions" button to view fund deposit and withdrawal records.'
        }
      ]
    },
    trading: {
      title: lang === 'zh' ? '交易操作' : 'Trading Operations',
      icon: '📈',
      items: [
        {
          question: lang === 'zh' ? '如何进行股票交易？' : 'How to trade stocks?',
          answer: lang === 'zh' ? '进入"交易"页面，选择股票代码或搜索股票，输入交易价格和数量，点击"买入"或"卖出"按钮即可完成交易。' : 'Enter the "Trading" page, select the stock code or search for stocks, enter the trading price and quantity, click the "Buy" or "Sell" button to complete the transaction.'
        },
        {
          question: lang === 'zh' ? '如何设置交易密码？' : 'How to set a trading password?',
          answer: lang === 'zh' ? '进入"我的"页面，点击"安全中心"按钮，选择"交易密码设置"，按照提示完成密码设置。' : 'Enter the "My" page, click the "Security Center" button, select "Trading Password Setting", and follow the prompts to complete the password setting.'
        },
        {
          question: lang === 'zh' ? '如何查看交易手续费？' : 'How to check trading fees?',
          answer: lang === 'zh' ? '进入"交易"页面，在交易确认界面会显示本次交易的手续费明细。' : 'Enter the "Trading" page, the transaction confirmation interface will display the fee details for this transaction.'
        }
      ]
    },
    insider: {
      title: lang === 'zh' ? '内参使用' : 'Insider News Usage',
      icon: '📰',
      items: [
        {
          question: lang === 'zh' ? '如何查看内参文章？' : 'How to view insider articles?',
          answer: lang === 'zh' ? '进入"内参"页面，即可浏览最新的内参文章。点击文章标题可查看全文。' : 'Enter the "Insider News" page to browse the latest insider articles. Click on the article title to view the full text.'
        },
        {
          question: lang === 'zh' ? '如何筛选内参文章？' : 'How to filter insider articles?',
          answer: lang === 'zh' ? '在内参页面，可以通过顶部的分类标签筛选不同类别的内参文章。' : 'On the Insider News page, you can filter different categories of insider articles through the category tags at the top.'
        },
        {
          question: lang === 'zh' ? '如何收藏内参文章？' : 'How to collect insider articles?',
          answer: lang === 'zh' ? '在文章详情页，点击右上角的收藏按钮即可收藏文章。收藏的文章可在"我的"页面查看。' : 'On the article detail page, click the collect button in the upper right corner to collect the article. Collected articles can be viewed on the "My" page.'
        }
      ]
    },
    settings: {
      title: lang === 'zh' ? '系统设置' : 'System Settings',
      icon: '⚙️',
      items: [
        {
          question: lang === 'zh' ? '如何切换APP版本？' : 'How to switch APP versions?',
          answer: lang === 'zh' ? '进入"我的"页面，点击"版本切换"按钮，选择需要的版本即可切换。' : 'Enter the "My" page, click the "Version Switch" button, select the desired version to switch.'
        },
        {
          question: lang === 'zh' ? '如何修改登录密码？' : 'How to change login password?',
          answer: lang === 'zh' ? '进入"我的"页面，点击"安全中心"按钮，选择"修改登录密码"，按照提示完成密码修改。' : 'Enter the "My" page, click the "Security Center" button, select "Change Login Password", and follow the prompts to complete the password change.'
        },
        {
          question: lang === 'zh' ? '如何开启消息通知？' : 'How to enable message notifications?',
          answer: lang === 'zh' ? '进入"我的"页面，点击"系统设置"按钮，选择"消息通知设置"，开启需要的通知类型。' : 'Enter the "My" page, click the "System Settings" button, select "Message Notification Settings", and enable the required notification types.'
        }
      ]
    },
    troubleshoot: {
      title: lang === 'zh' ? '常见问题' : 'FAQ',
      icon: '❓',
      items: [
        {
          question: lang === 'zh' ? '登录失败怎么办？' : 'What to do if login fails?',
          answer: lang === 'zh' ? '请检查网络连接是否正常，输入的账号密码是否正确。如果忘记密码，可点击"忘记密码"按钮，通过手机验证码重置密码。' : 'Please check if the network connection is normal and if the entered account password is correct. If you forget your password, you can click the "Forgot Password" button to reset your password via mobile phone verification code.'
        },
        {
          question: lang === 'zh' ? '交易失败怎么办？' : 'What to do if transaction fails?',
          answer: lang === 'zh' ? '请检查网络连接是否正常，账户资金是否充足，交易价格是否有效。如仍有问题，请联系客服。' : 'Please check if the network connection is normal, if the account funds are sufficient, and if the transaction price is valid. If you still have problems, please contact customer service.'
        },
        {
          question: lang === 'zh' ? '如何联系客服？' : 'How to contact customer service?',
          answer: lang === 'zh' ? '进入"我的"页面，点击"客户服务"按钮，即可联系客服人员。' : 'Enter the "My" page, click the "Customer Service" button to contact customer service personnel.'
        }
      ]
    }
  }

  return (
    <View style={styles.container}>
      {/* 头部导航 */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{lang === 'zh' ? '帮助中心' : 'Help Center'}</Text>
        <View style={styles.headerRight} />
      </View>

      {/* 帮助内容 */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 欢迎语 */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeIcon}>👋</Text>
          <Text style={styles.welcomeTitle}>{lang === 'zh' ? '欢迎使用极光APP' : 'Welcome to Aurora APP'}</Text>
          <Text style={styles.welcomeText}>
            {lang === 'zh' ? '这里是APP的使用帮助中心，您可以找到关于APP各项功能的详细使用方法。' : 'This is the APP usage help center, where you can find detailed usage methods for various APP functions.'}
          </Text>
        </View>

        {/* 帮助分类 */}
        <View style={styles.helpCategories}>
          {Object.entries(sections).map(([key, section]) => (
            <View key={key} style={styles.categorySection}>
              <Pressable 
                style={styles.categoryHeader} 
                onPress={() => toggleSection(key)}
              >
                <View style={styles.categoryLeft}>
                  <Text style={styles.categoryIcon}>{section.icon}</Text>
                  <Text style={styles.categoryTitle}>{section.title}</Text>
                </View>
                <Text style={styles.categoryArrow}>
                  {expandedSection === key ? '▼' : '▶'}
                </Text>
              </Pressable>

              {expandedSection === key && (
                <View style={styles.categoryContent}>
                  {section.items.map((item, index) => (
                    <View key={index} style={styles.helpItem}>
                      <Text style={styles.helpQuestion}>{item.question}</Text>
                      <Text style={styles.helpAnswer}>{item.answer}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>

        {/* 底部提示 */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {lang === 'zh' ? '如有其他问题，请联系客服人员获取帮助。' : 'If you have other questions, please contact customer service personnel for help.'}
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
  content: {
    flex: 1,
  },
  welcomeSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  welcomeIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  helpCategories: {
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  categorySection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
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
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  categoryArrow: {
    fontSize: 14,
    color: '#999',
  },
  categoryContent: {
    padding: 16,
  },
  helpItem: {
    marginBottom: 16,
  },
  helpQuestion: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  helpAnswer: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    marginTop: 12,
    marginBottom: 24,
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
})
