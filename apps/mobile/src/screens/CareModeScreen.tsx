import { View, Text, StyleSheet, Pressable, Switch, ScrollView, Alert } from 'react-native'
import { useState } from 'react'

export default function CareModeScreen({ lang = 'zh', onClose }: { lang?: 'zh' | 'en'; onClose?: () => void }) {
  // 状态管理
  const [careModeEnabled, setCareModeEnabled] = useState(false)
  const [largeFontEnabled, setLargeFontEnabled] = useState(false)
  const [highContrastEnabled, setHighContrastEnabled] = useState(false)
  const [voiceAssistEnabled, setVoiceAssistEnabled] = useState(false)

  // 语言翻译
  const t = lang === 'zh' ? {
    title: '关怀模式',
    careMode: '关怀模式',
    careModeDesc: '专为老年用户设计的简化界面',
    largeFont: '大字体',
    largeFontDesc: '增大界面字体，提高可读性',
    highContrast: '高对比度',
    highContrastDesc: '提高界面对比度，减轻视觉疲劳',
    voiceAssist: '语音辅助',
    voiceAssistDesc: '启用语音播报和语音指令',
    simplifiedInterface: '简化界面',
    simplifiedInterfaceDesc: '减少界面元素，突出核心功能',
    emergencyContact: '紧急联系人',
    emergencyContactDesc: '设置紧急联系人',
    quickAccess: '快捷访问',
    quickAccessDesc: '常用功能一键直达',
    tips: '使用提示',
    tipsContent: '1. 关怀模式下界面会变得更简洁\n2. 字体和按钮会变大\n3. 操作流程会更简单\n4. 可随时关闭关怀模式'
  } : {
    title: 'Care Mode',
    careMode: 'Care Mode',
    careModeDesc: 'Simplified interface for elderly users',
    largeFont: 'Large Font',
    largeFontDesc: 'Increase font size for better readability',
    highContrast: 'High Contrast',
    highContrastDesc: 'Improve contrast to reduce eye strain',
    voiceAssist: 'Voice Assist',
    voiceAssistDesc: 'Enable voice broadcast and voice commands',
    simplifiedInterface: 'Simplified Interface',
    simplifiedInterfaceDesc: 'Reduce interface elements, highlight core functions',
    emergencyContact: 'Emergency Contact',
    emergencyContactDesc: 'Set emergency contact',
    quickAccess: 'Quick Access',
    quickAccessDesc: 'One-touch access to common functions',
    tips: 'Usage Tips',
    tipsContent: '1. Interface becomes simpler in Care Mode\n2. Fonts and buttons become larger\n3. Operation流程 becomes easier\n4. Care Mode can be turned off at any time'
  }

  // 启用关怀模式的处理
  const handleCareModeToggle = (value: boolean) => {
    setCareModeEnabled(value)
    if (value) {
      // 启用关怀模式时，默认开启所有辅助功能
      setLargeFontEnabled(true)
      setHighContrastEnabled(true)
      setVoiceAssistEnabled(true)
      Alert.alert('提示', '关怀模式已启用，界面将变得更简洁易用')
    } else {
      // 关闭关怀模式时，询问是否同时关闭所有辅助功能
      Alert.alert(
        '提示',
        '确定要关闭关怀模式吗？',
        [
          {
            text: '取消',
            style: 'cancel',
            onPress: () => setCareModeEnabled(true)
          },
          {
            text: '确定',
            onPress: () => {
              setLargeFontEnabled(false)
              setHighContrastEnabled(false)
              setVoiceAssistEnabled(false)
            }
          }
        ]
      )
    }
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
        {/* 关怀模式总开关 */}
        <View style={styles.section}>
          <View style={styles.careModeHeader}>
            <View>
              <Text style={styles.careModeTitle}>{t.careMode}</Text>
              <Text style={styles.careModeDescription}>{t.careModeDesc}</Text>
            </View>
            <Switch
              value={careModeEnabled}
              onValueChange={handleCareModeToggle}
              trackColor={{ false: '#e0e0e0', true: '#4CAF50' }}
              thumbColor={careModeEnabled ? '#fff' : '#f4f3f4'}
              style={styles.careModeSwitch}
            />
          </View>
        </View>

        {/* 辅助功能设置 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>辅助功能</Text>
          <View style={styles.sectionContent}>
            <View style={styles.settingItem}>
              <View style={styles.settingItemLeft}>
                <Text style={styles.settingItemText}>{t.largeFont}</Text>
                <Text style={styles.settingItemDescription}>{t.largeFontDesc}</Text>
              </View>
              <Switch
                value={largeFontEnabled}
                onValueChange={setLargeFontEnabled}
                trackColor={{ false: '#e0e0e0', true: '#4CAF50' }}
                thumbColor={largeFontEnabled ? '#fff' : '#f4f3f4'}
              />
            </View>
            <View style={styles.settingItem}>
              <View style={styles.settingItemLeft}>
                <Text style={styles.settingItemText}>{t.highContrast}</Text>
                <Text style={styles.settingItemDescription}>{t.highContrastDesc}</Text>
              </View>
              <Switch
                value={highContrastEnabled}
                onValueChange={setHighContrastEnabled}
                trackColor={{ false: '#e0e0e0', true: '#4CAF50' }}
                thumbColor={highContrastEnabled ? '#fff' : '#f4f3f4'}
              />
            </View>
            <View style={styles.settingItem}>
              <View style={styles.settingItemLeft}>
                <Text style={styles.settingItemText}>{t.voiceAssist}</Text>
                <Text style={styles.settingItemDescription}>{t.voiceAssistDesc}</Text>
              </View>
              <Switch
                value={voiceAssistEnabled}
                onValueChange={setVoiceAssistEnabled}
                trackColor={{ false: '#e0e0e0', true: '#4CAF50' }}
                thumbColor={voiceAssistEnabled ? '#fff' : '#f4f3f4'}
              />
            </View>
            <Pressable style={styles.settingItem} onPress={() => Alert.alert('提示', '简化界面功能开发中')}>
              <View style={styles.settingItemLeft}>
                <Text style={styles.settingItemText}>{t.simplifiedInterface}</Text>
                <Text style={styles.settingItemDescription}>{t.simplifiedInterfaceDesc}</Text>
              </View>
              <Text style={styles.settingItemArrow}>›</Text>
            </Pressable>
          </View>
        </View>

        {/* 其他设置 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>其他设置</Text>
          <View style={styles.sectionContent}>
            <Pressable style={styles.settingItem} onPress={() => Alert.alert('提示', '紧急联系人功能开发中')}>
              <View style={styles.settingItemLeft}>
                <Text style={styles.settingItemText}>{t.emergencyContact}</Text>
                <Text style={styles.settingItemDescription}>{t.emergencyContactDesc}</Text>
              </View>
              <Text style={styles.settingItemArrow}>›</Text>
            </Pressable>
            <Pressable style={styles.settingItem} onPress={() => Alert.alert('提示', '快捷访问功能开发中')}>
              <View style={styles.settingItemLeft}>
                <Text style={styles.settingItemText}>{t.quickAccess}</Text>
                <Text style={styles.settingItemDescription}>{t.quickAccessDesc}</Text>
              </View>
              <Text style={styles.settingItemArrow}>›</Text>
            </Pressable>
          </View>
        </View>

        {/* 使用提示 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.tips}</Text>
          <View style={styles.tipsContainer}>
            <Text style={styles.tipsContent}>{t.tipsContent}</Text>
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
  careModeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
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
  },
  careModeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  careModeDescription: {
    fontSize: 14,
    color: '#666',
  },
  careModeSwitch: {
    transform: [{ scale: 1.2 }],
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
  settingItemLeft: {
    flex: 1,
    marginRight: 16,
  },
  settingItemText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    marginBottom: 4,
  },
  settingItemDescription: {
    fontSize: 12,
    color: '#999',
  },
  settingItemArrow: {
    fontSize: 20,
    color: '#999',
  },
  tipsContainer: {
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
  tipsContent: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
})
