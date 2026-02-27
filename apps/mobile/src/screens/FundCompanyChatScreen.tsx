import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform, Image, TouchableOpacity, TouchableWithoutFeedback, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';

interface Message {
  id: string;
  text: string;
  sender: 'customer' | 'company';
  timestamp: Date;
  messageType?: 'text' | 'image';
  imageUrl?: string;
  isRead?: boolean;
  customerId?: string;
  customerName?: string;
  customerAvatar?: string;
}

interface ChatSession {
  id: string;
  customerId: string;
  customerName: string;
  customerAvatar: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
}

export default function FundCompanyChatScreen({
  lang = 'zh',
  userInfo,
  onClose
}: {
  lang?: 'zh' | 'en';
  userInfo?: any;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();

  // 状态管理
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const scrollViewRef = useRef<ScrollView>(null);

  // 语言翻译
  const t = lang === 'zh' ? {
    title: '客户对话',
    back: '返回',
    noSessions: '暂无客户对话',
    noMessages: '暂无消息',
    placeholder: '请输入回复...',
    send: '发送',
    today: '今天',
    yesterday: '昨天',
    loading: '加载中...',
    error: '错误',
    success: '成功'
  } : {
    title: 'Customer Chat',
    back: 'Back',
    noSessions: 'No customer conversations',
    noMessages: 'No messages',
    placeholder: 'Type a reply...',
    send: 'Send',
    today: 'Today',
    yesterday: 'Yesterday',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success'
  };

  // 获取聊天会话列表
  const fetchChatSessions = useCallback(async () => {
    try {
      if (!supabase || !userInfo?.id) {
        setChatSessions([]);
        return;
      }

      // 获取所有与基金公司相关的聊天会话
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('chat_sessions')
        .select(`
          id,
          user_id,
          last_message_at,
          users:user_id (id, name, avatar)
        `)
        .eq('agent_id', userInfo.id)
        .eq('status', 'active')
        .order('last_message_at', { ascending: false });

      if (sessionsError) {
        console.error('获取会话列表失败:', sessionsError);
        return;
      }

      // 获取每个会话的最后一条消息和未读数
      const sessions: ChatSession[] = [];
      for (const session of sessionsData || []) {
        // 获取最后一条消息
        const { data: lastMessageData } = await supabase
          .from('messages')
          .select('content, created_at')
          .eq('chat_session_id', session.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // 获取未读消息数
        const { data: unreadData } = await supabase
          .from('messages')
          .select('id')
          .eq('chat_session_id', session.id)
          .eq('sender_type', 'user')
          .eq('is_read', false);

        sessions.push({
          id: session.id,
          customerId: session.user_id,
          customerName: session.users?.name || '客户',
          customerAvatar: session.users?.avatar || 'https://picsum.photos/200/200',
          lastMessage: lastMessageData?.content || '暂无消息',
          lastMessageTime: new Date(session.last_message_at || Date.now()),
          unreadCount: unreadData?.length || 0
        });
      }

      setChatSessions(sessions);
    } catch (error) {
      console.error('获取会话列表异常:', error);
    }
  }, [userInfo]);

  // 获取特定会话的消息
  const fetchMessages = useCallback(async (sessionId: string) => {
    try {
      if (!supabase) return;

      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          sender_type,
          created_at,
          message_type,
          users:sender_id (id, name, avatar)
        `)
        .eq('chat_session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('获取消息失败:', error);
        return;
      }

      const formattedMessages: Message[] = (data || []).map((msg: any) => ({
        id: msg.id,
        text: msg.content,
        sender: msg.sender_type === 'user' ? 'customer' : 'company',
        timestamp: new Date(msg.created_at),
        messageType: msg.message_type || 'text',
        customerName: msg.users?.name,
        customerAvatar: msg.users?.avatar
      }));

      setMessages(formattedMessages);

      // 标记消息为已读
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('chat_session_id', sessionId)
        .eq('sender_type', 'user')
        .eq('is_read', false);

    } catch (error) {
      console.error('获取消息异常:', error);
    }
  }, []);

  // 初始加载
  useEffect(() => {
    fetchChatSessions().then(() => setLoading(false));
  }, [fetchChatSessions]);

  // 选择会话时加载消息
  useEffect(() => {
    if (selectedSession) {
      fetchMessages(selectedSession.id);
      // 刷新会话列表以更新未读数
      fetchChatSessions();
    }
  }, [selectedSession, fetchMessages, fetchChatSessions]);

  // 自动滚动到底部
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // 发送消息
  const handleSendMessage = async () => {
    if (!inputText.trim() || !selectedSession || !supabase || !userInfo?.id) return;

    const messageText = inputText.trim();
    setInputText('');

    try {
      // 保存消息到数据库
      const { error } = await supabase
        .from('messages')
        .insert({
          chat_session_id: selectedSession.id,
          sender_id: userInfo.id,
          sender_type: 'agent',
          message_type: 'text',
          content: messageText,
          is_read: true
        });

      if (error) {
        console.error('发送消息失败:', error);
        Alert.alert(t.error, '发送消息失败');
        return;
      }

      // 刷新消息列表
      fetchMessages(selectedSession.id);
      fetchChatSessions();
    } catch (error) {
      console.error('发送消息异常:', error);
      Alert.alert(t.error, '发送消息失败');
    }
  };

  // 格式化时间
  const formatTime = (date: Date) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (messageDate.getTime() === today.getTime()) {
      return t.today + ' ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    } else if (messageDate.getTime() === yesterday.getTime()) {
      return t.yesterday + ' ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
  };

  // 打开图片预览
  const openImagePreview = (imageUrl: string) => {
    setPreviewImage(imageUrl);
    setShowImagePreview(true);
  };

  // 会话列表视图
  const renderSessionList = () => (
    <View style={styles.sessionListContainer}>
      {chatSessions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubbles-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>{t.noSessions}</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {chatSessions.map((session) => (
            <TouchableOpacity
              key={session.id}
              style={styles.sessionItem}
              onPress={() => setSelectedSession(session)}
            >
              <Image source={{ uri: session.customerAvatar }} style={styles.sessionAvatar} />
              <View style={styles.sessionInfo}>
                <View style={styles.sessionHeader}>
                  <Text style={styles.sessionName}>{session.customerName}</Text>
                  <Text style={styles.sessionTime}>
                    {formatTime(session.lastMessageTime)}
                  </Text>
                </View>
                <View style={styles.sessionFooter}>
                  <Text style={styles.sessionLastMessage} numberOfLines={1}>
                    {session.lastMessage}
                  </Text>
                  {session.unreadCount > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadText}>
                        {session.unreadCount > 99 ? '99+' : session.unreadCount}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );

  // 聊天视图
  const renderChatView = () => (
    <KeyboardAvoidingView
      style={styles.chatContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* 聊天头部 */}
      <View style={styles.chatHeader}>
        <TouchableOpacity
          style={styles.backToListButton}
          onPress={() => setSelectedSession(null)}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
          <Text style={styles.backToListText}>{t.back}</Text>
        </TouchableOpacity>
        <View style={styles.chatHeaderInfo}>
          <Image source={{ uri: selectedSession?.customerAvatar }} style={styles.chatHeaderAvatar} />
          <Text style={styles.chatHeaderName}>{selectedSession?.customerName}</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      {/* 消息列表 */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyChatContainer}>
            <Ionicons name="chatbubble-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>{t.noMessages}</Text>
          </View>
        ) : (
          messages.map((message, index) => {
            const showTime = index === 0 ||
              message.timestamp.getTime() - messages[index - 1].timestamp.getTime() > 5 * 60 * 1000;

            return (
              <View key={message.id}>
                {showTime && (
                  <Text style={styles.messageTime}>
                    {formatTime(message.timestamp)}
                  </Text>
                )}
                <View style={[
                  styles.messageRow,
                  message.sender === 'company' ? styles.companyMessageRow : styles.customerMessageRow
                ]}>
                  {message.sender === 'customer' && (
                    <Image
                      source={{ uri: selectedSession?.customerAvatar }}
                      style={styles.messageAvatar}
                    />
                  )}

                  <View style={[
                    styles.messageBubble,
                    message.sender === 'company' ? styles.companyBubble : styles.customerBubble
                  ]}>
                    {message.messageType === 'image' && message.imageUrl ? (
                      <TouchableOpacity onPress={() => openImagePreview(message.imageUrl!)}>
                        <Image source={{ uri: message.imageUrl }} style={styles.messageImage} />
                      </TouchableOpacity>
                    ) : (
                      <Text style={[
                        styles.messageText,
                        message.sender === 'company' ? styles.companyText : styles.customerText
                      ]}>
                        {message.text}
                      </Text>
                    )}
                  </View>

                  {message.sender === 'company' && (
                    <Image
                      source={{ uri: userInfo?.avatar || 'https://picsum.photos/200/200' }}
                      style={styles.messageAvatar}
                    />
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* 输入区域 */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder={t.placeholder}
          placeholderTextColor="#999"
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={handleSendMessage}
          disabled={!inputText.trim()}
        >
          <Ionicons name="send" size={20} color={inputText.trim() ? '#fff' : '#ccc'} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A4EA2" />
      
      {/* 顶部导航栏 */}
      <LinearGradient
        colors={['#1A4EA2', '#0D3A8A']}
        style={[styles.header, { paddingTop: insets.top > 0 ? insets.top : 16 }]}
      >
        {!selectedSession && (
          <>
            <TouchableOpacity style={styles.backButton} onPress={onClose}>
              <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t.title}</Text>
            <View style={styles.placeholder} />
          </>
        )}
      </LinearGradient>

      {/* 内容区域 */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t.loading}</Text>
        </View>
      ) : selectedSession ? (
        renderChatView()
      ) : (
        renderSessionList()
      )}

      {/* 图片预览模态框 */}
      <Modal
        visible={showImagePreview}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowImagePreview(false)}
      >
        <View style={styles.previewContainer}>
          <TouchableWithoutFeedback onPress={() => setShowImagePreview(false)}>
            <View style={styles.previewOverlay} />
          </TouchableWithoutFeedback>
          <View style={styles.previewContent}>
            {previewImage && (
              <Image source={{ uri: previewImage }} style={styles.previewImage} resizeMode="contain" />
            )}
            <TouchableOpacity
              style={styles.closePreviewButton}
              onPress={() => setShowImagePreview(false)}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
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
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#999',
  },
  // 会话列表样式
  sessionListContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sessionAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  sessionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  sessionTime: {
    fontSize: 12,
    color: '#999',
  },
  sessionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionLastMessage: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  unreadBadge: {
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  // 聊天视图样式
  chatContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backToListButton: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 80,
  },
  backToListText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 4,
  },
  chatHeaderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatHeaderAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 8,
  },
  chatHeaderName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  messageTime: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginVertical: 12,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  customerMessageRow: {
    justifyContent: 'flex-start',
  },
  companyMessageRow: {
    justifyContent: 'flex-end',
  },
  messageAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginHorizontal: 8,
  },
  messageBubble: {
    maxWidth: '70%',
    padding: 12,
    borderRadius: 16,
  },
  customerBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
  },
  companyBubble: {
    backgroundColor: '#4a90e2',
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  customerText: {
    color: '#333',
  },
  companyText: {
    color: '#fff',
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#333',
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    backgroundColor: '#4a90e2',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  sendButtonDisabled: {
    backgroundColor: '#e0e0e0',
  },
  // 空状态样式
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyChatContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
  // 图片预览样式
  previewContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  previewOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  previewContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: '90%',
    height: '80%',
  },
  closePreviewButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
