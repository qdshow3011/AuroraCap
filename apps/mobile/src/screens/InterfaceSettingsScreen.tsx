import { View, Text, StyleSheet, Pressable, Switch, ScrollView } from 'react-native'
import { useState } from 'react'

export default function InterfaceSettingsScreen({ lang = 'zh', onClose, onLanguageChange }: { lang?: 'zh' | 'en'; onClose?: () => void; onLanguageChange?: (lang: 'zh' | 'en') => void }) {
  // 状态管理
  const [darkMode, setDarkMode] = useState(false)
  const [autoTheme, setAutoTheme] = useState(false)
  const [largeFont, setLargeFont] = useState(false)
  const [highContrast, setHighContrast] = useState(false)

  // 语言翻译
  const t = lang === 'zh' ? {
    title: '界面与显示',
    language: '语言',
    currentLanguage: '简体中文',
    theme: '主题',
    darkMode: '深色模式',
    autoTheme: '跟随系统',
    font: '字体',
    largeFont: '大字体',
    highContrast: '高对比度',
    accessibility: '无障碍',
    display: '显示',
    animation: '动画效果',
    reduceMotion: '减少动画'
  } : {
    title: 'Interface & Display',
    language: 'Language',
    currentLanguage: 'English',
    theme: 'Theme',
    darkMode: 'Dark Mode',
    autoTheme: 'Follow System',
    font: 'Font',
    largeFont: 'Large Font',
    highContrast: 'High Contrast',
    accessibility: 'Accessibility',
    display: 'Display',
    animation: 'Animation',
    reduceMotion: 'Reduce Motion'
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
        {/* 语言设置 */}
        <View style={styles.section}>
          <Pressable style={styles.settingItem} onPress={() => {
            const newLang = lang === 'zh' ? 'en' : 'zh'
            onLanguageChange?.(newLang)
          }}>
            <Text style={styles.settingItemText}>{t.language}</Text>
            <View style={styles.settingItemRight}>
              <Text style={styles.settingItemValue}>{t.currentLanguage}</Text>
              <Text style={styles.settingItemArrow}>›</Text>
            </View>
          </Pressable>
        </View>

        {/* 主题设置 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.theme}</Text>
          <View style={styles.sectionContent}>
            <View style={styles.settingItem}>
              <Text style={styles.settingItemText}>{t.darkMode}</Text>
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: '#e0e0e0', true: '#4CAF50' }}
                thumbColor={darkMode ? '#fff' : '#f4f3f4'}
              />
            </View>
            <View style={styles.settingItem}>
              <Text style={styles.settingItemText}>{t.autoTheme}</Text>
              <Switch
                value={autoTheme}
                onValueChange={setAutoTheme}
                trackColor={{ false: '#e0e0e0', true: '#4CAF50' }}
                thumbColor={autoTheme ? '#fff' : '#f4f3f4'}
              />
            </View>
          </View>
        </View>

        {/* 字体设置 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.font}</Text>
          <View style={styles.sectionContent}>
            <View style={styles.settingItem}>
              <Text style={styles.settingItemText}>{t.largeFont}</Text>
              <Switch
                value={largeFont}
                onValueChange={setLargeFont}
                trackColor={{ false: '#e0e0e0', true: '#4CAF50' }}
                thumbColor={largeFont ? '#fff' : '#f4f3f4'}
              />
            </View>
            <View style={styles.settingItem}>
              <Text style={styles.settingItemText}>{t.highContrast}</Text>
              <Switch
                value={highContrast}
                onValueChange={setHighContrast}
                trackColor={{ false: '#e0e0e0', true: '#4CAF50' }}
                thumbColor={highContrast ? '#fff' : '#f4f3f4'}
              />
            </View>
          </View>
        </View>

        {/* 显示设置 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.display}</Text>
          <View style={styles.sectionContent}>
            <Pressable style={styles.settingItem} onPress={() => alert('字体大小设置开发中')}>
              <Text style={styles.settingItemText}>字体大小</Text>
              <Text style={styles.settingItemArrow}>›</Text>
            </Pressable>
            <Pressable style={styles.settingItem} onPress={() => alert('屏幕亮度设置开发中')}>
              <Text style={styles.settingItemText}>屏幕亮度</Text>
              <Text style={styles.settingItemArrow}>›</Text>
            </Pressable>
          </View>
        </View>

        {/* 动画设置 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.animation}</Text>
          <View style={styles.sectionContent}>
            <View style={styles.settingItem}>
              <Text style={styles.settingItemText}>{t.reduceMotion}</Text>
              <Switch
                value={false}
                onValueChange={() => {}}
                trackColor={{ false: '#e0e0e0', true: '#4CAF50' }}
                thumbColor={'#f4f3f4'}
              />
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
    color: '#999',
    marginRight: 8,
  },
  settingItemArrow: {
    fontSize: 20,
    color: '#999',
  },
})
