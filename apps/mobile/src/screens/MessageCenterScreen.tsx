import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, Pressable, ScrollView, FlatList } from 'react-native'
import { supabase } from '../lib/supabase'
import MessageDetailScreen from './MessageDetailScreen'

interface Message {
  id: string;
  content: string;
  category: string;
  audience_type: string;
  user_id: string;
  created_by: string;
  created_at: string;
  is_read: boolean;
}

type MessageCategory = 'all' | 'system' | 'investment';

export default function MessageCenterScreen({ lang, userInfo, onClose, initialCategory }: { lang?: 'zh' | 'en'; userInfo: any; onClose: () => void; initialCategory?: 'all' | 'system' | 'investment' }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<MessageCategory>(initialCategory || 'all');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  // 获取消息列表
  const fetchMessages = async () => {
    try {
      setLoading(true);
      if (!userInfo || !userInfo.id || !supabase) {
        return;
      }

      // 获取所有消息
      const { data: messagesData, error: messagesError } = await supabase
        .from('system_messages')
        .select('*')
        .or(`audience_type.eq.all,user_id.eq.${userInfo.id}`)
        .order('created_at', { ascending: false });

      if (messagesError) {
        console.error('获取消息列表失败:', messagesError);
        return;
      }

      // 获取消息状态
      const { data: statusData, error: statusError } = await supabase
        .from('system_messages_status')
        .select('message_id, is_read')
        .eq('user_id', userInfo.id);

      if (statusError) {
        console.error('获取消息状态失败:', statusError);
        return;
      }

      // 合并消息和状态
      const statusMap = new Map(statusData?.map(item => [item.message_id, item.is_read]) || []);
      const mergedMessages = (messagesData || []).map(msg => ({
        ...msg,
        is_read: statusMap.get(msg.id) || false
      }));

      setMessages(mergedMessages);
    } catch (error) {
      console.error('获取消息失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 标记消息为已读
  const markAsRead = async (messageId: string) => {
    try {
      if (!userInfo || !userInfo.id || !supabase) {
        return;
      }

      // 使用 upsert 操作，无论记录是否存在都能正确更新
      const { error } = await supabase
        .from('system_messages_status')
        .upsert(
          {
            message_id: messageId,
            user_id: userInfo.id,
            is_read: true,
            read_at: new Date().toISOString()
          },
          {
            onConflict: 'message_id,user_id' // 指定唯一约束
          }
        );

      if (error) {
        console.error('标记消息为已读失败:', error);
        return;
      }

      // 更新本地状态
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, is_read: true } : msg
      ));
    } catch (error) {
      console.error('标记消息为已读异常:', error);
    }
  };

  // 标记所有消息为已读
  const markAllAsRead = async () => {
    try {
      if (!userInfo || !userInfo.id || !supabase) {
        return;
      }

      // 获取当前分类的未读消息
      const filteredMessages = messages.filter(msg => {
        if (activeCategory === 'all') return !msg.is_read;
        return msg.category === activeCategory && !msg.is_read;
      });

      // 批量更新消息状态
      for (const msg of filteredMessages) {
        await markAsRead(msg.id);
      }
    } catch (error) {
      console.error('标记所有消息为已读失败:', error);
    }
  };

  // 过滤消息
  const filteredMessages = messages.filter(msg => {
    if (activeCategory === 'all') return true;
    return msg.category === activeCategory;
  });

  // 获取分类名称
  const getCategoryName = (category: MessageCategory) => {
    if (lang === 'en') {
      switch (category) {
        case 'all': return 'All';
        case 'system': return 'System';
        case 'investment': return 'Investment';
        default: return 'All';
      }
    }
    switch (category) {
      case 'all': return '全部信息';
      case 'system': return '系统通知';
      case 'investment': return '投资提示';
      default: return '全部信息';
    }
  };

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
      minute: '2-digit'
    });
  };

  // 处理消息点击
  const handleMessagePress = async (message: Message) => {
    // 先标记为已读
    if (!message.is_read) {
      await markAsRead(message.id);
    }
    // 然后跳转到详情页
    setSelectedMessage(message);
  };

  // 渲染消息项
  const renderMessageItem = ({ item }: { item: Message }) => (
    <Pressable 
      style={[styles.messageItem, !item.is_read && styles.unreadMessage]} 
      onPress={() => handleMessagePress(item)}
    >
      <View style={styles.messageLeft}>
        <View style={styles.messageIconContainer}>
          <Text style={styles.messageIcon}>
            {item.category === 'system' ? '📢' : '💡'}
          </Text>
          {!item.is_read && <View style={styles.unreadDot}></View>}
        </View>
        <View style={styles.messageContent}>
          <Text style={styles.messageTitle}>{getMessageTitle(item.category)}</Text>
          <Text style={styles.messageText} numberOfLines={2} ellipsizeMode="tail">{item.content}</Text>
          <Text style={styles.messageTime}>{formatTime(item.created_at)}</Text>
        </View>
      </View>
      <Text style={styles.messageArrow}>›</Text>
    </Pressable>
  );

  // 渲染分类标签
  const renderCategoryTab = (category: MessageCategory) => (
    <Pressable 
      style={[styles.categoryTab, activeCategory === category && styles.activeCategoryTab]} 
      onPress={() => setActiveCategory(category)}
    >
      <Text style={[styles.categoryTabText, activeCategory === category && styles.activeCategoryTabText]}>
        {getCategoryName(category)}
      </Text>
    </Pressable>
  );

  useEffect(() => {
    fetchMessages();
  }, [userInfo]);

  // 如果有选中的消息，显示详情页
  if (selectedMessage) {
    return (
      <MessageDetailScreen
        lang={lang}
        message={selectedMessage}
        onClose={() => setSelectedMessage(null)}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* 头部 */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={onClose}>
          <Text style={styles.backButtonText}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{lang === 'en' ? 'Message Center' : '消息中心'}</Text>
        <Pressable style={styles.markAllButton} onPress={markAllAsRead}>
          <Text style={styles.markAllButtonText}>{lang === 'en' ? 'Mark All Read' : '全部已读'}</Text>
        </Pressable>
      </View>

      {/* 分类标签 */}
      <View style={styles.categoryTabs}>
        {renderCategoryTab('all')}
        {renderCategoryTab('system')}
        {renderCategoryTab('investment')}
      </View>

      {/* 消息列表 */}
      <FlatList
        data={filteredMessages}
        renderItem={renderMessageItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messageList}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {loading ? 
                (lang === 'en' ? 'Loading...' : '加载中...') : 
                (lang === 'en' ? 'No messages found' : '暂无消息')
              }
            </Text>
          </View>
        }
        onRefresh={fetchMessages}
        refreshing={loading}
      />
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
  headerTitle: {
    color: '#333',
    fontSize: 18,
    fontWeight: '600',
  },
  markAllButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  markAllButtonText: {
    color: '#0a84ff',
    fontSize: 14,
    fontWeight: '500',
  },
  categoryTabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  categoryTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 20,
    marginHorizontal: 4,
  },
  activeCategoryTab: {
    backgroundColor: '#e6f4ff',
  },
  categoryTabText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  activeCategoryTabText: {
    color: '#0a84ff',
    fontWeight: '600',
  },
  messageList: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  messageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  unreadMessage: {
    backgroundColor: '#f5f9ff',
    borderLeftWidth: 3,
    borderLeftColor: '#0a84ff',
  },
  messageLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  messageIconContainer: {
    position: 'relative',
    marginRight: 12,
    marginTop: 2,
  },
  messageIcon: {
    fontSize: 20,
  },
  unreadDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  messageContent: {
    flex: 1,
  },
  messageTitle: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  messageText: {
    color: '#666',
    fontSize: 14,
    marginBottom: 4,
    lineHeight: 20,
  },
  messageTime: {
    color: '#999',
    fontSize: 12,
  },
  messageArrow: {
    color: '#999',
    fontSize: 20,
    marginLeft: 8,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#999',
    fontSize: 16,
  },
})