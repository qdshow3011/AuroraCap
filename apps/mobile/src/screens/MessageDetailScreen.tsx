import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

interface MessageDetailProps {
  lang?: 'zh' | 'en';
  message: {
    id: string;
    content: string;
    category: string;
    created_at: string;
    is_read: boolean;
  };
  onClose: () => void;
}

export default function MessageDetailScreen({ lang, message, onClose }: MessageDetailProps) {
  const insets = useSafeAreaInsets();

  const t = lang === 'zh' ? {
    title: '消息详情',
    back: '返回',
    systemNotification: '系统通知',
    investmentTip: '投资提示',
    notification: '通知',
    read: '已读',
    unread: '未读',
    sentAt: '发送时间',
    category: '分类',
  } : {
    title: 'Message Detail',
    back: 'Back',
    systemNotification: 'System Notification',
    investmentTip: 'Investment Tip',
    notification: 'Notification',
    read: 'Read',
    unread: 'Unread',
    sentAt: 'Sent At',
    category: 'Category',
  };

  const getCategoryInfo = (category: string) => {
    switch (category) {
      case 'system':
        return {
          title: t.systemNotification,
          icon: 'notifications',
          color: '#FF9800',
          bgColor: '#FFF3E0',
        };
      case 'investment':
        return {
          title: t.investmentTip,
          icon: 'trending-up',
          color: '#4CAF50',
          bgColor: '#E8F5E9',
        };
      default:
        return {
          title: t.notification,
          icon: 'mail',
          color: '#1A4EA2',
          bgColor: '#E3F2FD',
        };
    }
  };

  const categoryInfo = getCategoryInfo(message.category);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString(lang === 'zh' ? 'zh-CN' : 'en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A4EA2" />

      <LinearGradient
        colors={['#1A4EA2', '#0D3A8A']}
        style={[styles.header, { paddingTop: insets.top > 0 ? insets.top : 16 }]}
      >
        <TouchableOpacity style={styles.backButton} onPress={onClose}>
          <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.title}</Text>
        <View style={styles.placeholder} />
      </LinearGradient>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* 消息头部卡片 */}
        <View style={styles.headerCard}>
          <LinearGradient
            colors={[categoryInfo.bgColor, '#FFFFFF']}
            style={styles.headerCardGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={[styles.iconContainer, { backgroundColor: categoryInfo.bgColor }]}>
              <Ionicons name={categoryInfo.icon as any} size={32} color={categoryInfo.color} />
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.categoryTitle}>{categoryInfo.title}</Text>
              <View style={[styles.statusBadge, message.is_read ? styles.readBadge : styles.unreadBadge]}>
                <Text style={[styles.statusText, message.is_read ? styles.readText : styles.unreadText]}>
                  {message.is_read ? t.read : t.unread}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* 消息信息卡片 */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoIconContainer}>
              <Ionicons name="time-outline" size={20} color="#1A4EA2" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>{t.sentAt}</Text>
              <Text style={styles.infoValue}>{formatTime(message.created_at)}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoIconContainer}>
              <Ionicons name="pricetag-outline" size={20} color="#1A4EA2" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>{t.category}</Text>
              <Text style={styles.infoValue}>{categoryInfo.title}</Text>
            </View>
          </View>
        </View>

        {/* 消息内容卡片 */}
        <View style={styles.contentCard}>
          <View style={styles.contentHeader}>
            <Ionicons name="document-text-outline" size={20} color="#1A4EA2" />
            <Text style={styles.contentTitle}>{lang === 'zh' ? '消息内容' : 'Message Content'}</Text>
          </View>
          <Text style={styles.contentText}>{message.content}</Text>
        </View>
      </ScrollView>

      {/* 底部操作栏 */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.backToListButton} onPress={onClose}>
          <LinearGradient
            colors={['#1A4EA2', '#0D3A8A']}
            style={styles.backToListGradient}
          >
            <Ionicons name="arrow-back" size={18} color="#FFFFFF" />
            <Text style={styles.backToListText}>{t.back}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  headerCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerInfo: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  readBadge: {
    backgroundColor: '#E8F5E9',
  },
  unreadBadge: {
    backgroundColor: '#FFF3E0',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  readText: {
    color: '#4CAF50',
  },
  unreadText: {
    color: '#FF9800',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 4,
  },
  contentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  contentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  contentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  contentText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 24,
  },
  footer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  backToListButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  backToListGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  backToListText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
