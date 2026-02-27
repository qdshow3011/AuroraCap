import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, Pressable, FlatList, StatusBar, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
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
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<MessageCategory>(initialCategory || 'all');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  const t = lang === 'zh' ? {
    title: '消息中心',
    all: '全部',
    system: '系统',
    investment: '投资',
    markAllRead: '全部已读',
    noMessages: '暂无消息',
    loading: '加载中...',
    unreadCount: '条未读',
  } : {
    title: 'Message Center',
    all: 'All',
    system: 'System',
    investment: 'Investment',
    markAllRead: 'Mark All Read',
    noMessages: 'No messages',
    loading: 'Loading...',
    unreadCount: 'unread',
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);
      if (!userInfo || !userInfo.id || !supabase) {
        return;
      }

      const { data: messagesData, error: messagesError } = await supabase
        .from('system_messages')
        .select('*')
        .or(`audience_type.eq.all,user_id.eq.${userInfo.id}`)
        .order('created_at', { ascending: false });

      if (messagesError) {
        console.error('获取消息列表失败:', messagesError);
        return;
      }

      const { data: statusData, error: statusError } = await supabase
        .from('system_messages_status')
        .select('message_id, is_read')
        .eq('user_id', userInfo.id);

      if (statusError) {
        console.error('获取消息状态失败:', statusError);
        return;
      }

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

  const markAsRead = async (messageId: string) => {
    try {
      if (!userInfo || !userInfo.id || !supabase) return;

      const { error } = await supabase
        .from('system_messages_status')
        .upsert(
          {
            message_id: messageId,
            user_id: userInfo.id,
            is_read: true,
            read_at: new Date().toISOString()
          },
          { onConflict: 'message_id,user_id' }
        );

      if (error) {
        console.error('标记消息为已读失败:', error);
        return;
      }

      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, is_read: true } : msg
      ));
    } catch (error) {
      console.error('标记消息为已读异常:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      if (!userInfo || !userInfo.id || !supabase) return;

      const filteredMessages = messages.filter(msg => {
        if (activeCategory === 'all') return !msg.is_read;
        return msg.category === activeCategory && !msg.is_read;
      });

      for (const msg of filteredMessages) {
        await markAsRead(msg.id);
      }
    } catch (error) {
      console.error('标记所有消息为已读失败:', error);
    }
  };

  const filteredMessages = messages.filter(msg => {
    if (activeCategory === 'all') return true;
    return msg.category === activeCategory;
  });

  const unreadCount = messages.filter(msg => !msg.is_read).length;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'system': return 'notifications';
      case 'investment': return 'trending-up';
      default: return 'mail';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'system': return '#FF9800';
      case 'investment': return '#4CAF50';
      default: return '#1A4EA2';
    }
  };

  const getCategoryBgColor = (category: string) => {
    switch (category) {
      case 'system': return '#FFF3E0';
      case 'investment': return '#E8F5E9';
      default: return '#E3F2FD';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return lang === 'zh' ? '昨天' : 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString('zh-CN', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
    }
  };

  const handleMessagePress = async (message: Message) => {
    if (!message.is_read) {
      await markAsRead(message.id);
    }
    setSelectedMessage(message);
  };

  const renderMessageItem = ({ item }: { item: Message }) => (
    <TouchableOpacity 
      style={[styles.messageItem, !item.is_read && styles.unreadMessage]} 
      onPress={() => handleMessagePress(item)}
      activeOpacity={0.8}
    >
      <View style={[styles.iconContainer, { backgroundColor: getCategoryBgColor(item.category) }]}>
        <Ionicons name={getCategoryIcon(item.category) as any} size={24} color={getCategoryColor(item.category)} />
        {!item.is_read && <View style={styles.unreadDot} />}
      </View>
      <View style={styles.messageContent}>
        <View style={styles.messageHeader}>
          <Text style={styles.messageTitle}>
            {lang === 'zh' 
              ? (item.category === 'system' ? '系统通知' : '投资提示')
              : (item.category === 'system' ? 'System' : 'Investment')
            }
          </Text>
          <Text style={styles.messageTime}>{formatTime(item.created_at)}</Text>
        </View>
        <Text style={styles.messageText} numberOfLines={2} ellipsizeMode="tail">{item.content}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#CCC" />
    </TouchableOpacity>
  );

  const renderCategoryTab = (category: MessageCategory, label: string, icon: string) => {
    const isActive = activeCategory === category;
    const count = category === 'all' 
      ? messages.filter(m => !m.is_read).length
      : messages.filter(m => m.category === category && !m.is_read).length;
    
    return (
      <TouchableOpacity 
        style={[styles.categoryTab, isActive && styles.activeCategoryTab]} 
        onPress={() => setActiveCategory(category)}
        activeOpacity={0.8}
      >
        <Ionicons name={icon as any} size={18} color={isActive ? '#1A4EA2' : '#999'} style={styles.categoryIcon} />
        <Text style={[styles.categoryTabText, isActive && styles.activeCategoryTabText]}>{label}</Text>
        {count > 0 && (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{count > 99 ? '99+' : count}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  useEffect(() => {
    fetchMessages();
  }, [userInfo]);

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
      <StatusBar barStyle="light-content" backgroundColor="#1A4EA2" />
      
      <LinearGradient
        colors={['#1A4EA2', '#0D3A8A']}
        style={[styles.header, { paddingTop: insets.top > 0 ? insets.top : 16 }]}
      >
        <TouchableOpacity style={styles.backButton} onPress={onClose}>
          <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.title}</Text>
        <TouchableOpacity style={styles.markAllButton} onPress={markAllAsRead}>
          <Text style={styles.markAllButtonText}>{t.markAllRead}</Text>
        </TouchableOpacity>
      </LinearGradient>

      <View style={styles.statsContainer}>
        <LinearGradient
          colors={['#1A4EA2', '#0D3A8A']}
          style={styles.statsCard}
        >
          <Ionicons name="mail-unread" size={32} color="#FFFFFF" />
          <Text style={styles.statsNumber}>{unreadCount}</Text>
          <Text style={styles.statsLabel}>{lang === 'zh' ? '未读消息' : 'Unread'}</Text>
        </LinearGradient>
        <LinearGradient
          colors={['#4CAF50', '#388E3C']}
          style={styles.statsCard}
        >
          <Ionicons name="mail" size={32} color="#FFFFFF" />
          <Text style={styles.statsNumber}>{messages.length}</Text>
          <Text style={styles.statsLabel}>{lang === 'zh' ? '全部消息' : 'Total'}</Text>
        </LinearGradient>
      </View>

      <View style={styles.categoryTabs}>
        {renderCategoryTab('all', t.all, 'mail')}
        {renderCategoryTab('system', t.system, 'notifications')}
        {renderCategoryTab('investment', t.investment, 'trending-up')}
      </View>

      <FlatList
        data={filteredMessages}
        renderItem={renderMessageItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messageList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="mail-outline" size={64} color="#CCC" />
            <Text style={styles.emptyText}>
              {loading ? t.loading : t.noMessages}
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
  markAllButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  markAllButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  statsCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  statsNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 8,
  },
  statsLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  categoryTabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  categoryTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F5F7FA',
    marginHorizontal: 4,
  },
  activeCategoryTab: {
    backgroundColor: '#E3F2FD',
  },
  categoryIcon: {
    marginRight: 6,
  },
  categoryTabText: {
    color: '#999',
    fontSize: 14,
    fontWeight: '500',
  },
  activeCategoryTabText: {
    color: '#1A4EA2',
    fontWeight: '600',
  },
  categoryBadge: {
    backgroundColor: '#F44336',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
    paddingHorizontal: 4,
  },
  categoryBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  messageList: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  messageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  unreadMessage: {
    backgroundColor: '#F5F9FF',
    borderLeftWidth: 3,
    borderLeftColor: '#1A4EA2',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  unreadDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F44336',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  messageContent: {
    flex: 1,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  messageTitle: {
    color: '#333',
    fontSize: 15,
    fontWeight: '600',
  },
  messageTime: {
    color: '#999',
    fontSize: 12,
  },
  messageText: {
    color: '#666',
    fontSize: 14,
    lineHeight: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: '#999',
    fontSize: 14,
    marginTop: 16,
  },
});
