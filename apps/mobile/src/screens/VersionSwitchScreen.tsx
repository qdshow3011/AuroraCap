import React, { useState } from 'react'
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native'

interface VersionSwitchScreenProps {
  lang?: 'zh' | 'en';
  currentVersion: 'standard' | 'simple' | 'premium';
  onClose: () => void;
  onVersionChange: (version: 'standard' | 'simple' | 'premium') => void;
}

export default function VersionSwitchScreen({ 
  lang = 'zh', 
  currentVersion, 
  onClose, 
  onVersionChange 
}: VersionSwitchScreenProps) {
  // 状态管理
  const [selectedVersion, setSelectedVersion] = useState< 'standard' | 'simple' | 'premium' >(currentVersion)

  // 语言翻译
  const t = lang === 'zh' ? {
    title: '版本切换',
    back: '返回',
    standard: '标准版',
    standardDesc: '功能全面覆盖，一站式服务',
    simple: '老人版',
    simpleDesc: '更大字体，简洁易懂',
    premium: '合伙人版',
    premiumDesc: '合伙人专属功能，更多权益',
    confirm: '确认选择'
  } : {
    title: 'Version Switch',
    back: 'Back',
    standard: 'Standard Version',
    standardDesc: 'Comprehensive features, one-stop service',
    simple: 'Elderly Version',
    simpleDesc: 'Larger fonts, easy to understand',
    premium: 'Partner Version',
    premiumDesc: 'Partner exclusive features, more benefits',
    confirm: 'Confirm Selection'
  }

  // 版本选项数据
  const versionOptions = [
    {
      key: 'standard' as const,
      title: t.standard,
      description: t.standardDesc,
      icon: '📱',
      color: '#4a90e2'
    },
    {
      key: 'simple' as const,
      title: t.simple,
      description: t.simpleDesc,
      icon: '🔤',
      color: '#50e3c2'
    },
    {
      key: 'premium' as const,
      title: t.premium,
      description: t.premiumDesc,
      icon: '💎',
      color: '#f5a623'
    }
  ]

  // 处理确认选择
  const handleConfirmSelection = () => {
    onVersionChange(selectedVersion)
  }

  return (
    <View style={styles.container}>
      {/* 顶部导航栏 */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={onClose}>
          <Text style={styles.backButtonText}>← {t.back}</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{t.title}</Text>
        <View style={styles.headerRight} />
      </View>

      {/* 主要内容 */}
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 版本选项列表 */}
        <View style={styles.versionList}>
          {versionOptions.map((version) => (
            <Pressable
              key={version.key}
              style={[
                styles.versionCard,
                selectedVersion === version.key && styles.selectedVersionCard,
                { borderColor: version.color }
              ]}
              onPress={() => setSelectedVersion(version.key)}
            >
              {/* 版本图标和标题 */}
              <View style={styles.versionHeader}>
                <View style={[styles.iconContainer, { backgroundColor: version.color + '20' }]}>
                  <Text style={styles.versionIcon}>{version.icon}</Text>
                </View>
                <Text style={styles.versionTitle}>{version.title}</Text>
                {selectedVersion === version.key && (
                  <View style={[styles.checkmarkContainer, { backgroundColor: version.color }]}>
                    <Text style={styles.checkmarkText}>✓</Text>
                  </View>
                )}
              </View>

              {/* 版本描述 */}
              <Text style={styles.versionDescription}>{version.description}</Text>

              {/* 选中状态指示器 */}
              {selectedVersion === version.key && (
                <View style={[styles.selectedIndicator, { backgroundColor: version.color }]} />
              )}
            </Pressable>
          ))}
        </View>

        {/* 确认按钮 */}
        <Pressable 
          style={styles.confirmButton} 
          onPress={handleConfirmSelection}
        >
          <Text style={styles.confirmButtonText}>{t.confirm}</Text>
        </Pressable>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  backButton: {
    padding: 8
  },
  backButtonText: {
    fontSize: 16,
    color: '#4a90e2'
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333'
  },
  headerRight: {
    width: 40
  },
  scrollView: {
    flex: 1
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32
  },
  versionList: {
    gap: 16,
    marginBottom: 24
  },
  versionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
    overflow: 'hidden'
  },
  selectedVersionCard: {
    borderWidth: 2,
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5
  },
  versionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  versionIcon: {
    fontSize: 24
  },
  versionTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: '#333'
  },
  checkmarkContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  checkmarkText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  versionDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22
  },
  selectedIndicator: {
      position: 'absolute',
      top: 0,
      right: 0,
      width: 8,
      height: '100%',
      borderRadius: [0, 12, 12, 0]
    },
  confirmButton: {
    backgroundColor: '#4a90e2',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4a90e2',
    shadowOffset: {
      width: 0,
      height: 4
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600'
  }
})