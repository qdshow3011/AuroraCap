import React from 'react'
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native'

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
  // 获取消息标题
  const getMessageTitle = (category: string) => {
    if (lang === 'en') {
      switch (category) {
        case 'system': return 'System Notification';
        case 'investment': return 'Investment Tip';
        default: return 'Notification';
      }
    }
    switch (category) {
      case 'system': return '系统通知';
      case 'investment': return '投资提示';
      default: return '通知';
    }
  };

  // 格式化时间
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString(lang === 'zh' ? 'zh-CN' : 'en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <View style={styles.container}>
      {/* 头部 */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={onClose}>
          <Text style={styles.backButtonText}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{lang === 'en' ? 'Message Detail' : '消息详情'}</Text>
        <View style={styles.placeholderButton} />
      </View>

      {/* 消息内容 */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.messageHeader}>
          <View style={styles.messageIconContainer}>
            <Text style={styles.messageIcon}>
              {message.category === 'system' ? '📢' : '💡'}
            </Text>
          </View>
          <Text style={styles.messageTitle}>{getMessageTitle(message.category)}</Text>
        </View>

        <View style={styles.messageInfo}>
          <Text style={styles.messageTime}>{formatTime(message.created_at)}</Text>
          <View style={[styles.statusBadge, message.is_read && styles.readStatus]}>
            <Text style={styles.statusText}>
              {message.is_read ? (lang === 'en' ? 'Read' : '已读') : (lang === 'en' ? 'Unread' : '未读')}
            </Text>
          </View>
        </View>

        <View style={styles.messageContent}>
          <Text style={styles.contentText}>{message.content}</Text>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: '#333',
    fontSize: 24,
    fontWeight: '600',
  },
  placeholderButton: {
    width: 40,
  },
  headerTitle: {
    color: '#333',
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  messageIconContainer: {
    marginRight: 12,
  },
  messageIcon: {
    fontSize: 24,
  },
  messageTitle: {
    color: '#333',
    fontSize: 20,
    fontWeight: '600',
  },
  messageInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  messageTime: {
    color: '#666',
    fontSize: 14,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#fef3c7',
  },
  readStatus: {
    backgroundColor: '#d1fae5',
  },
  statusText: {
    color: '#92400e',
    fontSize: 12,
    fontWeight: '500',
  },
  readStatusText: {
    color: '#065f46',
  },
  messageContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  contentText: {
    color: '#333',
    fontSize: 16,
    lineHeight: 24,
  },
})